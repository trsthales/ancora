import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as queueModule from '../queue/index.js';
import { and, eq, sql } from 'drizzle-orm';
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
  profileNotificationCounters,
} from '../db/schema/recovery.js';
import {
  deriveAccountToken,
  generateRecoveryKey,
  hashRecoveryKey,
} from '../lib/crypto-token.js';
import {
  FACO_CHIPS,
  EVITO_CHIPS,
  ME_AJUDA_CHIPS,
} from '../constants/chips.js';
import { buildServer } from '../server.js';
import { processCommunityNotification } from '../queue/workers/notifications.js';

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
      await db
        .delete(profileNotificationCounters)
        .where(eq(profileNotificationCounters.profileId, createdProfile.id));
      await db.delete(habits).where(eq(habits.profileId, createdProfile.id));
      await db.delete(myTools).where(eq(myTools.profileId, createdProfile.id));
      await db.delete(postSupports).where(
        sql`post_id IN (SELECT id FROM recovery_core.triad_posts WHERE profile_id = ${createdProfile.id})`,
      );
      await db.delete(postSaves).where(
        sql`post_id IN (SELECT id FROM recovery_core.triad_posts WHERE profile_id = ${createdProfile.id})`,
      );
      await db.delete(triadPosts).where(eq(triadPosts.profileId, createdProfile.id));
      await db.delete(dailyPostLimits).where(eq(dailyPostLimits.profileId, createdProfile.id));
      await db.delete(profiles).where(eq(profiles.id, createdProfile.id));
      await db.delete(users).where(eq(users.id, createdUser.id));
    },
  };
}

describe('Gestão da Caixa de Ferramentas e Notificações em Lote (Sprint 4B-1 / TASK-404B)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/journey/tools (Consulta e Agrupamento da Caixa Pessoal)', () => {
    it('deve rejeitar requisição sem autenticação com 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/journey/tools',
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.payload);
      expect(body.status).toBe('error');
    });

    it('deve retornar a caixa de ferramentas vazia para usuário recém-criado', async () => {
      const user = await createTestUser(app);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/journey/tools',
        headers: user.headers,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.status).toBe('success');
      expect(body.data).toEqual({
        protectionPlan: [],
        myTools: [],
        savedHabits: [],
      });

      await user.cleanup();
    });

    it('deve agrupar corretamente os chips por destino: protectionPlan (EVITO), myTools (ME_AJUDA) e savedHabits (FACO)', async () => {
      const user = await createTestUser(app);

      const evitoChip = EVITO_CHIPS[0]!.id;
      const meAjudaChip = ME_AJUDA_CHIPS[0]!.id;
      const facoChip = FACO_CHIPS[0]!.id;

      // Inserir nas ferramentas pessoais
      await db.insert(myTools).values([
        {
          profileId: user.profile.id,
          chipId: evitoChip,
          category: 'EVITO',
        },
        {
          profileId: user.profile.id,
          chipId: meAjudaChip,
          category: 'ME_AJUDA',
        },
        {
          profileId: user.profile.id,
          chipId: facoChip,
          category: 'FACO',
        },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/journey/tools',
        headers: user.headers,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.status).toBe('success');
      expect(body.data.protectionPlan).toContain(evitoChip);
      expect(body.data.myTools).toContain(meAjudaChip);
      expect(body.data.savedHabits).toContain(facoChip);
      expect(body.data.protectionPlan).toHaveLength(1);
      expect(body.data.myTools).toHaveLength(1);
      expect(body.data.savedHabits).toHaveLength(1);

      await user.cleanup();
    });
  });

  describe('DELETE /api/v1/journey/tools/:chipId (Remoção e Expurgo Sincronizado)', () => {
    it('deve rejeitar chipId inexistente no catálogo canônico com 400', async () => {
      const user = await createTestUser(app);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/journey/tools/chip_inexistente_invalido',
        headers: user.headers,
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.status).toBe('error');
      expect(body.message).toContain('catálogo oficial');

      await user.cleanup();
    });

    it('deve remover a ferramenta de my_tools e também de habits em cascata', async () => {
      const user = await createTestUser(app);
      const facoChip = FACO_CHIPS[2]!.id;

      // Adiciona em myTools
      await db.insert(myTools).values({
        profileId: user.profile.id,
        chipId: facoChip,
        category: 'FACO',
      });

      // Adiciona também na rotina diária (habits)
      await db.insert(habits).values({
        profileId: user.profile.id,
        chipId: facoChip,
      });

      // Confirma presença prévia em ambas as tabelas
      const [toolBefore] = await db
        .select()
        .from(myTools)
        .where(and(eq(myTools.profileId, user.profile.id), eq(myTools.chipId, facoChip)));
      expect(toolBefore).toBeDefined();

      const [habitBefore] = await db
        .select()
        .from(habits)
        .where(and(eq(habits.profileId, user.profile.id), eq(habits.chipId, facoChip)));
      expect(habitBefore).toBeDefined();

      // Executa DELETE
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/journey/tools/${facoChip}`,
        headers: user.headers,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.status).toBe('success');
      expect(body.message).toBe('Ferramenta removida da sua caixa pessoal com sucesso.');

      // Verifica expurgo em my_tools
      const toolsAfter = await db
        .select()
        .from(myTools)
        .where(and(eq(myTools.profileId, user.profile.id), eq(myTools.chipId, facoChip)));
      expect(toolsAfter).toHaveLength(0);

      // Verifica expurgo em habits
      const habitsAfter = await db
        .select()
        .from(habits)
        .where(and(eq(habits.profileId, user.profile.id), eq(habits.chipId, facoChip)));
      expect(habitsAfter).toHaveLength(0);

      await user.cleanup();
    });

    it('deve remover com sucesso mesmo se a ferramenta não estiver cadastrada em habits', async () => {
      const user = await createTestUser(app);
      const evitoChip = EVITO_CHIPS[1]!.id;

      await db.insert(myTools).values({
        profileId: user.profile.id,
        chipId: evitoChip,
        category: 'EVITO',
      });

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/journey/tools/${evitoChip}`,
        headers: user.headers,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.status).toBe('success');

      const toolsAfter = await db
        .select()
        .from(myTools)
        .where(and(eq(myTools.profileId, user.profile.id), eq(myTools.chipId, evitoChip)));
      expect(toolsAfter).toHaveLength(0);

      await user.cleanup();
    });
  });

  describe('Notificações Comunitárias em Lote (Threshold >= 3 e Reset Atômico)', () => {
    it('deve retornar flags booleanas false e ZERO contadores públicos quando não há eventos', async () => {
      const user = await createTestUser(app);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/journey/notifications/batch',
        headers: user.headers,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.status).toBe('success');
      expect(body.data).toEqual({
        hasInspirationCard: false,
        hasSupportCard: false,
        inspirationMessage: null,
        supportMessage: null,
      });

      // Assegura que contadores numéricos NÃO vazam no payload
      expect(body.data.unreadSupports).toBeUndefined();
      expect(body.data.unreadInspirations).toBeUndefined();

      await user.cleanup();
    });

    it('deve acumular apoios (supports) e exibir card apenas quando threshold atingir >= 3', async () => {
      const author = await createTestUser(app);

      // Evento 1: contador = 1 (< 3)
      await processCommunityNotification({
        data: { authorProfileId: author.profile.id, type: 'support' },
      });

      const res1 = await app.inject({
        method: 'GET',
        url: '/api/v1/journey/notifications/batch',
        headers: author.headers,
      });
      const body1 = JSON.parse(res1.payload);
      expect(body1.data.hasSupportCard).toBe(false);
      expect(body1.data.supportMessage).toBeNull();

      // Evento 2: contador = 2 (< 3)
      await processCommunityNotification({
        data: { authorProfileId: author.profile.id, type: 'support' },
      });

      const res2 = await app.inject({
        method: 'GET',
        url: '/api/v1/journey/notifications/batch',
        headers: author.headers,
      });
      const body2 = JSON.parse(res2.payload);
      expect(body2.data.hasSupportCard).toBe(false);

      // Evento 3: contador = 3 (>= 3 -> Disparo do Card!)
      await processCommunityNotification({
        data: { authorProfileId: author.profile.id, type: 'support' },
      });

      const res3 = await app.inject({
        method: 'GET',
        url: '/api/v1/journey/notifications/batch',
        headers: author.headers,
      });
      const body3 = JSON.parse(res3.payload);
      expect(body3.data.hasSupportCard).toBe(true);
      expect(body3.data.supportMessage).toBe('Algumas pessoas estão com você hoje.');
      expect(body3.data.hasInspirationCard).toBe(false);

      // Reset Atômico via /ack
      const ackRes = await app.inject({
        method: 'POST',
        url: '/api/v1/journey/notifications/ack',
        headers: author.headers,
        payload: { type: 'support' },
      });
      expect(ackRes.statusCode).toBe(200);
      const ackBody = JSON.parse(ackRes.payload);
      expect(ackBody.status).toBe('success');
      expect(ackBody.message).toBe('Notificação confirmada e zerada.');

      // Após reset, consulta novamente: card deve desaparecer
      const resAfterAck = await app.inject({
        method: 'GET',
        url: '/api/v1/journey/notifications/batch',
        headers: author.headers,
      });
      const bodyAfterAck = JSON.parse(resAfterAck.payload);
      expect(bodyAfterAck.data.hasSupportCard).toBe(false);
      expect(bodyAfterAck.data.supportMessage).toBeNull();

      // Garantia anti-vazamento: se vier um 4º evento unitário após o reset, card continua false
      await processCommunityNotification({
        data: { authorProfileId: author.profile.id, type: 'support' },
      });
      const res4th = await app.inject({
        method: 'GET',
        url: '/api/v1/journey/notifications/batch',
        headers: author.headers,
      });
      const body4th = JSON.parse(res4th.payload);
      expect(body4th.data.hasSupportCard).toBe(false);

      await author.cleanup();
    });

    it('deve acumular inspirações (inspirations) e exibir card apenas quando threshold atingir >= 3 com reset atômico', async () => {
      const author = await createTestUser(app);

      // 3 eventos de inspiração
      for (let i = 0; i < 3; i++) {
        await processCommunityNotification({
          data: { authorProfileId: author.profile.id, type: 'inspiration' },
        });
      }

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/journey/notifications/batch',
        headers: author.headers,
      });
      const body = JSON.parse(res.payload);
      expect(body.data.hasInspirationCard).toBe(true);
      expect(body.data.inspirationMessage).toBe('Suas partilhas inspiraram algumas pessoas.');
      expect(body.data.hasSupportCard).toBe(false);

      // Reset via /ack
      const ackRes = await app.inject({
        method: 'POST',
        url: '/api/v1/journey/notifications/ack',
        headers: author.headers,
        payload: { type: 'inspiration' },
      });
      expect(ackRes.statusCode).toBe(200);

      // Valida no banco de dados que unread_inspirations foi zerado
      const [counter] = await db
        .select()
        .from(profileNotificationCounters)
        .where(eq(profileNotificationCounters.profileId, author.profile.id));
      expect(counter?.unreadInspirations).toBe(0);

      // Valida via API
      const resAfter = await app.inject({
        method: 'GET',
        url: '/api/v1/journey/notifications/batch',
        headers: author.headers,
      });
      const bodyAfter = JSON.parse(resAfter.payload);
      expect(bodyAfter.data.hasInspirationCard).toBe(false);

      await author.cleanup();
    });

    it('deve validar tipo inválido no POST /api/v1/journey/notifications/ack com 400', async () => {
      const user = await createTestUser(app);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/journey/notifications/ack',
        headers: user.headers,
        payload: { type: 'tipo_invalido' },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.status).toBe('error');

      await user.cleanup();
    });
  });

  describe('Integração com pg-boss e Enfileiramento sem Rastreamento (Community Actions)', () => {
    it('deve disparar sendJob com payload estrito no POST /together apenas na primeira interação', async () => {
      const sendJobSpy = vi.spyOn(queueModule, 'sendJob');

      const author = await createTestUser(app);
      const supporter = await createTestUser(app);

      // Autor cria postagem
      const resPost = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: author.headers,
        payload: { category: 'FACO', chipIds: [FACO_CHIPS[0]!.id] },
      });
      const postId = JSON.parse(resPost.payload).data.post.id;

      sendJobSpy.mockClear();

      // Primeiro apoio
      const resTogether1 = await app.inject({
        method: 'POST',
        url: `/api/v1/community/posts/${postId}/together`,
        headers: supporter.headers,
      });
      expect(resTogether1.statusCode).toBe(200);

      // Deve ter enfileirado exatamente 1 job
      expect(sendJobSpy).toHaveBeenCalledTimes(1);
      expect(sendJobSpy).toHaveBeenCalledWith('record_community_notification', {
        authorProfileId: author.profile.id,
        type: 'support',
      });

      // Validação estrita LGPD / Zero-PII: o ID do apoiador NUNCA deve estar no payload
      const calledPayload = sendJobSpy.mock.calls[0]?.[1] as Record<string, unknown>;
      expect(calledPayload).not.toHaveProperty('supporterProfileId');
      expect(calledPayload).not.toHaveProperty('userId');
      expect(Object.values(calledPayload)).not.toContain(supporter.profile.id);
      expect(Object.values(calledPayload)).not.toContain(supporter.user.id);

      // Cliques repetidos (deduplicação) NÃO devem reenfileirar job
      sendJobSpy.mockClear();
      const resTogether2 = await app.inject({
        method: 'POST',
        url: `/api/v1/community/posts/${postId}/together`,
        headers: supporter.headers,
      });
      expect(resTogether2.statusCode).toBe(200);
      expect(sendJobSpy).not.toHaveBeenCalled();

      sendJobSpy.mockRestore();
      await author.cleanup();
      await supporter.cleanup();
    });

    it('deve disparar sendJob com payload estrito no POST /try apenas na primeira interação', async () => {
      const sendJobSpy = vi.spyOn(queueModule, 'sendJob');

      const author = await createTestUser(app);
      const adopter = await createTestUser(app);

      // Autor cria postagem
      const resPost = await app.inject({
        method: 'POST',
        url: '/api/v1/community/posts',
        headers: author.headers,
        payload: { category: 'FACO', chipIds: [FACO_CHIPS[1]!.id] },
      });
      const postId = JSON.parse(resPost.payload).data.post.id;

      sendJobSpy.mockClear();

      // Primeiro salvamento / adoção
      const resTry1 = await app.inject({
        method: 'POST',
        url: `/api/v1/community/posts/${postId}/try`,
        headers: adopter.headers,
      });
      expect(resTry1.statusCode).toBe(200);

      // Deve ter enfileirado exatamente 1 job
      expect(sendJobSpy).toHaveBeenCalledTimes(1);
      expect(sendJobSpy).toHaveBeenCalledWith('record_community_notification', {
        authorProfileId: author.profile.id,
        type: 'inspiration',
      });

      // Validação estrita LGPD: ID do adotante NUNCA no payload
      const calledPayload = sendJobSpy.mock.calls[0]?.[1] as Record<string, unknown>;
      expect(calledPayload).not.toHaveProperty('adopterProfileId');
      expect(calledPayload).not.toHaveProperty('userId');
      expect(Object.values(calledPayload)).not.toContain(adopter.profile.id);
      expect(Object.values(calledPayload)).not.toContain(adopter.user.id);

      // Cliques repetidos NÃO devem reenfileirar job
      sendJobSpy.mockClear();
      const resTry2 = await app.inject({
        method: 'POST',
        url: `/api/v1/community/posts/${postId}/try`,
        headers: adopter.headers,
      });
      expect(resTry2.statusCode).toBe(200);
      expect(sendJobSpy).not.toHaveBeenCalled();

      sendJobSpy.mockRestore();
      await author.cleanup();
      await adopter.cleanup();
    });
  });
});
