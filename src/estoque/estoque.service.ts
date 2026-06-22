import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produto } from './produto.entity';
import { MovimentacaoEstoque, TipoMovimentacao } from './movimentacao.entity';
import { CriarProdutoDto } from './dto/criar-produto.dto';
import { MovimentacaoDto } from './dto/movimentacao.dto';

@Injectable()
export class EstoqueService {
  constructor(
    @InjectRepository(Produto)
    private produtoRepo: Repository<Produto>,

    @InjectRepository(MovimentacaoEstoque)
    private movimentacaoRepo: Repository<MovimentacaoEstoque>,
  ) {}

  // --- PRODUTOS ---

  async listarProdutos(page?: number, limit?: number) {
    if (page && limit) {
      const [data, total] = await this.produtoRepo.findAndCount({
        where: { ativo: true },
        order: { nome: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return { data, total, page, limit };
    }

    return this.produtoRepo.find({
      where: { ativo: true },
      order: { nome: 'ASC' },
    });
  }

  async buscarProduto(id: number) {
    const produto = await this.produtoRepo.findOne({ where: { id } });
    if (!produto) throw new NotFoundException('Produto não encontrado');
    return produto;
  }

  async criarProduto(dto: CriarProdutoDto) {
    const produto = this.produtoRepo.create({
      ...dto,
      quantidadeAtual: dto.quantidadeInicial ?? 0,
    });
    return this.produtoRepo.save(produto);
  }

  async atualizarProduto(id: number, dto: Partial<CriarProdutoDto>) {
    await this.buscarProduto(id);
    await this.produtoRepo.update(id, dto);
    return this.buscarProduto(id);
  }

  async desativarProduto(id: number) {
    await this.buscarProduto(id);
    await this.produtoRepo.update(id, { ativo: false });
    return { mensagem: 'Produto desativado com sucesso' };
  }

  // --- MOVIMENTAÇÕES ---

  async registrarMovimentacao(produtoId: number, dto: MovimentacaoDto) {
    const produto = await this.buscarProduto(produtoId);

    if (dto.tipo === TipoMovimentacao.SAIDA) {
      if (produto.quantidadeAtual < dto.quantidade) {
        throw new BadRequestException('Quantidade insuficiente em estoque');
      }
      produto.quantidadeAtual -= dto.quantidade;
    } else {
      produto.quantidadeAtual += dto.quantidade;
    }

    await this.produtoRepo.save(produto);

    const movimentacao = this.movimentacaoRepo.create({
      produto,
      ...dto,
    });
    return this.movimentacaoRepo.save(movimentacao);
  }

  async listarMovimentacoes(produtoId: number) {
    return this.movimentacaoRepo.find({
      where: { produto: { id: produtoId } },
      order: { criadoEm: 'DESC' },
    });
  }

  // --- ALERTAS ---

  async produtosComEstoqueBaixo() {
    return this.produtoRepo
      .createQueryBuilder('p')
      .where('p.ativo = true')
      .andWhere('p.quantidadeAtual <= p.estoqueMinimo')
      .getMany();
  }
}
