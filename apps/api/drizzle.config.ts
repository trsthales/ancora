import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['auth_security', 'recovery_core'],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
