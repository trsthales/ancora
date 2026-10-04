import { describe, it, expect } from 'vitest';
import { isDateKeyWithinTolerance, getTodayDateKey } from './date-window.js';

describe('date-window: Janela de Tolerância de Fuso', () => {
  it('deve rejeitar formatos que não sejam YYYY-MM-DD', () => {
    expect(isDateKeyWithinTolerance('2026-1-1')).toBe(false);
    expect(isDateKeyWithinTolerance('invalid')).toBe(false);
    expect(isDateKeyWithinTolerance('04/10/2026')).toBe(false);
    expect(isDateKeyWithinTolerance('2026-10-04T00:00:00Z')).toBe(false);
    expect(isDateKeyWithinTolerance('')).toBe(false);
  });

  it('deve aceitar hoje, ontem e amanhã relativo à data de referência', () => {
    // 2026-10-04T12:00:00Z
    const refDate = new Date('2026-10-04T12:00:00Z');

    expect(isDateKeyWithinTolerance('2026-10-04', refDate)).toBe(true); // D
    expect(isDateKeyWithinTolerance('2026-10-03', refDate)).toBe(true); // D-1
    expect(isDateKeyWithinTolerance('2026-10-05', refDate)).toBe(true); // D+1
  });

  it('deve rejeitar datas com mais de 1 dia de diferença', () => {
    const refDate = new Date('2026-10-04T12:00:00Z');

    expect(isDateKeyWithinTolerance('2026-10-02', refDate)).toBe(false); // D-2
    expect(isDateKeyWithinTolerance('2026-10-06', refDate)).toBe(false); // D+2
    expect(isDateKeyWithinTolerance('2025-10-04', refDate)).toBe(false);
    expect(isDateKeyWithinTolerance('2026-11-04', refDate)).toBe(false);
  });

  it('deve lidar corretamente com a transição de fuso horário UTC e America/Sao_Paulo', () => {
    // Às 23:30 em Brasília (UTC-3), é 02:30 do dia seguinte em UTC
    // 2026-10-04 23:30 BRT = 2026-10-05 02:30 UTC
    const lateNightBRT = new Date('2026-10-05T02:30:00Z');

    // Em Brasília é 2026-10-04; em UTC é 2026-10-05
    // Datas permitidas cobrem D-1, D, D+1 de ambos os fusos: 2026-10-03, 2026-10-04, 2026-10-05, 2026-10-06
    expect(isDateKeyWithinTolerance('2026-10-04', lateNightBRT)).toBe(true);
    expect(isDateKeyWithinTolerance('2026-10-05', lateNightBRT)).toBe(true);
    expect(isDateKeyWithinTolerance('2026-10-03', lateNightBRT)).toBe(true);
    expect(isDateKeyWithinTolerance('2026-10-06', lateNightBRT)).toBe(true);
    expect(isDateKeyWithinTolerance('2026-10-02', lateNightBRT)).toBe(false);
    expect(isDateKeyWithinTolerance('2026-10-07', lateNightBRT)).toBe(false);
  });

  it('getTodayDateKey deve retornar data no formato YYYY-MM-DD', () => {
    const today = getTodayDateKey();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
