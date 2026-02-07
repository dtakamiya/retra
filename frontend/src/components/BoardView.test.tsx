import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BoardView } from './BoardView'
import { useBoardStore } from '../store/boardStore'
import { createBoard, createColumn, createParticipant } from '../test/fixtures'

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
    vi.mocked(useBoardStore).mockReturnValue({
      board: null,
      participant: null,
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

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

    vi.mocked(useBoardStore).mockReturnValue({
      board,
      participant: createParticipant(),
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

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

    vi.mocked(useBoardStore).mockReturnValue({
      board,
      participant: createParticipant(),
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

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

    vi.mocked(useBoardStore).mockReturnValue({
      board,
      participant: createParticipant(),
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<BoardView />)

    expect(screen.getByText('Keep')).toBeInTheDocument()
  })

  it('does not display error banner initially', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard(),
      participant: createParticipant(),
      handleCardMoved: vi.fn(),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<BoardView />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
