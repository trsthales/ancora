import crypto from 'node:crypto';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { env } from './env.js';
import { db } from './db/index.js';
import { startQueue, stopQueue, isQueueRunning } from './queue/index.js';
import { loggerConfig } from './lib/logger.js';
import { initDummyHash } from './lib/hash.js';
import { authRoutes, profileRoutes, journeyRoutes, accountRoutes } from './routes/index.js';

export const buildServer = async () => {
  await initDummyHash();

  const app = Fastify({
    logger: loggerConfig,
    genReqId: (req) => {
      const headerReqId = req.headers['x-request-id'];
      if (typeof headerReqId === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(headerReqId)) {
        return headerReqId;
      }
      return crypto.randomUUID();
    },
    requestIdHeader: false,
  });

  app.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  app.setErrorHandler((error: unknown, request, reply) => {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        status: 'error',
        message: error.issues[0]?.message || 'Dados inválidos',
        errors: error.flatten().fieldErrors,
      });
    }

    const errorObj = error && typeof error === 'object' ? (error as Record<string, unknown>) : null;
    const statusCode = typeof errorObj?.statusCode === 'number' ? errorObj.statusCode : 500;
    const message = error instanceof Error ? error.message : 'Erro interno no servidor';

    if (statusCode < 500) {
      return reply.status(statusCode).send({
        status: 'error',
        message,
      });
    }

    request.log.error(error);
    return reply.status(statusCode).send({
      status: 'error',
      message: 'Erro interno no servidor',
    });
  });

  await app.register(cors, {
    origin: true,
  });

  await app.register(fastifyRateLimit, {
    global: false,
  });

  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({
        status: 'error',
        message: 'Token de autenticação inválido ou expirado.',
      });
    }
  });

  await app.register(authRoutes, {
    prefix: '/api/v1/auth',
  });

  await app.register(profileRoutes, {
    prefix: '/api/v1/profile',
  });

  await app.register(journeyRoutes, {
    prefix: '/api/v1/journey',
  });

  await app.register(accountRoutes, {
    prefix: '/api/v1/account',
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
