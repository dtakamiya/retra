import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActionItemCard } from './ActionItemCard'
import { useBoardStore } from '../store/boardStore'
import { api } from '../api/client'
import { createActionItem, createBoard, createParticipant } from '../test/fixtures'

vi.mock('../store/boardStore')
vi.mock('../store/toastStore', () => ({
  useToastStore: vi.fn((selector: (s: { addToast: ReturnType<typeof vi.fn> }) => unknown) =>
    selector({ addToast: vi.fn() })
  ),
}))
vi.mock('../api/client', () => ({
  api: {
    updateActionItem: vi.fn(),
    updateActionItemStatus: vi.fn(),
    deleteActionItem: vi.fn(),
  },
}))

describe('ActionItemCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when board or participant is null', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: null,
      participant: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    const item = createActionItem()
    const { container } = render(<ActionItemCard actionItem={item} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders action item content and status badge', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    } as unknown as ReturnType<typeof useBoardStore>)

    const item = createActionItem({ content: 'テストアクション', status: 'OPEN' })
    render(<ActionItemCard actionItem={item} />)

    expect(screen.getByText('テストアクション')).toBeInTheDocument()
    // Badge renders 未着手 and select option also has 未着手
    expect(screen.getAllByText('未着手').length).toBeGreaterThanOrEqual(1)
  })

  it('renders assignee nickname when set', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    } as unknown as ReturnType<typeof useBoardStore>)

    const item = createActionItem({ assigneeNickname: 'Alice' })
    render(<ActionItemCard actionItem={item} />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders due date when set', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    } as unknown as ReturnType<typeof useBoardStore>)

    const item = createActionItem({ dueDate: '2024-03-15' })
    render(<ActionItemCard actionItem={item} />)

    expect(screen.getByText('2024-03-15')).toBeInTheDocument()
  })

  it('shows status dropdown and edit/delete buttons for facilitator in ACTION_ITEMS phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    } as unknown as ReturnType<typeof useBoardStore>)

    const item = createActionItem()
    render(<ActionItemCard actionItem={item} />)

    expect(screen.getByLabelText('ステータスを変更')).toBeInTheDocument()
    expect(screen.getByLabelText('アクションアイテムを編集')).toBeInTheDocument()
    expect(screen.getByLabelText('アクションアイテムを削除')).toBeInTheDocument()
  })

  it('shows status dropdown and edit/delete buttons for assignee in ACTION_ITEMS phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
    } as unknown as ReturnType<typeof useBoardStore>)

    const item = createActionItem({ assigneeId: 'p-1' })
    render(<ActionItemCard actionItem={item} />)

    expect(screen.getByLabelText('ステータスを変更')).toBeInTheDocument()
    expect(screen.getByLabelText('アクションアイテムを編集')).toBeInTheDocument()
    expect(screen.getByLabelText('アクションアイテムを削除')).toBeInTheDocument()
  })

  it('does NOT show edit/delete buttons for non-assignee non-facilitator', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-2', isFacilitator: false }),
    } as unknown as ReturnType<typeof useBoardStore>)

    const item = createActionItem({ assigneeId: 'p-1' })
    render(<ActionItemCard actionItem={item} />)

    expect(screen.queryByLabelText('ステータスを変更')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('アクションアイテムを編集')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('アクションアイテムを削除')).not.toBeInTheDocument()
  })

  it('does NOT show edit/delete buttons in CLOSED phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'CLOSED' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    } as unknown as ReturnType<typeof useBoardStore>)

    const item = createActionItem()
    render(<ActionItemCard actionItem={item} />)

    expect(screen.queryByLabelText('ステータスを変更')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('アクションアイテムを編集')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('アクションアイテムを削除')).not.toBeInTheDocument()
  })

  it('changing status dropdown calls api.updateActionItemStatus', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ slug: 'test-slug', phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    } as unknown as ReturnType<typeof useBoardStore>)
    vi.mocked(api.updateActionItemStatus).mockResolvedValue(createActionItem({ status: 'IN_PROGRESS' }))

    const item = createActionItem({ id: 'ai-1', status: 'OPEN' })
    render(<ActionItemCard actionItem={item} />)

    await user.selectOptions(screen.getByLabelText('ステータスを変更'), 'IN_PROGRESS')

    expect(api.updateActionItemStatus).toHaveBeenCalledWith('test-slug', 'ai-1', 'IN_PROGRESS', 'p-1')
  })

  it('clicking edit shows textarea with current content', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    } as unknown as ReturnType<typeof useBoardStore>)

    const item = createActionItem({ content: '編集テスト' })
    render(<ActionItemCard actionItem={item} />)

    await user.click(screen.getByLabelText('アクションアイテムを編集'))

    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('編集テスト')
  })

  it('saving edit calls api.updateActionItem', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ slug: 'test-slug', phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    } as unknown as ReturnType<typeof useBoardStore>)
    vi.mocked(api.updateActionItem).mockResolvedValue(createActionItem({ content: '更新内容' }))

    const item = createActionItem({ id: 'ai-1', content: '元の内容' })
    render(<ActionItemCard actionItem={item} />)

    await user.click(screen.getByLabelText('アクションアイテムを編集'))
    const textarea = screen.getByRole('textbox')
    await user.clear(textarea)
    await user.type(textarea, '更新内容')
    await user.click(screen.getByLabelText('保存'))

    expect(api.updateActionItem).toHaveBeenCalledWith('test-slug', 'ai-1', '更新内容', 'p-1')
  })

  it('clicking delete calls api.deleteActionItem', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ slug: 'test-slug', phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    } as unknown as ReturnType<typeof useBoardStore>)
    vi.mocked(api.deleteActionItem).mockResolvedValue(undefined)

    const item = createActionItem({ id: 'ai-1' })
    render(<ActionItemCard actionItem={item} />)

    await user.click(screen.getByLabelText('アクションアイテムを削除'))

    expect(api.deleteActionItem).toHaveBeenCalledWith('test-slug', 'ai-1', 'p-1')
  })

  it('pressing Escape cancels editing', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    } as unknown as ReturnType<typeof useBoardStore>)

    const item = createActionItem({ content: 'Escテスト' })
    render(<ActionItemCard actionItem={item} />)

    await user.click(screen.getByLabelText('アクションアイテムを編集'))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText('Escテスト')).toBeInTheDocument()
  })

  it('pressing Enter in textarea saves the edit', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ slug: 'test-slug', phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    } as unknown as ReturnType<typeof useBoardStore>)
    vi.mocked(api.updateActionItem).mockResolvedValue(createActionItem({ content: 'Enter保存' }))

    const item = createActionItem({ id: 'ai-1', content: 'Enter保存' })
    render(<ActionItemCard actionItem={item} />)

    await user.click(screen.getByLabelText('アクションアイテムを編集'))
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, '{Enter}')

    expect(api.updateActionItem).toHaveBeenCalledWith('test-slug', 'ai-1', 'Enter保存', 'p-1')
  })
})
