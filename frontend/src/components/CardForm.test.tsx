import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CardForm } from './CardForm'
import { useBoardStore } from '../store/boardStore'
import { createBoard, createParticipant } from '../test/fixtures'
import { api } from '../api/client'

vi.mock('../store/boardStore')
vi.mock('../api/client', () => ({
  api: {
    createCard: vi.fn(),
  },
}))

describe('CardForm', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ slug: 'test1234' }),
      participant: createParticipant({ id: 'p-1' }),
    } as unknown as ReturnType<typeof useBoardStore>)
  })

  it('renders textarea and buttons', () => {
    render(<CardForm columnId="col-1" onClose={mockOnClose} />)

    expect(screen.getByLabelText('意見を入力')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('意見を入力...（Enterで送信、Shift+Enterで改行）')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument()
  })

  it('submit button disabled when content is empty', () => {
    render(<CardForm columnId="col-1" onClose={mockOnClose} />)

    expect(screen.getByRole('button', { name: '追加' })).toBeDisabled()
  })

  it('calls onClose when cancel clicked', async () => {
    const user = userEvent.setup()
    render(<CardForm columnId="col-1" onClose={mockOnClose} />)

    await user.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls api.createCard on submit with correct params', async () => {
    vi.mocked(api.createCard).mockResolvedValue(
      {} as Awaited<ReturnType<typeof api.createCard>>
    )

    const user = userEvent.setup()
    render(<CardForm columnId="col-1" onClose={mockOnClose} />)

    const textarea = screen.getByPlaceholderText('意見を入力...（Enterで送信、Shift+Enterで改行）')
    await user.type(textarea, 'テストカードの内容')

    await user.click(screen.getByRole('button', { name: '追加' }))

    expect(api.createCard).toHaveBeenCalledWith('test1234', 'col-1', 'テストカードの内容', 'p-1')
  })

  it('shows character counter', () => {
    render(<CardForm columnId="col-1" onClose={mockOnClose} />)

    expect(screen.getByText('0/2000')).toBeInTheDocument()
  })

  it('updates character counter when typing', async () => {
    const user = userEvent.setup()
    render(<CardForm columnId="col-1" onClose={mockOnClose} />)

    const textarea = screen.getByPlaceholderText('意見を入力...（Enterで送信、Shift+Enterで改行）')
    await user.type(textarea, 'hello')

    expect(screen.getByText('5/2000')).toBeInTheDocument()
  })

  it('Enterキーでフォームを送信する', async () => {
    vi.mocked(api.createCard).mockResolvedValue(
      {} as Awaited<ReturnType<typeof api.createCard>>
    )

    const user = userEvent.setup()
    render(<CardForm columnId="col-1" onClose={mockOnClose} />)

    const textarea = screen.getByPlaceholderText('意見を入力...（Enterで送信、Shift+Enterで改行）')
    await user.type(textarea, 'Enterテスト')
    await user.keyboard('{Enter}')

    expect(api.createCard).toHaveBeenCalledWith('test1234', 'col-1', 'Enterテスト', 'p-1')
  })

  it('Shift+Enterではフォームを送信しない', async () => {
    const user = userEvent.setup()
    render(<CardForm columnId="col-1" onClose={mockOnClose} />)

    const textarea = screen.getByPlaceholderText('意見を入力...（Enterで送信、Shift+Enterで改行）')
    await user.type(textarea, 'テスト')
    await user.keyboard('{Shift>}{Enter}{/Shift}')

    expect(api.createCard).not.toHaveBeenCalled()
  })

  it('Escapeキーでフォームを閉じる', async () => {
    const user = userEvent.setup()
    render(<CardForm columnId="col-1" onClose={mockOnClose} />)

    const textarea = screen.getByPlaceholderText('意見を入力...（Enterで送信、Shift+Enterで改行）')
    await user.click(textarea)
    await user.keyboard('{Escape}')

    expect(mockOnClose).toHaveBeenCalled()
  })
})
