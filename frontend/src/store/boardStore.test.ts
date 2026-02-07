import { describe, it, expect, beforeEach } from 'vitest';
import { useBoardStore } from '../store/boardStore';
import {
  createBoard,
  createCard,
  createColumn,
  createParticipant,
  createVote,
  createRemainingVotes,
} from '../test/fixtures';

describe('boardStore', () => {
  beforeEach(() => {
    useBoardStore.setState({
      board: null,
      participant: null,
      remainingVotes: null,
      timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0 },
      isConnected: false,
    });
  });

  // --- Simple setters ---

  it('setBoard sets the board', () => {
    const board = createBoard();
    useBoardStore.getState().setBoard(board);
    expect(useBoardStore.getState().board).toEqual(board);
  });

  it('setParticipant sets participant', () => {
    const participant = createParticipant();
    useBoardStore.getState().setParticipant(participant);
    expect(useBoardStore.getState().participant).toEqual(participant);
  });

  it('setRemainingVotes sets remaining votes', () => {
    const votes = createRemainingVotes();
    useBoardStore.getState().setRemainingVotes(votes);
    expect(useBoardStore.getState().remainingVotes).toEqual(votes);
  });

  it('setTimer sets timer', () => {
    const timer = { isRunning: true, remainingSeconds: 120, totalSeconds: 300 };
    useBoardStore.getState().setTimer(timer);
    expect(useBoardStore.getState().timer).toEqual(timer);
  });

  it('setConnected sets connection status', () => {
    useBoardStore.getState().setConnected(true);
    expect(useBoardStore.getState().isConnected).toBe(true);
  });

  // --- handleCardCreated ---

  it('handleCardCreated adds card to correct column', () => {
    const board = createBoard();
    useBoardStore.setState({ board });

    const newCard = createCard({ id: 'card-new', columnId: 'col-2', content: 'New card' });
    useBoardStore.getState().handleCardCreated(newCard);

    const state = useBoardStore.getState();
    const col2 = state.board!.columns.find((c) => c.id === 'col-2');
    expect(col2!.cards).toHaveLength(1);
    expect(col2!.cards[0]).toEqual(newCard);

    // Other columns remain unchanged
    const col1 = state.board!.columns.find((c) => c.id === 'col-1');
    expect(col1!.cards).toHaveLength(0);
  });

  it('handleCardCreated with null board returns unchanged state', () => {
    useBoardStore.setState({ board: null });
    const card = createCard();
    useBoardStore.getState().handleCardCreated(card);
    expect(useBoardStore.getState().board).toBeNull();
  });

  // --- handleCardUpdated ---

  it('handleCardUpdated updates the card content', () => {
    const existingCard = createCard({ id: 'card-1', columnId: 'col-1', content: 'Old content' });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [existingCard] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    useBoardStore.setState({ board });

    const updatedCard = createCard({ id: 'card-1', columnId: 'col-1', content: 'Updated content' });
    useBoardStore.getState().handleCardUpdated(updatedCard);

    const state = useBoardStore.getState();
    const col1 = state.board!.columns.find((c) => c.id === 'col-1');
    expect(col1!.cards[0].content).toBe('Updated content');
  });

  // --- handleCardDeleted ---

  it('handleCardDeleted removes the card from columns', () => {
    const card = createCard({ id: 'card-1', columnId: 'col-1' });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    useBoardStore.setState({ board });

    useBoardStore.getState().handleCardDeleted({ cardId: 'card-1', columnId: 'col-1' });

    const state = useBoardStore.getState();
    const col1 = state.board!.columns.find((c) => c.id === 'col-1');
    expect(col1!.cards).toHaveLength(0);
  });

  // --- handleVoteAdded ---

  it('handleVoteAdded increments voteCount for correct card', () => {
    const card = createCard({ id: 'card-1', columnId: 'col-1', voteCount: 2 });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    useBoardStore.setState({ board });

    const vote = createVote({ cardId: 'card-1', participantId: 'p-other' });
    useBoardStore.getState().handleVoteAdded(vote);

    const state = useBoardStore.getState();
    const col1 = state.board!.columns.find((c) => c.id === 'col-1');
    expect(col1!.cards[0].voteCount).toBe(3);
  });

  it('handleVoteAdded decrements remainingVotes when same participant', () => {
    const card = createCard({ id: 'card-1', columnId: 'col-1', voteCount: 0 });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    const participant = createParticipant({ id: 'p-1' });
    const remainingVotes = createRemainingVotes({ participantId: 'p-1', remaining: 5, used: 0 });
    useBoardStore.setState({ board, participant, remainingVotes });

    const vote = createVote({ cardId: 'card-1', participantId: 'p-1' });
    useBoardStore.getState().handleVoteAdded(vote);

    const state = useBoardStore.getState();
    expect(state.remainingVotes!.remaining).toBe(4);
    expect(state.remainingVotes!.used).toBe(1);
  });

  it('handleVoteAdded does NOT decrement remainingVotes for different participant', () => {
    const card = createCard({ id: 'card-1', columnId: 'col-1', voteCount: 0 });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    const participant = createParticipant({ id: 'p-1' });
    const remainingVotes = createRemainingVotes({ participantId: 'p-1', remaining: 5, used: 0 });
    useBoardStore.setState({ board, participant, remainingVotes });

    const vote = createVote({ cardId: 'card-1', participantId: 'p-other' });
    useBoardStore.getState().handleVoteAdded(vote);

    const state = useBoardStore.getState();
    expect(state.remainingVotes!.remaining).toBe(5);
    expect(state.remainingVotes!.used).toBe(0);
  });

  // --- handleVoteRemoved ---

  it('handleVoteRemoved decrements voteCount (min 0)', () => {
    const card = createCard({ id: 'card-1', columnId: 'col-1', voteCount: 0 });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    useBoardStore.setState({ board });

    useBoardStore.getState().handleVoteRemoved({ cardId: 'card-1', participantId: 'p-other' });

    const state = useBoardStore.getState();
    const col1 = state.board!.columns.find((c) => c.id === 'col-1');
    expect(col1!.cards[0].voteCount).toBe(0);
  });

  it('handleVoteRemoved increments remainingVotes when same participant', () => {
    const card = createCard({ id: 'card-1', columnId: 'col-1', voteCount: 3 });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    const participant = createParticipant({ id: 'p-1' });
    const remainingVotes = createRemainingVotes({ participantId: 'p-1', remaining: 2, used: 3 });
    useBoardStore.setState({ board, participant, remainingVotes });

    useBoardStore.getState().handleVoteRemoved({ cardId: 'card-1', participantId: 'p-1' });

    const state = useBoardStore.getState();
    expect(state.remainingVotes!.remaining).toBe(3);
    expect(state.remainingVotes!.used).toBe(2);
  });

  // --- handleCardMoved ---

  it('handleCardMoved moves card within same column', () => {
    const card1 = createCard({ id: 'card-1', columnId: 'col-1', sortOrder: 1 });
    const card2 = createCard({ id: 'card-2', columnId: 'col-1', sortOrder: 2 });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card1, card2] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    useBoardStore.setState({ board });

    useBoardStore.getState().handleCardMoved({
      cardId: 'card-2',
      sourceColumnId: 'col-1',
      targetColumnId: 'col-1',
      sortOrder: 0,
    });

    const state = useBoardStore.getState();
    const col1 = state.board!.columns.find((c) => c.id === 'col-1');
    expect(col1!.cards).toHaveLength(2);
    expect(col1!.cards[0].id).toBe('card-2');
    expect(col1!.cards[0].sortOrder).toBe(0);
  });

  it('handleCardMoved moves card across columns', () => {
    const card = createCard({ id: 'card-1', columnId: 'col-1', sortOrder: 0 });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    useBoardStore.setState({ board });

    useBoardStore.getState().handleCardMoved({
      cardId: 'card-1',
      sourceColumnId: 'col-1',
      targetColumnId: 'col-2',
      sortOrder: 0,
    });

    const state = useBoardStore.getState();
    const col1 = state.board!.columns.find((c) => c.id === 'col-1');
    const col2 = state.board!.columns.find((c) => c.id === 'col-2');
    expect(col1!.cards).toHaveLength(0);
    expect(col2!.cards).toHaveLength(1);
    expect(col2!.cards[0].id).toBe('card-1');
    expect(col2!.cards[0].columnId).toBe('col-2');
  });

  it('handleCardMoved with null board returns unchanged state', () => {
    useBoardStore.setState({ board: null });
    useBoardStore.getState().handleCardMoved({
      cardId: 'card-1',
      sourceColumnId: 'col-1',
      targetColumnId: 'col-2',
      sortOrder: 0,
    });
    expect(useBoardStore.getState().board).toBeNull();
  });

  it('handleCardMoved with non-existent card returns unchanged state', () => {
    const board = createBoard();
    useBoardStore.setState({ board });

    useBoardStore.getState().handleCardMoved({
      cardId: 'non-existent',
      sourceColumnId: 'col-1',
      targetColumnId: 'col-2',
      sortOrder: 0,
    });

    const state = useBoardStore.getState();
    expect(state.board).toEqual(board);
  });

  // --- handlePhaseChanged ---

  it('handlePhaseChanged updates board phase', () => {
    const board = createBoard({ phase: 'WRITING' });
    useBoardStore.setState({ board });

    useBoardStore.getState().handlePhaseChanged('VOTING');

    const state = useBoardStore.getState();
    expect(state.board!.phase).toBe('VOTING');
  });

  // --- handleParticipantJoined ---

  it('handleParticipantJoined adds participant', () => {
    const board = createBoard({ participants: [createParticipant({ id: 'p-1' })] });
    useBoardStore.setState({ board });

    const newParticipant = createParticipant({ id: 'p-2', nickname: 'NewUser', isFacilitator: false });
    useBoardStore.getState().handleParticipantJoined(newParticipant);

    const state = useBoardStore.getState();
    expect(state.board!.participants).toHaveLength(2);
    expect(state.board!.participants[1].id).toBe('p-2');
    expect(state.board!.participants[1].nickname).toBe('NewUser');
  });

  // --- handleParticipantOnline ---

  it('handleParticipantOnline sets participant online', () => {
    const board = createBoard({
      participants: [createParticipant({ id: 'p-1', isOnline: false })],
    });
    useBoardStore.setState({ board });

    useBoardStore.getState().handleParticipantOnline({ participantId: 'p-1' });

    const state = useBoardStore.getState();
    expect(state.board!.participants[0].isOnline).toBe(true);
  });

  // --- handleParticipantOffline ---

  it('handleParticipantOffline sets participant offline', () => {
    const board = createBoard({
      participants: [createParticipant({ id: 'p-1', isOnline: true })],
    });
    useBoardStore.setState({ board });

    useBoardStore.getState().handleParticipantOffline({ participantId: 'p-1' });

    const state = useBoardStore.getState();
    expect(state.board!.participants[0].isOnline).toBe(false);
  });
});
