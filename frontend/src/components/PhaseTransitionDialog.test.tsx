import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PhaseTransitionDialog } from './PhaseTransitionDialog'
import { createBoard, createCard, createColumn, createMemo, createParticipant } from '../test/fixtures'

describe('PhaseTransitionDialog', () => {
  const defaultProps = {
    board: createBoard({ phase: 'WRITING' }),
    nextPhase: 'VOTING' as const,
    loading: false,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the dialog with phase transition info', () => {
    render(<PhaseTransitionDialog {...defaultProps} />)

    expect(screen.getByText('フェーズを進めますか？')).toBeInTheDocument()
    expect(screen.getByText('記入')).toBeInTheDocument()
    expect(screen.getByText('投票')).toBeInTheDocument()
  })

  it('displays current board statistics', () => {
    const board = createBoard({
      phase: 'WRITING',
      columns: [
        createColumn({
          id: 'col-1',
          cards: [
            createCard({ id: 'c1', voteCount: 3, memos: [createMemo()] }),
            createCard({ id: 'c2', voteCount: 2 }),
          ],
        }),
        createColumn({
          id: 'col-2',
          cards: [createCard({ id: 'c3', voteCount: 1 })],
        }),
      ],
      participants: [
        createParticipant({ id: 'p-1', isOnline: true }),
        createParticipant({ id: 'p-2', isOnline: false }),
      ],
    })

    render(<PhaseTransitionDialog {...defaultProps} board={board} />)

    expect(screen.getByText('3')).toBeInTheDocument() // totalCards
    expect(screen.getByText('6')).toBeInTheDocument() // totalVotes (3+2+1)
    expect(screen.getByText('1')).toBeInTheDocument() // totalMemos
    expect(screen.getByText('1/2')).toBeInTheDocument() // online/total participants
  })

  it('shows the next phase description', () => {
    render(<PhaseTransitionDialog {...defaultProps} />)

    expect(screen.getByText('参加者がカードに投票できます')).toBeInTheDocument()
  })

  it('shows warning message for the transition', () => {
    render(<PhaseTransitionDialog {...defaultProps} />)

    expect(screen.getByText('記入フェーズが終了し、新しいカードを追加できなくなります')).toBeInTheDocument()
  })

  it('shows CLOSED warning when transitioning to CLOSED', () => {
    render(
      <PhaseTransitionDialog
        {...defaultProps}
        board={createBoard({ phase: 'ACTION_ITEMS' })}
        nextPhase="CLOSED"
      />
    )

    expect(screen.getByText('レトロスペクティブが終了し、スナップショットが自動保存されます')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', () => {
    render(<PhaseTransitionDialog {...defaultProps} />)

    fireEvent.click(screen.getByText('投票へ進む'))

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(<PhaseTransitionDialog {...defaultProps} />)

    fireEvent.click(screen.getByText('キャンセル'))

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when close icon is clicked', () => {
    render(<PhaseTransitionDialog {...defaultProps} />)

    fireEvent.click(screen.getByLabelText('閉じる'))

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when Escape key is pressed', () => {
    render(<PhaseTransitionDialog {...defaultProps} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when backdrop is clicked', () => {
    render(<PhaseTransitionDialog {...defaultProps} />)

    const backdrop = screen.getByRole('dialog')
    fireEvent.click(backdrop)

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('does not call onCancel when dialog content is clicked', () => {
    render(<PhaseTransitionDialog {...defaultProps} />)

    fireEvent.click(screen.getByText('フェーズを進めますか？'))

    expect(defaultProps.onCancel).not.toHaveBeenCalled()
  })

  it('disables buttons when loading', () => {
    render(<PhaseTransitionDialog {...defaultProps} loading={true} />)

    expect(screen.getByText('処理中...')).toBeInTheDocument()
    expect(screen.getByText('処理中...').closest('button')).toBeDisabled()
    expect(screen.getByText('キャンセル').closest('button')).toBeDisabled()
  })

  it('shows correct button label for each phase transition', () => {
    const { rerender } = render(
      <PhaseTransitionDialog
        {...defaultProps}
        board={createBoard({ phase: 'VOTING' })}
        nextPhase="DISCUSSION"
      />
    )
    expect(screen.getByText('議論へ進む')).toBeInTheDocument()

    rerender(
      <PhaseTransitionDialog
        {...defaultProps}
        board={createBoard({ phase: 'DISCUSSION' })}
        nextPhase="ACTION_ITEMS"
      />
    )
    expect(screen.getByText('アクションへ進む')).toBeInTheDocument()

    rerender(
      <PhaseTransitionDialog
        {...defaultProps}
        board={createBoard({ phase: 'ACTION_ITEMS' })}
        nextPhase="CLOSED"
      />
    )
    expect(screen.getByText('完了へ進む')).toBeInTheDocument()
  })

  it('displays zero stats for empty board', () => {
    const emptyBoard = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [] }),
        createColumn({ id: 'col-2', cards: [] }),
        createColumn({ id: 'col-3', cards: [] }),
      ],
    })

    render(<PhaseTransitionDialog {...defaultProps} board={emptyBoard} />)

    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBe(3) // cards, votes, memos
  })

  it('has correct aria attributes', () => {
    render(<PhaseTransitionDialog {...defaultProps} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-label', 'フェーズ遷移の確認')
  })
})
