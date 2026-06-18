import type { Card } from '../types';
import rawCards from './cards.json';

function normalizeColor(color: string): string {
  if (!color) return '';
  return color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
}

export const SAMPLE_CARDS: Card[] = (rawCards as Card[]).map((c) => ({
  ...c,
  color: normalizeColor(c.color),
}));

export const ALL_SETS = [...new Set(SAMPLE_CARDS.map((c) => c.set))].sort();
export const ALL_COLORS = [...new Set(SAMPLE_CARDS.map((c) => c.color).filter(Boolean))].sort();
export const ALL_CARD_TYPES = [...new Set(SAMPLE_CARDS.map((c) => c.cardType))].sort();
export const ALL_TITLES = [...new Set(SAMPLE_CARDS.map((c) => c.title).filter(Boolean))].sort();
