export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { transactions, budgets, accounts, liabilities, taxes, enforcementProceedings } from '@/lib/db/schema';
import { eq, and, gte, lte, isNull, sum, sql } from 'drizzle-orm';
import { formatCurrency, formatMonth, getCurrentMonth } from '@/lib/utils';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { DashboardCharts } from '@/components/charts/DashboardCharts';
import { DashboardMonthNav } from '@/components/dashboard/DashboardMonthNav';
import {
  TrendingUp, TrendingDown, Wallet, HandCoins, ArrowRight, CalendarDays, Receipt, Gavel,
} from 'lucide-react';
import Link from 'next/link';

async function getDashboardData(userId: string, month: string) {
  const [year, mon] = month.split('-');
  const monthStart = new Date(`${year}-${mon}-01T00:00:00Z`);
  const lastDay = new Date(parseInt(year), parseInt(mon), 0);
  const monthEnd = new Date(`${year}-${mon}-${String(lastDay.getDate()).padStart(2, '0')}T23:59:59Z`);

  const [incomeResult, expenseResult, budgetResult, recentTransactions, activeLiabilities] = await Promise.all([
    db.select({ total: sum(transactions.amount) }).from(transactions).where(
      and(eq(transactions.userId, userId), eq(transactions.type, 'income'),
          gte(transactions.date, monthStart), lte(transactions.date, monthEnd), isNull(transactions.deletedAt))),
    db.select({ total: sum(transactions.amount) }).from(transactions).where(
      and(eq(transactions.userId, userId), eq(transactions.type, 'expense'),
          gte(transactions.date, monthStart), lte(transactions.date, monthEnd), isNull(transactions.deletedAt))),
    db.select({ total: sum(budgets.plannedAmount) }).from(budgets).where(
      and(eq(budgets.userId, userId), eq(budgets.month, month))),
    db.query.transactions.findMany({
      where: and(eq(transactions.userId, userId), isNull(transactions.deletedAt)),
      with: { category: true, account: true },
      orderBy: (t, { desc }) => [desc(t.date)],
      limit: 5,
    }),
    db.select({ count: sql<number>`count(*)` }).from(liabilities).where(
      and(eq(liabilities.userId, userId), eq(liabilities.isActive, true))),
  ]);

  const income = parseFloat(incomeResult[0]?.total ?? '0');
  const expense = parseFloat(expenseResult[0]?.total ?? '0');
  const planned = parseFloat(budgetResult[0]?.total ?? '0');
  const savings = income - expense;
  const budgetUsed = planned > 0 ? Math.round((expense / planned) * 100) : 0;

  return { currentMonth: month, income, expense, savings, planned, budgetUsed, recentTransactions, liabilitiesCount: Number(activeLiabilities[0]?.count ?? 0) };
}

async function getObligationsSummary(userId: string) {
  const [taxAgg, enforcementAgg] = await Promise.all([
    db.select({
      total: sql<string>`sum(${taxes.amountDue} - ${taxes.amountPaid})`,
      pendingCount: sql<number>`count(*) filter (where ${taxes.status} != 'paid')`,
      totalCount: sql<number>`count(*)`,
    }).from(taxes).where(eq(taxes.userId, userId)),
    db.select({
      total: sql<string>`sum(${enforcementProceedings.remainingAmount})`,
      pendingCount: sql<number>`count(*) filter (where ${enforcementProceedings.status} != 'satisfied')`,
      totalCount: sql<number>`count(*)`,
    }).from(enforcementProceedings).where(eq(enforcementProceedings.userId, userId)),
  ]);

  return {
    taxDue: parseFloat(taxAgg[0]?.total ?? '0'),
    taxPendingCount: Number(taxAgg[0]?.pendingCount ?? 0),
    taxTotalCount: Number(taxAgg[0]?.totalCount ?? 0),
    enforcementRemaining: parseFloat(enforcementAgg[0]?.total ?? '0'),
    enforcementPendingCount: Number(enforcementAgg[0]?.pendingCount ?? 0),
    enforcementTotalCount: Number(enforcementAgg[0]?.totalCount ?? 0),
  };
}

async function getYearData(userId: string, year: string) {
  const yearStart = new Date(`${year}-01-01T00:00:00Z`);
  const now = new Date();
  const yearEnd = now.getFullYear() === parseInt(year) ? now : new Date(`${year}-12-31T23:59:59Z`);
  const [inc, exp] = await Promise.all([
    db.select({ total: sum(transactions.amount) }).from(transactions).where(
      and(eq(transactions.userId, userId), eq(transactions.type, 'income'), gte(transactions.date, yearStart), lte(transactions.date, yearEnd), isNull(transactions.deletedAt))),
    db.select({ total: sum(transactions.amount) }).from(transactions).where(
      and(eq(transactions.userId, userId), eq(transactions.type, 'expense'), gte(transactions.date, yearStart), lte(transactions.date, yearEnd), isNull(transactions.deletedAt))),
  ]);
  return { income: parseFloat(inc[0]?.total ?? '0'), expense: parseFloat(exp[0]?.total ?? '0') };
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string; mode?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const sp = await searchParams;
  const selectedMonth = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : getCurrentMonth();
  const mode = (sp.mode === 'year' ? 'year' : 'month') as 'month' | 'year';
  const selectedYear = selectedMonth.split('-')[0];

  const [data, yearData, obligations] = await Promise.all([
    getDashboardData(user.id, selectedMonth),
    mode === 'year' ? getYearData(user.id, selectedYear) : null,
    getObligationsSummary(user.id),
  ]);

  const displayIncome  = mode === 'year' ? (yearData?.income ?? 0) : data.income;
  const displayExpense = mode === 'year' ? (yearData?.expense ?? 0) : data.expense;
  const displaySavings = displayIncome - displayExpense;

  const stats = [
    {
      label: mode === 'year' ? `Przychody ${selectedYear}` : 'Przychody',
      value: formatCurrency(displayIncome),
      icon: TrendingUp,
      color: 'text-[#01581E]',
      bg: 'bg-[#01581E]/10',
      trend: null,
    },
    {
      label: mode === 'year' ? `Wydatki ${selectedYear}` : 'Wydatki',
      value: formatCurrency(displayExpense),
      icon: TrendingDown,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      trend: mode === 'month' && data.planned > 0 ? `${data.budgetUsed}% planu` : null,
      trendColor: data.budgetUsed > 100 ? 'text-destructive' : 'text-muted-foreground',
    },
    {
      label: mode === 'year' ? `Oszczędności ${selectedYear}` : 'Oszczędności',
      value: formatCurrency(displaySavings),
      icon: Wallet,
      color: displaySavings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-destructive',
      bg: 'bg-blue-500/10',
      trend: null,
    },
    {
      label: 'Zobowiązania',
      value: String(data.liabilitiesCount),
      suffix: 'aktywnych',
      icon: HandCoins,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      trend: null,
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header with month nav */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'year' ? `Podsumowanie roku ${selectedYear}` : formatMonth(selectedMonth)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <DashboardMonthNav currentMonth={selectedMonth} mode={mode} />
          </Suspense>
          <ThemeToggle />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className={`text-xl font-bold ${stat.color}`}>
              {stat.value}
              {stat.suffix && (
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  {stat.suffix}
                </span>
              )}
            </p>
            {stat.trend && (
              <p className={`text-xs mt-1 ${stat.trendColor}`}>{stat.trend}</p>
            )}
          </div>
        ))}
      </div>

      {/* Budget progress */}
      {data.planned > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-foreground">Realizacja budżetu</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(data.expense)} z {formatCurrency(data.planned)} zaplanowanych
              </p>
            </div>
            <Link
              href={`/budget/${data.currentMonth.split('-')[0]}/${data.currentMonth.split('-')[1]}`}
              className="text-xs text-[#01581E] hover:underline flex items-center gap-1"
            >
              Szczegóły <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                data.budgetUsed > 100 ? 'bg-destructive' :
                data.budgetUsed > 80 ? 'bg-amber-500' : 'bg-[#01581E]'
              }`}
              style={{ width: `${Math.min(data.budgetUsed, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
            <span>{data.budgetUsed}% wykorzystane</span>
            <span>
              {data.budgetUsed > 100
                ? `Przekroczenie: ${formatCurrency(data.expense - data.planned)}`
                : `Pozostało: ${formatCurrency(data.planned - data.expense)}`}
            </span>
          </div>
        </div>
      )}

      {/* Taxes & enforcement */}
      {(obligations.taxTotalCount > 0 || obligations.enforcementTotalCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm font-medium text-foreground">Podatki</p>
              </div>
              <Link href="/taxes" className="text-xs text-[#01581E] hover:underline flex items-center gap-1">
                Szczegóły <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(obligations.taxDue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {obligations.taxPendingCount > 0 ? `${obligations.taxPendingCount} do zapłaty` : 'Wszystko opłacone'}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Gavel className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-sm font-medium text-foreground">Zajęcia egzekucyjne</p>
              </div>
              <Link href="/enforcement" className="text-xs text-[#01581E] hover:underline flex items-center gap-1">
                Szczegóły <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(obligations.enforcementRemaining)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {obligations.enforcementPendingCount > 0 ? `${obligations.enforcementPendingCount} aktywnych` : 'Brak aktywnych zajęć'}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <Suspense fallback={<div className="h-64 bg-muted/30 rounded-xl animate-pulse" />}>
        <DashboardCharts userId={user.id} currentMonth={data.currentMonth} />
      </Suspense>

      {/* Recent transactions */}
      <div className="bg-card border border-border rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Ostatnie transakcje</h2>
          <Link
            href="/transactions"
            className="text-xs text-[#01581E] hover:underline flex items-center gap-1"
          >
            Wszystkie <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {data.recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Brak transakcji. Dodaj pierwszą!
            </div>
          ) : (
            data.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs">{tx.type === 'income' ? '↑' : '↓'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {tx.description ?? tx.category?.name ?? 'Brak opisu'}
                  </p>
                  <p className="text-xs text-muted-foreground">{tx.account?.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-sm font-medium ${
                      tx.type === 'income' ? 'text-[#01581E]' : 'text-foreground'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Dodaj transakcję', href: '/transactions?new=1', icon: '＋' },
          { label: 'Budżet miesiąca', href: `/budget/${data.currentMonth.replace('-', '/')}`, icon: '📅' },
          { label: 'Stan kont', href: '/accounts', icon: '🏦' },
          { label: 'Zapytaj AI', href: '/ai-chat', icon: '🤖' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors text-center group"
          >
            <span className="text-2xl">{action.icon}</span>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
