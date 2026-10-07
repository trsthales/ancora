import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { checkins, profiles } from '../db/schema/index.js';
import { deriveAccountToken } from '../lib/crypto-token.js';

export const createCheckinSchema = z.object({
  cravingLevel: z
    .number({
      required_error: 'O nível de fissura deve ser um número inteiro de 0 a 5.',
      invalid_type_error: 'O nível de fissura deve ser um número inteiro de 0 a 5.',
    })
    .int('O nível de fissura deve ser um número inteiro de 0 a 5.')
    .min(0, 'O nível de fissura deve ser um número inteiro de 0 a 5.')
    .max(5, 'O nível de fissura deve ser um número inteiro de 0 a 5.'),
  mood: z.enum(['calmo', 'ansioso', 'cansado', 'vulneravel', 'motivado'], {
    errorMap: () => ({
      message: 'Humor inválido. Escolha: calmo, ansioso, cansado, vulneravel ou motivado.',
    }),
  }),
});

export type CreateCheckinInput = z.infer<typeof createCheckinSchema>;

export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(90).default(30),
});

export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;

async function resolveProfileId(userId: string): Promise<string | null> {
  const accountToken = deriveAccountToken(userId);
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.accountToken, accountToken))
    .limit(1);
  return profile ? profile.id : null;
}

export const journeyRoutes: FastifyPluginAsync = async (app) => {
  // POST /checkin - Registra um novo check-in diário
  app.post('/checkin', { preHandler: [app.authenticate] }, async (request, reply) => {
    const parseResult = createCheckinSchema.safeParse(request.body ?? {});

    if (!parseResult.success) {
      const firstMessage = parseResult.error.issues[0]?.message ?? 'Dados de check-in inválidos.';
      return reply.status(400).send({
        status: 'error',
        message: firstMessage,
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const profileId = await resolveProfileId(request.user.sub);

    if (!profileId) {
      return reply.status(404).send({
        status: 'error',
        message: 'Perfil de usuário não encontrado.',
      });
    }

    const { cravingLevel, mood } = parseResult.data;

    const newCheckin = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(checkins)
        .values({
          profileId,
          cravingLevel,
          mood,
        })
        .returning();

      await tx.update(profiles).set({ lastSeenAt: new Date() }).where(eq(profiles.id, profileId));

      return inserted;
    });

    if (!newCheckin) {
      throw new Error('Falha ao registrar check-in.');
    }

    const createdAtFormatted =
      newCheckin.createdAt instanceof Date
        ? newCheckin.createdAt.toISOString()
        : new Date(newCheckin.createdAt).toISOString();

    return reply.status(201).send({
      status: 'success',
      data: {
        checkin: {
          id: newCheckin.id,
          cravingLevel: newCheckin.cravingLevel,
          mood: newCheckin.mood,
          createdAt: createdAtFormatted,
        },
      },
    });
  });

  // GET /today - Consulta o status de check-in do dia atual (fuso America/Sao_Paulo)
  app.get('/today', { preHandler: [app.authenticate] }, async (request, reply) => {
    const profileId = await resolveProfileId(request.user.sub);

    if (!profileId) {
      return reply.status(404).send({
        status: 'error',
        message: 'Perfil de usuário não encontrado.',
      });
    }

    const [todayCheckin] = await db
      .select()
      .from(checkins)
      .where(
        and(
          eq(checkins.profileId, profileId),
          gte(
            checkins.createdAt,
            sql`(date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')) AT TIME ZONE 'America/Sao_Paulo'`,
          ),
        ),
      )
      .orderBy(desc(checkins.createdAt))
      .limit(1);

    const formattedCheckin = todayCheckin
      ? {
          id: todayCheckin.id,
          cravingLevel: todayCheckin.cravingLevel,
          mood: todayCheckin.mood,
          createdAt:
            todayCheckin.createdAt instanceof Date
              ? todayCheckin.createdAt.toISOString()
              : new Date(todayCheckin.createdAt).toISOString(),
        }
      : null;

    return reply.status(200).send({
      status: 'success',
      data: {
        hasCheckedInToday: Boolean(todayCheckin),
        checkin: formattedCheckin,
      },
    });
  });

  // GET /history - Histórico recente de check-ins e total acumulado (fuso America/Sao_Paulo)
  app.get('/history', { preHandler: [app.authenticate] }, async (request, reply) => {
    const queryResult = historyQuerySchema.safeParse(request.query ?? {});

    if (!queryResult.success) {
      const firstMessage =
        queryResult.error.issues[0]?.message ?? 'Parâmetros de histórico inválidos.';
      return reply.status(400).send({
        status: 'error',
        message: firstMessage,
        errors: queryResult.error.flatten().fieldErrors,
      });
    }

    const { limit } = queryResult.data;
    const profileId = await resolveProfileId(request.user.sub);

    if (!profileId) {
      return reply.status(404).send({
        status: 'error',
        message: 'Perfil de usuário não encontrado.',
      });
    }

    const rawHistory = await db
      .select()
      .from(checkins)
      .where(eq(checkins.profileId, profileId))
      .orderBy(desc(checkins.createdAt))
      .limit(limit);

    const [countResult] = await db
      .select({
        count: sql<number>`cast(count(distinct (created_at at time zone 'America/Sao_Paulo')::date) as integer)`,
      })
      .from(checkins)
      .where(eq(checkins.profileId, profileId));

    const totalCheckins = Number(countResult?.count ?? 0);

    const history = rawHistory.map((item) => ({
      id: item.id,
      cravingLevel: item.cravingLevel,
      mood: item.mood,
      createdAt:
        item.createdAt instanceof Date
          ? item.createdAt.toISOString()
          : new Date(item.createdAt).toISOString(),
    }));

    return reply.status(200).send({
      status: 'success',
      data: {
        totalCheckins,
        history,
      },
    });
  });
};
