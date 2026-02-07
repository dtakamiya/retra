import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./pages/HomePage', () => ({
  HomePage: () => <div data-testid="home-page">HomePage</div>,
}))

vi.mock('./pages/BoardPage', () => ({
  BoardPage: () => <div data-testid="board-page">BoardPage</div>,
}))

vi.mock('./pages/NotFoundPage', () => ({
  NotFoundPage: () => <div data-testid="not-found-page">NotFoundPage</div>,
}))

describe('App', () => {
  it('renders HomePage on default "/" route', () => {
    // BrowserRouter defaults to "/" in jsdom
    render(<App />)

    expect(screen.getByTestId('home-page')).toBeInTheDocument()
  })

  it('renders without crashing and contains route structure', () => {
    const { container } = render(<App />)

    expect(container).toBeTruthy()
  })

  it('does not render NotFoundPage or BoardPage on default route', () => {
    render(<App />)

    expect(screen.queryByTestId('not-found-page')).not.toBeInTheDocument()
    expect(screen.queryByTestId('board-page')).not.toBeInTheDocument()
  })
})
