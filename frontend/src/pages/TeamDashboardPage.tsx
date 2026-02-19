import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Search, ArrowLeft, FileText, Vote, Users, ListTodo } from 'lucide-react';
import { api } from '../api/client';
import { useToastStore } from '../store/toastStore';
import { RetroHistoryList } from '../components/RetroHistoryList';
import { TrendChart } from '../components/TrendChart';
import { ThemeToggle } from '../components/ThemeToggle';
import type { SnapshotSummary, TrendData } from '../types';

function KpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 flex items-start gap-3 transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-slate-100 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function TeamDashboardPage() {
  const [teamName, setTeamName] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [history, setHistory] = useState<SnapshotSummary[]>([]);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const addToast = useToastStore((s) => s.addToast);

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
      addToast('error', 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [teamName, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTeamName(searchInput.trim());
  };

  const kpiData = useMemo(() => {
    if (history.length === 0) return null;
    const totalRetros = history.length;
    const totalCards = history.reduce((sum, s) => sum + s.totalCards, 0);
    const totalVotes = history.reduce((sum, s) => sum + s.totalVotes, 0);
    const totalParticipants = history.reduce((sum, s) => sum + s.totalParticipants, 0);
    const totalAiDone = history.reduce((sum, s) => sum + s.actionItemsDone, 0);
    const totalAiTotal = history.reduce((sum, s) => sum + s.actionItemsTotal, 0);
    const aiRate = totalAiTotal > 0 ? Math.round((totalAiDone / totalAiTotal) * 100) : 0;
    return { totalRetros, totalCards, totalVotes, totalParticipants, totalAiDone, totalAiTotal, aiRate };
  }, [history]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/80 to-gray-100/50 dark:from-slate-900 dark:to-slate-900/95">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50">
              <BarChart3 size={22} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              チームダッシュボード
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/"
              className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 text-sm transition-colors"
            >
              <ArrowLeft size={14} />
              ホームに戻る
            </Link>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8 flex gap-2 animate-[fadeIn_0.4s_ease-out]">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="チーム名で検索..."
            aria-label="チーム名で検索"
            className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 outline-none transition-all"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-indigo-600 flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30 active:scale-[0.97]"
          >
            <Search size={15} />
            検索
          </button>
        </form>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="relative w-10 h-10 mx-auto mb-3">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-100 dark:border-indigo-900/50" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
            </div>
            <p className="text-sm text-gray-400 dark:text-slate-500">読み込み中...</p>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            {/* KPI Summary Cards */}
            {kpiData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="kpi-summary">
                <KpiCard
                  icon={<FileText size={18} className="text-indigo-600 dark:text-indigo-400" />}
                  label="総カード数"
                  value={kpiData.totalCards}
                  sub={`${kpiData.totalRetros} 回のレトロ`}
                  color="bg-indigo-50 dark:bg-indigo-900/30"
                />
                <KpiCard
                  icon={<Vote size={18} className="text-emerald-600 dark:text-emerald-400" />}
                  label="総投票数"
                  value={kpiData.totalVotes}
                  sub={`平均 ${kpiData.totalRetros > 0 ? Math.round(kpiData.totalVotes / kpiData.totalRetros) : 0}/回`}
                  color="bg-emerald-50 dark:bg-emerald-900/30"
                />
                <KpiCard
                  icon={<Users size={18} className="text-blue-600 dark:text-blue-400" />}
                  label="延べ参加者"
                  value={kpiData.totalParticipants}
                  sub={`平均 ${kpiData.totalRetros > 0 ? Math.round(kpiData.totalParticipants / kpiData.totalRetros) : 0}人/回`}
                  color="bg-blue-50 dark:bg-blue-900/30"
                />
                <KpiCard
                  icon={<ListTodo size={18} className="text-amber-600 dark:text-amber-400" />}
                  label="AI完了率"
                  value={`${kpiData.aiRate}%`}
                  sub={`${kpiData.totalAiDone}/${kpiData.totalAiTotal} 完了`}
                  color="bg-amber-50 dark:bg-amber-900/30"
                />
              </div>
            )}

            {/* Trend Chart */}
            {trends && trends.snapshots.length > 1 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
                <h2 className="text-base font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-indigo-500" />
                  トレンド & エンゲージメント
                </h2>
                <TrendChart data={trends.snapshots} />
              </div>
            )}

            {/* History List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h2 className="text-base font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-purple-500" />
                レトロスペクティブ履歴
              </h2>
              <RetroHistoryList history={history} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
