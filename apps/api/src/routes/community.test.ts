import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema/auth.js';
import { profiles, triadPosts, dailyPostLimits } from '../db/schema/recovery.js';
import { deriveAccountToken, generateRecoveryKey, hashRecoveryKey } from '../lib/crypto-token.js';
import { FACO_CHIPS, EVITO_CHIPS, ME_AJUDA_CHIPS } from '../constants/chips.js';
import { clearIdempotencyCache } from '../lib/idempotency.js';
import { buildServer } from '../server.js';

interface TestUserContext {
  user: {
    id: string;
    loginToken: string;
  };
  profile: {
    id: string;
    accountToken: string;
    pseudonym: string;
  };
  token: string;
  headers: {
    authorization: string;
  };
  cleanup: () => Promise<void>;
}

async function createTestUser(
  appInstance: FastifyInstance,
  options?: { eligibleForPosting?: boolean },
): Promise<TestUserContext> {
  const userId = crypto.randomUUID();
  const loginToken = crypto.randomBytes(32).toString('hex');
  const recoveryKey = generateRecoveryKey();
  const recoveryKeyHash = hashRecoveryKey(recoveryKey);
  const accountToken = deriveAccountToken(userId);
  const pseudonym = `@User_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const [createdUser] = await db
    .insert(users)
    .values({
      id: userId,
      loginToken,
      passwordHash: 'dummy_hash_for_test',
      recoveryKeyHash,
      tokenVersion: 0,
      isAdult: true,
      role: 'user',
    })
    .returning();

  // Se eligibleForPosting = true (padrão para testes operacionais), simula perfil criado há 2 dias
  const createdAtExpr = options?.eligibleForPosting === false
    ? sql`now()`
    : sql`(now() AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '2 days'`;

  const [createdProfile] = await db
    .insert(profiles)
    .values({
      accountToken,
      pseudonym,
      avatarId: 'avatar_coruja',
      persona: 'navegador',
      createdAt: createdAtExpr,
    })
    .returning();

  if (!createdUser || !createdProfile) {
    throw new Error('Falha ao inicializar usuário/perfil de teste.');
  }

  const token = appInstance.jwt.sign({
    sub: createdUser.id,
    role: createdUser.role,
    persona: createdProfile.persona,
    tv: createdUser.tokenVersion,
  });

  return {
    user: {
      id: createdUser.id,
      loginToken: createdUser.loginToken,
    },
    profile: {
      id: createdProfile.id,
      accountToken: createdProfile.accountToken,
      pseudonym: createdProfile.pseudonym,
    },
    token,
    headers: {
      authorization: `Bearer ${token}`,
    },
    cleanup: async () => {
      await db.delete(triadPosts).where(eq(triadPosts.profileId, createdProfile.id));
      await db.delete(dailyPostLimits).where(eq(dailyPostLimits.profileId, createdProfile.id));
      await db.delete(profiles).where(eq(profiles.id, createdProfile.id));
      await db.delete(users).where(eq(users.id, createdUser.id));
    },
  };
}

describe('Community Routes - Sprint 4B-1 (TASK-403B)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    clearIdempotencyCache();
  });

  describe('POST /api/v1/community/posts', () => {
    it('deve bloquear postagem durante o Período de Escuta de 24h reais (HTTP 403 LISTENING_PERIOD_ACTIVE)', async () => {
      const newUser = await createTestUser(app, { eligibleForPosting: false });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: newUser.headers,
        payload: {
          category: 'FACO',
          chipIds: [FACO_CHIPS[0].id],
        },
      });

      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.status).toBe('error');
      expect(body.code).toBe('LISTENING_PERIOD_ACTIVE');
      expect(body.message).toContain('dedicado à escuta e ao acolhimento');

      await newUser.cleanup();
    });

    it('deve rejeitar requisição sem autenticação com HTTP 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        payload: {
          category: 'FACO',
          chipIds: [FACO_CHIPS[0].id],
        },
      });

      expect(res.statusCode).toBe(401);
    });

    it('deve rejeitar categoria inválida com HTTP 400', async () => {
      const user = await createTestUser(app, { eligibleForPosting: true });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user.headers,
        payload: {
          category: 'INVALIDA',
          chipIds: [FACO_CHIPS[0].id],
        },
      });

      expect(res.statusCode).toBe(400);
      await user.cleanup();
    });

    it('deve rejeitar chip de outra categoria (validação cruzada estrita) com HTTP 400', async () => {
      const user = await createTestUser(app, { eligibleForPosting: true });

      // Categoria FACO com chip de EVITO
      const res1 = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user.headers,
        payload: {
          category: 'FACO',
          chipIds: [EVITO_CHIPS[0].id],
        },
      });
      expect(res1.statusCode).toBe(400);
      const body1 = JSON.parse(res1.payload);
      expect(body1.message).toContain('não é válido para a categoria FACO');

      // Categoria EVITO com chip de ME_AJUDA
      const res2 = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user.headers,
        payload: {
          category: 'EVITO',
          chipIds: [ME_AJUDA_CHIPS[0].id],
        },
      });
      expect(res2.statusCode).toBe(400);

      // Categoria ME_AJUDA com chip de FACO
      const res3 = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user.headers,
        payload: {
          category: 'ME_AJUDA',
          chipIds: [FACO_CHIPS[0].id],
        },
      });
      expect(res3.statusCode).toBe(400);

      await user.cleanup();
    });

    it('deve rejeitar chips repetidos na mesma partilha com HTTP 400', async () => {
      const user = await createTestUser(app, { eligibleForPosting: true });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user.headers,
        payload: {
          category: 'FACO',
          chipIds: [FACO_CHIPS[0].id, FACO_CHIPS[0].id],
        },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.message).toContain('Não é permitido repetir o mesmo chip');

      await user.cleanup();
    });

    it('deve rejeitar menos de 1 ou mais de 3 chips com HTTP 400', async () => {
      const user = await createTestUser(app, { eligibleForPosting: true });

      // Vazio
      const resEmpty = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user.headers,
        payload: {
          category: 'FACO',
          chipIds: [],
        },
      });
      expect(resEmpty.statusCode).toBe(400);

      // Mais de 3
      const res4 = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user.headers,
        payload: {
          category: 'FACO',
          chipIds: [FACO_CHIPS[0].id, FACO_CHIPS[1].id, FACO_CHIPS[2].id, FACO_CHIPS[3].id],
        },
      });
      expect(res4.statusCode).toBe(400);

      await user.cleanup();
    });

    it('deve aplicar anonimato padrão: true para EVITO e false para FACO/ME_AJUDA', async () => {
      const user = await createTestUser(app, { eligibleForPosting: true });

      // EVITO sem passar isAnonymous -> deve ser true por padrão
      const resEvito = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user.headers,
        payload: {
          category: 'EVITO',
          chipIds: [EVITO_CHIPS[0].id],
        },
      });
      expect(resEvito.statusCode).toBe(201);
      const bodyEvito = JSON.parse(resEvito.payload);
      expect(bodyEvito.data.post.isAnonymous).toBe(true);

      // FACO sem passar isAnonymous -> deve ser false por padrão
      const resFaco = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user.headers,
        payload: {
          category: 'FACO',
          chipIds: [FACO_CHIPS[0].id],
        },
      });
      expect(resFaco.statusCode).toBe(201);
      const bodyFaco = JSON.parse(resFaco.payload);
      expect(bodyFaco.data.post.isAnonymous).toBe(false);

      // EVITO com isAnonymous: false explícito -> deve respeitar false
      const resEvitoExplicit = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user.headers,
        payload: {
          category: 'EVITO',
          chipIds: [EVITO_CHIPS[1].id],
          isAnonymous: false,
        },
      });
      expect(resEvitoExplicit.statusCode).toBe(201);
      const bodyEvitoExplicit = JSON.parse(resEvitoExplicit.payload);
      expect(bodyEvitoExplicit.data.post.isAnonymous).toBe(false);

      await user.cleanup();
    });

    it('deve respeitar a Idempotency-Key sem consumir cota adicional em retries', async () => {
      const user = await createTestUser(app, { eligibleForPosting: true });
      const idempotencyKey = crypto.randomUUID();

      const postPayload = {
        category: 'FACO',
        chipIds: [FACO_CHIPS[0].id],
      };

      // 1ª tentativa com Idempotency-Key
      const res1 = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: {
          ...user.headers,
          'Idempotency-Key': idempotencyKey,
        },
        payload: postPayload,
      });
      expect(res1.statusCode).toBe(201);
      const body1 = JSON.parse(res1.payload);

      // 2ª tentativa com MESMA Idempotency-Key
      const res2 = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: {
          ...user.headers,
          'Idempotency-Key': idempotencyKey,
        },
        payload: postPayload,
      });
      expect(res2.statusCode).toBe(201);
      const body2 = JSON.parse(res2.payload);

      // Deve retornar o mesmo post ID
      expect(body2.data.post.id).toBe(body1.data.post.id);

      // Verifica no banco se a cota foi incrementada apenas 1 vez
      const [limitRecord] = await db
        .select()
        .from(dailyPostLimits)
        .where(eq(dailyPostLimits.profileId, user.profile.id));
      expect(limitRecord?.postCount).toBe(1);

      await user.cleanup();
    });

    it('deve limitar a 3 posts/dia por usuário e responder 429 no 4º post', async () => {
      const user = await createTestUser(app, { eligibleForPosting: true });

      // Post 1 -> 201
      const res1 = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user.headers,
        payload: { category: 'FACO', chipIds: [FACO_CHIPS[0].id] },
      });
      expect(res1.statusCode).toBe(201);

      // Post 2 -> 201
      const res2 = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user.headers,
        payload: { category: 'FACO', chipIds: [FACO_CHIPS[1].id] },
      });
      expect(res2.statusCode).toBe(201);

      // Post 3 -> 201
      const res3 = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user.headers,
        payload: { category: 'FACO', chipIds: [FACO_CHIPS[2].id] },
      });
      expect(res3.statusCode).toBe(201);

      // Post 4 -> 429 Too Many Requests
      const res4 = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user.headers,
        payload: { category: 'FACO', chipIds: [FACO_CHIPS[3].id] },
      });
      expect(res4.statusCode).toBe(429);
      const body4 = JSON.parse(res4.payload);
      expect(body4.status).toBe('error');
      expect(body4.message).toContain('Você já fez suas 3 partilhas de hoje');

      await user.cleanup();
    });
  });

  describe('GET /api/v1/community/feed', () => {
    it('deve retornar feed de posts suprimindo métricas de vaidade e truncando horas', async () => {
      const user1 = await createTestUser(app, { eligibleForPosting: true });
      const user2 = await createTestUser(app, { eligibleForPosting: true });

      // user1 posta FACO (não anônimo)
      const resPost1 = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user1.headers,
        payload: {
          category: 'FACO',
          chipIds: [FACO_CHIPS[0].id],
          isAnonymous: false,
        },
      });
      expect(resPost1.statusCode).toBe(201);
      const post1Id = JSON.parse(resPost1.payload).data.post.id;

      // user2 posta EVITO (anônimo)
      const resPost2 = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user2.headers,
        payload: {
          category: 'EVITO',
          chipIds: [EVITO_CHIPS[0].id],
          isAnonymous: true,
        },
      });
      expect(resPost2.statusCode).toBe(201);
      const post2Id = JSON.parse(resPost2.payload).data.post.id;

      // Consulta feed
      const resFeed = await app.inject({
        method: 'GET',
        url: '/api/v1/community/feed',
        headers: user1.headers,
      });

      expect(resFeed.statusCode).toBe(200);
      const bodyFeed = JSON.parse(resFeed.payload);
      expect(bodyFeed.status).toBe('success');
      expect(Array.isArray(bodyFeed.data.posts)).toBe(true);

      const post1 = bodyFeed.data.posts.find((p: any) => p.id === post1Id);
      const post2 = bodyFeed.data.posts.find((p: any) => p.id === post2Id);

      expect(post1).toBeDefined();
      expect(post2).toBeDefined();

      // Métricas de vaidade e profile_id DEVEM estar ausentes
      expect(post1.savedCount).toBeUndefined();
      expect(post1.supportCount).toBeUndefined();
      expect(post1.saved_count).toBeUndefined();
      expect(post1.support_count).toBeUndefined();
      expect(post1.profileId).toBeUndefined();
      expect(post1.profile_id).toBeUndefined();

      // Post 1 não-anônimo: pseudônimo e avatarId preservados
      expect(post1.pseudonym).toBe(user1.profile.pseudonym);
      expect(post1.avatarId).toBe('avatar_coruja');

      // Post 2 anônimo: pseudônimo null e avatarId avatar_default
      expect(post2.pseudonym).toBeNull();
      expect(post2.avatarId).toBe('avatar_default');

      // Timestamp truncado para hora (minutos = 0, segundos = 0)
      const date1 = new Date(post1.createdAt);
      expect(date1.getMinutes()).toBe(0);
      expect(date1.getSeconds()).toBe(0);

      await user1.cleanup();
      await user2.cleanup();
    });

    it('deve respeitar filtro por categoria ?category=EVITO', async () => {
      const user = await createTestUser(app, { eligibleForPosting: true });

      const resPostFaco = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user.headers,
        payload: { category: 'FACO', chipIds: [FACO_CHIPS[0].id] },
      });
      const facoId = JSON.parse(resPostFaco.payload).data.post.id;

      const resPostEvito = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user.headers,
        payload: { category: 'EVITO', chipIds: [EVITO_CHIPS[0].id] },
      });
      const evitoId = JSON.parse(resPostEvito.payload).data.post.id;

      const resFilter = await app.inject({
        method: 'GET',
        url: '/api/v1/community/feed?category=EVITO',
        headers: user.headers,
      });

      expect(resFilter.statusCode).toBe(200);
      const body = JSON.parse(resFilter.payload);
      const posts = body.data.posts;

      expect(posts.some((p: any) => p.id === evitoId)).toBe(true);
      expect(posts.some((p: any) => p.id === facoId)).toBe(false);

      await user.cleanup();
    });

    it('não deve exibir posts marcados com isHidden: true (kill-switch administrativo)', async () => {
      const user = await createTestUser(app, { eligibleForPosting: true });

      const resPost = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: user.headers,
        payload: { category: 'ME_AJUDA', chipIds: [ME_AJUDA_CHIPS[0].id] },
      });
      const postId = JSON.parse(resPost.payload).data.post.id;

      // Oculta administrativamente o post
      await db.update(triadPosts).set({ isHidden: true }).where(eq(triadPosts.id, postId));

      const resFeed = await app.inject({
        method: 'GET',
        url: '/api/v1/community/feed',
        headers: user.headers,
      });

      expect(resFeed.statusCode).toBe(200);
      const body = JSON.parse(resFeed.payload);
      expect(body.data.posts.some((p: any) => p.id === postId)).toBe(false);

      await user.cleanup();
    });
  });

  describe('DELETE /api/v1/community/posts/:id', () => {
    it('deve retornar 404 se a partilha não existir', async () => {
      const user = await createTestUser(app, { eligibleForPosting: true });

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/community/posts/${crypto.randomUUID()}`,
        headers: user.headers,
      });

      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res.payload);
      expect(body.status).toBe('error');
      expect(body.message).toBe('Partilha não encontrada.');

      await user.cleanup();
    });

    it('deve proibir exclusão de partilha de terceiro com HTTP 403 Forbidden', async () => {
      const author = await createTestUser(app, { eligibleForPosting: true });
      const attacker = await createTestUser(app, { eligibleForPosting: true });

      // Autor cria post
      const resPost = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: author.headers,
        payload: { category: 'FACO', chipIds: [FACO_CHIPS[0].id] },
      });
      const postId = JSON.parse(resPost.payload).data.post.id;

      // Outro usuário tenta deletar
      const resDelete = await app.inject({
        method: 'DELETE',
        url: `/api/v1/community/posts/${postId}`,
        headers: attacker.headers,
      });

      expect(resDelete.statusCode).toBe(403);
      const body = JSON.parse(resDelete.payload);
      expect(body.status).toBe('error');
      expect(body.message).toBe('Você não tem permissão para excluir esta partilha.');

      await author.cleanup();
      await attacker.cleanup();
    });

    it('deve permitir ao autor excluir seu post com HTTP 200 (LGPD Art. 18)', async () => {
      const author = await createTestUser(app, { eligibleForPosting: true });

      // Autor cria post
      const resPost = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: author.headers,
        payload: { category: 'FACO', chipIds: [FACO_CHIPS[0].id] },
      });
      const postId = JSON.parse(resPost.payload).data.post.id;

      // Autor deleta o post
      const resDelete = await app.inject({
        method: 'DELETE',
        url: `/api/v1/community/posts/${postId}`,
        headers: author.headers,
      });

      expect(resDelete.statusCode).toBe(200);
      const body = JSON.parse(resDelete.payload);
      expect(body.status).toBe('success');
      expect(body.message).toBe('Partilha excluída com sucesso.');

      // Verifica se o post realmente foi removido do banco
      const [deletedPost] = await db
        .select()
        .from(triadPosts)
        .where(eq(triadPosts.id, postId));
      expect(deletedPost).toBeUndefined();

      await author.cleanup();
    });
  });
});
