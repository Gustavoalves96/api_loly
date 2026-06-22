import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { EstoqueModule } from './estoque/estoque.module';
import { ClientesModule } from './clientes/clientes.module';
import { EventosModule } from './eventos/eventos.module';
import { AuthController } from './auth/auth.controller';
import { ContratosModule } from './contratos/contratos.module';
import { FinanceiroModule } from './financeiro/financeiro.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }]),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      // Valida o certificado do banco por padrão (evita MITM). Só desative
      // (DATABASE_SSL_NO_VERIFY=true) se o provedor usar certificado self-signed.
      ssl:
        process.env.DATABASE_SSL_NO_VERIFY === 'true'
          ? { rejectUnauthorized: false }
          : { rejectUnauthorized: true },
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
    }),

    EstoqueModule,
    ClientesModule,
    EventosModule,
    ContratosModule,
    FinanceiroModule,
  ],
  controllers: [AuthController],
})
export class AppModule {}
