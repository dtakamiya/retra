import { Copy, Check, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useBoardStore } from '../store/boardStore';
import { ExportMenu } from './ExportMenu';
import { PhaseControl } from './PhaseControl';

export function BoardHeader() {
  const { board } = useBoardStore();
  const [copied, setCopied] = useState(false);

  if (!board) return null;

  const handleCopyLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">{board.title}</h1>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
            {board.framework.replace(/_/g, ' ')}
          </span>
          {board.isAnonymous && (
            <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              <EyeOff size={12} /> 匿名モード
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <PhaseControl />
          <ExportMenu />
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <Check size={16} className="text-green-500" />
                <span className="text-green-600">コピーしました！</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>共有</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
