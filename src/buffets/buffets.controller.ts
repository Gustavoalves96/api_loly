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
import { BuffetsService } from './buffets.service';
import { CriarBuffetDto } from './dto/criar-buffet.dto';

@Controller('buffets')
export class BuffetsController {
  constructor(private readonly buffetsService: BuffetsService) {}

  // GET /buffets
  @Get()
  listar() {
    return this.buffetsService.listar();
  }

  // GET /buffets/:id
  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.buffetsService.buscar(id);
  }

  // POST /buffets
  @Post()
  criar(@Body() dto: CriarBuffetDto) {
    return this.buffetsService.criar(dto);
  }

  // PATCH /buffets/:id
  @Patch(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CriarBuffetDto>,
  ) {
    return this.buffetsService.atualizar(id, dto);
  }

  // DELETE /buffets/:id
  @Delete(':id')
  deletar(@Param('id', ParseIntPipe) id: number) {
    return this.buffetsService.deletar(id);
  }
}
