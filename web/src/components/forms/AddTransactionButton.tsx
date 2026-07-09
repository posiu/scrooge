'use client';

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Account, Category } from '@/lib/db/schema';

interface Props {
  accounts: Account[];
  categories: Category[];
}

export function AddTransactionButton({ accounts, categories }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories  = categories.filter((c) => c.type === 'income');
  const relevantCategories = type === 'expense' ? expenseCategories : type === 'income' ? incomeCategories : [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      type,
      amount:      fd.get('amount'),
      date:        fd.get('date'),
      accountId:   fd.get('accountId'),
      categoryId:  fd.get('categoryId') || null,
      description: fd.get('description') || null,
      transferToAccountId: fd.get('transferToAccountId') || null,
    };
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Błąd zapisu');
      toast.success('Transakcja dodana');
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error('Nie udało się dodać transakcji');
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#01581E] text-white text-sm font-medium hover:bg-[#01581E]/90 transition-colors"
      >
        <Plus className="w-4 h-4" /> Dodaj transakcję
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Nowa transakcja</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Type selector */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                {(['expense', 'income', 'transfer'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      'flex-1 py-1.5 rounded-md text-xs font-medium transition-colors',
                      type === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t === 'expense' ? 'Wydatek' : t === 'income' ? 'Przychód' : 'Przelew'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Kwota *</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0,00"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Data *</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={today}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Konto *</label>
                <select
                  name="accountId"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]"
                >
                  <option value="">Wybierz konto</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {type === 'transfer' ? (
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Konto docelowe *</label>
                  <select
                    name="transferToAccountId"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]"
                  >
                    <option value="">Wybierz konto docelowe</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Kategoria</label>
                  <select
                    name="categoryId"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]"
                  >
                    <option value="">Bez kategorii</option>
                    {relevantCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Opis</label>
                <input
                  name="description"
                  type="text"
                  placeholder="Opcjonalny opis"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  Anuluj
                </button>
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
