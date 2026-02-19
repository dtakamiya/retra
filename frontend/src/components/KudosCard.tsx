import { X } from 'lucide-react';
import type { Kudos, KudosCategory } from '../types';

const CATEGORY_INFO: Record<KudosCategory, { icon: string; label: string }> = {
  GREAT_JOB: { icon: '🌟', label: 'Great Job!' },
  THANK_YOU: { icon: '🙏', label: 'Thank You' },
  INSPIRING: { icon: '💡', label: 'Inspiring' },
  HELPFUL: { icon: '🤝', label: 'Helpful' },
  CREATIVE: { icon: '🎨', label: 'Creative' },
  TEAM_PLAYER: { icon: '💪', label: 'Team Player' },
};

interface Props {
  kudos: Kudos;
  currentParticipantId: string;
  isAnonymous: boolean;
  onDelete: (kudosId: string) => void;
}

export function KudosCard({ kudos, currentParticipantId, isAnonymous, onDelete }: Props) {
  const isMine = kudos.senderId === currentParticipantId;
  const senderName = isAnonymous && !isMine ? '誰かさん' : kudos.senderNickname;
  const info = CATEGORY_INFO[kudos.category];

  return (
    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl flex-shrink-0">{info.icon}</span>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              <span className="font-medium text-gray-700 dark:text-slate-200">{senderName}</span>
              {' → '}
              <span className="font-medium text-gray-700 dark:text-slate-200">{kudos.receiverNickname}</span>
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{info.label}</p>
          </div>
        </div>
        {isMine && (
          <button
            type="button"
            aria-label="Kudosを削除"
            onClick={() => onDelete(kudos.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {kudos.message && (
        <p className="mt-1.5 text-sm text-gray-600 dark:text-slate-300">{kudos.message}</p>
      )}
    </div>
  );
}
