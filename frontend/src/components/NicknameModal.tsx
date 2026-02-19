import { useEffect, useRef, useState } from 'react';
import { Users } from 'lucide-react';

interface Props {
  onJoin: (nickname: string) => Promise<void>;
  boardTitle: string;
}

export function NicknameModal({ onJoin, boardTitle }: Props) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onJoin(nickname.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : '参加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nickname-modal-title"
    >
      <div ref={dialogRef} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl dark:shadow-black/40 max-w-md w-full p-8 animate-[scaleFadeIn_0.3s_ease-out]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
            <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 id="nickname-modal-title" className="text-lg font-bold text-gray-900 dark:text-slate-100">ボードに参加</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">{boardTitle}</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2 animate-[scaleFadeIn_0.2s_ease-out]">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
            ニックネーム
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="ニックネームを入力"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-600 outline-none transition-all text-sm dark:text-slate-100 dark:placeholder:text-slate-500 mb-5"
            autoFocus
            required
            maxLength={20}
          />
          <button
            type="submit"
            disabled={loading || !nickname.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-200 hover:shadow-md active:scale-[0.98] text-sm"
          >
            {loading ? '参加中...' : '参加'}
          </button>
        </form>
      </div>
    </div>
  );
}
