import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutGrid, Users, BarChart3 } from 'lucide-react';
import { api } from '../api/client';
import { useToastStore } from '../store/toastStore';
import type { Framework } from '../types';

const FRAMEWORKS: { value: Framework; label: string; description: string }[] = [
  { value: 'KPT', label: 'KPT', description: 'Keep / Problem / Try' },
  { value: 'FUN_DONE_LEARN', label: 'Fun Done Learn', description: 'Fun / Done / Learn' },
  { value: 'FOUR_LS', label: '4Ls', description: 'Liked / Learned / Lacked / Longed For' },
  { value: 'START_STOP_CONTINUE', label: 'Start Stop Continue', description: 'Start / Stop / Continue' },
];

export function HomePage() {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [title, setTitle] = useState('');
  const [framework, setFramework] = useState<Framework>('KPT');
  const [maxVotes, setMaxVotes] = useState(5);
  const [joinSlug, setJoinSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError('');
    try {
      const board = await api.createBoard(title.trim(), framework, maxVotes);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Retra</h1>
          <p className="text-lg text-gray-600">
            スクラムチームのためのレトロスペクティブボード
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm mt-4"
          >
            <BarChart3 size={16} />
            チームダッシュボード
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                mode === 'create'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <LayoutGrid size={18} />
              ボードを作成
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                mode === 'join'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users size={18} />
              ボードに参加
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ボードタイトル
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="スプリント42 ふりかえり"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  フレームワーク
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {FRAMEWORKS.map((fw) => (
                    <button
                      key={fw.value}
                      type="button"
                      onClick={() => setFramework(fw.value)}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        framework === fw.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{fw.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{fw.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1人あたりの最大投票数
                </label>
                <input
                  type="number"
                  value={maxVotes}
                  onChange={(e) => setMaxVotes(Number(e.target.value))}
                  min={1}
                  max={20}
                  className="w-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '作成中...' : 'ボードを作成'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ボードURLまたはコード
                </label>
                <input
                  type="text"
                  value={joinSlug}
                  onChange={(e) => setJoinSlug(e.target.value)}
                  placeholder="ボードコードを入力またはURLを貼り付け"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!joinSlug.trim()}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
