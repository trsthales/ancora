import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getIdempotentResponse,
  setIdempotentResponse,
  clearIdempotencyCache,
  cleanupExpiredIdempotencyKeys,
} from './idempotency.js';

describe('Idempotency In-Memory Cache', () => {
  beforeEach(() => {
    clearIdempotencyCache();
    vi.useRealTimers();
  });

  it('deve retornar null se a chave não existir', () => {
    const cached = getIdempotentResponse('chave-inexistente');
    expect(cached).toBeNull();
  });

  it('deve salvar e retornar a resposta dentro da janela de TTL', () => {
    const data = { status: 'success', data: { postId: '123' } };
    setIdempotentResponse('user-1:key-abc', data, 2000);

    const cached = getIdempotentResponse('user-1:key-abc');
    expect(cached).toEqual(data);
  });

  it('deve expirar e retornar null após o término do TTL', () => {
    vi.useFakeTimers();
    const data = { status: 'success', data: { postId: '456' } };
    setIdempotentResponse('user-1:key-xyz', data, 1000);

    // Imediatamente presente
    expect(getIdempotentResponse('user-1:key-xyz')).toEqual(data);

    // Avança 1001ms
    vi.advanceTimersByTime(1001);

    expect(getIdempotentResponse('user-1:key-xyz')).toBeNull();
  });

  it('deve limpar chaves expiradas na rotina de cleanup', () => {
    vi.useFakeTimers();
    setIdempotentResponse('user-1:key-1', { id: 1 }, 1000);
    setIdempotentResponse('user-1:key-2', { id: 2 }, 5000);

    vi.advanceTimersByTime(2000);
    cleanupExpiredIdempotencyKeys();

    expect(getIdempotentResponse('user-1:key-1')).toBeNull();
    expect(getIdempotentResponse('user-1:key-2')).toEqual({ id: 2 });
  });

  it('deve limpar todas as entradas com clearIdempotencyCache', () => {
    setIdempotentResponse('user-1:key-1', { id: 1 });
    setIdempotentResponse('user-1:key-2', { id: 2 });

    clearIdempotencyCache();

    expect(getIdempotentResponse('user-1:key-1')).toBeNull();
    expect(getIdempotentResponse('user-1:key-2')).toBeNull();
  });
});
