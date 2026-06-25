import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type PurchaseItem = {
  id: string
  card_id: string
  needed_count: number
  price: number | null
  store: string | null
  status: 'soon' | 'later' | 'considering'
  purchased_count: number
}

export function usePurchaseList(userId: string | null) {
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [storeList, setStoreList] = useState<string[]>([])

  const fetchAll = useCallback(async () => {
    if (!userId) { setItems([]); setStoreList([]); return }
    const [itemsRes, profileRes] = await Promise.all([
      supabase.from('purchase_items').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('profiles').select('store_list').eq('id', userId).single(),
    ])
    if (itemsRes.data) setItems(itemsRes.data as PurchaseItem[])
    if (profileRes.data) setStoreList(profileRes.data.store_list ?? [])
  }, [userId])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function addItem(cardId: string, neededCount: number) {
    if (!userId) return
    const { data } = await supabase
      .from('purchase_items')
      .insert({ user_id: userId, card_id: cardId, needed_count: neededCount })
      .select()
      .single()
    if (data) setItems(prev => [...prev, data as PurchaseItem])
  }

  async function updateItem(id: string, patch: Partial<Omit<PurchaseItem, 'id' | 'card_id'>>) {
    await supabase.from('purchase_items').update(patch).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  }

  async function deleteItem(id: string) {
    await supabase.from('purchase_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function addStore(name: string) {
    if (!userId || storeList.includes(name)) return
    const newList = [...storeList, name]
    await supabase.from('profiles').update({ store_list: newList }).eq('id', userId)
    setStoreList(newList)
  }

  async function removeStore(name: string) {
    if (!userId) return
    const newList = storeList.filter(s => s !== name)
    await supabase.from('profiles').update({ store_list: newList }).eq('id', userId)
    setStoreList(newList)
  }

  async function syncItem(cardId: string, missingCount: number) {
    if (!userId) return
    const existing = items.find(i => i.card_id === cardId)
    if (missingCount <= 0) {
      if (existing) await deleteItem(existing.id)
    } else if (existing) {
      if (existing.needed_count !== missingCount) {
        await updateItem(existing.id, { needed_count: missingCount })
      }
    } else {
      await addItem(cardId, missingCount)
    }
  }

  return { items, storeList, addItem, updateItem, deleteItem, addStore, removeStore, syncItem }
}
