import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent } from '../test/test-utils'
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

  it('onDeleteが各カードに伝播される', () => {
    const onDelete = vi.fn()
    const history = [
      createSnapshotSummary({ id: 'snap-1' }),
      createSnapshotSummary({ id: 'snap-2' }),
    ]
    render(<RetroHistoryList history={history} onDelete={onDelete} />)

    const deleteButtons = screen.getAllByLabelText('スナップショットを削除')
    expect(deleteButtons).toHaveLength(2)
  })

  it('onDeleteが未指定の場合は削除ボタンが表示されない', () => {
    const history = [createSnapshotSummary({ id: 'snap-1' })]
    render(<RetroHistoryList history={history} />)

    expect(screen.queryByLabelText('スナップショットを削除')).not.toBeInTheDocument()
  })

  it('削除ボタンクリックで正しいIDが渡される', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    const history = [
      createSnapshotSummary({ id: 'snap-1' }),
      createSnapshotSummary({ id: 'snap-2' }),
    ]
    render(<RetroHistoryList history={history} onDelete={onDelete} />)

    const deleteButtons = screen.getAllByLabelText('スナップショットを削除')
    await user.click(deleteButtons[1])

    expect(onDelete).toHaveBeenCalledWith('snap-2')
  })
})
