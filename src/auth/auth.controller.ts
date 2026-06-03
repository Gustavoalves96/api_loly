import { Body, Controller, Post } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Controller('auth')
export class AuthController {
  constructor() {
    console.log('AUTH CONTROLLER CARREGADO');
  }
  @Post('login')
  login(@Body() body: { password: string }) {
    const adminPass = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORDS || 'changeme';
    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
    const providedPassword = body?.password?.trim();
    if (!providedPassword || providedPassword !== adminPass) {
      return { ok: false, message: 'Invalid credentials' };
    }
    const token = jwt.sign({ role: 'admin' }, jwtSecret, { expiresIn: '12h' });
    return { ok: true, token };
  }
}
