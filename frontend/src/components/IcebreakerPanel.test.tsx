import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IcebreakerPanel } from './IcebreakerPanel'
import { useBoardStore } from '../store/boardStore'
import { useToastStore } from '../store/toastStore'
import { createBoard, createParticipant } from '../test/fixtures'
import { api } from '../api/client'
import type { IcebreakerAnswer } from '../types'

vi.mock('../store/boardStore')
vi.mock('../store/toastStore')
vi.mock('../api/client', () => ({
  api: {
    getIcebreaker: vi.fn(),
    setIcebreakerQuestion: vi.fn(),
    submitIcebreakerAnswer: vi.fn(),
    updateIcebreakerAnswer: vi.fn(),
    deleteIcebreakerAnswer: vi.fn(),
  },
}))

function createIcebreakerAnswer(overrides: Partial<IcebreakerAnswer> = {}): IcebreakerAnswer {
  return {
    id: 'ans-1',
    participantId: 'p-1',
    participantNickname: 'TestUser',
    answerText: 'テスト回答',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('IcebreakerPanel', () => {
  const mockSetIcebreaker = vi.fn()
  const mockAddToast = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getIcebreaker).mockResolvedValue({ question: null, answers: [] })
    vi.mocked(useToastStore).mockReturnValue(mockAddToast)
  })

  function setupStore(overrides: {
    board?: ReturnType<typeof createBoard>;
    participant?: ReturnType<typeof createParticipant>;
    icebreakerQuestion?: string | null;
    icebreakerAnswers?: IcebreakerAnswer[];
  } = {}) {
    vi.mocked(useBoardStore).mockReturnValue({
      board: overrides.board ?? createBoard({ phase: 'ICEBREAK', enableIcebreaker: true }),
      participant: overrides.participant ?? createParticipant({ id: 'p-1' }),
      icebreakerQuestion: overrides.icebreakerQuestion ?? null,
      icebreakerAnswers: overrides.icebreakerAnswers ?? [],
      setIcebreaker: mockSetIcebreaker,
    } as unknown as ReturnType<typeof useBoardStore>)
  }

  it('パネルが表示される', () => {
    setupStore()
    render(<IcebreakerPanel />)
    expect(screen.getByTestId('icebreaker-panel')).toBeInTheDocument()
    expect(screen.getByText('アイスブレイク')).toBeInTheDocument()
  })

  it('質問が未設定の場合は待機メッセージが表示される', () => {
    setupStore({ icebreakerQuestion: null })
    render(<IcebreakerPanel />)
    expect(screen.getByText('ファシリテーターが質問を設定するのを待っています...')).toBeInTheDocument()
  })

  it('質問が設定されている場合は質問テキストが表示される', () => {
    setupStore({ icebreakerQuestion: '最近ハマっていることは？' })
    render(<IcebreakerPanel />)
    expect(screen.getByText('最近ハマっていることは？')).toBeInTheDocument()
  })

  it('ファシリテーターにはランダム質問ボタンが表示される', () => {
    setupStore({ participant: createParticipant({ isFacilitator: true }) })
    render(<IcebreakerPanel />)
    expect(screen.getByLabelText('ランダム質問を設定')).toBeInTheDocument()
  })

  it('非ファシリテーターにはランダム質問ボタンが表示されない', () => {
    setupStore({ participant: createParticipant({ isFacilitator: false }) })
    render(<IcebreakerPanel />)
    expect(screen.queryByLabelText('ランダム質問を設定')).not.toBeInTheDocument()
  })

  it('質問が設定されると回答入力欄が表示される', () => {
    setupStore({ icebreakerQuestion: 'テスト質問' })
    render(<IcebreakerPanel />)
    expect(screen.getByLabelText('アイスブレイク回答')).toBeInTheDocument()
  })

  it('既に回答済みの場合は回答入力欄が表示されない', () => {
    setupStore({
      icebreakerQuestion: 'テスト質問',
      icebreakerAnswers: [createIcebreakerAnswer({ participantId: 'p-1' })],
    })
    render(<IcebreakerPanel />)
    expect(screen.queryByLabelText('アイスブレイク回答')).not.toBeInTheDocument()
  })

  it('回答一覧が表示される', () => {
    setupStore({
      icebreakerQuestion: 'テスト質問',
      icebreakerAnswers: [
        createIcebreakerAnswer({ id: 'ans-1', participantNickname: 'Alice', answerText: '回答A' }),
        createIcebreakerAnswer({ id: 'ans-2', participantId: 'p-2', participantNickname: 'Bob', answerText: '回答B' }),
      ],
    })
    render(<IcebreakerPanel />)
    expect(screen.getByText('みんなの回答 (2)')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('回答A')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('回答B')).toBeInTheDocument()
  })

  it('ランダム質問ボタンクリックでAPIが呼ばれる', async () => {
    const user = userEvent.setup()
    vi.mocked(api.setIcebreakerQuestion).mockResolvedValue({ question: '新しい質問', answers: [] })
    setupStore({ participant: createParticipant({ isFacilitator: true }) })
    render(<IcebreakerPanel />)

    await user.click(screen.getByLabelText('ランダム質問を設定'))

    await waitFor(() => {
      expect(api.setIcebreakerQuestion).toHaveBeenCalledWith('test1234', 'p-1', 'RANDOM')
    })
  })

  it('回答を送信するとAPIが呼ばれる', async () => {
    const user = userEvent.setup()
    vi.mocked(api.submitIcebreakerAnswer).mockResolvedValue(createIcebreakerAnswer())
    setupStore({ icebreakerQuestion: 'テスト質問' })
    render(<IcebreakerPanel />)

    const input = screen.getByLabelText('アイスブレイク回答')
    await user.type(input, 'わたしの回答')
    await user.click(screen.getByLabelText('回答を送信'))

    await waitFor(() => {
      expect(api.submitIcebreakerAnswer).toHaveBeenCalledWith('test1234', 'p-1', 'わたしの回答')
    })
  })

  it('自分の回答にのみ編集・削除ボタンが表示される', () => {
    setupStore({
      icebreakerQuestion: 'テスト質問',
      icebreakerAnswers: [
        createIcebreakerAnswer({ id: 'ans-1', participantId: 'p-1', participantNickname: 'Me' }),
        createIcebreakerAnswer({ id: 'ans-2', participantId: 'p-2', participantNickname: 'Other' }),
      ],
    })
    render(<IcebreakerPanel />)

    // 自分の回答 (ans-1) には編集・削除ボタンがある
    const myAnswer = screen.getByTestId('icebreaker-answer-ans-1')
    expect(myAnswer.querySelector('[aria-label="回答を編集"]')).toBeInTheDocument()
    expect(myAnswer.querySelector('[aria-label="回答を削除"]')).toBeInTheDocument()

    // 他人の回答 (ans-2) には編集・削除ボタンがない
    const otherAnswer = screen.getByTestId('icebreaker-answer-ans-2')
    expect(otherAnswer.querySelector('[aria-label="回答を編集"]')).not.toBeInTheDocument()
    expect(otherAnswer.querySelector('[aria-label="回答を削除"]')).not.toBeInTheDocument()
  })

  it('削除ボタンクリックでAPIが呼ばれる', async () => {
    const user = userEvent.setup()
    vi.mocked(api.deleteIcebreakerAnswer).mockResolvedValue(undefined)
    setupStore({
      icebreakerQuestion: 'テスト質問',
      icebreakerAnswers: [createIcebreakerAnswer({ id: 'ans-1', participantId: 'p-1' })],
    })
    render(<IcebreakerPanel />)

    await user.click(screen.getByLabelText('回答を削除'))

    await waitFor(() => {
      expect(api.deleteIcebreakerAnswer).toHaveBeenCalledWith('test1234', 'ans-1', 'p-1')
    })
  })

  it('boardがnullの場合はnullを返す', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: null,
      participant: null,
      icebreakerQuestion: null,
      icebreakerAnswers: [],
      setIcebreaker: mockSetIcebreaker,
    } as unknown as ReturnType<typeof useBoardStore>)
    const { container } = render(<IcebreakerPanel />)
    expect(container.firstChild).toBeNull()
  })
})
