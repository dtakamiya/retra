import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastContainer } from './ToastContainer';
import { useToastStore } from '../store/toastStore';

describe('ToastContainer', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />);
    expect(container.innerHTML).toBe('');
  });

  it('renders a success toast', () => {
    useToastStore.setState({
      toasts: [{ id: '1', type: 'success', message: '操作が成功しました' }],
    });

    render(<ToastContainer />);

    expect(screen.getByText('操作が成功しました')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders an error toast', () => {
    useToastStore.setState({
      toasts: [{ id: '1', type: 'error', message: 'エラーが発生しました' }],
    });

    render(<ToastContainer />);

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
  });

  it('renders an info toast', () => {
    useToastStore.setState({
      toasts: [{ id: '1', type: 'info', message: 'お知らせです' }],
    });

    render(<ToastContainer />);

    expect(screen.getByText('お知らせです')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    useToastStore.setState({
      toasts: [
        { id: '1', type: 'success', message: '成功' },
        { id: '2', type: 'error', message: 'エラー' },
      ],
    });

    render(<ToastContainer />);

    expect(screen.getByText('成功')).toBeInTheDocument();
    expect(screen.getByText('エラー')).toBeInTheDocument();
    expect(screen.getAllByTestId('toast')).toHaveLength(2);
  });

  it('removes toast when close button clicked', async () => {
    const removeToast = vi.fn();
    useToastStore.setState({
      toasts: [{ id: '1', type: 'success', message: 'テスト' }],
      removeToast,
    });

    const user = userEvent.setup();
    render(<ToastContainer />);

    await user.click(screen.getByLabelText('閉じる'));

    expect(removeToast).toHaveBeenCalledWith('1');
  });

  it('has aria-live attribute for accessibility', () => {
    useToastStore.setState({
      toasts: [{ id: '1', type: 'info', message: 'アクセシビリティテスト' }],
    });

    render(<ToastContainer />);

    const container = screen.getByText('アクセシビリティテスト').closest('[aria-live]');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });
});
