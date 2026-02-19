import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutGrid, Users, BarChart3, EyeOff, Sparkles, Lock, RefreshCw, Target, Lightbulb, Play } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api } from '../api/client';
import { useToastStore } from '../store/toastStore';
import { ThemeToggle } from '../components/ThemeToggle';
import type { Framework } from '../types';

const FRAMEWORKS: { value: Framework; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'KPT', label: 'KPT', description: 'Keep / Problem / Try', icon: RefreshCw },
  { value: 'FUN_DONE_LEARN', label: 'Fun Done Learn', description: 'Fun / Done / Learn', icon: Target },
  { value: 'FOUR_LS', label: '4Ls', description: 'Liked / Learned / Lacked / Longed For', icon: Lightbulb },
  { value: 'START_STOP_CONTINUE', label: 'Start Stop Continue', description: 'Start / Stop / Continue', icon: Play },
];

export function HomePage() {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [title, setTitle] = useState('');
  const [framework, setFramework] = useState<Framework>('KPT');
  const [maxVotes, setMaxVotes] = useState(5);
  const [joinSlug, setJoinSlug] = useState('');
  const [teamName, setTeamName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPrivateWriting, setIsPrivateWriting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError('');
    try {
      const board = await api.createBoard(title.trim(), framework, maxVotes, isAnonymous, teamName.trim() || undefined, isPrivateWriting);
      addToast('success', 'ボードを作成しました');
      navigate(`/board/${board.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ボードの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinSlug.trim()) return;
    const slug = joinSlug.trim().replace(/.*\/board\//, '');
    navigate(`/board/${slug}`);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] relative overflow-hidden">
      {/* Subtle decorative background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-200/40 dark:bg-indigo-950/30 rounded-full blur-[100px] animate-[float_8s_ease-in-out_infinite] motion-reduce:animate-none" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-purple-200/30 dark:bg-purple-950/20 rounded-full blur-[80px] animate-[float_12s_ease-in-out_infinite_2s] motion-reduce:animate-none" />
        <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-emerald-200/20 dark:bg-emerald-950/15 rounded-full blur-[90px] animate-[float_10s_ease-in-out_infinite_4s] motion-reduce:animate-none" />
      </div>

      {/* Theme toggle */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <div className="max-w-lg mx-auto px-5 py-20 relative z-10">
        {/* Hero */}
        <div className="text-center mb-10 animate-[fadeIn_0.6s_ease-out]">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            Retra
          </h1>
          <p className="text-base text-gray-500 dark:text-slate-400 leading-relaxed">
            スクラムチームのためのリアルタイム<br className="sm:hidden" />レトロスペクティブボード
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 text-sm mt-4 transition-colors"
          >
            <BarChart3 size={14} />
            チームダッシュボード
          </Link>
        </div>

        {/* Main card */}
        <div className="bg-white/90 dark:bg-slate-800/80 rounded-3xl border border-gray-200/80 dark:border-slate-700/60 shadow-[var(--shadow-soft-ui)] backdrop-blur-sm p-7 animate-[scaleFadeIn_0.5s_ease-out]">
          {/* Tab Switcher */}
          <div className="flex gap-1 mb-7 p-1 bg-gray-100 dark:bg-slate-900/60 rounded-xl">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all text-sm cursor-pointer ${
                mode === 'create'
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-[var(--shadow-soft-ui-tab)]'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
              }`}
            >
              <LayoutGrid size={15} />
              ボードを作成
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all text-sm cursor-pointer ${
                mode === 'join'
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-[var(--shadow-soft-ui-tab)]'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
              }`}
            >
              <Users size={15} />
              ボードに参加
            </button>
          </div>

          {error && (
            <div role="alert" className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2 animate-[scaleFadeIn_0.2s_ease-out]">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
              <div>
                <label htmlFor="board-title" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  ボードタイトル
                </label>
                <input
                  id="board-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="スプリント42 ふりかえり"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/50 border border-gray-200/60 dark:border-slate-700 shadow-[var(--shadow-soft-ui-input)] rounded-xl focus:ring-2 focus:ring-indigo-500/15 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] focus:border-indigo-400 dark:focus:border-indigo-500 outline-none transition-all text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  フレームワーク
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FRAMEWORKS.map((fw) => (
                    <button
                      key={fw.value}
                      type="button"
                      onClick={() => setFramework(fw.value)}
                      className={`p-3 border rounded-xl text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${
                        framework === fw.value
                          ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 shadow-[var(--shadow-soft-ui-active)] ring-1 ring-indigo-400/30 dark:ring-indigo-500/30'
                          : 'border-gray-200/60 dark:border-slate-700 bg-white/60 dark:bg-slate-900/30 shadow-[var(--shadow-soft-ui-inset)] hover:shadow-[var(--shadow-soft-ui-tab)] hover:scale-[1.02] hover:bg-white dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <fw.icon size={15} className={framework === fw.value ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'} />
                        <span className="font-medium text-sm text-gray-900 dark:text-slate-100">{fw.label}</span>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-slate-500 mt-1 ml-[25px]">{fw.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    チーム名（オプション）
                  </label>
                  <input
                    id="teamName"
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="チーム Alpha"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/50 border border-gray-200/60 dark:border-slate-700 shadow-[var(--shadow-soft-ui-input)] rounded-xl focus:ring-2 focus:ring-indigo-500/15 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] focus:border-indigo-400 dark:focus:border-indigo-500 outline-none transition-all text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  />
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">前回のアクションアイテムを引き継ぎます</p>
                </div>
                <div className="w-24 flex-shrink-0">
                  <label htmlFor="max-votes" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    1人あたりの最大投票数
                  </label>
                  <input
                    id="max-votes"
                    type="number"
                    value={maxVotes}
                    onChange={(e) => setMaxVotes(Number(e.target.value))}
                    min={1}
                    max={20}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900/50 border border-gray-200/60 dark:border-slate-700 shadow-[var(--shadow-soft-ui-input)] rounded-xl focus:ring-2 focus:ring-indigo-500/15 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] focus:border-indigo-400 dark:focus:border-indigo-500 outline-none transition-all text-sm text-gray-900 dark:text-slate-100 text-center"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5">
                    <EyeOff size={15} className="text-gray-400 dark:text-slate-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">匿名モード</span>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">作成者名を非表示（変更不可）</p>
                    </div>
                  </div>
                  <div
                    role="switch"
                    aria-checked={isAnonymous}
                    aria-label="匿名モード"
                    tabIndex={0}
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsAnonymous(!isAnonymous); } }}
                    className={`relative w-11 h-6 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                      isAnonymous ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        isAnonymous ? 'translate-x-5' : ''
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5">
                    <Lock size={15} className="text-gray-400 dark:text-slate-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">プライベート記述モード</span>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">記入中は他の参加者のカードが非表示</p>
                    </div>
                  </div>
                  <div
                    role="switch"
                    aria-checked={isPrivateWriting}
                    aria-label="プライベート記述モード"
                    tabIndex={0}
                    onClick={() => setIsPrivateWriting(!isPrivateWriting)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsPrivateWriting(!isPrivateWriting); } }}
                    className={`relative w-11 h-6 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                      isPrivateWriting ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        isPrivateWriting ? 'translate-x-5' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="w-full py-3 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[var(--shadow-soft-ui-btn)] hover:shadow-[var(--shadow-soft-ui-btn-hover)] active:scale-[0.97] active:shadow-[var(--shadow-soft-ui-btn-pressed)] text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
              >
                {loading ? <span className="inline-flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />作成中...</span> : 'ボードを作成'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
              <div>
                <label htmlFor="join-slug" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  ボードURLまたはコード
                </label>
                <input
                  id="join-slug"
                  type="text"
                  value={joinSlug}
                  onChange={(e) => setJoinSlug(e.target.value)}
                  placeholder="ボードコードを入力またはURLを貼り付け"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/50 border border-gray-200/60 dark:border-slate-700 shadow-[var(--shadow-soft-ui-input)] rounded-xl focus:ring-2 focus:ring-indigo-500/15 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] focus:border-indigo-400 dark:focus:border-indigo-500 outline-none transition-all text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!joinSlug.trim()}
                className="w-full py-3 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[var(--shadow-soft-ui-btn)] hover:shadow-[var(--shadow-soft-ui-btn-hover)] active:scale-[0.97] active:shadow-[var(--shadow-soft-ui-btn-pressed)] text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
              >
                ボードに参加
              </button>
            </form>
          )}
        </div>

        {/* Feature hints */}
        <div className="flex justify-center gap-6 mt-8 text-xs text-gray-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5 animate-[staggerFadeIn_0.5s_ease-out_0.3s_both]">
            <Sparkles size={12} />
            リアルタイム同期
          </div>
          <div className="flex items-center gap-1.5 animate-[staggerFadeIn_0.5s_ease-out_0.4s_both]">
            <Users size={12} />
            チームコラボレーション
          </div>
          <div className="flex items-center gap-1.5 animate-[staggerFadeIn_0.5s_ease-out_0.5s_both]">
            <BarChart3 size={12} />
            トレンド分析
          </div>
        </div>
      </div>
    </div>
  );
}
