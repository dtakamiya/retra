export type Framework = 'KPT' | 'FUN_DONE_LEARN' | 'FOUR_LS' | 'START_STOP_CONTINUE';

export type Phase = 'ICEBREAK' | 'WRITING' | 'VOTING' | 'DISCUSSION' | 'ACTION_ITEMS' | 'CLOSED';

export interface Board {
  id: string;
  slug: string;
  title: string;
  teamName: string | null;
  framework: Framework;
  phase: Phase;
  maxVotesPerPerson: number;
  isAnonymous: boolean;
  privateWriting: boolean;
  enableIcebreaker: boolean;
  icebreakerQuestion: string | null;
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
  hiddenCardCount: number;
}

export interface Memo {
  id: string;
  cardId: string;
  content: string;
  authorNickname: string | null;
  participantId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Reaction {
  id: string;
  cardId: string;
  participantId: string;
  emoji: string;
  createdAt: string;
}

export interface Card {
  id: string;
  columnId: string;
  content: string;
  authorNickname: string | null;
  participantId: string | null;
  voteCount: number;
  votedParticipantIds: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  memos: Memo[];
  reactions: Reaction[];
  isDiscussed: boolean;
  discussionOrder: number;
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

export interface MemoDeletedPayload {
  cardId: string;
  memoId: string;
}

export interface CardDiscussionMarkedPayload {
  cardId: string;
  isDiscussed: boolean;
  discussionOrder?: number;
}

export interface ReactionRemovedPayload {
  cardId: string;
  participantId: string;
  emoji: string;
}

export type ExportFormat = 'CSV' | 'MARKDOWN';

// Dashboard / History types
export interface SnapshotSummary {
  id: string;
  teamName: string;
  framework: string;
  closedAt: string;
  totalCards: number;
  totalVotes: number;
  totalParticipants: number;
  actionItemsTotal: number;
  actionItemsDone: number;
}

export interface SnapshotDetail extends SnapshotSummary {
  snapshotData: string;
}

export interface TrendPoint {
  closedAt: string;
  totalCards: number;
  totalVotes: number;
  totalParticipants: number;
  actionItemsTotal: number;
  actionItemsDone: number;
  actionItemCompletionRate: number;
  cardsPerParticipant: number;
  votesPerParticipant: number;
  votesPerCard: number;
  actionItemRate: number;
}

export interface TrendData {
  snapshots: TrendPoint[];
}

export type ActionItemStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE';

export type ActionItemPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ActionItem {
  id: string;
  boardId: string;
  cardId: string | null;
  content: string;
  assigneeId: string | null;
  assigneeNickname: string | null;
  dueDate: string | null;
  status: ActionItemStatus;
  priority: ActionItemPriority;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActionItemDeletedPayload {
  actionItemId: string;
}

export interface ActionItemStatusChangedPayload {
  actionItemId: string;
  boardSlug: string;
  newStatus: ActionItemStatus;
}

export interface CarryOverItem {
  id: string;
  content: string;
  assigneeNickname: string | null;
  dueDate: string | null;
  status: ActionItemStatus;
  priority: ActionItemPriority;
  sourceBoardTitle: string;
  sourceBoardClosedAt: string;
  sourceBoardSlug: string;
}

export interface CarryOverItemsResponse {
  items: CarryOverItem[];
  teamName: string;
}

export type KudosCategory = 'GREAT_JOB' | 'THANK_YOU' | 'INSPIRING' | 'HELPFUL' | 'CREATIVE' | 'TEAM_PLAYER';

export interface Kudos {
  id: string;
  boardId: string;
  senderId: string;
  senderNickname: string;
  receiverId: string;
  receiverNickname: string;
  category: KudosCategory;
  message?: string;
  createdAt: string;
}

export interface KudosDeletedPayload {
  id: string;
}

// Icebreaker types
export interface IcebreakerAnswer {
  id: string;
  participantId: string;
  participantNickname: string;
  answerText: string;
  createdAt: string;
}

export interface IcebreakerResponse {
  question: string | null;
  answers: IcebreakerAnswer[];
}

export interface IcebreakerAnswerDeletedPayload {
  answerId: string;
}

export interface PrivateCardCreatedPayload {
  columnId: string;
  participantId: string | null;
}

export interface PrivateCardDeletedPayload {
  cardId: string;
  columnId: string;
  participantId: string | null;
}
