import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Evento } from '../eventos/evento.entity';
import { Cliente } from '../clientes/cliente.entity';

export enum TipoLancamento {
  RECEITA = 'receita',
  DESPESA = 'despesa',
}

export enum StatusLancamento {
  PENDENTE = 'pendente',
  PAGO = 'pago',
  CANCELADO = 'cancelado',
}

export enum CategoriaPagamento {
  SINAL = 'sinal',
  PARCELA = 'parcela',
  PAGAMENTO_FINAL = 'pagamento_final',
  DESPESA_OPERACIONAL = 'despesa_operacional',
  OUTRO = 'outro',
}

@Entity('lancamentos')
export class Lancamento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: TipoLancamento })
  tipo: TipoLancamento;

  @Column({ type: 'enum', enum: StatusLancamento, default: StatusLancamento.PENDENTE })
  status: StatusLancamento;

  @Column({ type: 'enum', enum: CategoriaPagamento, default: CategoriaPagamento.OUTRO })
  categoria: CategoriaPagamento;

  @Column({ nullable: true })
  descricao: string;

  @Column('decimal', { precision: 10, scale: 2 })
  valor: number;

  @Column({ type: 'date' })
  dataVencimento: string;

  @Column({ type: 'date', nullable: true })
  dataPagamento: string;

  // Lançamento pode estar vinculado a um evento (receitas de festas)
  @ManyToOne(() => Evento, { nullable: true, onDelete: 'SET NULL' })
  evento: Evento;

  // Lançamento pode estar vinculado a um cliente diretamente
  @ManyToOne(() => Cliente, { nullable: true, onDelete: 'SET NULL' })
  cliente: Cliente;

  @Column({ nullable: true, type: 'text' })
  observacoes: string;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
