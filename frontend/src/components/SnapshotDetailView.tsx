import { Calendar, Users, FileText, ListTodo, Vote } from 'lucide-react';
import type { SnapshotDetail } from '../types';

interface Props {
  snapshot: SnapshotDetail;
}

const FRAMEWORK_COLORS: Record<string, string> = {
  KPT: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  FUN_DONE_LEARN: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  FOUR_LS: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  START_STOP_CONTINUE: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export function SnapshotDetailView({ snapshot }: Props) {
  const dateStr = new Date(snapshot.closedAt).toLocaleDateString('ja-JP');
  const completionRate = snapshot.actionItemsTotal > 0
    ? Math.round((snapshot.actionItemsDone / snapshot.actionItemsTotal) * 100)
    : 0;
  const badgeClass = FRAMEWORK_COLORS[snapshot.framework] || 'bg-gray-50 text-gray-600 dark:bg-slate-700 dark:text-slate-300';

  // Parse snapshotData JSON for column details
  let columnData: Array<{ name: string; cards: Array<{ content: string; votes: number }> }> = [];
  try {
    const parsed = JSON.parse(snapshot.snapshotData);
    columnData = parsed.columns || [];
  } catch { /* ignore parse errors */ }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{snapshot.teamName}</h1>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
            {snapshot.framework}
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1">
          <Calendar size={14} />
          {dateStr}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard icon={<FileText size={18} className="text-indigo-600 dark:text-indigo-400" />} label="カード数" value={snapshot.totalCards} color="bg-indigo-50 dark:bg-indigo-900/30" />
        <StatCard icon={<Vote size={18} className="text-emerald-600 dark:text-emerald-400" />} label="投票数" value={snapshot.totalVotes} color="bg-emerald-50 dark:bg-emerald-900/30" />
        <StatCard icon={<Users size={18} className="text-blue-600 dark:text-blue-400" />} label="参加者" value={snapshot.totalParticipants} color="bg-blue-50 dark:bg-blue-900/30" />
        <StatCard icon={<ListTodo size={18} className="text-amber-600 dark:text-amber-400" />} label="AI完了率" value={`${completionRate}%`} sub={`${snapshot.actionItemsDone}/${snapshot.actionItemsTotal}`} color="bg-amber-50 dark:bg-amber-900/30" />
      </div>

      {/* Column details */}
      {columnData.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">カラム詳細</h2>
          {columnData.map((col, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm">
              <h3 className="font-medium text-gray-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                {col.name}
                <span className="text-xs font-normal text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">{col.cards.length}</span>
              </h3>
              <ul className="space-y-1.5">
                {col.cards.map((card, j) => (
                  <li key={j} className="text-sm text-gray-700 dark:text-slate-300 flex justify-between items-center py-1 px-2 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <span>{card.content}</span>
                    {card.votes > 0 && (
                      <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full tabular-nums shrink-0 ml-2">{card.votes} 票</span>
                    )}
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

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">{value}</div>
      <div className="text-xs text-gray-500 dark:text-slate-400">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
