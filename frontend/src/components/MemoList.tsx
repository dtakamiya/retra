import { useBoardStore } from '../store/boardStore';
import { MemoForm } from './MemoForm';
import { MemoItem } from './MemoItem';
import type { Memo } from '../types';

interface Props {
  cardId: string;
  memos: Memo[];
}

export function MemoList({ cardId, memos }: Props) {
  const { board } = useBoardStore();

  if (!board) return null;

  const canAddMemo = board.phase === 'DISCUSSION' || board.phase === 'ACTION_ITEMS';

  return (
    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700 space-y-1.5">
      {memos.map((memo) => (
        <MemoItem key={memo.id} memo={memo} cardId={cardId} />
      ))}
      {canAddMemo && <MemoForm cardId={cardId} />}
    </div>
  );
}
