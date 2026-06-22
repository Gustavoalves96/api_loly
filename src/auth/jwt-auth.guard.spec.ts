import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const SECRET = 'segredo-de-teste-123456';

  function makeContext(
    headers: Record<string, string> = {},
    method = 'GET',
  ): ExecutionContext {
    const req = { headers, method, path: '/clientes' };
    return {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;
  }

  function makeGuard(isPublic = false): JwtAuthGuard {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(isPublic),
    } as unknown as Reflector;
    return new JwtAuthGuard(reflector);
  }

  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
  });

  it('libera rotas marcadas como @Public()', () => {
    const guard = makeGuard(true);
    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('libera requisições OPTIONS (preflight CORS)', () => {
    const guard = makeGuard(false);
    expect(guard.canActivate(makeContext({}, 'OPTIONS'))).toBe(true);
  });

  it('aceita um token válido', () => {
    const guard = makeGuard(false);
    const token = jwt.sign({ role: 'admin' }, SECRET);
    expect(
      guard.canActivate(makeContext({ authorization: `Bearer ${token}` })),
    ).toBe(true);
  });

  it('rejeita quando o token está ausente', () => {
    const guard = makeGuard(false);
    expect(() => guard.canActivate(makeContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('rejeita um token inválido', () => {
    const guard = makeGuard(false);
    expect(() =>
      guard.canActivate(makeContext({ authorization: 'Bearer token.falso' })),
    ).toThrow(UnauthorizedException);
  });

  it('rejeita token assinado com outro segredo', () => {
    const guard = makeGuard(false);
    const token = jwt.sign({ role: 'admin' }, 'outro-segredo-totalmente');
    expect(() =>
      guard.canActivate(makeContext({ authorization: `Bearer ${token}` })),
    ).toThrow(UnauthorizedException);
  });
});
