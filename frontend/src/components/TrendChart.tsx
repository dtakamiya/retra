import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TrendPoint } from '../types';

interface Props {
  data: TrendPoint[];
}

export function TrendChart({ data }: Props) {
  const chartData = data.map((point) => ({
    ...point,
    date: new Date(point.closedAt).toLocaleDateString('ja-JP'),
  }));

  return (
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
  );
}
