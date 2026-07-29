'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function AddAccountButton() {
  const t = useTranslations('Accounts');
  const tCommon = useTranslations('Common');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          type: fd.get('type'),
          currency: fd.get('currency') || 'PLN',
          institution: fd.get('institution') || null,
          description: fd.get('description') || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('successAdd'));
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error(t('errorAdd'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#01581E] text-white text-sm font-medium hover:bg-[#01581E]/90 transition-colors"
      >
        <Plus className="w-4 h-4" /> {t('addButton')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">{t('addModalTitle')}</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">{t('nameLabel')}</label>
                <input name="name" required placeholder={t('namePlaceholder')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">{t('typeLabel')}</label>
                  <select name="type" required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                    <option value="bank">{t('typeBank')}</option>
                    <option value="cash">{t('typeCash')}</option>
                    <option value="crypto">{t('typeCrypto')}</option>
                    <option value="fund">{t('typeFund')}</option>
                    <option value="insurance">{t('typeInsurance')}</option>
                    <option value="other">{t('typeOther')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">{t('currencyLabel')}</label>
                  <select name="currency" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                    <option value="PLN">PLN</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">{t('institutionLabel')}</label>
                <input name="institution" placeholder={t('institutionPlaceholder')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">{t('descriptionLabel')}</label>
                <input name="description" placeholder={t('descriptionPlaceholder')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">{tCommon('cancel')}</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-[#01581E] text-white text-sm font-medium hover:bg-[#01581E]/90 transition-colors disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('addSubmit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
