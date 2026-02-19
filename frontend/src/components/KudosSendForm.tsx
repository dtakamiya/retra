import { useState } from 'react';
import type { Participant, KudosCategory } from '../types';

const KUDOS_CATEGORIES: { value: KudosCategory; icon: string; label: string }[] = [
  { value: 'GREAT_JOB', icon: '🌟', label: 'Great Job!' },
  { value: 'THANK_YOU', icon: '🙏', label: 'Thank You' },
  { value: 'INSPIRING', icon: '💡', label: 'Inspiring' },
  { value: 'HELPFUL', icon: '🤝', label: 'Helpful' },
  { value: 'CREATIVE', icon: '🎨', label: 'Creative' },
  { value: 'TEAM_PLAYER', icon: '💪', label: 'Team Player' },
];

interface Props {
  participants: Participant[];
  currentParticipantId: string;
  onSend: (receiverId: string, category: KudosCategory, message?: string) => void;
  onCancel: () => void;
}

export function KudosSendForm({ participants, currentParticipantId, onSend, onCancel }: Props) {
  const [receiverId, setReceiverId] = useState('');
  const [category, setCategory] = useState<KudosCategory>('GREAT_JOB');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const otherParticipants = participants.filter((p) => p.id !== currentParticipantId);

  const handleSubmit = () => {
    if (!receiverId || sending) return;
    setSending(true);
    onSend(receiverId, category, message.trim() || undefined);
  };

  return (
    <div className="space-y-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
      <div>
        <label htmlFor="kudos-receiver" className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
          送信先
        </label>
        <select
          id="kudos-receiver"
          aria-label="送信先"
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
        >
          <option value="">選択してください</option>
          {otherParticipants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nickname}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label id="kudos-category-label" className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">カテゴリ</label>
        <div className="grid grid-cols-3 gap-1.5" role="group" aria-labelledby="kudos-category-label">
          {KUDOS_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border text-xs transition-colors ${
                category === cat.value
                  ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <span className="text-lg" aria-hidden="true">{cat.icon}</span>
              <span className="leading-tight">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <textarea
          aria-label="メッセージ（任意）"
          placeholder="メッセージ(任意)"
          maxLength={140}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 resize-none"
          rows={2}
        />
        {message.length > 0 && (
          <p className="text-right text-xs text-gray-400 dark:text-slate-500">{message.length}/140</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!receiverId || sending}
          className="flex-1 px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? (
            <span className="inline-flex items-center justify-center gap-1">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              送信中
            </span>
          ) : '送信'}
        </button>
      </div>
    </div>
  );
}
