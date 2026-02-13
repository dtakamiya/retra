import { describe, it, expect } from 'vitest'
import { render, screen } from '../test/test-utils'
import { RetroHistoryList } from './RetroHistoryList'
import { createSnapshotSummary } from '../test/fixtures'

describe('RetroHistoryList', () => {
  it('shows empty state message when history is empty', () => {
    render(<RetroHistoryList history={[]} />)

    expect(screen.getByText('まだレトロスペクティブの履歴がありません')).toBeInTheDocument()
  })

  it('renders snapshot summary cards for each history item', () => {
    const history = [
      createSnapshotSummary({ id: 'snap-1', teamName: 'Team Alpha' }),
      createSnapshotSummary({ id: 'snap-2', teamName: 'Team Beta' }),
    ]
    render(<RetroHistoryList history={history} />)

    expect(screen.getByText('Team Alpha')).toBeInTheDocument()
    expect(screen.getByText('Team Beta')).toBeInTheDocument()
  })

  it('renders correct number of links', () => {
    const history = [
      createSnapshotSummary({ id: 'snap-1' }),
      createSnapshotSummary({ id: 'snap-2' }),
      createSnapshotSummary({ id: 'snap-3' }),
    ]
    render(<RetroHistoryList history={history} />)

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(3)
  })
})
