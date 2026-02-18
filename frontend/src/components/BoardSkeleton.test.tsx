import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BoardSkeleton } from './BoardSkeleton'

describe('BoardSkeleton', () => {
  it('renders header skeleton area', () => {
    render(<BoardSkeleton />)
    // The skeleton has 3 column containers
    const columns = screen.getAllByText((_content, element) => {
      return element?.className?.includes('min-w-[280px]') ?? false
    })
    expect(columns).toHaveLength(3)
  })

  it('renders skeleton cards in each column with varying counts', () => {
    const { container } = render(<BoardSkeleton />)
    // Each column has (2 + col) cards: col1=3, col2=4, col3=5 = 12 cards total
    const cards = container.querySelectorAll('.bg-white.dark\\:bg-slate-800.rounded-xl')
    expect(cards).toHaveLength(12)
  })

  it('renders sidebar skeleton area', () => {
    const { container } = render(<BoardSkeleton />)
    // Sidebar has "hidden lg:block" class
    const sidebar = container.querySelector('.hidden.lg\\:block.w-64')
    expect(sidebar).toBeInTheDocument()
  })
})
