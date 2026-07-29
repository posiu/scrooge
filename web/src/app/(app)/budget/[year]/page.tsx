export const dynamic = 'force-dynamic';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { budgets, transactions } from '@/lib/db/schema';
import { eq, and, gte, lte, isNull, sum } from 'drizzle-orm';
import { formatCurrency, getMonthsInYear } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ year: string }>;
}

async function getYearSummary(userId: string, year: number) {
  const months = getMonthsInYear(year);

  const monthData = await Promise.all(
    months.map(async (month) => {
      const [y, m] = month.split('-').map(Number);
      const monthStart = new Date(y, m - 1, 1);
      const monthEnd = new Date(y, m, 0, 23, 59, 59, 999);

      const [plannedRes, incomeRes, expenseRes] = await Promise.all([
        db.select({ total: sum(budgets.plannedAmount) })
          .from(budgets)
          .where(and(eq(budgets.userId, userId), eq(budgets.month, month))),
        db.select({ total: sum(transactions.amount) })
          .from(transactions)
          .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'income'),
            gte(transactions.date, monthStart),
            lte(transactions.date, monthEnd),
            isNull(transactions.deletedAt),
          )),
        db.select({ total: sum(transactions.amount) })
          .from(transactions)
          .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'expense'),
            gte(transactions.date, monthStart),
            lte(transactions.date, monthEnd),
            isNull(transactions.deletedAt),
          )),
      ]);

      return {
        month,
        planned: parseFloat(plannedRes[0]?.total ?? '0'),
        income: parseFloat(incomeRes[0]?.total ?? '0'),
        expense: parseFloat(expenseRes[0]?.total ?? '0'),
      };
    }),
  );

  return monthData;
}

export default async function YearlyBudgetPage({ params }: Props) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr);
  if (isNaN(year) || year < 2000 || year > 2100) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const t = await getTranslations('BudgetYear');
  const monthNames = t.raw('months') as string[];

  const monthData = await getYearSummary(user.id, year);

  const totals = monthData.reduce(
    (acc, m) => ({
      planned: acc.planned + m.planned,
      income: acc.income + m.income,
      expense: acc.expense + m.expense,
    }),
    { planned: 0, income: 0, expense: 0 },
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Header title={t('yearSummary', { year })} />

      {/* Year navigation */}
      <div className="flex items-center justify-between">
        <Link href={`/budget/${year - 1}`} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4" /> {year - 1}
        </Link>
        <span className="text-lg font-semibold text-foreground">{year}</span>
        <Link href={`/budget/${year + 1}`} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          {year + 1} <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Year totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('totalIncome'), value: formatCurrency(totals.income), color: 'text-[#01581E]' },
          { label: t('totalExpense'), value: formatCurrency(totals.expense), color: 'text-foreground' },
          { label: t('savings'), value: formatCurrency(totals.income - totals.expense), color: totals.income - totals.expense >= 0 ? 'text-[#01581E]' : 'text-destructive' },
          { label: t('totalPlanned'), value: formatCurrency(totals.planned), color: 'text-muted-foreground' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly breakdown table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">{t('monthlyBreakdown')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{t('colMonth')}</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{t('colPlan')}</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{t('colIncome')}</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{t('colExpense')}</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{t('colSavings')}</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{t('colPercentPlan')}</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {monthData.map((m, i) => {
                const savings = m.income - m.expense;
                const pct = m.planned > 0 ? Math.round((m.expense / m.planned) * 100) : null;
                const [, monthNum] = m.month.split('-');
                return (
                  <tr key={m.month} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{monthNames[i]}</td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                      {m.planned > 0 ? formatCurrency(m.planned) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-[#01581E] font-medium">
                      {m.income > 0 ? formatCurrency(m.income) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-foreground">
                      {m.expense > 0 ? formatCurrency(m.expense) : '—'}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-medium ${savings >= 0 ? 'text-[#01581E]' : 'text-destructive'}`}>
                      {m.income > 0 || m.expense > 0 ? formatCurrency(savings) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {pct !== null ? (
                        <span className={pct > 100 ? 'text-destructive font-medium' : pct > 80 ? 'text-amber-600' : 'text-muted-foreground'}>
                          {pct}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/budget/${year}/${monthNum}`}
                        className="text-xs text-[#01581E] hover:underline"
                      >
                        {t('details')}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/20">
                <td className="px-4 py-3 text-sm font-semibold text-foreground">{t('year', { year })}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">{formatCurrency(totals.planned)}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-[#01581E]">{formatCurrency(totals.income)}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">{formatCurrency(totals.expense)}</td>
                <td className={`px-4 py-3 text-right text-sm font-semibold ${totals.income - totals.expense >= 0 ? 'text-[#01581E]' : 'text-destructive'}`}>
                  {formatCurrency(totals.income - totals.expense)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
