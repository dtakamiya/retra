import { useState } from 'react';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';
import { useToastStore } from '../store/toastStore';

interface Props {
  columnId: string;
  onClose: () => void;
}

export function CardForm({ columnId, onClose }: Props) {
  const { board, participant } = useBoardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !board || !participant) return;
    setLoading(true);
    try {
      await api.createCard(board.slug, columnId, content.trim(), participant.id);
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
    <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-3 animate-[scaleFadeIn_0.15s_ease-out]">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="意見を入力...（Enterで送信、Shift+Enterで改行）"
        className="w-full resize-none border-0 focus:ring-0 outline-none text-sm text-gray-700 placeholder:text-gray-300 min-h-[60px] leading-relaxed"
        autoFocus
        rows={3}
      />
      <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-50">
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          キャンセル
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
          className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
        >
          {loading ? '...' : '追加'}
        </button>
      </div>
    </div>
  );
}
