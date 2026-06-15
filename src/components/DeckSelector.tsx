import { useState } from 'react';
import type { Deck } from '../types';

type Props = {
  decks: Deck[];
  activeDeckId: string;
  canCreate: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
};

export default function DeckSelector({
  decks,
  activeDeckId,
  canCreate,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  function startEdit(deck: Deck) {
    setEditingId(deck.id);
    setEditValue(deck.name);
  }

  function commitEdit(id: string) {
    if (editValue.trim()) onRename(id, editValue.trim());
    setEditingId(null);
  }

  const total = (d: Deck) => Object.values(d.cards).reduce((s, n) => s + n, 0);

  return (
    <div className="bg-[#1a1a1a] border-b border-gray-800 px-3 py-2 overflow-x-auto">
      <div className="flex gap-2 items-center min-w-max">
        {decks.map((deck) => (
          <div
            key={deck.id}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs cursor-pointer select-none ${
              deck.id === activeDeckId
                ? 'border-blue-500 bg-blue-900/20 text-white'
                : 'border-gray-700 bg-transparent text-gray-400 hover:border-gray-500'
            }`}
            onClick={() => onSelect(deck.id)}
          >
            {editingId === deck.id ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => commitEdit(deck.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit(deck.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent border-b border-blue-400 outline-none w-20 text-white"
              />
            ) : (
              <>
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startEdit(deck);
                  }}
                >
                  {deck.name}
                </span>
                <span className="text-gray-500 ml-1">{total(deck)}</span>
              </>
            )}
            {deck.id === activeDeckId && decks.length > 1 && editingId !== deck.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`「${deck.name}」を削除しますか？`)) onDelete(deck.id);
                }}
                className="ml-1 text-gray-600 hover:text-red-400 leading-none"
                aria-label="デッキ削除"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {canCreate && (
          <button
            onClick={onCreate}
            className="text-xs text-gray-500 hover:text-white border border-dashed border-gray-700 rounded-lg px-2 py-1.5 transition-colors"
          >
            + 新規
          </button>
        )}
      </div>
    </div>
  );
}
