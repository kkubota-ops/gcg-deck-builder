import type { Card } from '../types';
import rawCards from './cards.json';

export const SAMPLE_CARDS: Card[] = rawCards as Card[];

export const ALL_SETS = [...new Set(SAMPLE_CARDS.map((c) => c.set))].sort();
export const ALL_COLORS = [...new Set(SAMPLE_CARDS.map((c) => c.color))].sort();
export const ALL_CARD_TYPES = [...new Set(SAMPLE_CARDS.map((c) => c.cardType))].sort();
export const ALL_TITLES = [...new Set(SAMPLE_CARDS.map((c) => c.title).filter(Boolean))].sort();
