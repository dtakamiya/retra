import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useBoardStore } from '../store/boardStore';
import { CardItem } from './CardItem';
import { CardForm } from './CardForm';
import { DiscussionProgress } from './DiscussionProgress';
import type { Column } from '../types';
import { isDiscussionLikePhase, isPostVotingPhase } from '../types';

const COLUMN_DESCRIPTIONS: Record<string, string> = {
  // KPT
  Keep: '続けたいこと・うまくいっていること',
  Problem: '困っていること・課題',
  Try: '次に試したいこと',
  // Fun Done Learn
  Fun: '楽しかったこと',
  Done: 'やり遂げたこと',
  Learn: '学んだこと',
  // 4Ls
  Liked: '良かったこと',
  Learned: '学んだこと',
  Lacked: '不足していたこと',
  'Longed For': '欲しかったこと',
  // Start Stop Continue
  Start: '新しく始めたいこと',
  Stop: 'やめたいこと',
  Continue: '続けたいこと',
};

interface Props {
  column: Column;
  maxVoteCount: number;
}

export function ColumnView({ column, maxVoteCount }: Props) {
  const board = useBoardStore((s) => s.board);
  const [showForm, setShowForm] = useState(false);

  const isWriting = board?.phase === 'WRITING';
  const isDiscussionLike = isDiscussionLikePhase(board?.phase);

  const { setNodeRef } = useDroppable({ id: column.id });

  const isPostVoting = isPostVotingPhase(board?.phase);

  const sortedCards = useMemo(() => {
    const cards = [...column.cards];
    if (isPostVoting) {
      cards.sort((a, b) => {
        // 未議論カードを先に表示
        const aDiscussed = a.isDiscussed ? 1 : 0;
        const bDiscussed = b.isDiscussed ? 1 : 0;
        if (aDiscussed !== bDiscussed) return aDiscussed - bDiscussed;
        // 投票数の多い順
        return b.voteCount - a.voteCount || a.sortOrder - b.sortOrder;
      });
    } else {
      cards.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return cards;
  }, [column.cards, isPostVoting]);

  const cardIds = useMemo(() => sortedCards.map((c) => c.id), [sortedCards]);

  return (
    <div className="flex-1 min-w-[280px] flex flex-col overflow-hidden">
      <div
        className="px-4 py-3 flex items-center justify-between border-l-[3px]"
        style={{ borderLeftColor: column.color, backgroundColor: column.color + '08' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: column.color }}
            />
            <h2 className="font-semibold text-gray-800 dark:text-slate-100 text-sm">{column.name}</h2>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700"
              style={{ color: column.color }}
            >
              {column.cards.length}
            </span>
            {column.hiddenCardCount > 0 && (
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                +{column.hiddenCardCount}件非表示
              </span>
            )}
          </div>
          {COLUMN_DESCRIPTIONS[column.name] && (
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 ml-4">{COLUMN_DESCRIPTIONS[column.name]}</p>
          )}
          {isDiscussionLike && (
            <DiscussionProgress cards={column.cards} color={column.color} />
          )}
        </div>
      </div>

      <div ref={setNodeRef} className="flex-1 p-2 space-y-2.5 overflow-y-auto">
        {showForm && isWriting && (
          <CardForm columnId={column.id} onClose={() => setShowForm(false)} />
        )}
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {sortedCards.map((card) => (
            <CardItem key={card.id} card={card} columnColor={column.color} columnName={column.name} maxVoteCount={maxVoteCount} />
          ))}
        </SortableContext>
        {column.cards.length === 0 && !showForm && (
          <div className="text-center py-12 text-gray-400 dark:text-slate-500 text-xs">
            {isWriting ? (
              <button
                onClick={() => setShowForm(true)}
                className="flex flex-col items-center gap-2.5 mx-auto hover:text-gray-500 dark:hover:text-slate-400 transition-all group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
              >
                <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-slate-700 transition-all group-hover:scale-105 border-2 border-dashed border-gray-200 dark:border-slate-700">
                  <Plus size={20} className="text-gray-400 dark:text-slate-500" />
                </div>
                <span className="text-gray-500 dark:text-slate-400">カードを追加</span>
              </button>
            ) : (
              <span className="text-gray-400 dark:text-slate-500">カードはありません</span>
            )}
          </div>
        )}
        {isWriting && !showForm && column.cards.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-gray-100/50 dark:hover:bg-slate-700/30 rounded-lg transition-colors cursor-pointer mt-1"
            title="カードを追加"
          >
            <Plus size={16} />
            <span>カードを追加</span>
          </button>
        )}
      </div>
    </div>
  );
}
