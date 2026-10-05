import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema/auth.js';
import { profiles, habits, habitLogs } from '../db/schema/recovery.js';
import { deriveAccountToken, generateRecoveryKey, hashRecoveryKey } from '../lib/crypto-token.js';
import { FACO_CHIP_IDS } from '../constants/chips.js';
import { getTodayDateKey } from '../lib/date-window.js';
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

async function createTestUser(appInstance: FastifyInstance): Promise<TestUserContext> {
  const userId = crypto.randomUUID();
  const loginToken = crypto.randomBytes(32).toString('hex');
  const recoveryKey = generateRecoveryKey();
  const recoveryKeyHash = hashRecoveryKey(recoveryKey);
  const accountToken = deriveAccountToken(userId);
  const pseudonym = `@Test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

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
      avatarId: 'avatar_default',
      persona: 'navegador',
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

  const headers = {
    authorization: `Bearer ${token}`,
  };

  const cleanup = async () => {
    try {
      await db.delete(habitLogs).where(eq(habitLogs.profileId, createdProfile.id));
      await db.delete(habits).where(eq(habits.profileId, createdProfile.id));
      await db.delete(profiles).where(eq(profiles.id, createdProfile.id));
      await db.delete(users).where(eq(users.id, createdUser.id));
    } catch (err) {
      console.error('Erro na limpeza do usuário de teste:', err);
    }
  };

  return {
    user: createdUser,
    profile: createdProfile,
    token,
    headers,
    cleanup,
  };
}

describe('Rotina de Hábitos Pessoais (TASK-401-T - Invariantes)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Invariante 1 (Idempotência Real via PUT)', () => {
    it('3 chamadas repetidas idênticas com completed: true mantêm 1 único registro no banco e 2 chamadas com completed: false desmarcam sem erro', async () => {
      const userCtx = await createTestUser(app);

      try {
        const todaySP = getTodayDateKey('America/Sao_Paulo');

        // 1. Criar 1 hábito válido
        const createRes = await app.inject({
          method: 'POST',
          url: '/api/v1/journey/habits',
          headers: userCtx.headers,
          payload: { chipId: 'morn_coffee_01' },
        });

        expect(createRes.statusCode).toBe(201);
        const createJson = createRes.json();
        const habitId = createJson.data.habit.id;
        expect(habitId).toBeDefined();

        // 2. Disparar 3 chamadas concorrentes/repetidas com { completed: true }
        const putResults = await Promise.all([
          app.inject({
            method: 'PUT',
            url: `/api/v1/journey/habits/${habitId}/logs/${todaySP}`,
            headers: userCtx.headers,
            payload: { completed: true },
          }),
          app.inject({
            method: 'PUT',
            url: `/api/v1/journey/habits/${habitId}/logs/${todaySP}`,
            headers: userCtx.headers,
            payload: { completed: true },
          }),
          app.inject({
            method: 'PUT',
            url: `/api/v1/journey/habits/${habitId}/logs/${todaySP}`,
            headers: userCtx.headers,
            payload: { completed: true },
          }),
        ]);

        for (const res of putResults) {
          expect(res.statusCode).toBe(200);
          expect(res.json()).toEqual({
            status: 'success',
            data: {
              habitId,
              dateKey: todaySP,
              completed: true,
            },
          });
        }

        // 3. Consultar a tabela recovery_core.habit_logs garantindo rigorosamente 1 registro
        const logs = await db
          .select()
          .from(habitLogs)
          .where(eq(habitLogs.habitId, habitId));
        expect(logs).toHaveLength(1);

        // 4. Disparar 2 chamadas sucessivas com { completed: false }
        const delRes1 = await app.inject({
          method: 'PUT',
          url: `/api/v1/journey/habits/${habitId}/logs/${todaySP}`,
          headers: userCtx.headers,
          payload: { completed: false },
        });

        const delRes2 = await app.inject({
          method: 'PUT',
          url: `/api/v1/journey/habits/${habitId}/logs/${todaySP}`,
          headers: userCtx.headers,
          payload: { completed: false },
        });

        expect(delRes1.statusCode).toBe(200);
        expect(delRes1.json()).toEqual({
          status: 'success',
          data: {
            habitId,
            dateKey: todaySP,
            completed: false,
          },
        });

        expect(delRes2.statusCode).toBe(200);
        expect(delRes2.json()).toEqual({
          status: 'success',
          data: {
            habitId,
            dateKey: todaySP,
            completed: false,
          },
        });

        // 5. Consultar o banco garantindo 0 logs
        const emptyLogs = await db
          .select()
          .from(habitLogs)
          .where(eq(habitLogs.habitId, habitId));
        expect(emptyLogs).toHaveLength(0);
      } finally {
        await userCtx.cleanup();
      }
    });
  });

  describe('Invariante 2 (Teto Rígido de 15 Hábitos)', () => {
    it('deve aceitar até 15 hábitos ativos (HTTP 201), rejeitar o 16º com HTTP 400 e mensagem do teto, e permitir nova inserção após exclusão', async () => {
      const userCtx = await createTestUser(app);

      try {
        const first15Chips = FACO_CHIP_IDS.slice(0, 15);
        const sixteenthChip = FACO_CHIP_IDS[15];
        const createdHabitIds: string[] = [];

        // 1. Inserir sucessivamente os 15 primeiros chips
        for (const chipId of first15Chips) {
          const res = await app.inject({
            method: 'POST',
            url: '/api/v1/journey/habits',
            headers: userCtx.headers,
            payload: { chipId },
          });

          expect(res.statusCode).toBe(201);
          const body = res.json();
          expect(body.status).toBe('success');
          expect(body.data.habit.chipId).toBe(chipId);
          createdHabitIds.push(body.data.habit.id);
        }

        expect(createdHabitIds).toHaveLength(15);

        // 2. Tentar inserir o 16º chip distinto
        const res16 = await app.inject({
          method: 'POST',
          url: '/api/v1/journey/habits',
          headers: userCtx.headers,
          payload: { chipId: sixteenthChip },
        });

        expect(res16.statusCode).toBe(400);
        const errJson = res16.json();
        expect(errJson.status).toBe('error');
        expect(errJson.message).toContain('Você já atingiu o teto de 15 hábitos ativos na sua rotina.');

        // 3. Excluir o primeiro hábito cadastrado (HTTP 200)
        const primeiroHabitoId = createdHabitIds[0];
        const delRes = await app.inject({
          method: 'DELETE',
          url: `/api/v1/journey/habits/${primeiroHabitoId}`,
          headers: userCtx.headers,
        });

        expect(delRes.statusCode).toBe(200);
        expect(delRes.json().status).toBe('success');

        // 4. Tentar novamente inserir o 16º chip: agora deve ser aceito com HTTP 201
        const retry16Res = await app.inject({
          method: 'POST',
          url: '/api/v1/journey/habits',
          headers: userCtx.headers,
          payload: { chipId: sixteenthChip },
        });

        expect(retry16Res.statusCode).toBe(201);
        expect(retry16Res.json().data.habit.chipId).toBe(sixteenthChip);
      } finally {
        await userCtx.cleanup();
      }
    });
  });

  describe('Invariante 3 (Ausência Estrutural de Streaks / Anti-Relapse Shame)', () => {
    it('deve assegurar ausência total de chaves de streak no payload retornado por GET /api/v1/journey/habits', async () => {
      const userCtx = await createTestUser(app);

      try {
        const todaySP = getTodayDateKey('America/Sao_Paulo');

        // 1. Criar um hábito
        const createRes = await app.inject({
          method: 'POST',
          url: '/api/v1/journey/habits',
          headers: userCtx.headers,
          payload: { chipId: 'morn_coffee_01' },
        });
        expect(createRes.statusCode).toBe(201);
        const habitId = createRes.json().data.habit.id;

        // Criar log na data de hoje via PUT
        await app.inject({
          method: 'PUT',
          url: `/api/v1/journey/habits/${habitId}/logs/${todaySP}`,
          headers: userCtx.headers,
          payload: { completed: true },
        });

        // Inserir logs em dias simulados alternados no banco
        await db.insert(habitLogs).values([
          {
            habitId,
            profileId: userCtx.profile.id,
            dateKey: '2026-09-01',
            completedAt: new Date('2026-09-01T10:00:00Z'),
          },
          {
            habitId,
            profileId: userCtx.profile.id,
            dateKey: '2026-09-03',
            completedAt: new Date('2026-09-03T10:00:00Z'),
          },
        ]);

        // 2. Executar GET /api/v1/journey/habits?dateKey=${todaySP}
        const res = await app.inject({
          method: 'GET',
          url: `/api/v1/journey/habits?dateKey=${todaySP}`,
          headers: userCtx.headers,
        });

        expect(res.statusCode).toBe(200);
        const json = res.json();

        // 3. Inspeção profunda no payload da resposta
        expect(json).not.toHaveProperty('currentStreak');
        expect(json).not.toHaveProperty('streak');
        expect(json).not.toHaveProperty('streakCount');
        expect(json).not.toHaveProperty('streakBroken');
        expect(json).not.toHaveProperty('daysLost');
        expect(json).not.toHaveProperty('longestStreak');

        if (json.data) {
          expect(json.data).not.toHaveProperty('currentStreak');
          expect(json.data).not.toHaveProperty('streak');
          expect(json.data).not.toHaveProperty('streakCount');
          expect(json.data).not.toHaveProperty('streakBroken');
          expect(json.data).not.toHaveProperty('daysLost');
          expect(json.data).not.toHaveProperty('longestStreak');
        }

        expect(Array.isArray(json.data.habits)).toBe(true);
        expect(json.data.habits.length).toBeGreaterThan(0);

        for (const habit of json.data.habits) {
          expect(habit).not.toHaveProperty('streak');
          expect(habit).not.toHaveProperty('consecutiveDays');
          expect(habit).not.toHaveProperty('currentStreak');
          expect(habit).not.toHaveProperty('streakCount');
          expect(habit).not.toHaveProperty('streakBroken');
          expect(habit).not.toHaveProperty('daysLost');
          expect(habit).not.toHaveProperty('longestStreak');
        }
      } finally {
        await userCtx.cleanup();
      }
    });
  });

  describe('Invariante 4 (Rejeição de Medicamentos e Texto Livre)', () => {
    it('deve rejeitar com HTTP 400 tentativas de cadastrar morn_meds_01, strings arbitrárias ou gírias via z.enum(FACO_CHIP_IDS)', async () => {
      const userCtx = await createTestUser(app);

      try {
        // 1. morn_meds_01
        const res1 = await app.inject({
          method: 'POST',
          url: '/api/v1/journey/habits',
          headers: userCtx.headers,
          payload: { chipId: 'morn_meds_01' },
        });
        expect(res1.statusCode).toBe(400);
        expect(res1.json().status).toBe('error');

        // 2. Tomar ansiolitico 10mg
        const res2 = await app.inject({
          method: 'POST',
          url: '/api/v1/journey/habits',
          headers: userCtx.headers,
          payload: { chipId: 'Tomar ansiolitico 10mg' },
        });
        expect(res2.statusCode).toBe(400);
        expect(res2.json().status).toBe('error');

        // 3. caminhada_do_ze
        const res3 = await app.inject({
          method: 'POST',
          url: '/api/v1/journey/habits',
          headers: userCtx.headers,
          payload: { chipId: 'caminhada_do_ze' },
        });
        expect(res3.statusCode).toBe(400);
        expect(res3.json().status).toBe('error');
      } finally {
        await userCtx.cleanup();
      }
    });
  });

  describe('Invariante 5 (Janela de Tolerância de Fuso e Truncamento de Timestamp)', () => {
    it('deve rejeitar data fora da tolerância com HTTP 400 e registrar completed_at com minutos e segundos zerados', async () => {
      const userCtx = await createTestUser(app);

      try {
        const todaySP = getTodayDateKey('America/Sao_Paulo');

        // Criar um hábito válido
        const createRes = await app.inject({
          method: 'POST',
          url: '/api/v1/journey/habits',
          headers: userCtx.headers,
          payload: { chipId: 'morn_coffee_01' },
        });
        expect(createRes.statusCode).toBe(201);
        const habitId = createRes.json().data.habit.id;

        // 1. Requisição para data fora da janela (2020-01-01) deve ser rejeitada com HTTP 400
        const outOfWindowRes = await app.inject({
          method: 'PUT',
          url: `/api/v1/journey/habits/${habitId}/logs/2020-01-01`,
          headers: userCtx.headers,
          payload: { completed: true },
        });

        expect(outOfWindowRes.statusCode).toBe(400);
        expect(outOfWindowRes.json()).toEqual({
          status: 'error',
          message: 'Data fora da janela de tolerância permitida.',
        });

        // 2. Concluir hábito na data de hoje
        const putSuccess = await app.inject({
          method: 'PUT',
          url: `/api/v1/journey/habits/${habitId}/logs/${todaySP}`,
          headers: userCtx.headers,
          payload: { completed: true },
        });

        expect(putSuccess.statusCode).toBe(200);

        // 3. Consultar o log no banco e comprovar que completed_at possui minutos, segundos e milissegundos zerados
        const [log] = await db
          .select()
          .from(habitLogs)
          .where(eq(habitLogs.habitId, habitId));

        expect(log).toBeDefined();
        if (!log) {
          throw new Error('Log não encontrado no banco');
        }
        const completedDate = new Date(log.completedAt);
        expect(completedDate.getMinutes()).toBe(0);
        expect(completedDate.getSeconds()).toBe(0);
        expect(completedDate.getMilliseconds()).toBe(0);
      } finally {
        await userCtx.cleanup();
      }
    });
  });
});
