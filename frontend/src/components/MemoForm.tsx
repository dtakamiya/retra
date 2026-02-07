import { useState } from 'react';
import { Send } from 'lucide-react';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';

interface Props {
  cardId: string;
}

export function MemoForm({ cardId }: Props) {
  const { board, participant } = useBoardStore();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  if (!board || !participant) return null;

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await api.createMemo(board.slug, cardId, content.trim(), participant.id);
      setContent('');
    } catch {
      // エラー時はWebSocket経由で最新状態が反映される
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="メモを追加..."
        maxLength={2000}
        className="flex-1 resize-none border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-300 min-h-[32px]"
        rows={1}
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !content.trim()}
        className="p-1.5 text-indigo-500 hover:text-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="メモを送信"
      >
        <Send size={14} />
      </button>
    </div>
  );
}
