import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CardItem } from './CardItem'
import { useBoardStore } from '../store/boardStore'
import { api } from '../api/client'
import { createBoard, createCard, createParticipant, createRemainingVotes } from '../test/fixtures'

vi.mock('../store/boardStore')
vi.mock('../api/client', () => ({
  api: {
    addVote: vi.fn(),
    removeVote: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
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

    const voteButton = screen.getByRole('button')
    expect(voteButton).toBeInTheDocument()
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
  })

  it('shows edit/delete buttons for author in WRITING phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    const card = createCard({ participantId: 'p-1' })
    render(<CardItem card={card} columnColor="#22c55e" />)

    // drag handle + edit (Pencil) + delete (Trash2) buttons
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(3)
  })

  it('shows delete (not edit) button for facilitator who is not author in WRITING phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-2', isFacilitator: true }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    const card = createCard({ participantId: 'p-1' })
    render(<CardItem card={card} columnColor="#22c55e" />)

    // Only delete button, not edit (since facilitator is not the author)
    // No drag handle because isAuthor is false and phase is WRITING (isDndEnabled = isWriting && isAuthor)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(1)
  })

  it('does NOT show edit/delete buttons for non-author non-facilitator', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-2', isFacilitator: false }),
      remainingVotes: null,
    } as unknown as ReturnType<typeof useBoardStore>)

    const card = createCard({ participantId: 'p-1' })
    render(<CardItem card={card} columnColor="#22c55e" />)

    expect(screen.queryAllByRole('button')).toHaveLength(0)
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

    vi.mocked(api.addVote).mockResolvedValue(createCard({ voteCount: 1 }))

    render(<CardItem card={card} columnColor="#22c55e" />)

    const voteButton = screen.getByRole('button')
    await user.click(voteButton)

    expect(api.addVote).toHaveBeenCalledWith('vote-slug', 'card-1', 'p-1')
  })

  it('clicking vote button when voteCount > 0 calls api.removeVote', async () => {
    const user = userEvent.setup()
    const card = createCard({ voteCount: 2, participantId: 'p-1' })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ slug: 'vote-slug', phase: 'VOTING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: createRemainingVotes({ remaining: 3 }),
    } as unknown as ReturnType<typeof useBoardStore>)

    vi.mocked(api.removeVote).mockResolvedValue(undefined)

    render(<CardItem card={card} columnColor="#22c55e" />)

    const voteButton = screen.getByRole('button')
    await user.click(voteButton)

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

    // For author in WRITING phase, buttons are: drag handle, edit (Pencil), delete (Trash2)
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
})
