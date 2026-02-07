import type {
  Board,
  Card,
  Framework,
  Participant,
  Phase,
  RemainingVotes,
  TimerAction,
  TimerState,
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
  createBoard(title: string, framework: Framework, maxVotesPerPerson: number = 5): Promise<Board> {
    return request('/boards', {
      method: 'POST',
      body: JSON.stringify({ title, framework, maxVotesPerPerson }),
    });
  },

  getBoard(slug: string): Promise<Board> {
    return request(`/boards/${slug}`);
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
};
