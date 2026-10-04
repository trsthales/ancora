import crypto from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { profiles, quarantinedPseudonyms } from '../db/schema/index.js';

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

type DbOrTransaction = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Verifica se um pseudônimo está disponível, checando se já existe em `profiles`
 * OU se está na tabela `quarantined_pseudonyms` com data vigente (`quarantinedUntil > NOW()`).
 */
export async function isPseudonymAvailable(
  pseudonym: string,
  txOrDb: DbOrTransaction = db,
): Promise<boolean> {
  const [existingProfile] = await txOrDb
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.pseudonym, pseudonym))
    .limit(1);

  if (existingProfile) {
    return false;
  }

  const [quarantined] = await txOrDb
    .select({ id: quarantinedPseudonyms.id })
    .from(quarantinedPseudonyms)
    .where(
      and(
        eq(quarantinedPseudonyms.pseudonym, pseudonym),
        gt(quarantinedPseudonyms.quarantinedUntil, new Date()),
      ),
    )
    .limit(1);

  if (quarantined) {
    return false;
  }

  return true;
}

/**
 * Gera um pseudônimo válido e disponível, garantindo que não colida com perfis existentes
 * nem com pseudônimos sob quarentena ativa de 30 dias.
 */
export async function generateAvailablePseudonym(
  txOrDb: DbOrTransaction = db,
  maxAttempts = 15,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = generatePseudonym();
    const available = await isPseudonymAvailable(candidate, txOrDb);
    if (available) {
      return candidate;
    }
  }

  throw new Error('Não foi possível gerar um pseudônimo único após múltiplas tentativas.');
}
