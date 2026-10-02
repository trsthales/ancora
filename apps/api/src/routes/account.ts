import type { FastifyPluginAsync } from 'fastify';
import { deleteAccountHandler } from './auth.js';

export const accountRoutes: FastifyPluginAsync = async (app) => {
  // DELETE /api/v1/account (Direito ao Esquecimento - Art. 18, VI da LGPD)
  app.delete('/', { preHandler: [app.authenticate] }, deleteAccountHandler);
  app.delete('/account', { preHandler: [app.authenticate] }, deleteAccountHandler);
};
