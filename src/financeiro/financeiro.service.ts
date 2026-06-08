import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Lancamento, StatusLancamento, TipoLancamento } from './financeiro.entity';
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

    let evento = null;
    if (eventoId) {
      evento = await this.eventoRepo.findOne({ where: { id: eventoId } });
    }

    let cliente = null;
    if (clienteId) {
      cliente = await this.clienteRepo.findOne({ where: { id: clienteId } });
    }

    // Se o lançamento for criado já como PAGO, preenchemos dataPagamento
    if (dados.status === StatusLancamento.PAGO && !dados.dataPagamento) {
      dados.dataPagamento = new Date().toISOString().split('T')[0];
    }

    const lancamento = this.lancamentoRepo.create({ ...dados, evento, cliente });
    return this.lancamentoRepo.save(lancamento);
  }

  async atualizar(id: number, dto: Partial<CriarLancamentoDto>) {
    await this.buscar(id);
    const { eventoId, clienteId, ...dados } = dto;

    // Se estiver marcando como PAGO agora, registra data
    if (dados.status === StatusLancamento.PAGO && !dados.dataPagamento) {
      dados.dataPagamento = new Date().toISOString().split('T')[0];
    }

    if (eventoId || clienteId) {
      const evento = eventoId
        ? await this.eventoRepo.findOne({ where: { id: eventoId } })
        : undefined;
      const cliente = clienteId
        ? await this.clienteRepo.findOne({ where: { id: clienteId } })
        : undefined;
      await this.lancamentoRepo.save({
        id,
        ...dados,
        ...(evento !== undefined && { evento }),
        ...(cliente !== undefined && { cliente }),
      });
    } else {
      await this.lancamentoRepo.update(id, dados as any);
    }

    return this.buscar(id);
  }

  async deletar(id: number) {
    await this.buscar(id);
    await this.lancamentoRepo.update(id, { ativo: false });
    return { mensagem: 'Lançamento removido com sucesso' };
  }

  // ─── Resumo do mês (para KPIs da tela inicial e módulo financeiro) ───────

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
      .filter(
        (l) =>
          l.tipo === TipoLancamento.RECEITA &&
          l.status === StatusLancamento.PAGO,
      )
      .reduce((acc, l) => acc + Number(l.valor), 0);

    const receitasPendentes = lancamentos
      .filter(
        (l) =>
          l.tipo === TipoLancamento.RECEITA &&
          l.status === StatusLancamento.PENDENTE,
      )
      .reduce((acc, l) => acc + Number(l.valor), 0);

    const taxaAdimplencia =
      totalReceitas > 0
        ? Math.round((receitasPagas / totalReceitas) * 100)
        : 100;

    // Festas do mês (eventos não cancelados)
    const festasDoMes = await this.eventoRepo.count({
      where: {
        data: Between(inicio, fim),
        status: StatusEvento.CONFIRMADO,
      },
    });

    return {
      mes,
      ano,
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      receitasPagas,
      receitasPendentes,
      taxaAdimplencia,
      festasDoMes,
    };
  }

  // ─── Pendências (lançamentos PENDENTES com vencimento passado) ───────────

  async pendencias() {
    const hoje = new Date().toISOString().split('T')[0];

    // Lançamentos com vencimento passado e ainda pendentes
    const lancamentosAtrasados = await this.lancamentoRepo.find({
      where: {
        ativo: true,
        status: StatusLancamento.PENDENTE,
        dataVencimento: LessThan(hoje),
      },
      relations: { evento: true, cliente: true },
      order: { dataVencimento: 'ASC' },
    });

    // Eventos com saldo devedor (valorPago < valorTotal) e data já passada
    const eventosComDebt = await this.eventoRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.cliente', 'c')
      .where('e.data < :hoje', { hoje })
      .andWhere('e.status != :cancelado', { cancelado: StatusEvento.CANCELADO })
      .andWhere('e.valorTotal > e.valorPago')
      .orderBy('e.data', 'ASC')
      .getMany();

    return {
      lancamentosAtrasados,
      eventosComDebt,
      totalPendenteEmLancamentos: lancamentosAtrasados.reduce(
        (acc, l) => acc + Number(l.valor),
        0,
      ),
      totalDebtEmEventos: eventosComDebt.reduce(
        (acc, e) => acc + (Number(e.valorTotal) - Number(e.valorPago)),
        0,
      ),
    };
  }

  // ─── Resumo geral (para dashboard / tela inicial) ────────────────────────

  async resumoGeral() {
    const hoje = new Date();
    const mes = hoje.getMonth() + 1;
    const ano = hoje.getFullYear();

    const resumo = await this.resumoMes(mes, ano);
    const pend = await this.pendencias();

    return {
      ...resumo,
      totalPendencias:
        pend.totalPendenteEmLancamentos + pend.totalDebtEmEventos,
      qtdPendencias:
        pend.lancamentosAtrasados.length + pend.eventosComDebt.length,
    };
  }
}
