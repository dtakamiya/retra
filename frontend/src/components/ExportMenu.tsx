import { Check, ClipboardCopy, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { useBoardStore } from '../store/boardStore';
import type { ExportFormat } from '../types';
import { copyMarkdownToClipboard } from '../utils/exportMarkdown';

export function ExportMenu() {
  const { board, participant } = useBoardStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!board) return null;

  const handleExport = async (format: ExportFormat) => {
    if (!participant) return;
    setIsExporting(true);
    setError(null);
    try {
      const blob = await api.exportBoard(board.slug, participant.id, format);
      const extension = format === 'CSV' ? 'csv' : 'md';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${board.slug}_export.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エクスポートに失敗しました');
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const handleCopy = async () => {
    setError(null);
    try {
      await copyMarkdownToClipboard(board);
      setCopied(true);
      setIsOpen(false);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'コピーに失敗しました');
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-50 ${
          copied
            ? 'bg-green-50 text-green-600 border border-green-200'
            : 'border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
        }`}
        aria-label="エクスポート"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {copied ? (
          <>
            <Check size={13} className="text-green-500" />
            <span>コピー済み</span>
          </>
        ) : (
          <>
            <Download size={13} />
            <span>{isExporting ? '...' : 'エクスポート'}</span>
          </>
        )}
      </button>

      {error && (
        <p className="absolute right-0 mt-1 text-red-500 text-xs whitespace-nowrap" role="alert">
          {error}
        </p>
      )}

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-200/50 z-50 animate-[scaleFadeIn_0.15s_ease-out] overflow-hidden"
          role="menu"
        >
          {participant && (
            <>
              <button
                onClick={() => handleExport('CSV')}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
                role="menuitem"
              >
                <FileSpreadsheet size={15} className="text-green-600" />
                <div>
                  <div className="font-medium text-gray-700">CSV形式でダウンロード</div>
                  <div className="text-[11px] text-gray-400">.csv ファイルとして保存</div>
                </div>
              </button>
              <button
                onClick={() => handleExport('MARKDOWN')}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors border-t border-gray-50"
                role="menuitem"
              >
                <FileText size={15} className="text-blue-600" />
                <div>
                  <div className="font-medium text-gray-700">Markdown形式でダウンロード</div>
                  <div className="text-[11px] text-gray-400">.md ファイルとして保存</div>
                </div>
              </button>
            </>
          )}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors border-t border-gray-50`}
            role="menuitem"
          >
            <ClipboardCopy size={15} className="text-purple-600" />
            <div>
              <div className="font-medium text-gray-700">クリップボードにコピー</div>
              <div className="text-[11px] text-gray-400">Markdown形式でコピー</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
