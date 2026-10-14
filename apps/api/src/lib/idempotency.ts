interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 2 * 60 * 1000; // 2 minutos
const idempotencyMap = new Map<string, CacheEntry<unknown>>();

/**
 * Obtém uma resposta cacheada associada à chave de idempotência se ainda não expirou.
 */
export function getIdempotentResponse<T = unknown>(key: string): T | null {
  const entry = idempotencyMap.get(key);
  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (now > entry.expiresAt) {
    idempotencyMap.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Salva uma resposta no cache de idempotência com TTL especificado (padrão 2 minutos).
 */
export function setIdempotentResponse<T = unknown>(
  key: string,
  data: T,
  ttlMs: number = DEFAULT_TTL_MS,
): void {
  const expiresAt = Date.now() + ttlMs;
  idempotencyMap.set(key, { data, expiresAt });
}

/**
 * Remove periodicamente chaves expiradas do cache para evitar vazamento de memória.
 */
export function cleanupExpiredIdempotencyKeys(): void {
  const now = Date.now();
  for (const [key, entry] of idempotencyMap.entries()) {
    if (now > entry.expiresAt) {
      idempotencyMap.delete(key);
    }
  }
}

/**
 * Limpa todo o cache em memória (destinado principalmente para suítes de teste).
 */
export function clearIdempotencyCache(): void {
  idempotencyMap.clear();
}

// Inicia rotina de limpeza a cada 60 segundos sem impedir o encerramento do processo
const cleanupInterval = setInterval(cleanupExpiredIdempotencyKeys, 60 * 1000);
cleanupInterval.unref();
