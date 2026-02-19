import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api/client';

describe('api client', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = mockFetch;
  });

  function mockResponse(body: unknown, status = 200) {
    mockFetch.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    });
  }

  function mock204() {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.resolve(null),
      text: () => Promise.resolve(''),
    });
  }

  function mock200Empty() {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected end of JSON input')),
      text: () => Promise.resolve(''),
    });
  }

  function mockErrorResponse(body: unknown, status = 400) {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      json: () => Promise.resolve(body),
    });
  }

  function mockJsonParseFailure(status = 500) {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      json: () => Promise.reject(new Error('invalid json')),
    });
  }

  // --- createBoard ---

  it('createBoard sends POST with correct body', async () => {
    const board = { id: 'b-1', slug: 'abc' };
    mockResponse(board);

    const result = await api.createBoard('My Retro', 'KPT', 5);

    expect(result).toEqual(board);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'My Retro', framework: 'KPT', maxVotesPerPerson: 5, isAnonymous: false, privateWriting: false, enableIcebreaker: false }),
    });
  });

  it('createBoard sends POST with teamName when provided', async () => {
    const board = { id: 'b-1', slug: 'abc' };
    mockResponse(board);

    const result = await api.createBoard('My Retro', 'KPT', 5, false, 'Team Alpha');

    expect(result).toEqual(board);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'My Retro', framework: 'KPT', maxVotesPerPerson: 5, isAnonymous: false, teamName: 'Team Alpha', privateWriting: false, enableIcebreaker: false }),
    });
  });

  // --- getBoard ---

  it('getBoard sends GET to correct URL', async () => {
    const board = { id: 'b-1', slug: 'test-slug' };
    mockResponse(board);

    const result = await api.getBoard('test-slug');

    expect(result).toEqual(board);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/test-slug', {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // --- changePhase ---

  it('changePhase sends PATCH with phase and participantId', async () => {
    const board = { id: 'b-1', phase: 'VOTING' };
    mockResponse(board);

    const result = await api.changePhase('slug1', 'VOTING', 'p-1');

    expect(result).toEqual(board);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/phase', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase: 'VOTING', participantId: 'p-1' }),
    });
  });

  // --- joinBoard ---

  it('joinBoard sends POST with nickname', async () => {
    const participant = { id: 'p-1', nickname: 'Alice' };
    mockResponse(participant);

    const result = await api.joinBoard('slug1', 'Alice');

    expect(result).toEqual(participant);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'Alice' }),
    });
  });

  // --- createCard ---

  it('createCard sends POST with columnId, content, participantId', async () => {
    const card = { id: 'card-1' };
    mockResponse(card);

    const result = await api.createCard('slug1', 'col-1', 'Hello', 'p-1');

    expect(result).toEqual(card);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnId: 'col-1', content: 'Hello', participantId: 'p-1' }),
    });
  });

  // --- updateCard ---

  it('updateCard sends PUT with content and participantId', async () => {
    const card = { id: 'card-1', content: 'Updated' };
    mockResponse(card);

    const result = await api.updateCard('slug1', 'card-1', 'Updated', 'p-1');

    expect(result).toEqual(card);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/cards/card-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Updated', participantId: 'p-1' }),
    });
  });

  // --- deleteCard ---

  it('deleteCard sends DELETE with participantId as query param', async () => {
    mock204();

    const result = await api.deleteCard('slug1', 'card-1', 'p-1');

    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/cards/card-1?participantId=p-1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // --- moveCard ---

  it('moveCard sends PATCH with targetColumnId, sortOrder, participantId', async () => {
    mock204();

    const result = await api.moveCard('slug1', 'card-1', 'col-2', 0, 'p-1');

    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/cards/card-1/move', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetColumnId: 'col-2', sortOrder: 0, participantId: 'p-1' }),
    });
  });

  // --- addVote ---

  it('addVote sends POST with cardId and participantId', async () => {
    const vote = { id: 'vote-1', cardId: 'card-1', participantId: 'p-1' };
    mockResponse(vote);

    const result = await api.addVote('slug1', 'card-1', 'p-1');

    expect(result).toEqual(vote);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'card-1', participantId: 'p-1' }),
    });
  });

  // --- removeVote ---

  it('removeVote sends DELETE with cardId and participantId as query params', async () => {
    mock204();

    const result = await api.removeVote('slug1', 'card-1', 'p-1');

    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/votes?cardId=card-1&participantId=p-1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // --- getRemainingVotes ---

  it('getRemainingVotes sends GET with participantId query param', async () => {
    const remaining = { participantId: 'p-1', remaining: 3, max: 5, used: 2 };
    mockResponse(remaining);

    const result = await api.getRemainingVotes('slug1', 'p-1');

    expect(result).toEqual(remaining);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/votes/remaining?participantId=p-1', {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // --- controlTimer ---

  it('controlTimer sends POST with action, participantId, durationSeconds', async () => {
    const timer = { isRunning: true, remainingSeconds: 300, totalSeconds: 300 };
    mockResponse(timer);

    const result = await api.controlTimer('slug1', 'START', 'p-1', 300);

    expect(result).toEqual(timer);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'START', participantId: 'p-1', durationSeconds: 300 }),
    });
  });

  // --- getTimerState ---

  it('getTimerState sends GET to correct URL', async () => {
    const timer = { isRunning: false, remainingSeconds: 0, totalSeconds: 0 };
    mockResponse(timer);

    const result = await api.getTimerState('slug1');

    expect(result).toEqual(timer);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/timer', {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // --- createMemo ---

  it('createMemo sends POST with content and participantId', async () => {
    const memo = { id: 'memo-1', cardId: 'card-1', content: 'New memo' };
    mockResponse(memo, 201);

    const result = await api.createMemo('slug1', 'card-1', 'New memo', 'p-1');

    expect(result).toEqual(memo);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/cards/card-1/memos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'New memo', participantId: 'p-1' }),
    });
  });

  // --- updateMemo ---

  it('updateMemo sends PUT with content and participantId', async () => {
    const memo = { id: 'memo-1', cardId: 'card-1', content: 'Updated memo' };
    mockResponse(memo);

    const result = await api.updateMemo('slug1', 'card-1', 'memo-1', 'Updated memo', 'p-1');

    expect(result).toEqual(memo);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/cards/card-1/memos/memo-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Updated memo', participantId: 'p-1' }),
    });
  });

  // --- deleteMemo ---

  it('deleteMemo sends DELETE with participantId as query param', async () => {
    mock204();

    const result = await api.deleteMemo('slug1', 'card-1', 'memo-1', 'p-1');

    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/cards/card-1/memos/memo-1?participantId=p-1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // --- addReaction ---

  it('addReaction sends POST with cardId, participantId, emoji', async () => {
    const reaction = { id: 'r-1', cardId: 'card-1', participantId: 'p-1', emoji: '👍', createdAt: '2024-01-01' };
    mockResponse(reaction, 201);

    const result = await api.addReaction('slug1', 'card-1', 'p-1', '👍');

    expect(result).toEqual(reaction);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'card-1', participantId: 'p-1', emoji: '👍' }),
    });
  });

  // --- removeReaction ---

  it('removeReaction sends DELETE with cardId, participantId, emoji as query params', async () => {
    mock204();

    const result = await api.removeReaction('slug1', 'card-1', 'p-1', '👍');

    expect(result).toBeUndefined();
    const expectedParams = new URLSearchParams({ cardId: 'card-1', participantId: 'p-1', emoji: '👍' });
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/v1/boards/slug1/reactions?${expectedParams}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  });

  // --- exportBoard ---

  describe('exportBoard', () => {
    it('CSVエクスポートでBlobが返される', async () => {
      const mockBlob = new Blob(['csv-data'], { type: 'text/csv' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      const result = await api.exportBoard('test1234', 'p-1', 'CSV');
      expect(result).toBeInstanceOf(Blob);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/boards/test1234/export?participantId=p-1&format=CSV'
      );
    });

    it('エラー時に例外がスローされる', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: 'Only facilitator can export board' }),
      });

      await expect(api.exportBoard('test1234', 'p-2', 'CSV')).rejects.toThrow(
        'Only facilitator can export board'
      );
    });
  });

  // --- getActionItems ---

  it('getActionItems sends GET to correct URL', async () => {
    const items = [{ id: 'ai-1', content: 'Do something' }];
    mockResponse(items);

    const result = await api.getActionItems('slug1');

    expect(result).toEqual(items);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/action-items', {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // --- createActionItem ---

  it('createActionItem sends POST with content and participantId', async () => {
    const item = { id: 'ai-1', content: 'Do something' };
    mockResponse(item, 201);

    const result = await api.createActionItem('slug1', 'Do something', 'p-1');

    expect(result).toEqual(item);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/action-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Do something', participantId: 'p-1', cardId: undefined, assigneeId: undefined, dueDate: undefined }),
    });
  });

  it('createActionItem sends POST with all optional fields', async () => {
    const item = { id: 'ai-1', content: 'Do something', cardId: 'card-1', assigneeId: 'p-2', dueDate: '2025-12-31' };
    mockResponse(item, 201);

    const result = await api.createActionItem('slug1', 'Do something', 'p-1', 'card-1', 'p-2', '2025-12-31');

    expect(result).toEqual(item);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/action-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Do something', participantId: 'p-1', cardId: 'card-1', assigneeId: 'p-2', dueDate: '2025-12-31' }),
    });
  });

  // --- updateActionItem ---

  it('updateActionItem sends PUT with content and participantId', async () => {
    const item = { id: 'ai-1', content: 'Updated action' };
    mockResponse(item);

    const result = await api.updateActionItem('slug1', 'ai-1', 'Updated action', 'p-1');

    expect(result).toEqual(item);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/action-items/ai-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Updated action', participantId: 'p-1', assigneeId: undefined, dueDate: undefined }),
    });
  });

  it('updateActionItem sends PUT with all optional fields', async () => {
    const item = { id: 'ai-1', content: 'Updated action', assigneeId: 'p-2', dueDate: '2025-12-31' };
    mockResponse(item);

    const result = await api.updateActionItem('slug1', 'ai-1', 'Updated action', 'p-1', 'p-2', '2025-12-31');

    expect(result).toEqual(item);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/action-items/ai-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Updated action', participantId: 'p-1', assigneeId: 'p-2', dueDate: '2025-12-31' }),
    });
  });

  // --- updateActionItemStatus ---

  it('updateActionItemStatus sends PATCH with status and participantId', async () => {
    const item = { id: 'ai-1', status: 'IN_PROGRESS' };
    mockResponse(item);

    const result = await api.updateActionItemStatus('slug1', 'ai-1', 'IN_PROGRESS', 'p-1');

    expect(result).toEqual(item);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/action-items/ai-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'IN_PROGRESS', participantId: 'p-1' }),
    });
  });

  // --- deleteActionItem ---

  it('deleteActionItem sends DELETE with participantId as query param', async () => {
    mock204();

    const result = await api.deleteActionItem('slug1', 'ai-1', 'p-1');

    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/action-items/ai-1?participantId=p-1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // --- getCarryOverItems ---

  describe('getCarryOverItems', () => {
    it('should GET /boards/{slug}/carry-over-items', async () => {
      const response = { items: [], teamName: 'Team Alpha' };
      mockResponse(response);
      const result = await api.getCarryOverItems('test-slug');
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/test-slug/carry-over-items', expect.any(Object));
      expect(result).toEqual(response);
    });
  });

  // --- updateCarryOverItemStatus ---

  describe('updateCarryOverItemStatus', () => {
    it('should PATCH /boards/{slug}/carry-over-items/{id}/status', async () => {
      mock204();
      await api.updateCarryOverItemStatus('test-slug', 'ai-1', 'DONE', 'p-1');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/boards/test-slug/carry-over-items/ai-1/status',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'DONE', participantId: 'p-1' }),
        })
      );
    });
  });

  // --- markCardDiscussed ---

  it('markCardDiscussed sends PATCH with participantId and isDiscussed', async () => {
    const card = { id: 'card-1', isDiscussed: true };
    mockResponse(card);

    const result = await api.markCardDiscussed('slug1', 'card-1', 'p-1', true);

    expect(result).toEqual(card);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/cards/card-1/discussed', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: 'p-1', isDiscussed: true }),
    });
  });

  // --- getBoard with participantId ---

  it('getBoard sends GET with participantId query param', async () => {
    const board = { id: 'b-1', slug: 'test-slug' };
    mockResponse(board);

    const result = await api.getBoard('test-slug', 'p-1');

    expect(result).toEqual(board);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/test-slug?participantId=p-1', {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // --- History / Dashboard ---

  describe('getHistory', () => {
    it('sends GET without params when none provided', async () => {
      const history = { content: [], totalPages: 0 };
      mockResponse(history);

      const result = await api.getHistory();

      expect(result).toEqual(history);
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/history', {
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('sends GET with teamName, page, and size params', async () => {
      const history = { content: [], totalPages: 1 };
      mockResponse(history);

      const result = await api.getHistory('Team Alpha', 2, 10);

      expect(result).toEqual(history);
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/history?teamName=Team+Alpha&page=2&size=10', {
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  it('deleteSnapshot sends DELETE to correct URL', async () => {
    mock204();

    const result = await api.deleteSnapshot('snap-1');

    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/history/snap-1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('getSnapshot sends GET to correct URL', async () => {
    const snapshot = { id: 'snap-1', title: 'Retro 1' };
    mockResponse(snapshot);

    const result = await api.getSnapshot('snap-1');

    expect(result).toEqual(snapshot);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/history/snap-1', {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  describe('getTrends', () => {
    it('sends GET without params when teamName not provided', async () => {
      const trends = { points: [] };
      mockResponse(trends);

      const result = await api.getTrends();

      expect(result).toEqual(trends);
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/history/trends', {
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('sends GET with teamName param', async () => {
      const trends = { points: [] };
      mockResponse(trends);

      const result = await api.getTrends('Team Alpha');

      expect(result).toEqual(trends);
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/history/trends?teamName=Team%20Alpha', {
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  // --- Kudos ---

  it('getKudos sends GET to correct URL', async () => {
    const kudos = [{ id: 'k-1', message: 'Great job' }];
    mockResponse(kudos);

    const result = await api.getKudos('slug1');

    expect(result).toEqual(kudos);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/kudos', {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('sendKudos sends POST with correct body', async () => {
    const kudos = { id: 'k-1', senderId: 'p-1', receiverId: 'p-2', category: 'GREAT_JOB' };
    mockResponse(kudos, 201);

    const result = await api.sendKudos('slug1', 'p-1', 'p-2', 'GREAT_JOB', 'Nice work!');

    expect(result).toEqual(kudos);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/kudos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: 'p-1', receiverId: 'p-2', category: 'GREAT_JOB', message: 'Nice work!' }),
    });
  });

  it('deleteKudos sends DELETE with participantId as query param', async () => {
    mock204();

    const result = await api.deleteKudos('slug1', 'k-1', 'p-1');

    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/kudos/k-1?participantId=p-1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // --- Icebreaker ---

  it('getIcebreaker sends GET to correct URL', async () => {
    const icebreaker = { question: 'What is your hobby?', answers: [] };
    mockResponse(icebreaker);

    const result = await api.getIcebreaker('slug1');

    expect(result).toEqual(icebreaker);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/icebreaker', {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('setIcebreakerQuestion sends POST with RANDOM mode', async () => {
    const icebreaker = { question: 'Random question', answers: [] };
    mockResponse(icebreaker);

    const result = await api.setIcebreakerQuestion('slug1', 'p-1', 'RANDOM');

    expect(result).toEqual(icebreaker);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/icebreaker/question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: 'p-1', type: 'RANDOM', questionText: undefined }),
    });
  });

  it('setIcebreakerQuestion sends POST with CUSTOM mode and question', async () => {
    const icebreaker = { question: 'Custom question', answers: [] };
    mockResponse(icebreaker);

    const result = await api.setIcebreakerQuestion('slug1', 'p-1', 'CUSTOM', 'Custom question');

    expect(result).toEqual(icebreaker);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/icebreaker/question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: 'p-1', type: 'CUSTOM', questionText: 'Custom question' }),
    });
  });

  it('submitIcebreakerAnswer sends POST with correct body', async () => {
    const answer = { id: 'ans-1', participantId: 'p-1', answerText: 'My answer' };
    mockResponse(answer, 201);

    const result = await api.submitIcebreakerAnswer('slug1', 'p-1', 'My answer');

    expect(result).toEqual(answer);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/icebreaker/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: 'p-1', answerText: 'My answer' }),
    });
  });

  it('updateIcebreakerAnswer sends PUT with correct body', async () => {
    const answer = { id: 'ans-1', participantId: 'p-1', answerText: 'Updated answer' };
    mockResponse(answer);

    const result = await api.updateIcebreakerAnswer('slug1', 'ans-1', 'p-1', 'Updated answer');

    expect(result).toEqual(answer);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/icebreaker/answers/ans-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: 'p-1', answerText: 'Updated answer' }),
    });
  });

  it('deleteIcebreakerAnswer sends DELETE with participantId as query param', async () => {
    mock204();

    const result = await api.deleteIcebreakerAnswer('slug1', 'ans-1', 'p-1');

    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/icebreaker/answers/ans-1?participantId=p-1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // --- exportBoard edge cases ---

  it('exportBoard JSON parse failure in error response falls back to default message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('invalid json')),
    });

    await expect(api.exportBoard('slug1', 'p-1', 'CSV')).rejects.toThrow('不明なエラー');
  });

  it('exportBoard error response without message field uses HTTP status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({}),
    });

    await expect(api.exportBoard('slug1', 'p-1', 'CSV')).rejects.toThrow('HTTP 403');
  });

  // --- Error handling ---

  it('HTTP error throws Error with message from response', async () => {
    mockErrorResponse({ message: 'ボードが見つかりません' }, 404);

    await expect(api.getBoard('nonexistent')).rejects.toThrow('ボードが見つかりません');
  });

  it('HTTP error without message field falls back to HTTP status', async () => {
    mockErrorResponse({}, 500);

    await expect(api.getBoard('broken')).rejects.toThrow('HTTP 500');
  });

  it('JSON parse failure falls back to default error message', async () => {
    mockJsonParseFailure(500);

    await expect(api.getBoard('broken')).rejects.toThrow('不明なエラー');
  });

  it('200 with empty body returns undefined without throwing', async () => {
    mock200Empty();

    const result = await api.updateCarryOverItemStatus('test-slug', 'ai-1', 'DONE', 'p-1');
    expect(result).toBeUndefined();
  });
});
