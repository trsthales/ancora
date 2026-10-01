import Fastify from 'fastify';
import cors from '@fastify/cors';

export const buildServer = async () => {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
  });

  app.get('/health', async () => {
    return {
      status: 'ok',
      app: 'ancora-api',
      timestamp: new Date().toISOString(),
    };
  });

  return app;
};

const start = async () => {
  const port = Number(process.env.PORT) || 3333;
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
