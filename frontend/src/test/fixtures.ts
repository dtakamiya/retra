import type { Board, Card, Column, Memo, Participant, Reaction, RemainingVotes, TimerState, Vote } from '../types'

export function createParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    id: 'p-1',
    nickname: 'TestUser',
    isFacilitator: true,
    isOnline: true,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMemo(overrides: Partial<Memo> = {}): Memo {
  return {
    id: 'memo-1',
    cardId: 'card-1',
    content: 'Test memo content',
    authorNickname: 'TestUser',
    participantId: 'p-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    columnId: 'col-1',
    content: 'Test card content',
    authorNickname: 'TestUser',
    participantId: 'p-1',
    voteCount: 0,
    votedParticipantIds: [],
    sortOrder: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    memos: [],
    reactions: [],
    ...overrides,
  }
}

export function createReaction(overrides: Partial<Reaction> = {}): Reaction {
  return {
    id: 'reaction-1',
    cardId: 'card-1',
    participantId: 'p-1',
    emoji: '👍',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createColumn(overrides: Partial<Column> = {}): Column {
  return {
    id: 'col-1',
    name: 'Keep',
    sortOrder: 0,
    color: '#22c55e',
    cards: [],
    ...overrides,
  }
}

export function createBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: 'board-1',
    slug: 'test1234',
    title: 'Test Retro',
    framework: 'KPT',
    phase: 'WRITING',
    maxVotesPerPerson: 5,
    columns: [
      createColumn({ id: 'col-1', name: 'Keep', sortOrder: 0, color: '#22c55e' }),
      createColumn({ id: 'col-2', name: 'Problem', sortOrder: 1, color: '#ef4444', cards: [] }),
      createColumn({ id: 'col-3', name: 'Try', sortOrder: 2, color: '#3b82f6', cards: [] }),
    ],
    participants: [createParticipant()],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createVote(overrides: Partial<Vote> = {}): Vote {
  return {
    id: 'vote-1',
    cardId: 'card-1',
    participantId: 'p-1',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createRemainingVotes(overrides: Partial<RemainingVotes> = {}): RemainingVotes {
  return {
    participantId: 'p-1',
    remaining: 5,
    max: 5,
    used: 0,
    ...overrides,
  }
}

export function createTimerState(overrides: Partial<TimerState> = {}): TimerState {
  return {
    isRunning: false,
    remainingSeconds: 0,
    totalSeconds: 0,
    ...overrides,
  }
}
