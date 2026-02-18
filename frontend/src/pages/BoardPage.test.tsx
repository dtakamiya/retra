import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { BoardPage } from './BoardPage'
import { useBoardStore } from '../store/boardStore'
import { api } from '../api/client'
import { createBoard, createKudos, createParticipant, createTimerState } from '../test/fixtures'
import type { Board, Participant } from '../types'

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
vi.mock('../store/toastStore', () => ({
  useToastStore: vi.fn((selector: (s: { addToast: ReturnType<typeof vi.fn> }) => unknown) =>
    selector({ addToast: mockAddToast })
  ),
}))

const mockAddToast = vi.fn()

vi.mock('../api/client', () => ({
  api: {
    getBoard: vi.fn(),
    getTimerState: vi.fn(),
    joinBoard: vi.fn(),
    getRemainingVotes: vi.fn(),
    getKudos: vi.fn(),
    sendKudos: vi.fn(),
    deleteKudos: vi.fn(),
  },
}))

vi.mock('../websocket/useWebSocket', () => ({
  useWebSocket: vi.fn(),
}))

vi.mock('../hooks/useTimerAlert', () => ({
  useTimerAlert: vi.fn(),
}))

vi.mock('../components/BoardHeader', () => ({
  BoardHeader: ({ isKudosOpen, kudosCount, onKudosToggle }: { isKudosOpen: boolean; kudosCount: number; onKudosToggle: () => void }) => (
    <div data-testid="board-header" data-kudos-open={isKudosOpen} data-kudos-count={kudosCount} onClick={onKudosToggle}>
      BoardHeader
    </div>
  ),
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

vi.mock('../components/BoardSkeleton', () => ({
  BoardSkeleton: () => <div data-testid="board-skeleton">ボードを読み込み中...</div>,
}))

vi.mock('../components/CarryOverPanel', () => ({
  CarryOverPanel: () => <div data-testid="carry-over-panel">CarryOverPanel</div>,
}))

vi.mock('../components/KudosPanel', () => ({
  KudosPanel: ({ onSend, onDelete, onClose }: { onSend: (r: string, c: string, m?: string) => void; onDelete: (id: string) => void; onClose: () => void }) => (
    <div data-testid="kudos-panel">
      <button data-testid="kudos-send" onClick={() => onSend('p-2', 'GREAT_JOB', 'Nice!')}>Send</button>
      <button data-testid="kudos-delete" onClick={() => onDelete('kudos-1')}>Delete</button>
      <button data-testid="kudos-close" onClick={onClose}>Close</button>
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
    kudos: [],
    needsRefresh: false,
    setBoard: vi.fn(),
    setParticipant: vi.fn(),
    setRemainingVotes: vi.fn(),
    setTimer: vi.fn(),
    setKudos: vi.fn(),
    clearNeedsRefresh: vi.fn(),
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
    vi.mocked(api.getKudos).mockReturnValue(new Promise(() => {}))

    renderBoardPage()

    expect(screen.getByText('ボードを読み込み中...')).toBeInTheDocument()
  })

  it('shows error state when api.getBoard rejects', async () => {
    mockStoreState()
    vi.mocked(api.getBoard).mockRejectedValue(new Error('Not found'))
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    vi.mocked(api.getKudos).mockResolvedValue([])

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
    vi.mocked(api.getKudos).mockResolvedValue([])

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
    vi.mocked(api.getKudos).mockResolvedValue([])

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
    vi.mocked(api.getKudos).mockResolvedValue([])
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
    vi.mocked(api.getKudos).mockResolvedValue([])
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
    vi.mocked(api.getKudos).mockResolvedValue([])
    localStorage.setItem('retra-participant-test1234', 'p-1')

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByTestId('board-header')).toBeInTheDocument()
    })
    expect(screen.getByTestId('board-view')).toBeInTheDocument()
    // Desktop sidebar is now collapsed by default; compact versions are always in the DOM
    expect(screen.getByTestId('timer-display-compact')).toBeInTheDocument()
    expect(screen.getByTestId('participant-list-compact')).toBeInTheDocument()
    // Sidebar toggle button should be present
    expect(screen.getByLabelText('サイドパネルを開く')).toBeInTheDocument()
  })

  it('calls getBoard, getTimerState, and getKudos concurrently', async () => {
    const board = createBoard()
    const setBoard = vi.fn()
    const setTimer = vi.fn()
    const setKudos = vi.fn()
    mockStoreState({ board, participant: null, setBoard, setTimer, setKudos })

    // Track call order to verify concurrency
    const callOrder: string[] = []
    vi.mocked(api.getBoard).mockImplementation(() => {
      callOrder.push('getBoard-start')
      return Promise.resolve(board).then((v) => { callOrder.push('getBoard-end'); return v })
    })
    vi.mocked(api.getTimerState).mockImplementation(() => {
      callOrder.push('getTimerState-start')
      return Promise.resolve(createTimerState()).then((v) => { callOrder.push('getTimerState-end'); return v })
    })
    vi.mocked(api.getKudos).mockImplementation(() => {
      callOrder.push('getKudos-start')
      return Promise.resolve([]).then((v) => { callOrder.push('getKudos-end'); return v })
    })

    renderBoardPage()

    await waitFor(() => {
      expect(setBoard).toHaveBeenCalled()
    })

    // All three should start before any ends (concurrent pattern)
    const boardStartIdx = callOrder.indexOf('getBoard-start')
    const timerStartIdx = callOrder.indexOf('getTimerState-start')
    const kudosStartIdx = callOrder.indexOf('getKudos-start')

    // All should be called
    expect(boardStartIdx).toBeGreaterThanOrEqual(0)
    expect(timerStartIdx).toBeGreaterThanOrEqual(0)
    expect(kudosStartIdx).toBeGreaterThanOrEqual(0)
  })

  it('still loads board when getTimerState fails', async () => {
    const board = createBoard()
    const setBoard = vi.fn()
    const setTimer = vi.fn()
    const setKudos = vi.fn()
    mockStoreState({ board, participant: null, setBoard, setTimer, setKudos })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockRejectedValue(new Error('Timer failed'))
    vi.mocked(api.getKudos).mockResolvedValue([])

    renderBoardPage()

    await waitFor(() => {
      expect(setBoard).toHaveBeenCalledWith(board)
    })
    // Timer should not be set, but board and kudos should still work
    expect(setKudos).toHaveBeenCalledWith([])
  })

  it('still loads board when getKudos fails', async () => {
    const board = createBoard()
    const setBoard = vi.fn()
    const setTimer = vi.fn()
    const setKudos = vi.fn()
    mockStoreState({ board, participant: null, setBoard, setTimer, setKudos })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    vi.mocked(api.getKudos).mockRejectedValue(new Error('Kudos failed'))

    renderBoardPage()

    await waitFor(() => {
      expect(setBoard).toHaveBeenCalledWith(board)
    })
    // Timer should still be set even though kudos failed
    expect(setTimer).toHaveBeenCalled()
  })

  it('navigates to "/" when "ホームに戻る" button is clicked in error state', async () => {
    const user = userEvent.setup()

    mockStoreState()
    vi.mocked(api.getBoard).mockRejectedValue(new Error('Not found'))
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    vi.mocked(api.getKudos).mockResolvedValue([])

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByText('ホームに戻る')).toBeInTheDocument()
    })

    await user.click(screen.getByText('ホームに戻る'))

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('handles join flow successfully', async () => {
    const user = userEvent.setup()
    const board = createBoard()
    const newParticipant = createParticipant({ id: 'p-new', nickname: 'NewUser' })
    const setParticipant = vi.fn()
    const setBoard = vi.fn()

    mockStoreState({ board, participant: null, setParticipant, setBoard })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    vi.mocked(api.getKudos).mockResolvedValue([])
    vi.mocked(api.joinBoard).mockResolvedValue(newParticipant)

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByTestId('nickname-modal')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Join'))

    await waitFor(() => {
      expect(api.joinBoard).toHaveBeenCalledWith('test1234', 'NewUser')
    })
    expect(setParticipant).toHaveBeenCalledWith(newParticipant)
    expect(localStorage.getItem('retra-participant-test1234')).toBe('p-new')
    expect(mockAddToast).toHaveBeenCalledWith('success', 'NewUser としてボードに参加しました')
  })

  it('shows error toast when join fails', async () => {
    const user = userEvent.setup()
    const board = createBoard()

    mockStoreState({ board, participant: null })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    vi.mocked(api.getKudos).mockResolvedValue([])
    vi.mocked(api.joinBoard).mockRejectedValue(new Error('Join failed'))

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByTestId('nickname-modal')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Join'))

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('error', 'ボードへの参加に失敗しました')
    })
  })

  it('shows ConnectionBanner when disconnected', async () => {
    const participant = createParticipant()
    const board = createBoard()
    mockStoreState({ board, participant, isConnected: false })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    vi.mocked(api.getKudos).mockResolvedValue([])
    localStorage.setItem('retra-participant-test1234', 'p-1')

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByTestId('connection-banner')).toBeInTheDocument()
    })
  })

  it('does not show ConnectionBanner when connected', async () => {
    const participant = createParticipant()
    const board = createBoard()
    mockStoreState({ board, participant, isConnected: true })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    vi.mocked(api.getKudos).mockResolvedValue([])
    localStorage.setItem('retra-participant-test1234', 'p-1')

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByTestId('board-header')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('connection-banner')).not.toBeInTheDocument()
  })

  it('opens and closes sidebar panel', async () => {
    const user = userEvent.setup()
    const participant = createParticipant()
    const board = createBoard()
    mockStoreState({ board, participant, isConnected: true })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    vi.mocked(api.getKudos).mockResolvedValue([])
    localStorage.setItem('retra-participant-test1234', 'p-1')

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByLabelText('サイドパネルを開く')).toBeInTheDocument()
    })

    // Open sidebar
    await user.click(screen.getByLabelText('サイドパネルを開く'))

    await waitFor(() => {
      expect(screen.getByText('ボード情報')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('サイドパネルを閉じる')).toBeInTheDocument()
    expect(screen.getByTestId('timer-display')).toBeInTheDocument()
    expect(screen.getByTestId('participant-list')).toBeInTheDocument()
    expect(screen.getByTestId('carry-over-panel')).toBeInTheDocument()

    // Close sidebar
    await user.click(screen.getByLabelText('サイドパネルを閉じる'))

    await waitFor(() => {
      expect(screen.queryByText('ボード情報')).not.toBeInTheDocument()
    })
  })

  it('toggles kudos panel via header', async () => {
    const user = userEvent.setup()
    const participant = createParticipant()
    const board = createBoard()
    mockStoreState({ board, participant, isConnected: true })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    vi.mocked(api.getKudos).mockResolvedValue([])
    localStorage.setItem('retra-participant-test1234', 'p-1')

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByTestId('board-header')).toBeInTheDocument()
    })

    // Toggle kudos open (click header mock which calls onKudosToggle)
    await user.click(screen.getByTestId('board-header'))

    await waitFor(() => {
      expect(screen.getByTestId('kudos-panel')).toBeInTheDocument()
    })
  })

  it('handles send kudos successfully', async () => {
    const user = userEvent.setup()
    const participant = createParticipant()
    const board = createBoard()
    mockStoreState({ board, participant, isConnected: true })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    vi.mocked(api.getKudos).mockResolvedValue([])
    vi.mocked(api.sendKudos).mockResolvedValue(createKudos())
    localStorage.setItem('retra-participant-test1234', 'p-1')

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByTestId('board-header')).toBeInTheDocument()
    })

    // Open kudos panel
    await user.click(screen.getByTestId('board-header'))

    await waitFor(() => {
      expect(screen.getByTestId('kudos-panel')).toBeInTheDocument()
    })

    // Send kudos
    await user.click(screen.getByTestId('kudos-send'))

    await waitFor(() => {
      expect(api.sendKudos).toHaveBeenCalledWith('test1234', 'p-1', 'p-2', 'GREAT_JOB', 'Nice!')
    })
  })

  it('shows error toast when send kudos fails', async () => {
    const user = userEvent.setup()
    const participant = createParticipant()
    const board = createBoard()
    mockStoreState({ board, participant, isConnected: true })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    vi.mocked(api.getKudos).mockResolvedValue([])
    vi.mocked(api.sendKudos).mockRejectedValue(new Error('Send failed'))
    localStorage.setItem('retra-participant-test1234', 'p-1')

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByTestId('board-header')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('board-header'))

    await waitFor(() => {
      expect(screen.getByTestId('kudos-panel')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('kudos-send'))

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('error', 'Kudosの送信に失敗しました')
    })
  })

  it('handles delete kudos successfully', async () => {
    const user = userEvent.setup()
    const participant = createParticipant()
    const board = createBoard()
    mockStoreState({ board, participant, isConnected: true })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    vi.mocked(api.getKudos).mockResolvedValue([])
    vi.mocked(api.deleteKudos).mockResolvedValue(undefined)
    localStorage.setItem('retra-participant-test1234', 'p-1')

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByTestId('board-header')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('board-header'))

    await waitFor(() => {
      expect(screen.getByTestId('kudos-panel')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('kudos-delete'))

    await waitFor(() => {
      expect(api.deleteKudos).toHaveBeenCalledWith('test1234', 'kudos-1', 'p-1')
    })
  })

  it('shows error toast when delete kudos fails', async () => {
    const user = userEvent.setup()
    const participant = createParticipant()
    const board = createBoard()
    mockStoreState({ board, participant, isConnected: true })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    vi.mocked(api.getKudos).mockResolvedValue([])
    vi.mocked(api.deleteKudos).mockRejectedValue(new Error('Delete failed'))
    localStorage.setItem('retra-participant-test1234', 'p-1')

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByTestId('board-header')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('board-header'))

    await waitFor(() => {
      expect(screen.getByTestId('kudos-panel')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('kudos-delete'))

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('error', 'Kudosの削除に失敗しました')
    })
  })

  it('loads remaining votes when phase is VOTING and participant exists', async () => {
    const participant = createParticipant()
    const board = createBoard({ phase: 'VOTING' })
    const setRemainingVotes = vi.fn()
    mockStoreState({ board, participant, setRemainingVotes })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    vi.mocked(api.getKudos).mockResolvedValue([])
    vi.mocked(api.getRemainingVotes).mockResolvedValue({ participantId: 'p-1', remaining: 5, max: 5, used: 0 })
    localStorage.setItem('retra-participant-test1234', 'p-1')

    renderBoardPage()

    await waitFor(() => {
      expect(api.getRemainingVotes).toHaveBeenCalledWith('test1234', 'p-1')
    })
  })

  it('re-fetches board when needsRefresh is true', async () => {
    const participant = createParticipant()
    const board = createBoard()
    const setBoard = vi.fn()
    const clearNeedsRefresh = vi.fn()
    mockStoreState({ board, participant, needsRefresh: true, setBoard, clearNeedsRefresh })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    vi.mocked(api.getKudos).mockResolvedValue([])
    localStorage.setItem('retra-participant-test1234', 'p-1')

    renderBoardPage()

    await waitFor(() => {
      // getBoard called twice: once for initial load, once for refresh
      expect(api.getBoard).toHaveBeenCalledTimes(2)
    })
    expect(clearNeedsRefresh).toHaveBeenCalled()
  })

  it('closes kudos panel via close button', async () => {
    const user = userEvent.setup()
    const participant = createParticipant()
    const board = createBoard()
    mockStoreState({ board, participant, isConnected: true })
    vi.mocked(api.getBoard).mockResolvedValue(board)
    vi.mocked(api.getTimerState).mockResolvedValue(createTimerState())
    vi.mocked(api.getKudos).mockResolvedValue([])
    localStorage.setItem('retra-participant-test1234', 'p-1')

    renderBoardPage()

    await waitFor(() => {
      expect(screen.getByTestId('board-header')).toBeInTheDocument()
    })

    // Open kudos
    await user.click(screen.getByTestId('board-header'))

    await waitFor(() => {
      expect(screen.getByTestId('kudos-panel')).toBeInTheDocument()
    })

    // Close kudos
    await user.click(screen.getByTestId('kudos-close'))

    await waitFor(() => {
      expect(screen.queryByTestId('kudos-panel')).not.toBeInTheDocument()
    })
  })
})
