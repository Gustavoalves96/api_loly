# 🗄️ Guia: Backend NestJS + PostgreSQL — Módulo de Estoque (Lolypopy)

## Visão Geral

Você vai configurar:
1. PostgreSQL (banco de dados)
2. TypeORM (ORM — "tradutor" entre seu código e o banco)
3. Módulo de Estoque completo no NestJS

---

## PASSO 1 — Instalar o PostgreSQL

### Opção A: Usando Docker (recomendado para desenvolvimento)
Se você tiver Docker instalado, rode no terminal:

```bash
docker run --name lolypopy-db \
  -e POSTGRES_USER=loly \
  -e POSTGRES_PASSWORD=loly123 \
  -e POSTGRES_DB=lolypopy \
  -p 5432:5432 \
  -d postgres
```

Isso cria um banco de dados PostgreSQL rodando localmente na porta 5432.

### Opção B: Instalação direta
Baixe e instale o PostgreSQL em: https://www.postgresql.org/download/
Após instalar, crie um banco de dados chamado `lolypopy`.

---

## PASSO 2 — Instalar dependências no NestJS

Na pasta do projeto `api_loly`, rode:

```bash
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/config
```

**O que cada pacote faz:**
- `@nestjs/typeorm` + `typeorm` → ORM que conecta NestJS ao banco
- `pg` → driver do PostgreSQL
- `@nestjs/config` → lê variáveis de ambiente (.env)

---

## PASSO 3 — Criar o arquivo .env

Na raiz do projeto `api_loly`, crie um arquivo `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=loly
DB_PASSWORD=loly123
DB_DATABASE=lolypopy
```

> ⚠️ Confirme que `.env` está no `.gitignore` para não subir suas senhas pro GitHub!

---

## PASSO 4 — Configurar o AppModule

Abra `src/app.module.ts` e substitua pelo seguinte:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstoqueModule } from './estoque/estoque.module';

@Module({
  imports: [
    // Carrega o .env em toda a aplicação
    ConfigModule.forRoot({ isGlobal: true }),

    // Conecta ao PostgreSQL usando as variáveis do .env
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // ⚠️ só em desenvolvimento! Cria as tabelas automaticamente
      }),
      inject: [ConfigService],
    }),

    EstoqueModule,
  ],
})
export class AppModule {}
```

---

## PASSO 5 — Criar o Módulo de Estoque

Rode no terminal (dentro da pasta `api_loly`):

```bash
npx nest generate module estoque
npx nest generate controller estoque
npx nest generate service estoque
```

Isso cria a estrutura:
```
src/
  estoque/
    estoque.module.ts
    estoque.controller.ts
    estoque.service.ts
```

---

## PASSO 6 — Criar as Entidades (tabelas do banco)

### 6.1 — Produto (`src/estoque/produto.entity.ts`)

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MovimentacaoEstoque } from './movimentacao.entity';

export enum CategoriaProduto {
  SALGADO = 'salgado',
  DOCE = 'doce',
  BEBIDA = 'bebida',
  DECORACAO = 'decoracao',
  DESCARTAVEL = 'descartavel',
  OUTRO = 'outro',
}

@Entity('produtos')
export class Produto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({
    type: 'enum',
    enum: CategoriaProduto,
    default: CategoriaProduto.OUTRO,
  })
  categoria: CategoriaProduto;

  @Column({ nullable: true })
  descricao: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  precoCusto: number;

  @Column({ default: 'unidade' })
  unidadeMedida: string; // unidade, kg, litro, pacote...

  @Column({ default: 0 })
  quantidadeAtual: number;

  @Column({ default: 10 })
  estoqueMinimo: number; // alerta quando cair abaixo desse valor

  @Column({ default: true })
  ativo: boolean;

  @OneToMany(() => MovimentacaoEstoque, (mov) => mov.produto)
  movimentacoes: MovimentacaoEstoque[];

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
```

### 6.2 — Movimentação de Estoque (`src/estoque/movimentacao.entity.ts`)

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Produto } from './produto.entity';

export enum TipoMovimentacao {
  ENTRADA = 'entrada',
  SAIDA = 'saida',
}

@Entity('movimentacoes_estoque')
export class MovimentacaoEstoque {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Produto, (produto) => produto.movimentacoes, {
    onDelete: 'CASCADE',
  })
  produto: Produto;

  @Column({
    type: 'enum',
    enum: TipoMovimentacao,
  })
  tipo: TipoMovimentacao;

  @Column()
  quantidade: number;

  @Column({ nullable: true })
  motivo: string; // ex: "compra", "usado no evento #12", "descarte"

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  precoUnitario: number; // preço pago nessa movimentação (útil para entradas)

  @CreateDateColumn()
  criadoEm: Date;
}
```

---

## PASSO 7 — DTOs (validação dos dados recebidos)

Instale o pacote de validação:
```bash
npm install class-validator class-transformer
```

### 7.1 — `src/estoque/dto/criar-produto.dto.ts`

```typescript
import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { CategoriaProduto } from '../produto.entity';

export class CriarProdutoDto {
  @IsString()
  nome: string;

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
```

### 7.2 — `src/estoque/dto/movimentacao.dto.ts`

```typescript
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TipoMovimentacao } from '../movimentacao.entity';

export class MovimentacaoDto {
  @IsEnum(TipoMovimentacao)
  tipo: TipoMovimentacao;

  @IsNumber()
  @Min(1)
  quantidade: number;

  @IsString()
  @IsOptional()
  motivo?: string;

  @IsNumber()
  @IsOptional()
  precoUnitario?: number;
}
```

---

## PASSO 8 — Service (lógica de negócio)

Substitua o conteúdo de `src/estoque/estoque.service.ts`:

```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produto } from './produto.entity';
import { MovimentacaoEstoque, TipoMovimentacao } from './movimentacao.entity';
import { CriarProdutoDto } from './dto/criar-produto.dto';
import { MovimentacaoDto } from './dto/movimentacao.dto';

@Injectable()
export class EstoqueService {
  constructor(
    @InjectRepository(Produto)
    private produtoRepo: Repository<Produto>,

    @InjectRepository(MovimentacaoEstoque)
    private movimentacaoRepo: Repository<MovimentacaoEstoque>,
  ) {}

  // --- PRODUTOS ---

  async listarProdutos() {
    return this.produtoRepo.find({ where: { ativo: true }, order: { nome: 'ASC' } });
  }

  async buscarProduto(id: number) {
    const produto = await this.produtoRepo.findOne({ where: { id } });
    if (!produto) throw new NotFoundException('Produto não encontrado');
    return produto;
  }

  async criarProduto(dto: CriarProdutoDto) {
    const produto = this.produtoRepo.create({
      ...dto,
      quantidadeAtual: dto.quantidadeInicial ?? 0,
    });
    return this.produtoRepo.save(produto);
  }

  async atualizarProduto(id: number, dto: Partial<CriarProdutoDto>) {
    await this.buscarProduto(id);
    await this.produtoRepo.update(id, dto);
    return this.buscarProduto(id);
  }

  async desativarProduto(id: number) {
    await this.buscarProduto(id);
    await this.produtoRepo.update(id, { ativo: false });
    return { mensagem: 'Produto desativado com sucesso' };
  }

  // --- MOVIMENTAÇÕES ---

  async registrarMovimentacao(produtoId: number, dto: MovimentacaoDto) {
    const produto = await this.buscarProduto(produtoId);

    if (dto.tipo === TipoMovimentacao.SAIDA) {
      if (produto.quantidadeAtual < dto.quantidade) {
        throw new BadRequestException('Quantidade insuficiente em estoque');
      }
      produto.quantidadeAtual -= dto.quantidade;
    } else {
      produto.quantidadeAtual += dto.quantidade;
    }

    await this.produtoRepo.save(produto);

    const movimentacao = this.movimentacaoRepo.create({
      produto,
      ...dto,
    });
    return this.movimentacaoRepo.save(movimentacao);
  }

  async listarMovimentacoes(produtoId: number) {
    return this.movimentacaoRepo.find({
      where: { produto: { id: produtoId } },
      order: { criadoEm: 'DESC' },
    });
  }

  // --- ALERTAS ---

  async produtosComEstoqueBaixo() {
    return this.produtoRepo
      .createQueryBuilder('p')
      .where('p.ativo = true')
      .andWhere('p.quantidadeAtual <= p.estoqueMinimo')
      .getMany();
  }
}
```

---

## PASSO 9 — Controller (rotas da API)

Substitua `src/estoque/estoque.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { EstoqueService } from './estoque.service';
import { CriarProdutoDto } from './dto/criar-produto.dto';
import { MovimentacaoDto } from './dto/movimentacao.dto';

@Controller('estoque')
export class EstoqueController {
  constructor(private readonly estoqueService: EstoqueService) {}

  // GET /estoque/produtos
  @Get('produtos')
  listar() {
    return this.estoqueService.listarProdutos();
  }

  // GET /estoque/alertas
  @Get('alertas')
  alertas() {
    return this.estoqueService.produtosComEstoqueBaixo();
  }

  // GET /estoque/produtos/:id
  @Get('produtos/:id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.estoqueService.buscarProduto(id);
  }

  // POST /estoque/produtos
  @Post('produtos')
  criar(@Body() dto: CriarProdutoDto) {
    return this.estoqueService.criarProduto(dto);
  }

  // PATCH /estoque/produtos/:id
  @Patch('produtos/:id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CriarProdutoDto>,
  ) {
    return this.estoqueService.atualizarProduto(id, dto);
  }

  // DELETE /estoque/produtos/:id
  @Delete('produtos/:id')
  desativar(@Param('id', ParseIntPipe) id: number) {
    return this.estoqueService.desativarProduto(id);
  }

  // POST /estoque/produtos/:id/movimentacao
  @Post('produtos/:id/movimentacao')
  movimentar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MovimentacaoDto,
  ) {
    return this.estoqueService.registrarMovimentacao(id, dto);
  }

  // GET /estoque/produtos/:id/movimentacoes
  @Get('produtos/:id/movimentacoes')
  historico(@Param('id', ParseIntPipe) id: number) {
    return this.estoqueService.listarMovimentacoes(id);
  }
}
```

---

## PASSO 10 — Atualizar o EstoqueModule

Substitua `src/estoque/estoque.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstoqueController } from './estoque.controller';
import { EstoqueService } from './estoque.service';
import { Produto } from './produto.entity';
import { MovimentacaoEstoque } from './movimentacao.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Produto, MovimentacaoEstoque])],
  controllers: [EstoqueController],
  providers: [EstoqueService],
})
export class EstoqueModule {}
```

---

## PASSO 11 — Habilitar validação global

Em `src/main.ts`, adicione o `ValidationPipe`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Libera o frontend React (porta 5173) acessar a API
  app.enableCors({ origin: 'http://localhost:5173' });

  await app.listen(3000);
  console.log('🚀 API rodando em http://localhost:3000');
}
bootstrap();
```

---

## PASSO 12 — Testar a API

Suba a API:
```bash
npm run start:dev
```

Teste com curl ou Postman:

```bash
# Criar produto
curl -X POST http://localhost:3000/estoque/produtos \
  -H "Content-Type: application/json" \
  -d '{"nome":"Coxinha","categoria":"salgado","quantidadeInicial":100,"estoqueMinimo":20}'

# Listar produtos
curl http://localhost:3000/estoque/produtos

# Registrar saída
curl -X POST http://localhost:3000/estoque/produtos/1/movimentacao \
  -H "Content-Type: application/json" \
  -d '{"tipo":"saida","quantidade":10,"motivo":"Evento aniversário João"}'

# Ver alertas de estoque baixo
curl http://localhost:3000/estoque/alertas
```

---

## Estrutura final do módulo

```
src/estoque/
  dto/
    criar-produto.dto.ts
    movimentacao.dto.ts
  produto.entity.ts
  movimentacao.entity.ts
  estoque.module.ts
  estoque.controller.ts
  estoque.service.ts
```

---

## Resumo das rotas da API

| Método | Rota | O que faz |
|--------|------|-----------|
| GET | /estoque/produtos | Lista todos os produtos |
| GET | /estoque/produtos/:id | Busca um produto |
| POST | /estoque/produtos | Cria produto |
| PATCH | /estoque/produtos/:id | Edita produto |
| DELETE | /estoque/produtos/:id | Desativa produto |
| POST | /estoque/produtos/:id/movimentacao | Entrada ou saída |
| GET | /estoque/produtos/:id/movimentacoes | Histórico do produto |
| GET | /estoque/alertas | Produtos com estoque baixo |
