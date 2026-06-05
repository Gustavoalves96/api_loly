import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, Min } from 'class-validator';
import { StatusContrato } from '../contrato.entity';

export class CriarContratoDto {
  @IsNumber()
  @IsOptional()
  clienteId?: number;

  @IsDateString()
  data: string;

  @IsNumber()
  @Min(0)
  valor: number;

  @IsEnum(StatusContrato)
  @IsOptional()
  status?: StatusContrato;

  @IsString()
  @IsOptional()
  observacoes?: string;
}
