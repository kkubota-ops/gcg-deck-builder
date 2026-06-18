import { v4 as uuidv4 } from 'uuid';
import type { Deck } from '../types';
import { useLocalStorage } from './useLocalStorage';

const MAX_DECK_COPIES = 4;
const TOTAL_DECK_SIZE = 50;
const MAX_EX_COPIES = 4;
const TOTAL_EX_SIZE = 15;
export const MAX_EX_RESOURCE_TYPE = 5;
const TOTAL_RESOURCE_SIZE = 10;
const MAX_DECKS = 5;

export const DEFAULT_RESOURCE_ID = 'R-001';
export const EX_TYPES = new Set(['UNIT TOKEN', 'EX RESOURCE', 'EX BASE']);
export const RESOURCE_TYPES = new Set(['RESOURCE']);

function makeDeck(name: string): Deck {
  return { id: uuidv4(), name, cards: {}, exCards: {}, resourceCards: {}, selectedVariants: {}, updatedAt: Date.now() };
}

function migrate(d: unknown): Deck {
  const raw = d as Deck;
  return { ...raw, exCards: raw.exCards ?? {}, resourceCards: raw.resourceCards ?? {}, selectedVariants: raw.selectedVariants ?? {} };
}

const DEFAULT_DECK = makeDeck('デッキ1');

export function useDeck() {
  const [rawDecks, setDecks] = useLocalStorage<Deck[]>('gcg_decks', [DEFAULT_DECK]);
  const [activeDeckId, setActiveDeckId] = useLocalStorage<string>('gcg_active_deck', DEFAULT_DECK.id);

  const decks = rawDecks.map(migrate);
  const activeDeck = decks.find((d) => d.id === activeDeckId) ?? decks[0];

  function sumMap(m: Record<string, number>) {
    return Object.values(m).reduce((s, n) => s + n, 0);
  }

  function colorsInDeck(deck: Deck, colorMap: Record<string, string>): string[] {
    const colors = new Set<string>();
    for (const cardId of Object.keys(deck.cards)) {
      const c = colorMap[cardId];
      if (c) colors.add(c);
    }
    return [...colors];
  }

  function update(deckId: string, patch: Partial<Deck>) {
    setDecks((prev) =>
      prev.map((d) => (d.id === deckId ? { ...migrate(d), ...patch, updatedAt: Date.now() } : d))
    );
  }

  // ── メインデッキ ──────────────────────────────────────────
  function addCard(cardId: string, cardColor: string, colorMap: Record<string, string>): string | null {
    const deck = activeDeck;
    const current = deck.cards[cardId] ?? 0;
    if (current >= MAX_DECK_COPIES) return `同一カードは${MAX_DECK_COPIES}枚まで`;

    const colors = colorsInDeck(deck, colorMap);
    if (!colors.includes(cardColor) && colors.length >= 2) return '3色以上は使用不可';

    if (sumMap(deck.cards) >= TOTAL_DECK_SIZE) return `メインデッキは${TOTAL_DECK_SIZE}枚まで`;

    update(deck.id, { cards: { ...deck.cards, [cardId]: current + 1 } });
    return null;
  }

  function removeCard(cardId: string) {
    const deck = activeDeck;
    const current = deck.cards[cardId] ?? 0;
    if (current <= 0) return;
    const cards = { ...deck.cards };
    if (current === 1) delete cards[cardId];
    else cards[cardId] = current - 1;
    update(deck.id, { cards });
  }

  // ── EXデッキ ──────────────────────────────────────────────
  function addExCard(cardId: string, cardType: string, exResourceTotal: number): string | null {
    const deck = activeDeck;
    const current = deck.exCards[cardId] ?? 0;
    const perCardMax = cardType === 'EX RESOURCE' ? MAX_EX_RESOURCE_TYPE : MAX_EX_COPIES;
    if (current >= perCardMax) return `同一カードは${perCardMax}枚まで`;
    if (cardType === 'EX RESOURCE' && exResourceTotal >= MAX_EX_RESOURCE_TYPE)
      return `EXリソースは合計${MAX_EX_RESOURCE_TYPE}枚まで`;
    if (sumMap(deck.exCards) >= TOTAL_EX_SIZE) return `EXデッキは${TOTAL_EX_SIZE}枚まで`;
    update(deck.id, { exCards: { ...deck.exCards, [cardId]: current + 1 } });
    return null;
  }

  function removeExCard(cardId: string) {
    const deck = activeDeck;
    const current = deck.exCards[cardId] ?? 0;
    if (current <= 0) return;
    const exCards = { ...deck.exCards };
    if (current === 1) delete exCards[cardId];
    else exCards[cardId] = current - 1;
    update(deck.id, { exCards });
  }

  // ── リソースデッキ ────────────────────────────────────────
  function addResourceCard(cardId: string): string | null {
    const deck = activeDeck;
    const current = deck.resourceCards[cardId] ?? 0;
    if (sumMap(deck.resourceCards) >= TOTAL_RESOURCE_SIZE) return `リソースデッキは${TOTAL_RESOURCE_SIZE}枚まで`;
    update(deck.id, { resourceCards: { ...deck.resourceCards, [cardId]: current + 1 } });
    return null;
  }

  function removeResourceCard(cardId: string) {
    const deck = activeDeck;
    const current = deck.resourceCards[cardId] ?? 0;
    if (current <= 0) return;
    const resourceCards = { ...deck.resourceCards };
    if (current === 1) delete resourceCards[cardId];
    else resourceCards[cardId] = current - 1;
    update(deck.id, { resourceCards });
  }

  // ── デッキ管理 ────────────────────────────────────────────
  function createDeck() {
    if (decks.length >= MAX_DECKS) return;
    const d = makeDeck(`デッキ${decks.length + 1}`);
    setDecks((prev) => [...prev, d]);
    setActiveDeckId(d.id);
  }

  function renameDeck(id: string, name: string) {
    update(id, { name });
  }

  function deleteDeck(id: string) {
    if (decks.length <= 1) return;
    const next = decks.filter((d) => d.id !== id);
    setDecks(next);
    if (activeDeckId === id) setActiveDeckId(next[0].id);
  }

  function importDeck(name: string, cards: Record<string, number>): string | null {
    if (decks.length >= MAX_DECKS) return `デッキは最大${MAX_DECKS}個までです`;
    const d = makeDeck(name);
    d.cards = cards;
    setDecks((prev) => [...prev, d]);
    setActiveDeckId(d.id);
    return null;
  }

  function saveDeck(): string {
    const savedId = uuidv4();
    update(activeDeck.id, { savedId });
    return savedId;
  }

  function setSelectedVariant(cardId: string, variantId: string) {
    update(activeDeck.id, {
      selectedVariants: { ...activeDeck.selectedVariants, [cardId]: variantId },
    });
  }

  const totalMain = sumMap(activeDeck.cards);
  const totalEx = sumMap(activeDeck.exCards);
  const totalResource = sumMap(activeDeck.resourceCards);
  const resourceFill = Math.max(0, TOTAL_RESOURCE_SIZE - totalResource);

  return {
    decks,
    activeDeck,
    activeDeckId,
    setActiveDeckId,
    totalCards: totalMain,
    totalDeckSize: TOTAL_DECK_SIZE,
    totalEx,
    exDeckSize: TOTAL_EX_SIZE,
    totalResource,
    resourceDeckSize: TOTAL_RESOURCE_SIZE,
    resourceFill,
    addCard,
    removeCard,
    addExCard,
    removeExCard,
    addResourceCard,
    removeResourceCard,
    saveDeck,
    savedId: activeDeck.savedId,
    selectedVariants: activeDeck.selectedVariants,
    setSelectedVariant,
    createDeck,
    renameDeck,
    deleteDeck,
    canCreateDeck: decks.length < MAX_DECKS,
    importDeck,
  };
}
