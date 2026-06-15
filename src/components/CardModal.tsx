import { useState, useEffect } from 'react';
import type { Card } from '../types';
import { EX_TYPES, RESOURCE_TYPES } from '../hooks/useDeck';
import { resolveImageUrl } from '../lib/imageUrl';

type Props = {
  card: Card | null;
  count: number;
  totalResource: number;
  resourceDeckSize: number;
  totalEx: number;
  exDeckSize: number;
  exResourceTotal: number;
  exResourceTypeMax: number;
  savedVariantId?: string;
  onVariantChange?: (variantId: string) => void;
  onAdd: () => string | null;
  onRemove: () => void;
  onClose: () => void;
};

const COLOR_BG: Record<string, string> = {
  赤: 'bg-red-900/20 border-red-800/50',
  青: 'bg-blue-900/20 border-blue-800/50',
  黄: 'bg-yellow-900/20 border-yellow-800/50',
  緑: 'bg-green-900/20 border-green-800/50',
  白: 'bg-gray-700/20 border-gray-600/50',
  紫: 'bg-purple-900/20 border-purple-800/50',
  BLUE: 'bg-blue-900/20 border-blue-800/50',
  RED: 'bg-red-900/20 border-red-800/50',
  YELLOW: 'bg-yellow-900/20 border-yellow-800/50',
  GREEN: 'bg-green-900/20 border-green-800/50',
  WHITE: 'bg-gray-700/20 border-gray-600/50',
  PURPLE: 'bg-purple-900/20 border-purple-800/50',
};

const COLOR_ACCENT: Record<string, string> = {
  赤: 'text-red-400', 青: 'text-blue-400', 黄: 'text-yellow-400',
  緑: 'text-green-400', 白: 'text-gray-300', 紫: 'text-purple-400',
  BLUE: 'text-blue-400', RED: 'text-red-400', YELLOW: 'text-yellow-400',
  GREEN: 'text-green-400', WHITE: 'text-gray-300', PURPLE: 'text-purple-400',
};

function getDeckLabel(cardType: string): string {
  if (EX_TYPES.has(cardType)) return 'EXデッキ';
  if (RESOURCE_TYPES.has(cardType)) return 'リソースデッキ';
  return 'メインデッキ';
}

function getMaxCopies(cardType: string): number {
  if (cardType === 'EX RESOURCE') return 5;
  if (RESOURCE_TYPES.has(cardType)) return 10;
  return 4;
}

export default function CardModal({
  card, count, totalResource, resourceDeckSize, totalEx, exDeckSize,
  exResourceTotal, exResourceTypeMax,
  savedVariantId, onVariantChange,
  onAdd, onRemove, onClose,
}: Props) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (card && card.variants.length > 0) {
      setSelectedVariantId(savedVariantId ?? card.variants[0].variantId);
    }
    setError(null);
  }, [card, savedVariantId]);

  function handleVariantSelect(variantId: string) {
    setSelectedVariantId(variantId);
    onVariantChange?.(variantId);
  }

  if (!card) return null;

  const selectedVariant =
    card.variants.find((v) => v.variantId === selectedVariantId) ?? card.variants[0];

  function handleAdd() {
    const err = onAdd();
    if (err) {
      setError(err);
      setTimeout(() => setError(null), 2000);
    } else {
      setError(null);
    }
  }

  const colorBg = COLOR_BG[card.color] ?? 'bg-gray-800/20 border-gray-700/50';
  const colorAccent = COLOR_ACCENT[card.color] ?? 'text-gray-300';
  const deckLabel = getDeckLabel(card.cardType);
  const maxCopies = getMaxCopies(card.cardType);

  // デッキ合計のチェックで+ボタン無効化
  let deckFull = false;
  if (EX_TYPES.has(card.cardType)) deckFull = totalEx >= exDeckSize;
  if (card.cardType === 'EX RESOURCE') deckFull = deckFull || exResourceTotal >= exResourceTypeMax;
  if (RESOURCE_TYPES.has(card.cardType)) deckFull = totalResource >= resourceDeckSize;
  const addDisabled = count >= maxCopies || deckFull;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-[#141414] rounded-t-2xl overflow-y-auto max-h-[92svh] pb-safe">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-[#141414] border-b border-gray-800 px-4 pt-4 pb-3 flex items-start justify-between gap-2 z-10">
          <div>
            <h2 className={`text-lg font-bold leading-tight ${colorAccent}`}>{card.cardName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {card.cardId} ／ {card.color || '—'} ／ コスト {card.cost || '—'} ／ Lv.{card.level || '—'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none mt-0.5 shrink-0"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* variant切替 */}
          {card.variants.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {card.variants.map((v) => (
                <button
                  key={v.variantId}
                  onClick={() => handleVariantSelect(v.variantId)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    selectedVariantId === v.variantId
                      ? 'bg-white text-black border-white font-bold'
                      : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {v.parallel ? `${v.rarity} (${v.parallel})` : v.rarity}
                </button>
              ))}
            </div>
          )}

          {/* カード画像 */}
          {selectedVariant && (
            <div className="flex justify-center">
              <img
                src={resolveImageUrl(selectedVariant.imageUrl)}
                alt={`${card.cardName} (${selectedVariant.rarity})`}
                className="rounded-xl shadow-xl max-h-72 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* カードテキスト */}
          <div className={`rounded-xl border px-4 py-3 ${colorBg}`}>
            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{card.cardText}</p>
          </div>

          {/* 枚数操作 */}
          <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-sm text-gray-300">デッキ投入枚数</span>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {deckLabel}・{card.cardType === 'EX RESOURCE'
                    ? `タイプ合計${exResourceTypeMax}枚まで`
                    : `1種${maxCopies}枚まで`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={onRemove}
                  disabled={count === 0}
                  className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xl font-bold flex items-center justify-center transition-colors"
                  aria-label="1枚減らす"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-white w-8 text-center">{count}</span>
                <button
                  onClick={handleAdd}
                  disabled={addDisabled}
                  className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xl font-bold flex items-center justify-center transition-colors"
                  aria-label="1枚増やす"
                >
                  +
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-400 text-center animate-pulse">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
