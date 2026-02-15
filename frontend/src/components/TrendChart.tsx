import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, FileText, Vote, CheckCircle, Users } from 'lucide-react';
import type { TrendPoint } from '../types';

interface Props {
  data: TrendPoint[];
}

type TabKey = 'basic' | 'engagement';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'basic', label: '基本トレンド', icon: <TrendingUp size={14} /> },
  { key: 'engagement', label: 'エンゲージメント', icon: <Users size={14} /> },
];

interface MetricConfig {
  key: string;
  name: string;
  color: string;
}

const BASIC_METRICS: MetricConfig[] = [
  { key: 'totalCards', name: 'カード数', color: '#6366f1' },
  { key: 'totalVotes', name: '投票数', color: '#22c55e' },
  { key: 'actionItemCompletionRate', name: 'AI完了率(%)', color: '#f59e0b' },
];

const ENGAGEMENT_METRICS: MetricConfig[] = [
  { key: 'cardsPerParticipant', name: 'カード数/人', color: '#6366f1' },
  { key: 'votesPerParticipant', name: '投票数/人', color: '#22c55e' },
  { key: 'votesPerCard', name: '投票数/カード', color: '#f97316' },
  { key: 'actionItemRate', name: 'アクション化率(%)', color: '#f59e0b' },
];

interface TrendSummary {
  label: string;
  value: string;
  change: number | null;
  unit: string;
  icon: React.ReactNode;
  positiveIsGood: boolean;
}

function TrendIndicator({ change, positiveIsGood }: { change: number | null; positiveIsGood: boolean }) {
  if (change === null) {
    return <span className="text-xs text-gray-400">— 初回</span>;
  }

  if (Math.abs(change) < 0.01) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-gray-500">
        <Minus size={12} />
        横ばい
      </span>
    );
  }

  const isPositive = change > 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  const colorClass = isGood ? 'text-emerald-600' : 'text-red-500';
  const sign = isPositive ? '+' : '';

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${colorClass}`}>
      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {sign}{change.toFixed(1)}{change !== 0 ? '%' : ''}
    </span>
  );
}

function computeSummaries(data: TrendPoint[]): TrendSummary[] {
  const latest = data[data.length - 1];
  const previous = data.length >= 2 ? data[data.length - 2] : null;

  function pctChange(current: number, prev: number | undefined): number | null {
    if (prev === undefined || prev === null) return null;
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  }

  return [
    {
      label: 'カード数',
      value: String(latest.totalCards),
      change: pctChange(latest.totalCards, previous?.totalCards),
      unit: '枚',
      icon: <FileText size={16} className="text-indigo-500" />,
      positiveIsGood: true,
    },
    {
      label: '投票数',
      value: String(latest.totalVotes),
      change: pctChange(latest.totalVotes, previous?.totalVotes),
      unit: '票',
      icon: <Vote size={16} className="text-emerald-500" />,
      positiveIsGood: true,
    },
    {
      label: '参加者数',
      value: String(latest.totalParticipants),
      change: pctChange(latest.totalParticipants, previous?.totalParticipants),
      unit: '人',
      icon: <Users size={16} className="text-blue-500" />,
      positiveIsGood: true,
    },
    {
      label: 'AI完了率',
      value: latest.actionItemCompletionRate.toFixed(0),
      change: previous ? latest.actionItemCompletionRate - previous.actionItemCompletionRate : null,
      unit: '%',
      icon: <CheckCircle size={16} className="text-amber-500" />,
      positiveIsGood: true,
    },
  ];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-medium text-gray-700 mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-500">{entry.name}</span>
          <span className="font-semibold text-gray-800 ml-auto">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function renderChart(chartData: Record<string, unknown>[], metrics: MetricConfig[]) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          {metrics.map((m) => (
            <linearGradient key={m.key} id={`gradient-${m.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={m.color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={m.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        {metrics.map((m) => (
          <Area
            key={m.key}
            type="monotone"
            dataKey={m.key}
            stroke={m.color}
            strokeWidth={2}
            fill={`url(#gradient-${m.key})`}
            name={m.name}
            dot={{ r: 3, fill: m.color, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 5, fill: m.color, strokeWidth: 2, stroke: '#fff' }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TrendChart({ data }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('basic');

  const chartData = data.map((point) => ({
    ...point,
    date: new Date(point.closedAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
  }));

  const summaries = computeSummaries(data);
  const metrics = activeTab === 'basic' ? BASIC_METRICS : ENGAGEMENT_METRICS;

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="trend-summary">
        {summaries.map((s) => (
          <div
            key={s.label}
            className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100"
          >
            <div className="flex items-center gap-1.5 mb-1">
              {s.icon}
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-gray-900">{s.value}</span>
              <span className="text-xs text-gray-400">{s.unit}</span>
            </div>
            <div className="mt-1">
              <TrendIndicator change={s.change} positiveIsGood={s.positiveIsGood} />
            </div>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-4 p-0.5 bg-gray-100 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3">
        {metrics.map((m) => (
          <div key={m.key} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
            {m.name}
          </div>
        ))}
      </div>

      {/* Chart */}
      {renderChart(chartData, metrics)}
    </div>
  );
}
