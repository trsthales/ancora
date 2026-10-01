import type { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.js';
import { profileRoutes } from './profile.js';

export async function apiRoutes(app: FastifyInstance) {
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(profileRoutes, { prefix: '/profile' });
}

export { authRoutes, profileRoutes };
