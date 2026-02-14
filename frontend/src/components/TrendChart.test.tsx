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

describe('TrendChart', () => {
  it('renders without crashing', () => {
    const data = [
      createTrendPoint({ closedAt: '2024-03-01T10:00:00Z' }),
      createTrendPoint({ closedAt: '2024-03-15T10:00:00Z' }),
    ]
    const { container } = render(<TrendChart data={data} />)

    expect(container).toBeTruthy()
  })

  it('renders ResponsiveContainer', () => {
    const data = [createTrendPoint()]
    const { getByTestId } = render(<TrendChart data={data} />)

    expect(getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('renders LineChart', () => {
    const data = [createTrendPoint()]
    const { getByTestId } = render(<TrendChart data={data} />)

    expect(getByTestId('line-chart')).toBeInTheDocument()
  })

  it('renders three lines for cards, votes, and completion rate', () => {
    const data = [createTrendPoint()]
    const { getAllByTestId } = render(<TrendChart data={data} />)

    const lines = getAllByTestId('line')
    expect(lines).toHaveLength(3)
  })

  it('renders correct line names', () => {
    const data = [createTrendPoint()]
    const { getByText } = render(<TrendChart data={data} />)

    expect(getByText('カード数')).toBeInTheDocument()
    expect(getByText('投票数')).toBeInTheDocument()
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
})
