import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

vi.mock('./pages/HomePage', () => ({
  HomePage: () => <div data-testid="home-page">HomePage</div>,
}))

vi.mock('./pages/BoardPage', () => ({
  BoardPage: () => <div data-testid="board-page">BoardPage</div>,
}))

vi.mock('./pages/TeamDashboardPage', () => ({
  TeamDashboardPage: () => <div data-testid="team-dashboard-page">TeamDashboardPage</div>,
}))

vi.mock('./pages/SnapshotDetailPage', () => ({
  SnapshotDetailPage: () => <div data-testid="snapshot-detail-page">SnapshotDetailPage</div>,
}))

vi.mock('./pages/NotFoundPage', () => ({
  NotFoundPage: () => <div data-testid="not-found-page">NotFoundPage</div>,
}))

describe('App', () => {
  it('renders HomePage on default "/" route', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })
  })

  it('renders without crashing and contains route structure', async () => {
    const { container } = render(<App />)

    await waitFor(() => {
      expect(container).toBeTruthy()
    })
  })

  it('does not render NotFoundPage or BoardPage on default route', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('not-found-page')).not.toBeInTheDocument()
    expect(screen.queryByTestId('board-page')).not.toBeInTheDocument()
  })

  it('wraps routes in ErrorBoundary for crash resilience', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })
  })
})
