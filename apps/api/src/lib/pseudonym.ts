import crypto from 'node:crypto';

const NOUNS = [
  'Caminho',
  'Farol',
  'Brisa',
  'Passo',
  'Porto',
  'Horizonte',
  'Vento',
  'Abrigo',
  'Sereno',
  'Firme',
] as const;

const QUALIFIERS = [
  'Calmo',
  'Seguro',
  'Livre',
  'Novo',
  'Presente',
  'Forte',
  'Atento',
  'Claro',
] as const;

/**
 * Generates a neutral and respectful pseudonym following the format:
 * @<Noun><Qualifier>_<2-3 digit number>
 * Example: @FarolSeguro_42 or @PassoCalmo_108
 */
export function generatePseudonym(): string {
  const noun = NOUNS[crypto.randomInt(0, NOUNS.length)];
  const qualifier = QUALIFIERS[crypto.randomInt(0, QUALIFIERS.length)];
  const suffix = crypto.randomInt(10, 1000); // 10 to 999 (2 to 3 digits)

  return `@${noun}${qualifier}_${suffix}`;
}
