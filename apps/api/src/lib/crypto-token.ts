import crypto from 'node:crypto';
import { env } from '../env.js';

const RECOVERY_KEY_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

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
 * Gera chave criptograficamente segura no formato ANCORA-XXXX-XXXX-XXXX
 * (12 caracteres alfanuméricos aleatórios em caixa alta, agrupados em 3 blocos de 4 caracteres por hífens).
 */
export function generateRecoveryKey(): string {
  let chars = '';
  for (let i = 0; i < 12; i++) {
    const randomIndex = crypto.randomInt(0, RECOVERY_KEY_CHARSET.length);
    chars += RECOVERY_KEY_CHARSET[randomIndex];
  }
  const block1 = chars.slice(0, 4);
  const block2 = chars.slice(4, 8);
  const block3 = chars.slice(8, 12);
  return `ANCORA-${block1}-${block2}-${block3}`;
}

/**
 * Retorna hash SHA-256 da chave de recuperação normalizada (uppercase e trim).
 */
export function hashRecoveryKey(key: string): string {
  const normalized = key.trim().toUpperCase();
  return crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex');
}

