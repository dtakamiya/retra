import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= totalPages - 1;

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
        <span data-testid="total-elements">全 {totalElements} 件</span>
        <span className="text-gray-300 dark:text-slate-600">|</span>
        <label htmlFor="page-size-select" className="sr-only">表示件数</label>
        <select
          id="page-size-select"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-sm text-gray-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
          aria-label="表示件数"
        >
          {PAGE_SIZE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}件
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          className="p-1.5 rounded-md border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="前のページ"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-gray-700 dark:text-slate-300 tabular-nums min-w-[4rem] text-center" data-testid="page-indicator">
          {totalPages > 0 ? `${currentPage + 1} / ${totalPages}` : '0 / 0'}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage || totalPages === 0}
          className="p-1.5 rounded-md border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="次のページ"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
