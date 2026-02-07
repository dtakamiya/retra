import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConnectionBanner } from './ConnectionBanner'

describe('ConnectionBanner', () => {
  it('renders disconnection message', () => {
    render(<ConnectionBanner />)

    expect(screen.getByText('接続が切れました。再接続中...')).toBeInTheDocument()
  })
})
