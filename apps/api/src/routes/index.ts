import type { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.js';
import { profileRoutes } from './profile.js';
import { journeyRoutes } from './journey.js';
import { habitsRoutes } from './habits.js';
import { toolsRoutes, notificationsRoutes } from './tools.js';
import { accountRoutes } from './account.js';
import { communityRoutes } from './community.js';

export async function apiRoutes(app: FastifyInstance) {
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(profileRoutes, { prefix: '/profile' });
  await app.register(journeyRoutes, { prefix: '/journey' });
  await app.register(habitsRoutes, { prefix: '/journey/habits' });
  await app.register(toolsRoutes, { prefix: '/journey/tools' });
  await app.register(notificationsRoutes, { prefix: '/journey/notifications' });
  await app.register(accountRoutes, { prefix: '/account' });
  await app.register(communityRoutes, { prefix: '/community' });
}

export {
  authRoutes,
  profileRoutes,
  journeyRoutes,
  habitsRoutes,
  toolsRoutes,
  notificationsRoutes,
  accountRoutes,
  communityRoutes,
};
