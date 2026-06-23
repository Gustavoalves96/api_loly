import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Um item do buffet — adicionado manualmente (nome + quantidade livre,
// ex.: "100", "2kg", "à vontade"). A quantidade é opcional.
export interface BuffetItem {
  nome: string;
  quantidade?: string;
}

@Entity('buffets')
export class Buffet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ nullable: true })
  descricao: string;

  // Preço definido manualmente para o pacote.
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  preco: number;

  // Itens padrão do buffet. Servem de modelo: ao escolher o buffet numa reserva,
  // estes itens são copiados para o evento e podem ser ajustados por festa.
  @Column({ type: 'jsonb', nullable: true })
  itens: BuffetItem[];

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
