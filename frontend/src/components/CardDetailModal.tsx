import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ThumbsUp, Clock, MessageSquare } from 'lucide-react';
import { MemoList } from './MemoList';
import { ReactionList } from './ReactionList';
import { ReactionPicker } from './ReactionPicker';
import type { Card } from '../types';

interface Props {
  card: Card;
  columnName: string;
  columnColor: string;
  myParticipantId?: string;
  onClose: () => void;
  onReactionToggle: (emoji: string) => void;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CardDetailModal({ card, columnName, columnColor, myParticipantId, onClose, onReactionToggle }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Escape key handler + body scroll lock + initial focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="カード詳細"
    >
      <div
        ref={dialogRef}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col overflow-hidden animate-[scaleFadeIn_0.15s_ease-out] motion-reduce:animate-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: columnColor }}
            />
            <span className="text-sm font-medium text-gray-600 dark:text-slate-300">{columnName}</span>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Card content */}
          <p className="text-sm text-gray-800 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
            {card.content}
          </p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 dark:text-slate-500">
            {card.authorNickname && (
              <span>{card.authorNickname}</span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {formatDateTime(card.createdAt)}
            </span>
            {card.updatedAt !== card.createdAt && (
              <span className="flex items-center gap-1">
                更新 {formatDateTime(card.updatedAt)}
              </span>
            )}
          </div>

          {/* Vote count */}
          {card.voteCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 text-sm font-bold text-white rounded-lg"
                style={{ backgroundColor: columnColor }}
              >
                <ThumbsUp size={14} />
                {card.voteCount}
              </span>
            </div>
          )}

          {/* Reactions */}
          {card.reactions.length > 0 && (
            <div>
              <ReactionList
                reactions={card.reactions}
                myParticipantId={myParticipantId}
                onToggle={onReactionToggle}
                disabled={false}
              />
            </div>
          )}

          {/* Reaction picker */}
          <div className="flex items-center gap-2">
            <ReactionPicker onSelect={onReactionToggle} disabled={false} />
            <span className="text-[11px] text-gray-400 dark:text-slate-500">リアクションを追加</span>
          </div>

          {/* Memos */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-gray-500 dark:text-slate-400">
              <MessageSquare size={12} />
              <span>メモ ({card.memos.length})</span>
            </div>
            <MemoList cardId={card.id} memos={card.memos} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
