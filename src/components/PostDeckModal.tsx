import { useState } from 'react'

type Props = {
  deckName: string
  onPost: (name: string) => Promise<string | null>
  onClose: () => void
}

export default function PostDeckModal({ deckName, onPost, onClose }: Props) {
  const [name, setName] = useState(deckName)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handlePost() {
    setPosting(true)
    setError(null)
    const err = await onPost(name)
    setPosting(false)
    if (err) { setError(err); return }
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-[#1a1a1a] w-full max-w-lg rounded-t-2xl p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center py-6">
            <p className="text-white font-medium text-lg">投稿しました！</p>
            <p className="text-gray-400 text-sm mt-1">みんなのデッキタブで確認できます</p>
            <button
              onClick={onClose}
              className="mt-4 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded px-4 py-2"
            >
              閉じる
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-white font-bold text-base mb-4">デッキを投稿する</h2>

            <label className="block text-xs text-gray-400 mb-1">デッキ名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              placeholder="デッキ名を入力"
              className="w-full bg-[#111] border border-gray-700 rounded text-sm text-white p-2 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-600 mt-1 text-right">{name.length} / 30</p>

            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

            <div className="flex gap-2 mt-4">
              <button
                onClick={onClose}
                className="flex-1 text-sm text-gray-400 border border-gray-700 rounded py-2 hover:border-gray-500"
              >
                キャンセル
              </button>
              <button
                onClick={handlePost}
                disabled={posting || !name.trim()}
                className="flex-1 text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded py-2 font-medium"
              >
                {posting ? '投稿中...' : '投稿する'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
