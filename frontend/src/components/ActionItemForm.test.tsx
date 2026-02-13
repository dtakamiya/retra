import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActionItemForm } from './ActionItemForm'
import { useBoardStore } from '../store/boardStore'
import { api } from '../api/client'
import { createActionItem, createParticipant } from '../test/fixtures'

vi.mock('../store/boardStore')
vi.mock('../store/toastStore', () => ({
  useToastStore: vi.fn((selector: (s: { addToast: ReturnType<typeof vi.fn> }) => unknown) =>
    selector({ addToast: vi.fn() })
  ),
}))
vi.mock('../api/client', () => ({
  api: {
    createActionItem: vi.fn(),
  },
}))

const participants = [
  createParticipant({ id: 'p-1', nickname: 'Alice' }),
  createParticipant({ id: 'p-2', nickname: 'Bob' }),
]

describe('ActionItemForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when participant is null', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      participant: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    const { container } = render(<ActionItemForm slug="test-slug" participants={participants} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders textarea, assignee select, date input, and submit button', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      participant: createParticipant({ id: 'p-1' }),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<ActionItemForm slug="test-slug" participants={participants} />)

    expect(screen.getByPlaceholderText('アクションアイテムを追加...')).toBeInTheDocument()
    expect(screen.getByLabelText('担当者を選択')).toBeInTheDocument()
    expect(screen.getByLabelText('期限を設定')).toBeInTheDocument()
    expect(screen.getByLabelText('アクションアイテムを追加')).toBeInTheDocument()
  })

  it('submit button is disabled when content is empty', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      participant: createParticipant({ id: 'p-1' }),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<ActionItemForm slug="test-slug" participants={participants} />)

    expect(screen.getByLabelText('アクションアイテムを追加')).toBeDisabled()
  })

  it('renders participant options in the assignee select', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      participant: createParticipant({ id: 'p-1' }),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<ActionItemForm slug="test-slug" participants={participants} />)

    const select = screen.getByLabelText('担当者を選択')
    expect(select).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('clicking submit calls api.createActionItem and clears fields', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockReturnValue({
      participant: createParticipant({ id: 'p-1' }),
    } as unknown as ReturnType<typeof useBoardStore>)
    vi.mocked(api.createActionItem).mockResolvedValue(createActionItem())

    render(<ActionItemForm slug="test-slug" participants={participants} />)

    const textarea = screen.getByPlaceholderText('アクションアイテムを追加...')
    await user.type(textarea, 'アクション内容')
    await user.click(screen.getByLabelText('アクションアイテムを追加'))

    expect(api.createActionItem).toHaveBeenCalledWith(
      'test-slug',
      'アクション内容',
      'p-1',
      undefined,
      undefined,
      undefined
    )
    expect(textarea).toHaveValue('')
  })

  it('clicking submit with assignee and due date passes them to API', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockReturnValue({
      participant: createParticipant({ id: 'p-1' }),
    } as unknown as ReturnType<typeof useBoardStore>)
    vi.mocked(api.createActionItem).mockResolvedValue(createActionItem())

    render(<ActionItemForm slug="test-slug" participants={participants} />)

    const textarea = screen.getByPlaceholderText('アクションアイテムを追加...')
    await user.type(textarea, 'アクション内容')
    await user.selectOptions(screen.getByLabelText('担当者を選択'), 'p-2')
    // Date input: type via user
    const dateInput = screen.getByLabelText('期限を設定')
    await user.type(dateInput, '2024-03-15')
    await user.click(screen.getByLabelText('アクションアイテムを追加'))

    expect(api.createActionItem).toHaveBeenCalledWith(
      'test-slug',
      'アクション内容',
      'p-1',
      undefined,
      'p-2',
      '2024-03-15'
    )
  })

  it('pressing Enter submits the action item', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockReturnValue({
      participant: createParticipant({ id: 'p-1' }),
    } as unknown as ReturnType<typeof useBoardStore>)
    vi.mocked(api.createActionItem).mockResolvedValue(createActionItem())

    render(<ActionItemForm slug="test-slug" participants={participants} />)

    const textarea = screen.getByPlaceholderText('アクションアイテムを追加...')
    await user.type(textarea, 'Enter送信')
    await user.type(textarea, '{Enter}')

    expect(api.createActionItem).toHaveBeenCalledWith(
      'test-slug',
      'Enter送信',
      'p-1',
      undefined,
      undefined,
      undefined
    )
  })

  it('passes cardId when provided', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockReturnValue({
      participant: createParticipant({ id: 'p-1' }),
    } as unknown as ReturnType<typeof useBoardStore>)
    vi.mocked(api.createActionItem).mockResolvedValue(createActionItem())

    render(<ActionItemForm slug="test-slug" participants={participants} cardId="card-1" />)

    const textarea = screen.getByPlaceholderText('アクションアイテムを追加...')
    await user.type(textarea, '変換アクション')
    await user.click(screen.getByLabelText('アクションアイテムを追加'))

    expect(api.createActionItem).toHaveBeenCalledWith(
      'test-slug',
      '変換アクション',
      'p-1',
      'card-1',
      undefined,
      undefined
    )
  })

  it('shows initialContent when provided', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      participant: createParticipant({ id: 'p-1' }),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<ActionItemForm slug="test-slug" participants={participants} initialContent="初期内容" />)

    expect(screen.getByPlaceholderText('アクションアイテムを追加...')).toHaveValue('初期内容')
  })
})
