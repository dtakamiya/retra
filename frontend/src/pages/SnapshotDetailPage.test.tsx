import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SnapshotDetailPage } from './SnapshotDetailPage'
import { api } from '../api/client'
import { createSnapshotDetail } from '../test/fixtures'

vi.mock('../api/client', () => ({
  api: {
    getSnapshot: vi.fn(),
  },
}))

vi.mock('../components/SnapshotDetailView', () => ({
  SnapshotDetailView: ({ snapshot }: { snapshot: { teamName: string } }) => (
    <div data-testid="snapshot-detail-view">{snapshot.teamName}</div>
  ),
}))

function renderPage(snapshotId: string = 'snap-1') {
  return render(
    <MemoryRouter initialEntries={[`/dashboard/${snapshotId}`]}>
      <Routes>
        <Route path="/dashboard/:snapshotId" element={<SnapshotDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SnapshotDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    vi.mocked(api.getSnapshot).mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('displays snapshot detail after loading', async () => {
    const snapshot = createSnapshotDetail({ teamName: 'Team Delta' })
    vi.mocked(api.getSnapshot).mockResolvedValue(snapshot)

    renderPage()

    await waitFor(() => {
      expect(screen.getByTestId('snapshot-detail-view')).toBeInTheDocument()
    })
    expect(screen.getByText('Team Delta')).toBeInTheDocument()
  })

  it('shows not found message when snapshot is null', async () => {
    vi.mocked(api.getSnapshot).mockRejectedValue(new Error('Not found'))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('スナップショットが見つかりません')).toBeInTheDocument()
    })
  })

  it('displays back link to dashboard', () => {
    vi.mocked(api.getSnapshot).mockReturnValue(new Promise(() => {}))

    renderPage()

    const link = screen.getByText('ダッシュボードに戻る')
    expect(link.closest('a')).toHaveAttribute('href', '/dashboard')
  })

  it('calls api.getSnapshot with the correct snapshotId', async () => {
    vi.mocked(api.getSnapshot).mockResolvedValue(createSnapshotDetail())

    renderPage('snap-42')

    await waitFor(() => {
      expect(api.getSnapshot).toHaveBeenCalledWith('snap-42')
    })
  })
})
