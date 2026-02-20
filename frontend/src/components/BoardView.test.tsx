import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { BoardView } from './BoardView'
import { useBoardStore } from '../store/boardStore'
import { api } from '../api/client'
import { createActionItem, createBoard, createCard, createColumn, createParticipant } from '../test/fixtures'
import { capturedDndCallbacks } from '../test/dnd-mocks'

vi.mock('../store/boardStore')
vi.mock('../api/client', () => ({
  api: {
    createCard: vi.fn(),
    addVote: vi.fn(),
    removeVote: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
    moveCard: vi.fn(),
    getBoard: vi.fn(),
    createMemo: vi.fn(),
    getActionItems: vi.fn().mockResolvedValue([]),
    createActionItem: vi.fn(),
    updateActionItem: vi.fn(),
    updateActionItemStatus: vi.fn(),
    deleteActionItem: vi.fn(),
  },
}))
vi.mock('@dnd-kit/core', async () => {
  const { createDndCoreMock } = await import('../test/dnd-mocks')
  return createDndCoreMock()
})
vi.mock('@dnd-kit/sortable', async () => {
  const { createDndSortableMock } = await import('../test/dnd-mocks')
  return createDndSortableMock()
})
vi.mock('@dnd-kit/utilities', async () => {
  const { createDndUtilitiesMock } = await import('../test/dnd-mocks')
  return createDndUtilitiesMock()
})

describe('BoardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when board is null', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: null,
      participant: null,
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
      actionItems: [],
      setActionItems: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const { container } = render(<BoardView />)

    expect(container.innerHTML).toBe('')
  })

  it('renders columns when board exists in WRITING phase (DnD enabled)', () => {
    const board = createBoard({
      phase: 'WRITING',
      columns: [
        createColumn({ id: 'col-1', name: 'Keep', sortOrder: 0 }),
        createColumn({ id: 'col-2', name: 'Problem', sortOrder: 1 }),
        createColumn({ id: 'col-3', name: 'Try', sortOrder: 2 }),
      ],
    })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board,
      participant: createParticipant(),
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
      actionItems: [],
      setActionItems: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<BoardView />)

    expect(screen.getByText('Keep')).toBeInTheDocument()
    expect(screen.getByText('Problem')).toBeInTheDocument()
    expect(screen.getByText('Try')).toBeInTheDocument()
  })

  it('renders columns when board exists in VOTING phase (DnD disabled)', () => {
    const board = createBoard({
      phase: 'VOTING',
      columns: [
        createColumn({ id: 'col-1', name: 'Keep', sortOrder: 0 }),
        createColumn({ id: 'col-2', name: 'Problem', sortOrder: 1 }),
        createColumn({ id: 'col-3', name: 'Try', sortOrder: 2 }),
      ],
    })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board,
      participant: createParticipant(),
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
      actionItems: [],
      setActionItems: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<BoardView />)

    expect(screen.getByText('Keep')).toBeInTheDocument()
    expect(screen.getByText('Problem')).toBeInTheDocument()
    expect(screen.getByText('Try')).toBeInTheDocument()
  })

  it('renders columns in CLOSED phase (DnD disabled)', () => {
    const board = createBoard({
      phase: 'CLOSED',
      columns: [
        createColumn({ id: 'col-1', name: 'Keep', sortOrder: 0 }),
      ],
    })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board,
      participant: createParticipant(),
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
      actionItems: [],
      setActionItems: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<BoardView />)

    expect(screen.getByText('Keep')).toBeInTheDocument()
  })

  it('does not display error banner initially', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard(),
      participant: createParticipant(),
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
      actionItems: [],
      setActionItems: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<BoardView />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('handleDragStart sets active card from DnD event', () => {
    const card = createCard({ id: 'card-1', content: 'Test card' })
    const board = createBoard({
      phase: 'WRITING',
      columns: [
        createColumn({ id: 'col-1', name: 'Keep', color: '#22c55e', cards: [card] }),
      ],
    })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board,
      participant: createParticipant(),
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
      actionItems: [],
      setActionItems: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<BoardView />)

    act(() => {
      capturedDndCallbacks.onDragStart?.({ active: { id: 'card-1' } })
    })

    // DragOverlay renders the card content when activeCard is set
    const cardTexts = screen.getAllByText('Test card')
    expect(cardTexts.length).toBeGreaterThanOrEqual(2) // original + overlay
  })

  it('handleDragEnd calls moveCard API on successful drop to another column', async () => {
    const card = createCard({ id: 'card-1', sortOrder: 0 })
    const board = createBoard({
      phase: 'WRITING',
      columns: [
        createColumn({ id: 'col-1', name: 'Keep', cards: [card] }),
        createColumn({ id: 'col-2', name: 'Problem', cards: [] }),
      ],
    })
    const handleCardMoved = vi.fn()

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board,
      participant: createParticipant({ id: 'p-1' }),
      handleCardMoved,
      setBoard: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    vi.mocked(api.moveCard).mockResolvedValue(undefined)

    render(<BoardView />)

    await act(async () => {
      capturedDndCallbacks.onDragEnd?.({ active: { id: 'card-1' }, over: { id: 'col-2' } })
    })

    expect(handleCardMoved).toHaveBeenCalledWith({
      cardId: 'card-1',
      sourceColumnId: 'col-1',
      targetColumnId: 'col-2',
      sortOrder: 0,
    })
    expect(api.moveCard).toHaveBeenCalledWith('test1234', 'card-1', 'col-2', 0, 'p-1')
  })

  it('handleDragEnd does nothing when over is null', async () => {
    const card = createCard({ id: 'card-1' })
    const board = createBoard({
      phase: 'WRITING',
      columns: [createColumn({ id: 'col-1', cards: [card] })],
    })
    const handleCardMoved = vi.fn()

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board,
      participant: createParticipant(),
      handleCardMoved,
      setBoard: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<BoardView />)

    await act(async () => {
      capturedDndCallbacks.onDragEnd?.({ active: { id: 'card-1' }, over: null })
    })

    expect(handleCardMoved).not.toHaveBeenCalled()
  })

  it('handleDragEnd shows error and refreshes board when moveCard API fails', async () => {
    const card = createCard({ id: 'card-1', sortOrder: 0 })
    const board = createBoard({
      phase: 'WRITING',
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2', cards: [] }),
      ],
    })
    const refreshedBoard = createBoard({ id: 'refreshed' })
    const setBoard = vi.fn()

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board,
      participant: createParticipant({ id: 'p-1' }),
      handleCardMoved: vi.fn(),
      setBoard,
      actionItems: [],
      setActionItems: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    vi.mocked(api.moveCard).mockRejectedValue(new Error('Network error'))
    vi.mocked(api.getBoard).mockResolvedValue(refreshedBoard)

    render(<BoardView />)

    await act(async () => {
      capturedDndCallbacks.onDragEnd?.({ active: { id: 'card-1' }, over: { id: 'col-2' } })
    })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('カードの移動に失敗しました')
    })
    expect(api.getBoard).toHaveBeenCalledWith('test1234')
    expect(setBoard).toHaveBeenCalledWith(refreshedBoard)
  })

  it('handleDragEnd shows error even when board refresh fails', async () => {
    const card = createCard({ id: 'card-1', sortOrder: 0 })
    const board = createBoard({
      phase: 'WRITING',
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2', cards: [] }),
      ],
    })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board,
      participant: createParticipant({ id: 'p-1' }),
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
      actionItems: [],
      setActionItems: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    vi.mocked(api.moveCard).mockRejectedValue(new Error('Network error'))
    vi.mocked(api.getBoard).mockRejectedValue(new Error('Also failed'))

    render(<BoardView />)

    await act(async () => {
      capturedDndCallbacks.onDragEnd?.({ active: { id: 'card-1' }, over: { id: 'col-2' } })
    })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('カードの移動に失敗しました')
    })
  })

  it('handleDragEnd drops card onto another card (reorder within column)', async () => {
    const card1 = createCard({ id: 'card-1', sortOrder: 0 })
    const card2 = createCard({ id: 'card-2', sortOrder: 1 })
    const card3 = createCard({ id: 'card-3', sortOrder: 2 })
    const board = createBoard({
      phase: 'WRITING',
      columns: [
        createColumn({ id: 'col-1', cards: [card1, card2, card3] }),
      ],
    })
    const handleCardMoved = vi.fn()

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board,
      participant: createParticipant({ id: 'p-1' }),
      handleCardMoved,
      setBoard: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    vi.mocked(api.moveCard).mockResolvedValue(undefined)

    render(<BoardView />)

    // card-1(sortOrder=0) を card-3(sortOrder=2) の位置にドロップ
    await act(async () => {
      capturedDndCallbacks.onDragEnd?.({ active: { id: 'card-1' }, over: { id: 'card-3' } })
    })

    // card-1を除外した配列 [card-2, card-3] で card-3 は index 1
    expect(handleCardMoved).toHaveBeenCalledWith({
      cardId: 'card-1',
      sourceColumnId: 'col-1',
      targetColumnId: 'col-1',
      sortOrder: 1,
    })
  })

  it('handleDragEnd skips when card is dropped at same position', async () => {
    const card = createCard({ id: 'card-1', sortOrder: 0 })
    const board = createBoard({
      phase: 'WRITING',
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
      ],
    })
    const handleCardMoved = vi.fn()

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board,
      participant: createParticipant({ id: 'p-1' }),
      handleCardMoved,
      setBoard: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<BoardView />)

    await act(async () => {
      capturedDndCallbacks.onDragEnd?.({ active: { id: 'card-1' }, over: { id: 'col-1' } })
    })

    expect(handleCardMoved).not.toHaveBeenCalled()
  })

  it('shows ActionItemList in ACTION_ITEMS phase', () => {
    const board = createBoard({
      phase: 'ACTION_ITEMS',
      columns: [createColumn({ id: 'col-1', name: 'Keep' })],
    })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board,
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
      actionItems: [createActionItem({ content: 'テストアクション' })],
      setActionItems: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<BoardView />)

    expect(screen.getByText('アクションアイテム')).toBeInTheDocument()
    expect(screen.getByText('テストアクション')).toBeInTheDocument()
  })

  it('shows ActionItemList in CLOSED phase', () => {
    const board = createBoard({
      phase: 'CLOSED',
      columns: [createColumn({ id: 'col-1', name: 'Keep' })],
    })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board,
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
      actionItems: [],
      setActionItems: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<BoardView />)

    expect(screen.getByText('アクションアイテム')).toBeInTheDocument()
  })

  it('does NOT show ActionItemList in WRITING phase', () => {
    const board = createBoard({
      phase: 'WRITING',
      columns: [createColumn({ id: 'col-1', name: 'Keep' })],
    })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board,
      participant: createParticipant(),
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
      actionItems: [],
      setActionItems: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<BoardView />)

    expect(screen.queryByText('アクションアイテム')).not.toBeInTheDocument()
  })

  it('calls api.getActionItems when board slug is available', () => {
    const board = createBoard({ slug: 'test-slug', phase: 'ACTION_ITEMS' })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board,
      participant: createParticipant(),
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
      actionItems: [],
      setActionItems: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<BoardView />)

    expect(api.getActionItems).toHaveBeenCalledWith('test-slug')
  })

  it('renders filter bar', () => {
    const board = createBoard({
      phase: 'WRITING',
      columns: [createColumn({ id: 'col-1', name: 'Keep' })],
    })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board,
      participant: createParticipant(),
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
      actionItems: [],
      setActionItems: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<BoardView />)

    expect(screen.getByLabelText('カード検索')).toBeInTheDocument()
    expect(screen.getByText('投票数順')).toBeInTheDocument()
    expect(screen.getByText('自分のカード')).toBeInTheDocument()
  })

  it('shows undiscussed filter in DISCUSSION phase', () => {
    const board = createBoard({
      phase: 'DISCUSSION',
      columns: [createColumn({ id: 'col-1', name: 'Keep' })],
    })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board,
      participant: createParticipant(),
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
      actionItems: [],
      setActionItems: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<BoardView />)

    expect(screen.getByText('未議論のみ')).toBeInTheDocument()
  })
})
