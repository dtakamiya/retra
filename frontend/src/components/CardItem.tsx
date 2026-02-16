import { useEffect, useRef, useState } from 'react';
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
import { CharacterCounter } from './CharacterCounter';
import { CardDetailModal } from './CardDetailModal';
import type { Card } from '../types';

const MAX_CONTENT_LENGTH = 2000;

interface Props {
  card: Card;
  columnColor: string;
  columnName?: string;
  isOverlay?: boolean;
  maxVoteCount?: number;
}

export function CardItem({ card, columnColor, columnName, isOverlay, maxVoteCount }: Props) {
  const { board, participant, remainingVotes } = useBoardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(card.content);
  const [loading, setLoading] = useState(false);
  const [memosExpanded, setMemosExpanded] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const isAuthor = board && participant ? card.participantId === participant.id : false;
  const isFacilitator = participant?.isFacilitator ?? false;
  const phase = board?.phase;
  const isVoting = phase === 'VOTING';
  const isWriting = phase === 'WRITING';
  const isDiscussionLike = phase === 'DISCUSSION' || phase === 'ACTION_ITEMS';
  const showMemos = isDiscussionLike || phase === 'CLOSED';

  // DISCUSSIONフェーズ遷移時にメモありカードのメモセクションを自動展開
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (prevPhaseRef.current !== phase && (phase === 'DISCUSSION') && card.memos.length > 0) {
      setMemosExpanded(true);
    }
    prevPhaseRef.current = phase;
  }, [phase, card.memos.length]);

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
    if (!editContent.trim() || editContent.length > MAX_CONTENT_LENGTH) return;
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
      <div ref={setNodeRef} style={style} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-800/50 p-3 animate-[scaleFadeIn_0.15s_ease-out]">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleEditKeyDown}
          className="w-full resize-none border-0 focus:ring-0 outline-none text-sm text-gray-800 dark:text-slate-200 dark:bg-slate-800 min-h-[60px]"
          maxLength={MAX_CONTENT_LENGTH}
          autoFocus
          rows={3}
        />
        <div className="flex items-center justify-between mt-2">
          <CharacterCounter current={editContent.length} max={MAX_CONTENT_LENGTH} />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setEditContent(card.content);
              }}
              className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleUpdate}
              disabled={loading || !editContent.trim()}
              className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...safeAttributes}
      className={`bg-white dark:bg-slate-800 rounded-xl border p-3 group transition-all ${
        isOverlay ? 'shadow-xl ring-2 ring-indigo-300/50 dark:ring-indigo-500/30 border-indigo-200 dark:border-indigo-600' : 'shadow-sm hover:shadow-md hover:-translate-y-0.5 border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600'
      } ${card.isDiscussed ? 'opacity-50' : ''} ${hasMyVoteHighlight ? 'border-l-[3px] border-l-indigo-500' : ''}`}
    >
      <div className="flex gap-2">
        {isDndEnabled && (
          <button
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 dark:text-slate-600 dark:hover:text-slate-400 mt-0.5 transition-colors"
            aria-label="ドラッグして並べ替え"
          >
            <GripVertical size={14} />
          </button>
        )}
        {(phase === 'DISCUSSION' || phase === 'ACTION_ITEMS') && (
          <button
            onClick={isFacilitator ? handleMarkDiscussed : undefined}
            className={`flex-shrink-0 mt-0.5 transition-colors ${
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
        <p
          className="text-sm text-gray-700 dark:text-slate-200 whitespace-pre-wrap break-words flex-1 leading-relaxed cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          onClick={() => setShowDetailModal(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') setShowDetailModal(true); }}
          title="クリックで詳細を表示"
          aria-label="カード詳細を表示"
        >
          {card.content}
        </p>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 dark:border-slate-700">
        <div className="flex items-center gap-2">
          {/* Vote button / count */}
          {isVoting ? (
            <button
              onClick={hasMyVote ? handleUnvote : handleVote}
              disabled={loading || (!canVote && !hasMyVote)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                hasMyVote
                  ? 'text-white shadow-sm'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
              }`}
              style={hasMyVote ? { backgroundColor: columnColor } : undefined}
              data-testid="vote-button"
            >
              <ThumbsUp size={12} />
              <span>{card.voteCount}</span>
            </button>
          ) : card.voteCount > 0 ? (
            <span
              className={`flex items-center gap-1 rounded-lg font-bold text-white ${
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
            <span className="text-[11px] text-gray-400 dark:text-slate-500">{card.authorNickname}</span>
          ) : board.isAnonymous ? (
            <span className="text-[11px] text-gray-400 dark:text-slate-500 italic">匿名</span>
          ) : null}
        </div>

        {/* Edit/Delete buttons */}
        {(isAuthor || isFacilitator) && isWriting && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isAuthor && (
              <button
                onClick={() => setEditing(true)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 rounded transition-colors"
                aria-label="カードを編集"
              >
                <Pencil size={13} />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded transition-colors"
              aria-label="カードを削除"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1">
          {/* Convert to action item */}
          {(phase === 'DISCUSSION' || phase === 'ACTION_ITEMS') && (
            <button
              onClick={handleConvertToActionItem}
              className="p-1 text-gray-400 hover:text-purple-600 dark:text-slate-500 dark:hover:text-purple-400 rounded transition-colors"
              aria-label="アクションアイテムに変換"
              title="アクションアイテムに変換"
            >
              <ListTodo size={13} />
            </button>
          )}

          {/* Reaction picker */}
          <ReactionPicker onSelect={handleReactionToggle} disabled={loading} />

          {/* Memo toggle */}
          {showMemos && (
            <button
              onClick={() => setMemosExpanded(!memosExpanded)}
              className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-md transition-colors ${
                memosExpanded ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30' : 'text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300'
              }`}
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

      {/* Card detail modal */}
      {showDetailModal && (
        <CardDetailModal
          card={card}
          columnName={columnName ?? ''}
          columnColor={columnColor}
          myParticipantId={participant?.id}
          onClose={() => setShowDetailModal(false)}
          onReactionToggle={handleReactionToggle}
        />
      )}
    </div>
  );
}
