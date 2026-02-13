import { ListTodo } from 'lucide-react';
import { useBoardStore } from '../store/boardStore';
import { ActionItemCard } from './ActionItemCard';
import { ActionItemForm } from './ActionItemForm';
import type { ActionItem, ActionItemPriority, Participant } from '../types';

interface Props {
  actionItems: ActionItem[];
  slug: string;
  participants: Participant[];
}

interface StatusSectionProps {
  title: string;
  items: ActionItem[];
}

function StatusSection({ title, items }: StatusSectionProps) {
  return (
    <div className="mb-3">
      <h4 className="text-sm font-medium text-gray-500 mb-1.5">{title}</h4>
      <div className="space-y-2">
        {items.map((item) => (
          <ActionItemCard key={item.id} actionItem={item} />
        ))}
      </div>
    </div>
  );
}

export function ActionItemList({ actionItems, slug, participants }: Props) {
  const { board } = useBoardStore();

  if (!board) return null;

  const canAdd = board.phase === 'ACTION_ITEMS';

  const priorityOrder: Record<ActionItemPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

  const sortByPriority = (items: ActionItem[]) =>
    [...items].sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));

  const openItems = sortByPriority(actionItems.filter((ai) => ai.status === 'OPEN'));
  const inProgressItems = sortByPriority(actionItems.filter((ai) => ai.status === 'IN_PROGRESS'));
  const doneItems = sortByPriority(actionItems.filter((ai) => ai.status === 'DONE'));

  return (
    <div className="mt-6 border-t border-gray-200 pt-4 px-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <ListTodo size={20} />
        アクションアイテム
        {actionItems.length > 0 && (
          <span className="text-sm font-normal text-gray-500">({actionItems.length})</span>
        )}
      </h3>

      {openItems.length > 0 && <StatusSection title="未着手" items={openItems} />}
      {inProgressItems.length > 0 && <StatusSection title="進行中" items={inProgressItems} />}
      {doneItems.length > 0 && <StatusSection title="完了" items={doneItems} />}

      {actionItems.length === 0 && (
        <p className="text-sm text-gray-400 mb-3">アクションアイテムはまだありません</p>
      )}

      {canAdd && <ActionItemForm slug={slug} participants={participants} />}
    </div>
  );
}
