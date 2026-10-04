import { describe, it, expect, beforeEach } from 'vitest';
import { checkAccountLock, recordLoginFailure, recordLoginSuccess } from './rate-limit.js';

describe('rate-limit: Controle de Falhas e Bloqueio por Conta', () => {
  const testToken1 = 'test-login-token-alpha-12345';
  const testToken2 = 'test-login-token-beta-67890';

  beforeEach(() => {
    // Garante estado limpo antes de cada teste
    recordLoginSuccess(testToken1);
    recordLoginSuccess(testToken2);
  });

  it('não deve bloquear a conta nas primeiras 4 tentativas falhas', () => {
    for (let attempt = 1; attempt <= 4; attempt++) {
      const result = recordLoginFailure(testToken1);
      expect(result.isLocked).toBe(false);
      expect(result.retryAfterSeconds).toBe(0);

      const check = checkAccountLock(testToken1);
      expect(check.isLocked).toBe(false);
      expect(check.retryAfterSeconds).toBe(0);
    }
  });

  it('deve bloquear a conta na 5ª tentativa falha consecutiva e informar retryAfterSeconds', () => {
    // 4 falhas iniciais
    for (let i = 0; i < 4; i++) {
      recordLoginFailure(testToken1);
    }

    // 5ª falha dispara bloqueio
    const fifthResult = recordLoginFailure(testToken1);
    expect(fifthResult.isLocked).toBe(true);
    expect(fifthResult.retryAfterSeconds).toBeGreaterThan(0);
    expect(fifthResult.retryAfterSeconds).toBeLessThanOrEqual(900); // 15 minutos = 900s

    // checkAccountLock deve refletir o bloqueio ativo
    const check = checkAccountLock(testToken1);
    expect(check.isLocked).toBe(true);
    expect(check.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('recordLoginSuccess deve zerar as falhas e desbloquear imediatamente a conta', () => {
    // Leva a conta ao bloqueio
    for (let i = 0; i < 5; i++) {
      recordLoginFailure(testToken1);
    }
    expect(checkAccountLock(testToken1).isLocked).toBe(true);

    // Login com sucesso reseta o balde
    recordLoginSuccess(testToken1);

    const checkAfterSuccess = checkAccountLock(testToken1);
    expect(checkAfterSuccess.isLocked).toBe(false);
    expect(checkAfterSuccess.retryAfterSeconds).toBe(0);
  });

  it('deve manter isolamento estrito entre diferentes contas/tokens', () => {
    // Bloqueia conta 1
    for (let i = 0; i < 5; i++) {
      recordLoginFailure(testToken1);
    }
    expect(checkAccountLock(testToken1).isLocked).toBe(true);

    // Conta 2 deve permanecer completamente desbloqueada
    expect(checkAccountLock(testToken2).isLocked).toBe(false);

    // Falhas na conta 2 não interferem na conta 1
    const failToken2 = recordLoginFailure(testToken2);
    expect(failToken2.isLocked).toBe(false);
    expect(checkAccountLock(testToken1).isLocked).toBe(true);
  });
});
