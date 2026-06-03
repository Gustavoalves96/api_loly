import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column()
  telefone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  cpfCnpj: string;

  @Column({ nullable: true })
  endereco: string;

  @Column({ nullable: true })
  cidade: string;

  @Column({ nullable: true })
  nomeFilho: string;

  @Column({ nullable: true, type: 'date' })
  dataNascimentoFilho: string;

  @Column({ nullable: true, type: 'text' })
  observacoes: string;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
