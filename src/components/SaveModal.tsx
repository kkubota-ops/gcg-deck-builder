import { useState, useMemo } from 'react';
import type { Card } from '../types';

type SortMode = 'default' | 'color' | 'cost';

type Props = {
  savedId: string;
  deckName: string;
  mainCards: { card: Card; count: number }[];
  selectedVariants: Record<string, string>;
  onReissue: () => void;
  onClose: () => void;
};

const TYPE_ORDER: Record<string, number> = {
  UNIT: 0, PILOT: 1, COMMAND: 2, BASE: 3,
};

const COLOR_ORDER: Record<string, number> = {
  赤: 0, red: 0,
  青: 1, blue: 1,
  黄: 2, yellow: 2,
  緑: 3, green: 3,
  白: 4, white: 4,
  紫: 5, purple: 5,
};

function sortCards(cards: { card: Card; count: number }[], mode: SortMode) {
  return [...cards].sort((a, b) => {
    if (mode === 'default') {
      const tA = TYPE_ORDER[a.card.cardType] ?? 99;
      const tB = TYPE_ORDER[b.card.cardType] ?? 99;
      if (tA !== tB) return tA - tB;
      if (a.card.level !== b.card.level) return a.card.level - b.card.level;
      const cA = COLOR_ORDER[a.card.color.toLowerCase()] ?? 99;
      const cB = COLOR_ORDER[b.card.color.toLowerCase()] ?? 99;
      return cA - cB;
    }
    if (mode === 'color') {
      const cA = COLOR_ORDER[a.card.color.toLowerCase()] ?? 99;
      const cB = COLOR_ORDER[b.card.color.toLowerCase()] ?? 99;
      if (cA !== cB) return cA - cB;
      const tA = TYPE_ORDER[a.card.cardType] ?? 99;
      const tB = TYPE_ORDER[b.card.cardType] ?? 99;
      return tA - tB;
    }
    // level
    if (a.card.level !== b.card.level) return a.card.level - b.card.level;
    const tA = TYPE_ORDER[a.card.cardType] ?? 99;
    const tB = TYPE_ORDER[b.card.cardType] ?? 99;
    return tA - tB;
  });
}

function getVariantImageUrl(card: Card, selectedVariants: Record<string, string>): string {
  const vid = selectedVariants[card.cardId];
  const v = vid ? card.variants.find((v) => v.variantId === vid) : undefined;
  return (v ?? card.variants[0]).imageUrl;
}

async function buildDeckImage(
  cards: { card: Card; count: number }[],
  selectedVariants: Record<string, string>
): Promise<string> {
  const W = 160, H = 224, COLS = 5;
  const ROWS = Math.ceil(cards.length / COLS);
  const canvas = document.createElement('canvas');
  canvas.width = W * COLS;
  canvas.height = H * ROWS;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < cards.length; i++) {
    const { card, count } = cards[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = col * W, y = row * H;
    const src = getVariantImageUrl(card, selectedVariants);

    await new Promise<void>((res) => {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, x, y, W, H); res(); };
      img.onerror = () => {
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, W, H);
        res();
      };
      img.src = src;
    });

    const bw = 32, bh = 22;
    const bx = x + W - bw - 2, by = y + 2;
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`×${count}`, bx + bw / 2, by + bh / 2);
  }

  return canvas.toDataURL('image/png');
}

const SORT_LABELS: Record<SortMode, string> = {
  default: 'デフォルト',
  color: '色順',
  cost: 'レベル順',
};

export default function SaveModal({ savedId, deckName, mainCards, selectedVariants, onReissue, onClose }: Props) {
  const [showGrid, setShowGrid] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('default');

  const sortedCards = useMemo(() => sortCards(mainCards, sortMode), [mainCards, sortMode]);

  function handleCopy() {
    navigator.clipboard.writeText(savedId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleDownload() {
    setGenerating(true);
    try {
      const dataUrl = await buildDeckImage(sortedCards, selectedVariants);
      const a = document.createElement('a');
      a.download = `${deckName}-${savedId.slice(0, 8)}.png`;
      a.href = dataUrl;
      a.click();
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-[#141414] rounded-t-2xl overflow-y-auto max-h-[92svh]">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-[#141414] border-b border-gray-800 px-4 pt-4 pb-3 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-white">デッキ保存</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="px-4 py-4 space-y-4 pb-8">
          {/* UUID */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400">連携用UUID</p>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-[11px] font-mono text-gray-200 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 break-all select-all">
                {savedId}
              </span>
              <button
                onClick={handleCopy}
                className="shrink-0 text-xs px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                {copied ? 'コピー済' : 'コピー'}
              </button>
            </div>
            <button
              onClick={onReissue}
              className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              UUIDを再発行する
            </button>
          </div>

          {/* 画像一覧 */}
          {!showGrid ? (
            <button
              onClick={() => setShowGrid(true)}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors"
            >
              画像一覧で表示する
            </button>
          ) : (
            <div className="space-y-3">
              {/* 5列グリッド */}
              <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {sortedCards.map(({ card, count }) => (
                  <div key={card.cardId} className="relative">
                    <img
                      src={getVariantImageUrl(card, selectedVariants)}
                      alt={card.cardName}
                      className="w-full rounded"
                    />
                    <span className="absolute top-0.5 right-0.5 bg-black/75 text-white text-[10px] font-bold px-1 py-0.5 rounded leading-none">
                      ×{count}
                    </span>
                  </div>
                ))}
              </div>

              {/* 並び替え */}
              <div className="flex gap-2">
                {(['default', 'color', 'cost'] as SortMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSortMode(mode)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                      sortMode === mode
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#2a2a2a] text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {SORT_LABELS[mode]}
                  </button>
                ))}
              </div>

              {/* ダウンロード */}
              <button
                onClick={handleDownload}
                disabled={generating}
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-bold transition-colors"
              >
                {generating ? '生成中…' : '画像を保存する'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
