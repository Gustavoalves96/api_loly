import { scryptSync, timingSafeEqual } from 'crypto';

/**
 * Compara dois textos em tempo constante, evitando timing attacks.
 * Faz hash de ambos os lados (mesmo tamanho) antes de comparar para
 * não vazar o comprimento da senha esperada.
 */
function constantTimeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  // scrypt normaliza o tamanho e ainda dificulta comparação de comprimento
  const keyA = scryptSync(bufferA, 'cmp-salt', 32);
  const keyB = scryptSync(bufferB, 'cmp-salt', 32);
  return timingSafeEqual(keyA, keyB);
}

/**
 * Verifica a senha fornecida contra a configuração de ambiente.
 *
 * Suporta dois modos:
 *  - ADMIN_PASSWORD_HASH no formato "salt:hashHex" (scrypt) — recomendado.
 *  - ADMIN_PASSWORD em texto puro (compatibilidade) — comparado em tempo constante.
 */
export function verifyAdminPassword(provided: string): boolean {
  if (!provided) return false;

  const hash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (hash) {
    const [salt, expectedHex] = hash.split(':');
    if (!salt || !expectedHex) return false;
    const expected = Buffer.from(expectedHex, 'hex');
    const derived = scryptSync(provided, salt, expected.length);
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  }

  const plain = process.env.ADMIN_PASSWORD?.trim();
  if (!plain) return false;
  return constantTimeEquals(provided, plain);
}
