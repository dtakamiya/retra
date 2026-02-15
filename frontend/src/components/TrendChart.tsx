import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, FileText, Vote, CheckCircle, Users } from 'lucide-react';
import type { TrendPoint } from '../types';

interface Props {
  data: TrendPoint[];
}

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

export function TrendChart({ data }: Props) {
  const chartData = data.map((point) => ({
    ...point,
    date: new Date(point.closedAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
  }));

  const summaries = computeSummaries(data);

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

      {/* 基本トレンド */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">基本トレンド</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="totalCards" stroke="#8884d8" name="カード数" />
            <Line type="monotone" dataKey="totalVotes" stroke="#82ca9d" name="投票数" />
            <Line type="monotone" dataKey="actionItemCompletionRate" stroke="#ffc658" name="AI完了率(%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* エンゲージメント */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">エンゲージメント</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="cardsPerParticipant" stroke="#8884d8" name="カード数/人" />
            <Line type="monotone" dataKey="votesPerParticipant" stroke="#82ca9d" name="投票数/人" />
            <Line type="monotone" dataKey="votesPerCard" stroke="#ff7300" name="投票数/カード" />
            <Line type="monotone" dataKey="actionItemRate" stroke="#ffc658" name="アクション化率(%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
