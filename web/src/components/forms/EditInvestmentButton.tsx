'use client';

import { useState } from 'react';
import { Pencil, X, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { INVESTMENT_CATEGORIES } from '@/lib/investmentCategories';

interface Investment {
  id: string;
  name: string;
  category: string;
  currentValue: string;
  currency: string;
  institution: string | null;
  description: string | null;
}

interface Props {
  investment: Investment;
}

export function EditInvestmentButton({ investment }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/investments/${investment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          category: fd.get('category'),
          currentValue: fd.get('currentValue'),
          currency: fd.get('currency') || 'PLN',
          institution: fd.get('institution') || null,
          description: fd.get('description') || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Inwestycja zaktualizowana');
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error('Nie udało się zapisać zmian');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Czy na pewno chcesz usunąć tę inwestycję?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/investments/${investment.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      toast.success('Inwestycja została usunięta');
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error('Nie udało się usunąć inwestycji');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
        title="Edytuj inwestycję"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl text-left">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Edytuj inwestycję</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Nazwa *</label>
                <input name="name" required defaultValue={investment.name} placeholder="np. Portfel akcji mWIG40" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Kategoria *</label>
                <select name="category" required defaultValue={investment.category} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                  {INVESTMENT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Bieżąca wartość *</label>
                  <input name="currentValue" type="number" step="0.01" min="0" required defaultValue={investment.currentValue} placeholder="0,00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Waluta</label>
                  <select name="currency" defaultValue={investment.currency} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                    <option value="PLN">PLN</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Instytucja / broker</label>
                <input name="institution" defaultValue={investment.institution ?? ''} placeholder="np. XTB, mBank" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Opis</label>
                <input name="description" defaultValue={investment.description ?? ''} placeholder="Opcjonalnie" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 rounded-lg border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center justify-center"
                  title="Usuń inwestycję"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setOpen(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors text-center">Anuluj</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-[#01581E] text-white text-sm font-medium hover:bg-[#01581E]/90 transition-colors disabled:opacity-50 text-center">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Zapisz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
