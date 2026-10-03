import '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string; // user.id
      role: string; // user.role
      persona: string; // profile.persona
      tv: number; // user.tokenVersion
    };
    user: {
      sub: string;
      role: string;
      persona: string;
      tv: number;
    };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
