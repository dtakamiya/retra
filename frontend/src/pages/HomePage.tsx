import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutGrid, Users, BarChart3, EyeOff, Sparkles, Lock } from 'lucide-react';
import { api } from '../api/client';
import { useToastStore } from '../store/toastStore';
import { ThemeToggle } from '../components/ThemeToggle';
import type { Framework } from '../types';

const FRAMEWORKS: { value: Framework; label: string; description: string; icon: string }[] = [
  { value: 'KPT', label: 'KPT', description: 'Keep / Problem / Try', icon: '🔄' },
  { value: 'FUN_DONE_LEARN', label: 'Fun Done Learn', description: 'Fun / Done / Learn', icon: '🎯' },
  { value: 'FOUR_LS', label: '4Ls', description: 'Liked / Learned / Lacked / Longed For', icon: '💡' },
  { value: 'START_STOP_CONTINUE', label: 'Start Stop Continue', description: 'Start / Stop / Continue', icon: '🚀' },
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-100 dark:bg-indigo-900/30 rounded-full opacity-40 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-purple-100 dark:bg-purple-900/20 rounded-full opacity-30 blur-3xl animate-[float_6s_ease-in-out_infinite_1s]" />
        <div className="absolute -bottom-12 right-1/3 w-64 h-64 bg-blue-100 dark:bg-blue-900/20 rounded-full opacity-30 blur-3xl animate-[float_7s_ease-in-out_infinite_2s]" />
      </div>

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-12 animate-[fadeIn_0.6s_ease-out]">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full mb-6 backdrop-blur-sm">
            <Sparkles size={12} />
            チームのふりかえりをもっと効果的に
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4 tracking-tight">
            Retra
          </h1>
          <p className="text-lg text-gray-500 dark:text-slate-400 leading-relaxed">
            スクラムチームのためのリアルタイム<br className="sm:hidden" />レトロスペクティブボード
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm mt-5 transition-colors group"
          >
            <BarChart3 size={16} className="group-hover:scale-110 transition-transform" />
            チームダッシュボード
          </Link>
        </div>

        <div className="glass-strong rounded-2xl shadow-xl shadow-indigo-100/50 dark:shadow-black/20 p-8 animate-[scaleFadeIn_0.5s_ease-out]">
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-8 p-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all text-sm ${
                mode === 'create'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
              }`}
            >
              <LayoutGrid size={16} />
              ボードを作成
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all text-sm ${
                mode === 'join'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
              }`}
            >
              <Users size={16} />
              ボードに参加
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2 animate-[scaleFadeIn_0.2s_ease-out]">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  ボードタイトル
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="スプリント42 ふりかえり"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  フレームワーク
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {FRAMEWORKS.map((fw) => (
                    <button
                      key={fw.value}
                      type="button"
                      onClick={() => setFramework(fw.value)}
                      className={`p-3 border-2 rounded-xl text-left transition-all hover:-translate-y-0.5 ${
                        framework === fw.value
                          ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/30 shadow-sm shadow-indigo-100 dark:shadow-indigo-900/30'
                          : 'border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 hover:border-gray-200 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{fw.icon}</span>
                        <span className="font-medium text-sm text-gray-900 dark:text-slate-100">{fw.label}</span>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-slate-500 mt-1 ml-7">{fw.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  1人あたりの最大投票数
                </label>
                <input
                  type="number"
                  value={maxVotes}
                  onChange={(e) => setMaxVotes(Number(e.target.value))}
                  min={1}
                  max={20}
                  className="w-24 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all text-sm text-gray-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  チーム名（オプション）
                </label>
                <input
                  id="teamName"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="チーム Alpha"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                />
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">同じチーム名のレトロから前回のアクションアイテムを引き継ぎます</p>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    role="switch"
                    aria-checked={isAnonymous}
                    tabIndex={0}
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsAnonymous(!isAnonymous); } }}
                    className={`relative w-11 h-6 rounded-full transition-all ${
                      isAnonymous ? 'bg-indigo-600 shadow-sm shadow-indigo-200 dark:shadow-indigo-900' : 'bg-gray-300 dark:bg-slate-600 group-hover:bg-gray-400 dark:group-hover:bg-slate-500'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        isAnonymous ? 'translate-x-5' : ''
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <EyeOff size={15} className="text-gray-400 dark:text-slate-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">匿名モード</span>
                  </div>
                </label>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 ml-14">カードの作成者名を非表示にします（作成後は変更不可）</p>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    role="switch"
                    aria-checked={isPrivateWriting}
                    tabIndex={0}
                    onClick={() => setIsPrivateWriting(!isPrivateWriting)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsPrivateWriting(!isPrivateWriting); } }}
                    className={`relative w-11 h-6 rounded-full transition-all ${
                      isPrivateWriting ? 'bg-indigo-600 shadow-sm shadow-indigo-200 dark:shadow-indigo-900' : 'bg-gray-300 dark:bg-slate-600 group-hover:bg-gray-400 dark:group-hover:bg-slate-500'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        isPrivateWriting ? 'translate-x-5' : ''
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock size={15} className="text-gray-400 dark:text-slate-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">プライベート記述モード</span>
                  </div>
                </label>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 ml-14">記入フェーズ中は他の参加者のカードが見えません（投票フェーズで一斉公開）</p>
              </div>

              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30 hover:shadow-md hover:shadow-indigo-200 dark:hover:shadow-indigo-900/30 active:scale-[0.98] text-sm"
              >
                {loading ? '作成中...' : 'ボードを作成'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  ボードURLまたはコード
                </label>
                <input
                  type="text"
                  value={joinSlug}
                  onChange={(e) => setJoinSlug(e.target.value)}
                  placeholder="ボードコードを入力またはURLを貼り付け"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!joinSlug.trim()}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30 hover:shadow-md hover:shadow-indigo-200 dark:hover:shadow-indigo-900/30 active:scale-[0.98] text-sm"
              >
                ボードに参加
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
