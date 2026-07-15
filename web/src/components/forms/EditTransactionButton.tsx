'use client';

import { useState } from 'react';
import { Pencil, X, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Account, Category } from '@/lib/db/schema';

interface Props {
  transaction: any;
  accounts: Account[];
  categories: Category[];
}

export function EditTransactionButton({ transaction, accounts, categories }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(transaction.type);

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
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Błąd zapisu');
      toast.success('Transakcja zaktualizowana');
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error('Nie udało się zapisać zmian');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Czy na pewno chcesz usunąć tę transakcję?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      toast.success('Transakcja usunięta');
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error('Nie udało się usunąć transakcji');
    } finally {
      setDeleting(false);
    }
  }

  const txDate = transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
        title="Edytuj transakcję"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl text-left">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Edytuj transakcję</h2>
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
                    defaultValue={transaction.amount}
                    placeholder="0,00"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Data *</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={txDate}
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
                  defaultValue={transaction.accountId}
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
                    defaultValue={transaction.transferToAccountId ?? ''}
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
                    defaultValue={transaction.categoryId ?? ''}
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
                  defaultValue={transaction.description ?? ''}
                  placeholder="Opcjonalny opis"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 rounded-lg border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center justify-center"
                  title="Usuń transakcję"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setOpen(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors text-center">
                  Anuluj
                </button>
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
