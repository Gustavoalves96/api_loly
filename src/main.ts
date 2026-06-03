import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Restringe CORS usando a variável de ambiente FRONTEND_ORIGIN
  // Aceita múltiplos domínios separados por vírgula (ex: "https://a.com,https://b.com")
  const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  const allowedOrigins = frontendOrigin.split(',').map((s) => s.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
  });

  console.log('CORS allowed origins:', allowedOrigins);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 API rodando na porta ${port}`);
}
void bootstrap();
