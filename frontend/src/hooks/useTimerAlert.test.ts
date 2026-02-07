import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBoardStore } from '../store/boardStore';
import { useTimerAlert } from '../hooks/useTimerAlert';

const mockStart = vi.fn();
const mockStop = vi.fn();
const mockConnect = vi.fn();

vi.stubGlobal(
  'AudioContext',
  vi.fn(() => ({
    createOscillator: () => ({
      connect: mockConnect,
      frequency: { value: 0 },
      type: '',
      start: mockStart,
      stop: mockStop,
    }),
    createGain: () => ({
      connect: mockConnect,
      gain: { value: 0, exponentialRampToValueAtTime: vi.fn() },
    }),
    destination: {},
    currentTime: 0,
  }))
);

describe('useTimerAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBoardStore.setState({
      timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0 },
    });
  });

  it('does NOT play sound when timer is running (remaining > 0)', () => {
    useBoardStore.setState({
      timer: { isRunning: true, remainingSeconds: 10, totalSeconds: 60 },
    });

    renderHook(() => useTimerAlert());

    expect(mockStart).not.toHaveBeenCalled();
  });

  it('plays sound when timer transitions from > 0 to 0 (with totalSeconds > 0)', () => {
    // Start with remaining > 0
    useBoardStore.setState({
      timer: { isRunning: true, remainingSeconds: 5, totalSeconds: 60 },
    });

    const { rerender } = renderHook(() => useTimerAlert());

    expect(mockStart).not.toHaveBeenCalled();

    // Transition to 0
    act(() => {
      useBoardStore.setState({
        timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 60 },
      });
    });

    rerender();

    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it('does NOT play when totalSeconds is 0', () => {
    // Start with remaining > 0 but totalSeconds will be 0
    useBoardStore.setState({
      timer: { isRunning: false, remainingSeconds: 5, totalSeconds: 0 },
    });

    const { rerender } = renderHook(() => useTimerAlert());

    // Transition to 0 with totalSeconds = 0
    act(() => {
      useBoardStore.setState({
        timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0 },
      });
    });

    rerender();

    expect(mockStart).not.toHaveBeenCalled();
  });
});
