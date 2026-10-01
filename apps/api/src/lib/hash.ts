import argon2 from 'argon2';

/**
 * Hashes a password using Argon2id (OWASP recommended variant).
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
  });
}

/**
 * Verifies a password against an Argon2 hash.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}
