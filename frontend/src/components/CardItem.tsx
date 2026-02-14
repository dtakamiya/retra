import { useState } from 'react';
import { ThumbsUp, Pencil, Trash2, GripVertical, MessageSquare, ListTodo, CheckCircle } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';
import { useToastStore } from '../store/toastStore';
import { MemoList } from './MemoList';
import { ReactionList } from './ReactionList';
import { ReactionPicker } from './ReactionPicker';
import { VoteProgressBar } from './VoteProgressBar';
import type { Card } from '../types';

interface Props {
  card: Card;
  columnColor: string;
  isOverlay?: boolean;
  maxVoteCount?: number;
}

export function CardItem({ card, columnColor, isOverlay, maxVoteCount }: Props) {
  const { board, participant, remainingVotes } = useBoardStore();
  const addToast = useToastStore((s) => s.addToast);
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

  const isPostWriting = phase !== 'WRITING';
  const hasMyVoteHighlight = isPostWriting && participant
    ? card.votedParticipantIds.includes(participant.id)
    : false;

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

  // aria-disabledをカード全体から除外（DnD無効時でもメモ・リアクション等は操作可能にする）
  const { 'aria-disabled': _ariaDisabled, ...safeAttributes } = attributes;

  const style = isOverlay
    ? { opacity: 1 }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      };

  if (!board || !participant) return null;

  const hasMyVote = isVoting && participant
    ? card.votedParticipantIds.includes(participant.id)
    : false;
  const canVote = isVoting && (remainingVotes?.remaining ?? 0) > 0;

  const handleVote = async () => {
    if (!canVote) return;
    setLoading(true);
    try {
      await api.addVote(board.slug, card.id, participant.id);
    } catch {
      addToast('error', '投票に失敗しました');
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
      addToast('error', '投票の取り消しに失敗しました');
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
      addToast('error', 'カードの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.deleteCard(board.slug, card.id, participant.id);
    } catch {
      addToast('error', 'カードの削除に失敗しました');
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
      addToast('error', 'リアクションの操作に失敗しました');
    }
  };

  const handleMarkDiscussed = async () => {
    if (!board || !participant) return;
    try {
      await api.markCardDiscussed(board.slug, card.id, participant.id, !card.isDiscussed);
    } catch {
      addToast('error', '議論済みマークの変更に失敗しました');
    }
  };

  const handleConvertToActionItem = async () => {
    if (!board || !participant) return;
    try {
      await api.createActionItem(board.slug, card.content, participant.id, card.id);
      addToast('success', 'アクションアイテムに変換しました');
    } catch {
      addToast('error', 'アクションアイテムへの変換に失敗しました');
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
      {...safeAttributes}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 group ${
        isOverlay ? 'shadow-lg ring-2 ring-indigo-300' : ''
      } ${card.isDiscussed ? 'opacity-50' : ''} ${hasMyVoteHighlight ? 'border-l-3 border-l-indigo-500' : ''}`}
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
        {(phase === 'DISCUSSION' || phase === 'ACTION_ITEMS') && (
          <button
            onClick={isFacilitator ? handleMarkDiscussed : undefined}
            className={`flex-shrink-0 mt-0.5 ${
              card.isDiscussed
                ? 'text-green-500'
                : 'text-gray-300'
            } ${isFacilitator ? 'cursor-pointer hover:text-green-400' : 'cursor-default'}`}
            aria-label={card.isDiscussed ? '未議論に戻す' : '議論済みにマーク'}
            disabled={!isFacilitator}
          >
            <CheckCircle size={16} />
          </button>
        )}
        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words flex-1">{card.content}</p>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {/* Vote button / count */}
          {isVoting ? (
            <button
              onClick={hasMyVote ? handleUnvote : handleVote}
              disabled={loading || (!canVote && !hasMyVote)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                hasMyVote
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              style={hasMyVote ? { backgroundColor: columnColor } : undefined}
              data-testid="vote-button"
            >
              <ThumbsUp size={12} />
              <span>{card.voteCount}</span>
            </button>
          ) : card.voteCount > 0 ? (
            <span
              className={`flex items-center gap-1 rounded font-bold text-white ${
                isDiscussionLike || phase === 'CLOSED'
                  ? 'px-2.5 py-1 text-sm'
                  : 'px-2 py-1 text-xs font-medium'
              }`}
              style={{ backgroundColor: columnColor }}
              data-testid="vote-badge"
            >
              <ThumbsUp size={isDiscussionLike || phase === 'CLOSED' ? 16 : 12} />
              {card.voteCount}
            </span>
          ) : null}

          {card.authorNickname ? (
            <span className="text-xs text-gray-400">{card.authorNickname}</span>
          ) : board.isAnonymous ? (
            <span className="text-xs text-gray-400 italic">匿名</span>
          ) : null}
        </div>

        {/* Edit/Delete buttons */}
        {(isAuthor || isFacilitator) && isWriting && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isAuthor && (
              <button
                onClick={() => setEditing(true)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                aria-label="カードを編集"
              >
                <Pencil size={14} />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-500 rounded"
              aria-label="カードを削除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1">
          {/* Convert to action item */}
          {(phase === 'DISCUSSION' || phase === 'ACTION_ITEMS') && (
            <button
              onClick={handleConvertToActionItem}
              className="p-1 text-gray-400 hover:text-purple-600 rounded"
              aria-label="アクションアイテムに変換"
              title="アクションアイテムに変換"
            >
              <ListTodo size={14} />
            </button>
          )}

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

      {/* Vote progress bar */}
      {isPostWriting && card.voteCount > 0 && (
        <VoteProgressBar voteCount={card.voteCount} maxVoteCount={maxVoteCount ?? 0} />
      )}

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
