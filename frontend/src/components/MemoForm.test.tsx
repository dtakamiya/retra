import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoForm } from './MemoForm'
import { useBoardStore } from '../store/boardStore'
import { api } from '../api/client'
import { createBoard, createParticipant } from '../test/fixtures'

vi.mock('../store/boardStore')
vi.mock('../api/client', () => ({
  api: {
    createMemo: vi.fn(),
  },
}))

describe('MemoForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when board or participant is null', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: null,
      participant: null,
    };
      return typeof selector === 'function' ? (selector as (s: typeof s) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const { container } = render(<MemoForm cardId="card-1" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders textarea and send button', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
    };
      return typeof selector === 'function' ? (selector as (s: typeof s) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<MemoForm cardId="card-1" />)

    expect(screen.getByPlaceholderText('メモを追加...（Escでクリア）')).toBeInTheDocument()
    expect(screen.getByLabelText('メモを送信')).toBeInTheDocument()
  })

  it('send button is disabled when content is empty', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
    };
      return typeof selector === 'function' ? (selector as (s: typeof s) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<MemoForm cardId="card-1" />)

    expect(screen.getByLabelText('メモを送信')).toBeDisabled()
  })

  it('clicking send calls api.createMemo and clears input', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ slug: 'test-slug', phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
    };
      return typeof selector === 'function' ? (selector as (s: typeof s) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)
    vi.mocked(api.createMemo).mockResolvedValue({
      id: 'memo-1', cardId: 'card-1', content: 'メモ内容',
      authorNickname: 'TestUser', participantId: 'p-1',
      createdAt: '', updatedAt: '',
    })

    render(<MemoForm cardId="card-1" />)

    const textarea = screen.getByPlaceholderText('メモを追加...（Escでクリア）')
    await user.type(textarea, 'メモ内容')
    await user.click(screen.getByLabelText('メモを送信'))

    expect(api.createMemo).toHaveBeenCalledWith('test-slug', 'card-1', 'メモ内容', 'p-1')
    expect(textarea).toHaveValue('')
  })

  it('pressing Escape clears content and blurs textarea', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ slug: 'test-slug', phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
    };
      return typeof selector === 'function' ? (selector as (s: typeof s) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<MemoForm cardId="card-1" />)

    const textarea = screen.getByPlaceholderText('メモを追加...（Escでクリア）')
    await user.type(textarea, '入力中のメモ')
    expect(textarea).toHaveValue('入力中のメモ')

    await user.type(textarea, '{Escape}')
    expect(textarea).toHaveValue('')
    expect(textarea).not.toHaveFocus()
  })

  it('pressing Enter submits the memo', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ slug: 'test-slug', phase: 'DISCUSSION' }),
      participant: createParticipant({ id: 'p-1' }),
    };
      return typeof selector === 'function' ? (selector as (s: typeof s) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)
    vi.mocked(api.createMemo).mockResolvedValue({
      id: 'memo-1', cardId: 'card-1', content: 'Enter送信',
      authorNickname: 'TestUser', participantId: 'p-1',
      createdAt: '', updatedAt: '',
    })

    render(<MemoForm cardId="card-1" />)

    const textarea = screen.getByPlaceholderText('メモを追加...（Escでクリア）')
    await user.type(textarea, 'Enter送信')
    await user.type(textarea, '{Enter}')

    expect(api.createMemo).toHaveBeenCalledWith('test-slug', 'card-1', 'Enter送信', 'p-1')
  })
})
