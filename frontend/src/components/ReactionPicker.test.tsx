import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactionPicker } from './ReactionPicker'

describe('ReactionPicker', () => {
  const onSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the trigger button', () => {
    render(<ReactionPicker onSelect={onSelect} />)
    expect(screen.getByLabelText('リアクションを追加')).toBeInTheDocument()
  })

  it('opens emoji picker on click', async () => {
    const user = userEvent.setup()
    render(<ReactionPicker onSelect={onSelect} />)

    await user.click(screen.getByLabelText('リアクションを追加'))

    expect(screen.getByLabelText('リアクション 👍')).toBeInTheDocument()
    expect(screen.getByLabelText('リアクション ❤️')).toBeInTheDocument()
    expect(screen.getByLabelText('リアクション 😂')).toBeInTheDocument()
    expect(screen.getByLabelText('リアクション 🎉')).toBeInTheDocument()
    expect(screen.getByLabelText('リアクション 🤔')).toBeInTheDocument()
    expect(screen.getByLabelText('リアクション 👀')).toBeInTheDocument()
  })

  it('calls onSelect with emoji and closes picker', async () => {
    const user = userEvent.setup()
    render(<ReactionPicker onSelect={onSelect} />)

    await user.click(screen.getByLabelText('リアクションを追加'))
    await user.click(screen.getByLabelText('リアクション ❤️'))

    expect(onSelect).toHaveBeenCalledWith('❤️')
    expect(screen.queryByLabelText('リアクション ❤️')).not.toBeInTheDocument()
  })

  it('toggles picker open/close on trigger clicks', async () => {
    const user = userEvent.setup()
    render(<ReactionPicker onSelect={onSelect} />)

    // Open
    await user.click(screen.getByLabelText('リアクションを追加'))
    expect(screen.getByLabelText('リアクション 👍')).toBeInTheDocument()

    // Close
    await user.click(screen.getByLabelText('リアクションを追加'))
    expect(screen.queryByLabelText('リアクション 👍')).not.toBeInTheDocument()
  })

  it('closes picker on Escape key', async () => {
    const user = userEvent.setup()
    render(<ReactionPicker onSelect={onSelect} />)

    await user.click(screen.getByLabelText('リアクションを追加'))
    expect(screen.getByLabelText('リアクション 👍')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByLabelText('リアクション 👍')).not.toBeInTheDocument()
  })

  it('closes picker on click outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <span data-testid="outside">outside</span>
        <ReactionPicker onSelect={onSelect} />
      </div>
    )

    await user.click(screen.getByLabelText('リアクションを追加'))
    expect(screen.getByLabelText('リアクション 👍')).toBeInTheDocument()

    await user.click(screen.getByTestId('outside'))
    expect(screen.queryByLabelText('リアクション 👍')).not.toBeInTheDocument()
  })

  it('disables the trigger button when disabled', () => {
    render(<ReactionPicker onSelect={onSelect} disabled />)
    expect(screen.getByLabelText('リアクションを追加')).toBeDisabled()
  })
})
