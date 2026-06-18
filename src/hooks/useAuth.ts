import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState<string | null>(null)

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single()
    if (data) setDisplayName(data.display_name)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)
      else setDisplayName(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function updateDisplayName(name: string): Promise<string | null> {
    if (!user) return 'ログインが必要です'
    const trimmed = name.trim()
    if (!trimmed) return 'ニックネームを入力してください'
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', user.id)
    if (error) return error.message
    setDisplayName(trimmed)
    return null
  }

  return { user, loading, displayName, signInWithGoogle, signOut, updateDisplayName }
}
