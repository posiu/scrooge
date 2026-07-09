'use client';

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props { month: string; userId: string; inline?: boolean }

export function AddBudgetButton({ month, userId, inline }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  async function openModal() {
    const res = await fetch('/api/categories?type=expense');
    if (res.ok) setCategories(await res.json());
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: fd.get('categoryId'),
          month,
          plannedAmount: fd.get('plannedAmount'),
          notes: fd.get('notes') || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Budżet dodany');
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error('Nie udało się dodać pozycji');
    } finally {
      setLoading(false);
    }
  }

  const btn = inline ? (
    <button onClick={openModal} className="text-[#01581E] hover:underline text-sm">
      Dodaj pierwszą pozycję
    </button>
  ) : (
    <button onClick={openModal} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#01581E] text-white text-xs font-medium hover:bg-[#01581E]/90 transition-colors">
      <Plus className="w-3.5 h-3.5" /> Dodaj kategorię
    </button>
  );

  return (
    <>
      {btn}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Dodaj pozycję budżetu</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Kategoria *</label>
                <select name="categoryId" required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                  <option value="">Wybierz kategorię</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Planowana kwota *</label>
                <input name="plannedAmount" type="number" step="0.01" min="0" required placeholder="0,00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Notatka</label>
                <input name="notes" placeholder="Opcjonalnie" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Anuluj</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-[#01581E] text-white text-sm font-medium hover:bg-[#01581E]/90 transition-colors disabled:opacity-50">
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
