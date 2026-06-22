/**
 * Valida as variáveis de ambiente obrigatórias no boot da aplicação.
 * Falha cedo (lança erro) caso algo essencial esteja faltando,
 * evitando que a API suba com segredos default inseguros.
 */
export function validateEnv(): void {
  const errors: string[] = [];

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 16) {
    errors.push('JWT_SECRET é obrigatório e deve ter ao menos 16 caracteres.');
  }

  const hasPassword = !!process.env.ADMIN_PASSWORD?.trim();
  const hasHash = !!process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!hasPassword && !hasHash) {
    errors.push('Defina ADMIN_PASSWORD ou ADMIN_PASSWORD_HASH.');
  }

  if (!process.env.DATABASE_URL?.trim()) {
    errors.push('DATABASE_URL é obrigatório.');
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuração de ambiente inválida:\n - ${errors.join('\n - ')}`,
    );
  }
}
