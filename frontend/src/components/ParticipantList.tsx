import { Users, Crown } from 'lucide-react';
import { useBoardStore } from '../store/boardStore';

interface Props {
  compact?: boolean;
}

const AVATAR_COLORS = [
  'from-indigo-500 to-purple-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-pink-500 to-rose-500',
  'from-violet-500 to-indigo-500',
  'from-cyan-500 to-blue-500',
  'from-teal-500 to-emerald-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function ParticipantList({ compact = false }: Props) {
  const { board, remainingVotes } = useBoardStore();

  if (!board) return null;

  const onlineCount = board.participants.filter((p) => p.isOnline).length;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Users size={14} className="text-gray-400" />
        <div className="flex -space-x-1.5">
          {board.participants.slice(0, 5).map((p) => (
            <div
              key={p.id}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white border-2 border-white dark:border-slate-800 bg-gradient-to-br ${
                p.isOnline ? getAvatarColor(p.nickname) : 'from-gray-300 to-gray-400'
              }`}
              title={`${p.nickname}${p.isFacilitator ? ' (ファシリテーター)' : ''}`}
            >
              {p.nickname.charAt(0).toUpperCase()}
            </div>
          ))}
          {board.participants.length > 5 && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400 border-2 border-white dark:border-slate-800">
              +{board.participants.length - 5}
            </div>
          )}
        </div>
        {remainingVotes && board.phase === 'VOTING' && (
          <span className="text-[11px] text-indigo-600 dark:text-indigo-300 font-medium ml-1.5 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
            残り{remainingVotes.remaining}/{remainingVotes.max}票
          </span>
        )}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Users size={14} />
        参加者 ({onlineCount}/{board.participants.length})
      </h3>

      {remainingVotes && board.phase === 'VOTING' && (
        <div className="mb-3 px-3 py-2 bg-indigo-50/80 dark:bg-indigo-900/20 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">
              投票: {remainingVotes.used}/{remainingVotes.max}
            </span>
            <span className="text-[11px] text-indigo-500 dark:text-indigo-300">
              残り {remainingVotes.remaining}票
            </span>
          </div>
          <div className="w-full h-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mt-1.5">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${(remainingVotes.used / remainingVotes.max) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {board.participants.map((p) => (
          <div key={p.id} className="flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors">
            <div className="relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white bg-gradient-to-br ${
                  p.isOnline ? getAvatarColor(p.nickname) : 'from-gray-300 to-gray-400'
                }`}
              >
                {p.nickname.charAt(0).toUpperCase()}
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  p.isOnline ? 'bg-green-400' : 'bg-gray-300'
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200 truncate">
                  {p.nickname}
                </span>
                {p.isFacilitator && (
                  <Crown size={11} className="text-amber-500 flex-shrink-0" />
                )}
              </div>
              {p.isFacilitator && (
                <div className="text-[10px] text-amber-600">ファシリテーター</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
