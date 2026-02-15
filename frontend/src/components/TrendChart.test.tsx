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
})
