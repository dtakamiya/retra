import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SnapshotDetailView } from './SnapshotDetailView'
import { createSnapshotDetail } from '../test/fixtures'

describe('SnapshotDetailView', () => {
  it('displays team name as heading', () => {
    const snapshot = createSnapshotDetail({ teamName: 'Team Gamma' })
    render(<SnapshotDetailView snapshot={snapshot} />)

    expect(screen.getByText('Team Gamma')).toBeInTheDocument()
  })

  it('displays formatted date', () => {
    const snapshot = createSnapshotDetail({ closedAt: '2024-06-20T15:00:00Z' })
    render(<SnapshotDetailView snapshot={snapshot} />)

    const expected = new Date('2024-06-20T15:00:00Z').toLocaleDateString('ja-JP')
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('displays framework', () => {
    const snapshot = createSnapshotDetail({ framework: 'FUN_DONE_LEARN' })
    render(<SnapshotDetailView snapshot={snapshot} />)

    expect(screen.getByText('FUN_DONE_LEARN')).toBeInTheDocument()
  })

  it('displays total cards stat', () => {
    const snapshot = createSnapshotDetail({ totalCards: 20 })
    render(<SnapshotDetailView snapshot={snapshot} />)

    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('カード数')).toBeInTheDocument()
  })

  it('displays total participants stat', () => {
    const snapshot = createSnapshotDetail({ totalParticipants: 8 })
    render(<SnapshotDetailView snapshot={snapshot} />)

    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('参加者')).toBeInTheDocument()
  })

  it('displays action item completion rate', () => {
    const snapshot = createSnapshotDetail({ actionItemsDone: 3, actionItemsTotal: 4 })
    render(<SnapshotDetailView snapshot={snapshot} />)

    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('AI完了率')).toBeInTheDocument()
  })

  it('displays action item fraction', () => {
    const snapshot = createSnapshotDetail({ actionItemsDone: 3, actionItemsTotal: 4 })
    render(<SnapshotDetailView snapshot={snapshot} />)

    expect(screen.getByText('3/4')).toBeInTheDocument()
    expect(screen.getByText('AI完了')).toBeInTheDocument()
  })

  it('displays 0% completion rate when no action items', () => {
    const snapshot = createSnapshotDetail({ actionItemsDone: 0, actionItemsTotal: 0 })
    render(<SnapshotDetailView snapshot={snapshot} />)

    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('parses and displays column details from snapshotData', () => {
    const snapshot = createSnapshotDetail({
      snapshotData: JSON.stringify({
        columns: [
          { name: 'Keep', cards: [{ content: 'Good teamwork', votes: 5 }] },
          { name: 'Problem', cards: [{ content: 'Slow builds', votes: 3 }] },
        ],
      }),
    })
    render(<SnapshotDetailView snapshot={snapshot} />)

    expect(screen.getByText('カラム詳細')).toBeInTheDocument()
    expect(screen.getByText('Keep (1)')).toBeInTheDocument()
    expect(screen.getByText('Problem (1)')).toBeInTheDocument()
    expect(screen.getByText('Good teamwork')).toBeInTheDocument()
    expect(screen.getByText('5 票')).toBeInTheDocument()
    expect(screen.getByText('Slow builds')).toBeInTheDocument()
    expect(screen.getByText('3 票')).toBeInTheDocument()
  })

  it('does not show vote count when votes is 0', () => {
    const snapshot = createSnapshotDetail({
      snapshotData: JSON.stringify({
        columns: [
          { name: 'Try', cards: [{ content: 'No votes card', votes: 0 }] },
        ],
      }),
    })
    render(<SnapshotDetailView snapshot={snapshot} />)

    expect(screen.getByText('No votes card')).toBeInTheDocument()
    expect(screen.queryByText('0 票')).not.toBeInTheDocument()
  })

  it('handles invalid snapshotData JSON gracefully', () => {
    const snapshot = createSnapshotDetail({ snapshotData: 'invalid json' })
    render(<SnapshotDetailView snapshot={snapshot} />)

    // Should still render the main info without crashing
    expect(screen.getByText(snapshot.teamName)).toBeInTheDocument()
    expect(screen.queryByText('カラム詳細')).not.toBeInTheDocument()
  })
})
