import { useBoardStore } from '../store/boardStore';
import { ColumnView } from './ColumnView';

export function BoardView() {
  const { board } = useBoardStore();

  if (!board) return null;

  return (
    <div className="flex gap-4 p-4 min-h-0 pb-20 lg:pb-4">
      {board.columns.map((column) => (
        <ColumnView key={column.id} column={column} />
      ))}
    </div>
  );
}
