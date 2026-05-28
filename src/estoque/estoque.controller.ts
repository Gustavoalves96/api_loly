import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { EstoqueService } from './estoque.service';
import { CriarProdutoDto } from './dto/criar-produto.dto';
import { MovimentacaoDto } from './dto/movimentacao.dto';

@Controller('estoque')
export class EstoqueController {
  constructor(private readonly estoqueService: EstoqueService) {}

  // GET /estoque/produtos
  @Get('produtos')
  listar() {
    return this.estoqueService.listarProdutos();
  }

  // GET /estoque/alertas
  @Get('alertas')
  alertas() {
    return this.estoqueService.produtosComEstoqueBaixo();
  }

  // GET /estoque/produtos/:id
  @Get('produtos/:id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.estoqueService.buscarProduto(id);
  }

  // POST /estoque/produtos
  @Post('produtos')
  criar(@Body() dto: CriarProdutoDto) {
    return this.estoqueService.criarProduto(dto);
  }

  // PATCH /estoque/produtos/:id
  @Patch('produtos/:id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CriarProdutoDto>,
  ) {
    return this.estoqueService.atualizarProduto(id, dto);
  }

  // DELETE /estoque/produtos/:id
  @Delete('produtos/:id')
  desativar(@Param('id', ParseIntPipe) id: number) {
    return this.estoqueService.desativarProduto(id);
  }

  // POST /estoque/produtos/:id/movimentacao
  @Post('produtos/:id/movimentacao')
  movimentar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MovimentacaoDto,
  ) {
    return this.estoqueService.registrarMovimentacao(id, dto);
  }

  // GET /estoque/produtos/:id/movimentacoes
  @Get('produtos/:id/movimentacoes')
  historico(@Param('id', ParseIntPipe) id: number) {
    return this.estoqueService.listarMovimentacoes(id);
  }
}
