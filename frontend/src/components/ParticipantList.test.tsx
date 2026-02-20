import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ParticipantList } from './ParticipantList'
import { useBoardStore } from '../store/boardStore'
import { createBoard, createParticipant, createRemainingVotes } from '../test/fixtures'

vi.mock('../store/boardStore')

describe('ParticipantList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when board is null', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: null,
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const { container } = render(<ParticipantList />)

    expect(container.innerHTML).toBe('')
  })

  it('renders participants with nicknames', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({
        participants: [
          createParticipant({ id: 'p-1', nickname: '太郎', isFacilitator: true }),
          createParticipant({ id: 'p-2', nickname: '花子', isFacilitator: false }),
        ],
      }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<ParticipantList />)

    expect(screen.getByText('太郎')).toBeInTheDocument()
    expect(screen.getByText('花子')).toBeInTheDocument()
  })

  it('shows facilitator badge', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({
        participants: [
          createParticipant({ id: 'p-1', nickname: '太郎', isFacilitator: true }),
        ],
      }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<ParticipantList />)

    expect(screen.getByText('ファシリテーター')).toBeInTheDocument()
  })

  it('shows remaining votes in VOTING phase', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({
        phase: 'VOTING',
        participants: [
          createParticipant({ id: 'p-1', nickname: '太郎' }),
        ],
      }),
      remainingVotes: createRemainingVotes({ remaining: 3, max: 5, used: 2 }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<ParticipantList />)

    expect(screen.getByText('残り 3票')).toBeInTheDocument()
  })

  it('compact mode shows participant avatars', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({
        participants: [
          createParticipant({ id: 'p-1', nickname: 'Alice' }),
          createParticipant({ id: 'p-2', nickname: 'Bob', isFacilitator: false }),
        ],
      }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<ParticipantList compact />)

    // In compact mode, avatars show first letter uppercased
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })
})
