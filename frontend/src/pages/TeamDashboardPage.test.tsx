import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, userEvent } from '../test/test-utils'
import { TeamDashboardPage } from './TeamDashboardPage'
import { api } from '../api/client'
import { createSnapshotSummary, createTrendData } from '../test/fixtures'

vi.mock('../api/client', () => ({
  api: {
    getHistory: vi.fn(),
    getTrends: vi.fn(),
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
    vi.mocked(api.getHistory).mockResolvedValue([])
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [] })

    render(<TeamDashboardPage />)

    expect(screen.getByText('チームダッシュボード')).toBeInTheDocument()
  })

  it('displays home link', async () => {
    vi.mocked(api.getHistory).mockResolvedValue([])
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
    vi.mocked(api.getHistory).mockResolvedValue(history)
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [] })

    render(<TeamDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument()
    })
    expect(screen.getByText('Team Beta')).toBeInTheDocument()
    expect(screen.getByText('レトロスペクティブ履歴')).toBeInTheDocument()
  })

  it('displays empty history message when no data', async () => {
    vi.mocked(api.getHistory).mockResolvedValue([])
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [] })

    render(<TeamDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('まだレトロスペクティブの履歴がありません')).toBeInTheDocument()
    })
  })

  it('displays trend chart when more than 1 snapshot', async () => {
    vi.mocked(api.getHistory).mockResolvedValue([])
    vi.mocked(api.getTrends).mockResolvedValue(createTrendData())

    render(<TeamDashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument()
    })
    expect(screen.getByText('トレンド')).toBeInTheDocument()
  })

  it('does not display trend chart when only 1 snapshot', async () => {
    vi.mocked(api.getHistory).mockResolvedValue([])
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [createTrendData().snapshots[0]] })

    render(<TeamDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('レトロスペクティブ履歴')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('trend-chart')).not.toBeInTheDocument()
  })

  it('searches by team name on form submit', async () => {
    const user = userEvent.setup()
    vi.mocked(api.getHistory).mockResolvedValue([])
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [] })

    render(<TeamDashboardPage />)

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('チーム名で検索...')
    await user.type(searchInput, 'Team Alpha')

    const searchButton = screen.getByText('検索')
    await user.click(searchButton)

    // Should call API with team name
    await waitFor(() => {
      expect(api.getHistory).toHaveBeenCalledWith('Team Alpha')
      expect(api.getTrends).toHaveBeenCalledWith('Team Alpha')
    })
  })

  it('renders search input and button', async () => {
    vi.mocked(api.getHistory).mockResolvedValue([])
    vi.mocked(api.getTrends).mockResolvedValue({ snapshots: [] })

    render(<TeamDashboardPage />)

    expect(screen.getByPlaceholderText('チーム名で検索...')).toBeInTheDocument()
    expect(screen.getByText('検索')).toBeInTheDocument()
  })

  it('handles API error gracefully', async () => {
    vi.mocked(api.getHistory).mockRejectedValue(new Error('Server error'))
    vi.mocked(api.getTrends).mockRejectedValue(new Error('Server error'))

    render(<TeamDashboardPage />)

    // Should not crash - loading should end
    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument()
    })
  })
})
