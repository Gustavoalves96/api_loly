import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { validateEnv } from './config/validate-env';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AllExceptionsFilter } from './common/http-exception.filter';

async function bootstrap() {
  // Falha cedo caso variáveis essenciais (segredos) estejam ausentes.
  validateEnv();

  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Padroniza respostas de erro e evita vazar stack traces.
  app.useGlobalFilters(new AllExceptionsFilter());

  // Proteção JWT global; rotas marcadas com @Public() são liberadas.
  app.useGlobalGuards(new JwtAuthGuard(app.get(Reflector)));

  // Documentação Swagger em /docs. As rotas do Swagger não passam pelo guard
  // global do Nest, então só expomos a doc fora de produção para não vazar o schema.
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Lolypopy API')
      .setDescription('API de gestão do salão Lolypopy')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

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

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 API rodando na porta ${port}`);
}
void bootstrap();
