import { useState } from 'react';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';
import { useToastStore } from '../store/toastStore';
import { CharacterCounter } from './CharacterCounter';

const MAX_CONTENT_LENGTH = 2000;

interface Props {
  columnId: string;
  onClose: () => void;
}

export function CardForm({ columnId, onClose }: Props) {
  const { board, participant, handleCardCreated } = useBoardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || content.length > MAX_CONTENT_LENGTH || !board || !participant) return;
    setLoading(true);
    try {
      const card = await api.createCard(board.slug, columnId, content.trim(), participant.id);
      handleCardCreated(card);
      setContent('');
      onClose();
    } catch {
      addToast('error', 'カードの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-800/50 p-3 animate-[scaleFadeIn_0.15s_ease-out]">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="意見を入力...（Enterで送信、Shift+Enterで改行）"
        aria-label="意見を入力"
        className="w-full resize-none border-0 focus:ring-0 outline-none text-sm text-gray-700 dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-slate-600 dark:bg-slate-800 min-h-[60px] leading-relaxed"
        maxLength={MAX_CONTENT_LENGTH}
        autoFocus
        rows={3}
      />
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 dark:border-slate-700">
        <CharacterCounter current={content.length} max={MAX_CONTENT_LENGTH} />
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? (
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                追加中
              </span>
            ) : '追加'}
          </button>
        </div>
      </div>
    </div>
  );
}
