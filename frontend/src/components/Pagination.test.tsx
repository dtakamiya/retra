import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent } from '../test/test-utils'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 0,
    totalPages: 5,
    totalElements: 50,
    pageSize: 10,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
  }

  it('合計件数を表示する', () => {
    render(<Pagination {...defaultProps} />)

    expect(screen.getByTestId('total-elements')).toHaveTextContent('全 50 件')
  })

  it('ページインジケータを表示する', () => {
    render(<Pagination {...defaultProps} currentPage={2} />)

    expect(screen.getByTestId('page-indicator')).toHaveTextContent('3 / 5')
  })

  it('最初のページでは「前へ」ボタンが無効', () => {
    render(<Pagination {...defaultProps} currentPage={0} />)

    expect(screen.getByLabelText('前のページ')).toBeDisabled()
  })

  it('最後のページでは「次へ」ボタンが無効', () => {
    render(<Pagination {...defaultProps} currentPage={4} />)

    expect(screen.getByLabelText('次のページ')).toBeDisabled()
  })

  it('中間ページでは両方のボタンが有効', () => {
    render(<Pagination {...defaultProps} currentPage={2} />)

    expect(screen.getByLabelText('前のページ')).not.toBeDisabled()
    expect(screen.getByLabelText('次のページ')).not.toBeDisabled()
  })

  it('「前へ」クリックでonPageChangeが呼ばれる', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination {...defaultProps} currentPage={2} onPageChange={onPageChange} />)

    await user.click(screen.getByLabelText('前のページ'))

    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('「次へ」クリックでonPageChangeが呼ばれる', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination {...defaultProps} currentPage={2} onPageChange={onPageChange} />)

    await user.click(screen.getByLabelText('次のページ'))

    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('ページサイズ変更でonPageSizeChangeが呼ばれる', async () => {
    const user = userEvent.setup()
    const onPageSizeChange = vi.fn()
    render(<Pagination {...defaultProps} onPageSizeChange={onPageSizeChange} />)

    await user.selectOptions(screen.getByLabelText('表示件数'), '20')

    expect(onPageSizeChange).toHaveBeenCalledWith(20)
  })

  it('totalPagesが0の場合は「0 / 0」を表示する', () => {
    render(<Pagination {...defaultProps} totalPages={0} totalElements={0} />)

    expect(screen.getByTestId('page-indicator')).toHaveTextContent('0 / 0')
  })

  it('totalPagesが0の場合は「次へ」ボタンが無効', () => {
    render(<Pagination {...defaultProps} totalPages={0} totalElements={0} />)

    expect(screen.getByLabelText('次のページ')).toBeDisabled()
  })
})
