import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VoteProgressBar } from './VoteProgressBar'

describe('VoteProgressBar', () => {
  it('returns null when voteCount is 0', () => {
    const { container } = render(<VoteProgressBar voteCount={0} maxVoteCount={5} />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null when maxVoteCount is 0', () => {
    const { container } = render(<VoteProgressBar voteCount={3} maxVoteCount={0} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders progress bar when both values are positive', () => {
    render(<VoteProgressBar voteCount={3} maxVoteCount={5} />)
    expect(screen.getByTestId('vote-progress-bar')).toBeInTheDocument()
    expect(screen.getByTestId('vote-progress-fill')).toBeInTheDocument()
  })

  it('calculates percentage correctly', () => {
    render(<VoteProgressBar voteCount={3} maxVoteCount={10} />)
    const fill = screen.getByTestId('vote-progress-fill')
    expect(fill.style.width).toBe('30%')
  })

  it('shows 100% when voteCount equals maxVoteCount', () => {
    render(<VoteProgressBar voteCount={5} maxVoteCount={5} />)
    const fill = screen.getByTestId('vote-progress-fill')
    expect(fill.style.width).toBe('100%')
  })

  it('applies correct opacity based on percentage', () => {
    render(<VoteProgressBar voteCount={5} maxVoteCount={10} />)
    const fill = screen.getByTestId('vote-progress-fill')
    // 50% -> opacity = 0.4 + (50/100) * 0.6 = 0.7
    expect(fill.style.opacity).toBe('0.7')
  })

  it('applies full opacity at 100%', () => {
    render(<VoteProgressBar voteCount={10} maxVoteCount={10} />)
    const fill = screen.getByTestId('vote-progress-fill')
    // 100% -> opacity = 0.4 + (100/100) * 0.6 = 1
    expect(fill.style.opacity).toBe('1')
  })
})
