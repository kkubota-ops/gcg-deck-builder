import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Card } from '../types'
import type { PurchaseItem } from '../hooks/usePurchaseList'

const STATUS_LABELS: Record<string, string> = {
  soon: '優先',
  later: '後回し',
  considering: '検討中',
}

const STATUS_CHIP: Record<string, string> = {
  soon: 'bg-red-900 text-red-300',
  later: 'bg-gray-700 text-gray-400',
  considering: 'bg-yellow-900 text-yellow-300',
}

type Props = {
  user: User | null
  items: PurchaseItem[]
  storeList: string[]
  cardById: Record<string, Card>
  deckCardOrder: string[]
  onUpdate: (id: string, patch: Partial<Omit<PurchaseItem, 'id' | 'card_id'>>) => void
  onDelete: (id: string) => void
  onAddStore: (name: string) => void
  onRemoveStore: (name: string) => void
  onSignIn: () => void
}

export default function PurchaseTab({
  user, items, storeList, cardById, deckCardOrder,
  onUpdate, onDelete, onAddStore, onRemoveStore, onSignIn,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [storeFilter, setStoreFilter] = useState<string>('all')
  const [newStore, setNewStore] = useState('')
  const [showStoreManager, setShowStoreManager] = useState(false)

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-gray-400 text-sm text-center">購入リストにはログインが必要です</p>
        <button
          onClick={onSignIn}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-full"
        >
          Googleでログイン
        </button>
      </div>
    )
  }

  const orderIndex = Object.fromEntries(deckCardOrder.map((id, i) => [id, i]))

  const filtered = items
    .filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (storeFilter !== 'all' && item.store !== storeFilter) return false
      return true
    })
    .sort((a, b) => {
      const ia = orderIndex[a.card_id] ?? 9999
      const ib = orderIndex[b.card_id] ?? 9999
      return ia - ib
    })

  const totalPrice = filtered.reduce((s, i) => {
    if (!i.price) return s
    return s + i.price * Math.max(0, i.needed_count - i.purchased_count)
  }, 0)

  const completedCount = filtered.filter(i => i.purchased_count >= i.needed_count).length

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* フィルター */}
      <div className="px-3 py-2 border-b border-gray-800 space-y-2">
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`text-xs px-2.5 py-1 rounded-full ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
          >すべて</button>
          {(['soon', 'later', 'considering'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-xs px-2.5 py-1 rounded-full ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            >{STATUS_LABELS[s]}</button>
          ))}
        </div>
        {storeList.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setStoreFilter('all')}
              className={`text-xs px-2.5 py-1 rounded-full ${storeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            >全店舗</button>
            {storeList.map(s => (
              <button key={s} onClick={() => setStoreFilter(s)}
                className={`text-xs px-2.5 py-1 rounded-full ${storeFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
              >{s}</button>
            ))}
          </div>
        )}
      </div>

      {/* サマリー */}
      {filtered.length > 0 && (
        <div className="px-3 py-2 flex justify-between text-xs text-gray-500 bg-gray-900">
          <span>{filtered.length}件 / 完了{completedCount}件</span>
          {totalPrice > 0 && (
            <span className="text-yellow-400">合計金額 ¥{totalPrice.toLocaleString('ja-JP')}</span>
          )}
        </div>
      )}

      {/* アイテム一覧 */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center p-10">
          <p className="text-gray-500 text-sm text-center">
            {items.length === 0
              ? '在庫タブで不足カードを追加できます'
              : 'フィルターに一致するアイテムがありません'}
          </p>
        </div>
      ) : (
        <div className="px-3 divide-y divide-gray-800">
          {filtered.map(item => {
            const card = cardById[item.card_id]
            const remaining = Math.max(0, item.needed_count - item.purchased_count)
            const done = remaining === 0

            return (
              <div key={item.id} className={`py-3 space-y-2 ${done ? 'opacity-50' : ''}`}>
                {/* カード名・ステータス・削除 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-gray-500">{item.card_id}</div>
                    <div className="text-sm text-white truncate">{card?.cardName ?? item.card_id}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_CHIP[item.status]}`}>
                      {STATUS_LABELS[item.status]}
                    </span>
                    <button onClick={() => onDelete(item.id)} className="text-gray-600 hover:text-red-400 text-xl leading-none">×</button>
                  </div>
                </div>

                {/* ステータス切り替え */}
                <div className="flex gap-1">
                  {(['soon', 'later', 'considering'] as const).map(s => (
                    <button key={s} onClick={() => onUpdate(item.id, { status: s })}
                      className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                        item.status === s ? 'border-blue-500 text-blue-400' : 'border-gray-700 text-gray-600 hover:border-gray-500'
                      }`}
                    >{STATUS_LABELS[s]}</button>
                  ))}
                </div>

                {/* 購入枚数 */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">購入</span>
                    <button
                      onClick={() => onUpdate(item.id, { purchased_count: Math.max(0, item.purchased_count - 1) })}
                      className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
                    >−</button>
                    <span className="text-sm text-white tabular-nums w-12 text-center">
                      {item.purchased_count}/{item.needed_count}枚
                    </span>
                    <button
                      onClick={() => onUpdate(item.id, { purchased_count: Math.min(item.needed_count, item.purchased_count + 1) })}
                      className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
                    >+</button>
                  </div>
                  {done
                    ? <span className="text-xs text-green-500">✓ 完了</span>
                    : <span className="text-xs text-orange-400">残{remaining}枚</span>
                  }
                </div>

                {/* 価格・店舗 */}
                <div className="flex gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">¥</span>
                    <input
                      type="number"
                      min={0}
                      value={item.price ?? ''}
                      onChange={e => onUpdate(item.id, { price: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="価格/枚"
                      className="w-20 text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white placeholder-gray-600"
                    />
                  </div>
                  {storeList.length > 0 && (
                    <select
                      value={item.store ?? ''}
                      onChange={e => onUpdate(item.id, { store: e.target.value || null })}
                      className="flex-1 text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white"
                    >
                      <option value="">店舗未定</option>
                      {storeList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 店舗管理 */}
      <div className="px-3 pt-4 pb-2 border-t border-gray-800 mt-2">
        <button
          onClick={() => setShowStoreManager(v => !v)}
          className="text-xs text-gray-600 hover:text-gray-400 underline"
        >
          {showStoreManager ? '店舗管理を閉じる' : '店舗を管理する'}
        </button>
        {showStoreManager && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                value={newStore}
                onChange={e => setNewStore(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newStore.trim()) { onAddStore(newStore.trim()); setNewStore('') } }}
                placeholder="店舗名"
                className="flex-1 text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white placeholder-gray-600"
              />
              <button
                onClick={() => { if (newStore.trim()) { onAddStore(newStore.trim()); setNewStore('') } }}
                className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >追加</button>
            </div>
            {storeList.length === 0 && (
              <p className="text-xs text-gray-600">店舗を登録すると購入先を管理できます</p>
            )}
            {storeList.map(s => (
              <div key={s} className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-300">{s}</span>
                <button onClick={() => onRemoveStore(s)} className="text-xs text-gray-600 hover:text-red-400">削除</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
