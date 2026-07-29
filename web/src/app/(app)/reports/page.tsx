'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/Header';
import { ReportExpenseStructure } from '@/components/charts/ReportExpenseStructure';
import { ReportIncomeStructure } from '@/components/charts/ReportIncomeStructure';
import { ReportBudgetVsActual } from '@/components/charts/ReportBudgetVsActual';
import { getCurrentMonth } from '@/lib/utils';
import { Download, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const TAB_IDS = ['expense-structure', 'income-structure', 'budget-vs-actual'] as const;
type TabId = typeof TAB_IDS[number];

export default function ReportsPage() {
  const t = useTranslations('Reports');
  const tabLabel: Record<TabId, string> = {
    'expense-structure': t('tabExpenseStructure'),
    'income-structure':  t('tabIncomeStructure'),
    'budget-vs-actual':  t('tabBudgetVsActual'),
  };
  const [activeTab, setActiveTab] = useState<TabId>('expense-structure');
  const [month, setMonth] = useState(getCurrentMonth());
  const [exportOpen, setExportOpen] = useState(false);

  function triggerExport(format: 'excel' | 'csv', type: 'transactions' | 'budget') {
    const params = new URLSearchParams({ format, type, month });
    window.location.href = `/api/export?${params.toString()}`;
    setExportOpen(false);
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Header title={t('title')} />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Tab buttons */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg flex-wrap">
          {TAB_IDS.map((id) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                activeTab === id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tabLabel[id]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Month picker */}
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#01581E]"
          />

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> {t('export')} <ChevronDown className={cn('w-3 h-3 transition-transform', exportOpen && 'rotate-180')} />
            </button>

            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-xl shadow-lg z-20 py-1">
                <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('transactions')}</p>
                <button onClick={() => triggerExport('excel', 'transactions')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" /> {t('excelExport', { month })}
                </button>
                <button onClick={() => triggerExport('csv', 'transactions')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                  <FileSpreadsheet className="w-4 h-4 text-blue-500" /> {t('csvExport', { month })}
                </button>

                <div className="border-t border-border my-1" />
                <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('budget')}</p>
                <button onClick={() => triggerExport('excel', 'budget')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" /> {t('excelExport', { month })}
                </button>
                <button onClick={() => triggerExport('csv', 'budget')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                  <FileSpreadsheet className="w-4 h-4 text-blue-500" /> {t('csvExport', { month })}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        {activeTab === 'expense-structure' && <ReportExpenseStructure month={month} />}
        {activeTab === 'income-structure'  && <ReportIncomeStructure  month={month} />}
        {activeTab === 'budget-vs-actual'  && <ReportBudgetVsActual   month={month} />}
      </div>
    </div>
  );
}
