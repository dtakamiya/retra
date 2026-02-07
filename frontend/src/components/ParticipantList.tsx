import { Users } from 'lucide-react';
import { useBoardStore } from '../store/boardStore';

interface Props {
  compact?: boolean;
}

export function ParticipantList({ compact = false }: Props) {
  const { board, remainingVotes } = useBoardStore();

  if (!board) return null;

  const onlineCount = board.participants.filter((p) => p.isOnline).length;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Users size={16} className="text-gray-500" />
        <div className="flex -space-x-2">
          {board.participants.slice(0, 5).map((p) => (
            <div
              key={p.id}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white ${
                p.isOnline ? 'bg-indigo-500' : 'bg-gray-300'
              }`}
              title={`${p.nickname}${p.isFacilitator ? ' (ファシリテーター)' : ''}`}
            >
              {p.nickname.charAt(0).toUpperCase()}
            </div>
          ))}
          {board.participants.length > 5 && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-gray-200 text-gray-600 border-2 border-white">
              +{board.participants.length - 5}
            </div>
          )}
        </div>
        {remainingVotes && board.phase === 'VOTING' && (
          <span className="text-xs text-indigo-600 font-medium ml-2">
            残り{remainingVotes.remaining}/{remainingVotes.max}票
          </span>
        )}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Users size={16} />
        参加者 ({onlineCount}/{board.participants.length})
      </h3>

      {remainingVotes && board.phase === 'VOTING' && (
        <div className="mb-3 px-3 py-2 bg-indigo-50 rounded-lg">
          <div className="text-sm text-indigo-700 font-medium">
            投票: {remainingVotes.used}/{remainingVotes.max}
          </div>
          <div className="text-xs text-indigo-500">
            残り {remainingVotes.remaining}票
          </div>
        </div>
      )}

      <div className="space-y-2">
        {board.participants.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <div className="relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white ${
                  p.isOnline ? 'bg-indigo-500' : 'bg-gray-300'
                }`}
              >
                {p.nickname.charAt(0).toUpperCase()}
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  p.isOnline ? 'bg-green-400' : 'bg-gray-300'
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-700 truncate">
                {p.nickname}
              </div>
              {p.isFacilitator && (
                <div className="text-xs text-indigo-500">ファシリテーター</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
