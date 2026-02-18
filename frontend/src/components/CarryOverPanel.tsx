import { useState } from 'react';
import { ChevronDown, ChevronRight, History } from 'lucide-react';
import { useBoardStore } from '../store/boardStore';
import { useToastStore } from '../store/toastStore';
import { api } from '../api/client';
import { ActionItemStatusBadge } from './ActionItemStatusBadge';
import type { ActionItemStatus, CarryOverItem } from '../types';

const STATUS_OPTIONS: { value: ActionItemStatus; label: string }[] = [
  { value: 'OPEN', label: '未着手' },
  { value: 'IN_PROGRESS', label: '進行中' },
  { value: 'DONE', label: '完了' },
];

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'text-red-600',
  MEDIUM: 'text-yellow-600',
  LOW: 'text-gray-500',
};

const PRIORITY_LABELS: Record<string, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
};

export function CarryOverPanel() {
  const { board, participant, carryOverItems, carryOverTeamName, updateCarryOverItemStatus } = useBoardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!board?.teamName) return null;

  const isFacilitator = participant?.isFacilitator ?? false;

  const handleStatusChange = async (item: CarryOverItem, newStatus: ActionItemStatus) => {
    if (!participant) return;
    try {
      await api.updateCarryOverItemStatus(board.slug, item.id, newStatus, participant.id);
      updateCarryOverItemStatus(item.id, newStatus);
    } catch {
      addToast('error', 'ステータスの変更に失敗しました');
    }
  };

  return (
    <div className="mt-4 border-t border-gray-200 dark:border-slate-700 pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
        aria-label={isExpanded ? '折りたたみ' : '展開'}
      >
        <div className="flex items-center gap-2">
          <History size={16} className="text-gray-500 dark:text-slate-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-200">前回のアクションアイテム</span>
          {carryOverItems.length > 0 && (
            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-medium rounded-full">
              {carryOverItems.length}
            </span>
          )}
        </div>
        {isExpanded ? <ChevronDown size={16} className="text-gray-400 dark:text-slate-500" /> : <ChevronRight size={16} className="text-gray-400 dark:text-slate-500" />}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {carryOverItems.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-slate-500">未完了のアクションアイテムはありません</p>
          ) : (
            <>
              {carryOverTeamName && carryOverItems.length > 0 && (
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">
                  {carryOverItems[0].sourceBoardTitle}（{new Date(carryOverItems[0].sourceBoardClosedAt).toLocaleDateString('ja-JP')}）
                </p>
              )}
              {carryOverItems.map((item) => (
                <div key={item.id} className="p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-sm">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 dark:text-slate-200 text-xs leading-relaxed">{item.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.assigneeNickname && (
                          <span className="text-xs text-gray-500">{item.assigneeNickname}</span>
                        )}
                        <span className={`text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}>
                          {PRIORITY_LABELS[item.priority]}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {isFacilitator ? (
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item, e.target.value as ActionItemStatus)}
                          className="text-xs border border-gray-200 dark:border-slate-600 rounded px-1 py-0.5"
                          aria-label="ステータスを変更"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <ActionItemStatusBadge status={item.status} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
