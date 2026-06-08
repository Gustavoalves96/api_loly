import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { StatusEvento } from '../evento.entity';

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

  @IsString()
  @IsOptional()
  observacoes?: string;
}
