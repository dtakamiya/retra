import type { ActionItemStatus } from '../types';

interface Props {
  status: ActionItemStatus;
}

const statusConfig: Record<ActionItemStatus, { label: string; colorClass: string }> = {
  OPEN: { label: '未着手', colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  IN_PROGRESS: { label: '進行中', colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  DONE: { label: '完了', colorClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
};

export function ActionItemStatusBadge({ status }: Props) {
  const { label, colorClass } = statusConfig[status];

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
      {label}
    </span>
  );
}
