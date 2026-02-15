import { useState, useRef, useEffect, useCallback } from 'react';
import { SmilePlus } from 'lucide-react';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '🎉', '🤔', '👀'] as const;

interface Props {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}

export function ReactionPicker({ onSelect, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, close]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="p-1 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 rounded transition-colors disabled:opacity-50"
        aria-label="リアクションを追加"
      >
        <SmilePlus size={14} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 flex gap-0.5 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-1 z-10">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-sm leading-none"
              aria-label={`リアクション ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
