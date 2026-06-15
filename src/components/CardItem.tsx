import type { Card } from '../types';
import { colorDotStyle } from '../lib/colors';

type Props = {
  card: Card;
  count: number;
  onClick: () => void;
};

export default function CardItem({ card, count, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[#1e1e1e] hover:bg-[#252525] active:bg-[#2a2a2a] border border-gray-800 rounded-lg px-3 py-2.5 flex items-center justify-between gap-2 transition-colors"
    >
      {/* 左: ドット → カードID → カード名 */}
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="shrink-0 w-2.5 h-2.5 rounded-full"
          style={colorDotStyle(card.color)}
        />
        <span className="text-xs text-gray-400 shrink-0 tabular-nums">{card.cardId}</span>
        <span className="text-sm text-white truncate font-medium">{card.cardName}</span>
      </div>

      {/* 右: cost/level + 枚数バッジ */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-gray-400 bg-[#2a2a2a] px-1.5 py-0.5 rounded tabular-nums">
          {card.cost}/{card.level}
        </span>
        {count > 0 && (
          <span className="text-xs font-bold text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded min-w-[20px] text-center">
            {count}
          </span>
        )}
      </div>
    </button>
  );
}
