import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Evento } from './evento.entity';
import { Cliente } from '../clientes/cliente.entity';
import { CriarEventoDto } from './dto/criar-evento.dto';
import {
  Lancamento, TipoLancamento, StatusLancamento, CategoriaPagamento,
} from '../financeiro/financeiro.entity';

@Injectable()
export class EventosService {
  constructor(
    @InjectRepository(Evento)
    private eventoRepo: Repository<Evento>,

    @InjectRepository(Cliente)
    private clienteRepo: Repository<Cliente>,

    @InjectRepository(Lancamento)
    private lancamentoRepo: Repository<Lancamento>,
  ) {}

  async listar(mes?: number, ano?: number) {
    if (mes && ano) {
      const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const fim = new Date(ano, mes, 0).toISOString().split('T')[0];
      return this.eventoRepo.find({
        where: { data: Between(inicio, fim) },
        relations: { cliente: true },
        order: { data: 'ASC', horario: 'ASC' },
      });
    }
    return this.eventoRepo.find({
      relations: { cliente: true },
      order: { data: 'ASC', horario: 'ASC' },
    });
  }

  async buscar(id: number) {
    const evento = await this.eventoRepo.findOne({
      where: { id },
      relations: { cliente: true },
    });
    if (!evento) throw new NotFoundException('Evento não encontrado');
    return evento;
  }

  async criar(dto: CriarEventoDto) {
    const { clienteId, ...dados } = dto;
    const cliente = clienteId
      ? await this.clienteRepo.findOne({ where: { id: clienteId } })
      : null;

    const evento = this.eventoRepo.create({ ...dados, cliente });
    const salvo = await this.eventoRepo.save(evento);
    await this.sincronizarLancamentos(salvo, cliente);
    return this.buscar(salvo.id);
  }

  async atualizar(id: number, dto: Partial<CriarEventoDto>) {
    await this.buscar(id);
    const { clienteId, ...dados } = dto;

    if (clienteId !== undefined) {
      const cliente = clienteId
        ? await this.clienteRepo.findOne({ where: { id: clienteId } })
        : null;
      await this.eventoRepo.save({ id, ...dados, cliente });
    } else {
      await this.eventoRepo.update(id, dados as any);
    }

    const atualizado = await this.buscar(id);
    await this.sincronizarLancamentos(atualizado, atualizado.cliente);
    return atualizado;
  }

  async deletar(id: number) {
    await this.buscar(id);
    await this.lancamentoRepo.delete({ evento: { id } });
    await this.eventoRepo.delete(id);
    return { mensagem: 'Evento removido com sucesso' };
  }

  async hoje() {
    const hoje = new Date().toISOString().split('T')[0];
    return this.eventoRepo.find({
      where: { data: hoje },
      relations: { cliente: true },
      order: { horario: 'ASC' },
    });
  }

  async proximos() {
    const hoje = new Date().toISOString().split('T')[0];
    const em30dias = new Date(Date.now() + 30 * 86400000)
      .toISOString().split('T')[0];
    return this.eventoRepo.find({
      where: { data: Between(hoje, em30dias) },
      relations: { cliente: true },
      order: { data: 'ASC' },
    });
  }

  // ─── Sincronização automática de lançamentos ─────────────────────────────
  //
  // Lógica:
  //   parcelas = 1 → à vista: sinal (pago) + pagamento_final (pendente/pago)
  //   parcelas > 1 → sinal (pago se valorPago > 0) + N parcelas mensais
  //
  private async sincronizarLancamentos(evento: Evento, cliente: Cliente | null) {
    const total = Number(evento.valorTotal) || 0;
    const pago = Number(evento.valorPago) || 0;
    const parcelas = Number((evento as any).parcelas) || 1;

    if (total === 0) return;

    // Remove lançamentos existentes do tipo parcela/pagamento_final/sinal
    // para recriar com os valores corretos
    const existentes = await this.lancamentoRepo.find({
      where: { evento: { id: evento.id }, ativo: true },
    });

    // Separa sinal dos demais para não recriar desnecessariamente
    const lancSinal = existentes.find(
      (l) => l.categoria === CategoriaPagamento.SINAL,
    );
    const outrosLanc = existentes.filter(
      (l) => l.categoria !== CategoriaPagamento.SINAL,
    );

    // Remove parcelas/pagamento_final antigos (serão recriados)
    if (outrosLanc.length > 0) {
      await this.lancamentoRepo.delete(outrosLanc.map((l) => l.id));
    }

    const descBase = `${evento.temaFesta ? evento.temaFesta : 'Festa'}${cliente ? ` — ${cliente.nome}` : ''}`;
    const dataEvento = evento.data;

    // ── Sinal (valor já pago) ─────────────────────────────────────────────
    if (pago > 0) {
      const dadosSinal = {
        tipo: TipoLancamento.RECEITA,
        status: StatusLancamento.PAGO,
        categoria: CategoriaPagamento.SINAL,
        descricao: `Sinal — ${descBase}`,
        valor: pago,
        dataVencimento: dataEvento,
        dataPagamento: dataEvento,
        evento,
        cliente,
        ativo: true,
      };
      if (lancSinal) {
        await this.lancamentoRepo.update(lancSinal.id, {
          valor: pago,
          descricao: dadosSinal.descricao,
        });
      } else {
        await this.lancamentoRepo.save(
          this.lancamentoRepo.create(dadosSinal),
        );
      }
    } else if (lancSinal) {
      await this.lancamentoRepo.update(lancSinal.id, { ativo: false });
    }

    const restante = total - pago;
    if (restante <= 0) return;

    // ── Parcelamento ──────────────────────────────────────────────────────
    const dataBase = new Date(dataEvento + 'T12:00:00');

    if (parcelas === 1) {
      // À vista: uma única parcela no vencimento da festa
      await this.lancamentoRepo.save(
        this.lancamentoRepo.create({
          tipo: TipoLancamento.RECEITA,
          status: StatusLancamento.PENDENTE,
          categoria: CategoriaPagamento.PAGAMENTO_FINAL,
          descricao: `Pagamento final — ${descBase}`,
          valor: restante,
          dataVencimento: dataEvento,
          evento,
          cliente,
          ativo: true,
        }),
      );
    } else {
      // Parcelado: cria N parcelas mensais a partir do mês da festa
      const valorParcela = Math.round((restante / parcelas) * 100) / 100;
      const ajuste = Math.round((restante - valorParcela * parcelas) * 100) / 100;

      for (let i = 0; i < parcelas; i++) {
        const dtParcela = new Date(dataBase);
        dtParcela.setMonth(dtParcela.getMonth() + i);
        const vencimento = dtParcela.toISOString().split('T')[0];

        // Última parcela absorve o ajuste de arredondamento
        const valorFinal =
          i === parcelas - 1
            ? Math.round((valorParcela + ajuste) * 100) / 100
            : valorParcela;

        await this.lancamentoRepo.save(
          this.lancamentoRepo.create({
            tipo: TipoLancamento.RECEITA,
            status: StatusLancamento.PENDENTE,
            categoria: CategoriaPagamento.PARCELA,
            descricao: `Parcela ${i + 1}/${parcelas} — ${descBase}`,
            valor: valorFinal,
            dataVencimento: vencimento,
            evento,
            cliente,
            ativo: true,
          }),
        );
      }
    }
  }
}
