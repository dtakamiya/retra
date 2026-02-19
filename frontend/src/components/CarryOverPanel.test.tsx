import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CarryOverPanel } from './CarryOverPanel'
import { useBoardStore } from '../store/boardStore'
import { createBoard, createCarryOverItem, createParticipant } from '../test/fixtures'

vi.mock('../store/boardStore')
vi.mock('../api/client', () => ({
  api: {
    updateCarryOverItemStatus: vi.fn(),
  },
}))

describe('CarryOverPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('teamName未設定の場合は何も表示しない', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ teamName: null }),
      participant: createParticipant(),
      carryOverItems: [],
      carryOverTeamName: '',
      updateCarryOverItemStatus: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    const { container } = render(<CarryOverPanel />)
    expect(container.innerHTML).toBe('')
  })

  it('ヘッダーに件数バッジを表示する', () => {
    const items = [
      createCarryOverItem({ id: 'co-1' }),
      createCarryOverItem({ id: 'co-2' }),
    ]
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ teamName: 'Team Alpha' }),
      participant: createParticipant(),
      carryOverItems: items,
      carryOverTeamName: 'Team Alpha',
      updateCarryOverItemStatus: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CarryOverPanel />)
    expect(screen.getByText('前回のアクションアイテム')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('アイテムの内容と優先度を表示する', () => {
    const items = [
      createCarryOverItem({ id: 'co-1', content: 'テストアイテム', priority: 'HIGH', assigneeNickname: 'Alice' }),
    ]
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ teamName: 'Team Alpha' }),
      participant: createParticipant(),
      carryOverItems: items,
      carryOverTeamName: 'Team Alpha',
      updateCarryOverItemStatus: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CarryOverPanel />)
    expect(screen.getByText('テストアイテム')).toBeInTheDocument()
    expect(screen.getByText('高')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('折りたたみトグルが動作する', async () => {
    const user = userEvent.setup()
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ teamName: 'Team Alpha' }),
      participant: createParticipant(),
      carryOverItems: [],
      carryOverTeamName: 'Team Alpha',
      updateCarryOverItemStatus: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CarryOverPanel />)

    // 初期状態は展開されている
    expect(screen.getByText('未完了のアクションアイテムはありません')).toBeInTheDocument()

    // 折りたたみ
    const toggleButton = screen.getByRole('button', { name: /前回のアクションアイテム/ })
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
    await user.click(toggleButton)

    expect(screen.queryByText('未完了のアクションアイテムはありません')).not.toBeInTheDocument()
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

    // 再展開
    await user.click(toggleButton)

    expect(screen.getByText('未完了のアクションアイテムはありません')).toBeInTheDocument()
  })

  it('0件の場合にメッセージを表示する', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ teamName: 'Team Alpha' }),
      participant: createParticipant(),
      carryOverItems: [],
      carryOverTeamName: 'Team Alpha',
      updateCarryOverItemStatus: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CarryOverPanel />)
    expect(screen.getByText('未完了のアクションアイテムはありません')).toBeInTheDocument()
  })

  it('ファシリテーターにはステータスselectを表示する', () => {
    const items = [
      createCarryOverItem({ id: 'co-1', content: 'テストアイテム', status: 'OPEN' }),
    ]
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ teamName: 'Team Alpha' }),
      participant: createParticipant({ isFacilitator: true }),
      carryOverItems: items,
      carryOverTeamName: 'Team Alpha',
      updateCarryOverItemStatus: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CarryOverPanel />)
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue('OPEN')
  })

  it('ステータス変更失敗時にエラートーストを表示する', async () => {
    const user = userEvent.setup()
    const { api } = await import('../api/client')
    vi.mocked(api.updateCarryOverItemStatus).mockRejectedValue(new Error('API error'))

    const items = [
      createCarryOverItem({ id: 'co-1', content: 'テストアイテム', status: 'OPEN' }),
    ]
    const updateCarryOverItemStatus = vi.fn()
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ teamName: 'Team Alpha' }),
      participant: createParticipant({ isFacilitator: true }),
      carryOverItems: items,
      carryOverTeamName: 'Team Alpha',
      updateCarryOverItemStatus,
    } as unknown as ReturnType<typeof useBoardStore>)

    // Spy on useToastStore
    const { useToastStore } = await import('../store/toastStore')
    const addToast = vi.fn()
    const originalImpl = useToastStore.getState().addToast
    useToastStore.setState({ addToast })

    render(<CarryOverPanel />)

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'DONE')

    // Should show error toast
    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('error', 'ステータスの変更に失敗しました')
    })

    // Should NOT call optimistic update
    expect(updateCarryOverItemStatus).not.toHaveBeenCalled()

    // Restore
    useToastStore.setState({ addToast: originalImpl })
  })

  it('非ファシリテーターにはステータスバッジを表示する', () => {
    const items = [
      createCarryOverItem({ id: 'co-1', content: 'テストアイテム', status: 'OPEN' }),
    ]
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ teamName: 'Team Alpha' }),
      participant: createParticipant({ isFacilitator: false }),
      carryOverItems: items,
      carryOverTeamName: 'Team Alpha',
      updateCarryOverItemStatus: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<CarryOverPanel />)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByText('未着手')).toBeInTheDocument()
  })
})
