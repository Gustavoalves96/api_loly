import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Evento } from './evento.entity';
import { Cliente } from '../clientes/cliente.entity';
import { CriarEventoDto } from './dto/criar-evento.dto';

@Injectable()
export class EventosService {
  constructor(
    @InjectRepository(Evento)
    private eventoRepo: Repository<Evento>,

    @InjectRepository(Cliente)
    private clienteRepo: Repository<Cliente>,
  ) {}

  async listar(mes?: number, ano?: number) {
    if (mes && ano) {
      const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const fim = new Date(ano, mes, 0).toISOString().split('T')[0];
      return this.eventoRepo.find({
        where: { data: Between(inicio, fim) },
        relations: { cliente: true },
        order: { data: 'ASC', horario: 'ASC' },
      });
    }
    return this.eventoRepo.find({
      relations: { cliente: true },
      order: { data: 'ASC', horario: 'ASC' },
    });
  }

  async buscar(id: number) {
    const evento = await this.eventoRepo.findOne({
      where: { id },
      relations: { cliente: true },
    });
    if (!evento) throw new NotFoundException('Evento não encontrado');
    return evento;
  }

  async criar(dto: CriarEventoDto) {
    const { clienteId, ...dados } = dto;

    let cliente = null;
    if (clienteId) {
      cliente = await this.clienteRepo.findOne({ where: { id: clienteId } });
    }

    const evento = this.eventoRepo.create({ ...dados, cliente });
    return this.eventoRepo.save(evento);
  }

  async atualizar(id: number, dto: Partial<CriarEventoDto>) {
    await this.buscar(id);
    const { clienteId, ...dados } = dto;

    if (clienteId) {
      const cliente = await this.clienteRepo.findOne({ where: { id: clienteId } });
      await this.eventoRepo.save({ id, ...dados, cliente });
    } else {
      await this.eventoRepo.update(id, dados as any);
    }

    return this.buscar(id);
  }

  async deletar(id: number) {
    await this.buscar(id);
    await this.eventoRepo.delete(id);
    return { mensagem: 'Evento removido com sucesso' };
  }

  async hoje() {
    const hoje = new Date().toISOString().split('T')[0];
    return this.eventoRepo.find({
      where: { data: hoje },
      relations: { cliente: true },
      order: { horario: 'ASC' },
    });
  }

  async proximos() {
    const hoje = new Date().toISOString().split('T')[0];
    const em30dias = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .split('T')[0];
    return this.eventoRepo.find({
      where: { data: Between(hoje, em30dias) },
      relations: { cliente: true },
      order: { data: 'ASC' },
    });
  }
}
