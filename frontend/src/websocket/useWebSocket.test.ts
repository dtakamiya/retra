import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWebSocket } from './useWebSocket'
import { useBoardStore } from '../store/boardStore'

// --- Mock STOMP Client ---

const mockActivate = vi.fn()
const mockDeactivate = vi.fn()
const mockPublish = vi.fn()
const mockSubscribe = vi.fn()

let capturedConfig: {
  brokerURL: string
  onConnect?: () => void
  onDisconnect?: () => void
  onStompError?: (frame: { headers: Record<string, string> }) => void
}

vi.mock('@stomp/stompjs', () => ({
  Client: vi.fn().mockImplementation((config: typeof capturedConfig) => {
    capturedConfig = config
    return {
      activate: mockActivate,
      deactivate: mockDeactivate,
      publish: mockPublish,
      subscribe: mockSubscribe,
    }
  }),
}))

vi.mock('../store/boardStore')

// --- Helpers ---

function mockStoreHandlers() {
  const handlers = {
    setConnected: vi.fn(),
    setTimer: vi.fn(),
    handleCardCreated: vi.fn(),
    handleCardUpdated: vi.fn(),
    handleCardDeleted: vi.fn(),
    handleCardMoved: vi.fn(),
    handleCardDiscussionMarked: vi.fn(),
    handlePrivateCardCreated: vi.fn(),
    handlePrivateCardUpdated: vi.fn(),
    handlePrivateCardDeleted: vi.fn(),
    handleVoteAdded: vi.fn(),
    handleVoteRemoved: vi.fn(),
    handlePhaseChanged: vi.fn(),
    handleParticipantJoined: vi.fn(),
    handleParticipantOnline: vi.fn(),
    handleParticipantOffline: vi.fn(),
    handleMemoCreated: vi.fn(),
    handleMemoUpdated: vi.fn(),
    handleMemoDeleted: vi.fn(),
    handleReactionAdded: vi.fn(),
    handleReactionRemoved: vi.fn(),
    handleActionItemCreated: vi.fn(),
    handleActionItemUpdated: vi.fn(),
    handleActionItemStatusChanged: vi.fn(),
    handleActionItemDeleted: vi.fn(),
    handleKudosSent: vi.fn(),
    handleKudosDeleted: vi.fn(),
  }
  vi.mocked(useBoardStore).mockReturnValue(handlers as unknown as ReturnType<typeof useBoardStore>)
  return handlers
}

// --- Tests ---

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not create client when slug is undefined', () => {
    mockStoreHandlers()

    renderHook(() => useWebSocket(undefined, 'p-1'))

    expect(mockActivate).not.toHaveBeenCalled()
  })

  it('does not create client when participantId is undefined', () => {
    mockStoreHandlers()

    renderHook(() => useWebSocket('test1234', undefined))

    expect(mockActivate).not.toHaveBeenCalled()
  })

  it('creates and activates STOMP client with correct URL', () => {
    mockStoreHandlers()

    renderHook(() => useWebSocket('test1234', 'p-1'))

    expect(mockActivate).toHaveBeenCalledTimes(1)
    expect(capturedConfig.brokerURL).toContain('/ws')
  })

  it('on connect: sets connected, registers session, and subscribes to 9 topics', () => {
    const handlers = mockStoreHandlers()

    renderHook(() => useWebSocket('test1234', 'p-1'))

    // Trigger onConnect callback
    capturedConfig.onConnect!()

    expect(handlers.setConnected).toHaveBeenCalledWith(true)
    expect(mockPublish).toHaveBeenCalledWith({
      destination: '/app/board/test1234/register',
      body: JSON.stringify({ participantId: 'p-1' }),
    })
    expect(mockSubscribe).toHaveBeenCalledTimes(10)
    // Verify subscription destinations
    const destinations = mockSubscribe.mock.calls.map((call) => call[0])
    expect(destinations).toContain('/topic/board/test1234/cards')
    expect(destinations).toContain('/topic/board/test1234/votes')
    expect(destinations).toContain('/topic/board/test1234/phase')
    expect(destinations).toContain('/topic/board/test1234/timer')
    expect(destinations).toContain('/topic/board/test1234/memos')
    expect(destinations).toContain('/topic/board/test1234/reactions')
    expect(destinations).toContain('/topic/board/test1234/participants')
    expect(destinations).toContain('/topic/board/test1234/action-items')
    expect(destinations).toContain('/topic/board/test1234/kudos')
    expect(destinations).toContain('/topic/board/test1234/icebreaker')
  })

  it('calls correct handlers for each WebSocket message type', () => {
    const handlers = mockStoreHandlers()

    renderHook(() => useWebSocket('test1234', 'p-1'))

    capturedConfig.onConnect!()

    // Build a map of destination -> callback
    const callbackMap: Record<string, (msg: { body: string }) => void> = {}
    for (const call of mockSubscribe.mock.calls) {
      callbackMap[call[0] as string] = call[1] as (msg: { body: string }) => void
    }

    // CARD_CREATED
    const cardPayload = { id: 'card-1', columnId: 'col-1', content: 'Hello' }
    callbackMap['/topic/board/test1234/cards']({
      body: JSON.stringify({ type: 'CARD_CREATED', payload: cardPayload }),
    })
    expect(handlers.handleCardCreated).toHaveBeenCalledWith(cardPayload)

    // CARD_UPDATED
    const updatedCard = { id: 'card-1', columnId: 'col-1', content: 'Updated' }
    callbackMap['/topic/board/test1234/cards']({
      body: JSON.stringify({ type: 'CARD_UPDATED', payload: updatedCard }),
    })
    expect(handlers.handleCardUpdated).toHaveBeenCalledWith(updatedCard)

    // CARD_DELETED
    const deletedPayload = { cardId: 'card-1', columnId: 'col-1' }
    callbackMap['/topic/board/test1234/cards']({
      body: JSON.stringify({ type: 'CARD_DELETED', payload: deletedPayload }),
    })
    expect(handlers.handleCardDeleted).toHaveBeenCalledWith(deletedPayload)

    // VOTE_ADDED
    const votePayload = { id: 'v-1', cardId: 'card-1', participantId: 'p-1' }
    callbackMap['/topic/board/test1234/votes']({
      body: JSON.stringify({ type: 'VOTE_ADDED', payload: votePayload }),
    })
    expect(handlers.handleVoteAdded).toHaveBeenCalledWith(votePayload)

    // VOTE_REMOVED
    const voteRemovedPayload = { cardId: 'card-1', participantId: 'p-1' }
    callbackMap['/topic/board/test1234/votes']({
      body: JSON.stringify({ type: 'VOTE_REMOVED', payload: voteRemovedPayload }),
    })
    expect(handlers.handleVoteRemoved).toHaveBeenCalledWith(voteRemovedPayload)

    // PHASE_CHANGED
    callbackMap['/topic/board/test1234/phase']({
      body: JSON.stringify({ type: 'PHASE_CHANGED', payload: { phase: 'VOTING' } }),
    })
    expect(handlers.handlePhaseChanged).toHaveBeenCalledWith('VOTING')

    // TIMER_UPDATE
    const timerPayload = { isRunning: true, remainingSeconds: 30, totalSeconds: 60 }
    callbackMap['/topic/board/test1234/timer']({
      body: JSON.stringify({ type: 'TIMER_UPDATE', payload: timerPayload }),
    })
    expect(handlers.setTimer).toHaveBeenCalledWith(timerPayload)

    // JOINED
    const participantPayload = { id: 'p-2', nickname: 'Alice', isFacilitator: false }
    callbackMap['/topic/board/test1234/participants']({
      body: JSON.stringify({ type: 'JOINED', payload: participantPayload }),
    })
    expect(handlers.handleParticipantJoined).toHaveBeenCalledWith(participantPayload)

    // ONLINE
    const onlinePayload = { participantId: 'p-2' }
    callbackMap['/topic/board/test1234/participants']({
      body: JSON.stringify({ type: 'ONLINE', payload: onlinePayload }),
    })
    expect(handlers.handleParticipantOnline).toHaveBeenCalledWith(onlinePayload)

    // OFFLINE
    const offlinePayload = { participantId: 'p-2' }
    callbackMap['/topic/board/test1234/participants']({
      body: JSON.stringify({ type: 'OFFLINE', payload: offlinePayload }),
    })
    expect(handlers.handleParticipantOffline).toHaveBeenCalledWith(offlinePayload)

    // MEMO_CREATED
    const memoCreatedPayload = { id: 'memo-1', cardId: 'card-1', content: 'New memo' }
    callbackMap['/topic/board/test1234/memos']({
      body: JSON.stringify({ type: 'MEMO_CREATED', payload: memoCreatedPayload }),
    })
    expect(handlers.handleMemoCreated).toHaveBeenCalledWith(memoCreatedPayload)

    // MEMO_UPDATED
    const memoUpdatedPayload = { id: 'memo-1', cardId: 'card-1', content: 'Updated memo' }
    callbackMap['/topic/board/test1234/memos']({
      body: JSON.stringify({ type: 'MEMO_UPDATED', payload: memoUpdatedPayload }),
    })
    expect(handlers.handleMemoUpdated).toHaveBeenCalledWith(memoUpdatedPayload)

    // MEMO_DELETED
    const memoDeletedPayload = { cardId: 'card-1', memoId: 'memo-1' }
    callbackMap['/topic/board/test1234/memos']({
      body: JSON.stringify({ type: 'MEMO_DELETED', payload: memoDeletedPayload }),
    })
    expect(handlers.handleMemoDeleted).toHaveBeenCalledWith(memoDeletedPayload)

    // REACTION_ADDED
    const reactionAddedPayload = { id: 'r-1', cardId: 'card-1', participantId: 'p-1', emoji: '👍', createdAt: '2024-01-01' }
    callbackMap['/topic/board/test1234/reactions']({
      body: JSON.stringify({ type: 'REACTION_ADDED', payload: reactionAddedPayload }),
    })
    expect(handlers.handleReactionAdded).toHaveBeenCalledWith(reactionAddedPayload)

    // REACTION_REMOVED
    const reactionRemovedPayload = { cardId: 'card-1', participantId: 'p-1', emoji: '👍' }
    callbackMap['/topic/board/test1234/reactions']({
      body: JSON.stringify({ type: 'REACTION_REMOVED', payload: reactionRemovedPayload }),
    })
    expect(handlers.handleReactionRemoved).toHaveBeenCalledWith(reactionRemovedPayload)

    // ACTION_ITEM_CREATED (full ActionItem payload from backend)
    const actionItemCreatedPayload = {
      id: 'ai-1', boardId: 'board-1', cardId: null,
      content: 'New action', assigneeId: 'p-1', assigneeNickname: 'Alice',
      dueDate: '2024-02-01', status: 'OPEN', priority: 'HIGH',
      sortOrder: 0, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
    }
    callbackMap['/topic/board/test1234/action-items']({
      body: JSON.stringify({ type: 'ACTION_ITEM_CREATED', payload: actionItemCreatedPayload }),
    })
    expect(handlers.handleActionItemCreated).toHaveBeenCalledWith(actionItemCreatedPayload)

    // ACTION_ITEM_UPDATED (full ActionItem payload from backend)
    const actionItemUpdatedPayload = {
      id: 'ai-1', boardId: 'board-1', cardId: 'card-1',
      content: 'Updated action', assigneeId: 'p-2', assigneeNickname: 'Bob',
      dueDate: '2024-03-01', status: 'IN_PROGRESS', priority: 'LOW',
      sortOrder: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z',
    }
    callbackMap['/topic/board/test1234/action-items']({
      body: JSON.stringify({ type: 'ACTION_ITEM_UPDATED', payload: actionItemUpdatedPayload }),
    })
    expect(handlers.handleActionItemUpdated).toHaveBeenCalledWith(actionItemUpdatedPayload)

    // ACTION_ITEM_STATUS_CHANGED
    const actionItemStatusPayload = { actionItemId: 'ai-1', boardSlug: 'test1234', newStatus: 'DONE' }
    callbackMap['/topic/board/test1234/action-items']({
      body: JSON.stringify({ type: 'ACTION_ITEM_STATUS_CHANGED', payload: actionItemStatusPayload }),
    })
    expect(handlers.handleActionItemStatusChanged).toHaveBeenCalledWith(actionItemStatusPayload)

    // ACTION_ITEM_DELETED
    const actionItemDeletedPayload = { actionItemId: 'ai-1' }
    callbackMap['/topic/board/test1234/action-items']({
      body: JSON.stringify({ type: 'ACTION_ITEM_DELETED', payload: actionItemDeletedPayload }),
    })
    expect(handlers.handleActionItemDeleted).toHaveBeenCalledWith(actionItemDeletedPayload)

    // KUDOS_SENT
    const kudosSentPayload = {
      id: 'kudos-1',
      boardId: 'board-1',
      senderId: 'p-1',
      senderNickname: 'Alice',
      receiverId: 'p-2',
      receiverNickname: 'Bob',
      category: 'GREAT_JOB',
      message: 'Great work!',
      createdAt: '2024-01-01',
    }
    callbackMap['/topic/board/test1234/kudos']({
      body: JSON.stringify({ type: 'KUDOS_SENT', payload: kudosSentPayload }),
    })
    expect(handlers.handleKudosSent).toHaveBeenCalledWith(kudosSentPayload)

    // KUDOS_DELETED
    const kudosDeletedPayload = { id: 'kudos-1' }
    callbackMap['/topic/board/test1234/kudos']({
      body: JSON.stringify({ type: 'KUDOS_DELETED', payload: kudosDeletedPayload }),
    })
    expect(handlers.handleKudosDeleted).toHaveBeenCalledWith(kudosDeletedPayload)
  })

  it('routes CARD_CREATED_PRIVATE to handlePrivateCardCreated', () => {
    const handlers = mockStoreHandlers()

    renderHook(() => useWebSocket('test1234', 'p-1'))

    capturedConfig.onConnect!()

    const callbackMap: Record<string, (msg: { body: string }) => void> = {}
    for (const call of mockSubscribe.mock.calls) {
      callbackMap[call[0] as string] = call[1] as (msg: { body: string }) => void
    }

    const payload = { columnId: 'col-1', participantId: 'p-other' }
    callbackMap['/topic/board/test1234/cards']({
      body: JSON.stringify({ type: 'CARD_CREATED_PRIVATE', payload }),
    })
    expect(handlers.handlePrivateCardCreated).toHaveBeenCalledWith(payload, 'p-1')
  })

  it('routes CARD_UPDATED_PRIVATE to handlePrivateCardUpdated', () => {
    const handlers = mockStoreHandlers()

    renderHook(() => useWebSocket('test1234', 'p-1'))

    capturedConfig.onConnect!()

    const callbackMap: Record<string, (msg: { body: string }) => void> = {}
    for (const call of mockSubscribe.mock.calls) {
      callbackMap[call[0] as string] = call[1] as (msg: { body: string }) => void
    }

    const payload = { cardId: 'c-1', participantId: 'p-other' }
    callbackMap['/topic/board/test1234/cards']({
      body: JSON.stringify({ type: 'CARD_UPDATED_PRIVATE', payload }),
    })
    expect(handlers.handlePrivateCardUpdated).toHaveBeenCalled()
  })

  it('routes CARD_DELETED_PRIVATE to handlePrivateCardDeleted', () => {
    const handlers = mockStoreHandlers()

    renderHook(() => useWebSocket('test1234', 'p-1'))

    capturedConfig.onConnect!()

    const callbackMap: Record<string, (msg: { body: string }) => void> = {}
    for (const call of mockSubscribe.mock.calls) {
      callbackMap[call[0] as string] = call[1] as (msg: { body: string }) => void
    }

    const payload = { cardId: 'c-1', columnId: 'col-1', participantId: 'p-other' }
    callbackMap['/topic/board/test1234/cards']({
      body: JSON.stringify({ type: 'CARD_DELETED_PRIVATE', payload }),
    })
    expect(handlers.handlePrivateCardDeleted).toHaveBeenCalledWith(payload, 'p-1')
  })

  it('sets connected false on disconnect', () => {
    const handlers = mockStoreHandlers()

    renderHook(() => useWebSocket('test1234', 'p-1'))

    capturedConfig.onDisconnect!()

    expect(handlers.setConnected).toHaveBeenCalledWith(false)
  })

  it('sets connected false on STOMP error', () => {
    const handlers = mockStoreHandlers()

    renderHook(() => useWebSocket('test1234', 'p-1'))

    capturedConfig.onStompError!({ headers: { message: 'Connection failed' } })

    expect(handlers.setConnected).toHaveBeenCalledWith(false)
  })

  it('deactivates client on unmount', () => {
    mockStoreHandlers()

    const { unmount } = renderHook(() => useWebSocket('test1234', 'p-1'))

    unmount()

    expect(mockDeactivate).toHaveBeenCalledTimes(1)
  })
})
