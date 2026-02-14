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
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={2000}
          className="w-full resize-none border border-gray-200 rounded px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-300 min-h-[48px]"
          autoFocus
          rows={2}
        />
        <div className="flex justify-end gap-1 mt-1">
          <button
            onClick={() => {
              setEditing(false);
              setEditContent(actionItem.content);
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
            aria-label="キャンセル"
          >
            <X size={14} />
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || !editContent.trim()}
            className="p-1 text-indigo-500 hover:text-indigo-700 disabled:opacity-30"
            aria-label="保存"
          >
            <Check size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
      <div className="flex gap-2 items-start">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{actionItem.content}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <ActionItemStatusBadge status={actionItem.status} />
            <ActionItemPriorityBadge priority={actionItem.priority} />
            {actionItem.assigneeNickname && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <User size={10} />
                {actionItem.assigneeNickname}
              </span>
            )}
            {actionItem.dueDate && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
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
              className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
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
                  className="p-0.5 text-gray-400 hover:text-gray-600"
                  aria-label="アクションアイテムを編集"
                >
                  <Pencil size={12} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="p-0.5 text-gray-400 hover:text-red-500"
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
