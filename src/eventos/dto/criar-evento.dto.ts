import {
  IsString, IsOptional, IsEnum, IsNumber, IsDateString, Min, Max,
  IsArray, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatusEvento } from '../evento.entity';

class BuffetItemEventoDto {
  @IsString()
  nome: string;

  @IsString()
  @IsOptional()
  quantidade?: string;
}

export class CriarEventoDto {
  @IsNumber()
  @IsOptional()
  clienteId?: number;

  @IsDateString()
  data: string;

  @IsString()
  horario: string;

  @IsString()
  @IsOptional()
  temaFesta?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  numeroCriancas?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  numeroPessoas?: number;

  @IsString()
  @IsOptional()
  buffet?: string;

  @IsNumber()
  @IsOptional()
  buffetId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BuffetItemEventoDto)
  @IsOptional()
  buffetItens?: BuffetItemEventoDto[];

  @IsEnum(StatusEvento)
  @IsOptional()
  status?: StatusEvento;

  @IsNumber()
  @Min(0)
  @IsOptional()
  valorTotal?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  valorPago?: number;

  // 1 = à vista, 2–12 = parcelado
  @IsNumber()
  @Min(1)
  @Max(12)
  @IsOptional()
  parcelas?: number;

  @IsString()
  @IsOptional()
  observacoes?: string;
}
