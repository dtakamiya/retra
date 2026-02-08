import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportMenu } from './ExportMenu';
import { useBoardStore } from '../store/boardStore';
import { api } from '../api/client';

vi.mock('../api/client', () => ({
  api: {
    exportBoard: vi.fn(),
  },
}));

describe('ExportMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  function setupStore(overrides: { isFacilitator?: boolean; hasBoard?: boolean } = {}) {
    const { isFacilitator = true, hasBoard = true } = overrides;
    useBoardStore.setState({
      board: hasBoard
        ? {
            id: 'board-1',
            slug: 'test1234',
            title: 'Test Retro',
            framework: 'KPT',
            phase: 'DISCUSSION',
            maxVotesPerPerson: 5,
            columns: [],
            participants: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }
        : null,
      participant: isFacilitator
        ? { id: 'p-1', nickname: 'Alice', isFacilitator: true, isOnline: true, createdAt: '2024-01-01T00:00:00Z' }
        : { id: 'p-2', nickname: 'Bob', isFacilitator: false, isOnline: true, createdAt: '2024-01-01T00:00:00Z' },
    });
  }

  it('ファシリテーター以外には表示されない', () => {
    setupStore({ isFacilitator: false });
    const { container } = render(<ExportMenu />);
    expect(container.innerHTML).toBe('');
  });

  it('ボードがない場合は表示されない', () => {
    setupStore({ hasBoard: false });
    const { container } = render(<ExportMenu />);
    expect(container.innerHTML).toBe('');
  });

  it('ファシリテーターにはエクスポートボタンが表示される', () => {
    setupStore();
    render(<ExportMenu />);
    expect(screen.getByLabelText('エクスポート')).toBeInTheDocument();
  });

  it('クリックでドロップダウンが開く', () => {
    setupStore();
    render(<ExportMenu />);

    fireEvent.click(screen.getByLabelText('エクスポート'));

    expect(screen.getByText('CSV形式でダウンロード')).toBeInTheDocument();
    expect(screen.getByText('Markdown形式でダウンロード')).toBeInTheDocument();
  });

  it('CSV選択でexportBoardが呼ばれる', async () => {
    setupStore();
    vi.mocked(api.exportBoard).mockResolvedValue(new Blob(['csv-data']));

    render(<ExportMenu />);
    fireEvent.click(screen.getByLabelText('エクスポート'));
    fireEvent.click(screen.getByText('CSV形式でダウンロード'));

    await waitFor(() => {
      expect(api.exportBoard).toHaveBeenCalledWith('test1234', 'p-1', 'CSV');
    });
  });

  it('Markdown選択でexportBoardが呼ばれる', async () => {
    setupStore();
    vi.mocked(api.exportBoard).mockResolvedValue(new Blob(['# markdown']));

    render(<ExportMenu />);
    fireEvent.click(screen.getByLabelText('エクスポート'));
    fireEvent.click(screen.getByText('Markdown形式でダウンロード'));

    await waitFor(() => {
      expect(api.exportBoard).toHaveBeenCalledWith('test1234', 'p-1', 'MARKDOWN');
    });
  });

  it('エクスポート失敗時にエラーメッセージが表示される', async () => {
    setupStore();
    vi.mocked(api.exportBoard).mockRejectedValue(new Error('エクスポートに失敗しました'));

    render(<ExportMenu />);
    fireEvent.click(screen.getByLabelText('エクスポート'));
    fireEvent.click(screen.getByText('CSV形式でダウンロード'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('エクスポートに失敗しました');
    });
  });

  it('エクスポート中はボタンが無効になる', async () => {
    setupStore();
    vi.mocked(api.exportBoard).mockReturnValue(new Promise(() => {}));

    render(<ExportMenu />);
    fireEvent.click(screen.getByLabelText('エクスポート'));
    fireEvent.click(screen.getByText('CSV形式でダウンロード'));

    await waitFor(() => {
      expect(screen.getByLabelText('エクスポート')).toBeDisabled();
      expect(screen.getByText('エクスポート中...')).toBeInTheDocument();
    });
  });
});
