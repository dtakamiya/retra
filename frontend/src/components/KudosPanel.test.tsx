import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { KudosPanel } from './KudosPanel';
import { createKudos, createParticipant } from '../test/fixtures';

describe('KudosPanel', () => {
  const defaultProps = {
    kudos: [createKudos({ id: 'k-1', senderNickname: 'Alice', receiverNickname: 'Bob' })],
    participants: [
      createParticipant({ id: 'p-1', nickname: 'Alice' }),
      createParticipant({ id: 'p-2', nickname: 'Bob', isFacilitator: false }),
    ],
    currentParticipantId: 'p-1',
    isAnonymous: false,
    onSend: vi.fn(),
    onDelete: vi.fn(),
    onClose: vi.fn(),
  };

  it('タイトルとKudos一覧が表示される', () => {
    render(<KudosPanel {...defaultProps} />);

    expect(screen.getByText('Kudos')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('Kudosを送るボタンでフォームが表示される', async () => {
    const user = userEvent.setup();
    render(<KudosPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Kudosを送る' }));
    expect(screen.getByLabelText('送信先')).toBeInTheDocument();
  });

  it('閉じるボタンでonCloseが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<KudosPanel {...defaultProps} />);

    await user.click(screen.getByLabelText('パネルを閉じる'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('Kudosが0件の場合は空メッセージが表示される', () => {
    render(<KudosPanel {...defaultProps} kudos={[]} />);

    expect(screen.getByText('まだKudosがありません')).toBeInTheDocument();
  });
});
