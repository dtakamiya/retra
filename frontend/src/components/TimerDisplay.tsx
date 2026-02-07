import { useState } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';

interface Props {
  compact?: boolean;
}

export function TimerDisplay({ compact = false }: Props) {
  const { board, participant, timer } = useBoardStore();
  const [showDuration, setShowDuration] = useState(false);
  const [duration, setDuration] = useState(5);

  if (!board || !participant) return null;

  const isFacilitator = participant.isFacilitator;
  const minutes = Math.floor(timer.remainingSeconds / 60);
  const seconds = timer.remainingSeconds % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isLow = timer.isRunning && timer.remainingSeconds <= 30;
  const isExpired = timer.totalSeconds > 0 && timer.remainingSeconds === 0 && !timer.isRunning;

  const handleStart = async () => {
    try {
      await api.controlTimer(board.slug, 'START', participant.id, duration * 60);
      setShowDuration(false);
    } catch (err) {
      console.error('Failed to start timer:', err);
    }
  };

  const handlePause = async () => {
    try {
      await api.controlTimer(board.slug, 'PAUSE', participant.id);
    } catch (err) {
      console.error('Failed to pause timer:', err);
    }
  };

  const handleResume = async () => {
    try {
      await api.controlTimer(board.slug, 'RESUME', participant.id);
    } catch (err) {
      console.error('Failed to resume timer:', err);
    }
  };

  const handleReset = async () => {
    try {
      await api.controlTimer(board.slug, 'RESET', participant.id);
    } catch (err) {
      console.error('Failed to reset timer:', err);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Timer size={16} className={isLow ? 'text-red-500' : 'text-gray-500'} />
        <span
          className={`text-sm font-mono font-medium ${
            isLow ? 'text-red-500' : isExpired ? 'text-red-400' : 'text-gray-700'
          }`}
        >
          {timer.totalSeconds > 0 ? timeStr : '--:--'}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Timer size={16} />
        タイマー
      </h3>

      <div
        className={`text-3xl font-mono font-bold text-center py-3 rounded-lg mb-3 ${
          isLow
            ? 'bg-red-50 text-red-600'
            : isExpired
              ? 'bg-red-50 text-red-400'
              : timer.isRunning
                ? 'bg-indigo-50 text-indigo-700'
                : 'bg-gray-50 text-gray-400'
        }`}
      >
        {timer.totalSeconds > 0 ? timeStr : '--:--'}
      </div>

      {isExpired && (
        <div className="text-center text-sm text-red-500 mb-3 font-medium">
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
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
              />
              <span className="text-sm text-gray-500">分</span>
              <button
                onClick={handleStart}
                className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                開始
              </button>
              <button
                onClick={() => setShowDuration(false)}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {!timer.isRunning && timer.remainingSeconds === 0 && (
                <button
                  onClick={() => setShowDuration(true)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                >
                  <Play size={14} />
                  開始
                </button>
              )}
              {timer.isRunning && (
                <button
                  onClick={handlePause}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
                >
                  <Pause size={14} />
                  一時停止
                </button>
              )}
              {!timer.isRunning && timer.remainingSeconds > 0 && (
                <button
                  onClick={handleResume}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                >
                  <Play size={14} />
                  再開
                </button>
              )}
              {timer.totalSeconds > 0 && (
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
