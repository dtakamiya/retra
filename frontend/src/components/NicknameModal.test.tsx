import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NicknameModal } from './NicknameModal'

describe('NicknameModal', () => {
  let mockOnJoin: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnJoin = vi.fn().mockResolvedValue(undefined)
  })

  it('renders board title and form', () => {
    render(<NicknameModal onJoin={mockOnJoin} boardTitle="テストレトロ" />)

    expect(screen.getByText('ボードに参加')).toBeInTheDocument()
    expect(screen.getByText('テストレトロ')).toBeInTheDocument()
    expect(screen.getByText('ニックネーム')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ニックネームを入力')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '参加' })).toBeInTheDocument()
  })

  it('submit button is disabled with empty input', () => {
    render(<NicknameModal onJoin={mockOnJoin} boardTitle="テストレトロ" />)

    const submitButton = screen.getByRole('button', { name: '参加' })
    expect(submitButton).toBeDisabled()
  })

  it('calls onJoin with trimmed nickname on submit', async () => {
    const user = userEvent.setup()
    render(<NicknameModal onJoin={mockOnJoin} boardTitle="テストレトロ" />)

    const input = screen.getByPlaceholderText('ニックネームを入力')
    await user.type(input, '  太郎  ')

    const submitButton = screen.getByRole('button', { name: '参加' })
    await user.click(submitButton)

    expect(mockOnJoin).toHaveBeenCalledWith('太郎')
  })

  it('shows error message when onJoin rejects', async () => {
    mockOnJoin.mockRejectedValue(new Error('既に参加済みです'))
    const user = userEvent.setup()
    render(<NicknameModal onJoin={mockOnJoin} boardTitle="テストレトロ" />)

    const input = screen.getByPlaceholderText('ニックネームを入力')
    await user.type(input, '太郎')

    const submitButton = screen.getByRole('button', { name: '参加' })
    await user.click(submitButton)

    expect(await screen.findByText('既に参加済みです')).toBeInTheDocument()
  })

  it('shows loading state during submission', async () => {
    let resolveJoin: () => void
    mockOnJoin.mockImplementation(
      () => new Promise<void>((resolve) => { resolveJoin = resolve })
    )
    const user = userEvent.setup()
    render(<NicknameModal onJoin={mockOnJoin} boardTitle="テストレトロ" />)

    const input = screen.getByPlaceholderText('ニックネームを入力')
    await user.type(input, '太郎')

    const submitButton = screen.getByRole('button', { name: '参加' })
    await user.click(submitButton)

    expect(screen.getByRole('button', { name: '参加中...' })).toBeDisabled()

    resolveJoin!()
  })
})
