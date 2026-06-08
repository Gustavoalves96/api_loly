import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventosController } from './eventos.controller';
import { EventosService } from './eventos.service';
import { Evento } from './evento.entity';
import { Cliente } from '../clientes/cliente.entity';
import { Lancamento } from '../financeiro/financeiro.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Evento, Cliente, Lancamento]),
  ],
  controllers: [EventosController],
  providers: [EventosService],
  exports: [EventosService],
})
export class EventosModule {}
