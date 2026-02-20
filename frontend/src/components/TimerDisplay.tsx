import { useState } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { api } from '../api/client';
import { useShallow } from 'zustand/react/shallow';
import { useBoardStore } from '../store/boardStore';
import { useToastStore } from '../store/toastStore';

interface Props {
  compact?: boolean;
}

export function TimerDisplay({ compact = false }: Props) {
  const { board, participant, timer } = useBoardStore(useShallow((s) => ({ board: s.board, participant: s.participant, timer: s.timer })));
  const addToast = useToastStore((s) => s.addToast);
  const [showDuration, setShowDuration] = useState(false);
  const [duration, setDuration] = useState(5);

  if (!board || !participant) return null;

  const isFacilitator = participant.isFacilitator;
  const minutes = Math.floor(timer.remainingSeconds / 60);
  const seconds = timer.remainingSeconds % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isLow = timer.isRunning && timer.remainingSeconds <= 30;
  const isExpired = timer.totalSeconds > 0 && timer.remainingSeconds === 0 && !timer.isRunning;
  const progress = timer.totalSeconds > 0 ? (timer.remainingSeconds / timer.totalSeconds) * 100 : 0;

  const handleStart = async () => {
    try {
      await api.controlTimer(board.slug, 'START', participant.id, duration * 60);
      setShowDuration(false);
    } catch {
      addToast('error', 'タイマーの開始に失敗しました');
    }
  };

  const handlePause = async () => {
    try {
      await api.controlTimer(board.slug, 'PAUSE', participant.id);
    } catch {
      addToast('error', 'タイマーの一時停止に失敗しました');
    }
  };

  const handleResume = async () => {
    try {
      await api.controlTimer(board.slug, 'RESUME', participant.id);
    } catch {
      addToast('error', 'タイマーの再開に失敗しました');
    }
  };

  const handleReset = async () => {
    try {
      await api.controlTimer(board.slug, 'RESET', participant.id);
    } catch {
      addToast('error', 'タイマーのリセットに失敗しました');
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Timer size={14} className={isLow ? 'text-red-500' : 'text-gray-400 dark:text-slate-500'} aria-hidden="true" />
        <span
          className={`text-xs font-mono font-semibold ${
            isLow ? 'text-red-500' : isExpired ? 'text-red-400' : 'text-gray-600 dark:text-slate-300'
          }`}
        >
          {timer.totalSeconds > 0 ? timeStr : '--:--'}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Timer size={14} />
        タイマー
      </h3>

      <div
        className={`relative rounded-xl mb-3 overflow-hidden ${
          isLow
            ? 'bg-red-50 dark:bg-red-900/20'
            : isExpired
              ? 'bg-red-50 dark:bg-red-900/20'
              : timer.isRunning
                ? 'bg-indigo-50 dark:bg-indigo-900/20'
                : 'bg-gray-50 dark:bg-slate-800'
        }`}
      >
        {/* Progress bar background */}
        {timer.totalSeconds > 0 && (
          <div
            className={`absolute bottom-0 left-0 h-1 rounded-full transition-all ${
              isLow ? 'bg-red-300 dark:bg-red-400' : 'bg-indigo-300 dark:bg-indigo-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        )}
        <div
          className={`text-3xl font-mono font-bold text-center py-4 ${
            isLow
              ? 'text-red-600 dark:text-red-400'
              : isExpired
                ? 'text-red-400 dark:text-red-500'
                : timer.isRunning
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-400 dark:text-slate-500'
          }`}
        >
          {timer.totalSeconds > 0 ? timeStr : '--:--'}
        </div>
      </div>

      {isExpired && (
        <div className="text-center text-xs text-red-500 mb-3 font-semibold animate-[pulseGlow_2s_ease-in-out_infinite]">
          時間切れ！
        </div>
      )}

      {isFacilitator && (
        <div className="space-y-2">
          {showDuration ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                min={1}
                max={60}
                aria-label="タイマー時間（分）"
                className="w-16 px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-center dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
              />
              <span className="text-xs text-gray-500 dark:text-slate-400">分</span>
              <button
                onClick={handleStart}
                className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-all active:scale-95"
              >
                開始
              </button>
              <button
                onClick={() => setShowDuration(false)}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <div className="flex gap-1.5">
              {!timer.isRunning && timer.remainingSeconds === 0 && (
                <button
                  onClick={() => setShowDuration(true)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-all active:scale-95"
                >
                  <Play size={13} />
                  開始
                </button>
              )}
              {timer.isRunning && (
                <button
                  onClick={handlePause}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-all active:scale-95"
                >
                  <Pause size={13} />
                  一時停止
                </button>
              )}
              {!timer.isRunning && timer.remainingSeconds > 0 && (
                <button
                  onClick={handleResume}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-all active:scale-95"
                >
                  <Play size={13} />
                  再開
                </button>
              )}
              {timer.totalSeconds > 0 && (
                <button
                  onClick={handleReset}
                  aria-label="タイマーをリセット"
                  className="flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition-all active:scale-95"
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
