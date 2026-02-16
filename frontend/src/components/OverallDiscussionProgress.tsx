import type { Column } from '../types';

interface Props {
  columns: Column[];
}

export function OverallDiscussionProgress({ columns }: Props) {
  const allCards = columns.flatMap((col) => col.cards);
  if (allCards.length === 0) return null;

  const discussed = allCards.filter((c) => c.isDiscussed).length;
  const total = allCards.length;
  const percent = Math.round((discussed / total) * 100);

  return (
    <div className="flex items-center gap-2" aria-label={`全体議論進捗 ${discussed}/${total}`}>
      <span className="text-[11px] text-gray-500 dark:text-slate-400 whitespace-nowrap">
        議論済み
      </span>
      <div className="w-24 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-gray-500 dark:text-slate-400 whitespace-nowrap">
        {discussed}/{total}
      </span>
    </div>
  );
}
