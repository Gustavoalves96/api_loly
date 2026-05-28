import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MovimentacaoEstoque } from './movimentacao.entity';

export enum CategoriaProduto {
  SALGADO = 'salgado',
  DOCE = 'doce',
  BEBIDA = 'bebida',
  DECORACAO = 'decoracao',
  DESCARTAVEL = 'descartavel',
  OUTRO = 'outro',
}

@Entity('produtos')
export class Produto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nome!: string;

  @Column({
    type: 'enum',
    enum: CategoriaProduto,
    default: CategoriaProduto.OUTRO,
  })
  categoria!: CategoriaProduto;

  @Column({ nullable: true })
  descricao?: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  precoCusto!: number;

  @Column({ default: 'unidade' })
  unidadeMedida!: string; // unidade, kg, litro, pacote...

  @Column({ default: 0 })
  quantidadeAtual!: number;

  @Column({ default: 10 })
  estoqueMinimo!: number; // alerta quando cair abaixo desse valor

  @Column({ default: true })
  ativo!: boolean;

  @OneToMany(
    () => MovimentacaoEstoque,
    (mov: MovimentacaoEstoque) => mov.produto,
  )
  movimentacoes!: MovimentacaoEstoque[];

  @CreateDateColumn()
  criadoEm!: Date;

  @UpdateDateColumn()
  atualizadoEm!: Date;
}
