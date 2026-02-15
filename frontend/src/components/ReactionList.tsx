import { useMemo } from 'react';
import type { Reaction } from '../types';

interface ReactionGroup {
  emoji: string;
  count: number;
  hasMyReaction: boolean;
}

interface Props {
  reactions: Reaction[];
  myParticipantId: string | undefined;
  onToggle: (emoji: string) => void;
  disabled?: boolean;
}

export function ReactionList({ reactions, myParticipantId, onToggle, disabled }: Props) {
  const groups = useMemo(() => {
    if (reactions.length === 0) return [];

    const emojiMap = new Map<string, { count: number; hasMyReaction: boolean }>();

    for (const reaction of reactions) {
      const existing = emojiMap.get(reaction.emoji);
      if (existing) {
        existing.count++;
        if (reaction.participantId === myParticipantId) {
          existing.hasMyReaction = true;
        }
      } else {
        emojiMap.set(reaction.emoji, {
          count: 1,
          hasMyReaction: reaction.participantId === myParticipantId,
        });
      }
    }

    const result: ReactionGroup[] = [];
    for (const [emoji, data] of emojiMap) {
      result.push({ emoji, ...data });
    }
    return result;
  }, [reactions, myParticipantId]);

  if (groups.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {groups.map((group) => (
        <button
          key={group.emoji}
          onClick={() => onToggle(group.emoji)}
          disabled={disabled}
          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
            group.hasMyReaction
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-600 dark:text-indigo-300'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
          } disabled:opacity-50`}
          aria-label={`${group.emoji} ${group.count}件${group.hasMyReaction ? '（リアクション済み）' : ''}`}
        >
          <span className="leading-none">{group.emoji}</span>
          <span>{group.count}</span>
        </button>
      ))}
    </div>
  );
}
