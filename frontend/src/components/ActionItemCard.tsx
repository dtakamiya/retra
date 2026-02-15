import { useState } from 'react';
import { Pencil, Trash2, Check, X, User, Calendar } from 'lucide-react';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';
import { useToastStore } from '../store/toastStore';
import { ActionItemStatusBadge } from './ActionItemStatusBadge';
import { ActionItemPriorityBadge } from './ActionItemPriorityBadge';
import type { ActionItem, ActionItemStatus } from '../types';

interface Props {
  actionItem: ActionItem;
}

export function ActionItemCard({ actionItem }: Props) {
  const { board, participant } = useBoardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(actionItem.content);
  const [loading, setLoading] = useState(false);

  if (!board || !participant) return null;

  const isAssignee = actionItem.assigneeId === participant.id;
  const isFacilitator = participant.isFacilitator;
  const canModify = (isAssignee || isFacilitator) && board.phase === 'ACTION_ITEMS';
  const canDelete = canModify;

  const handleStatusChange = async (newStatus: ActionItemStatus) => {
    setLoading(true);
    try {
      await api.updateActionItemStatus(board.slug, actionItem.id, newStatus, participant.id);
    } catch {
      addToast('error', 'ステータスの変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    setLoading(true);
    try {
      await api.updateActionItem(board.slug, actionItem.id, editContent.trim(), participant.id);
      setEditing(false);
    } catch {
      addToast('error', 'アクションアイテムの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.deleteActionItem(board.slug, actionItem.id, participant.id);
    } catch {
      addToast('error', 'アクションアイテムの削除に失敗しました');
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
      setEditContent(actionItem.content);
    }
  };

  if (editing) {
    return (
      <div className="bg-white rounded-xl p-3 border border-indigo-100 shadow-sm animate-[scaleFadeIn_0.15s_ease-out]">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={2000}
          className="w-full resize-none border border-gray-100 rounded-lg px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 min-h-[48px]"
          autoFocus
          rows={2}
        />
        <div className="flex justify-end gap-1 mt-1.5">
          <button
            onClick={() => {
              setEditing(false);
              setEditContent(actionItem.content);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="キャンセル"
          >
            <X size={14} />
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || !editContent.trim()}
            className="p-1 text-indigo-500 hover:text-indigo-700 disabled:opacity-30 transition-colors"
            aria-label="保存"
          >
            <Check size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
      <div className="flex gap-2 items-start">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">{actionItem.content}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <ActionItemStatusBadge status={actionItem.status} />
            <ActionItemPriorityBadge priority={actionItem.priority} />
            {actionItem.assigneeNickname && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <User size={10} />
                {actionItem.assigneeNickname}
              </span>
            )}
            {actionItem.dueDate && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Calendar size={10} />
                {actionItem.dueDate}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {canModify && (
            <select
              value={actionItem.status}
              onChange={(e) => handleStatusChange(e.target.value as ActionItemStatus)}
              disabled={loading}
              className="text-[11px] border border-gray-150 rounded-lg px-1.5 py-0.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-600"
              aria-label="ステータスを変更"
            >
              <option value="OPEN">未着手</option>
              <option value="IN_PROGRESS">進行中</option>
              <option value="DONE">完了</option>
            </select>
          )}

          {(canModify || canDelete) && (
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {canModify && (
                <button
                  onClick={() => { setEditContent(actionItem.content); setEditing(true); }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="アクションアイテムを編集"
                >
                  <Pencil size={12} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="アクションアイテムを削除"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
