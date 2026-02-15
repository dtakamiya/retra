import { History } from 'lucide-react';
import type { SnapshotSummary } from '../types';
import { RetroSummaryCard } from './RetroSummaryCard';

interface Props {
  history: SnapshotSummary[];
}

export function RetroHistoryList({ history }: Props) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
          <History size={18} className="text-gray-400 dark:text-slate-500" />
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400">まだレトロスペクティブの履歴がありません</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {history.map((snapshot) => (
        <RetroSummaryCard key={snapshot.id} snapshot={snapshot} />
      ))}
    </div>
  );
}
