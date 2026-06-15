import type { SearchFilters } from '../types';
import { ALL_COLORS, ALL_SETS, ALL_TITLES } from '../data/sampleCards';
import { COLOR_HEX, colorDotStyle } from '../lib/colors';

type Props = {
  filters: SearchFilters;
  onChange: (f: SearchFilters) => void;
};

export default function SearchFilter({ filters, onChange }: Props) {
  function set<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="bg-[#1a1a1a] border-b border-gray-800 px-3 pt-3 pb-2 space-y-2">
      {/* 検索ボックス */}
      <input
        type="search"
        placeholder="カード名で検索…"
        value={filters.query}
        onChange={(e) => set('query', e.target.value)}
        className="w-full rounded-lg bg-[#2a2a2a] border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />

      {/* 色フィルタ */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => set('color', '')}
          className={`text-xs px-2 py-1 rounded ${filters.color === '' ? 'bg-white text-black font-bold' : 'bg-gray-700 text-gray-300'}`}
        >
          全色
        </button>
        {ALL_COLORS.map((c) => {
          const isActive = filters.color === c;
          const hex = COLOR_HEX[c];
          return (
            <button
              key={c}
              onClick={() => set('color', isActive ? '' : c)}
              className="text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors"
              style={
                isActive
                  ? { backgroundColor: hex ?? '#4b5563', color: '#fff', fontWeight: 700, outline: `2px solid #fff`, outlineOffset: '1px' }
                  : { backgroundColor: '#374151', color: '#d1d5db' }
              }
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={colorDotStyle(c)}
              />
              {c}
            </button>
          );
        })}
      </div>

      {/* カードタイプフィルタ */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => set('cardType', '')}
          className={`text-xs px-2 py-1 rounded ${filters.cardType === '' ? 'bg-white text-black font-bold' : 'bg-gray-700 text-gray-300'}`}
        >
          全種
        </button>
        {(['UNIT', 'PILOT', 'COMMAND', 'BASE', 'UNIT TOKEN', 'EX RESOURCE', 'EX BASE', 'RESOURCE'] as const).map((t) => (
          <button
            key={t}
            onClick={() => set('cardType', filters.cardType === t ? '' : t)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              filters.cardType === t ? 'bg-white text-black font-bold' : 'bg-gray-700 text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* コスト・収録弾 */}
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-xs text-gray-400 shrink-0">コスト</span>
        <input
          type="number"
          min={0}
          max={10}
          value={filters.minCost}
          onChange={(e) => set('minCost', Number(e.target.value))}
          className="w-12 rounded bg-[#2a2a2a] border border-gray-700 px-1 py-1 text-xs text-center text-white focus:outline-none"
        />
        <span className="text-gray-500 text-xs">〜</span>
        <input
          type="number"
          min={0}
          max={10}
          value={filters.maxCost}
          onChange={(e) => set('maxCost', Number(e.target.value))}
          className="w-12 rounded bg-[#2a2a2a] border border-gray-700 px-1 py-1 text-xs text-center text-white focus:outline-none"
        />

        <span className="text-xs text-gray-400 ml-2 shrink-0">収録弾</span>
        <select
          value={filters.set}
          onChange={(e) => set('set', e.target.value)}
          className="rounded bg-[#2a2a2a] border border-gray-700 px-2 py-1 text-xs text-white focus:outline-none"
        >
          <option value="">すべて</option>
          {ALL_SETS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <span className="text-xs text-gray-400 ml-2 shrink-0">出典</span>
        <select
          value={filters.title}
          onChange={(e) => set('title', e.target.value)}
          className="rounded bg-[#2a2a2a] border border-gray-700 px-2 py-1 text-xs text-white focus:outline-none max-w-[120px]"
        >
          <option value="">すべて</option>
          {ALL_TITLES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
