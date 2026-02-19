import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, userEvent } from '../test/test-utils'
import { TeamDashboardPage } from './TeamDashboardPage'
import { api } from '../api/client'
import { createSnapshotSummary, createTrendData, createPagedHistory } from '../test/fixtures'

vi.mock('../api/client', () => ({
  api: {
    getHistory: vi.fn(),
    getTrends: vi.fn(),
    deleteSnapshot: vi.fn(),
  },
}))

vi.mock('../components/TrendChart', () => ({
  TrendChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="trend-chart">TrendChart ({data.length} points)</div>
  ),
}))

describe('TeamDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    vi.mocked(api.getHistory).mockReturnValue(new Promise(() => {}))
    vi.mocked(api.getTrends).mockReturnValue(new Promise(() => {}))

    render(<TeamDashboardPage />)

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('displays page title', async () => {
    vi.mocked(api.getHistory).mockResolvedValue(createPagedHistory())
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [] })

    render(<TeamDashboardPage />)

    expect(screen.getByText('チームダッシュボード')).toBeInTheDocument()
  })

  it('displays home link', async () => {
    vi.mocked(api.getHistory).mockResolvedValue(createPagedHistory())
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [] })

    render(<TeamDashboardPage />)

    const link = screen.getByText('ホームに戻る')
    expect(link.closest('a')).toHaveAttribute('href', '/')
  })

  it('displays history after loading', async () => {
    const history = [
      createSnapshotSummary({ id: 'snap-1', teamName: 'Team Alpha' }),
      createSnapshotSummary({ id: 'snap-2', teamName: 'Team Beta' }),
    ]
    vi.mocked(api.getHistory).mockResolvedValue(createPagedHistory(history, { totalElements: 2 }))
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [] })

    render(<TeamDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument()
    })
    expect(screen.getByText('Team Beta')).toBeInTheDocument()
    expect(screen.getByText('レトロスペクティブ履歴')).toBeInTheDocument()
  })

  it('displays empty history message when no data', async () => {
    vi.mocked(api.getHistory).mockResolvedValue(createPagedHistory())
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [] })

    render(<TeamDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('まだレトロスペクティブの履歴がありません')).toBeInTheDocument()
    })
  })

  it('displays trend chart when more than 1 snapshot', async () => {
    vi.mocked(api.getHistory).mockResolvedValue(createPagedHistory())
    vi.mocked(api.getTrends).mockResolvedValue(createTrendData())

    render(<TeamDashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument()
    })
    expect(screen.getByText('トレンド & エンゲージメント')).toBeInTheDocument()
  })

  it('does not display trend chart when only 1 snapshot', async () => {
    vi.mocked(api.getHistory).mockResolvedValue(createPagedHistory())
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [createTrendData().snapshots[0]] })

    render(<TeamDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('レトロスペクティブ履歴')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('trend-chart')).not.toBeInTheDocument()
  })

  it('searches by team name on form submit', async () => {
    const user = userEvent.setup()
    vi.mocked(api.getHistory).mockResolvedValue(createPagedHistory())
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [] })

    render(<TeamDashboardPage />)

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('チーム名で検索...')
    await user.type(searchInput, 'Team Alpha')

    const searchButton = screen.getByText('検索')
    await user.click(searchButton)

    // Should call API with team name and pagination params
    await waitFor(() => {
      expect(api.getHistory).toHaveBeenCalledWith('Team Alpha', 0, 10)
      expect(api.getTrends).toHaveBeenCalledWith('Team Alpha')
    })
  })

  it('renders search input and button', async () => {
    vi.mocked(api.getHistory).mockResolvedValue(createPagedHistory())
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [] })

    render(<TeamDashboardPage />)

    expect(screen.getByPlaceholderText('チーム名で検索...')).toBeInTheDocument()
    expect(screen.getByText('検索')).toBeInTheDocument()
  })

  it('handles API error gracefully and shows toast notification', async () => {
    const addToast = vi.fn()
    vi.mocked(api.getHistory).mockRejectedValue(new Error('Server error'))
    vi.mocked(api.getTrends).mockRejectedValue(new Error('Server error'))

    // Spy on useToastStore to capture addToast calls
    const { useToastStore } = await import('../store/toastStore')
    const originalImpl = useToastStore.getState().addToast
    useToastStore.setState({ addToast })

    render(<TeamDashboardPage />)

    // Should not crash - loading should end
    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument()
    })

    // Should show error toast
    expect(addToast).toHaveBeenCalledWith('error', 'データの読み込みに失敗しました')

    // Restore original
    useToastStore.setState({ addToast: originalImpl })
  })

  it('displays KPI summary cards from trend data', async () => {
    const trends = createTrendData({
      snapshots: [
        { closedAt: '2024-03-01T10:00:00Z', totalCards: 10, totalVotes: 20, totalParticipants: 5, actionItemsDone: 2, actionItemsTotal: 4, actionItemCompletionRate: 50, cardsPerParticipant: 2.0, votesPerParticipant: 4.0, votesPerCard: 2.0, actionItemRate: 40 },
        { closedAt: '2024-03-15T10:00:00Z', totalCards: 14, totalVotes: 30, totalParticipants: 7, actionItemsDone: 3, actionItemsTotal: 5, actionItemCompletionRate: 60, cardsPerParticipant: 2.0, votesPerParticipant: 4.3, votesPerCard: 2.1, actionItemRate: 36 },
      ],
    })
    vi.mocked(api.getHistory).mockResolvedValue(createPagedHistory([createSnapshotSummary()], { totalElements: 1 }))
    vi.mocked(api.getTrends).mockResolvedValue(trends)

    render(<TeamDashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('kpi-summary')).toBeInTheDocument()
    })
    // Total cards: 10 + 14 = 24
    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('総カード数')).toBeInTheDocument()
    // Total votes: 20 + 30 = 50
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('総投票数')).toBeInTheDocument()
  })

  it('does not display KPI summary when trends is empty', async () => {
    vi.mocked(api.getHistory).mockResolvedValue(createPagedHistory())
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [] })

    render(<TeamDashboardPage />)

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument()
    })
    expect(screen.queryByTestId('kpi-summary')).not.toBeInTheDocument()
  })

  it('displays pagination when there are items', async () => {
    const history = [createSnapshotSummary()]
    vi.mocked(api.getHistory).mockResolvedValue(createPagedHistory(history, { totalElements: 25, totalPages: 3 }))
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [] })

    render(<TeamDashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('total-elements')).toHaveTextContent('全 25 件')
    })
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('1 / 3')
  })

  it('does not display pagination when no items', async () => {
    vi.mocked(api.getHistory).mockResolvedValue(createPagedHistory())
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [] })

    render(<TeamDashboardPage />)

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument()
    })
    expect(screen.queryByTestId('total-elements')).not.toBeInTheDocument()
  })

  it('shows delete confirmation dialog when delete button clicked', async () => {
    const user = userEvent.setup()
    const history = [createSnapshotSummary({ id: 'snap-1' })]
    vi.mocked(api.getHistory).mockResolvedValue(createPagedHistory(history, { totalElements: 1 }))
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [] })

    render(<TeamDashboardPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('スナップショットを削除')).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText('スナップショットを削除'))

    expect(screen.getByText('スナップショットの削除')).toBeInTheDocument()
    expect(screen.getByText('このスナップショットを削除しますか？この操作は取り消せません。')).toBeInTheDocument()
  })

  it('deletes snapshot and reloads on confirm', async () => {
    const user = userEvent.setup()
    const history = [createSnapshotSummary({ id: 'snap-1' })]
    vi.mocked(api.getHistory).mockResolvedValue(createPagedHistory(history, { totalElements: 1 }))
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [] })
    vi.mocked(api.deleteSnapshot).mockResolvedValue(undefined)

    render(<TeamDashboardPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('スナップショットを削除')).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText('スナップショットを削除'))
    await user.click(screen.getByText('削除'))

    await waitFor(() => {
      expect(api.deleteSnapshot).toHaveBeenCalledWith('snap-1')
    })
  })

  it('cancels delete dialog without calling API', async () => {
    const user = userEvent.setup()
    const history = [createSnapshotSummary({ id: 'snap-1' })]
    vi.mocked(api.getHistory).mockResolvedValue(createPagedHistory(history, { totalElements: 1 }))
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [] })

    render(<TeamDashboardPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('スナップショットを削除')).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText('スナップショットを削除'))
    await user.click(screen.getByText('キャンセル'))

    expect(api.deleteSnapshot).not.toHaveBeenCalled()
    expect(screen.queryByText('スナップショットの削除')).not.toBeInTheDocument()
  })
})
