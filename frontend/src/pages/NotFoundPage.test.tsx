import { describe, it, expect } from 'vitest'
import { render, screen } from '../test/test-utils'
import { NotFoundPage } from './NotFoundPage'

describe('NotFoundPage', () => {
  it('renders 404 text', () => {
    render(<NotFoundPage />)

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('ページが見つかりません')).toBeInTheDocument()
  })

  it('renders "ホームに戻る" link pointing to "/"', () => {
    render(<NotFoundPage />)

    const link = screen.getByRole('link', { name: 'ホームに戻る' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/')
  })
})
