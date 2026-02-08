import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ColumnView } from './ColumnView'
import { useBoardStore } from '../store/boardStore'
import { createBoard, createCard, createColumn, createParticipant } from '../test/fixtures'

vi.mock('../store/boardStore')
vi.mock('../api/client', () => ({
  api: {
    createCard: vi.fn(),
    addVote: vi.fn(),
    removeVote: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
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

describe('ColumnView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders column name and card count', () => {
    const column = createColumn({
      name: 'Keep',
      cards: [
        createCard({ id: 'c-1' }),
        createCard({ id: 'c-2' }),
      ],
    })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant(),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<ColumnView column={column} />)

    expect(screen.getByText('Keep')).toBeInTheDocument()
    expect(screen.getByText('(2)')).toBeInTheDocument()
  })

  it('renders column description', () => {
    const column = createColumn({ name: 'Keep' })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant(),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<ColumnView column={column} />)

    expect(screen.getByText('続けたいこと・うまくいっていること')).toBeInTheDocument()
  })

  it('shows add button in WRITING phase', () => {
    const column = createColumn({ name: 'Keep' })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant(),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<ColumnView column={column} />)

    expect(screen.getByTitle('カードを追加')).toBeInTheDocument()
  })

  it('does NOT show add button in non-WRITING phase', () => {
    const column = createColumn({ name: 'Keep' })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'VOTING' }),
      participant: createParticipant(),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<ColumnView column={column} />)

    expect(screen.queryByTitle('カードを追加')).not.toBeInTheDocument()
  })

  it('sorts cards by sortOrder in WRITING phase', () => {
    const column = createColumn({
      name: 'Keep',
      cards: [
        createCard({ id: 'c-1', content: 'Third card', sortOrder: 2 }),
        createCard({ id: 'c-2', content: 'First card', sortOrder: 0 }),
        createCard({ id: 'c-3', content: 'Second card', sortOrder: 1 }),
      ],
    })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant(),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<ColumnView column={column} />)

    const cardContents = screen.getAllByText(/card/)
    expect(cardContents[0]).toHaveTextContent('First card')
    expect(cardContents[1]).toHaveTextContent('Second card')
    expect(cardContents[2]).toHaveTextContent('Third card')
  })

  it('sorts cards by voteCount descending in DISCUSSION phase', () => {
    const column = createColumn({
      name: 'Keep',
      cards: [
        createCard({ id: 'c-1', content: 'Low votes', sortOrder: 0, voteCount: 1 }),
        createCard({ id: 'c-2', content: 'High votes', sortOrder: 1, voteCount: 5 }),
        createCard({ id: 'c-3', content: 'Mid votes', sortOrder: 2, voteCount: 3 }),
      ],
    })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant(),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<ColumnView column={column} />)

    const cardContents = screen.getAllByText(/votes/)
    expect(cardContents[0]).toHaveTextContent('High votes')
    expect(cardContents[1]).toHaveTextContent('Mid votes')
    expect(cardContents[2]).toHaveTextContent('Low votes')
  })

  it('sorts cards by voteCount descending then sortOrder ascending when tied', () => {
    const column = createColumn({
      name: 'Keep',
      cards: [
        createCard({ id: 'c-1', content: 'Second tied', sortOrder: 1, voteCount: 3 }),
        createCard({ id: 'c-2', content: 'First tied', sortOrder: 0, voteCount: 3 }),
        createCard({ id: 'c-3', content: 'Top card', sortOrder: 2, voteCount: 5 }),
      ],
    })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant(),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<ColumnView column={column} />)

    const cardContents = screen.getAllByText(/tied|Top/)
    expect(cardContents[0]).toHaveTextContent('Top card')
    expect(cardContents[1]).toHaveTextContent('First tied')
    expect(cardContents[2]).toHaveTextContent('Second tied')
  })
})
