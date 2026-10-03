import argon2 from 'argon2';
import { env } from '../env.js';

export const DUMMY_STARTUP_PASSWORD = 'ancora-dummy-startup-password-2026';

let dummyHash: string = '';

/**
 * Hashes a password using Argon2id (OWASP recommended variant) and APP_PEPPER.
 */
export async function hashPassword(password: string): Promise<string> {
  const pepper = env.APP_PEPPER_V1 || env.APP_PEPPER_SECRET;
  return argon2.hash(password, {
    type: argon2.argon2id,
    secret: Buffer.from(pepper),
  });
}

/**
 * Verifies a password against an Argon2 hash with pepper.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  if (!hash) {
    return false;
  }

  const pepper = env.APP_PEPPER_V1 || env.APP_PEPPER_SECRET;

  try {
    return await argon2.verify(hash, password, {
      secret: Buffer.from(pepper),
    });
  } catch {
    return false;
  }
}

/**
 * Computa de forma assíncrona o DUMMY_HASH em memória no startup da aplicação.
 */
export async function initDummyHash(): Promise<string> {
  if (!dummyHash) {
    dummyHash = await hashPassword(DUMMY_STARTUP_PASSWORD);
  }
  return dummyHash;
}

/**
 * Retorna o DUMMY_HASH pré-computado em memória para mitigar DoS e timing attacks.
 */
export function getDummyHash(): string {
  return dummyHash;
}

// Dispara o cálculo antecipado no carregamento do módulo
void initDummyHash();
