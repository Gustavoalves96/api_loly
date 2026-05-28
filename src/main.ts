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
void bootstrap();
