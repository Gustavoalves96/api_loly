import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { Contrato } from './contrato.entity';
import { Cliente } from '../clientes/cliente.entity';
import { CriarContratoDto } from './dto/criar-contrato.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ContratosService {
  private supabase;

  constructor(
    @InjectRepository(Contrato)
    private contratoRepo: Repository<Contrato>,
    @InjectRepository(Cliente)
    private clienteRepo: Repository<Cliente>,
    private configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_SECRET_KEY'),
    );
  }

  async listar() {
    return this.contratoRepo.find({
      where: { ativo: true },
      relations: { cliente: true },
      order: { criadoEm: 'DESC' },
    });
  }

  async buscar(id: number) {
    const contrato = await this.contratoRepo.findOne({
      where: { id },
      relations: { cliente: true },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado');
    return contrato;
  }

  async criar(dto: CriarContratoDto) {
    const { clienteId, ...dados } = dto;
    let cliente = null;
    if (clienteId) {
      cliente = await this.clienteRepo.findOne({ where: { id: clienteId } });
    }
    const contrato = this.contratoRepo.create({ ...dados, cliente });
    return this.contratoRepo.save(contrato);
  }

  async atualizar(id: number, dto: Partial<CriarContratoDto>) {
    await this.buscar(id);
    const { clienteId, ...dados } = dto;
    if (clienteId) {
      const cliente = await this.clienteRepo.findOne({ where: { id: clienteId } });
      await this.contratoRepo.save({ id, ...dados, cliente });
    } else {
      await this.contratoRepo.update(id, dados as any);
    }
    return this.buscar(id);
  }

  async uploadPdf(id: number, file: Express.Multer.File) {
    const contrato = await this.buscar(id);

    // Deleta o arquivo antigo se existir
    if (contrato.arquivoChave) {
      await this.supabase.storage
        .from('contratos')
        .remove([contrato.arquivoChave]);
    }

    const chave = `${uuidv4()}.pdf`;

    const { error } = await this.supabase.storage
      .from('contratos')
      .upload(chave, file.buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) throw new Error(`Erro ao fazer upload: ${error.message}`);

    const { data } = this.supabase.storage
      .from('contratos')
      .getPublicUrl(chave);

    await this.contratoRepo.update(id, {
      arquivoUrl: data.publicUrl,
      arquivoChave: chave,
    });

    return this.buscar(id);
  }

  async deletar(id: number) {
    const contrato = await this.buscar(id);
    if (contrato.arquivoChave) {
      await this.supabase.storage
        .from('contratos')
        .remove([contrato.arquivoChave]);
    }
    await this.contratoRepo.update(id, { ativo: false });
    return { mensagem: 'Contrato removido com sucesso' };
  }
}
