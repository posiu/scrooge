'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface BudgetRow {
  category:  string;
  planned:   number;
  actual:    number;
  diff:      number;
}

export function ReportBudgetVsActual({ month }: { month: string }) {
  const [data, setData] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/budgets?month=${month}`).then((r) => r.json()),
      fetch(`/api/charts/category-breakdown?month=${month}`).then((r) => r.json()),
    ])
      .then(([budgets, actuals]: [{ plannedAmount: string; category: { name: string } | null }[], { name: string; value: number }[]]) => {
        const actualsMap = Object.fromEntries(actuals.map((a) => [a.name, a.value]));
        const rows: BudgetRow[] = budgets.map((b) => {
          const catName = b.category?.name ?? 'Bez kategorii';
          const planned = parseFloat(b.plannedAmount);
          const actual  = actualsMap[catName] ?? 0;
          return { category: catName, planned, actual, diff: planned - actual };
        });
        setData(rows);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [month]);

  if (loading) return <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />;
  if (data.length === 0) return (
    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
      Brak danych budżetowych dla wybranego miesiąca
    </div>
  );

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-4">Budżet vs. Realizacja</h3>
      <ResponsiveContainer width="100%" height={Math.max(280, data.length * 50)}>
        <BarChart data={data} layout="vertical" barSize={10} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false} tickLine={false} width={130} />
          <Tooltip
            formatter={(v: number, name: string) => [formatCurrency(v), name === 'planned' ? 'Plan' : 'Realizacja']}
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--foreground))' }}
            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend formatter={(v) => v === 'planned' ? 'Plan' : 'Realizacja'} />
          <Bar dataKey="planned" fill="hsl(var(--muted))" radius={[0, 3, 3, 0]} />
          <Bar dataKey="actual" fill="hsl(var(--chart-1))" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
