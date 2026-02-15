import { Calendar, Users, FileText, ListTodo } from 'lucide-react';
import type { SnapshotDetail } from '../types';

interface Props {
  snapshot: SnapshotDetail;
}

export function SnapshotDetailView({ snapshot }: Props) {
  const dateStr = new Date(snapshot.closedAt).toLocaleDateString('ja-JP');
  const completionRate = snapshot.actionItemsTotal > 0
    ? Math.round((snapshot.actionItemsDone / snapshot.actionItemsTotal) * 100)
    : 0;

  // Parse snapshotData JSON for column details
  let columnData: Array<{ name: string; cards: Array<{ content: string; votes: number }> }> = [];
  try {
    const parsed = JSON.parse(snapshot.snapshotData);
    columnData = parsed.columns || [];
  } catch { /* ignore parse errors */ }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 dark:text-slate-100">{snapshot.teamName}</h1>
      <div className="text-sm text-gray-500 dark:text-slate-400 mb-6 flex items-center gap-4">
        <span className="flex items-center gap-1"><Calendar size={14} />{dateStr}</span>
        <span>{snapshot.framework}</span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<FileText size={20} />} label="カード数" value={snapshot.totalCards} />
        <StatCard icon={<Users size={20} />} label="参加者" value={snapshot.totalParticipants} />
        <StatCard icon={<ListTodo size={20} />} label="AI完了率" value={`${completionRate}%`} />
        <StatCard icon={<ListTodo size={20} />} label="AI完了" value={`${snapshot.actionItemsDone}/${snapshot.actionItemsTotal}`} />
      </div>

      {/* Column details */}
      {columnData.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold dark:text-slate-100">カラム詳細</h2>
          {columnData.map((col, i) => (
            <div key={i} className="border dark:border-slate-700 rounded-lg p-4">
              <h3 className="font-medium mb-2 dark:text-slate-200">{col.name} ({col.cards.length})</h3>
              <ul className="space-y-1">
                {col.cards.map((card, j) => (
                  <li key={j} className="text-sm text-gray-700 dark:text-slate-300 flex justify-between">
                    <span>{card.content}</span>
                    {card.votes > 0 && <span className="text-gray-400 dark:text-slate-500">{card.votes} 票</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-4 text-center">
      <div className="flex justify-center mb-2 text-gray-500 dark:text-slate-500">{icon}</div>
      <div className="text-2xl font-bold dark:text-slate-100">{value}</div>
      <div className="text-sm text-gray-500 dark:text-slate-400">{label}</div>
    </div>
  );
}
