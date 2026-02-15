import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { TrendChart } from './TrendChart'
import { createTrendPoint } from '../test/fixtures'

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: ({ name }: { name: string }) => <div data-testid="line">{name}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
}))

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('lucide-react')
  return {
    ...actual,
    TrendingUp: () => <span data-testid="trending-up" />,
    TrendingDown: () => <span data-testid="trending-down" />,
    Minus: () => <span data-testid="minus" />,
    FileText: () => <span data-testid="icon-file-text" />,
    Vote: () => <span data-testid="icon-vote" />,
    Users: () => <span data-testid="icon-users" />,
    CheckCircle: () => <span data-testid="icon-check-circle" />,
  }
})

describe('TrendChart', () => {
  it('renders without crashing', () => {
    const data = [
      createTrendPoint({ closedAt: '2024-03-01T10:00:00Z' }),
      createTrendPoint({ closedAt: '2024-03-15T10:00:00Z' }),
    ]
    const { container } = render(<TrendChart data={data} />)

    expect(container).toBeTruthy()
  })

  it('renders ResponsiveContainers', () => {
    const data = [createTrendPoint()]
    const { getAllByTestId } = render(<TrendChart data={data} />)

    expect(getAllByTestId('responsive-container')).toHaveLength(2)
  })

  it('renders LineCharts', () => {
    const data = [createTrendPoint()]
    const { getAllByTestId } = render(<TrendChart data={data} />)

    expect(getAllByTestId('line-chart')).toHaveLength(2)
  })

  it('renders seven lines for all metrics', () => {
    const data = [createTrendPoint()]
    const { getAllByTestId } = render(<TrendChart data={data} />)

    const lines = getAllByTestId('line')
    expect(lines).toHaveLength(7)
  })

  it('renders correct line names', () => {
    const data = [createTrendPoint()]
    const { getAllByText, getByText } = render(<TrendChart data={data} />)

    // カード数・投票数はサマリーカードとチャートラインの両方に存在する
    expect(getAllByText('カード数').length).toBeGreaterThanOrEqual(1)
    expect(getAllByText('投票数').length).toBeGreaterThanOrEqual(1)
    expect(getByText('AI完了率(%)')).toBeInTheDocument()
  })

  it('renders engagement chart section', () => {
    const data = [createTrendPoint()]
    const { getAllByTestId } = render(<TrendChart data={data} />)

    // 2つのチャート（基本トレンド + エンゲージメント）
    const charts = getAllByTestId('line-chart')
    expect(charts).toHaveLength(2)
  })

  it('renders engagement metric line names', () => {
    const data = [createTrendPoint()]
    const { getByText } = render(<TrendChart data={data} />)

    expect(getByText('カード数/人')).toBeInTheDocument()
    expect(getByText('投票数/人')).toBeInTheDocument()
    expect(getByText('投票数/カード')).toBeInTheDocument()
    expect(getByText('アクション化率(%)')).toBeInTheDocument()
  })

  it('renders section headings', () => {
    const data = [createTrendPoint()]
    const { getByText } = render(<TrendChart data={data} />)

    expect(getByText('基本トレンド')).toBeInTheDocument()
    expect(getByText('エンゲージメント')).toBeInTheDocument()
  })

  // サマリーカード関連のテスト
  it('renders trend summary section', () => {
    const data = [createTrendPoint()]
    const { getByTestId } = render(<TrendChart data={data} />)

    expect(getByTestId('trend-summary')).toBeInTheDocument()
  })

  it('renders four summary cards with latest metric values', () => {
    const data = [createTrendPoint({ totalCards: 15, totalVotes: 40, totalParticipants: 6, actionItemCompletionRate: 75 })]
    const { getByTestId } = render(<TrendChart data={data} />)

    const summary = getByTestId('trend-summary')
    expect(summary.children).toHaveLength(4)
    expect(summary.textContent).toContain('15')
    expect(summary.textContent).toContain('40')
    expect(summary.textContent).toContain('6')
    expect(summary.textContent).toContain('75')
  })

  it('shows "初回" indicator when only one data point', () => {
    const data = [createTrendPoint()]
    const { getAllByText } = render(<TrendChart data={data} />)

    const initLabels = getAllByText(/初回/)
    expect(initLabels.length).toBe(4)
  })

  it('shows positive trend indicator when metrics increase', () => {
    const data = [
      createTrendPoint({ closedAt: '2024-03-01T10:00:00Z', totalCards: 10, totalVotes: 20, totalParticipants: 5, actionItemCompletionRate: 40 }),
      createTrendPoint({ closedAt: '2024-03-15T10:00:00Z', totalCards: 15, totalVotes: 30, totalParticipants: 6, actionItemCompletionRate: 60 }),
    ]
    const { getAllByTestId } = render(<TrendChart data={data} />)

    const upIndicators = getAllByTestId('trending-up')
    expect(upIndicators.length).toBeGreaterThan(0)
  })

  it('shows negative trend indicator when metrics decrease', () => {
    const data = [
      createTrendPoint({ closedAt: '2024-03-01T10:00:00Z', totalCards: 15, totalVotes: 30, totalParticipants: 6, actionItemCompletionRate: 60 }),
      createTrendPoint({ closedAt: '2024-03-15T10:00:00Z', totalCards: 10, totalVotes: 20, totalParticipants: 5, actionItemCompletionRate: 40 }),
    ]
    const { getAllByTestId } = render(<TrendChart data={data} />)

    const downIndicators = getAllByTestId('trending-down')
    expect(downIndicators.length).toBeGreaterThan(0)
  })

  it('shows flat indicator when metrics are unchanged', () => {
    const data = [
      createTrendPoint({ closedAt: '2024-03-01T10:00:00Z', totalCards: 10, totalVotes: 20, totalParticipants: 5, actionItemCompletionRate: 50 }),
      createTrendPoint({ closedAt: '2024-03-15T10:00:00Z', totalCards: 10, totalVotes: 20, totalParticipants: 5, actionItemCompletionRate: 50 }),
    ]
    const { getAllByText } = render(<TrendChart data={data} />)

    const flatIndicators = getAllByText('横ばい')
    expect(flatIndicators.length).toBeGreaterThan(0)
  })

  it('displays summary labels for all four metrics', () => {
    const data = [createTrendPoint()]
    const { getByTestId } = render(<TrendChart data={data} />)

    const summary = getByTestId('trend-summary')
    expect(summary.textContent).toContain('カード数')
    expect(summary.textContent).toContain('投票数')
    expect(summary.textContent).toContain('参加者数')
    expect(summary.textContent).toContain('AI完了率')
  })

  it('displays units for summary cards', () => {
    const data = [createTrendPoint()]
    const { getByTestId } = render(<TrendChart data={data} />)

    const summary = getByTestId('trend-summary')
    expect(summary.textContent).toContain('枚')
    expect(summary.textContent).toContain('票')
    expect(summary.textContent).toContain('人')
    expect(summary.textContent).toContain('%')
  })
})
