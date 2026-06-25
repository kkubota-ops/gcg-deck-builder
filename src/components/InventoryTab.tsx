import type { User } from '@supabase/supabase-js'
import type { Card } from '../types'

type DeckCard = { card: Card; count: number }

type Props = {
  user: User | null
  mainCards: DeckCard[]
  exCards: DeckCard[]
  resourceCards: DeckCard[]
  owned: Record<string, number>
  purchasedCardIds: Set<string>
  onSetCount: (cardId: string, count: number) => void
  onSignIn: () => void
}

function CardRow({ item, ownedCount, isPurchased, onSetCount }: {
  item: DeckCard
  ownedCount: number
  isPurchased: boolean
  onSetCount: (cardId: string, count: number) => void
}) {
  const missing = Math.max(0, item.count - ownedCount)

  return (
    <div className="flex items-center gap-2 py-2.5 border-b border-gray-800">
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-gray-500">{item.card.cardId}</div>
        <div className="text-sm text-white truncate">{item.card.cardName}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onSetCount(item.card.cardId, Math.max(0, ownedCount - 1))}
          className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm leading-none"
        >−</button>
        <span className="min-w-[3.5rem] text-center text-xs text-white tabular-nums">
          {ownedCount} / {item.count}枚
        </span>
        <button
          onClick={() => onSetCount(item.card.cardId, ownedCount + 1)}
          className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm leading-none"
        >+</button>
      </div>
      <div className="w-16 shrink-0 text-right">
        {missing > 0 ? (
          <span className={`text-xs ${isPurchased ? 'text-orange-400' : 'text-orange-300'}`}>
            不足{missing}枚
          </span>
        ) : (
          <span className="text-xs text-green-500">✓ 完備</span>
        )}
      </div>
    </div>
  )
}

function Section({ label, cards, owned, purchasedCardIds, onSetCount }: {
  label: string
  cards: DeckCard[]
  owned: Record<string, number>
  purchasedCardIds: Set<string>
  onSetCount: (cardId: string, count: number) => void
}) {
  if (cards.length === 0) return null
  return (
    <>
      <div className="text-xs text-gray-600 pt-3 pb-1">{label}</div>
      {cards.map(({ card, count }) => (
        <CardRow
          key={card.cardId}
          item={{ card, count }}
          ownedCount={owned[card.cardId] ?? 0}
          isPurchased={purchasedCardIds.has(card.cardId)}
          onSetCount={onSetCount}
        />
      ))}
    </>
  )
}

export default function InventoryTab({
  user, mainCards, exCards, resourceCards,
  owned, purchasedCardIds,
  onSetCount, onSignIn,
}: Props) {
  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-gray-400 text-sm text-center">在庫管理にはログインが必要です</p>
        <button
          onClick={onSignIn}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-full"
        >
          Googleでログイン
        </button>
      </div>
    )
  }

  const allCards = [...mainCards, ...exCards, ...resourceCards]

  if (allCards.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-gray-500 text-sm text-center">
          デッキにカードを追加すると<br />在庫と照合できます
        </p>
      </div>
    )
  }

  const ownedTotal = allCards.reduce((s, { card, count }) => s + Math.min(owned[card.cardId] ?? 0, count), 0)
  const neededTotal = allCards.reduce((s, { count }) => s + count, 0)
  const missingTotal = neededTotal - ownedTotal

  return (
    <div className="flex-1 overflow-y-auto px-3 pb-20">
      <div className="py-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">デッキ所持状況 <span className="text-gray-700">· 不足分は自動で購入リストに反映</span></span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-400">所持 {ownedTotal}/{neededTotal}枚</span>
          {missingTotal > 0 && <span className="text-orange-400">不足 {missingTotal}枚</span>}
          {missingTotal === 0 && <span className="text-green-500">✓ 完備</span>}
        </div>
      </div>
      <Section label="メインデッキ" cards={mainCards} owned={owned} purchasedCardIds={purchasedCardIds} onSetCount={onSetCount} />
      <Section label="リソースデッキ" cards={resourceCards} owned={owned} purchasedCardIds={purchasedCardIds} onSetCount={onSetCount} />
      <Section label="EXデッキ" cards={exCards} owned={owned} purchasedCardIds={purchasedCardIds} onSetCount={onSetCount} />
    </div>
  )
}
