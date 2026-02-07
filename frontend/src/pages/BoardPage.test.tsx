import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { BoardPage } from './BoardPage'
import { useBoardStore } from '../store/boardStore'
import { api } from '../api/client'
import { createBoard, createParticipant, createTimerState } from '../test/fixtures'
import type { Board, Participant, TimerState } from '../types'

// --- Mocks ---

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(() => mockNavigate),
  }
})

vi.mock('../store/boardStore')
vi.mock('../api/client', () => ({
  api: {
    getBoard: vi.fn(),
    getTimerState: vi.fn(),
    joinBoard: vi.fn(),
    getRemainingVotes: vi.fn(),
  },
}))

vi.mock('../websocket/useWebSocket', () => ({
  useWebSocket: vi.fn(),
}))

vi.mock('../hooks/useTimerAlert', () => ({
  useTimerAlert: vi.fn(),
}))

vi.mock('../components/BoardHeader', () => ({
  BoardHeader: () => <div data-testid="board-header">BoardHeader</div>,
}))

vi.mock('../components/BoardView', () => ({
  BoardView: () => <div data-testid="board-view">BoardView</div>,
}))

vi.mock('../components/ParticipantList', () => ({
  ParticipantList: ({ compact }: { compact?: boolean }) => (
    <div data-testid={compact ? 'participant-list-compact' : 'participant-list'}>ParticipantList</div>
  ),
}))

vi.mock('../components/TimerDisplay', () => ({
  TimerDisplay: ({ compact }: { compact?: boolean }) => (
    <div data-testid={compact ? 'timer-display-compact' : 'timer-display'}>TimerDisplay</div>
  ),
}))

vi.mock('../components/ConnectionBanner', () => ({
  ConnectionBanner: () => <div data-testid="connection-banner">ConnectionBanner</div>,
}))

vi.mock('../components/NicknameModal', () => ({
  NicknameModal: ({ onJoin, boardTitle }: { onJoin: (n: string) => void; boardTitle: string }) => (
    <div data-testid="nickname-modal">
      <span>{boardTitle}</span>
      <button onClick={() => onJoin('NewUser')}>Join</button>
    </div>
  ),
}))

// --- Helpers ---

function renderBoardPage() {
  return render(
    <MemoryRouter initialEntries={['/board/test1234']}>
      <Routes>
        <Route path="/board/:slug" element={<BoardPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function mockStoreState(overrides: Partial<ReturnType<typeof useBoardStore>> = {}) {
  const defaults = {
    board: null as Board | null,
    participant: null as Participant | null,
    isConnected: true,
    setBoard: vi.fn(),
    setParticipant: vi.fn(),
    setRemainingVotes: vi.fn(),
    setTimer: vi.fn(),
  }
  vi.mocked(useBoardStore).mockReturnValue({
    ...defaults,
    ...overrides,
  } as unknown as ReturnType<typeof useBoardStore>)
}

// --- Tests ---

describe('BoardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows loading state initially', () => {
    mockStoreState()
    // Make api.getBoard return a pending promise so loading stays true
    vi.mocked(api.getBoard).mockReturnValue(new Promise(() => {}))
    vi.mocked(api.getTimerState).mockReturnValue(new Promise(() => {}))

    renderBoardPage()

    expect(screen.getByText('ボードを読み込み中...')).toBeInTheDocument()
  })

  it('shows error state when api.getBoard rejects', async () => {
    mockStoreState()
    vi.mocked(api.getBoard).mockRejectedValue(new Error('Not found'))
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByText('ボードが見つかりません')).toBeInTheDocument()
    })
    expect(screen.getByText('ホームに戻る')).toBeInTheDocument()
  })

  it('shows error state when board is null after loading completes', async () => {
    // Board stays null in store even after loadBoard runs (store not updated)
    mockStoreState({ board: null })
    const board = createBoard()
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())

    renderBoardPage()

    // After loading, board is still null in the store mock, so error view appears
    await waitFor(() => {
      expect(screen.getByText('ボードが見つかりません')).toBeInTheDocument()
    })
  })

  it('shows NicknameModal when no saved participant in localStorage', async () => {
    const board = createBoard()
    // After loadBoard completes, the component will call setBoard, but our mock still returns null board.
    // We need the store to reflect the "board loaded, no participant" state.
    mockStoreState({ board, participant: null })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByTestId('nickname-modal')).toBeInTheDocument()
    })
  })

  it('restores participant from localStorage when it exists in board.participants', async () => {
    const participant = createParticipant({ id: 'p-1' })
    const board = createBoard({ participants: [participant] })
    const setParticipant = vi.fn()

    mockStoreState({ board, participant, setParticipant })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    localStorage.setItem('retra-participant-test1234', 'p-1')

    renderBoardPage()

    await waitFor(() => {
      expect(setParticipant).toHaveBeenCalledWith(participant)
    })
  })

  it('shows NicknameModal when saved participant ID is not in board.participants', async () => {
    const board = createBoard({ participants: [createParticipant({ id: 'p-1' })] })
    mockStoreState({ board, participant: null })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    localStorage.setItem('retra-participant-test1234', 'p-nonexistent')

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByTestId('nickname-modal')).toBeInTheDocument()
    })
    // Stale ID should be removed
    expect(localStorage.getItem('retra-participant-test1234')).toBeNull()
  })

  it('shows board content when board and participant are set', async () => {
    const participant = createParticipant()
    const board = createBoard()
    mockStoreState({ board, participant, isConnected: true })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    localStorage.setItem('retra-participant-test1234', 'p-1')

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByTestId('board-header')).toBeInTheDocument()
    })
    expect(screen.getByTestId('board-view')).toBeInTheDocument()
    expect(screen.getByTestId('timer-display')).toBeInTheDocument()
    expect(screen.getByTestId('participant-list')).toBeInTheDocument()
  })

  it('navigates to "/" when "ホームに戻る" button is clicked in error state', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    mockStoreState()
    vi.mocked(api.getBoard).mockRejectedValue(new Error('Not found'))
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByText('ホームに戻る')).toBeInTheDocument()
    })

    await user.click(screen.getByText('ホームに戻る'))

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
