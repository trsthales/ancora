import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { env } from '../env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrations = async () => {
  const migrationClient = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);

  console.log('⏳ Executando migrations...');

  const drizzleFolder = path.resolve(__dirname, '../../drizzle');

  await migrate(db, { migrationsFolder: drizzleFolder });

  console.log('✅ Migrations aplicadas com sucesso!');

  await migrationClient.end();
  process.exit(0);
};

runMigrations().catch(async (error) => {
  console.error('❌ Erro ao aplicar migrations:', error);
  process.exit(1);
});
