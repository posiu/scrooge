'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-4))',
];
const tooltipStyle = {
  contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--foreground))' },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600 as const },
  itemStyle:  { color: 'hsl(var(--foreground))' },
};

export function ReportExpenseStructure({ month }: { month: string }) {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/charts/category-breakdown?month=${month}`)
      .then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [month]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (loading) return <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />;
  if (data.length === 0) return (
    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Brak wydatków w wybranym miesiącu</div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Struktura wydatków</h3>
        <span className="text-sm text-muted-foreground">Łącznie: <span className="font-medium text-foreground">{formatCurrency(total)}</span></span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => [formatCurrency(v), 'Kwota']} {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2">
          {data.sort((a, b) => b.value - a.value).map((d, i) => (
            <div key={d.name} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-xs text-foreground flex-1 truncate">{d.name}</span>
              <span className="text-xs font-medium text-foreground">{formatCurrency(d.value)}</span>
              <span className="text-xs text-muted-foreground w-10 text-right">{Math.round((d.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
