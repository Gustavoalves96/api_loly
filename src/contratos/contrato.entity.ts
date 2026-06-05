import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne,
} from 'typeorm';
import { Cliente } from '../clientes/cliente.entity';

export enum StatusContrato {
  PENDENTE = 'pendente',
  ASSINADO = 'assinado',
  CANCELADO = 'cancelado',
}

@Entity('contratos')
export class Contrato {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Cliente, { nullable: true, onDelete: 'SET NULL' })
  cliente: Cliente;

  @Column({ type: 'date' })
  data: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valor: number;

  @Column({ nullable: true })
  arquivoUrl: string;

  @Column({ nullable: true })
  arquivoChave: string;

  @Column({ type: 'enum', enum: StatusContrato, default: StatusContrato.PENDENTE })
  status: StatusContrato;

  @Column({ nullable: true, type: 'text' })
  observacoes: string;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
