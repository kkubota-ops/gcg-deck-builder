import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useInventory(userId: string | null) {
  const [owned, setOwned] = useState<Record<string, number>>({})

  const fetchOwned = useCallback(async () => {
    if (!userId) { setOwned({}); return }
    const { data } = await supabase
      .from('owned_cards')
      .select('card_id, count')
      .eq('user_id', userId)
    if (data) {
      const map: Record<string, number> = {}
      data.forEach((r: { card_id: string; count: number }) => { map[r.card_id] = r.count })
      setOwned(map)
    }
  }, [userId])

  useEffect(() => { fetchOwned() }, [fetchOwned])

  async function setCount(cardId: string, count: number) {
    if (!userId) return
    if (count <= 0) {
      await supabase.from('owned_cards').delete().eq('user_id', userId).eq('card_id', cardId)
      setOwned(prev => { const n = { ...prev }; delete n[cardId]; return n })
    } else {
      await supabase.from('owned_cards').upsert({ user_id: userId, card_id: cardId, count })
      setOwned(prev => ({ ...prev, [cardId]: count }))
    }
  }

  return { owned, setCount }
}
