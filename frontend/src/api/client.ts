import type {
  ActionItem,
  Board,
  Card,
  CarryOverItemsResponse,
  ExportFormat,
  Framework,
  Memo,
  Participant,
  Phase,
  Reaction,
  RemainingVotes,
  SnapshotDetail,
  SnapshotSummary,
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

  return response.json();
}

export const api = {
  // Board
  createBoard(title: string, framework: Framework, maxVotesPerPerson: number = 5, isAnonymous: boolean = false, teamName?: string): Promise<Board> {
    return request('/boards', {
      method: 'POST',
      body: JSON.stringify({ title, framework, maxVotesPerPerson, isAnonymous, teamName }),
    });
  },

  getBoard(slug: string, participantId?: string): Promise<Board> {
    const params = participantId ? `?participantId=${encodeURIComponent(participantId)}` : '';
    return request(`/boards/${slug}${params}`);
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
    return request(`/boards/${slug}/cards/${cardId}`, {
      method: 'DELETE',
      body: JSON.stringify({ participantId }),
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
    return request(`/boards/${slug}/votes`, {
      method: 'DELETE',
      body: JSON.stringify({ cardId, participantId }),
    });
  },

  getRemainingVotes(slug: string, participantId: string): Promise<RemainingVotes> {
    return request(`/boards/${slug}/votes/remaining?participantId=${participantId}`);
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
    return request(`/boards/${slug}/cards/${cardId}/memos/${memoId}`, {
      method: 'DELETE',
      body: JSON.stringify({ participantId }),
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
    return request(`/boards/${slug}/reactions`, {
      method: 'DELETE',
      body: JSON.stringify({ cardId, participantId, emoji }),
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
    return request<void>(`/boards/${slug}/action-items/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ participantId }),
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
  getHistory(teamName?: string): Promise<SnapshotSummary[]> {
    const params = teamName ? `?teamName=${encodeURIComponent(teamName)}` : '';
    return request<SnapshotSummary[]>(`/history${params}`);
  },

  getSnapshot(snapshotId: string): Promise<SnapshotDetail> {
    return request<SnapshotDetail>(`/history/${snapshotId}`);
  },

  getTrends(teamName?: string): Promise<TrendData> {
    const params = teamName ? `?teamName=${encodeURIComponent(teamName)}` : '';
    return request<TrendData>(`/history/trends${params}`);
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
};
