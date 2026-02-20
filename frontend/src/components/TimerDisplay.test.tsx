import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimerDisplay } from './TimerDisplay'
import { useBoardStore } from '../store/boardStore'
import { api } from '../api/client'
import { createBoard, createParticipant, createTimerState } from '../test/fixtures'

vi.mock('../store/boardStore')
vi.mock('../api/client', () => ({
  api: {
    controlTimer: vi.fn(),
    getTimerState: vi.fn(),
  },
}))

describe('TimerDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when board or participant is null', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: null,
      participant: null,
      timer: createTimerState(),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    const { container } = render(<TimerDisplay />)

    expect(container.innerHTML).toBe('')
  })

  it('shows "--:--" when totalSeconds is 0', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard(),
      participant: createParticipant(),
      timer: createTimerState({ totalSeconds: 0, remainingSeconds: 0, isRunning: false }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<TimerDisplay />)

    expect(screen.getByText('--:--')).toBeInTheDocument()
  })

  it('shows formatted time when timer is set', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard(),
      participant: createParticipant(),
      timer: createTimerState({ totalSeconds: 300, remainingSeconds: 300, isRunning: true }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<TimerDisplay />)

    expect(screen.getByText('05:00')).toBeInTheDocument()
  })

  it('shows "時間切れ！" when expired', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard(),
      participant: createParticipant(),
      timer: createTimerState({ totalSeconds: 300, remainingSeconds: 0, isRunning: false }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<TimerDisplay />)

    expect(screen.getByText('時間切れ！')).toBeInTheDocument()
  })

  it('shows start button for facilitator when timer is not running', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard(),
      participant: createParticipant({ isFacilitator: true }),
      timer: createTimerState({ totalSeconds: 0, remainingSeconds: 0, isRunning: false }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<TimerDisplay />)

    expect(screen.getByRole('button', { name: /開始/ })).toBeInTheDocument()
  })

  it('compact mode shows time inline', () => {
    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard(),
      participant: createParticipant(),
      timer: createTimerState({ totalSeconds: 300, remainingSeconds: 180, isRunning: true }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<TimerDisplay compact />)

    expect(screen.getByText('03:00')).toBeInTheDocument()
    // In compact mode, "タイマー" heading should not be shown
    expect(screen.queryByText('タイマー')).not.toBeInTheDocument()
  })

  it('facilitator clicking "開始" shows duration picker', async () => {
    const user = userEvent.setup()

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard(),
      participant: createParticipant({ isFacilitator: true }),
      timer: createTimerState({ totalSeconds: 0, remainingSeconds: 0, isRunning: false }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<TimerDisplay />)

    // Click the "開始" button to open duration picker
    await user.click(screen.getByRole('button', { name: /開始/ }))

    // Duration picker should now show a number input and "開始" + "キャンセル" buttons
    expect(screen.getByRole('spinbutton')).toBeInTheDocument()
    expect(screen.getByText('分')).toBeInTheDocument()
    expect(screen.getByText('キャンセル')).toBeInTheDocument()
  })

  it('facilitator setting duration and clicking "開始" in picker calls api.controlTimer', async () => {
    const user = userEvent.setup()

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ slug: 'timer-slug' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
      timer: createTimerState({ totalSeconds: 0, remainingSeconds: 0, isRunning: false }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    vi.mocked(api.controlTimer).mockResolvedValue(createTimerState())

    render(<TimerDisplay />)

    // Click "開始" to show duration picker
    await user.click(screen.getByRole('button', { name: /開始/ }))

    // Change duration to 10 minutes — select all text first, then type the new value
    const input = screen.getByRole('spinbutton')
    await user.tripleClick(input)
    await user.keyboard('10')

    // Click "開始" in the duration picker
    await user.click(screen.getByText('開始'))

    expect(api.controlTimer).toHaveBeenCalledWith('timer-slug', 'START', 'p-1', 600)
  })

  it('facilitator clicking "キャンセル" in duration picker hides it', async () => {
    const user = userEvent.setup()

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard(),
      participant: createParticipant({ isFacilitator: true }),
      timer: createTimerState({ totalSeconds: 0, remainingSeconds: 0, isRunning: false }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    render(<TimerDisplay />)

    // Click "開始" to show duration picker
    await user.click(screen.getByRole('button', { name: /開始/ }))

    // Verify picker is shown
    expect(screen.getByRole('spinbutton')).toBeInTheDocument()

    // Click "キャンセル"
    await user.click(screen.getByText('キャンセル'))

    // Picker should be hidden, back to showing "開始" button
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /開始/ })).toBeInTheDocument()
  })

  it('facilitator clicking "一時停止" when running calls api.controlTimer with PAUSE', async () => {
    const user = userEvent.setup()

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ slug: 'timer-slug' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
      timer: createTimerState({ totalSeconds: 300, remainingSeconds: 180, isRunning: true }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    vi.mocked(api.controlTimer).mockResolvedValue(createTimerState())

    render(<TimerDisplay />)

    await user.click(screen.getByRole('button', { name: /一時停止/ }))

    expect(api.controlTimer).toHaveBeenCalledWith('timer-slug', 'PAUSE', 'p-1')
  })

  it('facilitator clicking "再開" when paused calls api.controlTimer with RESUME', async () => {
    const user = userEvent.setup()

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ slug: 'timer-slug' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
      timer: createTimerState({ totalSeconds: 300, remainingSeconds: 120, isRunning: false }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    vi.mocked(api.controlTimer).mockResolvedValue(createTimerState())

    render(<TimerDisplay />)

    await user.click(screen.getByRole('button', { name: /再開/ }))

    expect(api.controlTimer).toHaveBeenCalledWith('timer-slug', 'RESUME', 'p-1')
  })

  it('facilitator clicking reset button calls api.controlTimer with RESET', async () => {
    const user = userEvent.setup()

    vi.mocked(useBoardStore).mockImplementation(((selector?: unknown) => {
      const s = {
      board: createBoard({ slug: 'timer-slug' }),
      participant: createParticipant({ id: 'p-1', isFacilitator: true }),
      timer: createTimerState({ totalSeconds: 300, remainingSeconds: 120, isRunning: false }),
    };
      return typeof selector === 'function' ? (selector as (state: unknown) => unknown)(s) : s;
    }) as unknown as typeof useBoardStore)

    vi.mocked(api.controlTimer).mockResolvedValue(createTimerState())

    render(<TimerDisplay />)

    // Reset button shows the RotateCcw icon without text — it's the last button in the flex container
    const buttons = screen.getAllByRole('button')
    // "再開" is the first button, reset is the second
    const resetButton = buttons[buttons.length - 1]
    await user.click(resetButton)

    expect(api.controlTimer).toHaveBeenCalledWith('timer-slug', 'RESET', 'p-1')
  })
})
