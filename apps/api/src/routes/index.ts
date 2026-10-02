import type { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.js';
import { profileRoutes } from './profile.js';
import { journeyRoutes } from './journey.js';
import { accountRoutes } from './account.js';

export async function apiRoutes(app: FastifyInstance) {
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(profileRoutes, { prefix: '/profile' });
  await app.register(journeyRoutes, { prefix: '/journey' });
  await app.register(accountRoutes, { prefix: '/account' });
}

export { authRoutes, profileRoutes, journeyRoutes, accountRoutes };

