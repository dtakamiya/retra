import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { PhaseGuidance } from './PhaseGuidance';

describe('PhaseGuidance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows guidance for WRITING phase', () => {
    render(<PhaseGuidance phase="WRITING" />);
    expect(screen.getByText(/カードを追加して意見を書きましょう/)).toBeInTheDocument();
  });

  it('shows guidance for VOTING phase', () => {
    render(<PhaseGuidance phase="VOTING" />);
    expect(screen.getByText(/カードに投票しましょう/)).toBeInTheDocument();
  });

  it('shows guidance for DISCUSSION phase', () => {
    render(<PhaseGuidance phase="DISCUSSION" />);
    expect(screen.getByText(/投票の多いカードから議論しましょう/)).toBeInTheDocument();
  });

  it('shows guidance for ACTION_ITEMS phase', () => {
    render(<PhaseGuidance phase="ACTION_ITEMS" />);
    expect(screen.getByText(/アクションアイテムを作成しましょう/)).toBeInTheDocument();
  });

  it('shows guidance for CLOSED phase', () => {
    render(<PhaseGuidance phase="CLOSED" />);
    expect(screen.getByText(/レトロスペクティブが完了しました/)).toBeInTheDocument();
  });

  it('auto-dismisses after 8 seconds', () => {
    render(<PhaseGuidance phase="WRITING" />);
    expect(screen.getByText(/カードを追加して意見を書きましょう/)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(screen.queryByText(/カードを追加して意見を書きましょう/)).not.toBeInTheDocument();
  });

  it('can be manually dismissed', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<PhaseGuidance phase="WRITING" />);
    expect(screen.getByText(/カードを追加して意見を書きましょう/)).toBeInTheDocument();
    await user.click(screen.getByLabelText('ガイダンスを閉じる'));
    expect(screen.queryByText(/カードを追加して意見を書きましょう/)).not.toBeInTheDocument();
  });

  it('reappears when phase changes', () => {
    const { rerender } = render(<PhaseGuidance phase="WRITING" />);
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(screen.queryByText(/カードを追加/)).not.toBeInTheDocument();

    rerender(<PhaseGuidance phase="VOTING" />);
    expect(screen.getByText(/カードに投票しましょう/)).toBeInTheDocument();
  });

  it('has status role', () => {
    render(<PhaseGuidance phase="WRITING" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
