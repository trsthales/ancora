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
  serializers: {
    err: (err: any) => {
      const errorObj = err && typeof err === 'object' ? err : {};
      const name = String(errorObj.name || 'Error');
      const isDb =
        name === 'DrizzleQueryError' ||
        name === 'PostgresError' ||
        'query' in errorObj ||
        'params' in errorObj;

      if (isDb) {
        const causeObj =
          errorObj.cause && typeof errorObj.cause === 'object'
            ? (errorObj.cause as Record<string, unknown>)
            : undefined;
        return {
          type: name,
          name,
          code: (errorObj.code || causeObj?.code) as string,
          message: 'Falha na execução da query de banco de dados',
          stack: '',
        };
      }

      return {
        type: errorObj.type || errorObj.name || 'Error',
        name: errorObj.name || 'Error',
        message: errorObj.message || 'Error',
        stack: errorObj.stack || '',
        ...errorObj,
      };
    },
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
