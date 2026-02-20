import { describe, it, expect } from 'vitest';
import { isDiscussionLikePhase, isPostVotingPhase } from './index';
import type { Phase } from './index';

describe('isDiscussionLikePhase', () => {
  it.each<{ phase: Phase; expected: boolean }>([
    { phase: 'ICEBREAK', expected: false },
    { phase: 'WRITING', expected: false },
    { phase: 'VOTING', expected: false },
    { phase: 'DISCUSSION', expected: true },
    { phase: 'ACTION_ITEMS', expected: true },
    { phase: 'CLOSED', expected: false },
  ])('returns $expected for $phase', ({ phase, expected }) => {
    expect(isDiscussionLikePhase(phase)).toBe(expected);
  });

  it('returns false for undefined', () => {
    expect(isDiscussionLikePhase(undefined)).toBe(false);
  });
});

describe('isPostVotingPhase', () => {
  it.each<{ phase: Phase; expected: boolean }>([
    { phase: 'ICEBREAK', expected: false },
    { phase: 'WRITING', expected: false },
    { phase: 'VOTING', expected: false },
    { phase: 'DISCUSSION', expected: true },
    { phase: 'ACTION_ITEMS', expected: true },
    { phase: 'CLOSED', expected: true },
  ])('returns $expected for $phase', ({ phase, expected }) => {
    expect(isPostVotingPhase(phase)).toBe(expected);
  });

  it('returns false for undefined', () => {
    expect(isPostVotingPhase(undefined)).toBe(false);
  });
});
