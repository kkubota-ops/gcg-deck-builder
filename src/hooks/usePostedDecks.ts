import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type PostedDeck = {
  id: string
  user_id: string
  name: string
  cards: Record<string, number>
  colors: string[]
  description: string | null
  like_count: number
  created_at: string
  profiles: { display_name: string } | null
  liked?: boolean
}

export function usePostedDecks(userId: string | null) {
  const [decks, setDecks] = useState<PostedDeck[]>([])
  const [loading, setLoading] = useState(true)
  const userIdRef = useRef(userId)
  userIdRef.current = userId

  const fetchDecks = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('posted_decks')
      .select('*, profiles!posted_decks_user_id_fkey(display_name)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error || !data) { setLoading(false); return }

    const uid = userIdRef.current
    if (uid) {
      const { data: likes } = await supabase
        .from('deck_likes')
        .select('deck_id')
        .eq('user_id', uid)
      const likedIds = new Set((likes ?? []).map((l: { deck_id: string }) => l.deck_id))
      setDecks(data.map((d: PostedDeck) => ({ ...d, liked: likedIds.has(d.id) })))
    } else {
      setDecks(data.map((d: PostedDeck) => ({ ...d, liked: false })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDecks()
  }, [userId])  // eslint-disable-line react-hooks/exhaustive-deps

  async function postDeck(params: {
    name: string
    cards: Record<string, number>
    colors: string[]
    description: string
  }): Promise<string | null> {
    if (!userIdRef.current) return 'ログインが必要です'
    const { error } = await supabase.from('posted_decks').insert({
      user_id: userIdRef.current,
      name: params.name,
      cards: params.cards,
      colors: params.colors,
      description: params.description || null,
    })
    if (error) return error.message
    await fetchDecks()
    return null
  }

  async function toggleLike(deck: PostedDeck): Promise<void> {
    const uid = userIdRef.current
    if (!uid) return
    if (deck.liked) {
      await supabase.from('deck_likes').delete()
        .eq('deck_id', deck.id).eq('user_id', uid)
    } else {
      await supabase.from('deck_likes').insert({ deck_id: deck.id, user_id: uid })
    }
    await fetchDecks()
  }

  async function deletePostedDeck(deckId: string): Promise<void> {
    await supabase.from('posted_decks').delete().eq('id', deckId)
    await fetchDecks()
  }

  return { decks, loading, postDeck, toggleLike, deletePostedDeck, refetch: fetchDecks }
}
