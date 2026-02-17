import { describe, it, expect, beforeEach } from 'vitest';
import { useBoardStore } from '../store/boardStore';
import {
  createActionItem,
  createBoard,
  createCard,
  createCarryOverItem,
  createColumn,
  createMemo,
  createParticipant,
  createReaction,
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
      actionItems: [],
      carryOverItems: [],
      carryOverTeamName: '',
      needsRefresh: false,
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

  it('handlePhaseChanged でフェーズ変更時に needsRefresh が true にセットされる', () => {
    const board = createBoard({ phase: 'WRITING' });
    useBoardStore.setState({ board, needsRefresh: false });

    useBoardStore.getState().handlePhaseChanged('VOTING');

    const state = useBoardStore.getState();
    expect(state.needsRefresh).toBe(true);
  });

  it('clearNeedsRefresh で needsRefresh が false にリセットされる', () => {
    useBoardStore.setState({ needsRefresh: true });

    useBoardStore.getState().clearNeedsRefresh();

    const state = useBoardStore.getState();
    expect(state.needsRefresh).toBe(false);
  });

  it('handlePhaseChanged with null board returns unchanged state', () => {
    useBoardStore.setState({ board: null, needsRefresh: false });

    useBoardStore.getState().handlePhaseChanged('VOTING');

    const state = useBoardStore.getState();
    expect(state.board).toBeNull();
    expect(state.needsRefresh).toBe(false);
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

  // --- handleMemoCreated ---

  it('handleMemoCreated adds memo to correct card', () => {
    const card = createCard({ id: 'card-1', columnId: 'col-1', memos: [] });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    useBoardStore.setState({ board });

    const memo = createMemo({ id: 'memo-1', cardId: 'card-1', content: 'New memo' });
    useBoardStore.getState().handleMemoCreated(memo);

    const state = useBoardStore.getState();
    const col1 = state.board!.columns.find((c) => c.id === 'col-1');
    expect(col1!.cards[0].memos).toHaveLength(1);
    expect(col1!.cards[0].memos[0].content).toBe('New memo');
  });

  it('handleMemoCreated with null board returns unchanged state', () => {
    useBoardStore.setState({ board: null });
    const memo = createMemo();
    useBoardStore.getState().handleMemoCreated(memo);
    expect(useBoardStore.getState().board).toBeNull();
  });

  // --- handleMemoUpdated ---

  it('handleMemoUpdated updates the memo content', () => {
    const memo = createMemo({ id: 'memo-1', cardId: 'card-1', content: 'Old memo' });
    const card = createCard({ id: 'card-1', columnId: 'col-1', memos: [memo] });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    useBoardStore.setState({ board });

    const updatedMemo = createMemo({ id: 'memo-1', cardId: 'card-1', content: 'Updated memo' });
    useBoardStore.getState().handleMemoUpdated(updatedMemo);

    const state = useBoardStore.getState();
    const col1 = state.board!.columns.find((c) => c.id === 'col-1');
    expect(col1!.cards[0].memos[0].content).toBe('Updated memo');
  });

  // --- handleMemoDeleted ---

  it('handleMemoDeleted removes the memo from the card', () => {
    const memo = createMemo({ id: 'memo-1', cardId: 'card-1' });
    const card = createCard({ id: 'card-1', columnId: 'col-1', memos: [memo] });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    useBoardStore.setState({ board });

    useBoardStore.getState().handleMemoDeleted({ cardId: 'card-1', memoId: 'memo-1' });

    const state = useBoardStore.getState();
    const col1 = state.board!.columns.find((c) => c.id === 'col-1');
    expect(col1!.cards[0].memos).toHaveLength(0);
  });

  // --- handleReactionAdded ---

  it('handleReactionAdded adds reaction to correct card', () => {
    const card = createCard({ id: 'card-1', columnId: 'col-1', reactions: [] });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    useBoardStore.setState({ board });

    const reaction = createReaction({ id: 'r-1', cardId: 'card-1', emoji: '👍', participantId: 'p-1' });
    useBoardStore.getState().handleReactionAdded(reaction);

    const state = useBoardStore.getState();
    const col1 = state.board!.columns.find((c) => c.id === 'col-1');
    expect(col1!.cards[0].reactions).toHaveLength(1);
    expect(col1!.cards[0].reactions[0].emoji).toBe('👍');
  });

  it('handleReactionAdded with null board returns unchanged state', () => {
    useBoardStore.setState({ board: null });
    const reaction = createReaction();
    useBoardStore.getState().handleReactionAdded(reaction);
    expect(useBoardStore.getState().board).toBeNull();
  });

  // --- handleReactionRemoved ---

  it('handleReactionRemoved removes the matching reaction', () => {
    const reaction = createReaction({ id: 'r-1', cardId: 'card-1', emoji: '👍', participantId: 'p-1' });
    const card = createCard({ id: 'card-1', columnId: 'col-1', reactions: [reaction] });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    useBoardStore.setState({ board });

    useBoardStore.getState().handleReactionRemoved({ cardId: 'card-1', participantId: 'p-1', emoji: '👍' });

    const state = useBoardStore.getState();
    const col1 = state.board!.columns.find((c) => c.id === 'col-1');
    expect(col1!.cards[0].reactions).toHaveLength(0);
  });

  it('handleReactionRemoved only removes matching emoji+participant combo', () => {
    const r1 = createReaction({ id: 'r-1', cardId: 'card-1', emoji: '👍', participantId: 'p-1' });
    const r2 = createReaction({ id: 'r-2', cardId: 'card-1', emoji: '❤️', participantId: 'p-1' });
    const r3 = createReaction({ id: 'r-3', cardId: 'card-1', emoji: '👍', participantId: 'p-2' });
    const card = createCard({ id: 'card-1', columnId: 'col-1', reactions: [r1, r2, r3] });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    useBoardStore.setState({ board });

    useBoardStore.getState().handleReactionRemoved({ cardId: 'card-1', participantId: 'p-1', emoji: '👍' });

    const state = useBoardStore.getState();
    const col1 = state.board!.columns.find((c) => c.id === 'col-1');
    expect(col1!.cards[0].reactions).toHaveLength(2);
    expect(col1!.cards[0].reactions.map((r) => r.id)).toEqual(['r-2', 'r-3']);
  });

  it('handleReactionRemoved with null board returns unchanged state', () => {
    useBoardStore.setState({ board: null });
    useBoardStore.getState().handleReactionRemoved({ cardId: 'card-1', participantId: 'p-1', emoji: '👍' });
    expect(useBoardStore.getState().board).toBeNull();
  });

  // --- setActionItems ---

  it('setActionItems sets action items list', () => {
    const items = [
      createActionItem({ id: 'ai-1', content: 'Action 1' }),
      createActionItem({ id: 'ai-2', content: 'Action 2' }),
    ];
    useBoardStore.getState().setActionItems(items);
    expect(useBoardStore.getState().actionItems).toEqual(items);
  });

  // --- handleActionItemCreated ---

  it('handleActionItemCreated adds item to list', () => {
    const existing = createActionItem({ id: 'ai-1', content: 'Existing' });
    useBoardStore.setState({ actionItems: [existing] });

    const newItem = createActionItem({ id: 'ai-2', content: 'New item' });
    useBoardStore.getState().handleActionItemCreated(newItem);

    const state = useBoardStore.getState();
    expect(state.actionItems).toHaveLength(2);
    expect(state.actionItems[1].content).toBe('New item');
  });

  it('handleActionItemCreated adds to empty list', () => {
    const newItem = createActionItem({ id: 'ai-1', content: 'First item' });
    useBoardStore.getState().handleActionItemCreated(newItem);

    const state = useBoardStore.getState();
    expect(state.actionItems).toHaveLength(1);
    expect(state.actionItems[0]).toEqual(newItem);
  });

  // --- handleActionItemUpdated ---

  it('handleActionItemUpdated updates existing item', () => {
    const item1 = createActionItem({ id: 'ai-1', content: 'Old content' });
    const item2 = createActionItem({ id: 'ai-2', content: 'Other item' });
    useBoardStore.setState({ actionItems: [item1, item2] });

    const updatedItem = createActionItem({ id: 'ai-1', content: 'Updated content', assigneeNickname: 'Alice' });
    useBoardStore.getState().handleActionItemUpdated(updatedItem);

    const state = useBoardStore.getState();
    expect(state.actionItems).toHaveLength(2);
    expect(state.actionItems[0].content).toBe('Updated content');
    expect(state.actionItems[0].assigneeNickname).toBe('Alice');
    expect(state.actionItems[1].content).toBe('Other item');
  });

  // --- handleActionItemStatusChanged ---

  it('handleActionItemStatusChanged updates status field', () => {
    const item = createActionItem({ id: 'ai-1', status: 'OPEN' });
    useBoardStore.setState({ actionItems: [item] });

    useBoardStore.getState().handleActionItemStatusChanged({
      actionItemId: 'ai-1',
      boardSlug: 'test1234',
      newStatus: 'DONE',
    });

    const state = useBoardStore.getState();
    expect(state.actionItems[0].status).toBe('DONE');
  });

  it('handleActionItemStatusChanged only updates matching item', () => {
    const item1 = createActionItem({ id: 'ai-1', status: 'OPEN' });
    const item2 = createActionItem({ id: 'ai-2', status: 'OPEN' });
    useBoardStore.setState({ actionItems: [item1, item2] });

    useBoardStore.getState().handleActionItemStatusChanged({
      actionItemId: 'ai-1',
      boardSlug: 'test1234',
      newStatus: 'IN_PROGRESS',
    });

    const state = useBoardStore.getState();
    expect(state.actionItems[0].status).toBe('IN_PROGRESS');
    expect(state.actionItems[1].status).toBe('OPEN');
  });

  // --- handleActionItemDeleted ---

  it('handleActionItemDeleted removes item from list', () => {
    const item1 = createActionItem({ id: 'ai-1' });
    const item2 = createActionItem({ id: 'ai-2' });
    useBoardStore.setState({ actionItems: [item1, item2] });

    useBoardStore.getState().handleActionItemDeleted({ actionItemId: 'ai-1' });

    const state = useBoardStore.getState();
    expect(state.actionItems).toHaveLength(1);
    expect(state.actionItems[0].id).toBe('ai-2');
  });

  it('handleActionItemDeleted with non-existent id leaves list unchanged', () => {
    const item = createActionItem({ id: 'ai-1' });
    useBoardStore.setState({ actionItems: [item] });

    useBoardStore.getState().handleActionItemDeleted({ actionItemId: 'non-existent' });

    const state = useBoardStore.getState();
    expect(state.actionItems).toHaveLength(1);
    expect(state.actionItems[0].id).toBe('ai-1');
  });

  // --- setCarryOverItems ---

  it('setCarryOverItems sets carry-over items and team name', () => {
    const items = [
      createCarryOverItem({ id: 'co-1', content: 'Item 1' }),
      createCarryOverItem({ id: 'co-2', content: 'Item 2' }),
    ];
    useBoardStore.getState().setCarryOverItems({ items, teamName: 'Team Alpha' });

    const state = useBoardStore.getState();
    expect(state.carryOverItems).toEqual(items);
    expect(state.carryOverTeamName).toBe('Team Alpha');
  });

  // --- updateCarryOverItemStatus ---

  it('updateCarryOverItemStatus updates status for matching item', () => {
    const items = [
      createCarryOverItem({ id: 'co-1', status: 'OPEN' }),
      createCarryOverItem({ id: 'co-2', status: 'OPEN' }),
    ];
    useBoardStore.setState({ carryOverItems: items });

    useBoardStore.getState().updateCarryOverItemStatus('co-1', 'IN_PROGRESS');

    const state = useBoardStore.getState();
    expect(state.carryOverItems).toHaveLength(2);
    expect(state.carryOverItems[0].status).toBe('IN_PROGRESS');
    expect(state.carryOverItems[1].status).toBe('OPEN');
  });

  it('updateCarryOverItemStatus removes item when changed to DONE', () => {
    const items = [
      createCarryOverItem({ id: 'co-1', status: 'OPEN' }),
      createCarryOverItem({ id: 'co-2', status: 'OPEN' }),
    ];
    useBoardStore.setState({ carryOverItems: items });

    useBoardStore.getState().updateCarryOverItemStatus('co-1', 'DONE');

    const state = useBoardStore.getState();
    expect(state.carryOverItems).toHaveLength(1);
    expect(state.carryOverItems[0].id).toBe('co-2');
    expect(state.carryOverItems[0].status).toBe('OPEN');
  });

  it('updateCarryOverItemStatus with non-existent id leaves list unchanged', () => {
    const items = [createCarryOverItem({ id: 'co-1', status: 'OPEN' })];
    useBoardStore.setState({ carryOverItems: items });

    useBoardStore.getState().updateCarryOverItemStatus('non-existent', 'DONE');

    const state = useBoardStore.getState();
    expect(state.carryOverItems).toHaveLength(1);
    expect(state.carryOverItems[0].status).toBe('OPEN');
  });
});
