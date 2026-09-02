import type { DiceBearStyle } from '../types';

export const DICEBEAR_STYLES: { id: DiceBearStyle; label: string }[] = [
  { id: 'bottts', label: 'Bottts' },
  { id: 'adventurer', label: 'Adventurer' },
  { id: 'fun-emoji', label: 'Fun Emoji' },
  { id: 'lorelei', label: 'Lorelei' },
];

export function buildAvatarUrl(style: DiceBearStyle, seed: string): string {
  const safeSeed = encodeURIComponent(seed.trim() || 'vibin');
  return `https://api.dicebear.com/9.x/${style}/png?seed=${safeSeed}&size=128`;
}

export function randomSeed(): string {
  return `vibe-${Math.random().toString(36).slice(2, 10)}`;
}
