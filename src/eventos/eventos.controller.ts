import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, Query,
} from '@nestjs/common';
import { EventosService } from './eventos.service';
import { CriarEventoDto } from './dto/criar-evento.dto';

@Controller('eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  // GET /eventos?mes=6&ano=2026
  @Get()
  listar(@Query('mes') mes?: string, @Query('ano') ano?: string) {
    return this.eventosService.listar(
      mes ? +mes : undefined,
      ano ? +ano : undefined,
    );
  }

  // GET /eventos/hoje
  @Get('hoje')
  hoje() {
    return this.eventosService.hoje();
  }

  // GET /eventos/proximos
  @Get('proximos')
  proximos() {
    return this.eventosService.proximos();
  }

  // GET /eventos/:id
  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.eventosService.buscar(id);
  }

  // POST /eventos
  @Post()
  criar(@Body() dto: CriarEventoDto) {
    return this.eventosService.criar(dto);
  }

  // PATCH /eventos/:id
  @Patch(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CriarEventoDto>,
  ) {
    return this.eventosService.atualizar(id, dto);
  }

  // DELETE /eventos/:id
  @Delete(':id')
  deletar(@Param('id', ParseIntPipe) id: number) {
    return this.eventosService.deletar(id);
  }
}
