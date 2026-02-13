import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';
import { useToastStore } from '../store/toastStore';
import type { Participant } from '../types';

interface Props {
  slug: string;
  participants: Participant[];
  cardId?: string;
  initialContent?: string;
}

export function ActionItemForm({ slug, participants, cardId, initialContent = '' }: Props) {
  const { participant } = useBoardStore();
  const [content, setContent] = useState(initialContent);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  if (!participant) return null;

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await api.createActionItem(
        slug,
        content.trim(),
        participant.id,
        cardId || undefined,
        assigneeId || undefined,
        dueDate || undefined
      );
      setContent('');
      setAssigneeId('');
      setDueDate('');
    } catch {
      addToast('error', 'アクションアイテムの追加に失敗しました');
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
    <div className="bg-gray-50 rounded-lg p-3 border border-dashed border-gray-300 space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="アクションアイテムを追加..."
        maxLength={2000}
        className="w-full resize-none border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-300 min-h-[40px]"
        rows={2}
      />
      <div className="flex gap-2 items-end flex-wrap">
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
          aria-label="担当者を選択"
        >
          <option value="">担当者（任意）</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>{p.nickname}</option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
          aria-label="期限を設定"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
          className="ml-auto p-1.5 text-indigo-500 hover:text-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="アクションアイテムを追加"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
