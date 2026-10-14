import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema/auth.js';
import {
  profiles,
  triadPosts,
  postSupports,
  postSaves,
  myTools,
  habits,
  dailyPostLimits,
} from '../db/schema/recovery.js';
import {
  deriveAccountToken,
  generateRecoveryKey,
  hashRecoveryKey,
  deriveCommunityActionToken,
  deriveSupportToken,
  deriveSaveToken,
} from '../lib/crypto-token.js';
import { FACO_CHIPS, EVITO_CHIPS, ME_AJUDA_CHIPS } from '../constants/chips.js';
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
    reactionSalt: string;
  };
  token: string;
  headers: {
    authorization: string;
  };
  cleanup: () => Promise<void>;
}

async function createTestUser(appInstance: FastifyInstance): Promise<TestUserContext> {
  const userId = crypto.randomUUID();
  const loginToken = crypto.randomBytes(32).toString('hex');
  const recoveryKey = generateRecoveryKey();
  const recoveryKeyHash = hashRecoveryKey(recoveryKey);
  const accountToken = deriveAccountToken(userId);
  const pseudonym = `@User_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const reactionSalt = crypto.randomUUID();

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

  // Cria perfil com 2 dias de existência para passar pelo período de escuta de 24h
  const [createdProfile] = await db
    .insert(profiles)
    .values({
      accountToken,
      pseudonym,
      avatarId: 'avatar_coruja',
      persona: 'navegador',
      reactionSalt,
      createdAt: sql`(now() AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '2 days'`,
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
      reactionSalt: createdProfile.reactionSalt,
    },
    token,
    headers: {
      authorization: `Bearer ${token}`,
    },
    cleanup: async () => {
      await db.delete(habits).where(eq(habits.profileId, createdProfile.id));
      await db.delete(myTools).where(eq(myTools.profileId, createdProfile.id));
      await db.delete(triadPosts).where(eq(triadPosts.profileId, createdProfile.id));
      await db.delete(dailyPostLimits).where(eq(dailyPostLimits.profileId, createdProfile.id));
      await db.delete(profiles).where(eq(profiles.id, createdProfile.id));
      await db.delete(users).where(eq(users.id, createdUser.id));
    },
  };
}

describe('Ações Cegas da Tríade no Feed Comunitário (TASK-404A)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Criptografia e Derivação de Tokens Cegos', () => {
    it('deve derivar tokens determinísticos e com separação estrita de domínio', () => {
      const postId = crypto.randomUUID();
      const salt = crypto.randomUUID();

      const supportToken1 = deriveCommunityActionToken('support', postId, salt);
      const supportToken2 = deriveSupportToken(postId, salt);
      const saveToken1 = deriveCommunityActionToken('save', postId, salt);
      const saveToken2 = deriveSaveToken(postId, salt);

      expect(supportToken1).toHaveLength(64);
      expect(supportToken1).toBe(supportToken2);
      expect(saveToken1).toHaveLength(64);
      expect(saveToken1).toBe(saveToken2);

      // Separação de domínio: support e save para o mesmo post e salt geram tokens diferentes
      expect(supportToken1).not.toBe(saveToken1);
    });
  });

  describe('POST /api/v1/community/posts/:id/together (Apoio Silencioso)', () => {
    it('deve bloquear estritamente auto-apoio com HTTP 400', async () => {
      const author = await createTestUser(app);

      // Autor cria post
      const resPost = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: author.headers,
        payload: { category: 'FACO', chipIds: [FACO_CHIPS[0]!.id] },
      });
      expect(resPost.statusCode).toBe(201);
      const postId = JSON.parse(resPost.payload).data.post.id;

      // Autor tenta apoiar sua própria partilha
      const resTogether = await app.inject({
        method: 'POST',
        url: `/api/v1/community/posts/${postId}/together`,
        headers: author.headers,
      });

      expect(resTogether.statusCode).toBe(400);
      const body = JSON.parse(resTogether.payload);
      expect(body.status).toBe('error');
      expect(body.message).toBe('Você não pode apoiar sua própria partilha.');

      // Verifica no banco se support_count continua 0 e sem registros em post_supports
      const [postInDb] = await db.select().from(triadPosts).where(eq(triadPosts.id, postId));
      expect(postInDb?.supportCount).toBe(0);

      const supportsInDb = await db.select().from(postSupports).where(eq(postSupports.postId, postId));
      expect(supportsInDb).toHaveLength(0);

      await author.cleanup();
    });

    it('deve registrar apoio silencioso com token cego e deduplicação real (idempotência de contador)', async () => {
      const author = await createTestUser(app);
      const supporter = await createTestUser(app);

      // Autor cria post
      const resPost = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: author.headers,
        payload: { category: 'FACO', chipIds: [FACO_CHIPS[0]!.id] },
      });
      const postId = JSON.parse(resPost.payload).data.post.id;

      // Primeiro clique do apoiador
      const resFirstClick = await app.inject({
        method: 'POST',
        url: `/api/v1/community/posts/${postId}/together`,
        headers: supporter.headers,
      });

      expect(resFirstClick.statusCode).toBe(200);
      const bodyFirst = JSON.parse(resFirstClick.payload);
      expect(bodyFirst.status).toBe('success');
      expect(bodyFirst.message).toBe('Você deixou seu apoio silencioso.');

      // Verifica contador após 1º clique
      const [postAfterFirst] = await db.select().from(triadPosts).where(eq(triadPosts.id, postId));
      expect(postAfterFirst?.supportCount).toBe(1);

      // Cliques repetidos do mesmo apoiador (2º e 3º cliques)
      const resSecondClick = await app.inject({
        method: 'POST',
        url: `/api/v1/community/posts/${postId}/together`,
        headers: supporter.headers,
      });
      expect(resSecondClick.statusCode).toBe(200);

      const resThirdClick = await app.inject({
        method: 'POST',
        url: `/api/v1/community/posts/${postId}/together`,
        headers: supporter.headers,
      });
      expect(resThirdClick.statusCode).toBe(200);

      // Contador DEVE permanecer 1 (deduplicação via token HMAC cego)
      const [postAfterRepeated] = await db.select().from(triadPosts).where(eq(triadPosts.id, postId));
      expect(postAfterRepeated?.supportCount).toBe(1);

      // post_supports deve conter exatamente 1 registro para este post
      const supports = await db.select().from(postSupports).where(eq(postSupports.postId, postId));
      expect(supports).toHaveLength(1);
      const expectedToken = deriveCommunityActionToken('support', postId, supporter.profile.reactionSalt);
      expect(supports[0]?.reactionToken).toBe(expectedToken);

      await author.cleanup();
      await supporter.cleanup();
    });

    it('deve retornar 404 se a partilha não existir', async () => {
      const user = await createTestUser(app);

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/community/posts/${crypto.randomUUID()}/together`,
        headers: user.headers,
      });

      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res.payload);
      expect(body.status).toBe('error');
      expect(body.message).toBe('Partilha não encontrada.');

      await user.cleanup();
    });
  });

  describe('POST /api/v1/community/posts/:id/try (Adoção de Práticas)', () => {
    it('deve deduplicar contador saved_count em múltiplos cliques no mesmo post', async () => {
      const author = await createTestUser(app);
      const adopter = await createTestUser(app);

      const resPost = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: author.headers,
        payload: { category: 'FACO', chipIds: [FACO_CHIPS[0]!.id] },
      });
      const postId = JSON.parse(resPost.payload).data.post.id;

      // 1º clique
      const res1 = await app.inject({
        method: 'POST',
        url: `/api/v1/community/posts/${postId}/try`,
        headers: adopter.headers,
      });
      expect(res1.statusCode).toBe(200);

      // 2º clique
      const res2 = await app.inject({
        method: 'POST',
        url: `/api/v1/community/posts/${postId}/try`,
        headers: adopter.headers,
      });
      expect(res2.statusCode).toBe(200);

      // 3º clique
      const res3 = await app.inject({
        method: 'POST',
        url: `/api/v1/community/posts/${postId}/try`,
        headers: adopter.headers,
      });
      expect(res3.statusCode).toBe(200);

      // Contador saved_count DEVE se manter exatamente 1
      const [postInDb] = await db.select().from(triadPosts).where(eq(triadPosts.id, postId));
      expect(postInDb?.savedCount).toBe(1);

      // post_saves deve ter exatamente 1 registro
      const saves = await db.select().from(postSaves).where(eq(postSaves.postId, postId));
      expect(saves).toHaveLength(1);

      await author.cleanup();
      await adopter.cleanup();
    });

    it('deve rotear FACO para my_tools e habits quando hábitos ativos < 15', async () => {
      const author = await createTestUser(app);
      const adopter = await createTestUser(app);
      const chipId = FACO_CHIPS[1]!.id;

      const resPost = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: author.headers,
        payload: { category: 'FACO', chipIds: [chipId] },
      });
      const postId = JSON.parse(resPost.payload).data.post.id;

      const resTry = await app.inject({
        method: 'POST',
        url: `/api/v1/community/posts/${postId}/try`,
        headers: adopter.headers,
      });

      expect(resTry.statusCode).toBe(200);
      const body = JSON.parse(resTry.payload);
      expect(body.status).toBe('success');
      expect(body.data).toEqual({
        saved: true,
        addedToRoutine: true,
        destination: 'routine',
        message: 'Prática adicionada à sua rotina diária.',
      });

      // Valida inserção em my_tools
      const [tool] = await db
        .select()
        .from(myTools)
        .where(eq(myTools.profileId, adopter.profile.id));
      expect(tool).toBeDefined();
      expect(tool?.chipId).toBe(chipId);
      expect(tool?.category).toBe('FACO');

      // Valida inserção em habits
      const [habit] = await db
        .select()
        .from(habits)
        .where(eq(habits.profileId, adopter.profile.id));
      expect(habit).toBeDefined();
      expect(habit?.chipId).toBe(chipId);

      await author.cleanup();
      await adopter.cleanup();
    });

    it('deve rotear EVITO para my_tools com destination protection_plan', async () => {
      const author = await createTestUser(app);
      const adopter = await createTestUser(app);
      const chipId = EVITO_CHIPS[0]!.id;

      const resPost = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: author.headers,
        payload: { category: 'EVITO', chipIds: [chipId] },
      });
      const postId = JSON.parse(resPost.payload).data.post.id;

      const resTry = await app.inject({
        method: 'POST',
        url: `/api/v1/community/posts/${postId}/try`,
        headers: adopter.headers,
      });

      expect(resTry.statusCode).toBe(200);
      const body = JSON.parse(resTry.payload);
      expect(body.status).toBe('success');
      expect(body.data).toEqual({
        saved: true,
        addedToRoutine: false,
        destination: 'protection_plan',
        message: 'Limite adicionado ao seu Plano de Proteção.',
      });

      // Valida inserção em my_tools
      const [tool] = await db
        .select()
        .from(myTools)
        .where(eq(myTools.profileId, adopter.profile.id));
      expect(tool).toBeDefined();
      expect(tool?.chipId).toBe(chipId);
      expect(tool?.category).toBe('EVITO');

      // Não deve ter sido inserido em habits
      const userHabits = await db
        .select()
        .from(habits)
        .where(eq(habits.profileId, adopter.profile.id));
      expect(userHabits).toHaveLength(0);

      await author.cleanup();
      await adopter.cleanup();
    });

    it('deve rotear ME_AJUDA para my_tools com destination tools', async () => {
      const author = await createTestUser(app);
      const adopter = await createTestUser(app);
      const chipId = ME_AJUDA_CHIPS[0]!.id;

      const resPost = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: author.headers,
        payload: { category: 'ME_AJUDA', chipIds: [chipId] },
      });
      const postId = JSON.parse(resPost.payload).data.post.id;

      const resTry = await app.inject({
        method: 'POST',
        url: `/api/v1/community/posts/${postId}/try`,
        headers: adopter.headers,
      });

      expect(resTry.statusCode).toBe(200);
      const body = JSON.parse(resTry.payload);
      expect(body.status).toBe('success');
      expect(body.data).toEqual({
        saved: true,
        addedToRoutine: false,
        destination: 'tools',
        message: 'Ferramenta guardada para momentos difíceis.',
      });

      // Valida inserção em my_tools
      const [tool] = await db
        .select()
        .from(myTools)
        .where(eq(myTools.profileId, adopter.profile.id));
      expect(tool).toBeDefined();
      expect(tool?.chipId).toBe(chipId);
      expect(tool?.category).toBe('ME_AJUDA');

      // Não deve ter sido inserido em habits
      const userHabits = await db
        .select()
        .from(habits)
        .where(eq(habits.profileId, adopter.profile.id));
      expect(userHabits).toHaveLength(0);

      await author.cleanup();
      await adopter.cleanup();
    });

    it('deve realizar transição suave quando o usuário já atingiu o teto de 15 hábitos ativos', async () => {
      const author = await createTestUser(app);
      const adopter = await createTestUser(app);

      // Preenche previamente 15 hábitos distintos para o adotante
      const initialChips = FACO_CHIPS.slice(0, 15).map((c) => c.id);
      for (const chipId of initialChips) {
        await db.insert(habits).values({
          profileId: adopter.profile.id,
          chipId,
        });
      }

      // Confirma que existem exatamente 15 hábitos
      const initialHabitsResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(habits)
        .where(eq(habits.profileId, adopter.profile.id));
      expect(initialHabitsResult[0]?.count).toBe(15);

      // Autor partilha o 16º chip
      const sixteenthChipId = FACO_CHIPS[15]!.id;
      const resPost = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: author.headers,
        payload: { category: 'FACO', chipIds: [sixteenthChipId] },
      });
      const postId = JSON.parse(resPost.payload).data.post.id;

      // Adotante clica em /try
      const resTry = await app.inject({
        method: 'POST',
        url: `/api/v1/community/posts/${postId}/try`,
        headers: adopter.headers,
      });

      expect(resTry.statusCode).toBe(200);
      const body = JSON.parse(resTry.payload);
      expect(body.status).toBe('success');
      expect(body.data).toEqual({
        saved: true,
        addedToRoutine: false,
        destination: 'my_tools',
        message: 'Guardado nas suas ferramentas. Sua rotina diária já atingiu o teto de 15 hábitos.',
      });

      // Valida que o hábito NÃO excedeu o teto (continua com 15)
      const finalHabitsResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(habits)
        .where(eq(habits.profileId, adopter.profile.id));
      expect(finalHabitsResult[0]?.count).toBe(15);

      // Mas foi salvo em my_tools!
      const [savedTool] = await db
        .select()
        .from(myTools)
        .where(eq(myTools.profileId, adopter.profile.id));
      expect(savedTool).toBeDefined();
      expect(savedTool?.chipId).toBe(sixteenthChipId);
      expect(savedTool?.category).toBe('FACO');

      await author.cleanup();
      await adopter.cleanup();
    });
  });
});
