import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  console.log('VERSAO NOVA DA API');
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

  // Middleware simples para proteger rotas com JWT. Exclui /auth routes.
  const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/auth')) return next();
    // Allow health checks or static if needed
    if (req.method === 'OPTIONS') return next();
    const authHeader = (req.headers.authorization || '') as string;
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) {
      res.status(401).json({ ok: false, message: 'Unauthorized' });
      return;
    }
    try {
      jwt.verify(token, jwtSecret);
      return next();
    } catch (err) {
      res.status(401).json({ ok: false, message: 'Invalid token' });
    }
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 API rodando na porta ${port}`);
}
void bootstrap();
