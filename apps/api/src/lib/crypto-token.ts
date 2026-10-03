import crypto from 'node:crypto';
import { env } from '../env.js';

export const CROCKFORD_BASE32_CHARSET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function deriveAccountToken(userId: string): string {
  const pepper = env.APP_PEPPER_V1 || env.APP_PEPPER_SECRET;
  return crypto
    .createHmac('sha256', pepper)
    .update(userId)
    .digest('hex');
}

/**
 * Deriva o loginToken via HMAC Double-Blind a partir do pseudônimo normalizado (lowercase e trim).
 */
export function deriveLoginToken(pseudonym: string): string {
  const pepper = env.APP_PEPPER_V1 || env.APP_PEPPER_SECRET;
  const normalized = pseudonym.trim().toLowerCase();
  return crypto
    .createHmac('sha256', pepper)
    .update(normalized)
    .digest('hex');
}

/**
 * Normaliza a chave de recuperação tornando a digitação tolerante a erros humanos:
 * 1. Converte para maiúsculas e remove espaços das extremidades.
 * 2. Remove o prefixo FIRME ou ANCORA opcional se presente.
 * 3. Remove espaços e hífens internos.
 * 4. Rejeita o caractere proibido 'U' (Crockford Base32 estrito anti-acidental).
 * 5. Mapeia caracteres ambíguos: 'O' -> '0', 'I'/'L' -> '1'.
 */
export function normalizeRecoveryKey(key: string): string {
  let normalized = key.trim().toUpperCase();
  if (normalized.startsWith('FIRME')) {
    normalized = normalized.slice(5);
  } else if (normalized.startsWith('ANCORA')) {
    normalized = normalized.slice(6);
  }
  normalized = normalized.replace(/[\s-]+/g, '');

  if (normalized.includes('U')) {
    throw new Error('Chave de recuperação inválida: caractere proibido "U".');
  }

  normalized = normalized.replace(/O/g, '0').replace(/[IL]/g, '1');
  return normalized;
}

/**
 * Gera Chave Mestra criptograficamente segura com 20 caracteres do alfabeto Crockford Base32
 * no formato FIRME-XXXXX-XXXXX-XXXXX-XXXXX (4 blocos de 5 caracteres).
 */
export function generateRecoveryKey(): string {
  let chars = '';
  for (let i = 0; i < 20; i++) {
    const randomIndex = crypto.randomInt(0, CROCKFORD_BASE32_CHARSET.length);
    chars += CROCKFORD_BASE32_CHARSET[randomIndex];
  }
  const block1 = chars.slice(0, 5);
  const block2 = chars.slice(5, 10);
  const block3 = chars.slice(10, 15);
  const block4 = chars.slice(15, 20);
  return `FIRME-${block1}-${block2}-${block3}-${block4}`;
}

/**
 * Retorna hash SHA-256 da chave de recuperação após normalização tolerante a erros humanos.
 */
export function hashRecoveryKey(key: string): string {
  const normalized = normalizeRecoveryKey(key);
  return crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex');
}


