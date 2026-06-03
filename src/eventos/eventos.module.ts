import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventosController } from './eventos.controller';
import { EventosService } from './eventos.service';
import { Evento } from './evento.entity';
import { ClientesModule } from '../clientes/clientes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Evento]),
    ClientesModule, // para ter acesso ao ClienteRepository
  ],
  controllers: [EventosController],
  providers: [EventosService],
})
export class EventosModule {}
