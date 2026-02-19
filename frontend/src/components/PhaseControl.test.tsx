import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PhaseControl } from './PhaseControl'
import { useBoardStore } from '../store/boardStore'
import { createBoard, createParticipant, createColumn, createCard } from '../test/fixtures'
import { api } from '../api/client'

vi.mock('../store/boardStore')
vi.mock('../api/client', () => ({
  api: {
    changePhase: vi.fn(),
  },
}))

describe('PhaseControl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when board or participant is null', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: null,
      participant: null,
      setBoard: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (s: typeof s) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const { container } = render(<PhaseControl />)

    expect(container.innerHTML).toBe('')
  })

  it('renders current phase label', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ isFacilitator: false }),
      setBoard: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (s: typeof s) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<PhaseControl />)

    const labels = screen.getAllByText('記入')
    expect(labels.length).toBeGreaterThanOrEqual(1)
  })

  it('shows advance button for facilitator', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ isFacilitator: true }),
      setBoard: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (s: typeof s) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<PhaseControl />)

    expect(screen.getByRole('button', { name: '次へ: 投票' })).toBeInTheDocument()
  })

  it('does NOT show advance button for non-facilitator', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ isFacilitator: false }),
      setBoard: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (s: typeof s) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<PhaseControl />)

    expect(screen.queryByRole('button', { name: '次へ: 投票' })).not.toBeInTheDocument()
  })

  it('does NOT show advance button when phase is CLOSED', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'CLOSED' }),
      participant: createParticipant({ isFacilitator: true }),
      setBoard: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (s: typeof s) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<PhaseControl />)

    expect(screen.queryByRole('button', { name: /次へ/ })).not.toBeInTheDocument()
  })

  it('opens confirmation dialog when advance button is clicked', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ isFacilitator: true }),
      setBoard: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (s: typeof s) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<PhaseControl />)

    fireEvent.click(screen.getByRole('button', { name: '次へ: 投票' }))

    expect(screen.getByText('フェーズを進めますか？')).toBeInTheDocument()
    expect(screen.getByText('投票へ進む')).toBeInTheDocument()
  })

  it('closes dialog when cancel is clicked', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ isFacilitator: true }),
      setBoard: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (s: typeof s) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<PhaseControl />)

    fireEvent.click(screen.getByRole('button', { name: '次へ: 投票' }))
    expect(screen.getByText('フェーズを進めますか？')).toBeInTheDocument()

    fireEvent.click(screen.getByText('キャンセル'))
    expect(screen.queryByText('フェーズを進めますか？')).not.toBeInTheDocument()
  })

  it('advances phase when confirm is clicked in dialog', async () => {
    const setBoard = vi.fn()
    const updatedBoard = createBoard({ phase: 'VOTING' })
    vi.mocked(api.changePhase).mockResolvedValue(updatedBoard)

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({
        phase: 'WRITING',
        columns: [
          createColumn({ cards: [createCard()] }),
        ],
      }),
      participant: createParticipant({ isFacilitator: true }),
      setBoard,
    };
      return typeof selector === 'function' ? (selector as (s: typeof s) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<PhaseControl />)

    fireEvent.click(screen.getByRole('button', { name: '次へ: 投票' }))
    fireEvent.click(screen.getByText('投票へ進む'))

    await waitFor(() => {
      expect(api.changePhase).toHaveBeenCalledWith('test1234', 'VOTING', 'p-1')
    })

    await waitFor(() => {
      expect(setBoard).toHaveBeenCalledWith(updatedBoard)
    })
  })

  it('shows board stats in the confirmation dialog', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({
        phase: 'WRITING',
        columns: [
          createColumn({ id: 'col-1', cards: [createCard({ id: 'c1', voteCount: 2 }), createCard({ id: 'c2', voteCount: 1 })] }),
          createColumn({ id: 'col-2', cards: [createCard({ id: 'c3' })] }),
          createColumn({ id: 'col-3', cards: [] }),
        ],
      }),
      participant: createParticipant({ isFacilitator: true }),
      setBoard: vi.fn(),
    };
      return typeof selector === 'function' ? (selector as (s: typeof s) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<PhaseControl />)

    fireEvent.click(screen.getByRole('button', { name: '次へ: 投票' }))

    expect(screen.getByText('現在の状況')).toBeInTheDocument()
    expect(screen.getByText('記入フェーズが終了し、新しいカードを追加できなくなります')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
