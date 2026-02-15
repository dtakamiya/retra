import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';
import { useToastStore } from '../store/toastStore';
import type { Memo } from '../types';

interface Props {
  memo: Memo;
  cardId: string;
}

export function MemoItem({ memo, cardId }: Props) {
  const { board, participant } = useBoardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(memo.content);
  const [loading, setLoading] = useState(false);

  if (!board || !participant) return null;

  const isAuthor = memo.participantId === participant.id;
  const isFacilitator = participant.isFacilitator;
  const canEdit = isAuthor && (board.phase === 'DISCUSSION' || board.phase === 'ACTION_ITEMS');
  const canDelete = (isAuthor || isFacilitator) && (board.phase === 'DISCUSSION' || board.phase === 'ACTION_ITEMS');

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    setLoading(true);
    try {
      await api.updateMemo(board.slug, cardId, memo.id, editContent.trim(), participant.id);
      setEditing(false);
    } catch {
      addToast('error', 'メモの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.deleteMemo(board.slug, cardId, memo.id, participant.id);
    } catch {
      addToast('error', 'メモの削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUpdate();
    }
    if (e.key === 'Escape') {
      setEditing(false);
      setEditContent(memo.content);
    }
  };

  if (editing) {
    return (
      <div className="bg-gray-50 dark:bg-slate-700/50 rounded p-2">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={2000}
          className="w-full resize-none border border-gray-200 dark:border-slate-600 rounded px-2 py-1 text-xs text-gray-700 dark:text-slate-200 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-300 min-h-[32px]"
          autoFocus
          rows={2}
        />
        <div className="flex justify-end gap-1 mt-1">
          <button
            onClick={() => {
              setEditing(false);
              setEditContent(memo.content);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label="キャンセル"
          >
            <X size={12} />
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || !editContent.trim()}
            className="p-1 text-indigo-500 hover:text-indigo-700 disabled:opacity-30"
            aria-label="保存"
          >
            <Check size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-gray-50 dark:bg-slate-700/50 rounded p-2 flex gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-700 dark:text-slate-200 whitespace-pre-wrap break-words">{memo.content}</p>
        <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 block">{memo.authorNickname}</span>
      </div>
      {(canEdit || canDelete) && (
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {canEdit && (
            <button
              onClick={() => { setEditContent(memo.content); setEditing(true); }}
              className="p-0.5 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200"
              aria-label="メモを編集"
            >
              <Pencil size={10} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="p-0.5 text-gray-400 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400"
              aria-label="メモを削除"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
