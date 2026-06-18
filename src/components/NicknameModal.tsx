import { useState } from 'react'

type Props = {
  currentName: string
  onSave: (name: string) => Promise<string | null>
  onClose: () => void
}

export default function NicknameModal({ currentName, onSave, onClose }: Props) {
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    const err = await onSave(name)
    setSaving(false)
    if (err) { setError(err); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-[#1a1a1a] w-full max-w-lg rounded-t-2xl p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-white font-bold text-base mb-4">ニックネームを変更</h2>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          placeholder="ニックネーム（20文字以内）"
          className="w-full bg-[#111] border border-gray-700 rounded text-sm text-white p-2 focus:outline-none focus:border-blue-500"
        />
        <p className="text-xs text-gray-600 mt-1 text-right">{name.length} / 20</p>

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 text-sm text-gray-400 border border-gray-700 rounded py-2 hover:border-gray-500"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded py-2 font-medium"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
