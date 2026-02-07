export type Framework = 'KPT' | 'FUN_DONE_LEARN' | 'FOUR_LS' | 'START_STOP_CONTINUE';

export type Phase = 'WRITING' | 'VOTING' | 'DISCUSSION' | 'ACTION_ITEMS' | 'CLOSED';

export interface Board {
  id: string;
  slug: string;
  title: string;
  framework: Framework;
  phase: Phase;
  maxVotesPerPerson: number;
  columns: Column[];
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  name: string;
  sortOrder: number;
  color: string;
  cards: Card[];
}

export interface Card {
  id: string;
  columnId: string;
  content: string;
  authorNickname: string | null;
  participantId: string | null;
  voteCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  nickname: string;
  isFacilitator: boolean;
  isOnline: boolean;
  createdAt: string;
}

export interface Vote {
  id: string;
  cardId: string;
  participantId: string;
  createdAt: string;
}

export interface RemainingVotes {
  participantId: string;
  remaining: number;
  max: number;
  used: number;
}

export interface TimerState {
  isRunning: boolean;
  remainingSeconds: number;
  totalSeconds: number;
}

export type TimerAction = 'START' | 'PAUSE' | 'RESUME' | 'RESET';

// WebSocket event types
export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
}

export interface CardDeletedPayload {
  cardId: string;
  columnId: string;
}

export interface PhaseChangedPayload {
  phase: Phase;
}

export interface ParticipantOnlinePayload {
  participantId: string;
}

export interface VoteRemovedPayload {
  cardId: string;
  participantId: string;
}

export interface CardMovedPayload {
  cardId: string;
  sourceColumnId: string;
  targetColumnId: string;
  sortOrder: number;
}
