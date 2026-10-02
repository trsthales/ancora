import crypto from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, profiles, sessions } from '../db/schema/index.js';
import { hashPassword, verifyPassword } from '../lib/hash.js';
import { generatePseudonym } from '../lib/pseudonym.js';
import {
  deriveAccountToken,
  deriveLoginToken,
  generateRecoveryKey,
  hashRecoveryKey,
} from '../lib/crypto-token.js';

const DUMMY_ARGON2_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$FTM81xsLNE3c35g2zCioug$iwShqiajdwCymhF/NElrqUSNQAdTwMknCCrvCAcsc/M';

export const registerBodySchema = z.object({
  email: z
    .string()
    .email('E-mail inválido')
    .transform((val) => val.toLowerCase().trim())
    .optional(),
  password: z.string().min(8, 'A senha deve conter no mínimo 8 caracteres'),
  isAdult: z.literal(true, {
    errorMap: () => ({ message: 'É obrigatório ter 18 anos ou mais para utilizar a plataforma.' }),
  }),
  persona: z
    .enum(['navegador', 'apoio'], {
      errorMap: () => ({ message: "A persona deve ser 'navegador' ou 'apoio'." }),
    })
    .default('navegador'),
});

export type RegisterBodyInput = z.infer<typeof registerBodySchema>;

export const loginBodySchema = z.object({
  identifier: z.string().min(1, 'O identificador (pseudônimo) é obrigatório'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export type LoginBodyInput = z.infer<typeof loginBodySchema>;

export const recoverBodySchema = z.object({
  pseudonym: z.string().min(1, 'O pseudônimo é obrigatório'),
  recoveryKey: z.string().min(1, 'A chave de recuperação é obrigatória'),
  newPassword: z.string().min(8, 'A nova senha deve conter no mínimo 8 caracteres'),
});

export type RecoverBodyInput = z.infer<typeof recoverBodySchema>;

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1, 'O refresh token é obrigatório'),
});

export type RefreshBodyInput = z.infer<typeof refreshBodySchema>;

export const logoutBodySchema = z
  .object({
    refreshToken: z.string().optional(),
  })
  .optional();

export type LogoutBodyInput = z.infer<typeof logoutBodySchema>;

export class EmailConflictError extends Error {
  constructor(message = 'E-mail já cadastrado no sistema.') {
    super(message);
    this.name = 'EmailConflictError';
  }
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /register
  app.post('/register', async (request, reply) => {
    const parseResult = registerBodySchema.safeParse(request.body);

    if (!parseResult.success) {
      const firstMessage = parseResult.error.issues[0]?.message ?? 'Dados de cadastro inválidos.';
      return reply.status(400).send({
        status: 'error',
        message: firstMessage,
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { email, password, persona } = parseResult.data;

    try {
      const registrationResult = await db.transaction(async (tx) => {
        // 1. Checar unicidade do e-mail (caso fornecido)
        if (email) {
          const [existingUser] = await tx
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (existingUser) {
            throw new EmailConflictError('E-mail já cadastrado no sistema.');
          }
        }

        // 2. Hash da senha com Argon2id
        const passwordHash = await hashPassword(password);

        // 3. Gerar Chave Mestra de Recuperação e seu hash
        const recoveryKey = generateRecoveryKey();
        const recoveryKeyHash = hashRecoveryKey(recoveryKey);

        // 4. Gerar pseudônimo automático único e loginToken
        let pseudonym = generatePseudonym();
        let loginToken = deriveLoginToken(pseudonym);

        for (let attempt = 0; attempt < 5; attempt++) {
          const [existingProfile] = await tx
            .select({ id: profiles.id })
            .from(profiles)
            .where(eq(profiles.pseudonym, pseudonym))
            .limit(1);

          const [existingUser] = await tx
            .select({ id: users.id })
            .from(users)
            .where(eq(users.loginToken, loginToken))
            .limit(1);

          if (!existingProfile && !existingUser) {
            break;
          }
          pseudonym = generatePseudonym();
          loginToken = deriveLoginToken(pseudonym);
        }

        // 5. Insert em auth_security.users
        const [createdUser] = await tx
          .insert(users)
          .values({
            email: email ?? null,
            loginToken,
            passwordHash,
            recoveryKeyHash,
            isAdult: true,
            role: 'user',
          })
          .returning({
            id: users.id,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
          });

        if (!createdUser) {
          throw new Error('Falha ao criar o registro de usuário.');
        }

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

        // 7. Emitir tokens JWT na hora (R11)
        const accessToken = app.jwt.sign(
          {
            sub: createdUser.id,
            profileId: createdProfile.id,
            role: createdUser.role,
            persona: createdProfile.persona,
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
            email: createdUser.email,
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

      if (error instanceof EmailConflictError || isUniqueConstraintViolation) {
        return reply.status(409).send({
          status: 'error',
          message: 'E-mail ou identificador já cadastrado no sistema.',
        });
      }

      request.log.error(error, 'Falha ao registrar novo usuário');
      return reply.status(500).send({
        status: 'error',
        message: 'Erro interno ao processar o registro.',
      });
    }
  });

  // POST /login
  app.post('/login', async (request, reply) => {
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

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.loginToken, loginToken))
      .limit(1);

    if (!user) {
      // Executa dummy hash do Argon2id (tempo equiparado anti-timing attack)
      await verifyPassword(DUMMY_ARGON2_HASH, password).catch(() => false);
      return reply.status(401).send({
        status: 'error',
        message: 'Credenciais inválidas.',
      });
    }

    const isPasswordValid = await verifyPassword(user.passwordHash, password);
    if (!isPasswordValid) {
      return reply.status(401).send({
        status: 'error',
        message: 'Credenciais inválidas.',
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

    const accessToken = app.jwt.sign(
      {
        sub: user.id,
        profileId: profile.id,
        role: user.role,
        persona: profile.persona,
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
          email: user.email,
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
  });

  // POST /recover
  app.post('/recover', async (request, reply) => {
    const parseResult = recoverBodySchema.safeParse(request.body);

    if (!parseResult.success) {
      const firstMessage = parseResult.error.issues[0]?.message ?? 'Dados de recuperação inválidos.';
      return reply.status(400).send({
        status: 'error',
        message: firstMessage,
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { pseudonym, recoveryKey, newPassword } = parseResult.data;
    const loginToken = deriveLoginToken(pseudonym);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.loginToken, loginToken))
      .limit(1);

    if (!user) {
      // Anti-timing attack dummy hash
      await verifyPassword(DUMMY_ARGON2_HASH, newPassword).catch(() => false);
      return reply.status(401).send({
        status: 'error',
        message: 'Credenciais de recuperação inválidas.',
      });
    }

    const providedKeyHash = hashRecoveryKey(recoveryKey);
    const isKeyValid =
      providedKeyHash.length === user.recoveryKeyHash.length &&
      crypto.timingSafeEqual(Buffer.from(providedKeyHash), Buffer.from(user.recoveryKeyHash));

    if (!isKeyValid) {
      await verifyPassword(DUMMY_ARGON2_HASH, newPassword).catch(() => false);
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

    const accessToken = app.jwt.sign(
      {
        sub: user.id,
        profileId: profile.id,
        role: user.role,
        persona: profile.persona,
      },
      { expiresIn: '15m' },
    );

    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    await db.transaction(async (tx) => {
      // 1. Redefine a senha e a chave de recuperação
      await tx
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          recoveryKeyHash: newRecoveryKeyHash,
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
          email: user.email,
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
  });

  // GET /me
  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.sub;

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
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

    const profileLastSeenAtFormatted =
      profile.lastSeenAt instanceof Date
        ? profile.lastSeenAt.toISOString()
        : new Date(profile.lastSeenAt).toISOString();

    const profileCreatedAtFormatted =
      profile.createdAt instanceof Date
        ? profile.createdAt.toISOString()
        : new Date(profile.createdAt).toISOString();

    return reply.status(200).send({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
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

    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.refreshTokenHash, tokenHash))
      .limit(1);

    if (!session) {
      return reply.status(401).send({
        status: 'error',
        message: 'Refresh token inválido ou expirado.',
      });
    }

    // Detecção de Reúso (RTR - Refresh Token Rotation):
    // Se a sessão encontrada já estiver com revokedAt !== null, significa que um token antigo vazou.
    // Revogue todas as sessões do usuário imediatamente e retorne HTTP 401.
    if (session.revokedAt !== null) {
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(eq(sessions.userId, session.userId));

      return reply.status(401).send({
        status: 'error',
        message: 'Tentativa de reúso de refresh token detectada. Todas as sessões foram revogadas.',
      });
    }

    // Checar expiração
    if (new Date() > new Date(session.expiresAt)) {
      return reply.status(401).send({
        status: 'error',
        message: 'Refresh token expirado.',
      });
    }

    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.accountToken, deriveAccountToken(session.userId)))
      .limit(1);

    if (!user || !profile) {
      return reply.status(401).send({
        status: 'error',
        message: 'Usuário ou perfil não encontrado.',
      });
    }

    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    await db.transaction(async (tx) => {
      // 1. Marca a sessão atual como revogada
      await tx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, session.id));

      // 2. Grava nova sessão no banco
      await tx.insert(sessions).values({
        userId: user.id,
        refreshTokenHash: newRefreshTokenHash,
        expiresAt,
      });
    });

    // 3. Emite novo accessToken
    const newAccessToken = app.jwt.sign(
      {
        sub: user.id,
        profileId: profile.id,
        role: user.role,
        persona: profile.persona,
      },
      { expiresIn: '15m' },
    );

    return reply.status(200).send({
      status: 'success',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
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
};
