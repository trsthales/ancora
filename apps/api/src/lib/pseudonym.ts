import crypto from 'node:crypto';

export const NOUNS = [
  'Caminho',
  'Farol',
  'Brisa',
  'Passo',
  'Porto',
  'Horizonte',
  'Vento',
  'Abrigo',
  'Refugio',
  'Recanto',
  'Aurora',
  'Alvorada',
  'Jardim',
  'Bosque',
  'Manancial',
  'Oceano',
  'Colina',
  'Estrela',
  'Planalto',
  'Raio',
  'Lua',
  'Sol',
  'Cais',
  'Vale',
  'Riacho',
  'Semente',
  'Arvore',
  'Raiz',
  'Claridade',
  'Remanso',
  'Ninho',
  'Fonte',
] as const;

export const QUALIFIERS = [
  'Calmo',
  'Seguro',
  'Livre',
  'Novo',
  'Presente',
  'Forte',
  'Atento',
  'Claro',
  'Manso',
  'Tranquilo',
  'Brilhante',
  'Suave',
  'Pacifico',
  'Radiante',
  'Constante',
  'Consciente',
  'Generoso',
  'Acolhedor',
  'Lucido',
  'Resiliente',
  'Valente',
  'Sincero',
  'Justo',
  'Vigilante',
  'Sereno',
  'Firme',
] as const;

/**
 * Generates a neutral and respectful pseudonym following the format:
 * @<Noun><Qualifier>_<4 digit number>
 * Example: @FarolSeguro_1042 or @PassoCalmo_8108
 */
export function generatePseudonym(): string {
  const noun = NOUNS[crypto.randomInt(0, NOUNS.length)];
  const qualifier = QUALIFIERS[crypto.randomInt(0, QUALIFIERS.length)];
  const suffix = crypto.randomInt(1000, 10000); // 1000 to 9999 (4 digits)

  return `@${noun}${qualifier}_${suffix}`;
}

