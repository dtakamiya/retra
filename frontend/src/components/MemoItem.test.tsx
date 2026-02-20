import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoItem } from './MemoItem'
import { useBoardStore } from '../store/boardStore'
import { api } from '../api/client'
import { createBoard, createMemo, createParticipant } from '../test/fixtures'

vi.mock('../store/boardStore')
vi.mock('../api/client', () => ({
  api: {
    updateMemo: vi.fn(),
    deleteMemo: vi.fn(),
  },
}))

describe('MemoItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when board or participant is null', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: null,
      participant: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const memo = createMemo()
    const { container } = render(<MemoItem memo={memo} cardId="card-1" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders memo content and author', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const memo = createMemo({ content: 'メモの内容', authorNickname: 'Alice' })
    render(<MemoItem memo={memo} cardId="card-1" />)

    expect(screen.getByText('メモの内容')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('shows edit and delete buttons for author in DISCUSSION phase', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const memo = createMemo({ participantId: 'p-1' })
    render(<MemoItem memo={memo} cardId="card-1" />)

    expect(screen.getByLabelText('メモを編集')).toBeInTheDocument()
    expect(screen.getByLabelText('メモを削除')).toBeInTheDocument()
  })

  it('shows only delete button for facilitator who is not author', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-2', isFacilitator: true }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const memo = createMemo({ participantId: 'p-1' })
    render(<MemoItem memo={memo} cardId="card-1" />)

    expect(screen.queryByLabelText('メモを編集')).not.toBeInTheDocument()
    expect(screen.getByLabelText('メモを削除')).toBeInTheDocument()
  })

  it('does NOT show edit/delete buttons in CLOSED phase', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'CLOSED' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const memo = createMemo({ participantId: 'p-1' })
    render(<MemoItem memo={memo} cardId="card-1" />)

    expect(screen.queryByLabelText('メモを編集')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('メモを削除')).not.toBeInTheDocument()
  })

  it('clicking edit shows textarea with current content', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const memo = createMemo({ content: '編集テスト', participantId: 'p-1' })
    render(<MemoItem memo={memo} cardId="card-1" />)

    await user.click(screen.getByLabelText('メモを編集'))

    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('編集テスト')
  })

  it('saving edit calls api.updateMemo', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ slug: 'test-slug', phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)
    vi.mocked(api.updateMemo).mockResolvedValue(createMemo({ content: '更新内容' }))

    const memo = createMemo({ id: 'memo-1', content: '元の内容', participantId: 'p-1' })
    render(<MemoItem memo={memo} cardId="card-1" />)

    await user.click(screen.getByLabelText('メモを編集'))
    const textarea = screen.getByRole('textbox')
    await user.clear(textarea)
    await user.type(textarea, '更新内容')
    await user.click(screen.getByLabelText('保存'))

    expect(api.updateMemo).toHaveBeenCalledWith('test-slug', 'card-1', 'memo-1', '更新内容', 'p-1')
  })

  it('clicking delete calls api.deleteMemo', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ slug: 'test-slug', phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)
    vi.mocked(api.deleteMemo).mockResolvedValue(undefined)

    const memo = createMemo({ id: 'memo-1', participantId: 'p-1' })
    render(<MemoItem memo={memo} cardId="card-1" />)

    await user.click(screen.getByLabelText('メモを削除'))

    expect(api.deleteMemo).toHaveBeenCalledWith('test-slug', 'card-1', 'memo-1', 'p-1')
  })

  it('pressing Escape cancels editing', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const memo = createMemo({ content: 'Escテスト', participantId: 'p-1' })
    render(<MemoItem memo={memo} cardId="card-1" />)

    await user.click(screen.getByLabelText('メモを編集'))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText('Escテスト')).toBeInTheDocument()
  })
})
