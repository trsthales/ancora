import { describe, it, expect } from 'vitest';
import {
  CROCKFORD_BASE32_CHARSET,
  generateRecoveryKey,
  normalizeRecoveryKey,
  hashRecoveryKey,
  deriveAccountToken,
  deriveLoginToken,
} from './crypto-token.js';

describe('crypto-token: Chave Mestra e Derivações Criptográficas', () => {
  describe('generateRecoveryKey', () => {
    it('deve gerar chave no formato canônico FIRME-XXXXX-XXXXX-XXXXX-XXXXX', () => {
      const key = generateRecoveryKey();

      expect(key).toMatch(/^FIRME-[0-9A-Z]{5}-[0-9A-Z]{5}-[0-9A-Z]{5}-[0-9A-Z]{5}$/);
      expect(key.length).toBe(29);
    });

    it('deve conter estritamente caracteres do alfabeto Crockford Base32 (sem I, L, O, U)', () => {
      for (let i = 0; i < 50; i++) {
        const key = generateRecoveryKey();
        const payload = key.replace('FIRME-', '').replace(/-/g, '');

        expect(payload.length).toBe(20);

        for (const char of payload) {
          expect(CROCKFORD_BASE32_CHARSET).toContain(char);
          expect(['I', 'L', 'O', 'U']).not.toContain(char);
        }
      }
    });
  });

  describe('normalizeRecoveryKey', () => {
    it('deve normalizar chave padrão com prefixo FIRME-', () => {
      const raw = 'FIRME-01234-56789-ABCDE-FGHJK';
      const normalized = normalizeRecoveryKey(raw);
      expect(normalized).toBe('0123456789ABCDEFGHJK');
    });

    it('deve manter tolerância e normalizar chave com prefixo legado ANCORA- ou ANCORA', () => {
      const rawWithDash = 'ANCORA-01234-56789-ABCDE-FGHJK';
      const normalizedWithDash = normalizeRecoveryKey(rawWithDash);
      expect(normalizedWithDash).toBe('0123456789ABCDEFGHJK');

      const rawNoDash = 'ANCORA 01234 56789 ABCDE FGHJK';
      const normalizedNoDash = normalizeRecoveryKey(rawNoDash);
      expect(normalizedNoDash).toBe('0123456789ABCDEFGHJK');
    });

    it('deve ignorar variações de maiúsculas/minúsculas e espaços/hífens', () => {
      const mixed = '  firme-01234  56789-abcde-fghjk  ';
      const normalized = normalizeRecoveryKey(mixed);
      expect(normalized).toBe('0123456789ABCDEFGHJK');
    });

    it('deve mapear caracteres ambíguos: "O" -> "0" e "I"/"L" -> "1"', () => {
      const input = 'FIRME-OOOOO-IIIII-LLLLL-01234';
      const normalized = normalizeRecoveryKey(input);
      expect(normalized).toBe('00000111111111101234');
    });

    it('deve rejeitar estritamente o caractere proibido "U"', () => {
      expect(() => normalizeRecoveryKey('FIRME-01234-56789-ABCDU-FGHJK')).toThrowError(
        'Chave de recuperação inválida: caractere proibido "U".',
      );

      expect(() => normalizeRecoveryKey('firme-01234-56789-abcdu-fghjk')).toThrowError(
        'Chave de recuperação inválida: caractere proibido "U".',
      );
    });
  });

  describe('hashRecoveryKey', () => {
    it('deve produzir o mesmo SHA-256 para representações equivalentes da mesma chave', () => {
      const canonical = 'FIRME-01234-56789-ABCDE-FGHJK';
      const messy = '  firme 01234-56789 abcde fghjk  ';

      const hash1 = hashRecoveryKey(canonical);
      const hash2 = hashRecoveryKey(messy);

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
    });
  });

  describe('deriveAccountToken e deriveLoginToken', () => {
    it('deriveAccountToken deve ser determinístico para o mesmo userId', () => {
      const userId = '11111111-2222-3333-4444-555555555555';
      const token1 = deriveAccountToken(userId);
      const token2 = deriveAccountToken(userId);

      expect(token1).toHaveLength(64);
      expect(token1).toBe(token2);

      const otherToken = deriveAccountToken('99999999-8888-7777-6666-555555555555');
      expect(token1).not.toBe(otherToken);
    });

    it('deriveLoginToken deve ser determinístico e insensível a espaços e casing do pseudônimo', () => {
      const pseud1 = '@FarolSeguro_1042';
      const pseud2 = '  @farolseguro_1042  ';

      const token1 = deriveLoginToken(pseud1);
      const token2 = deriveLoginToken(pseud2);

      expect(token1).toHaveLength(64);
      expect(token1).toBe(token2);

      const tokenOther = deriveLoginToken('@PassoCalmo_8108');
      expect(token1).not.toBe(tokenOther);
    });
  });
});
