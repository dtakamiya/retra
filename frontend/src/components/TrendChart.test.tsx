import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrendChart } from './TrendChart'
import { createTrendPoint } from '../test/fixtures'

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: ({ name }: { name: string }) => <div data-testid="area" data-name={name} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
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

  it('renders one ResponsiveContainer for active tab', () => {
    const data = [createTrendPoint()]
    const { getAllByTestId } = render(<TrendChart data={data} />)

    expect(getAllByTestId('responsive-container')).toHaveLength(1)
  })

  it('renders one AreaChart for active tab', () => {
    const data = [createTrendPoint()]
    const { getAllByTestId } = render(<TrendChart data={data} />)

    expect(getAllByTestId('area-chart')).toHaveLength(1)
  })

  it('renders three areas for basic trend tab', () => {
    const data = [createTrendPoint()]
    const { getAllByTestId } = render(<TrendChart data={data} />)

    const areas = getAllByTestId('area')
    expect(areas).toHaveLength(3)
  })

  it('renders correct area names for basic trend', () => {
    const data = [createTrendPoint()]
    const { getAllByTestId } = render(<TrendChart data={data} />)

    const areas = getAllByTestId('area')
    const names = areas.map(el => el.getAttribute('data-name'))
    expect(names).toContain('カード数')
    expect(names).toContain('投票数')
    expect(names).toContain('AI完了率(%)')
  })

  it('renders tab navigation', () => {
    const data = [createTrendPoint()]
    render(<TrendChart data={data} />)

    expect(screen.getByText('基本トレンド')).toBeInTheDocument()
    expect(screen.getByText('エンゲージメント')).toBeInTheDocument()
  })

  it('switches to engagement tab and shows engagement metrics', async () => {
    const user = userEvent.setup()
    const data = [createTrendPoint()]
    const { getAllByTestId } = render(<TrendChart data={data} />)

    await user.click(screen.getByText('エンゲージメント'))

    const areas = getAllByTestId('area')
    const names = areas.map(el => el.getAttribute('data-name'))
    expect(names).toContain('カード数/人')
    expect(names).toContain('投票数/人')
    expect(names).toContain('投票数/カード')
    expect(names).toContain('アクション化率(%)')
  })

  it('renders four areas for engagement tab', async () => {
    const user = userEvent.setup()
    const data = [createTrendPoint()]
    const { getAllByTestId } = render(<TrendChart data={data} />)

    await user.click(screen.getByText('エンゲージメント'))

    const areas = getAllByTestId('area')
    expect(areas).toHaveLength(4)
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
