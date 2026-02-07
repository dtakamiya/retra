import { useState } from 'react';
import { ThumbsUp, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';
import type { Card } from '../types';

interface Props {
  card: Card;
  columnColor: string;
}

export function CardItem({ card, columnColor }: Props) {
  const { board, participant, remainingVotes } = useBoardStore();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(card.content);
  const [loading, setLoading] = useState(false);

  if (!board || !participant) return null;

  const isAuthor = card.participantId === participant.id;
  const isFacilitator = participant.isFacilitator;
  const isVoting = board.phase === 'VOTING';
  const isWriting = board.phase === 'WRITING';
  const canVote = isVoting && (remainingVotes?.remaining ?? 0) > 0;

  const handleVote = async () => {
    if (!canVote) return;
    setLoading(true);
    try {
      await api.addVote(board.slug, card.id, participant.id);
    } catch (err) {
      console.error('Failed to vote:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnvote = async () => {
    if (!isVoting) return;
    setLoading(true);
    try {
      await api.removeVote(board.slug, card.id, participant.id);
    } catch (err) {
      console.error('Failed to remove vote:', err);
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
    } catch (err) {
      console.error('Failed to update card:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.deleteCard(board.slug, card.id, participant.id);
    } catch (err) {
      console.error('Failed to delete card:', err);
    } finally {
      setLoading(false);
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
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
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || !editContent.trim()}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 group">
      <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{card.content}</p>

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
      </div>
    </div>
  );
}
