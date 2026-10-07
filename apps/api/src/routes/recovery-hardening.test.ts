import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema/auth.js';
import { profiles, quarantinedPseudonyms } from '../db/schema/recovery.js';
import {
  deriveAccountToken,
  deriveLoginToken,
  generateRecoveryKey,
  hashRecoveryKey,
} from '../lib/crypto-token.js';
import { hashPassword } from '../lib/hash.js';
import { buildServer } from '../server.js';

describe('Remediação de Falhas 1.1, 1.2 e 6.1 (Recovery Hardening & Expurgo LGPD)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1.2: Deve rejeitar colisão de Chave Mestra duplicada no banco via unique constraint', async () => {
    const recoveryKey = generateRecoveryKey();
    const recoveryKeyHash = hashRecoveryKey(recoveryKey);
    const userId1 = crypto.randomUUID();
    const userId2 = crypto.randomUUID();

    const [createdUser1] = await db
      .insert(users)
      .values({
        id: userId1,
        loginToken: crypto.randomBytes(32).toString('hex'),
        passwordHash: 'dummy_hash',
        recoveryKeyHash,
        tokenVersion: 0,
        isAdult: true,
        role: 'user',
      })
      .returning();

    expect(createdUser1).toBeDefined();

    // Tentar inserir segundo usuário com a mesma recoveryKeyHash deve violar a constraint unique
    await expect(
      db.insert(users).values({
        id: userId2,
        loginToken: crypto.randomBytes(32).toString('hex'),
        passwordHash: 'dummy_hash_2',
        recoveryKeyHash,
        tokenVersion: 0,
        isAdult: true,
        role: 'user',
      }),
    ).rejects.toThrow();

    // Limpeza
    await db.delete(users).where(eq(users.id, userId1));
  });

  it('1.1: Deve permitir recuperação pela Chave Mestra mesmo quando o pseudônimo enviado for antigo após rotação', async () => {
    // 1. Cadastra usuário via POST /api/v1/auth/register
    const initialPassword = 'InitialPassword123!';
    const registerRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        password: initialPassword,
        isAdult: true,
        persona: 'navegador',
        termsVersion: '2026.1',
        privacyPolicyVersion: '2026.1',
        healthDataConsent: true,
      },
    });

    expect(registerRes.statusCode).toBe(201);
    const registerBody = JSON.parse(registerRes.payload);
    const originalRecoveryKey = registerBody.data.recoveryKey;
    const initialPseudonym = registerBody.data.profile.pseudonym;
    const initialAccessToken = registerBody.data.accessToken;
    const userId = registerBody.data.user.id;

    expect(originalRecoveryKey).toBeDefined();
    expect(initialPseudonym).toBeDefined();

    // 2. Rotaciona a identidade comunitária via POST /api/v1/profile/rotate-identity
    const rotateRes = await app.inject({
      method: 'POST',
      url: '/api/v1/profile/rotate-identity',
      headers: {
        authorization: `Bearer ${initialAccessToken}`,
      },
      payload: {
        regeneratePseudonym: true,
      },
    });

    expect(rotateRes.statusCode).toBe(200);
    const rotateBody = JSON.parse(rotateRes.payload);
    const activePseudonym = rotateBody.data.profile.pseudonym;
    expect(activePseudonym).not.toBe(initialPseudonym);

    // 3. Usuário sofreu amnésia do novo pseudônimo e tenta recuperar usando a Chave Mestra e o pseudônimo ANTIGO
    const newPassword = 'NewSecretPassword2026!';
    const recoverWithOldPseudonymRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/recover',
      payload: {
        pseudonym: initialPseudonym, // Pseudônimo antigo e desatualizado
        recoveryKey: originalRecoveryKey,
        newPassword,
      },
    });

    expect(recoverWithOldPseudonymRes.statusCode).toBe(200);
    const recoverBody = JSON.parse(recoverWithOldPseudonymRes.payload);
    expect(recoverBody.status).toBe('success');
    expect(recoverBody.data.profile.pseudonym).toBe(activePseudonym);
    expect(recoverBody.data.recoveryKey).toBeDefined();
    expect(recoverBody.data.recoveryKey).not.toBe(originalRecoveryKey);

    // 4. Usuário consegue logar com o pseudônimo ATIVO retornado e a nova senha
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        identifier: activePseudonym,
        password: newPassword,
      },
    });

    expect(loginRes.statusCode).toBe(200);

    // Limpeza
    const accountToken = deriveAccountToken(userId);
    await db.delete(quarantinedPseudonyms).where(eq(quarantinedPseudonyms.accountToken, accountToken));
    await db.delete(profiles).where(eq(profiles.accountToken, accountToken));
    await db.delete(users).where(eq(users.id, userId));
  });

  it('1.1: Deve permitir recuperação pela Chave Mestra mesmo sem informar pseudônimo (amnésia total)', async () => {
    // 1. Cadastra usuário
    const password = 'PasswordForAmnesia123!';
    const registerRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        password,
        isAdult: true,
        persona: 'navegador',
        termsVersion: '2026.1',
        privacyPolicyVersion: '2026.1',
        healthDataConsent: true,
      },
    });

    expect(registerRes.statusCode).toBe(201);
    const registerBody = JSON.parse(registerRes.payload);
    const recoveryKey = registerBody.data.recoveryKey;
    const activePseudonym = registerBody.data.profile.pseudonym;
    const userId = registerBody.data.user.id;

    // 2. Recupera passando APENAS recoveryKey e newPassword (sem campo pseudonym)
    const newPassword = 'PasswordRecovered123!';
    const recoverRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/recover',
      payload: {
        recoveryKey,
        newPassword,
      },
    });

    expect(recoverRes.statusCode).toBe(200);
    const recoverBody = JSON.parse(recoverRes.payload);
    expect(recoverBody.status).toBe('success');
    expect(recoverBody.data.profile.pseudonym).toBe(activePseudonym);

    // Limpeza
    const accountToken = deriveAccountToken(userId);
    await db.delete(profiles).where(eq(profiles.accountToken, accountToken));
    await db.delete(users).where(eq(users.id, userId));
  });

  it('6.1: Deve expurgar atomicamente pseudônimos da quarentena ao executar DELETE /api/v1/account (LGPD)', async () => {
    // 1. Cadastra usuário
    const password = 'LgpdUserPass123!';
    const registerRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        password,
        isAdult: true,
        persona: 'navegador',
        termsVersion: '2026.1',
        privacyPolicyVersion: '2026.1',
        healthDataConsent: true,
      },
    });

    expect(registerRes.statusCode).toBe(201);
    const registerBody = JSON.parse(registerRes.payload);
    const accessToken = registerBody.data.accessToken;
    const userId = registerBody.data.user.id;
    const oldPseudonym = registerBody.data.profile.pseudonym;
    const accountToken = deriveAccountToken(userId);

    // 2. Rotaciona a identidade para enviar o pseudônimo antigo para a quarentena com accountToken
    const rotateRes = await app.inject({
      method: 'POST',
      url: '/api/v1/profile/rotate-identity',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        regeneratePseudonym: true,
      },
    });

    expect(rotateRes.statusCode).toBe(200);

    // 3. Confirma que o pseudônimo antigo está na tabela de quarentena com o accountToken
    const quarantinedBefore = await db
      .select()
      .from(quarantinedPseudonyms)
      .where(eq(quarantinedPseudonyms.accountToken, accountToken));

    expect(quarantinedBefore.length).toBeGreaterThan(0);
    expect(quarantinedBefore.some((q) => q.pseudonym === oldPseudonym)).toBe(true);

    // 4. Executa DELETE /api/v1/account autenticado
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: '/api/v1/account',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(deleteRes.statusCode).toBe(200);
    const deleteBody = JSON.parse(deleteRes.payload);
    expect(deleteBody.status).toBe('success');

    // 5. Verifica se os registros na quarentena foram expurgados (0 registros restantes)
    const quarantinedAfter = await db
      .select()
      .from(quarantinedPseudonyms)
      .where(
        or(
          eq(quarantinedPseudonyms.accountToken, accountToken),
          eq(quarantinedPseudonyms.pseudonym, oldPseudonym),
        ),
      );

    expect(quarantinedAfter.length).toBe(0);

    // 6. Confirma que o usuário e perfil foram excluídos
    const [userAfter] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    expect(userAfter).toBeUndefined();

    const [profileAfter] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.accountToken, accountToken))
      .limit(1);
    expect(profileAfter).toBeUndefined();
  });

  it('1.1: Deve rejeitar com 401 em timing-safe se a Chave Mestra for inválida', async () => {
    const invalidKey = generateRecoveryKey();
    const recoverRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/recover',
      payload: {
        pseudonym: '@inexistente',
        recoveryKey: invalidKey,
        newPassword: 'SomeNewPassword123!',
      },
    });

    expect(recoverRes.statusCode).toBe(401);
    const body = JSON.parse(recoverRes.payload);
    expect(body.status).toBe('error');
    expect(body.message).toBe('Credenciais de recuperação inválidas.');
  });
});
