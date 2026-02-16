import { create } from 'zustand';
import type {
  ActionItem,
  ActionItemDeletedPayload,
  ActionItemStatus,
  ActionItemStatusChangedPayload,
  Board,
  Card,
  CardDeletedPayload,
  CardDiscussionMarkedPayload,
  CardMovedPayload,
  CarryOverItem,
  CarryOverItemsResponse,
  Kudos,
  KudosDeletedPayload,
  Memo,
  MemoDeletedPayload,
  Participant,
  ParticipantOnlinePayload,
  Phase,
  Reaction,
  ReactionRemovedPayload,
  RemainingVotes,
  TimerState,
  Vote,
  VoteRemovedPayload,
} from '../types';

interface BoardState {
  board: Board | null;
  participant: Participant | null;
  remainingVotes: RemainingVotes | null;
  timer: TimerState;
  isConnected: boolean;
  actionItems: ActionItem[];
  carryOverItems: CarryOverItem[];
  carryOverTeamName: string;
  kudos: Kudos[];

  setBoard: (board: Board) => void;
  setParticipant: (participant: Participant) => void;
  setRemainingVotes: (votes: RemainingVotes) => void;
  setTimer: (timer: TimerState) => void;
  setConnected: (connected: boolean) => void;
  setActionItems: (items: ActionItem[]) => void;
  setCarryOverItems: (response: CarryOverItemsResponse) => void;
  updateCarryOverItemStatus: (actionItemId: string, newStatus: ActionItemStatus) => void;
  setKudos: (kudos: Kudos[]) => void;

  // WebSocket event handlers
  handleCardCreated: (card: Card) => void;
  handleCardUpdated: (card: Card) => void;
  handleCardDeleted: (payload: CardDeletedPayload) => void;
  handleCardMoved: (payload: CardMovedPayload) => void;
  handleCardDiscussionMarked: (payload: CardDiscussionMarkedPayload) => void;
  handleVoteAdded: (vote: Vote) => void;
  handleVoteRemoved: (payload: VoteRemovedPayload) => void;
  handlePhaseChanged: (phase: Phase) => void;
  handleParticipantJoined: (participant: Participant) => void;
  handleParticipantOnline: (payload: ParticipantOnlinePayload) => void;
  handleParticipantOffline: (payload: ParticipantOnlinePayload) => void;
  handleMemoCreated: (memo: Memo) => void;
  handleMemoUpdated: (memo: Memo) => void;
  handleMemoDeleted: (payload: MemoDeletedPayload) => void;
  handleReactionAdded: (reaction: Reaction) => void;
  handleReactionRemoved: (payload: ReactionRemovedPayload) => void;
  handleActionItemCreated: (item: ActionItem) => void;
  handleActionItemUpdated: (item: ActionItem) => void;
  handleActionItemStatusChanged: (payload: ActionItemStatusChangedPayload) => void;
  handleActionItemDeleted: (payload: ActionItemDeletedPayload) => void;
  handleKudosSent: (kudos: Kudos) => void;
  handleKudosDeleted: (payload: KudosDeletedPayload) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  board: null,
  participant: null,
  remainingVotes: null,
  timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0 },
  isConnected: false,
  actionItems: [],
  carryOverItems: [],
  carryOverTeamName: '',
  kudos: [],

  setBoard: (board) => set({ board }),
  setParticipant: (participant) => set({ participant }),
  setRemainingVotes: (votes) => set({ remainingVotes: votes }),
  setTimer: (timer) => set({ timer }),
  setConnected: (connected) => set({ isConnected: connected }),
  setActionItems: (items) => set({ actionItems: items }),
  setCarryOverItems: (response) => set({ carryOverItems: response.items, carryOverTeamName: response.teamName }),
  updateCarryOverItemStatus: (actionItemId, newStatus) => set((state) => ({
    carryOverItems: state.carryOverItems
      .map((item) => item.id === actionItemId ? { ...item, status: newStatus } : item)
      .filter((item) => item.status !== 'DONE'),
  })),
  setKudos: (kudos) => set({ kudos }),

  handleCardCreated: (card) =>
    set((state) => {
      if (!state.board) return state;
      const cardWithDefaults = {
        ...card,
        votedParticipantIds: card.votedParticipantIds ?? [],
        memos: card.memos ?? [],
        reactions: card.reactions ?? [],
        isDiscussed: card.isDiscussed ?? false,
        discussionOrder: card.discussionOrder ?? 0,
      };
      const columns = state.board.columns.map((col) => {
        if (col.id === cardWithDefaults.columnId) {
          return { ...col, cards: [...col.cards, cardWithDefaults] };
        }
        return col;
      });
      return { board: { ...state.board, columns } };
    }),

  handleCardUpdated: (card) =>
    set((state) => {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === card.id
            ? { ...card, votedParticipantIds: card.votedParticipantIds ?? c.votedParticipantIds, memos: card.memos ?? c.memos, reactions: card.reactions ?? c.reactions }
            : c
        ),
      }));
      return { board: { ...state.board, columns } };
    }),

  handleCardDeleted: (payload) =>
    set((state) => {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== payload.cardId),
      }));
      return { board: { ...state.board, columns } };
    }),

  handleCardMoved: (payload) =>
    set((state) => {
      if (!state.board) return state;

      let movedCard: Card | undefined;

      // Remove card from source column
      let columns = state.board.columns.map((col) => {
        if (col.id === payload.sourceColumnId) {
          const card = col.cards.find((c) => c.id === payload.cardId);
          if (card) movedCard = { ...card, columnId: payload.targetColumnId, sortOrder: payload.sortOrder };
          return { ...col, cards: col.cards.filter((c) => c.id !== payload.cardId) };
        }
        return col;
      });

      if (!movedCard) return state;

      // Insert card into target column
      columns = columns.map((col) => {
        if (col.id === payload.targetColumnId) {
          const cards = [...col.cards.filter((c) => c.id !== payload.cardId), movedCard!];
          cards.sort((a, b) => a.sortOrder - b.sortOrder);
          return { ...col, cards };
        }
        return col;
      });

      return { board: { ...state.board, columns } };
    }),

  handleCardDiscussionMarked: (payload) =>
    set((state) => {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === payload.cardId ? { ...c, isDiscussed: payload.isDiscussed, discussionOrder: payload.discussionOrder ?? c.discussionOrder } : c
        ),
      }));
      return { board: { ...state.board, columns } };
    }),

  handleVoteAdded: (vote) =>
    set((state) => {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === vote.cardId
            ? {
                ...c,
                voteCount: c.voteCount + 1,
                votedParticipantIds: c.votedParticipantIds.includes(vote.participantId)
                  ? c.votedParticipantIds
                  : [...c.votedParticipantIds, vote.participantId],
              }
            : c
        ),
      }));
      // Decrement remaining votes if it's this participant
      let remainingVotes = state.remainingVotes;
      if (remainingVotes && vote.participantId === state.participant?.id) {
        remainingVotes = {
          ...remainingVotes,
          remaining: remainingVotes.remaining - 1,
          used: remainingVotes.used + 1,
        };
      }
      return { board: { ...state.board, columns }, remainingVotes };
    }),

  handleVoteRemoved: (payload) =>
    set((state) => {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === payload.cardId
            ? {
                ...c,
                voteCount: Math.max(0, c.voteCount - 1),
                votedParticipantIds: c.votedParticipantIds.filter(
                  (id) => id !== payload.participantId
                ),
              }
            : c
        ),
      }));
      let remainingVotes = state.remainingVotes;
      if (remainingVotes && payload.participantId === state.participant?.id) {
        remainingVotes = {
          ...remainingVotes,
          remaining: remainingVotes.remaining + 1,
          used: remainingVotes.used - 1,
        };
      }
      return { board: { ...state.board, columns }, remainingVotes };
    }),

  handlePhaseChanged: (phase) =>
    set((state) => {
      if (!state.board) return state;
      return { board: { ...state.board, phase } };
    }),

  handleParticipantJoined: (participant) =>
    set((state) => {
      if (!state.board) return state;
      const alreadyExists = state.board.participants.some((p) => p.id === participant.id);
      if (alreadyExists) return state;
      return {
        board: {
          ...state.board,
          participants: [...state.board.participants, participant],
        },
      };
    }),

  handleParticipantOnline: (payload) =>
    set((state) => {
      if (!state.board) return state;
      return {
        board: {
          ...state.board,
          participants: state.board.participants.map((p) =>
            p.id === payload.participantId ? { ...p, isOnline: true } : p
          ),
        },
      };
    }),

  handleParticipantOffline: (payload) =>
    set((state) => {
      if (!state.board) return state;
      return {
        board: {
          ...state.board,
          participants: state.board.participants.map((p) =>
            p.id === payload.participantId ? { ...p, isOnline: false } : p
          ),
        },
      };
    }),

  handleMemoCreated: (memo) =>
    set((state) => {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === memo.cardId ? { ...c, memos: [...c.memos, memo] } : c
        ),
      }));
      return { board: { ...state.board, columns } };
    }),

  handleMemoUpdated: (memo) =>
    set((state) => {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === memo.cardId
            ? { ...c, memos: c.memos.map((m) => (m.id === memo.id ? memo : m)) }
            : c
        ),
      }));
      return { board: { ...state.board, columns } };
    }),

  handleMemoDeleted: (payload) =>
    set((state) => {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === payload.cardId
            ? { ...c, memos: c.memos.filter((m) => m.id !== payload.memoId) }
            : c
        ),
      }));
      return { board: { ...state.board, columns } };
    }),

  handleReactionAdded: (reaction) =>
    set((state) => {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === reaction.cardId
            ? { ...c, reactions: [...c.reactions, reaction] }
            : c
        ),
      }));
      return { board: { ...state.board, columns } };
    }),

  handleReactionRemoved: (payload) =>
    set((state) => {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === payload.cardId
            ? {
                ...c,
                reactions: c.reactions.filter(
                  (r) => !(r.participantId === payload.participantId && r.emoji === payload.emoji)
                ),
              }
            : c
        ),
      }));
      return { board: { ...state.board, columns } };
    }),

  handleActionItemCreated: (item) =>
    set((state) => ({
      actionItems: [...state.actionItems, item],
    })),

  handleActionItemUpdated: (item) =>
    set((state) => ({
      actionItems: state.actionItems.map((ai) =>
        ai.id === item.id ? item : ai
      ),
    })),

  handleActionItemStatusChanged: (payload) =>
    set((state) => ({
      actionItems: state.actionItems.map((ai) =>
        ai.id === payload.actionItemId
          ? { ...ai, status: payload.newStatus }
          : ai
      ),
    })),

  handleActionItemDeleted: (payload) =>
    set((state) => ({
      actionItems: state.actionItems.filter(
        (ai) => ai.id !== payload.actionItemId
      ),
    })),

  handleKudosSent: (kudos) =>
    set((state) => ({ kudos: [kudos, ...state.kudos] })),

  handleKudosDeleted: (payload) =>
    set((state) => ({
      kudos: state.kudos.filter((k) => k.id !== payload.id),
    })),
}));
