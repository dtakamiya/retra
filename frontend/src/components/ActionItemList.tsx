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
  color: string;
}

function StatusSection({ title, items, color }: StatusSectionProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h4>
        <span className="text-[10px] text-gray-400">({items.length})</span>
      </div>
      <div className="space-y-1.5">
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
    [...items].sort((a, b) => (priorityOrder[a.priority] ?? 999) - (priorityOrder[b.priority] ?? 999));

  const openItems = sortByPriority(actionItems.filter((ai) => ai.status === 'OPEN'));
  const inProgressItems = sortByPriority(actionItems.filter((ai) => ai.status === 'IN_PROGRESS'));
  const doneItems = sortByPriority(actionItems.filter((ai) => ai.status === 'DONE'));

  return (
    <div className="mt-6 border-t border-gray-100 pt-5 px-4">
      <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-gray-800">
        <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
          <ListTodo size={16} className="text-purple-600" />
        </div>
        アクションアイテム
        {actionItems.length > 0 && (
          <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{actionItems.length}</span>
        )}
      </h3>

      {openItems.length > 0 && <StatusSection title="未着手" items={openItems} color="bg-gray-400" />}
      {inProgressItems.length > 0 && <StatusSection title="進行中" items={inProgressItems} color="bg-blue-500" />}
      {doneItems.length > 0 && <StatusSection title="完了" items={doneItems} color="bg-green-500" />}

      {actionItems.length === 0 && (
        <p className="text-sm text-gray-300 mb-3">アクションアイテムはまだありません</p>
      )}

      {canAdd && <ActionItemForm slug={slug} participants={participants} />}
    </div>
  );
}
