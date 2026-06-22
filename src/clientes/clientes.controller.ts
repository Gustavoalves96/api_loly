import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, Query,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CriarClienteDto } from './dto/criar-cliente.dto';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  // GET /clientes?busca=João&page=1&limit=20
  @Get()
  listar(
    @Query('busca') busca?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.clientesService.listar(
      busca,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  // GET /clientes/:id
  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.buscar(id);
  }

  // POST /clientes
  @Post()
  criar(@Body() dto: CriarClienteDto) {
    return this.clientesService.criar(dto);
  }

  // PATCH /clientes/:id
  @Patch(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CriarClienteDto>,
  ) {
    return this.clientesService.atualizar(id, dto);
  }

  // DELETE /clientes/:id
  @Delete(':id')
  desativar(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.desativar(id);
  }
}