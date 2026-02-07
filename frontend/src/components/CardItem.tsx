import { useState } from 'react';
import { ThumbsUp, Pencil, Trash2, GripVertical, MessageSquare } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';
import { MemoList } from './MemoList';
import { ReactionList } from './ReactionList';
import { ReactionPicker } from './ReactionPicker';
import type { Card } from '../types';

interface Props {
  card: Card;
  columnColor: string;
  isOverlay?: boolean;
}

export function CardItem({ card, columnColor, isOverlay }: Props) {
  const { board, participant, remainingVotes } = useBoardStore();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(card.content);
  const [loading, setLoading] = useState(false);
  const [memosExpanded, setMemosExpanded] = useState(false);

  const isAuthor = board && participant ? card.participantId === participant.id : false;
  const isFacilitator = participant?.isFacilitator ?? false;
  const phase = board?.phase;
  const isVoting = phase === 'VOTING';
  const isWriting = phase === 'WRITING';
  const isDiscussionLike = phase === 'DISCUSSION' || phase === 'ACTION_ITEMS';
  const showMemos = isDiscussionLike || phase === 'CLOSED';

  const isDndEnabled =
    (isWriting && isAuthor) || (isDiscussionLike && isFacilitator);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    disabled: !isDndEnabled || editing,
  });

  const style = isOverlay
    ? { opacity: 1 }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      };

  if (!board || !participant) return null;

  const canVote = isVoting && (remainingVotes?.remaining ?? 0) > 0;

  const handleVote = async () => {
    if (!canVote) return;
    setLoading(true);
    try {
      await api.addVote(board.slug, card.id, participant.id);
    } catch {
      // 投票失敗はWebSocket経由で最新状態が反映される
    } finally {
      setLoading(false);
    }
  };

  const handleUnvote = async () => {
    if (!isVoting) return;
    setLoading(true);
    try {
      await api.removeVote(board.slug, card.id, participant.id);
    } catch {
      // 投票解除失敗はWebSocket経由で最新状態が反映される
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    setLoading(true);
    try {
      await api.updateCard(board.slug, card.id, editContent.trim(), participant.id);
      setEditing(false);
    } catch {
      // 更新失敗はWebSocket経由で最新状態が反映される
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.deleteCard(board.slug, card.id, participant.id);
    } catch {
      // 削除失敗はWebSocket経由で最新状態が反映される
    } finally {
      setLoading(false);
    }
  };

  const handleReactionToggle = async (emoji: string) => {
    const hasReacted = card.reactions.some(
      (r) => r.participantId === participant?.id && r.emoji === emoji
    );
    try {
      if (hasReacted) {
        await api.removeReaction(board.slug, card.id, participant!.id, emoji);
      } else {
        await api.addReaction(board.slug, card.id, participant!.id, emoji);
      }
    } catch {
      // リアクション失敗はWebSocket経由で最新状態が反映される
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUpdate();
    }
    if (e.key === 'Escape') {
      setEditing(false);
      setEditContent(card.content);
    }
  };

  if (editing) {
    return (
      <div ref={setNodeRef} style={style} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleEditKeyDown}
          className="w-full resize-none border-0 focus:ring-0 outline-none text-sm text-gray-800 min-h-[60px]"
          autoFocus
          rows={3}
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={() => {
              setEditing(false);
              setEditContent(card.content);
            }}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
          >
            キャンセル
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || !editContent.trim()}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 group ${
        isOverlay ? 'shadow-lg ring-2 ring-indigo-300' : ''
      }`}
    >
      <div className="flex gap-2">
        {isDndEnabled && (
          <button
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 mt-0.5"
            aria-label="ドラッグして並べ替え"
          >
            <GripVertical size={14} />
          </button>
        )}
        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words flex-1">{card.content}</p>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {/* Vote button / count */}
          {isVoting ? (
            <button
              onClick={card.voteCount > 0 ? handleUnvote : handleVote}
              disabled={loading || (!canVote && card.voteCount === 0)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                card.voteCount > 0
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              style={card.voteCount > 0 ? { backgroundColor: columnColor } : undefined}
            >
              <ThumbsUp size={12} />
              <span>{card.voteCount}</span>
            </button>
          ) : card.voteCount > 0 ? (
            <span
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white"
              style={{ backgroundColor: columnColor }}
            >
              <ThumbsUp size={12} />
              {card.voteCount}
            </span>
          ) : null}

          {card.authorNickname && (
            <span className="text-xs text-gray-400">{card.authorNickname}</span>
          )}
        </div>

        {/* Edit/Delete buttons */}
        {(isAuthor || isFacilitator) && isWriting && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isAuthor && (
              <button
                onClick={() => setEditing(true)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <Pencil size={14} />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-500 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1">
          {/* Reaction picker */}
          <ReactionPicker onSelect={handleReactionToggle} disabled={loading} />

          {/* Memo toggle */}
          {showMemos && (
            <button
              onClick={() => setMemosExpanded(!memosExpanded)}
              className="flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-600 rounded transition-colors"
              aria-label="メモを表示"
            >
              <MessageSquare size={12} />
              {card.memos.length > 0 && <span>{card.memos.length}</span>}
            </button>
          )}
        </div>
      </div>

      {/* Reactions */}
      {card.reactions.length > 0 && (
        <div className="mt-1.5">
          <ReactionList
            reactions={card.reactions}
            myParticipantId={participant?.id}
            onToggle={handleReactionToggle}
            disabled={loading}
          />
        </div>
      )}

      {/* Memo list */}
      {showMemos && memosExpanded && (
        <MemoList cardId={card.id} memos={card.memos} />
      )}
    </div>
  );
}
