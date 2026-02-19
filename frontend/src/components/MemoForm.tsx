import { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';
import { useToastStore } from '../store/toastStore';

interface Props {
  cardId: string;
}

export function MemoForm({ cardId }: Props) {
  const { board, participant } = useBoardStore();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addToast = useToastStore((s) => s.addToast);

  if (!board || !participant) return null;

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await api.createMemo(board.slug, cardId, content.trim(), participant.id);
      setContent('');
    } catch {
      addToast('error', 'メモの追加に失敗しました');
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
      setContent('');
      textareaRef.current?.blur();
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="メモを追加...（Escでクリア）"
        aria-label="メモを追加"
        maxLength={2000}
        className="flex-1 resize-none border border-gray-200 dark:border-slate-600 rounded px-2 py-1 text-xs text-gray-700 dark:text-slate-200 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-300 min-h-[32px]"
        rows={1}
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !content.trim()}
        className="p-1.5 text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="メモを送信"
      >
        <Send size={14} />
      </button>
    </div>
  );
}
