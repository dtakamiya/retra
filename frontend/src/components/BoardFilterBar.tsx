import { Search, X } from 'lucide-react';
import { DEFAULT_FILTER_STATE } from '../types/filter';
import type { FilterState } from '../types/filter';

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all whitespace-nowrap ${
        active
          ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700'
          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600 dark:hover:bg-slate-700'
      }`}
      role="switch"
      aria-checked={active}
    >
      {label}
    </button>
  );
}

interface Props {
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
  showDiscussionFilter: boolean;
}

export function BoardFilterBar({ filter, onFilterChange, showDiscussionFilter }: Props) {
  const hasActiveFilter = filter.searchText || filter.sortByVotes || filter.undiscussedOnly || filter.myCardsOnly;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      {/* Search input */}
      <div className="relative flex-shrink-0 w-48">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <input
          type="text"
          value={filter.searchText}
          onChange={(e) => onFilterChange({ ...filter, searchText: e.target.value })}
          placeholder="カードを検索..."
          className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-700 text-gray-700 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
          aria-label="カード検索"
        />
        {filter.searchText && (
          <button
            onClick={() => onFilterChange({ ...filter, searchText: '' })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
            aria-label="検索をクリア"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        <FilterChip
          label="投票数順"
          active={filter.sortByVotes}
          onClick={() => onFilterChange({ ...filter, sortByVotes: !filter.sortByVotes })}
        />
        {showDiscussionFilter && (
          <FilterChip
            label="未議論のみ"
            active={filter.undiscussedOnly}
            onClick={() => onFilterChange({ ...filter, undiscussedOnly: !filter.undiscussedOnly })}
          />
        )}
        <FilterChip
          label="自分のカード"
          active={filter.myCardsOnly}
          onClick={() => onFilterChange({ ...filter, myCardsOnly: !filter.myCardsOnly })}
        />
      </div>

      {/* Reset */}
      {hasActiveFilter && (
        <button
          onClick={() => onFilterChange(DEFAULT_FILTER_STATE)}
          className="flex-shrink-0 text-[11px] text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
          aria-label="フィルターをリセット"
        >
          リセット
        </button>
      )}
    </div>
  );
}
