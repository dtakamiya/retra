import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BoardHeader } from './BoardHeader'
import { useBoardStore } from '../store/boardStore'
import { createBoard, createParticipant } from '../test/fixtures'

vi.mock('../store/boardStore')
vi.mock('./PhaseControl', () => ({
  PhaseControl: () => <div data-testid="phase-control">PhaseControl</div>,
}))

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

    const { container } = render(<BoardHeader />)

    expect(container.innerHTML).toBe('')
  })

  it('renders board title', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ title: 'スプリント10 ふりかえり' }),
      participant: createParticipant(),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<BoardHeader />)

    expect(screen.getByText('スプリント10 ふりかえり')).toBeInTheDocument()
  })

  it('renders framework badge', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      board: createBoard({ framework: 'FUN_DONE_LEARN' }),
      participant: createParticipant(),
      setBoard: vi.fn(),
    } as unknown as ReturnType<typeof useBoardStore>)

    render(<BoardHeader />)

    expect(screen.getByText('FUN DONE LEARN')).toBeInTheDocument()
  })

  it('clicking share button copies URL to clipboard and shows "コピーしました！"', async () => {
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

    render(<BoardHeader />)

    // Click the share button (initially shows "共有")
    const shareButton = screen.getByText('共有')
    await user.click(shareButton)

    expect(writeTextMock).toHaveBeenCalledWith(window.location.href)

    await waitFor(() => {
      expect(screen.getByText('コピーしました！')).toBeInTheDocument()
    })
  })
})
