import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhaseControl } from './PhaseControl'
import { useBoardStore } from '../store/boardStore'
import { createBoard, createParticipant } from '../test/fixtures'

vi.mock('../store/boardStore')

describe('PhaseControl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when board or participant is null', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: null,
      participant: null,
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    const { container } = render(<PhaseControl />)

    expect(container.innerHTML).toBe('')
  })

  it('renders current phase label', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ isFacilitator: false }),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<PhaseControl />)

    const labels = screen.getAllByText('記入')
    expect(labels.length).toBeGreaterThanOrEqual(1)
  })

  it('shows advance button for facilitator', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ isFacilitator: true }),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<PhaseControl />)

    expect(screen.getByRole('button', { name: '次へ: 投票' })).toBeInTheDocument()
  })

  it('does NOT show advance button for non-facilitator', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ isFacilitator: false }),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<PhaseControl />)

    expect(screen.queryByRole('button', { name: '次へ: 投票' })).not.toBeInTheDocument()
  })

  it('does NOT show advance button when phase is CLOSED', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'CLOSED' }),
      participant: createParticipant({ isFacilitator: true }),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<PhaseControl />)

    expect(screen.queryByRole('button', { name: /次へ/ })).not.toBeInTheDocument()
  })
})
