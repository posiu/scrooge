'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface ChartDataPoint { name: string; value: number; color?: string; }
interface DashboardChartsProps { userId: string; currentMonth: string; }

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-4))',
];

const tooltipStyle = {
  contentStyle: {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'hsl(var(--foreground))',
  },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600 as const },
  itemStyle:  { color: 'hsl(var(--foreground))' },
  cursor:     { fill: 'hsl(var(--muted))' },
};

export function DashboardCharts({ userId, currentMonth }: DashboardChartsProps) {
  const [categoryData, setCategoryData] = useState<ChartDataPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; przychody: number; wydatki: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, monthlyRes] = await Promise.all([
          fetch(`/api/charts/category-breakdown?month=${currentMonth}`),
          fetch(`/api/charts/monthly-summary?months=6`),
        ]);
        if (catRes.ok) setCategoryData(await catRes.json());
        if (monthlyRes.ok) setMonthlyData(await monthlyRes.json());
      } catch { /* ignore */ } finally { setLoading(false); }
    }
    fetchData();
  }, [currentMonth]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
        <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Monthly income vs expense */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Przychody vs Wydatki (6 mies.)</h3>
        {monthlyData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Brak danych</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={12} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name === 'przychody' ? 'Przychody' : 'Wydatki']}
                {...tooltipStyle}
              />
              <Bar dataKey="przychody" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="wydatki" fill="hsl(var(--chart-4))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category breakdown pie */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Struktura wydatków</h3>
        {categoryData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Brak wydatków w tym miesiącu</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {categoryData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                {...tooltipStyle}
              />
              <Legend formatter={(value) => (
                <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>{value}</span>
              )} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
