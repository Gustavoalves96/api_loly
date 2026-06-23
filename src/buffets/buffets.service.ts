import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Buffet } from './buffet.entity';
import { CriarBuffetDto } from './dto/criar-buffet.dto';

@Injectable()
export class BuffetsService implements OnModuleInit {
  constructor(
    @InjectRepository(Buffet)
    private readonly repo: Repository<Buffet>,
  ) {}

  // Garante que existam os dois buffets padrão na primeira execução,
  // já que a operação trabalha com "Buffet 1" e "Buffet 2".
  async onModuleInit() {
    const total = await this.repo.count();
    if (total === 0) {
      await this.repo.save([
        this.repo.create({ nome: 'Buffet 1', preco: 0, itens: [], ativo: true }),
        this.repo.create({ nome: 'Buffet 2', preco: 0, itens: [], ativo: true }),
      ]);
    }
  }

  listar() {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async buscar(id: number) {
    const buffet = await this.repo.findOne({ where: { id } });
    if (!buffet) throw new NotFoundException('Buffet não encontrado');
    return buffet;
  }

  criar(dto: CriarBuffetDto) {
    return this.repo.save(this.repo.create({ ...dto, itens: dto.itens ?? [] }));
  }

  async atualizar(id: number, dto: Partial<CriarBuffetDto>) {
    await this.buscar(id);
    await this.repo.update(id, dto as Partial<Buffet>);
    return this.buscar(id);
  }

  async deletar(id: number) {
    await this.buscar(id);
    await this.repo.delete(id);
    return { mensagem: 'Buffet removido com sucesso' };
  }
}
