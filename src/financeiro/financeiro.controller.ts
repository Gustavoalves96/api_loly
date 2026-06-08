import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { CriarLancamentoDto } from './dto/criar-lancamento.dto';

@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly financeiroService: FinanceiroService) {}

  // GET /financeiro/resumo-geral
  // Usado pelos KPIs da tela inicial
  @Get('resumo-geral')
  resumoGeral() {
    return this.financeiroService.resumoGeral();
  }

  // GET /financeiro/resumo?mes=6&ano=2026
  @Get('resumo')
  resumoMes(
    @Query('mes') mes: string,
    @Query('ano') ano: string,
  ) {
    const hoje = new Date();
    return this.financeiroService.resumoMes(
      mes ? +mes : hoje.getMonth() + 1,
      ano ? +ano : hoje.getFullYear(),
    );
  }

  // GET /financeiro/pendencias
  @Get('pendencias')
  pendencias() {
    return this.financeiroService.pendencias();
  }

  // GET /financeiro/lancamentos?mes=6&ano=2026
  @Get('lancamentos')
  listar(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    return this.financeiroService.listar(
      mes ? +mes : undefined,
      ano ? +ano : undefined,
    );
  }

  // GET /financeiro/lancamentos/:id
  @Get('lancamentos/:id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.financeiroService.buscar(id);
  }

  // POST /financeiro/lancamentos
  @Post('lancamentos')
  criar(@Body() dto: CriarLancamentoDto) {
    return this.financeiroService.criar(dto);
  }

  // PATCH /financeiro/lancamentos/:id
  @Patch('lancamentos/:id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CriarLancamentoDto>,
  ) {
    return this.financeiroService.atualizar(id, dto);
  }

  // DELETE /financeiro/lancamentos/:id
  @Delete('lancamentos/:id')
  deletar(@Param('id', ParseIntPipe) id: number) {
    return this.financeiroService.deletar(id);
  }
}
