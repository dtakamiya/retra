import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { BoardHeader } from './BoardHeader'
import { useBoardStore } from '../store/boardStore'
import { createBoard, createCard, createColumn, createParticipant } from '../test/fixtures'

vi.mock('../store/boardStore')
vi.mock('./PhaseControl', () => ({
  PhaseControl: () => <div data-testid="phase-control">PhaseControl</div>,
}))

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('BoardHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when board is null', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: null,
      participant: null,
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    const { container } = render(
      <BoardHeader isKudosOpen={false} kudosCount={0} onKudosToggle={vi.fn()} />
    )

    expect(container.innerHTML).toBe('')
  })

  it('renders board title', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ title: 'スプリント10 ふりかえり' }),
      participant: createParticipant(),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    renderWithRouter(
      <BoardHeader isKudosOpen={false} kudosCount={0} onKudosToggle={vi.fn()} />
    )

    expect(screen.getByText('スプリント10 ふりかえり')).toBeInTheDocument()
  })

  it('renders framework badge', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ framework: 'FUN_DONE_LEARN' }),
      participant: createParticipant(),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    renderWithRouter(
      <BoardHeader isKudosOpen={false} kudosCount={0} onKudosToggle={vi.fn()} />
    )

    expect(screen.getByText('FUN DONE LEARN')).toBeInTheDocument()
  })

  it('clicking share button copies URL to clipboard and shows "コピー済み"', async () => {
    const user = userEvent.setup()

    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    })

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ title: 'テストボード' }),
      participant: createParticipant(),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    renderWithRouter(
      <BoardHeader isKudosOpen={false} kudosCount={0} onKudosToggle={vi.fn()} />
    )

    // Click the share button (initially shows "共有")
    const shareButton = screen.getByText('共有')
    await user.click(shareButton)

    expect(writeTextMock).toHaveBeenCalledWith(window.location.href)

    await waitFor(() => {
      expect(screen.getByText('コピー済み')).toBeInTheDocument()
    })
  })

  it('shows overall discussion progress in DISCUSSION phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({
        phase: 'DISCUSSION',
        columns: [
          createColumn({
            id: 'col-1',
            cards: [
              createCard({ id: 'c1', isDiscussed: true }),
              createCard({ id: 'c2', isDiscussed: false }),
            ],
          }),
        ],
      }),
      participant: createParticipant(),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    renderWithRouter(
      <BoardHeader isKudosOpen={false} kudosCount={0} onKudosToggle={vi.fn()} />
    )

    expect(screen.getByText('議論済み')).toBeInTheDocument()
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('does NOT show discussion progress in WRITING phase', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ phase: 'WRITING' }),
      participant: createParticipant(),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    renderWithRouter(
      <BoardHeader isKudosOpen={false} kudosCount={0} onKudosToggle={vi.fn()} />
    )

    expect(screen.queryByText('議論済み')).not.toBeInTheDocument()
  })

  it('Kudosボタンが表示される', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ title: 'テストボード' }),
      participant: createParticipant(),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    renderWithRouter(
      <BoardHeader isKudosOpen={false} kudosCount={0} onKudosToggle={vi.fn()} />
    )

    expect(screen.getByLabelText('Kudos')).toBeInTheDocument()
  })

  it('Kudosカウントが0の場合バッジが表示されない', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ title: 'テストボード' }),
      participant: createParticipant(),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    renderWithRouter(
      <BoardHeader isKudosOpen={false} kudosCount={0} onKudosToggle={vi.fn()} />
    )

    const kudosButton = screen.getByLabelText('Kudos')
    expect(kudosButton).toBeInTheDocument()
    expect(kudosButton.textContent).not.toMatch(/\d+/)
  })

  it('Kudosカウントが1以上の場合バッジが表示される', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ title: 'テストボード' }),
      participant: createParticipant(),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    renderWithRouter(
      <BoardHeader isKudosOpen={false} kudosCount={5} onKudosToggle={vi.fn()} />
    )

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('KudosボタンクリックでonKudosToggleが呼ばれる', async () => {
    const user = userEvent.setup()
    const onKudosToggle = vi.fn()

    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ title: 'テストボード' }),
      participant: createParticipant(),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    renderWithRouter(
      <BoardHeader isKudosOpen={false} kudosCount={0} onKudosToggle={onKudosToggle} />
    )

    await user.click(screen.getByLabelText('Kudos'))
    expect(onKudosToggle).toHaveBeenCalled()
  })
})
