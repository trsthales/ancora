export const AVAILABLE_AVATARS = [
  { id: 'avatar_anchor', label: 'Âncora (Firmeza)', category: 'symbol' },
  { id: 'avatar_lighthouse', label: 'Farol (Orientação)', category: 'symbol' },
  { id: 'avatar_compass', label: 'Bússola (Direção)', category: 'symbol' },
  { id: 'avatar_wave', label: 'Onda Serena', category: 'nature' },
  { id: 'avatar_breeze', label: 'Brisa Leve', category: 'nature' },
  { id: 'avatar_mountain', label: 'Montanha Firme', category: 'nature' },
  { id: 'avatar_tree', label: 'Árvore Raiz', category: 'nature' },
  { id: 'avatar_sun', label: 'Alvorecer', category: 'nature' },
] as const;

export type Avatar = (typeof AVAILABLE_AVATARS)[number];
export type AvatarId = Avatar['id'];

export const AVATAR_IDS = AVAILABLE_AVATARS.map((a) => a.id) as [string, ...string[]];

export function isValidAvatar(id: string): boolean {
  return AVAILABLE_AVATARS.some((a) => a.id === id);
}
