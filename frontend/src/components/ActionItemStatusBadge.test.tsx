import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActionItemStatusBadge } from './ActionItemStatusBadge'

describe('ActionItemStatusBadge', () => {
  it('renders OPEN status with blue style and 未着手 label', () => {
    render(<ActionItemStatusBadge status="OPEN" />)

    const badge = screen.getByText('未着手')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-blue-100')
    expect(badge.className).toContain('text-blue-800')
  })

  it('renders IN_PROGRESS status with yellow style and 進行中 label', () => {
    render(<ActionItemStatusBadge status="IN_PROGRESS" />)

    const badge = screen.getByText('進行中')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-yellow-100')
    expect(badge.className).toContain('text-yellow-800')
  })

  it('renders DONE status with green style and 完了 label', () => {
    render(<ActionItemStatusBadge status="DONE" />)

    const badge = screen.getByText('完了')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-green-100')
    expect(badge.className).toContain('text-green-800')
  })

  it('renders with rounded-full and font-medium classes', () => {
    render(<ActionItemStatusBadge status="OPEN" />)

    const badge = screen.getByText('未着手')
    expect(badge.className).toContain('rounded-full')
    expect(badge.className).toContain('font-medium')
  })
})
