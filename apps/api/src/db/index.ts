import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from '../env.js';
import * as schema from './schema/index.js';

export const client = postgres(env.DATABASE_URL, {
  max: 15,
  idle_timeout: 30,
  connect_timeout: 5,
  max_lifetime: 3600,
});
export const db = drizzle(client, { schema });
