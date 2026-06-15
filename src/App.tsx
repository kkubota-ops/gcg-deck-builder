import { useState, useMemo } from 'react';
import type { Card, SearchFilters } from './types';
import { SAMPLE_CARDS } from './data/sampleCards';
import { useDeck, EX_TYPES, RESOURCE_TYPES, DEFAULT_RESOURCE_ID, MAX_EX_RESOURCE_TYPE } from './hooks/useDeck';
import SearchFilter from './components/SearchFilter';
import CardItem from './components/CardItem';
import CardModal from './components/CardModal';
import DeckBar from './components/DeckBar';
import DeckSelector from './components/DeckSelector';
import DeckTab from './components/DeckTab';
import SaveModal from './components/SaveModal';

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  color: '',
  cardType: '',
  title: '',
  minCost: 0,
  maxCost: 10,
  minLevel: 0,
  maxLevel: 10,
  set: '',
};

const cardById: Record<string, Card> = Object.fromEntries(
  SAMPLE_CARDS.map((c) => [c.cardId, c])
);

const colorMap: Record<string, string> = Object.fromEntries(
  SAMPLE_CARDS.map((c) => [c.cardId, c.color])
);

type Tab = 'search' | 'deck';

export default function App() {
  const [tab, setTab] = useState<Tab>('search');
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [modalCard, setModalCard] = useState<Card | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const {
    decks,
    activeDeck,
    activeDeckId,
    setActiveDeckId,
    totalCards,
    totalDeckSize,
    totalEx,
    exDeckSize,
    totalResource,
    resourceDeckSize,
    resourceFill,
    addCard,
    removeCard,
    addExCard,
    removeExCard,
    addResourceCard,
    removeResourceCard,
    saveDeck,
    savedId,
    selectedVariants,
    setSelectedVariant,
    createDeck,
    renameDeck,
    deleteDeck,
    canCreateDeck,
  } = useDeck();

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return SAMPLE_CARDS.filter((c) => {
      if (q && !c.cardName.toLowerCase().includes(q) && !c.cardId.toLowerCase().includes(q))
        return false;
      if (filters.color && c.color !== filters.color) return false;
      if (filters.cardType && c.cardType !== filters.cardType) return false;
      if (filters.title && c.title !== filters.title) return false;
      if (c.cost < filters.minCost || c.cost > filters.maxCost) return false;
      if (c.level < filters.minLevel || c.level > filters.maxLevel) return false;
      if (filters.set && c.set !== filters.set) return false;
      return true;
    });
  }, [filters]);

  function getCount(card: Card): number {
    if (EX_TYPES.has(card.cardType)) return activeDeck.exCards[card.cardId] ?? 0;
    if (RESOURCE_TYPES.has(card.cardType)) return activeDeck.resourceCards[card.cardId] ?? 0;
    return activeDeck.cards[card.cardId] ?? 0;
  }

  // デッキタブ用: 各デッキのカード一覧
  const mainDeckCards = useMemo(() =>
    Object.entries(activeDeck.cards)
      .map(([id, count]) => ({ card: cardById[id], count }))
      .filter((x): x is { card: Card; count: number } => x.card != null)
      .sort((a, b) => a.card.cardId.localeCompare(b.card.cardId)),
    [activeDeck.cards]
  );

  const exDeckCards = useMemo(() =>
    Object.entries(activeDeck.exCards)
      .map(([id, count]) => ({ card: cardById[id], count }))
      .filter((x): x is { card: Card; count: number } => x.card != null)
      .sort((a, b) => a.card.cardId.localeCompare(b.card.cardId)),
    [activeDeck.exCards]
  );

  const exResourceTotal = useMemo(() =>
    Object.entries(activeDeck.exCards)
      .filter(([id]) => cardById[id]?.cardType === 'EX RESOURCE')
      .reduce((s, [, n]) => s + n, 0),
    [activeDeck.exCards]
  );

  const resourceDeckCards = useMemo(() =>
    Object.entries(activeDeck.resourceCards)
      .map(([id, count]) => ({ card: cardById[id], count }))
      .filter((x): x is { card: Card; count: number } => x.card != null)
      .sort((a, b) => a.card.cardId.localeCompare(b.card.cardId)),
    [activeDeck.resourceCards]
  );

  function handleAdd(card?: Card): string | null {
    const target = card ?? modalCard;
    if (!target) return null;
    if (EX_TYPES.has(target.cardType)) return addExCard(target.cardId, target.cardType, exResourceTotal);
    if (RESOURCE_TYPES.has(target.cardType)) return addResourceCard(target.cardId);
    return addCard(target.cardId, target.color, colorMap);
  }

  function handleRemove(card?: Card) {
    const target = card ?? modalCard;
    if (!target) return;
    if (activeDeck.exCards[target.cardId]) removeExCard(target.cardId);
    else if (activeDeck.resourceCards[target.cardId]) removeResourceCard(target.cardId);
    else removeCard(target.cardId);
  }

  const fillCard = cardById[DEFAULT_RESOURCE_ID] ?? null;

  function writeExport(id: string) {
    try {
      const raw = localStorage.getItem('gcg_exports');
      const all: Record<string, { name: string; savedAt: number; cards: { name: string; count: number }[] }> = raw ? JSON.parse(raw) : {};
      all[id] = {
        name: activeDeck.name,
        savedAt: Date.now(),
        cards: mainDeckCards.map(({ card, count }) => ({ name: card.cardName, count })),
      };
      localStorage.setItem('gcg_exports', JSON.stringify(all));
    } catch (_) {}
  }

  function handleSaveClick() {
    const id = savedId ?? saveDeck();
    writeExport(id);
    setShowSaveModal(true);
  }

  return (
    <div className="flex flex-col min-h-svh max-w-lg mx-auto">
      {/* ヘッダー */}
      <header className="bg-[#0f0f0f] border-b border-gray-800 px-4 py-3">
        <h1 className="text-base font-bold text-white tracking-wide">
          GCG デッキビルダー
        </h1>
      </header>

      {/* デッキ選択 */}
      <DeckSelector
        decks={decks}
        activeDeckId={activeDeckId}
        canCreate={canCreateDeck}
        onSelect={setActiveDeckId}
        onCreate={createDeck}
        onRename={renameDeck}
        onDelete={deleteDeck}
      />

      {/* タブ */}
      <div className="flex bg-[#1a1a1a] border-b border-gray-800">
        <button
          onClick={() => setTab('search')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            tab === 'search'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          カード検索
        </button>
        <button
          onClick={() => setTab('deck')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            tab === 'deck'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          デッキ {totalCards > 0 && <span className="text-xs ml-1 opacity-70">({totalCards})</span>}
        </button>
      </div>

      {/* 検索タブ */}
      {tab === 'search' && (
        <>
          <SearchFilter filters={filters} onChange={setFilters} />
          <main className="flex-1 overflow-y-auto px-3 pb-16">
            <div className="pt-2 pb-1 flex items-center justify-between">
              <span className="text-xs text-gray-600">カードID / カード名</span>
              <span className="text-xs text-gray-600">cost/level</span>
            </div>
            <div className="space-y-1.5">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-500 text-sm mt-8">該当するカードがありません</p>
            ) : (
              filtered.map((card) => (
                <CardItem
                  key={card.cardId}
                  card={card}
                  count={getCount(card)}
                  onClick={() => setModalCard(card)}
                />
              ))
            )}
            </div>
          </main>
        </>
      )}

      {/* デッキタブ */}
      {tab === 'deck' && (
        <DeckTab
          mainCards={mainDeckCards}
          exCards={exDeckCards}
          resourceCards={resourceDeckCards}
          resourceFill={resourceFill}
          fillCard={fillCard}
          totalEx={totalEx}
          exDeckSize={exDeckSize}
          totalResource={totalResource}
          resourceDeckSize={resourceDeckSize}
          exResourceTotal={exResourceTotal}
          exResourceTypeMax={MAX_EX_RESOURCE_TYPE}
          totalMain={totalCards}
          mainDeckSize={totalDeckSize}
          savedId={savedId}
          onSaveClick={handleSaveClick}
          onAdd={(card) => handleAdd(card)}
          onRemove={(card) => handleRemove(card)}
          onCardClick={(card) => setModalCard(card)}
        />
      )}

      {/* デッキバー */}
      <DeckBar
        totalMain={totalCards}
        maxMain={totalDeckSize}
        totalEx={totalEx}
        maxEx={exDeckSize}
        totalResource={totalResource}
        resourceDeckSize={resourceDeckSize}
        resourceFill={resourceFill}
        onTap={() => setTab('deck')}
      />

      {/* モーダル */}
      <CardModal
        card={modalCard}
        count={modalCard ? getCount(modalCard) : 0}
        totalResource={totalResource}
        resourceDeckSize={resourceDeckSize}
        totalEx={totalEx}
        exDeckSize={exDeckSize}
        exResourceTotal={exResourceTotal}
        exResourceTypeMax={MAX_EX_RESOURCE_TYPE}
        savedVariantId={modalCard ? selectedVariants[modalCard.cardId] : undefined}
        onVariantChange={(vid) => { if (modalCard) setSelectedVariant(modalCard.cardId, vid); }}
        onAdd={() => handleAdd()}
        onRemove={() => handleRemove()}
        onClose={() => setModalCard(null)}
      />

      {/* 保存モーダル */}
      {showSaveModal && savedId && (
        <SaveModal
          savedId={savedId}
          deckName={activeDeck.name}
          mainCards={mainDeckCards}
          selectedVariants={selectedVariants}
          onReissue={() => { const newId = saveDeck(); writeExport(newId); }}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
