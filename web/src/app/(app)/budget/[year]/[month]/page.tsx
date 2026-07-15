export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { budgets, transactions, categories } from '@/lib/db/schema';
import { eq, and, gte, lte, isNull, sum } from 'drizzle-orm';
import { formatCurrency, formatMonth, getPolishHolidays } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { BudgetProgress } from '@/components/charts/BudgetProgress';
import { AddBudgetButton } from '@/components/forms/AddBudgetButton';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { pl } from 'date-fns/locale';
import { format } from 'date-fns';

interface Props {
  params: Promise<{ year: string; month: string }>;
}

async function getMonthBudgetData(userId: string, year: number, month: number) {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  // All budgets for this month
  const monthBudgets = await db.query.budgets.findMany({
    where: and(eq(budgets.userId, userId), eq(budgets.month, monthStr)),
    with: { category: true },
    orderBy: (b, { asc }) => [asc(b.categoryId)],
  });

  // Actual spend per category
  const actuals = await db
    .select({
      categoryId: transactions.categoryId,
      total: sum(transactions.amount),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'expense'),
        gte(transactions.date, monthStart),
        lte(transactions.date, monthEnd),
        isNull(transactions.deletedAt),
      ),
    )
    .groupBy(transactions.categoryId);

  const actualsMap = Object.fromEntries(
    actuals.map((a) => [a.categoryId ?? '__none__', parseFloat(a.total ?? '0')]),
  );

  const rows = monthBudgets.map((b) => ({
    ...b,
    actual: actualsMap[b.categoryId] ?? 0,
    planned: parseFloat(b.plannedAmount),
  }));

  const totalPlanned = rows.reduce((s, r) => s + r.planned, 0);
  const totalActual = rows.reduce((s, r) => s + r.actual, 0);

  return { monthStr, monthStart, monthEnd, rows, totalPlanned, totalActual };
}

export default async function MonthlyBudgetPage({ params }: Props) {
  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const data = await getMonthBudgetData(user.id, year, month);
  const holidays = getPolishHolidays(year);
  const monthLabel = formatMonth(`${yearStr}-${String(month).padStart(2, '0')}`);

  // Navigation
  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);
  const prevHref = `/budget/${prevDate.getFullYear()}/${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const nextHref = `/budget/${nextDate.getFullYear()}/${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

  // Days in month with holidays
  const daysInMonth = new Date(year, month, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    const key = format(d, 'yyyy-MM-dd');
    return {
      day: i + 1,
      dayOfWeek: d.getDay(), // 0=Sun
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      holiday: holidays[key] ?? null,
    };
  });

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Header title={`Budżet · ${monthLabel}`} />

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={prevHref}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Poprzedni
        </Link>
        <Link
          href={`/budget/${year}`}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-[#01581E] transition-colors"
        >
          <CalendarDays className="w-4 h-4" />
          {monthLabel}
        </Link>
        <Link
          href={nextHref}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          Następny
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Plan', value: formatCurrency(data.totalPlanned), color: 'text-foreground' },
          { label: 'Realizacja', value: formatCurrency(data.totalActual), color: data.totalActual > data.totalPlanned ? 'text-destructive' : 'text-foreground' },
          { label: 'Różnica', value: formatCurrency(data.totalPlanned - data.totalActual), color: data.totalPlanned - data.totalActual >= 0 ? 'text-[#01581E]' : 'text-destructive' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Budget rows */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Kategorie</h2>
          <AddBudgetButton month={data.monthStr} userId={user.id} />
        </div>

        {data.rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Brak planu budżetowego na ten miesiąc.{' '}
            <AddBudgetButton month={data.monthStr} userId={user.id} inline />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.rows.map((row) => {
              const pct = row.planned > 0 ? Math.min((row.actual / row.planned) * 100, 100) : 0;
              const over = row.actual > row.planned;
              return (
                <div key={row.id} className="px-4 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">{row.category?.name ?? 'Bez kategorii'}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={over ? 'text-destructive font-medium' : 'text-foreground'}>
                        {formatCurrency(row.actual)}
                      </span>
                      <span className="text-muted-foreground">/ {formatCurrency(row.planned)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${over ? 'bg-destructive' : pct > 80 ? 'bg-amber-500' : 'bg-[#01581E]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>{Math.round(pct)}%</span>
                    {over
                      ? <span className="text-destructive">Przekroczenie: {formatCurrency(row.actual - row.planned)}</span>
                      : <span>Pozostało: {formatCurrency(row.planned - row.actual)}</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mini calendar with holidays */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          Kalendarz — {monthLabel}
        </h2>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map((d) => (
            <div key={d} className="text-xs text-muted-foreground font-medium py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for first week offset */}
          {Array.from({ length: (calendarDays[0].dayOfWeek + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {calendarDays.map(({ day, isWeekend, holiday }) => {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return (
              <Link
                key={day}
                href={`/transactions?date=${dateStr}`}
                title={`${holiday ?? ''} (Kliknij, aby zobaczyć transakcje z tego dnia)`.trim()}
                className={`text-xs rounded-md py-1.5 text-center transition-colors hover:bg-muted/80 block cursor-pointer ${
                  holiday
                    ? 'bg-[#01581E]/15 text-[#01581E] font-semibold'
                    : isWeekend
                    ? 'text-muted-foreground/60'
                    : 'text-foreground'
                }`}
              >
                {day}
                {holiday && <div className="w-1 h-1 rounded-full bg-[#01581E] mx-auto mt-0.5" />}
              </Link>
            );
          })}
        </div>
        {Object.entries(holidays)
          .filter(([key]) => key.startsWith(`${year}-${String(month).padStart(2, '0')}`))
          .map(([, name]) => (
            <p key={name} className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#01581E] inline-block" />
              {name}
            </p>
          ))}
      </div>
    </div>
  );
}
