import { create } from 'zustand';
import type {
  Board,
  Card,
  CardDeletedPayload,
  CardMovedPayload,
  Participant,
  ParticipantOnlinePayload,
  Phase,
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

  setBoard: (board: Board) => void;
  setParticipant: (participant: Participant) => void;
  setRemainingVotes: (votes: RemainingVotes) => void;
  setTimer: (timer: TimerState) => void;
  setConnected: (connected: boolean) => void;

  // WebSocket event handlers
  handleCardCreated: (card: Card) => void;
  handleCardUpdated: (card: Card) => void;
  handleCardDeleted: (payload: CardDeletedPayload) => void;
  handleCardMoved: (payload: CardMovedPayload) => void;
  handleVoteAdded: (vote: Vote) => void;
  handleVoteRemoved: (payload: VoteRemovedPayload) => void;
  handlePhaseChanged: (phase: Phase) => void;
  handleParticipantJoined: (participant: Participant) => void;
  handleParticipantOnline: (payload: ParticipantOnlinePayload) => void;
  handleParticipantOffline: (payload: ParticipantOnlinePayload) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  board: null,
  participant: null,
  remainingVotes: null,
  timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0 },
  isConnected: false,

  setBoard: (board) => set({ board }),
  setParticipant: (participant) => set({ participant }),
  setRemainingVotes: (votes) => set({ remainingVotes: votes }),
  setTimer: (timer) => set({ timer }),
  setConnected: (connected) => set({ isConnected: connected }),

  handleCardCreated: (card) =>
    set((state) => {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) => {
        if (col.id === card.columnId) {
          return { ...col, cards: [...col.cards, card] };
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
        cards: col.cards.map((c) => (c.id === card.id ? card : c)),
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

  handleVoteAdded: (vote) =>
    set((state) => {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === vote.cardId ? { ...c, voteCount: c.voteCount + 1 } : c
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
          c.id === payload.cardId ? { ...c, voteCount: Math.max(0, c.voteCount - 1) } : c
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
}));
