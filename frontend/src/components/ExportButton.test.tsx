import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportButton } from './ExportButton';
import { useBoardStore } from '../store/boardStore';
import { createBoard } from '../test/fixtures';
import * as exportMarkdown from '../utils/exportMarkdown';

vi.mock('../store/boardStore');
vi.mock('../utils/exportMarkdown', () => ({
  downloadMarkdown: vi.fn(),
  copyMarkdownToClipboard: vi.fn().mockResolvedValue(undefined),
}));

describe('ExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ボードがnullの場合は何も表示しない', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: null,
    } as unknown as ReturnType<typeof useBoardStore>);

    const { container } = render(<ExportButton />);
    expect(container.innerHTML).toBe('');
  });

  it('エクスポートボタンが表示される', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard(),
    } as unknown as ReturnType<typeof useBoardStore>);

    render(<ExportButton />);
    expect(screen.getByText('エクスポート')).toBeInTheDocument();
  });

  it('クリックするとドロップダウンメニューが表示される', async () => {
    const user = userEvent.setup();
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard(),
    } as unknown as ReturnType<typeof useBoardStore>);

    render(<ExportButton />);
    await user.click(screen.getByText('エクスポート'));

    expect(screen.getByText('Markdownをダウンロード')).toBeInTheDocument();
    expect(screen.getByText('クリップボードにコピー')).toBeInTheDocument();
  });

  it('ダウンロードボタンをクリックするとdownloadMarkdownが呼ばれる', async () => {
    const user = userEvent.setup();
    const board = createBoard();
    vi.mocked(useBoardStore).mockReturnValue({
      board,
    } as unknown as ReturnType<typeof useBoardStore>);

    render(<ExportButton />);
    await user.click(screen.getByText('エクスポート'));
    await user.click(screen.getByText('Markdownをダウンロード'));

    expect(exportMarkdown.downloadMarkdown).toHaveBeenCalledWith(board);
  });

  it('コピーボタンをクリックするとcopyMarkdownToClipboardが呼ばれコピー済み表示になる', async () => {
    const user = userEvent.setup();
    const board = createBoard();
    vi.mocked(useBoardStore).mockReturnValue({
      board,
    } as unknown as ReturnType<typeof useBoardStore>);

    render(<ExportButton />);
    await user.click(screen.getByText('エクスポート'));
    await user.click(screen.getByText('クリップボードにコピー'));

    expect(exportMarkdown.copyMarkdownToClipboard).toHaveBeenCalledWith(board);

    await waitFor(() => {
      expect(screen.getByText('コピー済み')).toBeInTheDocument();
    });
  });

  it('メニュー外をクリックするとメニューが閉じる', async () => {
    const user = userEvent.setup();
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard(),
    } as unknown as ReturnType<typeof useBoardStore>);

    render(<ExportButton />);
    await user.click(screen.getByText('エクスポート'));
    expect(screen.getByText('Markdownをダウンロード')).toBeInTheDocument();

    await user.click(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Markdownをダウンロード')).not.toBeInTheDocument();
    });
  });
});
