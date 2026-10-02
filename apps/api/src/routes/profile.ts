import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { profiles } from '../db/schema/index.js';
import { AVAILABLE_AVATARS, AVATAR_IDS } from '../lib/avatars.js';
import { generatePseudonym } from '../lib/pseudonym.js';
import { deriveAccountToken } from '../lib/crypto-token.js';

export const rotateIdentitySchema = z.object({
  avatarId: z
    .enum(AVATAR_IDS, {
      errorMap: () => ({ message: 'Avatar selecionado inválido.' }),
    })
    .optional(),
  regeneratePseudonym: z.boolean().default(true),
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

    const lastSeenAtFormatted =
      profile.lastSeenAt instanceof Date
        ? profile.lastSeenAt.toISOString()
        : new Date(profile.lastSeenAt).toISOString();

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

    try {
      let newPseudonym: string | undefined;

      if (regeneratePseudonym) {
        newPseudonym = generatePseudonym();
        for (let attempt = 0; attempt < 5; attempt++) {
          const [existingProfile] = await db
            .select({ id: profiles.id })
            .from(profiles)
            .where(eq(profiles.pseudonym, newPseudonym))
            .limit(1);

          if (!existingProfile) {
            break;
          }
          newPseudonym = generatePseudonym();
        }
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

      const [updatedProfile] = await db
        .update(profiles)
        .set(updateData)
        .where(eq(profiles.accountToken, deriveAccountToken(userId)))
        .returning();

      if (!updatedProfile) {
        return reply.status(404).send({
          status: 'error',
          message: 'Perfil não encontrado.',
        });
      }

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
    } catch (error: unknown) {
      request.log.error(error, 'Falha ao rotacionar identidade comunitária');
      return reply.status(500).send({
        status: 'error',
        message: 'Erro interno ao processar renovação de identidade.',
      });
    }
  });
};
