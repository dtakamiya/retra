import { useState } from 'react';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';

interface Props {
  columnId: string;
  onClose: () => void;
}

export function CardForm({ columnId, onClose }: Props) {
  const { board, participant } = useBoardStore();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !board || !participant) return;
    setLoading(true);
    try {
      await api.createCard(board.slug, columnId, content.trim(), participant.id);
      setContent('');
      onClose();
    } catch (err) {
      console.error('Failed to create card:', err);
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your thought... (Enter to submit, Shift+Enter for newline)"
        className="w-full resize-none border-0 focus:ring-0 outline-none text-sm text-gray-800 placeholder:text-gray-400 min-h-[60px]"
        autoFocus
        rows={3}
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onClose}
          className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
          className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '...' : 'Add'}
        </button>
      </div>
    </div>
  );
}
