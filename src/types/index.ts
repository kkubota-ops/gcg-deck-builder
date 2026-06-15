export type Card = {
  cardId: string;
  cardName: string;
  color: string;
  cost: number;
  level: number;
  cardType: string;
  title: string;
  set: string;
  cardText: string;
  variants: CardVariant[];
};

export type CardVariant = {
  variantId: string;
  rarity: string;
  parallel: string;
  imageUrl: string;
};

export type Deck = {
  id: string;
  name: string;
  cards: Record<string, number>;
  exCards: Record<string, number>;
  resourceCards: Record<string, number>;
  selectedVariants: Record<string, string>;
  savedId?: string;
  updatedAt: number;
};

export type SearchFilters = {
  query: string;
  color: string;
  cardType: string;
  title: string;
  minCost: number;
  maxCost: number;
  minLevel: number;
  maxLevel: number;
  set: string;
};
