import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CardDetailModal } from './CardDetailModal';
import { createCard, createMemo, createReaction } from '../test/fixtures';

vi.mock('../store/boardStore', () => ({
  useBoardStore: () => ({
    board: {
      id: 'board-1',
      slug: 'test1234',
      phase: 'DISCUSSION',
      isAnonymous: false,
      participants: [],
      columns: [],
    },
    participant: { id: 'p-1', nickname: 'TestUser', isFacilitator: false },
  }),
}));

describe('CardDetailModal', () => {
  const defaultProps = {
    card: createCard({ content: 'This is a test card' }),
    columnName: 'Keep',
    columnColor: '#22c55e',
    myParticipantId: 'p-1',
    onClose: vi.fn(),
    onReactionToggle: vi.fn(),
  };

  it('shows card content', () => {
    render(<CardDetailModal {...defaultProps} />);
    expect(screen.getByText('This is a test card')).toBeInTheDocument();
  });

  it('shows column name', () => {
    render(<CardDetailModal {...defaultProps} />);
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('shows author nickname', () => {
    const card = createCard({ authorNickname: 'Alice' });
    render(<CardDetailModal {...defaultProps} card={card} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows vote count when > 0', () => {
    const card = createCard({ voteCount: 5 });
    render(<CardDetailModal {...defaultProps} card={card} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows reactions', () => {
    const card = createCard({
      reactions: [createReaction({ emoji: '👍', participantId: 'p-1' })],
    });
    render(<CardDetailModal {...defaultProps} card={card} />);
    expect(screen.getByText('👍')).toBeInTheDocument();
  });

  it('shows memo count', () => {
    const card = createCard({
      memos: [createMemo({ id: 'm1' }), createMemo({ id: 'm2' })],
    });
    render(<CardDetailModal {...defaultProps} card={card} />);
    expect(screen.getByText('メモ (2)')).toBeInTheDocument();
  });

  it('closes on close button click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CardDetailModal {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByLabelText('閉じる'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(<CardDetailModal {...defaultProps} onClose={onClose} />);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on backdrop click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CardDetailModal {...defaultProps} onClose={onClose} />);
    const backdrop = screen.getByRole('dialog');
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('has dialog role with aria-modal', () => {
    render(<CardDetailModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
