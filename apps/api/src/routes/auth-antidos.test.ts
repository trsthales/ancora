import type { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../server.js';
import { deriveLoginToken } from '../lib/crypto-token.js';
import { checkAccountLock, recordLoginSuccess } from '../lib/rate-limit.js';

describe('Remediação de Falha 3.1: Anti-DoS Assimétrico no Argon2id (Rate Limit por IP)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve permitir até 15 requisições por minuto por IP no POST /api/v1/auth/login e bloquear a 16ª com HTTP 429 e Retry-After', async () => {
    const attackerIp = '198.51.100.42';

    // Dispara 15 requisições no mesmo IP dentro da janela
    for (let i = 1; i <= 15; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        remoteAddress: attackerIp,
        payload: {
          identifier: `pseudonimo_ataque_${i}`,
          password: 'senha_invalida_123',
        },
      });

      // As primeiras 15 requisições não devem ser bloqueadas pelo rate limit de IP (429)
      expect(
        res.statusCode,
        `Requisição ${i} não deve retornar 429`,
      ).not.toBe(429);
    }

    // A 16ª requisição do mesmo IP deve ser bloqueada com HTTP 429 Too Many Requests
    const blockedRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      remoteAddress: attackerIp,
      payload: {
        identifier: 'pseudonimo_ataque_16',
        password: 'senha_invalida_123',
      },
    });

    expect(blockedRes.statusCode).toBe(429);
    expect(blockedRes.headers['retry-after']).toBeDefined();
    const retryAfter = Number(blockedRes.headers['retry-after']);
    expect(retryAfter).toBeGreaterThan(0);

    const body = JSON.parse(blockedRes.payload);
    expect(body.message || body.error).toMatch(/rate limit|too many requests/i);
  });

  it('deve isolar limites de IP: um IP diferente continua conseguindo requisitar o POST /api/v1/auth/login', async () => {
    const saturatedIp = '198.51.100.99';
    const legitimateIp = '203.0.113.10';

    // Esgota a cota do IP saturado
    for (let i = 1; i <= 15; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        remoteAddress: saturatedIp,
        payload: {
          identifier: `flood_${i}`,
          password: 'senha_flood_123',
        },
      });
    }

    // Confirma que IP saturado está bloqueado
    const saturatedRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      remoteAddress: saturatedIp,
      payload: {
        identifier: 'flood_overflow',
        password: 'senha_flood_123',
      },
    });
    expect(saturatedRes.statusCode).toBe(429);

    // IP legítimo não deve ser afetado
    const legitimateRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      remoteAddress: legitimateIp,
      payload: {
        identifier: 'usuario_legitimo',
        password: 'senha_legitima_123',
      },
    });
    expect(legitimateRes.statusCode).not.toBe(429);
  });

  it('deve aplicar rate limit de 10 requisições por minuto por IP no POST /api/v1/auth/recover', async () => {
    const recoverAttackerIp = '198.51.100.77';

    // Dispara 10 requisições
    for (let i = 1; i <= 10; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/recover',
        remoteAddress: recoverAttackerIp,
        payload: {
          recoveryKey: 'CHAVE-INVALIDA-RECOVERY-KEY',
          newPassword: 'NovaSenhaForte123!',
        },
      });

      expect(res.statusCode, `Requisição ${i} do recover não deve ser 429`).not.toBe(429);
    }

    // A 11ª requisição deve ser bloqueada
    const recoverBlockedRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/recover',
      remoteAddress: recoverAttackerIp,
      payload: {
        recoveryKey: 'CHAVE-INVALIDA-RECOVERY-KEY',
        newPassword: 'NovaSenhaForte123!',
      },
    });

    expect(recoverBlockedRes.statusCode).toBe(429);
    expect(recoverBlockedRes.headers['retry-after']).toBeDefined();
  });

  it('deve manter o balde de conta (checkAccountLock) ativo em paralelo e independente do IP', async () => {
    const targetIdentifier = 'vitest_target_account_lock';
    const targetLoginToken = deriveLoginToken(targetIdentifier);

    // Reset preventivo da conta
    recordLoginSuccess(targetLoginToken);

    // 5 IPs distintos tentando a MESMA conta consecutivamente
    for (let i = 1; i <= 5; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        remoteAddress: `192.0.2.${i}`, // IP diferente para cada tentativa
        payload: {
          identifier: targetIdentifier,
          password: 'senha_errada_alvo',
        },
      });
    }

    // A conta agora deve estar bloqueada pelo balde de conta (checkAccountLock)
    const lockStatus = checkAccountLock(targetLoginToken);
    expect(lockStatus.isLocked).toBe(true);
    expect(lockStatus.retryAfterSeconds).toBeGreaterThan(0);

    // Tentativa a partir de um 6º IP novo na conta bloqueada recebe HTTP 429 específico de conta bloqueada
    const resBlockedAccount = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      remoteAddress: '192.0.2.100', // IP fresco e sem saturação
      payload: {
        identifier: targetIdentifier,
        password: 'qualquer_senha',
      },
    });

    expect(resBlockedAccount.statusCode).toBe(429);
    const body = JSON.parse(resBlockedAccount.payload);
    expect(body.message).toContain('Conta temporariamente bloqueada por excesso de tentativas');
    expect(resBlockedAccount.headers['retry-after']).toBeDefined();

    // Limpeza
    recordLoginSuccess(targetLoginToken);
  });
});
