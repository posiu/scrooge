'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  categoryId: string;
  categoryName: string;
  month: string;
  plannedAmount: number;
  notes?: string | null;
}

export function EditBudgetButton({ categoryId, categoryName, month, plannedAmount, notes }: Props) {
  const t = useTranslations('BudgetMonth');
  const tCommon = useTranslations('Common');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          month,
          plannedAmount: fd.get('plannedAmount'),
          notes: fd.get('notes') || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('successEdit'));
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error(t('errorEdit'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
        title={t('editItemTooltip')}
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">{t('editItemModalTitle', { category: categoryName })}</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">{t('plannedAmountLabel')}</label>
                <input
                  name="plannedAmount" type="number" step="0.01" min="0" required
                  defaultValue={plannedAmount}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">{t('notesLabel')}</label>
                <input
                  name="notes" defaultValue={notes ?? ''} placeholder={t('notesPlaceholder')}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">{tCommon('cancel')}</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-[#01581E] text-white text-sm font-medium hover:bg-[#01581E]/90 transition-colors disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : tCommon('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
