import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Search, ArrowLeft } from 'lucide-react';
import { api } from '../api/client';
import { RetroHistoryList } from '../components/RetroHistoryList';
import { TrendChart } from '../components/TrendChart';
import type { SnapshotSummary, TrendData } from '../types';

export function TeamDashboardPage() {
  const [teamName, setTeamName] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [history, setHistory] = useState<SnapshotSummary[]>([]);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [historyData, trendsData] = await Promise.all([
        api.getHistory(teamName || undefined),
        api.getTrends(teamName || undefined),
      ]);
      setHistory(historyData);
      setTrends(trendsData);
    } catch {
      // handle error silently
    } finally {
      setLoading(false);
    }
  }, [teamName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTeamName(searchInput.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <BarChart3 size={22} className="text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              チームダッシュボード
            </h1>
          </div>
          <Link
            to="/"
            className="text-indigo-500 hover:text-indigo-700 flex items-center gap-1 text-sm transition-colors"
          >
            <ArrowLeft size={14} />
            ホームに戻る
          </Link>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8 flex gap-2 animate-[fadeIn_0.4s_ease-out]">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="チーム名で検索..."
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-indigo-600 flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-200 active:scale-[0.97]"
          >
            <Search size={15} />
            検索
          </button>
        </form>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="relative w-10 h-10 mx-auto mb-3">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-100" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 animate-spin" />
            </div>
            <p className="text-sm text-gray-400">読み込み中...</p>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            {/* Trend Chart */}
            {trends && trends.snapshots.length > 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-800 mb-4">トレンド & エンゲージメント</h2>
                <TrendChart data={trends.snapshots} />
              </div>
            )}

            {/* History List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4">レトロスペクティブ履歴</h2>
              <RetroHistoryList history={history} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
