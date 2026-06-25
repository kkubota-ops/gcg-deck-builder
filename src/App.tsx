import { useState, useMemo } from 'react';
import type { Card, SearchFilters } from './types';
import { SAMPLE_CARDS } from './data/sampleCards';
import { useDeck, EX_TYPES, RESOURCE_TYPES, DEFAULT_RESOURCE_ID, MAX_EX_RESOURCE_TYPE } from './hooks/useDeck';
import { useAuth } from './hooks/useAuth';
import { usePostedDecks } from './hooks/usePostedDecks';
import { useInventory } from './hooks/useInventory';
import { usePurchaseList } from './hooks/usePurchaseList';
import SearchFilter from './components/SearchFilter';
import CardItem from './components/CardItem';
import CardModal from './components/CardModal';
import DeckBar from './components/DeckBar';
import DeckSelector from './components/DeckSelector';
import DeckTab from './components/DeckTab';
import SaveModal from './components/SaveModal';
import AuthButton from './components/AuthButton';
import CommunityTab from './components/CommunityTab';
import PostDeckModal from './components/PostDeckModal'
import NicknameModal from './components/NicknameModal';
import InventoryTab from './components/InventoryTab';
import PurchaseTab from './components/PurchaseTab';

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

type Tab = 'search' | 'deck' | 'inventory' | 'purchase' | 'community';

export default function App() {
  const [tab, setTab] = useState<Tab>('search');
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [modalCard, setModalCard] = useState<Card | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);

  const { user, loading: authLoading, displayName, signInWithGoogle, signOut, updateDisplayName } = useAuth();
  const { decks: postedDecks, loading: communityLoading, postDeck, toggleLike, deletePostedDeck } = usePostedDecks(user?.id ?? null);
  const { owned, setCount: setOwnedCount } = useInventory(user?.id ?? null);
  const { items: purchaseItems, storeList, updateItem: updatePurchaseItem, deleteItem: deletePurchaseItem, addStore, removeStore, syncItem: syncPurchaseItem } = usePurchaseList(user?.id ?? null);

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
    importDeck,
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

  const purchasedCardIds = useMemo(
    () => new Set(purchaseItems.map(i => i.card_id)),
    [purchaseItems]
  );

  const deckCountById = useMemo(() => {
    const map: Record<string, number> = {}
    for (const { card, count } of [...mainDeckCards, ...exDeckCards, ...resourceDeckCards]) {
      map[card.cardId] = count
    }
    return map
  }, [mainDeckCards, exDeckCards, resourceDeckCards]);

  function handleSetOwnedCount(cardId: string, newCount: number) {
    setOwnedCount(cardId, newCount);
    const missing = Math.max(0, (deckCountById[cardId] ?? 0) - newCount);
    syncPurchaseItem(cardId, missing);
  }

  const BASE_RARITY_RANK: Record<string, number> = { C: 0, U: 1, R: 2, LR: 3, P: 4 };

  function rarityLabel(rarity: string, parallel: string): string {
    if (!parallel) return rarity;
    if (parallel === '+' || parallel === '++') return rarity + parallel;
    return `${rarity}/${parallel}`;
  }

  function rarityOrder(label: string): number {
    const base = label.split('/')[0].replace(/\+/g, '');
    const rank = (BASE_RARITY_RANK[base] ?? 99) * 100;
    if (label === base) return rank;
    if (label.includes('/')) return rank + 10;
    if (label.endsWith('++')) return rank + 30;
    if (label.endsWith('+')) return rank + 20;
    return rank + 5;
  }

  function writeExport(id: string) {
    try {
      const raw = localStorage.getItem('gcg_exports');
      const all: Record<string, unknown> = raw ? JSON.parse(raw) : {};
      all[id] = {
        name: activeDeck.name,
        savedAt: Date.now(),
        cards: mainDeckCards.map(({ card, count }) => {
          const rarities = [...new Set(card.variants.map(v => rarityLabel(v.rarity, v.parallel)))]
            .sort((a, b) => rarityOrder(a) - rarityOrder(b));
          return { name: card.cardName, count, rarities, defaultRarity: rarities[0] ?? '' };
        }),
      };
      localStorage.setItem('gcg_exports', JSON.stringify(all));
    } catch (_) {}
  }

  function handleSaveClick() {
    const id = savedId ?? saveDeck();
    writeExport(id);
    setShowSaveModal(true);
  }

  // デッキの色一覧を取得
  const activeDeckColors = useMemo(() => {
    const colorSet = new Set<string>();
    Object.keys(activeDeck.cards).forEach((id) => {
      const color = colorMap[id];
      if (color) colorSet.add(color);
    });
    return Array.from(colorSet);
  }, [activeDeck.cards]);

  async function handlePostDeck(name: string): Promise<string | null> {
    if (totalCards === 0) return 'デッキにカードが入っていません';
    if (!name.trim()) return 'デッキ名を入力してください';
    return postDeck({
      name: name.trim(),
      cards: activeDeck.cards,
      colors: activeDeckColors,
      description: '',
    });
  }

  return (
    <div className="flex flex-col min-h-svh max-w-lg mx-auto">
      {/* ヘッダー */}
      <header className="bg-[#0f0f0f] border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">
              GCG デッキビルダー
            </h1>
            <p className="text-[10px] text-gray-600 mt-0.5">
              非公式ファンツール ／ カード画像・データ:{' '}
              <a href="https://www.gundam-gcg.com/jp/cards/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">
                GUNDAM CARD GAME 公式サイト
              </a>
            </p>
          </div>
          <AuthButton
            user={user}
            loading={authLoading}
            displayName={displayName}
            onSignIn={signInWithGoogle}
            onSignOut={signOut}
            onEditNickname={() => setShowNicknameModal(true)}
          />
        </div>
      </header>

      {/* デッキ選択 */}
      {(tab === 'search' || tab === 'deck' || tab === 'inventory') && (
        <DeckSelector
          decks={decks}
          activeDeckId={activeDeckId}
          canCreate={canCreateDeck}
          onSelect={setActiveDeckId}
          onCreate={createDeck}
          onRename={renameDeck}
          onDelete={deleteDeck}
        />
      )}


      {/* 検索タブ */}
      {tab === 'search' && (
        <>
          <SearchFilter filters={filters} onChange={setFilters} />
          <main className="flex-1 overflow-y-auto px-3 pb-36">
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
        <>
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
            selectedVariants={selectedVariants}
            onSaveClick={handleSaveClick}
            onAdd={(card) => handleAdd(card)}
            onRemove={(card) => handleRemove(card)}
            onCardClick={(card) => setModalCard(card)}
          />
          {/* 投稿ボタン */}
          {user && totalCards > 0 && (
            <div className="px-3 pb-20 pt-2 bg-[#111]">
              <button
                onClick={() => setShowPostModal(true)}
                className="w-full text-sm text-white bg-green-700 hover:bg-green-600 rounded py-2.5 font-medium"
              >
                このデッキをコミュニティに投稿する
              </button>
            </div>
          )}
        </>
      )}

      {/* 在庫タブ */}
      {tab === 'inventory' && (
        <InventoryTab
          user={user}
          mainCards={mainDeckCards}
          exCards={exDeckCards}
          resourceCards={resourceDeckCards}
          owned={owned}
          purchasedCardIds={purchasedCardIds}
          onSetCount={handleSetOwnedCount}
          onSignIn={signInWithGoogle}
        />
      )}

      {/* 購入リストタブ */}
      {tab === 'purchase' && (
        <PurchaseTab
          user={user}
          items={purchaseItems}
          storeList={storeList}
          cardById={cardById}
          onUpdate={updatePurchaseItem}
          onDelete={deletePurchaseItem}
          onAddStore={addStore}
          onRemoveStore={removeStore}
          onSignIn={signInWithGoogle}
        />
      )}

      {/* みんなのデッキタブ */}
      {tab === 'community' && (
        <CommunityTab
          decks={postedDecks}
          loading={communityLoading}
          user={user}
          onLike={toggleLike}
          onDelete={deletePostedDeck}
          onSignIn={signInWithGoogle}
          onImport={(name, cards) => { const err = importDeck(name, cards); if (!err) setTab('deck'); return err; }}
          canImport={canCreateDeck}
        />
      )}

      {/* デッキバー（検索・デッキタブのみ表示） */}
      {(tab === 'search' || tab === 'deck') && (
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
      )}

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

      {/* ニックネームモーダル */}
      {showNicknameModal && user && (
        <NicknameModal
          currentName={displayName ?? ''}
          onSave={updateDisplayName}
          onClose={() => setShowNicknameModal(false)}
        />
      )}

      {/* 投稿モーダル */}
      {showPostModal && (
        <PostDeckModal
          deckName={activeDeck.name}
          onPost={handlePostDeck}
          onClose={() => setShowPostModal(false)}
        />
      )}

      {/* フッタータブナビ */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 max-w-lg mx-auto w-full flex bg-[#0f0f0f] border-t border-gray-800 pb-[env(safe-area-inset-bottom,0px)]">
        {(
          [
            { id: 'search',    label: '検索' },
            { id: 'deck',      label: `デッキ${totalCards > 0 ? `(${totalCards})` : ''}` },
            { id: 'inventory', label: '在庫' },
            { id: 'purchase',  label: `購入${purchaseItems.length > 0 ? `(${purchaseItems.length})` : ''}` },
            { id: 'community', label: 'みんな' },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${
              tab === id
                ? 'text-white border-t-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
