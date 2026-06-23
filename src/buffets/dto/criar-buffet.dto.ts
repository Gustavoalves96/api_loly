import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BuffetItemDto {
  @IsString()
  nome: string;

  @IsString()
  @IsOptional()
  quantidade?: string;
}

export class CriarBuffetDto {
  @IsString()
  nome: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  preco?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BuffetItemDto)
  @IsOptional()
  itens?: BuffetItemDto[];

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
