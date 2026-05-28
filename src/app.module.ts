import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstoqueModule } from './estoque/estoque.module';

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
  ],
})
export class AppModule {}
