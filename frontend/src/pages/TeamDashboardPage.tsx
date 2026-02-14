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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 size={28} />
            チームダッシュボード
          </h1>
          <Link to="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <ArrowLeft size={16} />
            ホームに戻る
          </Link>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="チーム名で検索..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
            <Search size={16} />
            検索
          </button>
        </form>

        {/* Loading */}
        {loading && <div className="text-center py-8 text-gray-500">読み込み中...</div>}

        {/* Content */}
        {!loading && (
          <>
            {/* Trend Chart */}
            {trends && trends.snapshots.length > 1 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">トレンド & エンゲージメント</h2>
                <TrendChart data={trends.snapshots} />
              </div>
            )}

            {/* History List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">レトロスペクティブ履歴</h2>
              <RetroHistoryList history={history} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
