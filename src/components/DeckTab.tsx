import type { Card } from '../types';
import { colorDotStyle } from '../lib/colors';

type CardRow = { card: Card; count: number };

type Props = {
  mainCards: CardRow[];
  exCards: CardRow[];
  resourceCards: CardRow[];
  resourceFill: number;
  fillCard: Card | null;
  totalEx: number;
  exDeckSize: number;
  totalResource: number;
  resourceDeckSize: number;
  exResourceTotal: number;
  exResourceTypeMax: number;
  totalMain: number;
  mainDeckSize: number;
  savedId?: string;
  selectedVariants: Record<string, string>;
  onSaveClick: () => void;
  onAdd: (card: Card) => string | null;
  onRemove: (card: Card) => void;
  onCardClick: (card: Card) => void;
};

function maxCopies(card: Card): number {
  if (card.cardType === 'EX RESOURCE') return 5;
  if (card.cardType === 'RESOURCE') return 10;
  return 4;
}

function SectionHeader({ label, total, max }: { label: string; total: number; max: number }) {
  const over = total > max;
  return (
    <div className="flex items-center justify-between px-3 pt-3 pb-1">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-bold tabular-nums ${over ? 'text-red-400' : 'text-gray-500'}`}>
        {total} / {max}
      </span>
    </div>
  );
}

function CardRowItem({
  card,
  count,
  selectedVariants,
  exResourceTotal,
  exResourceTypeMax,
  onAdd,
  onRemove,
  onCardClick,
}: CardRow & {
  selectedVariants: Record<string, string>;
  exResourceTotal: number;
  exResourceTypeMax: number;
  onAdd: (c: Card) => string | null;
  onRemove: (c: Card) => void;
  onCardClick: (c: Card) => void;
}) {
  const max = maxCopies(card);
  const typeAtLimit = card.cardType === 'EX RESOURCE' && exResourceTotal >= exResourceTypeMax;
  const vid = selectedVariants[card.cardId];
  const variant = vid ? card.variants.find(v => v.variantId === vid) : card.variants[0];
  const rarity = variant
    ? (variant.parallel
        ? (variant.parallel === '+' || variant.parallel === '++'
            ? variant.rarity + variant.parallel
            : `${variant.rarity}/${variant.parallel}`)
        : variant.rarity)
    : '';

  return (
    <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg px-3 py-2.5 flex items-center gap-2">
      <button
        onClick={() => onCardClick(card)}
        className="flex items-center gap-2 min-w-0 flex-1 text-left"
      >
        <span className="shrink-0 w-2.5 h-2.5 rounded-full" style={colorDotStyle(card.color)} />
        <span className="text-xs text-gray-400 shrink-0 tabular-nums">{card.cardId}</span>
        <span className="text-sm text-white truncate font-medium">{card.cardName}</span>
      </button>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-gray-400 bg-[#2a2a2a] px-1.5 py-0.5 rounded tabular-nums">
          {card.cost}/{card.level}
        </span>
        {rarity && (
          <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">
            {rarity}
          </span>
        )}
        <button
          onClick={() => onRemove(card)}
          className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 text-white text-base font-bold flex items-center justify-center transition-colors"
          aria-label="1枚減らす"
        >
          −
        </button>
        <span className="text-sm font-bold text-white w-5 text-center tabular-nums">{count}</span>
        <button
          onClick={() => onAdd(card)}
          disabled={count >= max || typeAtLimit}
          className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-base font-bold flex items-center justify-center transition-colors"
          aria-label="1枚増やす"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function DeckTab({
  mainCards, exCards, resourceCards, resourceFill, fillCard,
  totalEx, exDeckSize, totalResource, resourceDeckSize,
  exResourceTotal, exResourceTypeMax,
  totalMain, mainDeckSize, savedId, selectedVariants, onSaveClick,
  onAdd, onRemove, onCardClick,
}: Props) {
  const isEmpty = mainCards.length === 0 && exCards.length === 0 && resourceCards.length === 0;
  const canSave = totalMain >= mainDeckSize;

  if (isEmpty) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500 text-sm">デッキにカードがありません</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-16 space-y-1">
      {/* 保存バナー */}
      {canSave && (
        <div className="mx-3 mt-3 rounded-xl border border-green-700 bg-green-900/20 px-4 py-3">
          <p className="text-xs text-green-400 font-bold mb-2">
            {savedId ? '保存済み' : `メインデッキが${mainDeckSize}枚になりました`}
          </p>
          <button
            onClick={onSaveClick}
            className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors"
          >
            {savedId ? '詳細を見る / 再発行' : '保存してUUIDを発行'}
          </button>
        </div>
      )}

      {/* メインデッキ */}
      {mainCards.length > 0 && (
        <section>
          <SectionHeader label="メインデッキ" total={totalMain} max={50} />
          <div className="px-3 space-y-1.5">
            {mainCards.map(({ card, count }) => (
              <CardRowItem key={card.cardId} card={card} count={count}
                selectedVariants={selectedVariants}
                exResourceTotal={exResourceTotal} exResourceTypeMax={exResourceTypeMax}
                onAdd={onAdd} onRemove={onRemove} onCardClick={onCardClick} />
            ))}
          </div>
        </section>
      )}

      {/* EXデッキ */}
      {(exCards.length > 0) && (
        <section>
          <SectionHeader label="EXデッキ (1種5枚まで)" total={totalEx} max={exDeckSize} />
          <div className="px-3 space-y-1.5">
            {exCards.map(({ card, count }) => (
              <CardRowItem key={card.cardId} card={card} count={count}
                selectedVariants={selectedVariants}
                exResourceTotal={exResourceTotal} exResourceTypeMax={exResourceTypeMax}
                onAdd={onAdd} onRemove={onRemove} onCardClick={onCardClick} />
            ))}
          </div>
        </section>
      )}

      {/* リソースデッキ */}
      {(resourceCards.length > 0 || resourceFill > 0) && (
        <section>
          <SectionHeader label="リソースデッキ (10枚固定)" total={totalResource + resourceFill} max={resourceDeckSize} />
          <div className="px-3 space-y-1.5">
            {resourceCards.map(({ card, count }) => (
              <CardRowItem key={card.cardId} card={card} count={count}
                selectedVariants={selectedVariants}
                exResourceTotal={exResourceTotal} exResourceTypeMax={exResourceTypeMax}
                onAdd={onAdd} onRemove={onRemove} onCardClick={onCardClick} />
            ))}
            {resourceFill > 0 && fillCard && (
              <div className="bg-[#1a1a2e] border border-gray-700 rounded-lg px-3 py-2.5 flex items-center gap-2 opacity-60">
                <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-gray-500" />
                <span className="text-xs text-gray-500 shrink-0 tabular-nums">{fillCard.cardId}</span>
                <span className="text-sm text-gray-400 truncate font-medium">{fillCard.cardName}（自動補完）</span>
                <span className="ml-auto text-sm font-bold text-gray-500 tabular-nums">{resourceFill}</span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
