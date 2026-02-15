import type { SnapshotSummary } from '../types';
import { RetroSummaryCard } from './RetroSummaryCard';

interface Props {
  history: SnapshotSummary[];
}

export function RetroHistoryList({ history }: Props) {
  if (history.length === 0) {
    return <p className="text-gray-500 dark:text-slate-400 text-center py-4">まだレトロスペクティブの履歴がありません</p>;
  }
  return (
    <div className="space-y-4">
      {history.map((snapshot) => (
        <RetroSummaryCard key={snapshot.id} snapshot={snapshot} />
      ))}
    </div>
  );
}
