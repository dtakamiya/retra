import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BoardView } from './BoardView'
import { useBoardStore } from '../store/boardStore'
import { createBoard, createColumn } from '../test/fixtures'

vi.mock('../store/boardStore')

describe('BoardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when board is null', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: null,
    } as ReturnType<typeof useBoardStore>)

    const { container } = render(<BoardView />)

    expect(container.innerHTML).toBe('')
  })

  it('renders columns when board exists', () => {
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', name: 'Keep', sortOrder: 0 }),
        createColumn({ id: 'col-2', name: 'Problem', sortOrder: 1 }),
        createColumn({ id: 'col-3', name: 'Try', sortOrder: 2 }),
      ],
    })

    vi.mocked(useBoardStore).mockReturnValue({
      board,
    } as ReturnType<typeof useBoardStore>)

    render(<BoardView />)

    expect(screen.getByText('Keep')).toBeInTheDocument()
    expect(screen.getByText('Problem')).toBeInTheDocument()
    expect(screen.getByText('Try')).toBeInTheDocument()
  })
})
