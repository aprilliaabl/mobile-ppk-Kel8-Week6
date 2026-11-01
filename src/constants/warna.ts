import { Colors } from './theme';

/** Palet hitam yang sama dengan Dashboard Asisten (Colors.dark + aksen yang dipakai di sana). */
const d = Colors.dark;

export const W = {
  bg: d.background, // #000000
  card: d.backgroundElement, // #212225
  cardAlt: d.backgroundSelected, // #2E3135
  text: d.text,
  sub: d.textSecondary,
  line: 'rgba(150, 150, 150, 0.18)',
  green: '#10B981',
  greenSoft: 'rgba(16, 185, 129, 0.15)',
  red: '#EF4444',
  redSoft: 'rgba(239, 68, 68, 0.15)',
  blue: '#3B82F6',
  blueSoft: 'rgba(59, 130, 246, 0.15)',
  amber: '#F59E0B',
  graySoft: 'rgba(156, 163, 175, 0.15)',
  gray: '#9CA3AF',
} as const;

/** Lebar konten maksimum untuk laptop. HP dan tablet otomatis lebih sempit. */
export const MAX_W = 1000;

const AVATAR = ['#3B82F6', '#EC4899', '#10B981', '#8B5CF6', '#F59E0B', '#14B8A6', '#EF4444'];
export function warnaAvatar(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR[h % AVATAR.length];
}
