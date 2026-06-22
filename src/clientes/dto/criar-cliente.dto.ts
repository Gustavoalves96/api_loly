import { IsString, IsOptional, IsEmail, IsDateString, IsInt } from 'class-validator';

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

  @IsInt()
  @IsOptional()
  idadeAniversariante?: number;

  @IsString()
  @IsOptional()
  observacoes?: string;
}
