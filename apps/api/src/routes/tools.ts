import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  profiles,
  myTools,
  habits,
  profileNotificationCounters,
} from '../db/schema/index.js';
import { deriveAccountToken } from '../lib/crypto-token.js';
import { ALL_CANONICAL_CHIP_IDS } from '../constants/chips.js';

export const deleteToolParamsSchema = z.object({
  chipId: z
    .string()
    .refine((val) => (ALL_CANONICAL_CHIP_IDS as readonly string[]).includes(val), {
      message: 'Identificador de chip inválido ou inexistente no catálogo oficial.',
    }),
});

export const ackNotificationSchema = z.object({
  type: z.enum(['inspiration', 'support'], {
    errorMap: () => ({
      message: 'Tipo de notificação inválido. Escolha entre inspiration ou support.',
    }),
  }),
});

export type AckNotificationInput = z.infer<typeof ackNotificationSchema>;

async function resolveProfile(userId: string) {
  const accountToken = deriveAccountToken(userId);
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.accountToken, accountToken))
    .limit(1);

  return profile ?? null;
}

export async function getToolsHandler(request: FastifyRequest, reply: FastifyReply) {
  const profile = await resolveProfile(request.user.sub);
  if (!profile) {
    return reply.status(404).send({
      status: 'error',
      message: 'Perfil de usuário não encontrado.',
    });
  }

  const userTools = await db
    .select()
    .from(myTools)
    .where(eq(myTools.profileId, profile.id))
    .orderBy(desc(myTools.savedAt));

  const protectionPlan = userTools.filter((t) => t.category === 'EVITO').map((t) => t.chipId);
  const myToolsList = userTools.filter((t) => t.category === 'ME_AJUDA').map((t) => t.chipId);
  const savedHabits = userTools.filter((t) => t.category === 'FACO').map((t) => t.chipId);

  return reply.status(200).send({
    status: 'success',
    data: {
      protectionPlan,
      myTools: myToolsList,
      savedHabits,
    },
  });
}

export async function deleteToolHandler(request: FastifyRequest, reply: FastifyReply) {
  const parseResult = deleteToolParamsSchema.safeParse(request.params);
  if (!parseResult.success) {
    const firstMessage =
      parseResult.error.issues[0]?.message ?? 'Identificador de chip inválido.';
    return reply.status(400).send({
      status: 'error',
      message: firstMessage,
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const { chipId } = parseResult.data;
  const profile = await resolveProfile(request.user.sub);
  if (!profile) {
    return reply.status(404).send({
      status: 'error',
      message: 'Perfil de usuário não encontrado.',
    });
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(myTools)
      .where(and(eq(myTools.profileId, profile.id), eq(myTools.chipId, chipId)));

    // Se o chip também estiver em habits, remove para consistência em cascata
    await tx
      .delete(habits)
      .where(and(eq(habits.profileId, profile.id), eq(habits.chipId, chipId)));
  });

  return reply.status(200).send({
    status: 'success',
    message: 'Ferramenta removida da sua caixa pessoal com sucesso.',
  });
}

export async function getBatchNotificationsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const profile = await resolveProfile(request.user.sub);
  if (!profile) {
    return reply.status(404).send({
      status: 'error',
      message: 'Perfil de usuário não encontrado.',
    });
  }

  const [counter] = await db
    .select()
    .from(profileNotificationCounters)
    .where(eq(profileNotificationCounters.profileId, profile.id))
    .limit(1);

  const hasInspirationCard = (counter?.unreadInspirations ?? 0) >= 3;
  const hasSupportCard = (counter?.unreadSupports ?? 0) >= 3;

  return reply.status(200).send({
    status: 'success',
    data: {
      hasInspirationCard,
      hasSupportCard,
      inspirationMessage: hasInspirationCard
        ? 'Suas partilhas inspiraram algumas pessoas.'
        : null,
      supportMessage: hasSupportCard
        ? 'Algumas pessoas estão com você hoje.'
        : null,
    },
  });
}

export async function ackNotificationHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parseResult = ackNotificationSchema.safeParse(request.body ?? {});
  if (!parseResult.success) {
    const firstMessage =
      parseResult.error.issues[0]?.message ?? 'Dados inválidos.';
    return reply.status(400).send({
      status: 'error',
      message: firstMessage,
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const profile = await resolveProfile(request.user.sub);
  if (!profile) {
    return reply.status(404).send({
      status: 'error',
      message: 'Perfil de usuário não encontrado.',
    });
  }

  const { type } = parseResult.data;

  if (type === 'inspiration') {
    await db
      .update(profileNotificationCounters)
      .set({ unreadInspirations: 0, updatedAt: new Date() })
      .where(eq(profileNotificationCounters.profileId, profile.id));
  } else if (type === 'support') {
    await db
      .update(profileNotificationCounters)
      .set({ unreadSupports: 0, updatedAt: new Date() })
      .where(eq(profileNotificationCounters.profileId, profile.id));
  }

  return reply.status(200).send({
    status: 'success',
    message: 'Notificação confirmada e zerada.',
  });
}

export const toolsRoutes: FastifyPluginAsync = async (app) => {
  if (app.prefix.endsWith('/tools')) {
    app.get('/', { preHandler: [app.authenticate] }, getToolsHandler);
    app.delete('/:chipId', { preHandler: [app.authenticate] }, deleteToolHandler);
  } else {
    app.get('/tools', { preHandler: [app.authenticate] }, getToolsHandler);
    app.delete('/tools/:chipId', { preHandler: [app.authenticate] }, deleteToolHandler);
    app.get(
      '/notifications/batch',
      { preHandler: [app.authenticate] },
      getBatchNotificationsHandler,
    );
    app.post(
      '/notifications/ack',
      { preHandler: [app.authenticate] },
      ackNotificationHandler,
    );
  }
};

export const notificationsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/batch', { preHandler: [app.authenticate] }, getBatchNotificationsHandler);
  app.post('/ack', { preHandler: [app.authenticate] }, ackNotificationHandler);
};
