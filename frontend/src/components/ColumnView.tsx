import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
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
  const isDiscussion = board?.phase === 'DISCUSSION' || board?.phase === 'ACTION_ITEMS';

  // Sort by votes in discussion phase, otherwise by creation time
  const sortedCards = useMemo(() => {
    const cards = [...column.cards];
    if (isDiscussion) {
      cards.sort((a, b) => b.voteCount - a.voteCount);
    }
    return cards;
  }, [column.cards, isDiscussion]);

  return (
    <div className="flex-1 min-w-[280px] max-w-[400px] flex flex-col">
      <div
        className="rounded-t-lg px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: column.color + '20', borderTop: `3px solid ${column.color}` }}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">{column.name}</h2>
            <span className="text-sm text-gray-500">({column.cards.length})</span>
          </div>
          {columnDescriptions[column.name] && (
            <p className="text-xs text-gray-500 mt-0.5">{columnDescriptions[column.name]}</p>
          )}
        </div>
        {isWriting && (
          <button
            onClick={() => setShowForm(true)}
            className="p-1 rounded hover:bg-white/50 transition-colors"
            title="カードを追加"
          >
            <Plus size={18} style={{ color: column.color }} />
          </button>
        )}
      </div>

      <div className="flex-1 bg-gray-100/50 rounded-b-lg p-2 space-y-2 overflow-y-auto">
        {showForm && isWriting && (
          <CardForm columnId={column.id} onClose={() => setShowForm(false)} />
        )}
        {sortedCards.map((card) => (
          <CardItem key={card.id} card={card} columnColor={column.color} />
        ))}
        {column.cards.length === 0 && !showForm && (
          <div className="text-center py-8 text-gray-400 text-sm">
            {isWriting ? '＋ボタンでカードを追加' : 'カードはありません'}
          </div>
        )}
      </div>
    </div>
  );
}
