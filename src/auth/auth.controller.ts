import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import * as jwt from 'jsonwebtoken';
import { Public } from './public.decorator';
import { verifyAdminPassword } from './auth.utils';

@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  login(@Body() body: { password: string }) {
    const providedPassword = body?.password?.trim();
    if (!verifyAdminPassword(providedPassword)) {
      return { ok: false, message: 'Invalid credentials' };
    }
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET as string, {
      expiresIn: '12h',
    });
    return { ok: true, token };
  }
}
