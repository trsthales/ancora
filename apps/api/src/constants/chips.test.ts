import { describe, expect, it } from 'vitest';
import {
  ALL_CANONICAL_CHIP_IDS,
  EVITO_CHIPS,
  EVITO_CHIP_IDS,
  FACO_CHIPS,
  FACO_CHIP_IDS,
  ME_AJUDA_CHIPS,
  ME_AJUDA_CHIP_IDS,
} from './chips.js';

describe('Catálogo Canônico de Chips da Tríade (TASK-403A)', () => {
  it('deve conter exatamente 30 chips em FACO', () => {
    expect(FACO_CHIPS).toHaveLength(30);
    expect(FACO_CHIP_IDS).toHaveLength(30);
  });

  it('deve conter exatamente 41 chips em EVITO com IDs estritos', () => {
    expect(EVITO_CHIPS).toHaveLength(41);
    expect(EVITO_CHIP_IDS).toHaveLength(41);

    const categories = EVITO_CHIPS.map((c) => c.category);
    expect(categories.filter((c) => c === 'Ambientes')).toHaveLength(9);
    expect(categories.filter((c) => c === 'Dinheiro e Hábitos')).toHaveLength(10);
    expect(categories.filter((c) => c === 'Pessoas e Contatos')).toHaveLength(10);
    expect(categories.filter((c) => c === 'HALT')).toHaveLength(12);
  });

  it('deve conter exatamente 26 chips em ME_AJUDA com IDs estritos', () => {
    expect(ME_AJUDA_CHIPS).toHaveLength(26);
    expect(ME_AJUDA_CHIP_IDS).toHaveLength(26);

    const categories = ME_AJUDA_CHIPS.map((c) => c.category);
    expect(categories.filter((c) => c === 'Na Hora da Fissura')).toHaveLength(6);
    expect(categories.filter((c) => c === 'Pedir Apoio')).toHaveLength(5);
    expect(categories.filter((c) => c === 'Organizar o Dia')).toHaveLength(5);
    expect(categories.filter((c) => c === 'Pensar Diferente')).toHaveLength(6);
    expect(categories.filter((c) => c === 'Cuidar do Corpo')).toHaveLength(4);
  });

  it('deve unificar todos os 97 chips canônicos sem duplicidades', () => {
    expect(ALL_CANONICAL_CHIP_IDS).toHaveLength(97);
    const uniqueIds = new Set(ALL_CANONICAL_CHIP_IDS);
    expect(uniqueIds.size).toBe(97);
  });

  it('deve validar integridade estrutural (id, category, label, icon) de todos os chips', () => {
    const allChips = [...FACO_CHIPS, ...EVITO_CHIPS, ...ME_AJUDA_CHIPS];
    expect(allChips).toHaveLength(97);

    for (const chip of allChips) {
      expect(chip.id).toBeTruthy();
      expect(typeof chip.id).toBe('string');
      expect(chip.category).toBeTruthy();
      expect(typeof chip.category).toBe('string');
      expect(chip.label).toBeTruthy();
      expect(typeof chip.label).toBe('string');
      expect(chip.icon).toBeTruthy();
      expect(typeof chip.icon).toBe('string');
    }
  });
});
