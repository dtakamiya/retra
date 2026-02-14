import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent, waitFor } from '../test/test-utils'
import { HomePage } from './HomePage'
import { api } from '../api/client'
import { createBoard } from '../test/fixtures'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(() => mockNavigate),
  }
})

vi.mock('../api/client', () => ({
  api: {
    createBoard: vi.fn(),
    getBoard: vi.fn(),
  },
}))

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title "Retra"', () => {
    render(<HomePage />)

    expect(screen.getByText('Retra')).toBeInTheDocument()
  })

  it('renders create and join tabs', () => {
    render(<HomePage />)

    expect(screen.getAllByText('ボードを作成').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('ボードに参加').length).toBeGreaterThanOrEqual(1)
  })

  it('create mode shows title input, framework selector, vote count input', () => {
    render(<HomePage />)

    expect(screen.getByText('ボードタイトル')).toBeInTheDocument()
    expect(screen.getByText('フレームワーク')).toBeInTheDocument()
    expect(screen.getByText('KPT')).toBeInTheDocument()
    expect(screen.getByText('Fun Done Learn')).toBeInTheDocument()
    expect(screen.getByText('4Ls')).toBeInTheDocument()
    expect(screen.getByText('Start Stop Continue')).toBeInTheDocument()
    expect(screen.getByText('1人あたりの最大投票数')).toBeInTheDocument()
  })

  it('join mode shows slug input', async () => {
    const user = userEvent.setup()
    render(<HomePage />)

    const joinTab = screen.getByText('ボードに参加')
    await user.click(joinTab)

    expect(screen.getByText('ボードURLまたはコード')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ボードコードを入力またはURLを貼り付け')).toBeInTheDocument()
  })

  it('switching between create and join modes', async () => {
    const user = userEvent.setup()
    render(<HomePage />)

    // Initially in create mode
    expect(screen.getByText('ボードタイトル')).toBeInTheDocument()

    // Switch to join mode - "ボードに参加" appears once (tab only) in create mode
    const joinTab = screen.getAllByText('ボードに参加')[0]
    await user.click(joinTab)
    expect(screen.getByText('ボードURLまたはコード')).toBeInTheDocument()
    expect(screen.queryByText('ボードタイトル')).not.toBeInTheDocument()

    // Switch back to create mode - "ボードを作成" appears once (tab only) in join mode
    const createTab = screen.getByText('ボードを作成')
    await user.click(createTab)
    expect(screen.getByText('ボードタイトル')).toBeInTheDocument()
    expect(screen.queryByText('ボードURLまたはコード')).not.toBeInTheDocument()
  })

  it('create form: fills title and submits -> calls api.createBoard and navigates', async () => {
    const user = userEvent.setup()
    vi.mocked(api.createBoard).mockResolvedValue(createBoard({ slug: 'new-slug' }))

    render(<HomePage />)

    // Fill in the title
    const titleInput = screen.getByPlaceholderText('スプリント42 ふりかえり')
    await user.type(titleInput, 'テストボード')

    // Submit the form by clicking the submit button
    const submitButtons = screen.getAllByText('ボードを作成')
    // The submit button is the one inside the form (last one)
    const submitButton = submitButtons[submitButtons.length - 1]
    await user.click(submitButton)

    expect(api.createBoard).toHaveBeenCalledWith('テストボード', 'KPT', 5, false, undefined)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/board/new-slug')
    })
  })

  it('join form: fills slug and submits -> navigates to /board/{slug}', async () => {
    const user = userEvent.setup()

    render(<HomePage />)

    // Switch to join mode
    const joinTab = screen.getByText('ボードに参加')
    await user.click(joinTab)

    // Fill in the slug
    const slugInput = screen.getByPlaceholderText('ボードコードを入力またはURLを貼り付け')
    await user.type(slugInput, 'abc12345')

    // Submit
    const submitButtons = screen.getAllByText('ボードに参加')
    const submitButton = submitButtons[submitButtons.length - 1]
    await user.click(submitButton)

    expect(mockNavigate).toHaveBeenCalledWith('/board/abc12345')
  })

  it('create form: can change framework and max votes', async () => {
    const user = userEvent.setup()
    vi.mocked(api.createBoard).mockResolvedValue(createBoard({ slug: 'fw-slug' }))

    render(<HomePage />)

    // Select a different framework
    await user.click(screen.getByText('Fun Done Learn'))

    // Change max votes
    const maxVotesInput = screen.getByDisplayValue('5')
    await user.tripleClick(maxVotesInput)
    await user.keyboard('3')

    // Fill title and submit
    const titleInput = screen.getByPlaceholderText('スプリント42 ふりかえり')
    await user.type(titleInput, 'テスト')

    const submitButtons = screen.getAllByText('ボードを作成')
    await user.click(submitButtons[submitButtons.length - 1])

    expect(api.createBoard).toHaveBeenCalledWith('テスト', 'FUN_DONE_LEARN', 3, false, undefined)
  })

  it('チーム名入力欄を表示する', () => {
    render(<HomePage />)
    expect(screen.getByLabelText('チーム名（オプション）')).toBeInTheDocument()
  })

  it('チーム名を入力してボードを作成するとteamNameが渡される', async () => {
    const user = userEvent.setup()
    vi.mocked(api.createBoard).mockResolvedValue(createBoard({ slug: 'team-slug' }))

    render(<HomePage />)

    // Fill in the title
    const titleInput = screen.getByPlaceholderText('スプリント42 ふりかえり')
    await user.type(titleInput, 'テストボード')

    // Fill in the team name
    const teamNameInput = screen.getByLabelText('チーム名（オプション）')
    await user.type(teamNameInput, 'Team Alpha')

    // Submit
    const submitButtons = screen.getAllByText('ボードを作成')
    const submitButton = submitButtons[submitButtons.length - 1]
    await user.click(submitButton)

    expect(api.createBoard).toHaveBeenCalledWith('テストボード', 'KPT', 5, false, 'Team Alpha')
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/board/team-slug')
    })
  })

  it('create form: shows error when api.createBoard rejects', async () => {
    const user = userEvent.setup()
    vi.mocked(api.createBoard).mockRejectedValue(new Error('サーバーエラー'))

    render(<HomePage />)

    // Fill in the title
    const titleInput = screen.getByPlaceholderText('スプリント42 ふりかえり')
    await user.type(titleInput, 'テストボード')

    // Submit
    const submitButtons = screen.getAllByText('ボードを作成')
    const submitButton = submitButtons[submitButtons.length - 1]
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('サーバーエラー')).toBeInTheDocument()
    })
  })
})
