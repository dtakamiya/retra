import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActionItemList } from './ActionItemList'
import { useBoardStore } from '../store/boardStore'
import { createActionItem, createBoard, createParticipant } from '../test/fixtures'

vi.mock('../store/boardStore')
vi.mock('../store/toastStore', () => ({
  useToastStore: vi.fn((selector: (s: { addToast: ReturnType<typeof vi.fn> }) => unknown) =>
    selector({ addToast: vi.fn() })
  ),
}))
vi.mock('../api/client', () => ({
  api: {
    createActionItem: vi.fn(),
    updateActionItem: vi.fn(),
    updateActionItemStatus: vi.fn(),
    deleteActionItem: vi.fn(),
  },
}))

const participants = [
  createParticipant({ id: 'p-1', nickname: 'Alice' }),
  createParticipant({ id: 'p-2', nickname: 'Bob' }),
]

describe('ActionItemList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when board is null', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: null,
      participant: null,
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const { container } = render(
      <ActionItemList actionItems={[]} slug="test-slug" participants={participants} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders heading with ListTodo icon text', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<ActionItemList actionItems={[]} slug="test-slug" participants={participants} />)

    expect(screen.getByText('アクションアイテム')).toBeInTheDocument()
  })

  it('shows count when action items exist', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const items = [
      createActionItem({ id: 'ai-1' }),
      createActionItem({ id: 'ai-2' }),
    ]
    render(<ActionItemList actionItems={items} slug="test-slug" participants={participants} />)

    expect(screen.getByText('(2)')).toBeInTheDocument()
  })

  it('does NOT show count when no action items', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<ActionItemList actionItems={[]} slug="test-slug" participants={participants} />)

    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument()
  })

  it('shows empty message when no action items', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<ActionItemList actionItems={[]} slug="test-slug" participants={participants} />)

    expect(screen.getByText('アクションアイテムはまだありません')).toBeInTheDocument()
  })

  it('renders action items grouped by status', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const items = [
      createActionItem({ id: 'ai-1', content: 'オープンタスク', status: 'OPEN' }),
      createActionItem({ id: 'ai-2', content: '進行中タスク', status: 'IN_PROGRESS' }),
      createActionItem({ id: 'ai-3', content: '完了タスク', status: 'DONE' }),
    ]
    render(<ActionItemList actionItems={items} slug="test-slug" participants={participants} />)

    expect(screen.getByText('オープンタスク')).toBeInTheDocument()
    expect(screen.getByText('進行中タスク')).toBeInTheDocument()
    expect(screen.getByText('完了タスク')).toBeInTheDocument()
    // Status section headers
    expect(screen.getAllByText('未着手').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('進行中').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('完了').length).toBeGreaterThanOrEqual(1)
  })

  it('shows ActionItemForm in ACTION_ITEMS phase', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<ActionItemList actionItems={[]} slug="test-slug" participants={participants} />)

    expect(screen.getByPlaceholderText('アクションアイテムを追加...（Escでクリア）')).toBeInTheDocument()
  })

  it('does NOT show ActionItemForm in CLOSED phase', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'CLOSED' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<ActionItemList actionItems={[]} slug="test-slug" participants={participants} />)

    expect(screen.queryByPlaceholderText('アクションアイテムを追加...（Escでクリア）')).not.toBeInTheDocument()
  })

  it('hides status sections when no items in that status', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'ACTION_ITEMS' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const items = [
      createActionItem({ id: 'ai-1', content: 'オープンのみ', status: 'OPEN' }),
    ]
    render(<ActionItemList actionItems={items} slug="test-slug" participants={participants} />)

    // The section headers for 未着手 should exist (from badge and section),
    // but 進行中 and 完了 section headers should not exist as separate headings
    expect(screen.getByText('オープンのみ')).toBeInTheDocument()
    // Check that section headers for other statuses don't appear as h4
    const headings = screen.queryAllByRole('heading', { level: 4 })
    const headingTexts = headings.map(h => h.textContent)
    expect(headingTexts).not.toContain('進行中')
    expect(headingTexts).not.toContain('完了')
  })
})
