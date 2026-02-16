import type { Card } from '../types';

interface Props {
  cards: Card[];
  color: string;
}

export function DiscussionProgress({ cards, color }: Props) {
  if (cards.length === 0) return null;

  const discussed = cards.filter((c) => c.isDiscussed).length;
  const total = cards.length;
  const percent = Math.round((discussed / total) * 100);

  return (
    <div className="mt-1.5 ml-4" aria-label={`議論進捗 ${discussed}/${total}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${percent}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-[10px] tabular-nums text-gray-400 dark:text-slate-500 whitespace-nowrap">
          {discussed}/{total}
        </span>
      </div>
    </div>
  );
}
