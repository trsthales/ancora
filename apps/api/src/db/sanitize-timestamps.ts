import { sql } from 'drizzle-orm';
import { db, client } from './index.js';

export async function sanitizeTimestamps() {
  console.log('Iniciando sanitização temporal de recovery_core.profiles...');

  // Trunca created_at de registros existentes em profiles para a precisão diária
  const result = await db.execute(sql`
    UPDATE recovery_core.profiles
    SET created_at = date_trunc('day', created_at)
    WHERE created_at != date_trunc('day', created_at);
  `);

  console.log('Sanitização temporal concluída com sucesso.');
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  sanitizeTimestamps()
    .then(async () => {
      await client.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Erro na sanitização temporal:', err);
      await client.end();
      process.exit(1);
    });
}
