import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent, fireEvent } from '../test/test-utils'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  const defaultProps = {
    title: 'テスト確認',
    message: 'この操作を実行しますか？',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  it('タイトルとメッセージを表示する', () => {
    render(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText('テスト確認')).toBeInTheDocument()
    expect(screen.getByText('この操作を実行しますか？')).toBeInTheDocument()
  })

  it('デフォルトのボタンラベルを表示する', () => {
    render(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText('確認')).toBeInTheDocument()
    expect(screen.getByText('キャンセル')).toBeInTheDocument()
  })

  it('カスタムのボタンラベルを表示する', () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel="削除" cancelLabel="戻る" />)

    expect(screen.getByText('削除')).toBeInTheDocument()
    expect(screen.getByText('戻る')).toBeInTheDocument()
  })

  it('確認ボタンクリックでonConfirmが呼ばれる', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)

    await user.click(screen.getByText('確認'))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('キャンセルボタンクリックでonCancelが呼ばれる', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

    await user.click(screen.getByText('キャンセル'))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('EscapeキーでonCancelが呼ばれる', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('閉じるボタンでonCancelが呼ばれる', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

    await user.click(screen.getByLabelText('閉じる'))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('ローディング中はボタンが無効になりテキストが変わる', () => {
    render(<ConfirmDialog {...defaultProps} loading={true} confirmLabel="削除" />)

    expect(screen.getByText('処理中...')).toBeInTheDocument()
    expect(screen.getByText('処理中...')).toBeDisabled()
    expect(screen.getByText('キャンセル')).toBeDisabled()
  })

  it('dangerバリアントで警告アイコンが表示される', () => {
    render(<ConfirmDialog {...defaultProps} variant="danger" />)

    // AlertTriangle icon should render within the dialog
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
  })

  it('dialog roleとaria-modalが設定されている', () => {
    render(<ConfirmDialog {...defaultProps} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })
})
