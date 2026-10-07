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

  // Chaves Mestras e Identificadores (Falha 2.1)
  'recoveryKey',
  '*.recoveryKey',
  '*.*.recoveryKey',
  'recoveryKeyHash',
  '*.recoveryKeyHash',
  '*.*.recoveryKeyHash',
  'identifier',
  '*.identifier',
  '*.*.identifier',

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

  // Dados de Saúde, Escolhas Clínicas e Rotina (Art. 11 LGPD - Falha 2.1)
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
  'chipId',
  '*.chipId',
  '*.*.chipId',
  'chipIds',
  '*.chipIds',
  '*.*.chipIds',
  'primaryChipId',
  '*.primaryChipId',
  '*.*.primaryChipId',
];

export const loggerConfig: FastifyServerOptions['logger'] = {
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  redact: {
    paths: REDACTED_PATHS,
    censor: '[Redacted]',
  },
  serializers: {
    err: (err: unknown) => {
      const errorObj = err && typeof err === 'object' ? (err as Record<string, unknown>) : {};
      const name = String(errorObj.name || 'Error');
      const constructorName =
        (err as { constructor?: { name?: string } } | null | undefined)?.constructor?.name ?? '';
      const causeObj =
        errorObj.cause && typeof errorObj.cause === 'object'
          ? (errorObj.cause as Record<string, unknown>)
          : undefined;

      const isDb =
        name === 'DrizzleQueryError' ||
        name === 'PostgresError' ||
        constructorName === 'PostgresError' ||
        constructorName === 'DrizzleQueryError' ||
        'query' in errorObj ||
        'params' in errorObj ||
        Boolean(
          causeObj &&
          ('query' in causeObj ||
            'params' in causeObj ||
            causeObj.name === 'PostgresError' ||
            causeObj.name === 'DrizzleQueryError'),
        );

      if (isDb) {
        const code = (errorObj.code || causeObj?.code) as string | undefined;
        const finalName = name === 'Error' ? (causeObj?.name as string) || 'PostgresError' : name;
        return {
          type: finalName,
          name: finalName,
          code,
          message: 'Falha na execução da query de banco de dados',
          stack: '',
        };
      }

      return {
        ...errorObj,
        type: String(errorObj.type || errorObj.name || 'Error'),
        name: String(errorObj.name || 'Error'),
        message: String(errorObj.message || 'Error'),
        stack: String(errorObj.stack || ''),
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
