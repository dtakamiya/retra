import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'

function AllProviders({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export { customRender as render }
export { screen, waitFor, within, act } from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
