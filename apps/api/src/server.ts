import crypto from 'node:crypto';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { sql } from 'drizzle-orm';
import { env } from './env.js';
import { db } from './db/index.js';
import { startQueue, stopQueue, isQueueRunning } from './queue/index.js';
import { loggerConfig } from './lib/logger.js';

export const buildServer = async () => {
  const app = Fastify({
    logger: loggerConfig,
    genReqId: (req) => {
      const headerReqId = req.headers['x-request-id'];
      if (typeof headerReqId === 'string' && headerReqId.length > 0) {
        return headerReqId;
      }
      return crypto.randomUUID();
    },
    requestIdHeader: 'x-request-id',
  });

  await app.register(cors, {
    origin: true,
  });

  app.addHook('onClose', async () => {
    await stopQueue();
  });

  app.get('/health', async (request, reply) => {
    let databaseStatus = 'disconnected';
    let queueStatus = 'stopped';

    try {
      await db.execute(sql`SELECT 1`);
      databaseStatus = 'connected';
    } catch (error) {
      request.log.error(error, 'Falha no healthcheck do banco de dados');
    }

    if (isQueueRunning()) {
      queueStatus = 'running';
    }

    const isHealthy = databaseStatus === 'connected' && queueStatus === 'running';

    const response = {
      status: isHealthy ? 'ok' : 'error',
      app: 'ancora-api',
      database: databaseStatus,
      queue: queueStatus,
      timestamp: new Date().toISOString(),
    };

    if (!isHealthy) {
      return reply.status(503).send(response);
    }

    return response;
  });

  if (env.NODE_ENV !== 'production') {
    const testLogHandler = async (request: FastifyRequest, _reply: FastifyReply) => {
      request.log.info({ body: request.body }, 'Validando mascaramento de dados sensíveis');
      return { ok: true };
    };

    app.post('/test-log', testLogHandler);
    app.post('/api/v1/test-log', testLogHandler);
  }

  return app;
};

const start = async () => {
  const port = env.PORT;
  const host = '0.0.0.0';

  try {
    await db.execute(sql`SELECT 1`);
    await startQueue();

    const server = await buildServer();
    await server.listen({ port, host });
    server.log.info(`Servidor Âncora API iniciado em http://${host}:${port}`);
  } catch (err) {
    console.error(err);
    await stopQueue().catch(() => {});
    process.exit(1);
  }
};

void start();
