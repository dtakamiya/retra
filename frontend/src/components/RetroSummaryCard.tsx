import { Link } from 'react-router-dom';
import { Calendar, Users, FileText, Vote, ListTodo, ChevronRight } from 'lucide-react';
import type { SnapshotSummary } from '../types';

interface Props {
  snapshot: SnapshotSummary;
}

const FRAMEWORK_COLORS: Record<string, string> = {
  KPT: 'bg-emerald-50 text-emerald-700',
  FUN_DONE_LEARN: 'bg-purple-50 text-purple-700',
  FOUR_LS: 'bg-blue-50 text-blue-700',
  START_STOP_CONTINUE: 'bg-amber-50 text-amber-700',
};

export function RetroSummaryCard({ snapshot }: Props) {
  const completionRate = snapshot.actionItemsTotal > 0
    ? Math.round((snapshot.actionItemsDone / snapshot.actionItemsTotal) * 100)
    : 0;
  const dateStr = new Date(snapshot.closedAt).toLocaleDateString('ja-JP');
  const badgeClass = FRAMEWORK_COLORS[snapshot.framework] || 'bg-gray-50 text-gray-600';

  return (
    <Link
      to={`/dashboard/${snapshot.id}`}
      className="group block rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{snapshot.teamName}</h3>
          <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
            {snapshot.framework}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0 ml-2">
          <Calendar size={13} />
          {dateStr}
          <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-400 transition-colors ml-1" />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
        <span className="flex items-center gap-1"><FileText size={14} className="text-gray-400" />{snapshot.totalCards} カード</span>
        <span className="flex items-center gap-1"><Vote size={14} className="text-gray-400" />{snapshot.totalVotes} 投票</span>
        <span className="flex items-center gap-1"><Users size={14} className="text-gray-400" />{snapshot.totalParticipants} 参加者</span>
      </div>

      {/* AI Progress */}
      <div className="flex items-center gap-2">
        <ListTodo size={14} className="text-gray-400 shrink-0" />
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
            data-testid="completion-bar"
          />
        </div>
        <span className="text-xs text-gray-500 shrink-0 tabular-nums">AI {snapshot.actionItemsDone}/{snapshot.actionItemsTotal} ({completionRate}%)</span>
      </div>
    </Link>
  );
}
