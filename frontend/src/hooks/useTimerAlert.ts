import { useEffect, useRef } from 'react';
import { useBoardStore } from '../store/boardStore';

export function useTimerAlert() {
  const timer = useBoardStore((s) => s.timer);
  const prevRemainingRef = useRef(timer.remainingSeconds);

  useEffect(() => {
    const prev = prevRemainingRef.current;
    prevRemainingRef.current = timer.remainingSeconds;

    // Alert when timer reaches 0 (was > 0 before)
    if (prev > 0 && timer.remainingSeconds === 0 && timer.totalSeconds > 0) {
      try {
        // Use Web Audio API for notification sound
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
        oscillator.stop(audioCtx.currentTime + 1);
      } catch {
        // Audio not available
      }
    }
  }, [timer.remainingSeconds, timer.totalSeconds]);
}
