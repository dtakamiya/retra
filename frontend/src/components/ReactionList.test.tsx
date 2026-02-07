import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactionList } from './ReactionList'
import { createReaction } from '../test/fixtures'

describe('ReactionList', () => {
  const onToggle = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when reactions is empty', () => {
    const { container } = render(
      <ReactionList reactions={[]} myParticipantId="p-1" onToggle={onToggle} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('groups reactions by emoji and shows counts', () => {
    const reactions = [
      createReaction({ id: 'r-1', emoji: '👍', participantId: 'p-1' }),
      createReaction({ id: 'r-2', emoji: '👍', participantId: 'p-2' }),
      createReaction({ id: 'r-3', emoji: '❤️', participantId: 'p-1' }),
    ]

    render(<ReactionList reactions={reactions} myParticipantId="p-1" onToggle={onToggle} />)

    // 👍 appears with count 2
    expect(screen.getByLabelText('👍 2件（リアクション済み）')).toBeInTheDocument()
    // ❤️ appears with count 1
    expect(screen.getByLabelText('❤️ 1件（リアクション済み）')).toBeInTheDocument()
  })

  it('highlights my reactions differently', () => {
    const reactions = [
      createReaction({ id: 'r-1', emoji: '👍', participantId: 'p-1' }),
      createReaction({ id: 'r-2', emoji: '❤️', participantId: 'p-2' }),
    ]

    render(<ReactionList reactions={reactions} myParticipantId="p-1" onToggle={onToggle} />)

    const myButton = screen.getByLabelText('👍 1件（リアクション済み）')
    expect(myButton.className).toContain('bg-indigo-50')

    const otherButton = screen.getByLabelText('❤️ 1件')
    expect(otherButton.className).toContain('bg-gray-50')
  })

  it('calls onToggle when clicking a reaction', async () => {
    const user = userEvent.setup()
    const reactions = [
      createReaction({ id: 'r-1', emoji: '👍', participantId: 'p-1' }),
    ]

    render(<ReactionList reactions={reactions} myParticipantId="p-1" onToggle={onToggle} />)

    await user.click(screen.getByLabelText('👍 1件（リアクション済み）'))

    expect(onToggle).toHaveBeenCalledWith('👍')
  })

  it('disables buttons when disabled prop is true', () => {
    const reactions = [
      createReaction({ id: 'r-1', emoji: '👍', participantId: 'p-1' }),
    ]

    render(<ReactionList reactions={reactions} myParticipantId="p-1" onToggle={onToggle} disabled />)

    expect(screen.getByLabelText('👍 1件（リアクション済み）')).toBeDisabled()
  })
})
