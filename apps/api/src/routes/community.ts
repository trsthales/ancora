import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { profiles, triadPosts, myTools, habits } from '../db/schema/index.js';
import { deriveAccountToken, deriveCommunityActionToken } from '../lib/crypto-token.js';
import {
  FACO_CHIP_IDS,
  EVITO_CHIP_IDS,
  ME_AJUDA_CHIP_IDS,
} from '../constants/chips.js';
import { getIdempotentResponse, setIdempotentResponse } from '../lib/idempotency.js';
import { sendJob } from '../queue/index.js';

export const createPostSchema = z
  .object({
    category: z.enum(['FACO', 'EVITO', 'ME_AJUDA'], {
      errorMap: () => ({
        message: 'Categoria inválida. Escolha entre FACO, EVITO ou ME_AJUDA.',
      }),
    }),
    chipIds: z
      .array(z.string(), {
        required_error: 'Selecione ao menos 1 chip.',
        invalid_type_error: 'chipIds deve ser uma lista de identificadores.',
      })
      .min(1, 'Selecione ao menos 1 chip.')
      .max(3, 'Máximo de 3 chips por partilha.'),
    isAnonymous: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // 1. Verifica duplicidade interna no array
    const uniqueChips = new Set(data.chipIds);
    if (uniqueChips.size !== data.chipIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Não é permitido repetir o mesmo chip na mesma partilha.',
        path: ['chipIds'],
      });
    }

    // 2. Valida pertença estrita à categoria
    const allowed =
      data.category === 'FACO'
        ? (FACO_CHIP_IDS as readonly string[])
        : data.category === 'EVITO'
          ? (EVITO_CHIP_IDS as readonly string[])
          : (ME_AJUDA_CHIP_IDS as readonly string[]);

    for (let i = 0; i < data.chipIds.length; i++) {
      const chipId = data.chipIds[i];
      if (!chipId || !allowed.includes(chipId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `O chip "${chipId ?? ''}" não é válido para a categoria ${data.category}.`,
          path: ['chipIds', i],
        });
      }
    }
  });

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const feedQuerySchema = z.object({
  category: z.enum(['FACO', 'EVITO', 'ME_AJUDA']).optional(),
});

export type FeedQueryInput = z.infer<typeof feedQuerySchema>;

export const deletePostParamsSchema = z.object({
  id: z.string().uuid('ID da partilha deve ser um UUID válido.'),
});

export type DeletePostParamsInput = z.infer<typeof deletePostParamsSchema>;

export const communityRoutes: FastifyPluginAsync = async (app) => {
  // POST /posts - Criação de partilha na comunidade com validações estritas
  app.post('/posts', { preHandler: [app.authenticate] }, async (request, reply) => {
    const parseResult = createPostSchema.safeParse(request.body ?? {});

    if (!parseResult.success) {
      const firstMessage = parseResult.error.issues[0]?.message ?? 'Dados da partilha inválidos.';
      return reply.status(400).send({
        status: 'error',
        message: firstMessage,
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const accountToken = deriveAccountToken(request.user.sub);
    const [profile] = await db
      .select({
        id: profiles.id,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(eq(profiles.accountToken, accountToken))
      .limit(1);

    if (!profile) {
      return reply.status(404).send({
        status: 'error',
        message: 'Perfil de usuário não encontrado.',
      });
    }

    // Período de Escuta de 24h Reais:
    // Bloqueia contas criadas hoje ou ontem recente (precisa de pelo menos 1 dia civil completo de existência)
    const eligibleResult = await db.execute<{ can_post: boolean }>(sql`
      SELECT (p.created_at < (now() AT TIME ZONE 'America/Sao_Paulo')::date - INTERVAL '1 day') AS can_post
      FROM recovery_core.profiles p
      WHERE p.id = ${profile.id}
    `);
    const eligible = eligibleResult[0];

    if (!eligible || !eligible.can_post) {
      return reply.status(403).send({
        status: 'error',
        code: 'LISTENING_PERIOD_ACTIVE',
        message:
          'Nas suas primeiras 24 horas, o espaço comunitário é dedicado à escuta e ao acolhimento. Suas partilhas estarão liberadas a partir de amanhã.',
      });
    }

    // Idempotency-Key
    const rawIdempotencyKey = request.headers['idempotency-key'];
    const idempotencyKey =
      typeof rawIdempotencyKey === 'string' && rawIdempotencyKey.trim().length > 0
        ? rawIdempotencyKey.trim()
        : null;

    const cacheKey = idempotencyKey ? `post:${profile.id}:${idempotencyKey}` : null;

    if (cacheKey) {
      const cachedResponse = getIdempotentResponse<Record<string, unknown>>(cacheKey);
      if (cachedResponse) {
        return reply.status(201).send(cachedResponse);
      }
    }

    // Cota Atômica de 3 posts/dia no Relógio SP
    const limitResult = await db.execute<{ post_count: number }>(sql`
      INSERT INTO recovery_core.daily_post_limits (profile_id, post_date, post_count)
      VALUES (${profile.id}, (now() AT TIME ZONE 'America/Sao_Paulo')::date, 1)
      ON CONFLICT (profile_id, post_date)
      DO UPDATE SET post_count = daily_post_limits.post_count + 1
      WHERE daily_post_limits.post_count < 3
      RETURNING post_count;
    `);

    if (!limitResult || limitResult.length === 0) {
      return reply.status(429).send({
        status: 'error',
        message: 'Você já fez suas 3 partilhas de hoje. Que tal descansar a mente agora?',
      });
    }

    // Padrão de anonimato:
    // Se EVITO, isAnonymous é true por padrão (a menos que explicitamente false)
    // Para as demais categorias, isAnonymous é false por padrão (a menos que explicitamente true)
    const { category, chipIds } = parseResult.data;
    const isAnonymous =
      category === 'EVITO'
        ? (parseResult.data.isAnonymous ?? true)
        : (parseResult.data.isAnonymous ?? false);

    const [insertedPost] = await db
      .insert(triadPosts)
      .values({
        profileId: profile.id,
        category,
        chipIds,
        isAnonymous,
      })
      .returning();

    if (!insertedPost) {
      return reply.status(500).send({
        status: 'error',
        message: 'Erro interno ao criar partilha.',
      });
    }

    const responsePayload = {
      status: 'success',
      data: {
        post: {
          id: insertedPost.id,
          category: insertedPost.category,
          chipIds: insertedPost.chipIds,
          isAnonymous: insertedPost.isAnonymous,
          createdAt:
            insertedPost.createdAt instanceof Date
              ? insertedPost.createdAt.toISOString()
              : new Date(insertedPost.createdAt).toISOString(),
        },
      },
    };

    if (cacheKey) {
      setIdempotentResponse(cacheKey, responsePayload);
    }

    return reply.status(201).send(responsePayload);
  });

  // GET /feed - Retorna feed de até 20 posts com diversidade por autor e sem métricas de vaidade
  app.get('/feed', { preHandler: [app.authenticate] }, async (request, reply) => {
    const parseQuery = feedQuerySchema.safeParse(request.query ?? {});

    if (!parseQuery.success) {
      const firstMessage = parseQuery.error.issues[0]?.message ?? 'Parâmetros de consulta inválidos.';
      return reply.status(400).send({
        status: 'error',
        message: firstMessage,
        errors: parseQuery.error.flatten().fieldErrors,
      });
    }

    const { category } = parseQuery.data;
    const categoryFilter = category ? sql`AND p.category = ${category}` : sql``;

    const result = await db.execute<{
      id: string;
      category: string;
      chipIds: string[];
      isAnonymous: boolean;
      createdAt: string | Date;
      pseudonym: string | null;
      avatarId: string;
    }>(sql`
      WITH ranked_posts AS (
        SELECT 
          p.id,
          p.category,
          p.chip_ids,
          p.is_anonymous,
          p.created_at,
          prof.pseudonym,
          prof.avatar_id,
          ROW_NUMBER() OVER (
            PARTITION BY p.profile_id 
            ORDER BY p.created_at DESC
          ) as author_rank
        FROM recovery_core.triad_posts p
        JOIN recovery_core.profiles prof ON p.profile_id = prof.id
        WHERE p.is_hidden = false
          ${categoryFilter}
      ),
      selected_candidates AS (
        SELECT * FROM ranked_posts
        ORDER BY author_rank ASC, created_at DESC
        LIMIT 20
      )
      SELECT 
        id,
        category,
        chip_ids as "chipIds",
        is_anonymous as "isAnonymous",
        date_trunc('hour', created_at) as "createdAt",
        CASE WHEN is_anonymous THEN NULL ELSE pseudonym END as pseudonym,
        CASE WHEN is_anonymous THEN 'avatar_default' ELSE avatar_id END as "avatarId"
      FROM selected_candidates
      ORDER BY created_at DESC;
    `);

    return reply.status(200).send({
      status: 'success',
      data: {
        posts: result.map((post) => ({
          id: post.id,
          category: post.category,
          chipIds: post.chipIds,
          isAnonymous: post.isAnonymous,
          createdAt:
            post.createdAt instanceof Date
              ? post.createdAt.toISOString()
              : new Date(post.createdAt).toISOString(),
          pseudonym: post.pseudonym,
          avatarId: post.avatarId,
        })),
      },
    });
  });

  // DELETE /posts/:id - Exclusão de postagem com garantia de autoria (LGPD Art. 18)
  app.delete('/posts/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const parseParams = deletePostParamsSchema.safeParse(request.params ?? {});

    if (!parseParams.success) {
      const firstMessage = parseParams.error.issues[0]?.message ?? 'ID da partilha inválido.';
      return reply.status(400).send({
        status: 'error',
        message: firstMessage,
        errors: parseParams.error.flatten().fieldErrors,
      });
    }

    const accountToken = deriveAccountToken(request.user.sub);
    const [profile] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.accountToken, accountToken))
      .limit(1);

    if (!profile) {
      return reply.status(404).send({
        status: 'error',
        message: 'Perfil de usuário não encontrado.',
      });
    }

    const [post] = await db
      .select({
        id: triadPosts.id,
        profileId: triadPosts.profileId,
      })
      .from(triadPosts)
      .where(eq(triadPosts.id, parseParams.data.id))
      .limit(1);

    if (!post) {
      return reply.status(404).send({
        status: 'error',
        message: 'Partilha não encontrada.',
      });
    }

    if (post.profileId !== profile.id) {
      return reply.status(403).send({
        status: 'error',
        message: 'Você não tem permissão para excluir esta partilha.',
      });
    }

    await db.delete(triadPosts).where(eq(triadPosts.id, post.id));

    return reply.status(200).send({
      status: 'success',
      message: 'Partilha excluída com sucesso.',
    });
  });

  // POST /posts/:id/together - Apoio silencioso com token cego e anti-autoapoio
  app.post(
    '/posts/:id/together',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id: postId } = (request.params as { id: string }) ?? {};
      const accountToken = deriveAccountToken(request.user.sub);
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.accountToken, accountToken))
        .limit(1);

      if (!profile) {
        return reply.status(404).send({
          status: 'error',
          message: 'Perfil não encontrado.',
        });
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!postId || !uuidRegex.test(postId)) {
        return reply.status(404).send({
          status: 'error',
          message: 'Partilha não encontrada.',
        });
      }

      const [post] = await db
        .select()
        .from(triadPosts)
        .where(eq(triadPosts.id, postId))
        .limit(1);

      if (!post) {
        return reply.status(404).send({
          status: 'error',
          message: 'Partilha não encontrada.',
        });
      }

      // 1. Bloqueio de auto-apoio
      if (post.profileId === profile.id) {
        return reply.status(400).send({
          status: 'error',
          message: 'Você não pode apoiar sua própria partilha.',
        });
      }

      // 2. Token cego de apoio
      const reactionToken = deriveCommunityActionToken('support', postId, profile.reactionSalt);

      // 3. Incremento atômico condicional via CTE
      const supportResult = await db.execute<{ updated_id: string }>(sql`
        WITH inserted_support AS (
          INSERT INTO recovery_core.post_supports (post_id, reaction_token)
          VALUES (${postId}, ${reactionToken})
          ON CONFLICT (post_id, reaction_token) DO NOTHING
          RETURNING post_id
        )
        UPDATE recovery_core.triad_posts
        SET support_count = support_count + 1
        WHERE id = ${postId}
          AND EXISTS (SELECT 1 FROM inserted_support)
        RETURNING id as updated_id;
      `);

      if (supportResult && supportResult.length > 0) {
        await sendJob('record_community_notification', {
          authorProfileId: post.profileId,
          type: 'support',
        });
      }

      return reply.status(200).send({
        status: 'success',
        message: 'Você deixou seu apoio silencioso.',
      });
    },
  );

  // POST /posts/:id/try - Adoção cega de prática para os 3 destinos funcionais
  app.post(
    '/posts/:id/try',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id: postId } = (request.params as { id: string }) ?? {};
      const accountToken = deriveAccountToken(request.user.sub);
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.accountToken, accountToken))
        .limit(1);

      if (!profile) {
        return reply.status(404).send({
          status: 'error',
          message: 'Perfil não encontrado.',
        });
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!postId || !uuidRegex.test(postId)) {
        return reply.status(404).send({
          status: 'error',
          message: 'Partilha não encontrada.',
        });
      }

      const [post] = await db
        .select()
        .from(triadPosts)
        .where(eq(triadPosts.id, postId))
        .limit(1);

      if (!post) {
        return reply.status(404).send({
          status: 'error',
          message: 'Partilha não encontrada.',
        });
      }

      const primaryChipId = post.chipIds[0];
      if (!primaryChipId) {
        return reply.status(400).send({
          status: 'error',
          message: 'Partilha sem chip associado.',
        });
      }
      const category = post.category as 'FACO' | 'EVITO' | 'ME_AJUDA';

      // 1. Token cego de salvamento
      const saveToken = deriveCommunityActionToken('save', postId, profile.reactionSalt);

      // 2. Inserção em post_saves e incremento condicional de saved_count
      const saveResult = await db.execute<{ updated_id: string }>(sql`
        WITH inserted_save AS (
          INSERT INTO recovery_core.post_saves (post_id, save_token)
          VALUES (${postId}, ${saveToken})
          ON CONFLICT (post_id, save_token) DO NOTHING
          RETURNING post_id
        )
        UPDATE recovery_core.triad_posts
        SET saved_count = saved_count + 1
        WHERE id = ${postId}
          AND EXISTS (SELECT 1 FROM inserted_save)
        RETURNING id as updated_id;
      `);

      if (saveResult && saveResult.length > 0) {
        await sendJob('record_community_notification', {
          authorProfileId: post.profileId,
          type: 'inspiration',
        });
      }

      // 3. Salva sempre em my_tools (coleção pessoal cega)
      await db
        .insert(myTools)
        .values({
          profileId: profile.id,
          chipId: primaryChipId,
          category,
        })
        .onConflictDoNothing();

      // 4. Roteamento para os 3 Destinos Funcionais
      if (category === 'FACO') {
        const habitsCountResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(habits)
          .where(eq(habits.profileId, profile.id));

        const currentHabitsCount = habitsCountResult[0]?.count ?? 0;

        if (currentHabitsCount < 15) {
          await db
            .insert(habits)
            .values({
              profileId: profile.id,
              chipId: primaryChipId,
            })
            .onConflictDoNothing();

          return reply.status(200).send({
            status: 'success',
            data: {
              saved: true,
              addedToRoutine: true,
              destination: 'routine',
              message: 'Prática adicionada à sua rotina diária.',
            },
          });
        }

        return reply.status(200).send({
          status: 'success',
          data: {
            saved: true,
            addedToRoutine: false,
            destination: 'my_tools',
            message: 'Guardado nas suas ferramentas. Sua rotina diária já atingiu o teto de 15 hábitos.',
          },
        });
      }

      if (category === 'EVITO') {
        return reply.status(200).send({
          status: 'success',
          data: {
            saved: true,
            addedToRoutine: false,
            destination: 'protection_plan',
            message: 'Limite adicionado ao seu Plano de Proteção.',
          },
        });
      }

      // ME_AJUDA
      return reply.status(200).send({
        status: 'success',
        data: {
          saved: true,
          addedToRoutine: false,
          destination: 'tools',
          message: 'Ferramenta guardada para momentos difíceis.',
        },
      });
    },
  );
};

