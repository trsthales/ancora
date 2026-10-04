import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, profiles, quarantinedPseudonyms } from '../db/schema/index.js';
import { AVAILABLE_AVATARS, AVATAR_IDS } from '../lib/avatars.js';
import { generateAvailablePseudonym } from '../lib/pseudonym.js';
import { deriveAccountToken, deriveLoginToken } from '../lib/crypto-token.js';

export const rotateIdentitySchema = z.object({
  avatarId: z
    .enum(AVATAR_IDS, {
      errorMap: () => ({ message: 'Avatar selecionado inválido.' }),
    })
    .optional(),
  regeneratePseudonym: z.boolean().default(false),
});

export type RotateIdentityInput = z.infer<typeof rotateIdentitySchema>;

export const profileRoutes: FastifyPluginAsync = async (app) => {
  // GET /avatars - Catálogo público de avatares neutros
  app.get('/avatars', async (_request, reply) => {
    return reply.status(200).send({
      status: 'success',
      data: AVAILABLE_AVATARS,
    });
  });

  // GET /me - Perfil comunitário do usuário logado
  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.sub;

    const [profile] = await db
      .select({
        id: profiles.id,
        pseudonym: profiles.pseudonym,
        avatarId: profiles.avatarId,
        persona: profiles.persona,
        createdAt: profiles.createdAt,
        lastSeenAt: profiles.lastSeenAt,
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

    const createdAtFormatted =
      profile.createdAt instanceof Date
        ? profile.createdAt.toISOString()
        : new Date(profile.createdAt).toISOString();

    const lastSeenAtFormatted = profile.lastSeenAt
      ? profile.lastSeenAt instanceof Date
        ? profile.lastSeenAt.toISOString()
        : new Date(profile.lastSeenAt).toISOString()
      : null;

    return reply.status(200).send({
      status: 'success',
      data: {
        id: profile.id,
        pseudonym: profile.pseudonym,
        avatarId: profile.avatarId,
        persona: profile.persona,
        createdAt: createdAtFormatted,
        lastSeenAt: lastSeenAtFormatted,
      },
    });
  });

  // POST /rotate-identity - Rotação atômica de pseudônimo e/ou avatar
  app.post('/rotate-identity', { preHandler: [app.authenticate] }, async (request, reply) => {
    const parseResult = rotateIdentitySchema.safeParse(request.body ?? {});

    if (!parseResult.success) {
      const firstMessage = parseResult.error.issues[0]?.message ?? 'Dados inválidos.';
      return reply.status(400).send({
        status: 'error',
        message: firstMessage,
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { avatarId, regeneratePseudonym } = parseResult.data;
    const userId = request.user.sub;

    const result = await db.transaction(async (tx) => {
      const [currentProfile] = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.accountToken, deriveAccountToken(userId)))
        .for('update')
        .limit(1);

      if (!currentProfile) {
        return { error: 404, message: 'Perfil não encontrado.' };
      }

      let newPseudonym: string | undefined;

      if (regeneratePseudonym) {
        newPseudonym = await generateAvailablePseudonym(tx);

        // 1. Inserir o pseudônimo antigo na quarentena por 30 dias
        const quarantinedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await tx
          .insert(quarantinedPseudonyms)
          .values({
            pseudonym: currentProfile.pseudonym,
            quarantinedUntil,
          })
          .onConflictDoUpdate({
            target: quarantinedPseudonyms.pseudonym,
            set: { quarantinedUntil },
          });

        // 2. Atualizar atomicamente o loginToken na tabela users
        const newLoginToken = deriveLoginToken(newPseudonym);
        await tx
          .update(users)
          .set({
            loginToken: newLoginToken,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }

      const updateData: {
        pseudonym?: string;
        avatarId?: string;
        lastSeenAt?: Date;
      } = {
        lastSeenAt: new Date(),
      };

      if (newPseudonym) {
        updateData.pseudonym = newPseudonym;
      }

      if (avatarId) {
        updateData.avatarId = avatarId;
      }

      const [updatedProfile] = await tx
        .update(profiles)
        .set(updateData)
        .where(eq(profiles.id, currentProfile.id))
        .returning();

      return { success: true, updatedProfile };
    });

    if ('error' in result && result.error) {
      return reply.status(result.error).send({
        status: 'error',
        message: result.message,
      });
    }

    const { updatedProfile } = result as { updatedProfile: typeof profiles.$inferSelect };

    return reply.status(200).send({
      status: 'success',
      message: 'Identidade comunitária renovada com sucesso.',
      data: {
        profile: {
          id: updatedProfile.id,
          pseudonym: updatedProfile.pseudonym,
          avatarId: updatedProfile.avatarId,
          persona: updatedProfile.persona,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  });
};
