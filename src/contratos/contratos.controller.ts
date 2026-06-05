import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, UploadedFile, UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContratosService } from './contratos.service';
import { CriarContratoDto } from './dto/criar-contrato.dto';

@Controller('contratos')
export class ContratosController {
  constructor(private readonly contratosService: ContratosService) {}

  @Get()
  listar() { return this.contratosService.listar(); }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.contratosService.buscar(id);
  }

  @Post()
  criar(@Body() dto: CriarContratoDto) {
    return this.contratosService.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CriarContratoDto>) {
    return this.contratosService.atualizar(id, dto);
  }

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('arquivo', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') cb(null, true);
      else cb(new BadRequestException('Apenas arquivos PDF são permitidos.'), false);
    },
  }))
  uploadPdf(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    return this.contratosService.uploadPdf(id, file);
  }

  @Delete(':id')
  deletar(@Param('id', ParseIntPipe) id: number) {
    return this.contratosService.deletar(id);
  }
}
