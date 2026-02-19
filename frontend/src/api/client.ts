import type {
  ActionItem,
  Board,
  Card,
  CarryOverItemsResponse,
  ExportFormat,
  Framework,
  IcebreakerAnswer,
  IcebreakerResponse,
  Kudos,
  Memo,
  PagedHistory,
  Participant,
  Phase,
  Reaction,
  RemainingVotes,
  SnapshotDetail,
  TimerAction,
  TimerState,
  TrendData,
  Vote,
} from '../types';

const BASE_URL = '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '不明なエラー' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text);
}

export const api = {
  // Board
  createBoard(title: string, framework: Framework, maxVotesPerPerson: number = 5, isAnonymous: boolean = false, teamName?: string, privateWriting: boolean = false, enableIcebreaker: boolean = false): Promise<Board> {
    return request('/boards', {
      method: 'POST',
      body: JSON.stringify({ title, framework, maxVotesPerPerson, isAnonymous, teamName, privateWriting, enableIcebreaker }),
    });
  },

  getBoard(slug: string, participantId?: string): Promise<Board> {
    const params = new URLSearchParams();
    if (participantId) params.set('participantId', participantId);
    const query = params.toString();
    return request(`/boards/${slug}${query ? `?${query}` : ''}`);
  },

  changePhase(slug: string, phase: Phase, participantId: string): Promise<Board> {
    return request(`/boards/${slug}/phase`, {
      method: 'PATCH',
      body: JSON.stringify({ phase, participantId }),
    });
  },

  // Participants
  joinBoard(slug: string, nickname: string): Promise<Participant> {
    return request(`/boards/${slug}/participants`, {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    });
  },

  // Cards
  createCard(slug: string, columnId: string, content: string, participantId: string): Promise<Card> {
    return request(`/boards/${slug}/cards`, {
      method: 'POST',
      body: JSON.stringify({ columnId, content, participantId }),
    });
  },

  updateCard(slug: string, cardId: string, content: string, participantId: string): Promise<Card> {
    return request(`/boards/${slug}/cards/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify({ content, participantId }),
    });
  },

  deleteCard(slug: string, cardId: string, participantId: string): Promise<void> {
    const params = new URLSearchParams({ participantId });
    return request(`/boards/${slug}/cards/${cardId}?${params}`, {
      method: 'DELETE',
    });
  },

  moveCard(slug: string, cardId: string, targetColumnId: string, sortOrder: number, participantId: string): Promise<void> {
    return request(`/boards/${slug}/cards/${cardId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ targetColumnId, sortOrder, participantId }),
    });
  },

  // Votes
  addVote(slug: string, cardId: string, participantId: string): Promise<Vote> {
    return request(`/boards/${slug}/votes`, {
      method: 'POST',
      body: JSON.stringify({ cardId, participantId }),
    });
  },

  removeVote(slug: string, cardId: string, participantId: string): Promise<void> {
    const params = new URLSearchParams({ cardId, participantId });
    return request(`/boards/${slug}/votes?${params}`, {
      method: 'DELETE',
    });
  },

  getRemainingVotes(slug: string, participantId: string): Promise<RemainingVotes> {
    const params = new URLSearchParams({ participantId });
    return request(`/boards/${slug}/votes/remaining?${params}`);
  },

  // Timer
  controlTimer(slug: string, action: TimerAction, participantId: string, durationSeconds?: number): Promise<TimerState> {
    return request(`/boards/${slug}/timer`, {
      method: 'POST',
      body: JSON.stringify({ action, participantId, durationSeconds }),
    });
  },

  getTimerState(slug: string): Promise<TimerState> {
    return request(`/boards/${slug}/timer`);
  },

  // Memos
  createMemo(slug: string, cardId: string, content: string, participantId: string): Promise<Memo> {
    return request(`/boards/${slug}/cards/${cardId}/memos`, {
      method: 'POST',
      body: JSON.stringify({ content, participantId }),
    });
  },

  updateMemo(slug: string, cardId: string, memoId: string, content: string, participantId: string): Promise<Memo> {
    return request(`/boards/${slug}/cards/${cardId}/memos/${memoId}`, {
      method: 'PUT',
      body: JSON.stringify({ content, participantId }),
    });
  },

  deleteMemo(slug: string, cardId: string, memoId: string, participantId: string): Promise<void> {
    const params = new URLSearchParams({ participantId });
    return request(`/boards/${slug}/cards/${cardId}/memos/${memoId}?${params}`, {
      method: 'DELETE',
    });
  },

  // Reactions
  addReaction(slug: string, cardId: string, participantId: string, emoji: string): Promise<Reaction> {
    return request(`/boards/${slug}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ cardId, participantId, emoji }),
    });
  },

  removeReaction(slug: string, cardId: string, participantId: string, emoji: string): Promise<void> {
    const params = new URLSearchParams({ cardId, participantId, emoji });
    return request(`/boards/${slug}/reactions?${params}`, {
      method: 'DELETE',
    });
  },

  // Discussion mark
  markCardDiscussed(slug: string, cardId: string, participantId: string, isDiscussed: boolean): Promise<Card> {
    return request<Card>(`/boards/${slug}/cards/${cardId}/discussed`, {
      method: 'PATCH',
      body: JSON.stringify({ participantId, isDiscussed }),
    });
  },

  // Action Items
  getActionItems(slug: string): Promise<ActionItem[]> {
    return request<ActionItem[]>(`/boards/${slug}/action-items`);
  },

  createActionItem(slug: string, content: string, participantId: string, cardId?: string, assigneeId?: string, dueDate?: string, priority?: string): Promise<ActionItem> {
    return request<ActionItem>(`/boards/${slug}/action-items`, {
      method: 'POST',
      body: JSON.stringify({ content, participantId, cardId, assigneeId, dueDate, priority }),
    });
  },

  updateActionItem(slug: string, id: string, content: string, participantId: string, assigneeId?: string, dueDate?: string, priority?: string): Promise<ActionItem> {
    return request<ActionItem>(`/boards/${slug}/action-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content, participantId, assigneeId, dueDate, priority }),
    });
  },

  updateActionItemStatus(slug: string, id: string, status: string, participantId: string): Promise<ActionItem> {
    return request<ActionItem>(`/boards/${slug}/action-items/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, participantId }),
    });
  },

  deleteActionItem(slug: string, id: string, participantId: string): Promise<void> {
    const params = new URLSearchParams({ participantId });
    return request<void>(`/boards/${slug}/action-items/${id}?${params}`, {
      method: 'DELETE',
    });
  },

  // Carry-over Items
  getCarryOverItems(slug: string): Promise<CarryOverItemsResponse> {
    return request<CarryOverItemsResponse>(`/boards/${slug}/carry-over-items`);
  },

  updateCarryOverItemStatus(slug: string, actionItemId: string, status: string, participantId: string): Promise<void> {
    return request<void>(`/boards/${slug}/carry-over-items/${actionItemId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, participantId }),
    });
  },

  // History / Dashboard
  getHistory(teamName?: string, page?: number, size?: number): Promise<PagedHistory> {
    const params = new URLSearchParams();
    if (teamName) params.set('teamName', teamName);
    if (page !== undefined) params.set('page', String(page));
    if (size !== undefined) params.set('size', String(size));
    const query = params.toString();
    return request<PagedHistory>(`/history${query ? `?${query}` : ''}`);
  },

  deleteSnapshot(snapshotId: string): Promise<void> {
    return request<void>(`/history/${snapshotId}`, {
      method: 'DELETE',
    });
  },

  getSnapshot(snapshotId: string): Promise<SnapshotDetail> {
    return request<SnapshotDetail>(`/history/${snapshotId}`);
  },

  getTrends(teamName?: string): Promise<TrendData> {
    const params = new URLSearchParams();
    if (teamName) params.set('teamName', teamName);
    const query = params.toString();
    return request<TrendData>(`/history/trends${query ? `?${query}` : ''}`);
  },

  // Export
  async exportBoard(slug: string, participantId: string, format: ExportFormat): Promise<Blob> {
    const params = new URLSearchParams({ participantId, format });
    const response = await fetch(
      `${BASE_URL}/boards/${encodeURIComponent(slug)}/export?${params}`
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '不明なエラー' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.blob();
  },

  // Kudos
  getKudos(slug: string): Promise<Kudos[]> {
    return request(`/boards/${slug}/kudos`);
  },

  sendKudos(slug: string, senderId: string, receiverId: string, category: string, message?: string): Promise<Kudos> {
    return request(`/boards/${slug}/kudos`, {
      method: 'POST',
      body: JSON.stringify({ senderId, receiverId, category, message }),
    });
  },

  deleteKudos(slug: string, kudosId: string, participantId: string): Promise<void> {
    const params = new URLSearchParams({ participantId });
    return request(`/boards/${slug}/kudos/${kudosId}?${params}`, {
      method: 'DELETE',
    });
  },

  // Icebreaker
  getIcebreaker(slug: string): Promise<IcebreakerResponse> {
    return request(`/boards/${slug}/icebreaker`);
  },

  setIcebreakerQuestion(slug: string, participantId: string, mode: 'RANDOM' | 'CUSTOM', customQuestion?: string): Promise<IcebreakerResponse> {
    return request(`/boards/${slug}/icebreaker/question`, {
      method: 'POST',
      body: JSON.stringify({ participantId, type: mode, questionText: customQuestion }),
    });
  },

  submitIcebreakerAnswer(slug: string, participantId: string, answerText: string): Promise<IcebreakerAnswer> {
    return request(`/boards/${slug}/icebreaker/answers`, {
      method: 'POST',
      body: JSON.stringify({ participantId, answerText }),
    });
  },

  updateIcebreakerAnswer(slug: string, answerId: string, participantId: string, answerText: string): Promise<IcebreakerAnswer> {
    return request(`/boards/${slug}/icebreaker/answers/${answerId}`, {
      method: 'PUT',
      body: JSON.stringify({ participantId, answerText }),
    });
  },

  deleteIcebreakerAnswer(slug: string, answerId: string, participantId: string): Promise<void> {
    const params = new URLSearchParams({ participantId });
    return request(`/boards/${slug}/icebreaker/answers/${answerId}?${params}`, {
      method: 'DELETE',
    });
  },
};
