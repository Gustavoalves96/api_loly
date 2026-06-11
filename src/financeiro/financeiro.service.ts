import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { Lancamento, StatusLancamento, TipoLancamento, CategoriaPagamento } from './financeiro.entity';
import { Evento, StatusEvento } from '../eventos/evento.entity';
import { Cliente } from '../clientes/cliente.entity';
import { CriarLancamentoDto } from './dto/criar-lancamento.dto';

@Injectable()
export class FinanceiroService {
  constructor(
    @InjectRepository(Lancamento)
    private lancamentoRepo: Repository<Lancamento>,

    @InjectRepository(Evento)
    private eventoRepo: Repository<Evento>,

    @InjectRepository(Cliente)
    private clienteRepo: Repository<Cliente>,
  ) {}

  // ─── CRUD Lançamentos ────────────────────────────────────────────────────

  async listar(mes?: number, ano?: number) {
    if (mes && ano) {
      const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const fim = new Date(ano, mes, 0).toISOString().split('T')[0];
      return this.lancamentoRepo.find({
        where: { ativo: true, dataVencimento: Between(inicio, fim) },
        relations: { evento: true, cliente: true },
        order: { dataVencimento: 'ASC' },
      });
    }
    return this.lancamentoRepo.find({
      where: { ativo: true },
      relations: { evento: true, cliente: true },
      order: { dataVencimento: 'ASC' },
    });
  }

  async buscar(id: number) {
    const lancamento = await this.lancamentoRepo.findOne({
      where: { id },
      relations: { evento: true, cliente: true },
    });
    if (!lancamento) throw new NotFoundException('Lançamento não encontrado');
    return lancamento;
  }

  async criar(dto: CriarLancamentoDto) {
    const { eventoId, clienteId, ...dados } = dto;

    const evento = eventoId
      ? await this.eventoRepo.findOne({ where: { id: eventoId } })
      : null;
    const cliente = clienteId
      ? await this.clienteRepo.findOne({ where: { id: clienteId } })
      : null;

    if (dados.status === StatusLancamento.PAGO && !dados.dataPagamento) {
      dados.dataPagamento = new Date().toISOString().split('T')[0];
    }

    const lancamento = this.lancamentoRepo.create({ ...dados, evento, cliente });
    return this.lancamentoRepo.save(lancamento);
  }

  async atualizar(id: number, dto: Partial<CriarLancamentoDto>) {
    const lancamentoAtual = await this.buscar(id);
    const { eventoId, clienteId, ...dados } = dto;

    if (dados.status === StatusLancamento.PAGO && !dados.dataPagamento) {
      dados.dataPagamento = new Date().toISOString().split('T')[0];
    }

    const extras: any = {};
    if (eventoId !== undefined) {
      extras.evento = eventoId
        ? await this.eventoRepo.findOne({ where: { id: eventoId } })
        : null;
    }
    if (clienteId !== undefined) {
      extras.cliente = clienteId
        ? await this.clienteRepo.findOne({ where: { id: clienteId } })
        : null;
    }

    await this.lancamentoRepo.save({ id, ...dados, ...extras });

    // Se marcou como pago e tem evento vinculado, atualiza valorPago do evento
    if (dados.status === StatusLancamento.PAGO && lancamentoAtual.evento) {
      await this.recalcularValorPagoEvento(lancamentoAtual.evento.id);
    }

    return this.buscar(id);
  }

  // Soma todos os lançamentos PAGOS do evento e atualiza valorPago
  private async recalcularValorPagoEvento(eventoId: number) {
    const lancamentosPagos = await this.lancamentoRepo.find({
      where: {
        evento: { id: eventoId },
        tipo: TipoLancamento.RECEITA,
        status: StatusLancamento.PAGO,
        ativo: true,
      },
    });

    const totalPago = lancamentosPagos.reduce(
      (acc, l) => acc + Number(l.valor), 0,
    );

    await this.eventoRepo.update(eventoId, { valorPago: totalPago });
  }

  async deletar(id: number) {
    await this.buscar(id);
    await this.lancamentoRepo.update(id, { ativo: false });
    return { mensagem: 'Lançamento removido com sucesso' };
  }

  // ─── Resumo do mês ────────────────────────────────────────────────────────

  async resumoMes(mes: number, ano: number) {
    const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const fim = new Date(ano, mes, 0).toISOString().split('T')[0];

    const lancamentos = await this.lancamentoRepo.find({
      where: { ativo: true, dataVencimento: Between(inicio, fim) },
    });

    const totalReceitas = lancamentos
      .filter((l) => l.tipo === TipoLancamento.RECEITA)
      .reduce((acc, l) => acc + Number(l.valor), 0);

    const totalDespesas = lancamentos
      .filter((l) => l.tipo === TipoLancamento.DESPESA)
      .reduce((acc, l) => acc + Number(l.valor), 0);

    const receitasPagas = lancamentos
      .filter((l) => l.tipo === TipoLancamento.RECEITA && l.status === StatusLancamento.PAGO)
      .reduce((acc, l) => acc + Number(l.valor), 0);

    const receitasPendentes = lancamentos
      .filter((l) => l.tipo === TipoLancamento.RECEITA && l.status === StatusLancamento.PENDENTE)
      .reduce((acc, l) => acc + Number(l.valor), 0);

    const taxaAdimplencia =
      totalReceitas > 0 ? Math.round((receitasPagas / totalReceitas) * 100) : 100;

    const festasDoMes = await this.eventoRepo.count({
      where: { data: Between(inicio, fim), status: StatusEvento.CONFIRMADO },
    });

    return {
      mes, ano, totalReceitas, totalDespesas,
      saldo: totalReceitas - totalDespesas,
      receitasPagas, receitasPendentes, taxaAdimplencia, festasDoMes,
    };
  }

  // ─── Pendências ───────────────────────────────────────────────────────────
  // Inclui: lançamentos atrasados + eventos com saldo em aberto (passados E futuros)

  async pendencias() {
    const hoje = new Date().toISOString().split('T')[0];

    const lancamentosAtrasados = await this.lancamentoRepo.find({
      where: {
        ativo: true,
        status: StatusLancamento.PENDENTE,
        dataVencimento: LessThanOrEqual(hoje),
      },
      relations: { evento: true, cliente: true },
      order: { dataVencimento: 'ASC' },
    });

    // Todos os eventos não cancelados com saldo em aberto (independente da data)
    const eventosComDebt = await this.eventoRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.cliente', 'c')
      .where('e.status != :cancelado', { cancelado: StatusEvento.CANCELADO })
      .andWhere('e.valorTotal > e.valorPago')
      .andWhere('e.valorTotal > 0')
      .orderBy('e.data', 'ASC')
      .getMany();

    // Parcelas futuras pendentes (para mostrar no widget)
    const parcelasFuturas = await this.lancamentoRepo.find({
      where: {
        ativo: true,
        status: StatusLancamento.PENDENTE,
        categoria: CategoriaPagamento.PARCELA,
      },
      relations: { evento: true, cliente: true },
      order: { dataVencimento: 'ASC' },
      take: 10,
    });

    return {
      lancamentosAtrasados,
      eventosComDebt,
      parcelasFuturas,
      totalPendenteEmLancamentos: lancamentosAtrasados.reduce(
        (acc, l) => acc + Number(l.valor), 0,
      ),
      totalDebtEmEventos: eventosComDebt.reduce(
        (acc, e) => acc + (Number(e.valorTotal) - Number(e.valorPago)), 0,
      ),
    };
  }

  // ─── Resumo geral (dashboard) ─────────────────────────────────────────────

  async resumoGeral() {
    const hoje = new Date();
    const mes = hoje.getMonth() + 1;
    const ano = hoje.getFullYear();

    const resumo = await this.resumoMes(mes, ano);

    // Usa apenas lançamentos pendentes como fonte da verdade
    // para evitar dupla contagem com os deltas de eventos
    const lancamentosPendentes = await this.lancamentoRepo.find({
      where: {
        ativo: true,
        status: StatusLancamento.PENDENTE,
        tipo: TipoLancamento.RECEITA,
      },
    });

    const totalPendencias = lancamentosPendentes.reduce(
      (acc, l) => acc + Number(l.valor), 0,
    );
    const qtdPendencias = lancamentosPendentes.length;

    return { ...resumo, totalPendencias, qtdPendencias };
  }

  // ─── Atividade recente ────────────────────────────────────────────────────

  async atividadeRecente() {
    // Últimos lançamentos criados/atualizados
    const lancamentos = await this.lancamentoRepo.find({
      where: { ativo: true },
      relations: { cliente: true, evento: true },
      order: { atualizadoEm: 'DESC' },
      take: 5,
    });

    // Últimos eventos criados
    const eventos = await this.eventoRepo.find({
      relations: { cliente: true },
      order: { criadoEm: 'DESC' },
      take: 5,
    });

    // Últimos clientes cadastrados
    const clientes = await this.clienteRepo.find({
      order: { criadoEm: 'DESC' },
      take: 3,
    });

    const atividades = [
      ...lancamentos.map((l) => ({
        icon: l.tipo === TipoLancamento.RECEITA ? '💵' : '📤',
        iconClass:
          l.tipo === TipoLancamento.RECEITA
            ? 'bg-[#D7FBF3] text-[#0B7A5E]'
            : 'bg-[#FFE8F1] text-[#C9365A]',
        description:
          l.status === StatusLancamento.PAGO
            ? `Pagamento recebido${l.cliente ? ` de ${l.cliente.nome}` : ''} — R$ ${Number(l.valor).toFixed(2).replace('.', ',')}`
            : `Lançamento${l.cliente ? ` para ${l.cliente.nome}` : ''} — R$ ${Number(l.valor).toFixed(2).replace('.', ',')}`,
        time: new Date(l.atualizadoEm).toLocaleDateString('pt-BR', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        }),
        ts: new Date(l.atualizadoEm).getTime(),
      })),
      ...eventos.map((e) => ({
        icon: '🎉',
        iconClass: 'bg-[#EEE4FF] text-[#6B35C1]',
        description: `Reserva${e.temaFesta ? ` ${e.temaFesta}` : ''} em ${new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR')}${e.cliente ? ` — ${e.cliente.nome}` : ''}`,
        time: new Date(e.criadoEm).toLocaleDateString('pt-BR', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        }),
        ts: new Date(e.criadoEm).getTime(),
      })),
      ...clientes.map((c) => ({
        icon: '👪',
        iconClass: 'bg-[#FFF5D6] text-[#A07800]',
        description: `Novo cliente cadastrado — ${c.nome}`,
        time: new Date(c.criadoEm).toLocaleDateString('pt-BR', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        }),
        ts: new Date(c.criadoEm).getTime(),
      })),
    ]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 8)
      .map(({ ts, ...rest }) => rest);

    return atividades;
  }
}
