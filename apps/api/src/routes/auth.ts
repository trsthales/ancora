import crypto from 'node:crypto';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, profiles, sessions, consents, checkins } from '../db/schema/index.js';
import { hashPassword, verifyPassword, getDummyHash } from '../lib/hash.js';
import { generateAvailablePseudonym } from '../lib/pseudonym.js';
import {
  deriveAccountToken,
  deriveLoginToken,
  generateRecoveryKey,
  hashRecoveryKey,
} from '../lib/crypto-token.js';
import { checkAccountLock, recordLoginFailure, recordLoginSuccess } from '../lib/rate-limit.js';

interface CachedRotation {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const recentRotations = new Map<string, CachedRotation>();

function cleanupRotations(): void {
  const now = Date.now();
  for (const [sessionId, item] of recentRotations.entries()) {
    if (now > item.expiresAt) {
      recentRotations.delete(sessionId);
    }
  }
}

const rotationCleanupInterval = setInterval(cleanupRotations, 30 * 1000);
rotationCleanupInterval.unref();

export const registerBodySchema = z.object({
  password: z
    .string()
    .min(8, 'A senha deve conter no mínimo 8 caracteres')
    .max(128, 'A senha deve conter no máximo 128 caracteres'),
  isAdult: z.literal(true, {
    errorMap: () => ({ message: 'É obrigatório ter 18 anos ou mais para utilizar a plataforma.' }),
  }),
  persona: z
    .enum(['navegador', 'apoio'], {
      errorMap: () => ({ message: "A persona deve ser 'navegador' ou 'apoio'." }),
    })
    .default('navegador'),
  termsVersion: z.string().default('2026.1'),
  privacyPolicyVersion: z.string().default('2026.1'),
  healthDataConsent: z.literal(true, {
    errorMap: () => ({
      message:
        'O consentimento explícito para tratamento de dados de saúde e suporte à recuperação é obrigatório.',
    }),
  }),
});

export type RegisterBodyInput = z.infer<typeof registerBodySchema>;

export const loginBodySchema = z.object({
  identifier: z
    .string()
    .min(1, 'O identificador (pseudônimo) é obrigatório')
    .max(50, 'O identificador deve conter no máximo 50 caracteres'),
  password: z
    .string()
    .min(1, 'A senha é obrigatória')
    .max(128, 'A senha deve conter no máximo 128 caracteres'),
});

export type LoginBodyInput = z.infer<typeof loginBodySchema>;

export const recoverBodySchema = z.object({
  pseudonym: z
    .string()
    .min(1, 'O pseudônimo é obrigatório')
    .max(50, 'O pseudônimo deve conter no máximo 50 caracteres'),
  recoveryKey: z
    .string()
    .min(1, 'A chave de recuperação é obrigatória')
    .max(64, 'A chave de recuperação deve conter no máximo 64 caracteres'),
  newPassword: z
    .string()
    .min(8, 'A nova senha deve conter no mínimo 8 caracteres')
    .max(128, 'A nova senha deve conter no máximo 128 caracteres'),
});

export type RecoverBodyInput = z.infer<typeof recoverBodySchema>;

export const refreshBodySchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'O refresh token é obrigatório')
    .max(128, 'O refresh token deve conter no máximo 128 caracteres'),
});

export type RefreshBodyInput = z.infer<typeof refreshBodySchema>;

export const logoutBodySchema = z
  .object({
    refreshToken: z
      .string()
      .max(128, 'O refresh token deve conter no máximo 128 caracteres')
      .optional(),
  })
  .optional();

export type LogoutBodyInput = z.infer<typeof logoutBodySchema>;

export const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /register
  app.post(
    '/register',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: 60 * 1000,
        },
      },
    },
    async (request, reply) => {
      const parseResult = registerBodySchema.safeParse(request.body);

      if (!parseResult.success) {
        const firstMessage = parseResult.error.issues[0]?.message ?? 'Dados de cadastro inválidos.';
        return reply.status(400).send({
          status: 'error',
          message: firstMessage,
          errors: parseResult.error.flatten().fieldErrors,
        });
      }

      const { password, persona, termsVersion, privacyPolicyVersion, healthDataConsent } =
        parseResult.data;

      // 1. Hash da senha com Argon2id ANTES da transação do banco (~250ms de CPU/RAM fora do pool)
      const passwordHash = await hashPassword(password);

      // 2. Gerar Chave Mestra Crockford Base32 e seu hash SHA-256 ANTES da transação
      const recoveryKey = generateRecoveryKey();
      const recoveryKeyHash = hashRecoveryKey(recoveryKey);

      try {
        const registrationResult = await db.transaction(async (tx) => {
          // 3. Gerar pseudônimo automático único e loginToken
          let pseudonym = await generateAvailablePseudonym(tx);
          let loginToken = deriveLoginToken(pseudonym);

          for (let attempt = 0; attempt < 5; attempt++) {
            const [existingUser] = await tx
              .select({ id: users.id })
              .from(users)
              .where(eq(users.loginToken, loginToken))
              .limit(1);

            if (!existingUser) {
              break;
            }
            pseudonym = await generateAvailablePseudonym(tx);
            loginToken = deriveLoginToken(pseudonym);
          }

          // 4. Insert em auth_security.users (Zero-PII absoluto, sem coluna email, tokenVersion 0)
          const [createdUser] = await tx
            .insert(users)
            .values({
              loginToken,
              passwordHash,
              recoveryKeyHash,
              tokenVersion: 0,
              isAdult: true,
              role: 'user',
            })
            .returning({
              id: users.id,
              role: users.role,
              tokenVersion: users.tokenVersion,
              createdAt: users.createdAt,
            });

          if (!createdUser) {
            throw new Error('Falha ao criar o registro de usuário.');
          }

          // 5. Insert em auth_security.consents (Art. 11 LGPD)
          await tx.insert(consents).values({
            userId: createdUser.id,
            termsVersion,
            privacyPolicyVersion,
            healthDataConsent,
          });

          // 6. Insert em recovery_core.profiles
          const accountToken = deriveAccountToken(createdUser.id);

          const [createdProfile] = await tx
            .insert(profiles)
            .values({
              accountToken,
              pseudonym,
              avatarId: 'avatar_default',
              persona,
            })
            .returning({
              id: profiles.id,
              pseudonym: profiles.pseudonym,
              avatarId: profiles.avatarId,
              persona: profiles.persona,
            });

          if (!createdProfile) {
            throw new Error('Falha ao criar o registro de perfil.');
          }

          // 7. Emitir tokens JWT na hora sem profileId e com tv
          const accessToken = app.jwt.sign(
            {
              sub: createdUser.id,
              role: createdUser.role,
              persona: createdProfile.persona,
              tv: createdUser.tokenVersion,
            },
            { expiresIn: '15m' },
          );

          const refreshToken = crypto.randomBytes(32).toString('hex');
          const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

          await tx.insert(sessions).values({
            userId: createdUser.id,
            refreshTokenHash,
            expiresAt,
          });

          const createdAtFormatted =
            createdUser.createdAt instanceof Date
              ? createdUser.createdAt.toISOString()
              : new Date(createdUser.createdAt).toISOString();

          return {
            accessToken,
            refreshToken,
            recoveryKey,
            user: {
              id: createdUser.id,
              role: createdUser.role,
              createdAt: createdAtFormatted,
            },
            profile: {
              id: createdProfile.id,
              pseudonym: createdProfile.pseudonym,
              avatarId: createdProfile.avatarId,
              persona: createdProfile.persona,
            },
          };
        });

        return reply.status(201).send({
          status: 'success',
          data: registrationResult,
        });
      } catch (error: unknown) {
        const isUniqueConstraintViolation =
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code?: string }).code === '23505';

        if (isUniqueConstraintViolation) {
          return reply.status(409).send({
            status: 'error',
            message: 'Identificador já cadastrado no sistema.',
          });
        }

        throw error;
      }
    },
  );

  // POST /login
  app.post(
    '/login',
    {
      config: {
        rateLimit: {
          max: 100,
          timeWindow: 60 * 1000,
        },
      },
    },
    async (request, reply) => {
      const parseResult = loginBodySchema.safeParse(request.body);

      if (!parseResult.success) {
        const firstMessage = parseResult.error.issues[0]?.message ?? 'Dados de login inválidos.';
        return reply.status(400).send({
          status: 'error',
          message: firstMessage,
          errors: parseResult.error.flatten().fieldErrors,
        });
      }

      const { identifier, password } = parseResult.data;
      const loginToken = deriveLoginToken(identifier);

      // Balde 2: Anti-força bruta por pseudônimo (trava de 5 falhas por 15 min)
      const lockStatus = checkAccountLock(loginToken);
      if (lockStatus.isLocked) {
        reply.header('Retry-After', lockStatus.retryAfterSeconds);
        return reply.status(429).send({
          status: 'error',
          message:
            'Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em 15 minutos.',
        });
      }

      const [user] = await db.select().from(users).where(eq(users.loginToken, loginToken)).limit(1);

      if (!user) {
        recordLoginFailure(loginToken);
        // Executa dummy hash do Argon2id (tempo equiparado anti-timing attack)
        await verifyPassword(getDummyHash(), password).catch(() => false);
        return reply.status(401).send({
          status: 'error',
          message: 'Credenciais inválidas.',
        });
      }

      const isPasswordValid = await verifyPassword(user.passwordHash, password);
      if (!isPasswordValid) {
        recordLoginFailure(loginToken);
        return reply.status(401).send({
          status: 'error',
          message: 'Credenciais inválidas.',
        });
      }

      recordLoginSuccess(loginToken);

      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.accountToken, deriveAccountToken(user.id)))
        .limit(1);

      if (!profile) {
        return reply.status(404).send({
          status: 'error',
          message: 'Perfil de usuário não encontrado.',
        });
      }

      const accessToken = app.jwt.sign(
        {
          sub: user.id,
          role: user.role,
          persona: profile.persona,
          tv: user.tokenVersion,
        },
        { expiresIn: '15m' },
      );

      const refreshToken = crypto.randomBytes(32).toString('hex');
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

      await db.insert(sessions).values({
        userId: user.id,
        refreshTokenHash,
        expiresAt,
      });

      const userCreatedAtFormatted =
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : new Date(user.createdAt).toISOString();

      return reply.status(200).send({
        status: 'success',
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            role: user.role,
            createdAt: userCreatedAtFormatted,
          },
          profile: {
            id: profile.id,
            pseudonym: profile.pseudonym,
            avatarId: profile.avatarId,
            persona: profile.persona,
          },
        },
      });
    },
  );

  // POST /recover
  app.post(
    '/recover',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 60 * 1000,
        },
      },
    },
    async (request, reply) => {
      const parseResult = recoverBodySchema.safeParse(request.body);

      if (!parseResult.success) {
        const firstMessage =
          parseResult.error.issues[0]?.message ?? 'Dados de recuperação inválidos.';
        return reply.status(400).send({
          status: 'error',
          message: firstMessage,
          errors: parseResult.error.flatten().fieldErrors,
        });
      }

      const { pseudonym, recoveryKey, newPassword } = parseResult.data;
      const loginToken = deriveLoginToken(pseudonym);

      const [user] = await db.select().from(users).where(eq(users.loginToken, loginToken)).limit(1);

      if (!user) {
        // Anti-timing attack dummy hash
        await verifyPassword(getDummyHash(), newPassword).catch(() => false);
        return reply.status(401).send({
          status: 'error',
          message: 'Credenciais de recuperação inválidas.',
        });
      }

      let providedKeyHash: string;
      try {
        providedKeyHash = hashRecoveryKey(recoveryKey);
      } catch {
        await verifyPassword(getDummyHash(), newPassword).catch(() => false);
        return reply.status(401).send({
          status: 'error',
          message: 'Credenciais de recuperação inválidas.',
        });
      }

      const isKeyValid =
        providedKeyHash.length === user.recoveryKeyHash.length &&
        crypto.timingSafeEqual(Buffer.from(providedKeyHash), Buffer.from(user.recoveryKeyHash));

      if (!isKeyValid) {
        await verifyPassword(getDummyHash(), newPassword).catch(() => false);
        return reply.status(401).send({
          status: 'error',
          message: 'Credenciais de recuperação inválidas.',
        });
      }

      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.accountToken, deriveAccountToken(user.id)))
        .limit(1);

      if (!profile) {
        return reply.status(404).send({
          status: 'error',
          message: 'Perfil de usuário não encontrado.',
        });
      }

      const newPasswordHash = await hashPassword(newPassword);
      const newRecoveryKey = generateRecoveryKey();
      const newRecoveryKeyHash = hashRecoveryKey(newRecoveryKey);
      const nextTokenVersion = (user.tokenVersion ?? 0) + 1;

      const accessToken = app.jwt.sign(
        {
          sub: user.id,
          role: user.role,
          persona: profile.persona,
          tv: nextTokenVersion,
        },
        { expiresIn: '15m' },
      );

      const refreshToken = crypto.randomBytes(32).toString('hex');
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

      await db.transaction(async (tx) => {
        // 1. Redefine a senha, a chave de recuperação e incrementa token_version
        await tx
          .update(users)
          .set({
            passwordHash: newPasswordHash,
            recoveryKeyHash: newRecoveryKeyHash,
            tokenVersion: nextTokenVersion,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        // 2. Revoga todas as sessões anteriores
        await tx
          .update(sessions)
          .set({ revokedAt: new Date() })
          .where(and(eq(sessions.userId, user.id), isNull(sessions.revokedAt)));

        // 3. Insere a nova sessão
        await tx.insert(sessions).values({
          userId: user.id,
          refreshTokenHash,
          expiresAt,
        });
      });

      const userCreatedAtFormatted =
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : new Date(user.createdAt).toISOString();

      return reply.status(200).send({
        status: 'success',
        data: {
          accessToken,
          refreshToken,
          recoveryKey: newRecoveryKey,
          user: {
            id: user.id,
            role: user.role,
            createdAt: userCreatedAtFormatted,
          },
          profile: {
            id: profile.id,
            pseudonym: profile.pseudonym,
            avatarId: profile.avatarId,
            persona: profile.persona,
          },
        },
      });
    },
  );

  // GET /me
  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.sub;

    const [user] = await db
      .select({
        id: users.id,
        role: users.role,
        isAdult: users.isAdult,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return reply.status(401).send({
        status: 'error',
        message: 'Usuário não encontrado.',
      });
    }

    const [profile] = await db
      .select({
        id: profiles.id,
        pseudonym: profiles.pseudonym,
        avatarId: profiles.avatarId,
        persona: profiles.persona,
        lastSeenAt: profiles.lastSeenAt,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(eq(profiles.accountToken, deriveAccountToken(userId)))
      .limit(1);

    if (!profile) {
      return reply.status(404).send({
        status: 'error',
        message: 'Perfil não encontrado.',
      });
    }

    const userCreatedAtFormatted =
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : new Date(user.createdAt).toISOString();

    const profileLastSeenAtFormatted = profile.lastSeenAt
      ? profile.lastSeenAt instanceof Date
        ? profile.lastSeenAt.toISOString()
        : new Date(profile.lastSeenAt).toISOString()
      : null;

    const profileCreatedAtFormatted =
      profile.createdAt instanceof Date
        ? profile.createdAt.toISOString()
        : new Date(profile.createdAt).toISOString();

    return reply.status(200).send({
      status: 'success',
      data: {
        user: {
          id: user.id,
          role: user.role,
          isAdult: user.isAdult,
          createdAt: userCreatedAtFormatted,
        },
        profile: {
          id: profile.id,
          pseudonym: profile.pseudonym,
          avatarId: profile.avatarId,
          persona: profile.persona,
          lastSeenAt: profileLastSeenAtFormatted,
          createdAt: profileCreatedAtFormatted,
        },
      },
    });
  });

  // POST /refresh
  app.post('/refresh', async (request, reply) => {
    const parseResult = refreshBodySchema.safeParse(request.body);

    if (!parseResult.success) {
      const firstMessage = parseResult.error.issues[0]?.message ?? 'Refresh token inválido.';
      return reply.status(400).send({
        status: 'error',
        message: firstMessage,
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { refreshToken } = parseResult.data;
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const result = await db.transaction(async (tx) => {
      // Busca da sessão dentro de db.transaction usando lock pessimista (.for('update'))
      const [session] = await tx
        .select()
        .from(sessions)
        .where(eq(sessions.refreshTokenHash, tokenHash))
        .for('update')
        .limit(1);

      if (!session) {
        return {
          statusCode: 401,
          body: {
            status: 'error',
            message: 'Refresh token inválido ou expirado.',
          },
        };
      }

      // Se session.revokedAt !== null:
      if (session.revokedAt !== null) {
        const elapsedSeconds = (Date.now() - session.revokedAt.getTime()) / 1000;

        // Se elapsedSeconds <= 10 e session.rotatedToSessionId !== null:
        // Trata-se de retry legítimo de rede móvel (4G). Não revogar sessões e manter estrita idempotência!
        if (elapsedSeconds <= 10 && session.rotatedToSessionId !== null) {
          // Idempotência estrita: verificar se os tokens gerados estão no cache em memória
          const cached = recentRotations.get(session.id);
          if (cached) {
            return {
              statusCode: 200,
              body: {
                status: 'success',
                data: {
                  accessToken: cached.accessToken,
                  refreshToken: cached.refreshToken,
                },
              },
            };
          }

          // Se não estiver no cache em memória, busca sucessora ativa e gera novo par legítimo
          const [successorSession] = await tx
            .select()
            .from(sessions)
            .where(eq(sessions.id, session.rotatedToSessionId))
            .limit(1);

          if (!successorSession || successorSession.revokedAt !== null) {
            await tx
              .update(sessions)
              .set({ revokedAt: new Date() })
              .where(and(eq(sessions.userId, session.userId), isNull(sessions.revokedAt)));

            return {
              statusCode: 401,
              body: {
                status: 'error',
                message: 'Tentativa de reúso de refresh token detectada.',
              },
            };
          }

          const [user] = await tx.select().from(users).where(eq(users.id, session.userId)).limit(1);

          const [profile] = await tx
            .select()
            .from(profiles)
            .where(eq(profiles.accountToken, deriveAccountToken(session.userId)))
            .limit(1);

          if (!user || !profile) {
            return {
              statusCode: 401,
              body: {
                status: 'error',
                message: 'Usuário ou perfil não encontrado.',
              },
            };
          }

          const activeAccessToken = app.jwt.sign(
            {
              sub: user.id,
              role: user.role,
              persona: profile.persona,
              tv: user.tokenVersion,
            },
            { expiresIn: '15m' },
          );

          const successorRefreshToken = crypto.randomBytes(32).toString('hex');
          const successorRefreshTokenHash = crypto
            .createHash('sha256')
            .update(successorRefreshToken)
            .digest('hex');

          await tx
            .update(sessions)
            .set({ refreshTokenHash: successorRefreshTokenHash })
            .where(eq(sessions.id, successorSession.id));

          recentRotations.set(session.id, {
            accessToken: activeAccessToken,
            refreshToken: successorRefreshToken,
            expiresAt: Date.now() + 15 * 1000,
          });

          return {
            statusCode: 200,
            body: {
              status: 'success',
              data: {
                accessToken: activeAccessToken,
                refreshToken: successorRefreshToken,
              },
            },
          };
        }

        // Se elapsedSeconds > 10: Violação real de segurança (reúso tardio).
        // Revogar imediatamente todas as sessões ativas do usuário e retornar HTTP 401.
        await tx
          .update(sessions)
          .set({ revokedAt: new Date() })
          .where(and(eq(sessions.userId, session.userId), isNull(sessions.revokedAt)));

        return {
          statusCode: 401,
          body: {
            status: 'error',
            message: 'Tentativa de reúso de refresh token detectada.',
          },
        };
      }

      // Checar expiração
      if (new Date() > new Date(session.expiresAt)) {
        return {
          statusCode: 401,
          body: {
            status: 'error',
            message: 'Refresh token expirado.',
          },
        };
      }

      // Se a sessão for válida (ativa):
      const [user] = await tx.select().from(users).where(eq(users.id, session.userId)).limit(1);

      const [profile] = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.accountToken, deriveAccountToken(session.userId)))
        .limit(1);

      if (!user || !profile) {
        return {
          statusCode: 401,
          body: {
            status: 'error',
            message: 'Usuário ou perfil não encontrado.',
          },
        };
      }

      const newRefreshToken = crypto.randomBytes(32).toString('hex');
      const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

      // Criar nova sessão em auth_security.sessions
      const [newSession] = await tx
        .insert(sessions)
        .values({
          userId: user.id,
          refreshTokenHash: newRefreshTokenHash,
          expiresAt,
        })
        .returning({ id: sessions.id });

      if (!newSession) {
        throw new Error('Falha ao criar nova sessão.');
      }

      // Atualizar sessão atual: revokedAt = NOW() e rotatedToSessionId = newSession.id
      await tx
        .update(sessions)
        .set({
          revokedAt: new Date(),
          rotatedToSessionId: newSession.id,
        })
        .where(eq(sessions.id, session.id));

      const newAccessToken = app.jwt.sign(
        {
          sub: user.id,
          role: user.role,
          persona: profile.persona,
          tv: user.tokenVersion,
        },
        { expiresIn: '15m' },
      );

      recentRotations.set(session.id, {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: Date.now() + 15 * 1000,
      });

      return {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          },
        },
      };
    });

    return reply.status(result.statusCode).send(result.body);
  });

  // POST /logout
  app.post('/logout', async (request, reply) => {
    const body = logoutBodySchema.safeParse(request.body).data;
    const refreshToken = body?.refreshToken;

    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(sessions.refreshTokenHash, tokenHash), isNull(sessions.revokedAt)));

      return reply.status(200).send({
        status: 'success',
        message: 'Sessão encerrada com sucesso.',
      });
    }

    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        await request.jwtVerify();
        const userId = request.user.sub;
        await db
          .update(sessions)
          .set({ revokedAt: new Date() })
          .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));

        return reply.status(200).send({
          status: 'success',
          message: 'Sessão encerrada com sucesso.',
        });
      } catch {
        return reply.status(401).send({
          status: 'error',
          message: 'Token de autenticação inválido ou expirado.',
        });
      }
    }

    return reply.status(400).send({
      status: 'error',
      message: 'Refresh token ou token de autenticação deve ser fornecido.',
    });
  });

  // DELETE /account (Direito ao Esquecimento - Art. 18, VI da LGPD)
  app.delete('/account', { preHandler: [app.authenticate] }, deleteAccountHandler);
};

export const deleteAccountHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = request.user.sub;
  const accountToken = deriveAccountToken(userId);

  await db.transaction(async (tx) => {
    // 1. Buscar o perfil pelo accountToken para obter o profileId
    const [profile] = await tx
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.accountToken, accountToken))
      .limit(1);

    // 2. Deletar todos os check-ins associados ao profileId em recovery_core.checkins
    if (profile) {
      await tx.delete(checkins).where(eq(checkins.profileId, profile.id));
      // 3. Deletar o perfil em recovery_core.profiles
      await tx.delete(profiles).where(eq(profiles.id, profile.id));
    }

    // 4. Deletar todas as sessões em auth_security.sessions para o userId
    await tx.delete(sessions).where(eq(sessions.userId, userId));

    // 5. Deletar os consentimentos em auth_security.consents
    await tx.delete(consents).where(eq(consents.userId, userId));

    // 6. Deletar o usuário em auth_security.users
    await tx.delete(users).where(eq(users.id, userId));
  });

  return reply.status(200).send({
    status: 'success',
    message:
      'Conta e dados associados foram expurgados definitivamente em conformidade com o Art. 18, VI da LGPD.',
  });
};
