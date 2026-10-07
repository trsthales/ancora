import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import { REDACTED_PATHS, loggerConfig } from './logger.js';

describe('logger: Sanitização Integral de Segredos e Dados Sensíveis (Falha 2.1)', () => {
  it('REDACTED_PATHS deve conter todas as chaves obrigatórias com níveis de profundidade', () => {
    const requiredPatterns = [
      'recoveryKey',
      '*.recoveryKey',
      '*.*.recoveryKey',
      'recoveryKeyHash',
      '*.recoveryKeyHash',
      '*.*.recoveryKeyHash',
      'identifier',
      '*.identifier',
      '*.*.identifier',
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

    for (const pattern of requiredPatterns) {
      expect(
        REDACTED_PATHS,
        `REDACTED_PATHS deve incluir o caminho '${pattern}'`,
      ).toContain(pattern);
    }
  });

  it('deve censurar chaves mestras, identificadores e escolhas clínicas no nível raiz', async () => {
    let rawLogs = '';
    const dest = {
      write(chunk: string) {
        rawLogs += chunk;
      },
    };

    const baseConfig = typeof loggerConfig === 'object' && loggerConfig !== null ? loggerConfig : {};
    const testApp = Fastify({
      logger: {
        ...baseConfig,
        level: 'info',
        stream: dest,
      },
    });

    const sensitivePayload = {
      recoveryKey: 'CROCKFORD-RECOVERY-KEY-12345',
      recoveryKeyHash: 'sha256-hash-secret-value-abcde',
      identifier: 'pseudonimo-sigiloso-paciente',
      chipId: 'chip-recaida-zero-30d',
      chipIds: ['chip-1', 'chip-2'],
      primaryChipId: 'chip-coragem-principal',
      safeData: 'informacao-publica',
    };

    testApp.log.info(sensitivePayload, 'Log de teste no nível raiz');
    await testApp.close();

    const parsedLog = JSON.parse(rawLogs.trim());

    expect(parsedLog.recoveryKey).toBe('[Redacted]');
    expect(parsedLog.recoveryKeyHash).toBe('[Redacted]');
    expect(parsedLog.identifier).toBe('[Redacted]');
    expect(parsedLog.chipId).toBe('[Redacted]');
    expect(parsedLog.chipIds).toBe('[Redacted]');
    expect(parsedLog.primaryChipId).toBe('[Redacted]');
    expect(parsedLog.safeData).toBe('informacao-publica');

    // Comprova que os dados sensíveis em texto claro não vazaram no log bruto
    expect(rawLogs).not.toContain('CROCKFORD-RECOVERY-KEY-12345');
    expect(rawLogs).not.toContain('sha256-hash-secret-value-abcde');
    expect(rawLogs).not.toContain('pseudonimo-sigiloso-paciente');
    expect(rawLogs).not.toContain('chip-recaida-zero-30d');
    expect(rawLogs).not.toContain('chip-coragem-principal');
  });

  it('deve censurar dados sensíveis aninhados (profundidade 1 e 2)', async () => {
    let rawLogs = '';
    const dest = {
      write(chunk: string) {
        rawLogs += chunk;
      },
    };

    const baseConfig = typeof loggerConfig === 'object' && loggerConfig !== null ? loggerConfig : {};
    const testApp = Fastify({
      logger: {
        ...baseConfig,
        level: 'info',
        stream: dest,
      },
    });

    const nestedPayload = {
      user: {
        recoveryKey: 'NESTED-RECOVERY-KEY-999',
        identifier: 'nested-pseudonym-888',
        chipId: 'nested-chip-777',
      },
      meta: {
        data: {
          recoveryKeyHash: 'nested-hash-666',
          primaryChipId: 'nested-primary-chip-555',
          chipIds: ['nested-chip-a', 'nested-chip-b'],
        },
      },
    };

    testApp.log.info(nestedPayload, 'Log de teste aninhado');
    await testApp.close();

    const parsedLog = JSON.parse(rawLogs.trim());

    expect(parsedLog.user.recoveryKey).toBe('[Redacted]');
    expect(parsedLog.user.identifier).toBe('[Redacted]');
    expect(parsedLog.user.chipId).toBe('[Redacted]');

    expect(parsedLog.meta.data.recoveryKeyHash).toBe('[Redacted]');
    expect(parsedLog.meta.data.primaryChipId).toBe('[Redacted]');
    expect(parsedLog.meta.data.chipIds).toBe('[Redacted]');

    expect(rawLogs).not.toContain('NESTED-RECOVERY-KEY-999');
    expect(rawLogs).not.toContain('nested-pseudonym-888');
    expect(rawLogs).not.toContain('nested-chip-777');
    expect(rawLogs).not.toContain('nested-hash-666');
    expect(rawLogs).not.toContain('nested-primary-chip-555');
  });
});
