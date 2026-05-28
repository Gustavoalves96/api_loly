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
