import { describe, it, expect } from 'vitest'
import { render, screen } from '../test/test-utils'
import { RetroSummaryCard } from './RetroSummaryCard'
import { createSnapshotSummary } from '../test/fixtures'

describe('RetroSummaryCard', () => {
  it('displays team name', () => {
    const snapshot = createSnapshotSummary({ teamName: 'Team Bravo' })
    render(<RetroSummaryCard snapshot={snapshot} />)

    expect(screen.getByText('Team Bravo')).toBeInTheDocument()
  })

  it('displays formatted date', () => {
    const snapshot = createSnapshotSummary({ closedAt: '2024-03-15T10:00:00Z' })
    render(<RetroSummaryCard snapshot={snapshot} />)

    // Japanese date format
    expect(screen.getByText('2024/3/15')).toBeInTheDocument()
  })

  it('displays card count', () => {
    const snapshot = createSnapshotSummary({ totalCards: 15 })
    render(<RetroSummaryCard snapshot={snapshot} />)

    expect(screen.getByText('15 カード')).toBeInTheDocument()
  })

  it('displays vote count', () => {
    const snapshot = createSnapshotSummary({ totalVotes: 42 })
    render(<RetroSummaryCard snapshot={snapshot} />)

    expect(screen.getByText('42 投票')).toBeInTheDocument()
  })

  it('displays participant count', () => {
    const snapshot = createSnapshotSummary({ totalParticipants: 7 })
    render(<RetroSummaryCard snapshot={snapshot} />)

    expect(screen.getByText('7 参加者')).toBeInTheDocument()
  })

  it('displays action item completion with percentage', () => {
    const snapshot = createSnapshotSummary({ actionItemsDone: 3, actionItemsTotal: 4 })
    render(<RetroSummaryCard snapshot={snapshot} />)

    expect(screen.getByText('AI 3/4 (75%)')).toBeInTheDocument()
  })

  it('displays 0% when no action items', () => {
    const snapshot = createSnapshotSummary({ actionItemsDone: 0, actionItemsTotal: 0 })
    render(<RetroSummaryCard snapshot={snapshot} />)

    expect(screen.getByText('AI 0/0 (0%)')).toBeInTheDocument()
  })

  it('displays framework name as badge', () => {
    const snapshot = createSnapshotSummary({ framework: 'KPT' })
    render(<RetroSummaryCard snapshot={snapshot} />)

    expect(screen.getByText('KPT')).toBeInTheDocument()
  })

  it('links to snapshot detail page', () => {
    const snapshot = createSnapshotSummary({ id: 'snap-123' })
    render(<RetroSummaryCard snapshot={snapshot} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/dashboard/snap-123')
  })

  it('renders completion progress bar', () => {
    const snapshot = createSnapshotSummary({ actionItemsDone: 3, actionItemsTotal: 4 })
    render(<RetroSummaryCard snapshot={snapshot} />)

    const bar = screen.getByTestId('completion-bar')
    expect(bar).toHaveStyle({ width: '75%' })
  })
})
