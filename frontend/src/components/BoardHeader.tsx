import { Copy, Check, EyeOff, Home } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBoardStore } from '../store/boardStore';
import { ExportMenu } from './ExportMenu';
import { PhaseControl } from './PhaseControl';
import { ThemeToggle } from './ThemeToggle';
import { OverallDiscussionProgress } from './OverallDiscussionProgress';

export function BoardHeader() {
  const { board } = useBoardStore();
  const [copied, setCopied] = useState(false);

  if (!board) return null;

  const showDiscussionProgress = board.phase === 'DISCUSSION' || board.phase === 'ACTION_ITEMS';

  const handleCopyLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-700 px-4 py-2.5 sticky top-0 z-20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            className="flex-shrink-0 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
            title="ホームに戻る"
          >
            <Home size={18} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 dark:text-slate-100 truncate">{board.title}</h1>
              <span className="flex-shrink-0 px-2 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 text-[10px] font-semibold rounded-full uppercase tracking-wide">
                {board.framework.replace(/_/g, ' ')}
              </span>
              {board.isAnonymous && (
                <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400 px-2 py-0.5 rounded-full">
                  <EyeOff size={10} /> 匿名
                </span>
              )}
            </div>
          </div>
          {showDiscussionProgress && (
            <OverallDiscussionProgress columns={board.columns} />
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <PhaseControl />
          <ExportMenu />
          <ThemeToggle />
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              copied
                ? 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500'
            }`}
          >
            {copied ? (
              <>
                <Check size={13} />
                <span>コピー済み</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>共有</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
