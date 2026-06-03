import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstoqueModule } from './estoque/estoque.module';
import { ClientesModule } from './clientes/clientes.module';
import { EventosModule } from './eventos/eventos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),

    EstoqueModule,
    ClientesModule,
    EventosModule,
  ],
})
export class AppModule {}
