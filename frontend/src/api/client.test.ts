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
    });
  }

  function mock204() {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.resolve(null),
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
      body: JSON.stringify({ title: 'My Retro', framework: 'KPT', maxVotesPerPerson: 5, isAnonymous: false }),
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

  it('deleteCard sends DELETE with participantId', async () => {
    mock204();

    const result = await api.deleteCard('slug1', 'card-1', 'p-1');

    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/cards/card-1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: 'p-1' }),
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

  it('removeVote sends DELETE with cardId and participantId', async () => {
    mock204();

    const result = await api.removeVote('slug1', 'card-1', 'p-1');

    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/votes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'card-1', participantId: 'p-1' }),
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

  it('deleteMemo sends DELETE with participantId', async () => {
    mock204();

    const result = await api.deleteMemo('slug1', 'card-1', 'memo-1', 'p-1');

    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/cards/card-1/memos/memo-1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: 'p-1' }),
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

  it('removeReaction sends DELETE with cardId, participantId, emoji', async () => {
    mock204();

    const result = await api.removeReaction('slug1', 'card-1', 'p-1', '👍');

    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/reactions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'card-1', participantId: 'p-1', emoji: '👍' }),
    });
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

  it('deleteActionItem sends DELETE with participantId', async () => {
    mock204();

    const result = await api.deleteActionItem('slug1', 'ai-1', 'p-1');

    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/slug1/action-items/ai-1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: 'p-1' }),
    });
  });

  // --- Error handling ---

  it('HTTP error throws Error with message from response', async () => {
    mockErrorResponse({ message: 'ボードが見つかりません' }, 404);

    await expect(api.getBoard('nonexistent')).rejects.toThrow('ボードが見つかりません');
  });

  it('JSON parse failure falls back to default error message', async () => {
    mockJsonParseFailure(500);

    await expect(api.getBoard('broken')).rejects.toThrow('不明なエラー');
  });
});
