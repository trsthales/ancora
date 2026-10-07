import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { habits, habitLogs, profiles } from '../db/schema/index.js';
import { deriveAccountToken } from '../lib/crypto-token.js';
import { FACO_CHIP_IDS } from '../constants/chips.js';
import { isDateKeyWithinTolerance, getTodayDateKey } from '../lib/date-window.js';

export const createHabitSchema = z.object({
  chipId: z.enum(FACO_CHIP_IDS, {
    errorMap: () => ({
      message: 'Chip inválido ou não permitido. Escolha um chip válido do catálogo de hábitos.',
    }),
  }),
});

export const putHabitLogParamsSchema = z.object({
  id: z.string().uuid('ID do hábito deve ser um UUID válido.'),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido. Use YYYY-MM-DD.'),
});

export const putHabitLogBodySchema = z.object({
  completed: z.boolean({
    required_error: 'O campo completed é obrigatório.',
    invalid_type_error: 'O campo completed deve ser um booleano.',
  }),
});

export const deleteHabitParamsSchema = z.object({
  id: z.string().uuid('ID do hábito deve ser um UUID válido.'),
});

async function resolveProfileId(userId: string): Promise<string | null> {
  const accountToken = deriveAccountToken(userId);
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.accountToken, accountToken))
    .limit(1);
  return profile ? profile.id : null;
}

export const habitsRoutes: FastifyPluginAsync = async (app) => {
  // GET / - Lista hábitos ativos do usuário com status de conclusão na data informada
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const profileId = await resolveProfileId(request.user.sub);

    if (!profileId) {
      return reply.status(404).send({
        status: 'error',
        message: 'Perfil de usuário não encontrado.',
      });
    }

    const query = request.query as Record<string, unknown> | undefined;
    const rawDateKey = query?.dateKey;

    let dateKey: string;
    if (typeof rawDateKey === 'string' && rawDateKey.trim() !== '') {
      if (!isDateKeyWithinTolerance(rawDateKey)) {
        return reply.status(400).send({
          status: 'error',
          message: 'Data inválida ou fora da janela de tolerância permitida.',
        });
      }
      dateKey = rawDateKey;
    } else {
      // Data civil brasileira canônica equivalente a (now() AT TIME ZONE 'America/Sao_Paulo')::date
      dateKey = getTodayDateKey('America/Sao_Paulo');
    }

    const userHabits = await db
      .select({
        id: habits.id,
        chipId: habits.chipId,
        createdAt: habits.createdAt,
      })
      .from(habits)
      .where(eq(habits.profileId, profileId))
      .orderBy(habits.createdAt);

    const logs = await db
      .select({
        habitId: habitLogs.habitId,
      })
      .from(habitLogs)
      .where(and(eq(habitLogs.profileId, profileId), eq(habitLogs.dateKey, dateKey)));

    const completedHabitIds = new Set(logs.map((l) => l.habitId));

    const result = userHabits.map((h) => ({
      id: h.id,
      chipId: h.chipId,
      completed: completedHabitIds.has(h.id),
      createdAt:
        h.createdAt instanceof Date
          ? h.createdAt.toISOString()
          : new Date(h.createdAt).toISOString(),
    }));

    return reply.status(200).send({
      status: 'success',
      data: {
        habits: result,
        dateKey,
      },
    });
  });

  // POST / - Adiciona um novo hábito à rotina
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const parseResult = createHabitSchema.safeParse(request.body ?? {});

    if (!parseResult.success) {
      const firstMessage = parseResult.error.issues[0]?.message ?? 'Dados inválidos.';
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

    const { chipId } = parseResult.data;

    // Verificar limite máximo de 15 hábitos ativos
    const [countResult] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(habits)
      .where(eq(habits.profileId, profileId));

    const currentCount = countResult?.total ?? 0;
    if (currentCount >= 15) {
      return reply.status(400).send({
        status: 'error',
        message: 'Você já atingiu o teto de 15 hábitos ativos na sua rotina. Que tal focar nos atuais?',
      });
    }

    // Verificar se hábito já foi cadastrado
    const [existing] = await db
      .select({ id: habits.id })
      .from(habits)
      .where(and(eq(habits.profileId, profileId), eq(habits.chipId, chipId)))
      .limit(1);

    if (existing) {
      return reply.status(400).send({
        status: 'error',
        message: 'Este hábito já está cadastrado na sua rotina.',
      });
    }

    const [newHabit] = await db
      .insert(habits)
      .values({
        profileId,
        chipId,
      })
      .returning();

    if (!newHabit) {
      throw new Error('Falha ao cadastrar hábito.');
    }

    return reply.status(201).send({
      status: 'success',
      data: {
        habit: {
          id: newHabit.id,
          chipId: newHabit.chipId,
          createdAt:
            newHabit.createdAt instanceof Date
              ? newHabit.createdAt.toISOString()
              : new Date(newHabit.createdAt).toISOString(),
        },
      },
    });
  });

  // PUT /:id/logs/:dateKey - Registra ou desmarca a conclusão de um hábito (idempotente)
  app.put('/:id/logs/:dateKey', { preHandler: [app.authenticate] }, async (request, reply) => {
    const paramsResult = putHabitLogParamsSchema.safeParse(request.params);

    if (!paramsResult.success) {
      const firstMessage = paramsResult.error.issues[0]?.message ?? 'Parâmetros inválidos.';
      return reply.status(400).send({
        status: 'error',
        message: firstMessage,
        errors: paramsResult.error.flatten().fieldErrors,
      });
    }

    const { id, dateKey } = paramsResult.data;

    if (!isDateKeyWithinTolerance(dateKey)) {
      return reply.status(400).send({
        status: 'error',
        message: 'Data fora da janela de tolerância permitida.',
      });
    }

    const bodyResult = putHabitLogBodySchema.safeParse(request.body ?? {});

    if (!bodyResult.success) {
      const firstMessage = bodyResult.error.issues[0]?.message ?? 'Corpo da requisição inválido.';
      return reply.status(400).send({
        status: 'error',
        message: firstMessage,
        errors: bodyResult.error.flatten().fieldErrors,
      });
    }

    const { completed } = bodyResult.data;

    const profileId = await resolveProfileId(request.user.sub);

    if (!profileId) {
      return reply.status(404).send({
        status: 'error',
        message: 'Perfil de usuário não encontrado.',
      });
    }

    // Verificar se o hábito pertence ao perfil
    const [habit] = await db
      .select({ id: habits.id })
      .from(habits)
      .where(and(eq(habits.id, id), eq(habits.profileId, profileId)))
      .limit(1);

    if (!habit) {
      return reply.status(404).send({
        status: 'error',
        message: 'Hábito não encontrado.',
      });
    }

    if (completed) {
      // Idempotência: ON CONFLICT DO NOTHING, timestamp truncado para hora
      await db
        .insert(habitLogs)
        .values({
          habitId: id,
          profileId,
          dateKey,
          completedAt: sql`date_trunc('hour', now())`,
        })
        .onConflictDoNothing({
          target: [habitLogs.habitId, habitLogs.dateKey],
        });
    } else {
      // Idempotência: remove o log daquele dia se existir
      await db
        .delete(habitLogs)
        .where(and(eq(habitLogs.habitId, id), eq(habitLogs.dateKey, dateKey)));
    }

    return reply.status(200).send({
      status: 'success',
      data: {
        habitId: id,
        dateKey,
        completed,
      },
    });
  });

  // DELETE /:id - Remove o hábito e seus logs em cascata
  app.delete('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const paramsResult = deleteHabitParamsSchema.safeParse(request.params);

    if (!paramsResult.success) {
      const firstMessage = paramsResult.error.issues[0]?.message ?? 'Parâmetros inválidos.';
      return reply.status(400).send({
        status: 'error',
        message: firstMessage,
        errors: paramsResult.error.flatten().fieldErrors,
      });
    }

    const { id } = paramsResult.data;

    const profileId = await resolveProfileId(request.user.sub);

    if (!profileId) {
      return reply.status(404).send({
        status: 'error',
        message: 'Perfil de usuário não encontrado.',
      });
    }

    // Verificar se o hábito pertence ao perfil
    const [habit] = await db
      .select({ id: habits.id })
      .from(habits)
      .where(and(eq(habits.id, id), eq(habits.profileId, profileId)))
      .limit(1);

    if (!habit) {
      return reply.status(404).send({
        status: 'error',
        message: 'Hábito não encontrado.',
      });
    }

    await db.delete(habits).where(eq(habits.id, id));

    return reply.status(200).send({
      status: 'success',
      message: 'Hábito removido com sucesso.',
    });
  });
};
