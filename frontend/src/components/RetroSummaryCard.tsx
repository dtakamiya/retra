import { Link } from 'react-router-dom';
import { Calendar, Users, FileText, Vote, ListTodo, ChevronRight, Trash2 } from 'lucide-react';
import type { SnapshotSummary } from '../types';

interface Props {
  snapshot: SnapshotSummary;
  onDelete?: (id: string) => void;
}

const FRAMEWORK_COLORS: Record<string, string> = {
  KPT: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  FUN_DONE_LEARN: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  FOUR_LS: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  START_STOP_CONTINUE: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export function RetroSummaryCard({ snapshot, onDelete }: Props) {
  const completionRate = snapshot.actionItemsTotal > 0
    ? Math.round((snapshot.actionItemsDone / snapshot.actionItemsTotal) * 100)
    : 0;
  const dateStr = new Date(snapshot.closedAt).toLocaleDateString('ja-JP');
  const badgeClass = FRAMEWORK_COLORS[snapshot.framework] || 'bg-gray-50 text-gray-600 dark:bg-slate-700 dark:text-slate-300';

  return (
    <Link
      to={`/dashboard/${snapshot.id}`}
      className="group block rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all"
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100 truncate">{snapshot.teamName}</h3>
          <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
            {snapshot.framework}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 shrink-0 ml-2">
          <Calendar size={13} />
          {dateStr}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(snapshot.id);
              }}
              className="ml-1 p-1 text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              aria-label="スナップショットを削除"
            >
              <Trash2 size={14} />
            </button>
          )}
          <ChevronRight size={14} className="text-gray-300 dark:text-slate-600 group-hover:text-indigo-400 dark:group-hover:text-indigo-400 transition-colors ml-1" />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-300 mb-3">
        <span className="flex items-center gap-1"><FileText size={14} className="text-gray-400 dark:text-slate-500" />{snapshot.totalCards} カード</span>
        <span className="flex items-center gap-1"><Vote size={14} className="text-gray-400 dark:text-slate-500" />{snapshot.totalVotes} 投票</span>
        <span className="flex items-center gap-1"><Users size={14} className="text-gray-400 dark:text-slate-500" />{snapshot.totalParticipants} 参加者</span>
      </div>

      {/* AI Progress */}
      <div className="flex items-center gap-2">
        <ListTodo size={14} className="text-gray-400 dark:text-slate-500 shrink-0" />
        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
            data-testid="completion-bar"
          />
        </div>
        <span className="text-xs text-gray-500 dark:text-slate-400 shrink-0 tabular-nums">AI {snapshot.actionItemsDone}/{snapshot.actionItemsTotal} ({completionRate}%)</span>
      </div>
    </Link>
  );
}
