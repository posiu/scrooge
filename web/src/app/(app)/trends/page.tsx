'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Header } from '@/components/layout/Header';
import { TrendsChart } from '@/components/charts/TrendsChart';
import { getCurrentYear } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

const INTL_LOCALE: Record<Locale, string> = { pl: 'pl-PL', en: 'en-US' };

export default function TrendsPage() {
  const t = useTranslations('Trends');
  const currentYear = getCurrentYear();
  const [fromYear, setFromYear] = useState(currentYear - 2);
  const [toYear, setToYear] = useState(currentYear);
  const [metric, setMetric] = useState<'expense' | 'income' | 'savings'>('expense');

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i).reverse();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Header title={t('title')} />

      <p className="text-sm text-muted-foreground">
        {t('subtitle')}
      </p>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">{t('from')}</label>
          <select
            value={fromYear}
            onChange={(e) => setFromYear(Number(e.target.value))}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#01581E]"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">{t('to')}</label>
          <select
            value={toYear}
            onChange={(e) => setToYear(Number(e.target.value))}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#01581E]"
          >
            {years.filter((y) => y >= fromYear).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(['expense', 'income', 'savings'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                metric === m ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m === 'expense' ? t('metricExpense') : m === 'income' ? t('metricIncome') : t('metricSavings')}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <TrendsChart fromYear={fromYear} toYear={toYear} metric={metric} />
      </div>

      {/* YoY comparison cards */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('yoy')}</h3>
        <YoYTable fromYear={fromYear} toYear={toYear} />
      </div>
    </div>
  );
}

function YoYTable({ fromYear, toYear }: { fromYear: number; toYear: number }) {
  const t = useTranslations('Trends');
  const locale = useLocale() as Locale;
  const [data, setData] = useState<{ year: number; income: number; expense: number; savings: number }[]>([]);

  useEffect(() => {
    fetch(`/api/charts/yearly-summary?from=${fromYear}&to=${toYear}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [fromYear, toYear]);

  if (data.length === 0) return <p className="text-sm text-muted-foreground">{t('loading')}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left pb-2 text-xs font-medium text-muted-foreground">{t('colYear')}</th>
            <th className="text-right pb-2 text-xs font-medium text-muted-foreground">{t('colIncome')}</th>
            <th className="text-right pb-2 text-xs font-medium text-muted-foreground">{t('colExpense')}</th>
            <th className="text-right pb-2 text-xs font-medium text-muted-foreground">{t('colSavings')}</th>
            <th className="text-right pb-2 text-xs font-medium text-muted-foreground">{t('colChange')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, i) => {
            const prev = data[i - 1];
            const yoyExpense = prev && prev.expense > 0
              ? ((row.expense - prev.expense) / prev.expense * 100).toFixed(1)
              : null;
            return (
              <tr key={row.year} className="hover:bg-muted/30">
                <td className="py-2.5 font-medium text-foreground">{row.year}</td>
                <td className="py-2.5 text-right text-[#01581E] font-medium">
                  {new Intl.NumberFormat(INTL_LOCALE[locale], { style: 'currency', currency: 'PLN' }).format(row.income)}
                </td>
                <td className="py-2.5 text-right text-foreground">
                  {new Intl.NumberFormat(INTL_LOCALE[locale], { style: 'currency', currency: 'PLN' }).format(row.expense)}
                </td>
                <td className={`py-2.5 text-right font-medium ${row.savings >= 0 ? 'text-[#01581E]' : 'text-destructive'}`}>
                  {new Intl.NumberFormat(INTL_LOCALE[locale], { style: 'currency', currency: 'PLN' }).format(row.savings)}
                </td>
                <td className="py-2.5 text-right text-xs">
                  {yoyExpense !== null ? (
                    <span className={Number(yoyExpense) > 0 ? 'text-destructive' : 'text-[#01581E]'}>
                      {Number(yoyExpense) > 0 ? '+' : ''}{yoyExpense}%
                    </span>
                  ) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
