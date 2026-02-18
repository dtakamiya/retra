import { describe, it, expect, vi, beforeEach } from 'vitest'

// Must mock matchMedia before importing themeStore
const mockMatchMedia = vi.fn()
const mockAddEventListener = vi.fn()

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia.mockReturnValue({
    matches: false,
    addEventListener: mockAddEventListener,
  }),
})

describe('themeStore', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: mockAddEventListener,
    })
    mockAddEventListener.mockClear()
  })

  it('defaults to system theme when no saved preference', async () => {
    const { useThemeStore } = await import('./themeStore')
    expect(useThemeStore.getState().theme).toBe('system')
  })

  it('restores light theme from localStorage', async () => {
    localStorage.setItem('retra-theme', 'light')
    const { useThemeStore } = await import('./themeStore')
    expect(useThemeStore.getState().theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('restores dark theme from localStorage and applies dark class', async () => {
    localStorage.setItem('retra-theme', 'dark')
    const { useThemeStore } = await import('./themeStore')
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('applies dark class when system prefers dark and theme is system', async () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: mockAddEventListener,
    })
    const { useThemeStore } = await import('./themeStore')
    expect(useThemeStore.getState().theme).toBe('system')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('ignores invalid saved theme and defaults to system', async () => {
    localStorage.setItem('retra-theme', 'invalid-value')
    const { useThemeStore } = await import('./themeStore')
    expect(useThemeStore.getState().theme).toBe('system')
  })

  it('setTheme updates state, localStorage, and DOM class', async () => {
    const { useThemeStore } = await import('./themeStore')

    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(localStorage.getItem('retra-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    useThemeStore.getState().setTheme('light')
    expect(useThemeStore.getState().theme).toBe('light')
    expect(localStorage.getItem('retra-theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('listens for system preference changes when theme is system', async () => {
    const { useThemeStore } = await import('./themeStore')

    // Verify addEventListener was called on matchMedia
    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function))

    // Simulate system dark mode change while theme is 'system'
    useThemeStore.getState().setTheme('system')
    document.documentElement.classList.remove('dark')

    // Get the registered listener and invoke it
    const changeListener = mockAddEventListener.mock.calls[0][1]
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: mockAddEventListener,
    })
    changeListener()

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('does not apply system preference change when theme is not system', async () => {
    const { useThemeStore } = await import('./themeStore')

    useThemeStore.getState().setTheme('light')
    document.documentElement.classList.remove('dark')

    const changeListener = mockAddEventListener.mock.calls[0][1]
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: mockAddEventListener,
    })
    changeListener()

    // Should remain light (no dark class) since theme is explicitly 'light'
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
