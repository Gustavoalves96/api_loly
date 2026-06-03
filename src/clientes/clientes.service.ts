import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Cliente } from './cliente.entity';
import { CriarClienteDto } from './dto/criar-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepo: Repository<Cliente>,
  ) {}

  async listar(busca?: string) {
    if (busca) {
      return this.clienteRepo.find({
        where: [
          { nome: Like(`%${busca}%`), ativo: true },
          { telefone: Like(`%${busca}%`), ativo: true },
        ],
        order: { nome: 'ASC' },
      });
    }
    return this.clienteRepo.find({
      where: { ativo: true },
      order: { nome: 'ASC' },
    });
  }

  async buscar(id: number) {
    const cliente = await this.clienteRepo.findOne({ where: { id } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  async criar(dto: CriarClienteDto) {
    const cliente = this.clienteRepo.create(dto);
    return this.clienteRepo.save(cliente);
  }

  async atualizar(id: number, dto: Partial<CriarClienteDto>) {
    await this.buscar(id);
    await this.clienteRepo.update(id, dto);
    return this.buscar(id);
  }

  async desativar(id: number) {
    await this.buscar(id);
    await this.clienteRepo.update(id, { ativo: false });
    return { mensagem: 'Cliente removido com sucesso' };
  }
}
