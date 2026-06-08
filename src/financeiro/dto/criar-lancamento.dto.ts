import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import {
  TipoLancamento,
  StatusLancamento,
  CategoriaPagamento,
} from '../financeiro.entity';

export class CriarLancamentoDto {
  @IsEnum(TipoLancamento)
  tipo: TipoLancamento;

  @IsEnum(StatusLancamento)
  @IsOptional()
  status?: StatusLancamento;

  @IsEnum(CategoriaPagamento)
  @IsOptional()
  categoria?: CategoriaPagamento;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsNumber()
  @Min(0)
  valor: number;

  @IsDateString()
  dataVencimento: string;

  @IsDateString()
  @IsOptional()
  dataPagamento?: string;

  @IsNumber()
  @IsOptional()
  eventoId?: number;

  @IsNumber()
  @IsOptional()
  clienteId?: number;

  @IsString()
  @IsOptional()
  observacoes?: string;
}
