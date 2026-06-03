import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Cliente } from '../clientes/cliente.entity';

export enum StatusEvento {
  PENDENTE = 'pendente',
  CONFIRMADO = 'confirmado',
  REALIZADO = 'realizado',
  CANCELADO = 'cancelado',
}

@Entity('eventos')
export class Evento {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Cliente, { nullable: true, onDelete: 'SET NULL' })
  cliente: Cliente;

  @Column({ type: 'date' })
  data: string;

  @Column({ type: 'time' })
  horario: string;

  @Column({ nullable: true })
  temaFesta: string;

  @Column({ default: 0 })
  numeroCriancas: number;

  @Column({ nullable: true })
  buffet: string;

  @Column({
    type: 'enum',
    enum: StatusEvento,
    default: StatusEvento.PENDENTE,
  })
  status: StatusEvento;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valorTotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valorPago: number;

  @Column({ nullable: true, type: 'text' })
  observacoes: string;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
