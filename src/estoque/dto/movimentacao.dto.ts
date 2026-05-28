import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TipoMovimentacao } from '../movimentacao.entity';

export class MovimentacaoDto {
  @IsEnum(TipoMovimentacao)
  tipo!: TipoMovimentacao;

  @IsNumber()
  @Min(1)
  quantidade!: number;

  @IsString()
  @IsOptional()
  motivo?: string;

  @IsNumber()
  @IsOptional()
  precoUnitario?: number;
}
