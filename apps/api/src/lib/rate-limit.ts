interface AccountFailureRecord {
  failedAttempts: number;
  firstFailedAt: number;
  lastFailedAt: number;
  lockedUntil?: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos

const accountFailures = new Map<string, AccountFailureRecord>();

/**
 * Verifica se a conta identificada por loginToken está bloqueada por excesso de falhas consecutivas.
 */
export function checkAccountLock(loginToken: string): {
  isLocked: boolean;
  retryAfterSeconds: number;
} {
  const record = accountFailures.get(loginToken);
  if (!record) {
    return { isLocked: false, retryAfterSeconds: 0 };
  }

  const now = Date.now();

  // Se estiver marcado como bloqueado
  if (record.lockedUntil) {
    if (now < record.lockedUntil) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { isLocked: true, retryAfterSeconds: remainingSeconds };
    }
    // Período de bloqueio expirou
    accountFailures.delete(loginToken);
    return { isLocked: false, retryAfterSeconds: 0 };
  }

  // Se a janela expirou desde a primeira falha
  if (now - record.firstFailedAt > FAILURE_WINDOW_MS) {
    accountFailures.delete(loginToken);
    return { isLocked: false, retryAfterSeconds: 0 };
  }

  return { isLocked: false, retryAfterSeconds: 0 };
}

/**
 * Registra uma tentativa falha de login para o loginToken.
 * Se atingir 5 falhas dentro de 15 minutos, bloqueia a conta por 15 minutos.
 */
export function recordLoginFailure(loginToken: string): {
  isLocked: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const record = accountFailures.get(loginToken);

  if (!record || now - record.firstFailedAt > FAILURE_WINDOW_MS) {
    accountFailures.set(loginToken, {
      failedAttempts: 1,
      firstFailedAt: now,
      lastFailedAt: now,
    });
    return { isLocked: false, retryAfterSeconds: 0 };
  }

  record.failedAttempts += 1;
  record.lastFailedAt = now;

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    const retryAfterSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
    return { isLocked: true, retryAfterSeconds };
  }

  return { isLocked: false, retryAfterSeconds: 0 };
}

/**
 * Zera o contador de falhas para o loginToken após login bem-sucedido.
 */
export function recordLoginSuccess(loginToken: string): void {
  accountFailures.delete(loginToken);
}

/**
 * Limpa periodicamente entradas antigas em memória para evitar memory leak.
 */
export function cleanupExpiredLocks(): void {
  const now = Date.now();
  for (const [token, record] of accountFailures.entries()) {
    if (record.lockedUntil && now >= record.lockedUntil) {
      accountFailures.delete(token);
    } else if (!record.lockedUntil && now - record.firstFailedAt > FAILURE_WINDOW_MS) {
      accountFailures.delete(token);
    }
  }
}

// Inicia rotina de limpeza a cada 5 minutos sem impedir o encerramento do processo
const cleanupInterval = setInterval(cleanupExpiredLocks, 5 * 60 * 1000);
cleanupInterval.unref();
