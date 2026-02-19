import { AlertTriangle, ArrowRight, FileText, MessageSquare, ThumbsUp, Users, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { Board, Phase } from '../types';

const PHASE_LABELS: Record<Phase, string> = {
  WRITING: '記入',
  VOTING: '投票',
  DISCUSSION: '議論',
  ACTION_ITEMS: 'アクション',
  CLOSED: '完了',
};

const PHASE_DESCRIPTIONS: Record<Phase, string> = {
  WRITING: '参加者がカードを記入できます',
  VOTING: '参加者がカードに投票できます',
  DISCUSSION: 'カードについて議論します',
  ACTION_ITEMS: 'アクションアイテムを作成します',
  CLOSED: 'レトロスペクティブが完了します',
};

const PHASE_WARNINGS: Partial<Record<Phase, string>> = {
  VOTING: '記入フェーズが終了し、新しいカードを追加できなくなります',
  DISCUSSION: '投票フェーズが終了し、投票の変更ができなくなります',
  ACTION_ITEMS: '議論フェーズが終了します',
  CLOSED: 'レトロスペクティブが終了し、スナップショットが自動保存されます',
};

interface PhaseTransitionDialogProps {
  board: Board;
  nextPhase: Phase;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function computeSummary(board: Board) {
  const allCards = board.columns.flatMap((col) => col.cards);
  const totalCards = allCards.length;
  const totalVotes = allCards.reduce((sum, c) => sum + c.voteCount, 0);
  const totalMemos = allCards.reduce((sum, c) => sum + c.memos.length, 0);
  const onlineParticipants = board.participants.filter((p) => p.isOnline).length;
  const totalParticipants = board.participants.length;

  return { totalCards, totalVotes, totalMemos, onlineParticipants, totalParticipants };
}

export function PhaseTransitionDialog({ board, nextPhase, loading, onConfirm, onCancel }: PhaseTransitionDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const { totalCards, totalVotes, totalMemos, onlineParticipants, totalParticipants } = computeSummary(board);
  const warning = PHASE_WARNINGS[nextPhase];

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

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
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="フェーズ遷移の確認"
    >
      <div ref={dialogRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">フェーズを進めますか？</h2>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Phase transition indicator */}
          <div className="flex items-center justify-center gap-3 py-3 px-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <span className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md">
              {PHASE_LABELS[board.phase]}
            </span>
            <ArrowRight size={18} className="text-indigo-400" />
            <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 text-sm font-medium rounded-md border border-indigo-200 dark:border-indigo-700">
              {PHASE_LABELS[nextPhase]}
            </span>
          </div>

          {/* Current stats */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">現在の状況</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <FileText size={14} className="text-gray-400 dark:text-slate-500" />
                <span className="text-sm text-gray-700 dark:text-slate-300">カード <span className="font-semibold">{totalCards}</span> 枚</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <ThumbsUp size={14} className="text-gray-400 dark:text-slate-500" />
                <span className="text-sm text-gray-700 dark:text-slate-300">投票 <span className="font-semibold">{totalVotes}</span> 件</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <MessageSquare size={14} className="text-gray-400 dark:text-slate-500" />
                <span className="text-sm text-gray-700 dark:text-slate-300">メモ <span className="font-semibold">{totalMemos}</span> 件</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <Users size={14} className="text-gray-400 dark:text-slate-500" />
                <span className="text-sm text-gray-700 dark:text-slate-300">参加者 <span className="font-semibold">{onlineParticipants}/{totalParticipants}</span></span>
              </div>
            </div>
          </div>

          {/* Next phase description */}
          <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">{PHASE_DESCRIPTIONS[nextPhase]}</p>
          </div>

          {/* Warning */}
          {warning && (
            <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">{warning}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? '処理中...' : `${PHASE_LABELS[nextPhase]}へ進む`}
          </button>
        </div>
      </div>
    </div>
  );
}
