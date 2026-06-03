import { IsString, IsOptional, IsEmail, IsDateString } from 'class-validator';

export class CriarClienteDto {
  @IsString()
  nome: string;

  @IsString()
  telefone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  cpfCnpj?: string;

  @IsString()
  @IsOptional()
  endereco?: string;

  @IsString()
  @IsOptional()
  cidade?: string;

  @IsString()
  @IsOptional()
  nomeFilho?: string;

  @IsDateString()
  @IsOptional()
  dataNascimentoFilho?: string;

  @IsString()
  @IsOptional()
  observacoes?: string;
}
