import { Download, ClipboardCopy, Check, FileDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useBoardStore } from '../store/boardStore';
import { downloadMarkdown, copyMarkdownToClipboard } from '../utils/exportMarkdown';

export function ExportButton() {
  const { board } = useBoardStore();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!board) return null;

  const handleDownload = () => {
    downloadMarkdown(board);
    setIsOpen(false);
  };

  const handleCopy = async () => {
    await copyMarkdownToClipboard(board);
    setCopied(true);
    setIsOpen(false);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        aria-label="エクスポート"
      >
        {copied ? (
          <>
            <Check size={16} className="text-green-500" />
            <span className="text-green-600">コピー済み</span>
          </>
        ) : (
          <>
            <FileDown size={16} />
            <span>エクスポート</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <button
            onClick={handleDownload}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-t-lg"
          >
            <Download size={16} />
            <div className="text-left">
              <div>Markdownをダウンロード</div>
              <div className="text-xs text-gray-400">.md ファイルとして保存</div>
            </div>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-b-lg border-t border-gray-100"
          >
            <ClipboardCopy size={16} />
            <div className="text-left">
              <div>クリップボードにコピー</div>
              <div className="text-xs text-gray-400">Markdown形式でコピー</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
