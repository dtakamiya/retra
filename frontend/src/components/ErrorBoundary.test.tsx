import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from './ErrorBoundary'

// コンソールエラーを抑制（ErrorBoundaryがconsole.errorを呼ぶため）
const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
})
afterAll(() => {
  console.error = originalConsoleError
})

function ProblemChild(): JSX.Element {
  throw new Error('テストエラー')
}

function GoodChild() {
  return <div>正常なコンポーネント</div>
}

import { afterAll } from 'vitest'

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    )

    expect(screen.getByText('正常なコンポーネント')).toBeInTheDocument()
  })

  it('renders fallback UI when a child component throws', () => {
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    )

    expect(screen.getByText('予期しないエラーが発生しました')).toBeInTheDocument()
    expect(screen.getByText('テストエラー')).toBeInTheDocument()
    expect(screen.queryByText('正常なコンポーネント')).not.toBeInTheDocument()
  })

  it('shows a retry button that resets the error state', async () => {
    const user = userEvent.setup()
    let shouldThrow = true

    function ConditionalChild() {
      if (shouldThrow) {
        throw new Error('一時的なエラー')
      }
      return <div>復帰しました</div>
    }

    render(
      <ErrorBoundary>
        <ConditionalChild />
      </ErrorBoundary>
    )

    expect(screen.getByText('予期しないエラーが発生しました')).toBeInTheDocument()

    // エラーを修正して再試行
    shouldThrow = false
    await user.click(screen.getByText('再試行'))

    expect(screen.getByText('復帰しました')).toBeInTheDocument()
  })

  it('shows a reload button', () => {
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    )

    expect(screen.getByText('ページをリロード')).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    const customFallback = <div>カスタムフォールバック</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ProblemChild />
      </ErrorBoundary>
    )

    expect(screen.getByText('カスタムフォールバック')).toBeInTheDocument()
    expect(screen.queryByText('予期しないエラーが発生しました')).not.toBeInTheDocument()
  })
})
