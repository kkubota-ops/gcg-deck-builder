import { useState, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import type { PostedDeck } from '../hooks/usePostedDecks'
import { COLOR_HEX, colorDotStyle } from '../lib/colors'
import { ALL_COLORS, SAMPLE_CARDS } from '../data/sampleCards'
import { resolveImageUrl } from '../lib/imageUrl'
import type { Card } from '../types'

type SortKey = 'created_at' | 'like_count'

const cardById = Object.fromEntries(SAMPLE_CARDS.map((c) => [c.cardId, c]))

const TYPE_ORDER: Record<string, number> = { UNIT: 0, PILOT: 1, COMMAND: 2, BASE: 3 }
const COLOR_ORDER: Record<string, number> = { red: 0, blue: 1, yellow: 2, green: 3, white: 4, purple: 5 }

function sortByDefault(cards: { card: Card; count: number }[]) {
  return [...cards].sort((a, b) => {
    const tA = TYPE_ORDER[a.card.cardType] ?? 99
    const tB = TYPE_ORDER[b.card.cardType] ?? 99
    if (tA !== tB) return tA - tB
    if (a.card.level !== b.card.level) return a.card.level - b.card.level
    const cA = COLOR_ORDER[a.card.color.toLowerCase()] ?? 99
    const cB = COLOR_ORDER[b.card.color.toLowerCase()] ?? 99
    return cA - cB
  })
}

type Props = {
  decks: PostedDeck[]
  loading: boolean
  user: User | null
  onLike: (deck: PostedDeck) => void
  onDelete: (deckId: string) => void
  onSignIn: () => void
  onImport: (name: string, cards: Record<string, number>) => string | null
  canImport: boolean
}

export default function CommunityTab({ decks, loading, user, onLike, onDelete, onSignIn, onImport, canImport }: Props) {
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [expandedDeckId, setExpandedDeckId] = useState<string | null>(null)
  const [importedId, setImportedId] = useState<string | null>(null)

  function handleImport(deck: PostedDeck) {
    const err = onImport(deck.name, deck.cards)
    if (err) { alert(err); return }
    setImportedId(deck.id)
    setTimeout(() => setImportedId(null), 2000)
  }

  function toggleColor(color: string) {
    setSelectedColors((prev) => {
      if (prev.includes(color)) return prev.filter((c) => c !== color)
      if (prev.length >= 2) return prev
      return [...prev, color]
    })
  }

  const filtered = useMemo(() => {
    let result = [...decks]

    if (selectedColors.length === 1) {
      result = result.filter((d) => d.colors.includes(selectedColors[0]))
    } else if (selectedColors.length === 2) {
      result = result.filter((d) =>
        selectedColors.every((c) => d.colors.includes(c))
      )
    }

    if (sortKey === 'like_count') {
      result.sort((a, b) => b.like_count - a.like_count)
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return result
  }, [decks, selectedColors, sortKey])

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">読み込み中...</div>
  }

  return (
    <div className="flex-1 overflow-y-auto pb-16">
      {/* フィルタ・ソートエリア */}
      <div className="bg-[#1a1a1a] border-b border-gray-800 px-3 pt-3 pb-2 space-y-2">
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => setSelectedColors([])}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              selectedColors.length === 0 ? 'bg-white text-black font-bold' : 'bg-gray-700 text-gray-300'
            }`}
          >
            全色
          </button>
          {ALL_COLORS.map((c) => {
            const isActive = selectedColors.includes(c)
            const hex = COLOR_HEX[c]
            return (
              <button
                key={c}
                onClick={() => toggleColor(c)}
                className="text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors"
                style={
                  isActive
                    ? { backgroundColor: hex ?? '#4b5563', color: '#fff', fontWeight: 700, outline: '2px solid #fff', outlineOffset: '1px' }
                    : { backgroundColor: '#374151', color: '#d1d5db' }
                }
              >
                <span className="inline-block w-2 h-2 rounded-full" style={colorDotStyle(c)} />
                {c}
              </button>
            )
          })}
          {selectedColors.length > 0 && (
            <span className="text-[10px] text-gray-500">
              {selectedColors.length === 1 ? 'OR検索' : 'AND検索'}（最大2色）
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSortKey('created_at')}
            className={`text-xs px-3 py-1 rounded transition-colors ${
              sortKey === 'created_at' ? 'bg-blue-600 text-white font-bold' : 'bg-gray-700 text-gray-300'
            }`}
          >
            新着順
          </button>
          <button
            onClick={() => setSortKey('like_count')}
            className={`text-xs px-3 py-1 rounded transition-colors ${
              sortKey === 'like_count' ? 'bg-blue-600 text-white font-bold' : 'bg-gray-700 text-gray-300'
            }`}
          >
            ♥ いいね順
          </button>
        </div>
      </div>

      {!user && (
        <div className="mx-3 mt-3 p-3 bg-[#1a1a1a] rounded-lg text-center">
          <p className="text-xs text-gray-400 mb-2">ログインするといいねや投稿ができます</p>
          <button
            onClick={onSignIn}
            className="text-xs text-white bg-blue-600 hover:bg-blue-500 rounded px-3 py-1.5 font-medium"
          >
            Googleでログイン
          </button>
        </div>
      )}

      <div className="px-3">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 text-sm mt-10">
            {decks.length === 0 ? 'まだ投稿されたデッキはありません' : '該当するデッキがありません'}
          </p>
        ) : (
          <div className="space-y-3 pt-3">
            {filtered.map((deck) => {
              const isExpanded = expandedDeckId === deck.id
              const deckCards = sortByDefault(
                Object.entries(deck.cards)
                  .map(([id, count]) => ({ card: cardById[id], count }))
                  .filter((x) => x.card != null)
              )

              return (
                <div key={deck.id} className="bg-[#1a1a1a] rounded-lg p-3 border border-gray-800">
                  {/* デッキ名・投稿者 */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{deck.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {deck.profiles?.display_name ?? '名無しユーザー'} ·{' '}
                        {new Date(deck.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onLike(deck)}
                        disabled={!user}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                          deck.liked
                            ? 'text-red-400 bg-red-950'
                            : 'text-gray-500 hover:text-red-400 disabled:opacity-40'
                        }`}
                      >
                        ♥ {deck.like_count}
                      </button>
                      <button
                        onClick={() => handleImport(deck)}
                        disabled={!canImport}
                        className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                          importedId === deck.id
                            ? 'bg-green-700 text-green-200'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-40'
                        }`}
                        title={canImport ? 'デッキを取り込む' : 'デッキが5個いっぱいです'}
                      >
                        {importedId === deck.id ? '取り込み済✓' : '取り込む'}
                      </button>
                      {user?.id === deck.user_id && (
                        <button
                          onClick={() => {
                            if (confirm('このデッキを削除しますか？')) onDelete(deck.id)
                          }}
                          className="text-xs text-gray-600 hover:text-red-500 px-1"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 色バッジ */}
                  {deck.colors.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {deck.colors.map((c) => {
                        const hex = COLOR_HEX[c]
                        return (
                          <span
                            key={c}
                            className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"
                            style={{ backgroundColor: hex ? hex + '33' : '#374151', color: hex ?? '#d1d5db', border: `1px solid ${hex ?? '#4b5563'}` }}
                          >
                            <span className="inline-block w-1.5 h-1.5 rounded-full" style={colorDotStyle(c)} />
                            {c}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {/* カード一覧ボタン */}
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => setExpandedDeckId(isExpanded ? null : deck.id)}
                      className="text-[10px] text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded px-2 py-0.5 transition-colors"
                    >
                      {isExpanded ? '画像一覧を閉じる ▲' : '画像一覧で見る ▼'}
                    </button>
                  </div>

                  {/* カード画像一覧（展開時） */}
                  {isExpanded && (
                    <div className="mt-3 grid grid-cols-5 gap-1">
                      {deckCards.map(({ card, count }) => {
                        const variant = card.variants[0]
                        const imgUrl = variant ? resolveImageUrl(variant.imageUrl) : ''
                        return (
                          <div key={card.cardId} className="relative">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={card.cardName}
                                className="w-full rounded object-cover"
                              />
                            ) : (
                              <div className="w-full aspect-[2/3] bg-gray-800 rounded flex items-center justify-center">
                                <span className="text-[8px] text-gray-500 text-center px-1">{card.cardName}</span>
                              </div>
                            )}
                            {count > 1 && (
                              <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[9px] rounded px-1">
                                ×{count}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
