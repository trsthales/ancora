import type { FastifyServerOptions } from 'fastify';
import { env } from '../env.js';

export const REDACTED_PATHS = [
  // Credenciais e Autenticação
  'password',
  '*.password',
  '*.*.password',
  'passwordHash',
  '*.passwordHash',
  '*.*.passwordHash',
  'token',
  '*.token',
  '*.*.token',
  'refreshToken',
  '*.refreshToken',
  '*.*.refreshToken',
  'accessToken',
  '*.accessToken',
  '*.*.accessToken',

  // Headers sensíveis
  'req.headers.authorization',
  'req.headers.cookie',
  'headers.authorization',
  'headers.cookie',
  'authorization',
  '*.authorization',
  'cookie',
  '*.cookie',

  // Dados Pessoais e LGPD
  'email',
  '*.email',
  '*.*.email',
  'ip',
  '*.ip',
  'req.ip',
  'remoteAddress',
  '*.remoteAddress',
  'req.remoteAddress',

  // Dados de Saúde e Recuperação
  'cravingLevel',
  '*.cravingLevel',
  '*.*.cravingLevel',
  'notes',
  '*.notes',
  '*.*.notes',
  'emergencyPlans',
  '*.emergencyPlans',
  '*.*.emergencyPlans',
  'mood',
  '*.mood',
  '*.*.mood',
];

export const loggerConfig: FastifyServerOptions['logger'] = {
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  redact: {
    paths: REDACTED_PATHS,
    censor: '[Redacted]',
  },
  ...(env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
};
