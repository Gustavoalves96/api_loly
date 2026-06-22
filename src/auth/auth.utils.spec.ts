import { scryptSync } from 'crypto';
import { verifyAdminPassword } from './auth.utils';

describe('verifyAdminPassword', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD_HASH;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('retorna false quando a senha fornecida é vazia', () => {
    process.env.ADMIN_PASSWORD = 'secret';
    expect(verifyAdminPassword('')).toBe(false);
  });

  it('retorna false quando nada está configurado', () => {
    expect(verifyAdminPassword('qualquer')).toBe(false);
  });

  describe('modo texto puro (ADMIN_PASSWORD)', () => {
    beforeEach(() => {
      process.env.ADMIN_PASSWORD = 'minhaSenha123';
    });

    it('aceita a senha correta', () => {
      expect(verifyAdminPassword('minhaSenha123')).toBe(true);
    });

    it('rejeita a senha errada', () => {
      expect(verifyAdminPassword('errada')).toBe(false);
    });

    it('rejeita senha com tamanho diferente', () => {
      expect(verifyAdminPassword('minhaSenha123x')).toBe(false);
    });
  });

  describe('modo hash scrypt (ADMIN_PASSWORD_HASH)', () => {
    const salt = 'salt-fixo';
    const senha = 'senhaForte!';

    beforeEach(() => {
      const derived = scryptSync(senha, salt, 32).toString('hex');
      process.env.ADMIN_PASSWORD_HASH = `${salt}:${derived}`;
    });

    it('aceita a senha que gera o hash', () => {
      expect(verifyAdminPassword(senha)).toBe(true);
    });

    it('rejeita a senha errada', () => {
      expect(verifyAdminPassword('outra')).toBe(false);
    });

    it('rejeita hash malformado (sem separador)', () => {
      process.env.ADMIN_PASSWORD_HASH = 'semseparador';
      expect(verifyAdminPassword(senha)).toBe(false);
    });

    it('prioriza o hash sobre o texto puro quando ambos existem', () => {
      process.env.ADMIN_PASSWORD = 'senhaTextoPuro';
      // a senha de texto puro não deve passar; só a do hash
      expect(verifyAdminPassword('senhaTextoPuro')).toBe(false);
      expect(verifyAdminPassword(senha)).toBe(true);
    });
  });
});
