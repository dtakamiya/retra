import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { KudosSendForm } from './KudosSendForm';
import { createParticipant } from '../test/fixtures';

describe('KudosSendForm', () => {
  const participants = [
    createParticipant({ id: 'p-1', nickname: 'Alice' }),
    createParticipant({ id: 'p-2', nickname: 'Bob', isFacilitator: false }),
    createParticipant({ id: 'p-3', nickname: 'Charlie', isFacilitator: false }),
  ];
  const currentParticipantId = 'p-1';
  const onSend = vi.fn();
  const onCancel = vi.fn();

  it('受信者セレクト・カテゴリボタン・送信ボタンが表示される', () => {
    render(
      <KudosSendForm
        participants={participants}
        currentParticipantId={currentParticipantId}
        onSend={onSend}
        onCancel={onCancel}
      />
    );

    expect(screen.getByLabelText('送信先')).toBeInTheDocument();
    expect(screen.getByText('🌟')).toBeInTheDocument();
    expect(screen.getByText('🙏')).toBeInTheDocument();
    expect(screen.getByText('💡')).toBeInTheDocument();
    expect(screen.getByText('🤝')).toBeInTheDocument();
    expect(screen.getByText('🎨')).toBeInTheDocument();
    expect(screen.getByText('💪')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '送信' })).toBeInTheDocument();
  });

  it('自分自身はドロップダウンに表示されない', () => {
    render(
      <KudosSendForm
        participants={participants}
        currentParticipantId={currentParticipantId}
        onSend={onSend}
        onCancel={onCancel}
      />
    );

    const options = screen.getAllByRole('option');
    const optionTexts = options.map(o => o.textContent);
    expect(optionTexts).not.toContain('Alice');
    expect(optionTexts).toContain('Bob');
    expect(optionTexts).toContain('Charlie');
  });

  it('受信者とカテゴリを選んで送信できる', async () => {
    const user = userEvent.setup();
    render(
      <KudosSendForm
        participants={participants}
        currentParticipantId={currentParticipantId}
        onSend={onSend}
        onCancel={onCancel}
      />
    );

    await user.selectOptions(screen.getByLabelText('送信先'), 'p-2');
    await user.click(screen.getByText('🙏'));
    await user.click(screen.getByRole('button', { name: '送信' }));

    expect(onSend).toHaveBeenCalledWith('p-2', 'THANK_YOU', undefined);
  });

  it('メッセージ付きで送信できる', async () => {
    const user = userEvent.setup();
    render(
      <KudosSendForm
        participants={participants}
        currentParticipantId={currentParticipantId}
        onSend={onSend}
        onCancel={onCancel}
      />
    );

    await user.selectOptions(screen.getByLabelText('送信先'), 'p-3');
    await user.click(screen.getByText('💡'));
    await user.type(screen.getByPlaceholderText('メッセージ(任意)'), 'ありがとう!');
    await user.click(screen.getByRole('button', { name: '送信' }));

    expect(onSend).toHaveBeenCalledWith('p-3', 'INSPIRING', 'ありがとう!');
  });

  it('受信者未選択の場合は送信ボタンが無効', () => {
    render(
      <KudosSendForm
        participants={participants}
        currentParticipantId={currentParticipantId}
        onSend={onSend}
        onCancel={onCancel}
      />
    );

    expect(screen.getByRole('button', { name: '送信' })).toBeDisabled();
  });

  it('カテゴリグループにrole="group"とaria-labelledbyがある', () => {
    render(
      <KudosSendForm
        participants={participants}
        currentParticipantId={currentParticipantId}
        onSend={onSend}
        onCancel={onCancel}
      />
    );

    const group = screen.getByRole('group', { name: 'カテゴリ' });
    expect(group).toBeInTheDocument();
  });

  it('メッセージtextareaにaria-labelがある', () => {
    render(
      <KudosSendForm
        participants={participants}
        currentParticipantId={currentParticipantId}
        onSend={onSend}
        onCancel={onCancel}
      />
    );

    expect(screen.getByLabelText('メッセージ（任意）')).toBeInTheDocument();
  });

  it('キャンセルボタンでonCancelが呼ばれる', async () => {
    const user = userEvent.setup();
    render(
      <KudosSendForm
        participants={participants}
        currentParticipantId={currentParticipantId}
        onSend={onSend}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
