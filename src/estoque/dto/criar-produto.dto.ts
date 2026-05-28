import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { CategoriaProduto } from '../produto.entity';

export class CriarProdutoDto {
  @IsString()
  nome!: string;

  @IsEnum(CategoriaProduto)
  @IsOptional()
  categoria?: CategoriaProduto;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsNumber()
  @IsOptional()
  precoCusto?: number;

  @IsString()
  @IsOptional()
  unidadeMedida?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantidadeInicial?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  estoqueMinimo?: number;
}
