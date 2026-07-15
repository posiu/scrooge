'use client';

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { INVESTMENT_CATEGORIES } from '@/lib/investmentCategories';

export function AddAccountButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('bank');

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
          investmentCategory: fd.get('type') === 'investment' ? fd.get('investmentCategory') || null : null,
          currency: fd.get('currency') || 'PLN',
          institution: fd.get('institution') || null,
          description: fd.get('description') || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Konto dodane');
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error('Nie udało się dodać konta');
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
        <Plus className="w-4 h-4" /> Dodaj konto
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Nowe konto</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Nazwa *</label>
                <input name="name" required placeholder="np. PKO Bank" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Typ *</label>
                  <select name="type" required value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                    <option value="bank">Konto bankowe</option>
                    <option value="cash">Gotówka</option>
                    <option value="crypto">Kryptowaluty</option>
                    <option value="fund">Fundusz</option>
                    <option value="insurance">Polisa</option>
                    <option value="investment">Inwestycja</option>
                    <option value="other">Inne</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Waluta</label>
                  <select name="currency" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                    <option value="PLN">PLN</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              {type === 'investment' && (
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Kategoria inwestycji *</label>
                  <select name="investmentCategory" required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                    {INVESTMENT_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Instytucja</label>
                <input name="institution" placeholder="np. PKO Bank Polski" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Opis</label>
                <input name="description" placeholder="Opcjonalnie" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Anuluj</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-[#01581E] text-white text-sm font-medium hover:bg-[#01581E]/90 transition-colors disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Dodaj'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
