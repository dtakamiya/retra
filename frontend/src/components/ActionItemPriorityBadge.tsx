import { ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import type { ActionItemPriority } from '../types';

interface Props {
  priority: ActionItemPriority;
}

const PRIORITY_CONFIG = {
  HIGH: { icon: ArrowUp, label: '高', className: 'text-red-600 bg-red-50' },
  MEDIUM: { icon: ArrowRight, label: '中', className: 'text-yellow-600 bg-yellow-50' },
  LOW: { icon: ArrowDown, label: '低', className: 'text-gray-500 bg-gray-50' },
} as const;

export function ActionItemPriorityBadge({ priority }: Props) {
  const config = PRIORITY_CONFIG[priority];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded font-medium ${config.className}`}>
      <Icon size={10} />
      {config.label}
    </span>
  );
}
