import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CardItem } from './CardItem'
import { useBoardStore } from '../store/boardStore'
import { api } from '../api/client'
import { createActionItem, createBoard, createCard, createMemo, createParticipant, createReaction, createRemainingVotes, createVote } from '../test/fixtures'

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
    markCardDiscussed: vi.fn(),
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
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: null,
      participant: null,
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const { container } = render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    expect(container.innerHTML).toBe('')
  })

  it('renders card content and author nickname', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    expect(screen.getByText('テストカードの内容')).toBeInTheDocument()
    expect(screen.getByText('TestUser')).toBeInTheDocument()
  })

  it('shows drag handle for author in WRITING phase', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const card = createCard({ participantId: 'p-1' })
    render(<CardItem card={card} columnColor="#22c55e" />)

    expect(screen.getByLabelText('ドラッグして並べ替え')).toBeInTheDocument()
  })

  it('shows drag handle for facilitator in DISCUSSION phase', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-2', isFacilitator: true }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const card = createCard({ participantId: 'p-1' })
    render(<CardItem card={card} columnColor="#22c55e" />)

    expect(screen.getByLabelText('ドラッグして並べ替え')).toBeInTheDocument()
  })

  it('does NOT show drag handle in VOTING phase', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'VOTING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: createRemainingVotes({ remaining: 5 }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    expect(screen.queryByLabelText('ドラッグして並べ替え')).not.toBeInTheDocument()
  })

  it('does NOT show drag handle for non-author in WRITING phase', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-2', isFacilitator: false }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const card = createCard({ participantId: 'p-1' })
    render(<CardItem card={card} columnColor="#22c55e" />)

    expect(screen.queryByLabelText('ドラッグして並べ替え')).not.toBeInTheDocument()
  })

  it('shows vote button in VOTING phase', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'VOTING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: createRemainingVotes({ remaining: 5 }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    expect(screen.getByTestId('vote-button')).toBeInTheDocument()
  })

  it('shows vote count when > 0 in non-voting phase', () => {
    const cardWithVotes = createCard({ voteCount: 3 })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={cardWithVotes} columnColor="#22c55e" />)

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByTestId('vote-badge')).toBeInTheDocument()
  })

  it('shows larger vote badge in DISCUSSION phase', () => {
    const cardWithVotes = createCard({ voteCount: 5 })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={cardWithVotes} columnColor="#22c55e" />)

    const badge = screen.getByTestId('vote-badge')
    expect(badge.className).toContain('text-sm')
  })

  it('shows larger vote badge in CLOSED phase', () => {
    const cardWithVotes = createCard({ voteCount: 2 })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'CLOSED' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={cardWithVotes} columnColor="#22c55e" />)

    const badge = screen.getByTestId('vote-badge')
    expect(badge.className).toContain('text-sm')
  })

  it('shows edit/delete buttons for author in WRITING phase', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const card = createCard({ participantId: 'p-1' })
    render(<CardItem card={card} columnColor="#22c55e" />)

    expect(screen.getByLabelText('カードを編集')).toBeInTheDocument()
    expect(screen.getByLabelText('カードを削除')).toBeInTheDocument()
  })

  it('shows delete (not edit) button for facilitator who is not author in WRITING phase', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-2', isFacilitator: true }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const card = createCard({ participantId: 'p-1' })
    render(<CardItem card={card} columnColor="#22c55e" />)

    expect(screen.getByLabelText('カードを削除')).toBeInTheDocument()
    expect(screen.queryByLabelText('カードを編集')).not.toBeInTheDocument()
  })

  it('does NOT show edit/delete buttons for non-author non-facilitator', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-2', isFacilitator: false }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const card = createCard({ participantId: 'p-1' })
    render(<CardItem card={card} columnColor="#22c55e" />)

    expect(screen.queryByLabelText('カードを編集')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('カードを削除')).not.toBeInTheDocument()
  })

  it('clicking edit button shows textarea with current content', async () => {
    const user = userEvent.setup()
    const card = createCard({ content: '編集テスト', participantId: 'p-1' })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={card} columnColor="#22c55e" />)

    await user.click(screen.getByLabelText('カードを編集'))

    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveValue('編集テスト')
    expect(screen.getByText('保存')).toBeInTheDocument()
    expect(screen.getByText('キャンセル')).toBeInTheDocument()
  })

  it('saving edited content calls api.updateCard', async () => {
    const user = userEvent.setup()
    const card = createCard({ content: '元の内容', participantId: 'p-1' })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ slug: 'test-slug', phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    vi.mocked(api.updateCard).mockResolvedValue(createCard({ content: '新しい内容' }))

    render(<CardItem card={card} columnColor="#22c55e" />)

    await user.click(screen.getByLabelText('カードを編集'))

    const textarea = screen.getByRole('textbox')
    await user.clear(textarea)
    await user.type(textarea, '新しい内容')

    await user.click(screen.getByText('保存'))

    expect(api.updateCard).toHaveBeenCalledWith('test-slug', 'card-1', '新しい内容', 'p-1')
  })

  it('pressing Enter in textarea calls api.updateCard', async () => {
    const user = userEvent.setup()
    const card = createCard({ content: 'Enter保存テスト', participantId: 'p-1' })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ slug: 'test-slug', phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    vi.mocked(api.updateCard).mockResolvedValue(createCard({ content: 'Enter保存テスト' }))

    render(<CardItem card={card} columnColor="#22c55e" />)

    await user.click(screen.getByLabelText('カードを編集'))

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, '{Enter}')

    expect(api.updateCard).toHaveBeenCalledWith('test-slug', 'card-1', 'Enter保存テスト', 'p-1')
  })

  it('pressing Escape in textarea cancels editing', async () => {
    const user = userEvent.setup()
    const card = createCard({ content: 'Escキャンセルテスト', participantId: 'p-1' })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={card} columnColor="#22c55e" />)

    await user.click(screen.getByLabelText('カードを編集'))

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, '変更内容')
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText('Escキャンセルテスト')).toBeInTheDocument()
  })

  it('clicking cancel button reverts content and exits edit mode', async () => {
    const user = userEvent.setup()
    const card = createCard({ content: 'キャンセルテスト', participantId: 'p-1' })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={card} columnColor="#22c55e" />)

    await user.click(screen.getByLabelText('カードを編集'))

    const textarea = screen.getByRole('textbox')
    await user.clear(textarea)
    await user.type(textarea, '変更内容')
    await user.click(screen.getByText('キャンセル'))

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText('キャンセルテスト')).toBeInTheDocument()
  })

  it('clicking vote button in VOTING phase calls api.addVote', async () => {
    const user = userEvent.setup()
    const card = createCard({ voteCount: 0, participantId: 'p-1' })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ slug: 'vote-slug', phase: 'VOTING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: createRemainingVotes({ remaining: 3 }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    vi.mocked(api.addVote).mockResolvedValue(createVote({ cardId: 'card-1', participantId: 'p-1' }))

    render(<CardItem card={card} columnColor="#22c55e" />)

    await user.click(screen.getByTestId('vote-button'))

    expect(api.addVote).toHaveBeenCalledWith('vote-slug', 'card-1', 'p-1')
  })

  it('clicking vote button when user has voted calls api.removeVote', async () => {
    const user = userEvent.setup()
    const card = createCard({ voteCount: 2, votedParticipantIds: ['p-1', 'p-2'], participantId: 'p-1' })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ slug: 'vote-slug', phase: 'VOTING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: createRemainingVotes({ remaining: 3 }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    vi.mocked(api.removeVote).mockResolvedValue(undefined)

    render(<CardItem card={card} columnColor="#22c55e" />)

    await user.click(screen.getByTestId('vote-button'))

    expect(api.removeVote).toHaveBeenCalledWith('vote-slug', 'card-1', 'p-1')
  })

  it('clicking delete button calls api.deleteCard', async () => {
    const user = userEvent.setup()
    const card = createCard({ participantId: 'p-1' })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ slug: 'del-slug', phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    vi.mocked(api.deleteCard).mockResolvedValue(undefined)

    render(<CardItem card={card} columnColor="#22c55e" />)

    await user.click(screen.getByLabelText('カードを削除'))

    expect(api.deleteCard).toHaveBeenCalledWith('del-slug', 'card-1', 'p-1')
  })

  it('renders with isOverlay style', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const { container } = render(<CardItem card={defaultCard} columnColor="#22c55e" isOverlay />)

    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('ring-2')
    expect(card.className).toContain('ring-indigo-300')
  })

  it('shows reaction picker button', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

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

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={cardWithReactions} columnColor="#22c55e" />)

    expect(screen.getByText('2')).toBeInTheDocument() // 👍 count
    expect(screen.getByText('1')).toBeInTheDocument() // ❤️ count
  })

  it('clicking reaction picker opens emoji selector and calls api.addReaction', async () => {
    const user = userEvent.setup()

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ slug: 'react-slug', phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

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

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ slug: 'react-slug', phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    vi.mocked(api.removeReaction).mockResolvedValue(undefined)

    render(<CardItem card={cardWithReaction} columnColor="#22c55e" />)

    // Open reaction picker and click the same emoji
    await user.click(screen.getByLabelText('リアクションを追加'))
    await user.click(screen.getByLabelText('リアクション 👍'))

    expect(api.removeReaction).toHaveBeenCalledWith('react-slug', 'card-1', 'p-1', '👍')
  })

  it('shows convert to action item button in DISCUSSION phase', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    expect(screen.getByLabelText('アクションアイテムに変換')).toBeInTheDocument()
  })

  it('shows convert to action item button in ACTION_ITEMS phase', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    expect(screen.getByLabelText('アクションアイテムに変換')).toBeInTheDocument()
  })

  it('does NOT show convert to action item button in WRITING phase', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    expect(screen.queryByLabelText('アクションアイテムに変換')).not.toBeInTheDocument()
  })

  it('does NOT show convert to action item button in VOTING phase', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'VOTING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: createRemainingVotes({ remaining: 5 }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={defaultCard} columnColor="#22c55e" />)

    expect(screen.queryByLabelText('アクションアイテムに変換')).not.toBeInTheDocument()
  })

  it('clicking convert to action item button calls api.createActionItem', async () => {
    const user = userEvent.setup()
    const card = createCard({ id: 'card-1', content: '変換テスト', participantId: 'p-1' })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ slug: 'convert-slug', phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    vi.mocked(api.createActionItem).mockResolvedValue(createActionItem())

    render(<CardItem card={card} columnColor="#22c55e" />)

    await user.click(screen.getByLabelText('アクションアイテムに変換'))

    expect(api.createActionItem).toHaveBeenCalledWith('convert-slug', '変換テスト', 'p-1', 'card-1')
  })

  it('clicking card text opens detail modal', async () => {
    const user = userEvent.setup()

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={defaultCard} columnColor="#22c55e" columnName="Keep" />)

    await user.click(screen.getByLabelText('カード詳細を表示'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows character counter in edit mode', async () => {
    const user = userEvent.setup()
    const card = createCard({ content: 'テスト', participantId: 'p-1' })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={card} columnColor="#22c55e" />)

    await user.click(screen.getByLabelText('カードを編集'))

    expect(screen.getByText('3/2000')).toBeInTheDocument()
  })

  // --- isDiscussed ---

  it('applies opacity-50 style when card is discussed', () => {
    const card = createCard({ participantId: 'p-1', isDiscussed: true })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const { container } = render(<CardItem card={card} columnColor="#22c55e" />)

    const cardEl = container.firstElementChild as HTMLElement
    expect(cardEl.className).toContain('opacity-50')
  })

  it('does NOT apply opacity-50 when card is not discussed', () => {
    const card = createCard({ participantId: 'p-1', isDiscussed: false })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const { container } = render(<CardItem card={card} columnColor="#22c55e" />)

    const cardEl = container.firstElementChild as HTMLElement
    expect(cardEl.className).not.toContain('opacity-50')
  })

  it('shows discussion mark button for facilitator in DISCUSSION phase', () => {
    const card = createCard({ participantId: 'p-1', isDiscussed: false })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={card} columnColor="#22c55e" />)

    const btn = screen.getByLabelText('議論済みにマーク')
    expect(btn).toBeInTheDocument()
    expect(btn).not.toBeDisabled()
  })

  it('shows discussion mark button as disabled for non-facilitator in DISCUSSION phase', () => {
    const card = createCard({ participantId: 'p-2', isDiscussed: false })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-2', isFacilitator: false }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={card} columnColor="#22c55e" />)

    const btn = screen.getByLabelText('議論済みにマーク')
    expect(btn).toBeDisabled()
  })

  it('does NOT show discussion mark button in WRITING phase', () => {
    const card = createCard({ participantId: 'p-1' })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={card} columnColor="#22c55e" />)

    expect(screen.queryByLabelText('議論済みにマーク')).not.toBeInTheDocument()
  })

  it('clicking discussion mark button calls api.markCardDiscussed', async () => {
    const user = userEvent.setup()
    const card = createCard({ participantId: 'p-1', isDiscussed: false })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)
    vi.mocked(api.markCardDiscussed).mockResolvedValue(undefined as never)

    render(<CardItem card={card} columnColor="#22c55e" />)

    await user.click(screen.getByLabelText('議論済みにマーク'))

    expect(api.markCardDiscussed).toHaveBeenCalledWith('test1234', 'card-1', 'p-1', true)
  })

  // --- isAnonymous ---

  it('shows "匿名" label instead of author name when board is anonymous and authorNickname is null', () => {
    const card = createCard({ participantId: 'p-2', authorNickname: null as unknown as string })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ isAnonymous: true }),
      participant: createParticipant({ id: 'p-2' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={card} columnColor="#22c55e" />)

    expect(screen.getByText('匿名')).toBeInTheDocument()
    expect(screen.queryByText('TestUser')).not.toBeInTheDocument()
  })

  it('shows author name when board is not anonymous', () => {
    const card = createCard({ participantId: 'p-1', authorNickname: 'TestUser' })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ isAnonymous: false }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={card} columnColor="#22c55e" />)

    expect(screen.getByText('TestUser')).toBeInTheDocument()
    expect(screen.queryByText('匿名')).not.toBeInTheDocument()
  })

  // --- remainingVotes = 0 ---

  it('disables vote button when remainingVotes is 0 and user has not voted', () => {
    const card = createCard({ participantId: 'p-2', voteCount: 0, votedParticipantIds: [] })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'VOTING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: createRemainingVotes({ remaining: 0, used: 5 }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={card} columnColor="#22c55e" />)

    const voteBtn = screen.getByTestId('vote-button')
    expect(voteBtn).toBeDisabled()
  })

  it('allows unvote even when remainingVotes is 0 (already voted)', () => {
    const card = createCard({ participantId: 'p-2', voteCount: 1, votedParticipantIds: ['p-1'] })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'VOTING' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: false }),
      remainingVotes: createRemainingVotes({ remaining: 0, used: 5 }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<CardItem card={card} columnColor="#22c55e" />)

    const voteBtn = screen.getByTestId('vote-button')
    expect(voteBtn).not.toBeDisabled()
  })

  it('auto-expands memos when transitioning to DISCUSSION phase with memos', () => {
    const card = createCard({
      participantId: 'p-1',
      memos: [createMemo()],
    })

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const { rerender } = render(<CardItem card={card} columnColor="#22c55e" />)

    // Transition to DISCUSSION phase
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
      remainingVotes: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    rerender(<CardItem card={{ ...card }} columnColor="#22c55e" />)

    // Memo content should be visible (auto-expanded)
    expect(screen.getByText('Test memo content')).toBeInTheDocument()
  })
})
