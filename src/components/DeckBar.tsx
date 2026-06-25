type Props = {
  totalMain: number;
  maxMain: number;
  totalEx: number;
  maxEx: number;
  totalResource: number;
  resourceDeckSize: number;
  resourceFill: number;
  onTap: () => void;
};

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function DeckBar({
  totalMain, maxMain, totalEx, maxEx, totalResource, resourceDeckSize, resourceFill, onTap,
}: Props) {
  const mainOver = totalMain > maxMain;
  const exOver = totalEx > maxEx;
  const resourceTotal = totalResource + resourceFill;

  return (
    <button
      onClick={onTap}
      className="fixed bottom-0 left-0 right-0 z-40 w-full bg-[#0f0f0f] border-t border-gray-800 px-4 py-2 pb-[env(safe-area-inset-bottom,8px)] active:bg-[#1a1a1a] transition-colors"
    >
      <div className="max-w-lg mx-auto space-y-1">
        {/* メインデッキ */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 w-16 shrink-0 text-right">メイン</span>
          <Bar value={totalMain} max={maxMain} color={mainOver ? 'bg-red-500' : 'bg-blue-500'} />
          <span className={`text-xs font-bold tabular-nums w-12 text-right shrink-0 ${mainOver ? 'text-red-400' : 'text-gray-300'}`}>
            {totalMain}/{maxMain}
          </span>
        </div>
        {/* EXデッキ */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 w-16 shrink-0 text-right">EX</span>
          <Bar value={totalEx} max={maxEx} color={exOver ? 'bg-red-500' : 'bg-purple-500'} />
          <span className={`text-xs font-bold tabular-nums w-12 text-right shrink-0 ${exOver ? 'text-red-400' : 'text-gray-300'}`}>
            {totalEx}/{maxEx}
          </span>
        </div>
        {/* リソースデッキ */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 w-16 shrink-0 text-right">リソース</span>
          <Bar value={resourceTotal} max={resourceDeckSize} color="bg-green-500" />
          <span className="text-xs font-bold tabular-nums w-12 text-right shrink-0 text-gray-300">
            {resourceTotal}/{resourceDeckSize}
          </span>
        </div>
      </div>
    </button>
  );
}
