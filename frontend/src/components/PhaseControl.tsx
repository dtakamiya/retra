import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';
import type { Phase } from '../types';

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
  const [loading, setLoading] = useState(false);

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
    } catch (err) {
      console.error('Failed to change phase:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Phase stepper */}
      <div className="hidden sm:flex items-center gap-1">
        {PHASES.map((phase, i) => (
          <div key={phase.key} className="flex items-center">
            <div
              className={`px-2 py-1 text-xs rounded font-medium ${
                i === currentIndex
                  ? 'bg-indigo-600 text-white'
                  : i < currentIndex
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {phase.label}
            </div>
            {i < PHASES.length - 1 && (
              <ChevronRight size={14} className="text-gray-300 mx-0.5" />
            )}
          </div>
        ))}
      </div>

      {/* Mobile phase indicator */}
      <span className="sm:hidden px-2 py-1 bg-indigo-600 text-white text-xs font-medium rounded">
        {PHASES[currentIndex]?.label}
      </span>

      {/* Advance button (facilitator only) */}
      {isFacilitator && nextPhase && (
        <button
          onClick={handleAdvance}
          disabled={loading}
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '...' : `次へ: ${PHASES.find((p) => p.key === nextPhase)?.label}`}
        </button>
      )}
    </div>
  );
}
