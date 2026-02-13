import { Link } from 'react-router-dom';
import { Calendar, Users, FileText, Vote, ListTodo } from 'lucide-react';
import type { SnapshotSummary } from '../types';

interface Props {
  snapshot: SnapshotSummary;
}

export function RetroSummaryCard({ snapshot }: Props) {
  const completionRate = snapshot.actionItemsTotal > 0
    ? Math.round((snapshot.actionItemsDone / snapshot.actionItemsTotal) * 100)
    : 0;
  const dateStr = new Date(snapshot.closedAt).toLocaleDateString('ja-JP');

  return (
    <Link to={`/dashboard/${snapshot.id}`} className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{snapshot.teamName}</h3>
        <span className="text-sm text-gray-500 flex items-center gap-1">
          <Calendar size={14} />
          {dateStr}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1"><FileText size={14} />{snapshot.totalCards} カード</span>
        <span className="flex items-center gap-1"><Vote size={14} />{snapshot.totalVotes} 投票</span>
        <span className="flex items-center gap-1"><Users size={14} />{snapshot.totalParticipants} 参加者</span>
        <span className="flex items-center gap-1"><ListTodo size={14} />AI {snapshot.actionItemsDone}/{snapshot.actionItemsTotal} ({completionRate}%)</span>
      </div>
      <span className="text-xs text-gray-400 mt-1 block">{snapshot.framework}</span>
    </Link>
  );
}
