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

  it('sorts cards by votes in DISCUSSION phase', () => {
    const column = createColumn({
      name: 'Keep',
      cards: [
        createCard({ id: 'c-1', content: 'Low votes', voteCount: 1 }),
        createCard({ id: 'c-2', content: 'High votes', voteCount: 5 }),
        createCard({ id: 'c-3', content: 'Mid votes', voteCount: 3 }),
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
})
