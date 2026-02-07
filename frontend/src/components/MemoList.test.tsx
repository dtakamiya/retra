import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoList } from './MemoList'
import { useBoardStore } from '../store/boardStore'
import { createBoard, createMemo } from '../test/fixtures'

vi.mock('../store/boardStore')
vi.mock('../api/client', () => ({
  api: {
    createMemo: vi.fn(),
  },
}))

describe('MemoList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when board is null', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: null,
      participant: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    const { container } = render(<MemoList cardId="card-1" memos={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders memo items', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: { id: 'p-1', nickname: 'TestUser', isFacilitator: false, isOnline: true, createdAt: '' },
    } as unknown as ReturnType<typeof useBoardStore>)

    const memos = [
      createMemo({ id: 'memo-1', content: 'メモ1' }),
      createMemo({ id: 'memo-2', content: 'メモ2' }),
    ]
    render(<MemoList cardId="card-1" memos={memos} />)

    expect(screen.getByText('メモ1')).toBeInTheDocument()
    expect(screen.getByText('メモ2')).toBeInTheDocument()
  })

  it('shows MemoForm in DISCUSSION phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: { id: 'p-1', nickname: 'TestUser', isFacilitator: false, isOnline: true, createdAt: '' },
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<MemoList cardId="card-1" memos={[]} />)

    expect(screen.getByPlaceholderText('メモを追加...')).toBeInTheDocument()
  })

  it('shows MemoForm in ACTION_ITEMS phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: { id: 'p-1', nickname: 'TestUser', isFacilitator: false, isOnline: true, createdAt: '' },
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<MemoList cardId="card-1" memos={[]} />)

    expect(screen.getByPlaceholderText('メモを追加...')).toBeInTheDocument()
  })

  it('does NOT show MemoForm in CLOSED phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'CLOSED' }),
      participant: { id: 'p-1', nickname: 'TestUser', isFacilitator: false, isOnline: true, createdAt: '' },
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<MemoList cardId="card-1" memos={[]} />)

    expect(screen.queryByPlaceholderText('メモを追加...')).not.toBeInTheDocument()
  })
})
