import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Produto } from './produto.entity';

export enum TipoMovimentacao {
  ENTRADA = 'entrada',
  SAIDA = 'saida',
}

@Entity('movimentacoes_estoque')
export class MovimentacaoEstoque {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Produto, (produto: Produto) => produto.movimentacoes, {
    onDelete: 'CASCADE',
  })
  produto!: Produto;

  @Column({
    type: 'enum',
    enum: TipoMovimentacao,
  })
  tipo!: TipoMovimentacao;

  @Column()
  quantidade!: number;

  @Column({ nullable: true })
  motivo?: string; // ex: "compra", "usado no evento #12", "descarte"

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  precoUnitario?: number; // preço pago nessa movimentação (útil para entradas)

  @CreateDateColumn()
  criadoEm!: Date;
}
