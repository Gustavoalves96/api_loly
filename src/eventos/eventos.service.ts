import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Evento } from './evento.entity';
import { Cliente } from '../clientes/cliente.entity';
import { CriarEventoDto } from './dto/criar-evento.dto';
import { Lancamento, TipoLancamento, StatusLancamento, CategoriaPagamento } from '../financeiro/financeiro.entity';

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

    let cliente = null;
    if (clienteId) {
      cliente = await this.clienteRepo.findOne({ where: { id: clienteId } });
    }

    const evento = this.eventoRepo.create({ ...dados, cliente });
    const salvo = await this.eventoRepo.save(evento);

    // Sincroniza lançamentos financeiros automaticamente
    await this.sincronizarLancamentos(salvo, cliente);

    return this.buscar(salvo.id);
  }

  async atualizar(id: number, dto: Partial<CriarEventoDto>) {
    await this.buscar(id);
    const { clienteId, ...dados } = dto;

    let cliente = undefined;
    if (clienteId) {
      cliente = await this.clienteRepo.findOne({ where: { id: clienteId } });
      await this.eventoRepo.save({ id, ...dados, cliente });
    } else {
      await this.eventoRepo.update(id, dados as any);
    }

    const atualizado = await this.buscar(id);

    // Sincroniza lançamentos financeiros automaticamente
    await this.sincronizarLancamentos(atualizado, atualizado.cliente);

    return atualizado;
  }

  async deletar(id: number) {
    await this.buscar(id);
    // Remove lançamentos vinculados ao evento
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
      .toISOString()
      .split('T')[0];
    return this.eventoRepo.find({
      where: { data: Between(hoje, em30dias) },
      relations: { cliente: true },
      order: { data: 'ASC' },
    });
  }

  // ─── Sincronização automática de lançamentos ─────────────────────────────
  //
  // Regra:
  //   valorPago > 0  → cria/atualiza lançamento de SINAL (pago)
  //   valorTotal - valorPago > 0 → cria/atualiza lançamento de PAGAMENTO FINAL (pendente)
  //   valorPago === valorTotal   → marca pagamento final como pago
  //
  private async sincronizarLancamentos(evento: Evento, cliente: Cliente | null) {
    const total = Number(evento.valorTotal) || 0;
    const pago = Number(evento.valorPago) || 0;
    const restante = total - pago;

    if (total === 0) return; // Sem valor definido, nada a sincronizar

    // Busca lançamentos existentes deste evento
    const existentes = await this.lancamentoRepo.find({
      where: { evento: { id: evento.id }, ativo: true },
    });

    const lancamentoSinal = existentes.find(
      (l) => l.categoria === CategoriaPagamento.SINAL,
    );
    const lancamentoFinal = existentes.find(
      (l) => l.categoria === CategoriaPagamento.PAGAMENTO_FINAL,
    );

    // ── Lançamento de SINAL (valor já pago) ──────────────────────────────
    if (pago > 0) {
      const dadosSinal = {
        tipo: TipoLancamento.RECEITA,
        status: StatusLancamento.PAGO,
        categoria: CategoriaPagamento.SINAL,
        descricao: `Sinal${evento.temaFesta ? ` — ${evento.temaFesta}` : ''}${cliente ? ` (${cliente.nome})` : ''}`,
        valor: pago,
        dataVencimento: evento.data,
        dataPagamento: evento.data,
        evento,
        cliente,
        ativo: true,
      };

      if (lancamentoSinal) {
        await this.lancamentoRepo.update(lancamentoSinal.id, {
          valor: pago,
          descricao: dadosSinal.descricao,
          dataPagamento: evento.data,
        });
      } else {
        await this.lancamentoRepo.save(
          this.lancamentoRepo.create(dadosSinal),
        );
      }
    } else if (lancamentoSinal) {
      // Zeraram o valor pago — desativa o lançamento de sinal
      await this.lancamentoRepo.update(lancamentoSinal.id, { ativo: false });
    }

    // ── Lançamento de PAGAMENTO FINAL (valor restante) ───────────────────
    if (restante > 0) {
      const statusFinal =
        restante <= 0 ? StatusLancamento.PAGO : StatusLancamento.PENDENTE;

      const dadosFinal = {
        tipo: TipoLancamento.RECEITA,
        status: statusFinal,
        categoria: CategoriaPagamento.PAGAMENTO_FINAL,
        descricao: `Restante${evento.temaFesta ? ` — ${evento.temaFesta}` : ''}${cliente ? ` (${cliente.nome})` : ''}`,
        valor: restante,
        dataVencimento: evento.data,
        dataPagamento: statusFinal === StatusLancamento.PAGO ? evento.data : null,
        evento,
        cliente,
        ativo: true,
      };

      if (lancamentoFinal) {
        await this.lancamentoRepo.update(lancamentoFinal.id, {
          valor: restante,
          status: statusFinal,
          descricao: dadosFinal.descricao,
          dataPagamento: dadosFinal.dataPagamento,
        });
      } else {
        await this.lancamentoRepo.save(
          this.lancamentoRepo.create(dadosFinal),
        );
      }
    } else if (lancamentoFinal) {
      // Restante zerou (pagamento completo) — marca como pago
      await this.lancamentoRepo.update(lancamentoFinal.id, {
        status: StatusLancamento.PAGO,
        dataPagamento: evento.data,
        valor: 0,
        ativo: restante === 0 ? false : true,
      });
    }
  }
}
