import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActionItemPriorityBadge } from './ActionItemPriorityBadge'

describe('ActionItemPriorityBadge', () => {
  it('renders HIGH priority with red style and 高 label', () => {
    render(<ActionItemPriorityBadge priority="HIGH" />)

    const badge = screen.getByText('高')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('text-red-600')
    expect(badge.className).toContain('bg-red-50')
  })

  it('renders MEDIUM priority with yellow style and 中 label', () => {
    render(<ActionItemPriorityBadge priority="MEDIUM" />)

    const badge = screen.getByText('中')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('text-yellow-600')
    expect(badge.className).toContain('bg-yellow-50')
  })

  it('renders LOW priority with gray style and 低 label', () => {
    render(<ActionItemPriorityBadge priority="LOW" />)

    const badge = screen.getByText('低')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('text-gray-500')
    expect(badge.className).toContain('bg-gray-50')
  })

  it('renders with rounded and font-medium classes', () => {
    render(<ActionItemPriorityBadge priority="MEDIUM" />)

    const badge = screen.getByText('中')
    expect(badge.className).toContain('rounded')
    expect(badge.className).toContain('font-medium')
  })
})
