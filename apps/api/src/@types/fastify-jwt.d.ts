import '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string; // user.id
      profileId: string; // profile.id
      role: string; // user.role
      persona: string; // profile.persona
    };
    user: {
      sub: string;
      profileId: string;
      role: string;
      persona: string;
    };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
