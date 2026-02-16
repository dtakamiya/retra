import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { KudosCard } from './KudosCard';
import { createKudos } from '../test/fixtures';

describe('KudosCard', () => {
  it('Kudosの情報が表示される', () => {
    const kudos = createKudos({
      senderNickname: 'Alice',
      receiverNickname: 'Bob',
      category: 'GREAT_JOB',
      message: '素晴らしい仕事!',
    });

    render(<KudosCard kudos={kudos} currentParticipantId="other" isAnonymous={false} onDelete={vi.fn()} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('🌟')).toBeInTheDocument();
    expect(screen.getByText('素晴らしい仕事!')).toBeInTheDocument();
  });

  it('自分が送ったKudosには削除ボタンが表示される', () => {
    const kudos = createKudos({ senderId: 'p-1' });

    render(<KudosCard kudos={kudos} currentParticipantId="p-1" isAnonymous={false} onDelete={vi.fn()} />);

    expect(screen.getByLabelText('Kudosを削除')).toBeInTheDocument();
  });

  it('他人のKudosには削除ボタンが表示されない', () => {
    const kudos = createKudos({ senderId: 'p-1' });

    render(<KudosCard kudos={kudos} currentParticipantId="p-2" isAnonymous={false} onDelete={vi.fn()} />);

    expect(screen.queryByLabelText('Kudosを削除')).not.toBeInTheDocument();
  });

  it('削除ボタンクリックでonDeleteが呼ばれる', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const kudos = createKudos({ id: 'k-1', senderId: 'p-1' });

    render(<KudosCard kudos={kudos} currentParticipantId="p-1" isAnonymous={false} onDelete={onDelete} />);

    await user.click(screen.getByLabelText('Kudosを削除'));
    expect(onDelete).toHaveBeenCalledWith('k-1');
  });

  it('匿名ボードでは送信者が「誰かさん」と表示される', () => {
    const kudos = createKudos({
      senderId: 'other',
      senderNickname: 'Alice',
      receiverNickname: 'Bob',
    });

    render(<KudosCard kudos={kudos} currentParticipantId="p-1" isAnonymous={true} onDelete={vi.fn()} />);

    expect(screen.getByText('誰かさん')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('匿名ボードでも自分が送ったKudosは名前が表示される', () => {
    const kudos = createKudos({
      senderId: 'p-1',
      senderNickname: 'Alice',
    });

    render(<KudosCard kudos={kudos} currentParticipantId="p-1" isAnonymous={true} onDelete={vi.fn()} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
