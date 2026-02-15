import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';
import { useToastStore } from '../store/toastStore';
import type { Phase } from '../types';
import { PhaseTransitionDialog } from './PhaseTransitionDialog';

const PHASES: { key: Phase; label: string }[] = [
  { key: 'WRITING', label: '記入' },
  { key: 'VOTING', label: '投票' },
  { key: 'DISCUSSION', label: '議論' },
  { key: 'ACTION_ITEMS', label: 'アクション' },
  { key: 'CLOSED', label: '完了' },
];

const NEXT_PHASE: Record<Phase, Phase | null> = {
  WRITING: 'VOTING',
  VOTING: 'DISCUSSION',
  DISCUSSION: 'ACTION_ITEMS',
  ACTION_ITEMS: 'CLOSED',
  CLOSED: null,
};

export function PhaseControl() {
  const { board, participant, setBoard } = useBoardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  if (!board || !participant) return null;

  const isFacilitator = participant.isFacilitator;
  const currentIndex = PHASES.findIndex((p) => p.key === board.phase);
  const nextPhase = NEXT_PHASE[board.phase];

  const handleAdvance = async () => {
    if (!nextPhase || !isFacilitator || loading) return;
    setLoading(true);
    try {
      const updated = await api.changePhase(board.slug, nextPhase, participant.id);
      setBoard(updated);
      setShowDialog(false);
    } catch {
      addToast('error', 'フェーズの変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Phase stepper */}
        <div className="hidden sm:flex items-center gap-0.5 p-1 bg-gray-50 rounded-lg">
          {PHASES.map((phase, i) => (
            <div key={phase.key} className="flex items-center">
              <div
                className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all ${
                  i === currentIndex
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : i < currentIndex
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-400'
                }`}
              >
                {phase.label}
              </div>
              {i < PHASES.length - 1 && (
                <ChevronRight size={12} className={`mx-0.5 ${i < currentIndex ? 'text-indigo-300' : 'text-gray-300'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Mobile phase indicator */}
        <span className="sm:hidden px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-medium rounded-md shadow-sm shadow-indigo-200">
          {PHASES[currentIndex]?.label}
        </span>

        {/* Advance button (facilitator only) */}
        {isFacilitator && nextPhase && (
          <button
            onClick={() => setShowDialog(true)}
            disabled={loading}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-50 transition-all shadow-sm shadow-indigo-200 hover:shadow-md active:scale-[0.97]"
          >
            次へ: {PHASES.find((p) => p.key === nextPhase)?.label}
          </button>
        )}
      </div>

      {showDialog && nextPhase && (
        <PhaseTransitionDialog
          board={board}
          nextPhase={nextPhase}
          loading={loading}
          onConfirm={handleAdvance}
          onCancel={() => setShowDialog(false)}
        />
      )}
    </>
  );
}
