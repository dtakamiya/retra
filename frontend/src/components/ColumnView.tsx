import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useBoardStore } from '../store/boardStore';
import { CardItem } from './CardItem';
import { CardForm } from './CardForm';
import type { Column } from '../types';

const columnDescriptions: Record<string, string> = {
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
}

export function ColumnView({ column }: Props) {
  const { board } = useBoardStore();
  const [showForm, setShowForm] = useState(false);

  const isWriting = board?.phase === 'WRITING';

  const { setNodeRef } = useDroppable({ id: column.id });

  const isPostVoting = board?.phase === 'DISCUSSION' || board?.phase === 'ACTION_ITEMS' || board?.phase === 'CLOSED';

  const maxVoteCount = useMemo(() => {
    if (!board) return 0;
    return Math.max(0, ...board.columns.flatMap((col) => col.cards.map((c) => c.voteCount)));
  }, [board]);

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
    <div className="flex-1 min-w-[280px] max-w-[400px] flex flex-col">
      <div
        className="rounded-t-xl px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: column.color + '15', borderTop: `3px solid ${column.color}` }}
      >
        <div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: column.color }}
            />
            <h2 className="font-semibold text-gray-800 text-sm">{column.name}</h2>
            <span
              className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: column.color + '20', color: column.color }}
            >
              {column.cards.length}
            </span>
          </div>
          {columnDescriptions[column.name] && (
            <p className="text-[11px] text-gray-400 mt-0.5 ml-4">{columnDescriptions[column.name]}</p>
          )}
        </div>
        {isWriting && (
          <button
            onClick={() => setShowForm(true)}
            className="p-1.5 rounded-lg hover:bg-white/60 transition-all active:scale-90"
            title="カードを追加"
          >
            <Plus size={16} style={{ color: column.color }} />
          </button>
        )}
      </div>

      <div ref={setNodeRef} className="flex-1 bg-gray-50/80 dark:bg-slate-800/30 rounded-b-xl p-2 space-y-2 overflow-y-auto">
        {showForm && isWriting && (
          <CardForm columnId={column.id} onClose={() => setShowForm(false)} />
        )}
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {sortedCards.map((card) => (
            <CardItem key={card.id} card={card} columnColor={column.color} maxVoteCount={maxVoteCount} />
          ))}
        </SortableContext>
        {column.cards.length === 0 && !showForm && (
          <div className="text-center py-10 text-gray-300 dark:text-slate-600 text-xs">
            {isWriting ? (
              <button
                onClick={() => setShowForm(true)}
                className="flex flex-col items-center gap-2 mx-auto hover:text-gray-400 dark:hover:text-slate-500 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-slate-700 transition-colors">
                  <Plus size={18} className="text-gray-400" />
                </div>
                <span>カードを追加</span>
              </button>
            ) : (
              'カードはありません'
            )}
          </div>
        )}
      </div>
    </div>
  );
}
