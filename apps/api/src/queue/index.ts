import type { SendOptions } from 'pg-boss';
import { boss } from './boss.js';

export { boss, bossConfig } from './boss.js';

let isRunning = false;

boss.on('error', (error) => {
  console.error('❌ [Queue] Erro no PgBoss:', error);
});

boss.on('stopped', () => {
  isRunning = false;
});

export const startQueue = async (): Promise<void> => {
  if (isRunning) {
    return;
  }
  await boss.start();
  isRunning = true;
  console.log('🚀 [Queue] PgBoss iniciado com sucesso no schema "pgboss"');
};

export const stopQueue = async (): Promise<void> => {
  if (!isRunning) {
    return;
  }
  await boss.stop({ graceful: true });
  isRunning = false;
  console.log('🛑 [Queue] PgBoss encerrado graciosamente');
};

export const isQueueRunning = (): boolean => {
  return isRunning;
};

export const DEFAULT_JOB_OPTIONS: SendOptions = {
  retryLimit: 3,
  retryDelay: 5,
  retryBackoff: true,
  expireInSeconds: 15 * 60,
  retentionSeconds: 7 * 24 * 3600,
  deleteAfterSeconds: 7 * 24 * 3600,
};

export const sendJob = async <T extends object>(
  name: string,
  data: T,
  options?: SendOptions,
): Promise<string | null> => {
  return boss.send(name, data, {
    ...DEFAULT_JOB_OPTIONS,
    ...options,
  });
};
