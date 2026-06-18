import type { User } from '@supabase/supabase-js'

type Props = {
  user: User | null
  loading: boolean
  displayName: string | null
  onSignIn: () => void
  onSignOut: () => void
  onEditNickname: () => void
}

export default function AuthButton({ user, loading, displayName, onSignIn, onSignOut, onEditNickname }: Props) {
  if (loading) return null

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onEditNickname}
          className="text-xs text-gray-300 hover:text-white truncate max-w-[100px] underline decoration-dotted"
        >
          {displayName ?? '...'}
        </button>
        <button
          onClick={onSignOut}
          className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 rounded px-2 py-1"
        >
          ログアウト
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onSignIn}
      className="text-xs text-white bg-blue-600 hover:bg-blue-500 rounded px-3 py-1.5 font-medium"
    >
      Googleでログイン
    </button>
  )
}
