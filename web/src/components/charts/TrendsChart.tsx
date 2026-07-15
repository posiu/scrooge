'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface Props {
  fromYear: number;
  toYear:   number;
  metric:   'expense' | 'income' | 'savings';
}

interface DataPoint {
  year:     number;
  income:   number;
  expense:  number;
  savings:  number;
}

export function TrendsChart({ fromYear, toYear, metric }: Props) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/charts/yearly-summary?from=${fromYear}&to=${toYear}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fromYear, toYear]);

  if (loading) return <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />;
  if (data.length === 0) return (
    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
      Brak danych dla wybranego okresu
    </div>
  );

  const metricColors = {
    income:  'hsl(var(--chart-1))',
    expense: 'hsl(var(--chart-4))',
    savings: 'hsl(var(--chart-5))',
  };

  const metricLabels = {
    income:  'Przychody',
    expense: 'Wydatki',
    savings: 'Oszczędności',
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-4">
        {metricLabels[metric]} {fromYear}–{toYear}
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(v: number) => [formatCurrency(v), metricLabels[metric]]}
            contentStyle={{
              background:   'hsl(var(--card))',
              border:       '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize:     '12px',
              color:        'hsl(var(--foreground))',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Line
            type="monotone"
            dataKey={metric}
            stroke={metricColors[metric]}
            strokeWidth={2.5}
            dot={{ r: 4, fill: metricColors[metric] }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
