import Fastify from 'fastify';
import cors from '@fastify/cors';
import { sql } from 'drizzle-orm';
import { env } from './env.js';
import { db } from './db/index.js';

export const buildServer = async () => {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
  });

  app.get('/health', async (request, reply) => {
    try {
      await db.execute(sql`SELECT 1`);
      return {
        status: 'ok',
        app: 'ancora-api',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      request.log.error(error, 'Falha no healthcheck do banco de dados');
      return reply.status(503).send({
        status: 'error',
        database: 'disconnected',
      });
    }
  });

  return app;
};

const start = async () => {
  const port = env.PORT;
  const host = '0.0.0.0';

  try {
    const server = await buildServer();
    await server.listen({ port, host });
    server.log.info(`Servidor Âncora API iniciado em http://${host}:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

void start();
