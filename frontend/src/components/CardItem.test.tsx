import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CardItem } from './CardItem'
import { useBoardStore } from '../store/boardStore'
import { api } from '../api/client'
import { createActionItem, createBoard, createCard, createParticipant, createReaction, createRemainingVotes, createVote } from '../test/fixtures'

vi.mock('../store/boardStore')
vi.mock('../api/client', () => ({
  api: {
    addVote: vi.fn(),
    removeVote: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
    addReaction: vi.fn(),
    removeReaction: vi.fn(),
    createActionItem: vi.fn(),
  },
}))
vi.mock('@dnd-kit/sortable', async () => {
  const { createDndSortableMock } = await import('../test/dnd-mocks')
  return createDndSortableMock()
})
vi.mock('@dnd-kit/utilities', async () => {
  const { createDndUtilitiesMock } = await import('../test/dnd-mocks')
  return createDndUtilitiesMock()
})

describe('CardItem', () => {
  const defaultCard = createCard({
    content: 'テストカードの内容',
    authorNickname: 'TestUser',
    participantId: 'p-1',
    voteCount: 0,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when board or participant is null', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: null,
      participant: null,
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    const { container } = render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    expect(container.innerHTML).toBe('')
  })

  it('renders card content and author nickname', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    expect(screen.getByText('テストカードの内容')).toBeInTheDocument()
    expect(screen.getByText('TestUser')).toBeInTheDocument()
  })

  it('shows drag handle for author in WRITING phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    const card = createCard({ participantId: 'p-1' })
    render(<CardItem card={card} columnColor="#22c55e" />)

    expect(screen.getByLabelText('ドラッグして並べ替え')).toBeInTheDocument()
  })

  it('shows drag handle for facilitator in DISCUSSION phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-2', isFacilitator: true }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    const card = createCard({ participantId: 'p-1' })
    render(<CardItem card={card} columnColor="#22c55e" />)

    expect(screen.getByLabelText('ドラッグして並べ替え')).toBeInTheDocument()
  })

  it('does NOT show drag handle in VOTING phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'VOTING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: createRemainingVotes({ remaining: 5 }),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    expect(screen.queryByLabelText('ドラッグして並べ替え')).not.toBeInTheDocument()
  })

  it('does NOT show drag handle for non-author in WRITING phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-2', isFacilitator: false }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    const card = createCard({ participantId: 'p-1' })
    render(<CardItem card={card} columnColor="#22c55e" />)

    expect(screen.queryByLabelText('ドラッグして並べ替え')).not.toBeInTheDocument()
  })

  it('shows vote button in VOTING phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'VOTING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: createRemainingVotes({ remaining: 5 }),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    // vote button + reaction picker
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(2)
  })

  it('shows vote count when > 0 in non-voting phase', () => {
    const cardWithVotes = createCard({ voteCount: 3 })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CardItem card={cardWithVotes} columnColor="#22c55e" />)

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByTestId('vote-badge')).toBeInTheDocument()
  })

  it('shows larger vote badge in DISCUSSION phase', () => {
    const cardWithVotes = createCard({ voteCount: 5 })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CardItem card={cardWithVotes} columnColor="#22c55e" />)

    const badge = screen.getByTestId('vote-badge')
    expect(badge.className).toContain('text-sm')
  })

  it('shows larger vote badge in CLOSED phase', () => {
    const cardWithVotes = createCard({ voteCount: 2 })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'CLOSED' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CardItem card={cardWithVotes} columnColor="#22c55e" />)

    const badge = screen.getByTestId('vote-badge')
    expect(badge.className).toContain('text-sm')
  })

  it('shows edit/delete buttons for author in WRITING phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    const card = createCard({ participantId: 'p-1' })
    render(<CardItem card={card} columnColor="#22c55e" />)

    // drag handle + edit (Pencil) + delete (Trash2) + reaction picker buttons
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(4)
  })

  it('shows delete (not edit) button for facilitator who is not author in WRITING phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-2', isFacilitator: true }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    const card = createCard({ participantId: 'p-1' })
    render(<CardItem card={card} columnColor="#22c55e" />)

    // delete button + reaction picker
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(2)
  })

  it('does NOT show edit/delete buttons for non-author non-facilitator', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-2', isFacilitator: false }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    const card = createCard({ participantId: 'p-1' })
    render(<CardItem card={card} columnColor="#22c55e" />)

    // Only reaction picker button
    expect(screen.queryAllByRole('button')).toHaveLength(1)
  })

  it('clicking edit button shows textarea with current content', async () => {
    const user = userEvent.setup()
    const card = createCard({ content: '編集テスト', participantId: 'p-1' })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CardItem card={card} columnColor="#22c55e" />)

    // Click the edit (Pencil) button — buttons: drag handle, edit, delete
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[1]) // edit is the second button (after drag handle)

    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveValue('編集テスト')
    expect(screen.getByText('保存')).toBeInTheDocument()
    expect(screen.getByText('キャンセル')).toBeInTheDocument()
  })

  it('saving edited content calls api.updateCard', async () => {
    const user = userEvent.setup()
    const card = createCard({ content: '元の内容', participantId: 'p-1' })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ slug: 'test-slug', phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    vi.mocked(api.updateCard).mockResolvedValue(createCard({ content: '新しい内容' }))

    render(<CardItem card={card} columnColor="#22c55e" />)

    // Enter edit mode (drag handle, edit, delete)
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[1])

    // Clear and type new content
    const textarea = screen.getByRole('textbox')
    await user.clear(textarea)
    await user.type(textarea, '新しい内容')

    // Click save button
    await user.click(screen.getByText('保存'))

    expect(api.updateCard).toHaveBeenCalledWith('test-slug', 'card-1', '新しい内容', 'p-1')
  })

  it('pressing Enter in textarea calls api.updateCard', async () => {
    const user = userEvent.setup()
    const card = createCard({ content: 'Enter保存テスト', participantId: 'p-1' })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ slug: 'test-slug', phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    vi.mocked(api.updateCard).mockResolvedValue(createCard({ content: 'Enter保存テスト' }))

    render(<CardItem card={card} columnColor="#22c55e" />)

    // Enter edit mode
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[1])

    // Press Enter to save (content is already the original)
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, '{Enter}')

    expect(api.updateCard).toHaveBeenCalledWith('test-slug', 'card-1', 'Enter保存テスト', 'p-1')
  })

  it('pressing Escape in textarea cancels editing', async () => {
    const user = userEvent.setup()
    const card = createCard({ content: 'Escキャンセルテスト', participantId: 'p-1' })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CardItem card={card} columnColor="#22c55e" />)

    // Enter edit mode
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[1])

    // Type something then press Escape
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, '変更内容')
    await user.keyboard('{Escape}')

    // Textarea should be gone, original content should be visible
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText('Escキャンセルテスト')).toBeInTheDocument()
  })

  it('clicking cancel button reverts content and exits edit mode', async () => {
    const user = userEvent.setup()
    const card = createCard({ content: 'キャンセルテスト', participantId: 'p-1' })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CardItem card={card} columnColor="#22c55e" />)

    // Enter edit mode
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[1])

    // Type something then click cancel
    const textarea = screen.getByRole('textbox')
    await user.clear(textarea)
    await user.type(textarea, '変更内容')
    await user.click(screen.getByText('キャンセル'))

    // Textarea should be gone, original content should be visible
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText('キャンセルテスト')).toBeInTheDocument()
  })

  it('clicking vote button in VOTING phase calls api.addVote', async () => {
    const user = userEvent.setup()
    const card = createCard({ voteCount: 0, participantId: 'p-1' })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ slug: 'vote-slug', phase: 'VOTING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: createRemainingVotes({ remaining: 3 }),
    } as unknown as ReturnType<typeof useBoardStore>)

    vi.mocked(api.addVote).mockResolvedValue(createVote({ cardId: 'card-1', participantId: 'p-1' }))

    render(<CardItem card={card} columnColor="#22c55e" />)

    // First button is vote, second is reaction picker
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[0])

    expect(api.addVote).toHaveBeenCalledWith('vote-slug', 'card-1', 'p-1')
  })

  it('clicking vote button when user has voted calls api.removeVote', async () => {
    const user = userEvent.setup()
    const card = createCard({ voteCount: 2, votedParticipantIds: ['p-1', 'p-2'], participantId: 'p-1' })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ slug: 'vote-slug', phase: 'VOTING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: createRemainingVotes({ remaining: 3 }),
    } as unknown as ReturnType<typeof useBoardStore>)

    vi.mocked(api.removeVote).mockResolvedValue(undefined)

    render(<CardItem card={card} columnColor="#22c55e" />)

    // First button is vote, second is reaction picker
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[0])

    expect(api.removeVote).toHaveBeenCalledWith('vote-slug', 'card-1', 'p-1')
  })

  it('clicking delete button calls api.deleteCard', async () => {
    const user = userEvent.setup()
    const card = createCard({ participantId: 'p-1' })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ slug: 'del-slug', phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    vi.mocked(api.deleteCard).mockResolvedValue(undefined)

    render(<CardItem card={card} columnColor="#22c55e" />)

    // For author in WRITING phase, buttons are: drag handle, edit (Pencil), delete (Trash2), reaction picker
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[2]) // Delete is the third button

    expect(api.deleteCard).toHaveBeenCalledWith('del-slug', 'card-1', 'p-1')
  })

  it('renders with isOverlay style', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    const { container } = render(<CardItem card={defaultCard} columnColor="#22c55e" isOverlay />)

    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('ring-2')
    expect(card.className).toContain('ring-indigo-300')
  })

  it('shows reaction picker button', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    expect(screen.getByLabelText('リアクションを追加')).toBeInTheDocument()
  })

  it('shows reaction list when card has reactions', () => {
    const cardWithReactions = createCard({
      reactions: [
        createReaction({ emoji: '👍', participantId: 'p-1' }),
        createReaction({ id: 'r-2', emoji: '👍', participantId: 'p-2' }),
        createReaction({ id: 'r-3', emoji: '❤️', participantId: 'p-1' }),
      ],
    })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CardItem card={cardWithReactions} columnColor="#22c55e" />)

    expect(screen.getByText('2')).toBeInTheDocument() // 👍 count
    expect(screen.getByText('1')).toBeInTheDocument() // ❤️ count
  })

  it('clicking reaction picker opens emoji selector and calls api.addReaction', async () => {
    const user = userEvent.setup()

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ slug: 'react-slug', phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    vi.mocked(api.addReaction).mockResolvedValue(createReaction())

    render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    // Open reaction picker
    await user.click(screen.getByLabelText('リアクションを追加'))

    // Click an emoji
    await user.click(screen.getByLabelText('リアクション 👍'))

    expect(api.addReaction).toHaveBeenCalledWith('react-slug', 'card-1', 'p-1', '👍')
  })

  it('clicking existing reaction calls api.removeReaction', async () => {
    const user = userEvent.setup()
    const cardWithReaction = createCard({
      reactions: [createReaction({ emoji: '👍', participantId: 'p-1' })],
    })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ slug: 'react-slug', phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    vi.mocked(api.removeReaction).mockResolvedValue(undefined)

    render(<CardItem card={cardWithReaction} columnColor="#22c55e" />)

    // Open reaction picker and click the same emoji
    await user.click(screen.getByLabelText('リアクションを追加'))
    await user.click(screen.getByLabelText('リアクション 👍'))

    expect(api.removeReaction).toHaveBeenCalledWith('react-slug', 'card-1', 'p-1', '👍')
  })

  it('shows convert to action item button in DISCUSSION phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    expect(screen.getByLabelText('アクションアイテムに変換')).toBeInTheDocument()
  })

  it('shows convert to action item button in ACTION_ITEMS phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    expect(screen.getByLabelText('アクションアイテムに変換')).toBeInTheDocument()
  })

  it('does NOT show convert to action item button in WRITING phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    expect(screen.queryByLabelText('アクションアイテムに変換')).not.toBeInTheDocument()
  })

  it('does NOT show convert to action item button in VOTING phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'VOTING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: createRemainingVotes({ remaining: 5 }),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    expect(screen.queryByLabelText('アクションアイテムに変換')).not.toBeInTheDocument()
  })

  it('clicking convert to action item button calls api.createActionItem', async () => {
    const user = userEvent.setup()
    const card = createCard({ id: 'card-1', content: '変換テスト', participantId: 'p-1' })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ slug: 'convert-slug', phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    vi.mocked(api.createActionItem).mockResolvedValue(createActionItem())

    render(<CardItem card={card} columnColor="#22c55e" />)

    await user.click(screen.getByLabelText('アクションアイテムに変換'))

    expect(api.createActionItem).toHaveBeenCalledWith('convert-slug', '変換テスト', 'p-1', 'card-1')
  })
})
