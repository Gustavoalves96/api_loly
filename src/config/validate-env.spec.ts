import { validateEnv } from './validate-env';

describe('validateEnv', () => {
  const OLD_ENV = process.env;

  const valido = () => {
    process.env.JWT_SECRET = 'um-segredo-bem-longo-1234';
    process.env.ADMIN_PASSWORD = 'senha';
    process.env.DATABASE_URL = 'postgres://x';
  };

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    delete process.env.JWT_SECRET;
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD_HASH;
    delete process.env.DATABASE_URL;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('não lança quando tudo está configurado', () => {
    valido();
    expect(() => validateEnv()).not.toThrow();
  });

  it('aceita ADMIN_PASSWORD_HASH no lugar de ADMIN_PASSWORD', () => {
    valido();
    delete process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD_HASH = 'salt:hash';
    expect(() => validateEnv()).not.toThrow();
  });

  it('lança quando JWT_SECRET está ausente', () => {
    valido();
    delete process.env.JWT_SECRET;
    expect(() => validateEnv()).toThrow(/JWT_SECRET/);
  });

  it('lança quando JWT_SECRET é curto demais', () => {
    valido();
    process.env.JWT_SECRET = 'curto';
    expect(() => validateEnv()).toThrow(/JWT_SECRET/);
  });

  it('lança quando não há senha de admin', () => {
    valido();
    delete process.env.ADMIN_PASSWORD;
    expect(() => validateEnv()).toThrow(/ADMIN_PASSWORD/);
  });

  it('lança quando DATABASE_URL está ausente', () => {
    valido();
    delete process.env.DATABASE_URL;
    expect(() => validateEnv()).toThrow(/DATABASE_URL/);
  });
});
