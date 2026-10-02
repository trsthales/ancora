import { PgBoss, type ConstructorOptions } from 'pg-boss';
import { env } from '../env.js';

export const bossConfig: ConstructorOptions = {
  connectionString: env.DATABASE_URL,
  schema: 'pgboss',
  application_name: 'ancora-api',
  max: 5,
  supervise: true,
  monitorVacuum: true,
};

export const boss = new PgBoss(bossConfig);
