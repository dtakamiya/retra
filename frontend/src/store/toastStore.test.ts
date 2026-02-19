import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToastStore } from './toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('addToast adds a toast to the list', () => {
    useToastStore.getState().addToast('success', 'テスト成功');

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('テスト成功');
  });

  it('addToast generates unique ids', () => {
    useToastStore.getState().addToast('success', 'メッセージ1');
    useToastStore.getState().addToast('error', 'メッセージ2');

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(2);
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });

  it('addToast auto-removes success/info toast after 4 seconds', () => {
    useToastStore.getState().addToast('info', '一時的なメッセージ');

    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(4000);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('addToast auto-removes error toast after 8 seconds (longer display)', () => {
    useToastStore.getState().addToast('error', 'エラーメッセージ');

    expect(useToastStore.getState().toasts).toHaveLength(1);

    // 4秒後はまだ表示されている
    vi.advanceTimersByTime(4000);
    expect(useToastStore.getState().toasts).toHaveLength(1);

    // 8秒後に消える
    vi.advanceTimersByTime(4000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('removeToast removes a specific toast', () => {
    useToastStore.getState().addToast('success', 'メッセージ1');
    useToastStore.getState().addToast('error', 'メッセージ2');

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(2);

    useToastStore.getState().removeToast(toasts[0].id);

    const remaining = useToastStore.getState().toasts;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].message).toBe('メッセージ2');
  });

  it('supports all toast types', () => {
    useToastStore.getState().addToast('success', '成功');
    useToastStore.getState().addToast('error', 'エラー');
    useToastStore.getState().addToast('info', '情報');

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(3);
    expect(toasts[0].type).toBe('success');
    expect(toasts[1].type).toBe('error');
    expect(toasts[2].type).toBe('info');
  });

  it('removeToast does nothing for non-existent id', () => {
    useToastStore.getState().addToast('success', 'メッセージ');

    useToastStore.getState().removeToast('non-existent');

    expect(useToastStore.getState().toasts).toHaveLength(1);
  });
});
