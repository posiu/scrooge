'use client';

import { useState } from 'react';
import { Pencil, X, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Liability {
  id: string;
  name: string;
  type: 'loan' | 'credit' | 'subscription' | 'installment' | 'other';
  totalAmount: string;
  remainingAmount: string;
  monthlyPayment: string | null;
  interestRate: string | null;
  dueDate: Date | string | null;
}

interface Props {
  liability: Liability;
}

export function EditLiabilityButton({ liability }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/liabilities/${liability.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          type: fd.get('type'),
          totalAmount: fd.get('totalAmount'),
          remainingAmount: fd.get('remainingAmount') || fd.get('totalAmount'),
          monthlyPayment: fd.get('monthlyPayment') || null,
          interestRate: fd.get('interestRate') || null,
          dueDate: fd.get('dueDate') || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Zobowiązanie zaktualizowane');
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error('Nie udało się zapisać zmian');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Czy na pewno chcesz usunąć to zobowiązanie?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/liabilities/${liability.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      toast.success('Zobowiązanie zostało usunięte');
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error('Nie udało się usunąć zobowiązania');
    } finally {
      setDeleting(false);
    }
  }

  const due = liability.dueDate ? new Date(liability.dueDate).toISOString().split('T')[0] : '';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
        title="Edytuj zobowiązanie"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl text-left">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Edytuj zobowiązanie</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Nazwa *</label>
                <input name="name" required defaultValue={liability.name} placeholder="np. Kredyt hipoteczny" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Typ *</label>
                <select name="type" required defaultValue={liability.type} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                  <option value="loan">Kredyt</option>
                  <option value="credit">Karta kredytowa</option>
                  <option value="subscription">Subskrypcja</option>
                  <option value="installment">Rata</option>
                  <option value="other">Inne</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Kwota całkowita *</label>
                  <input name="totalAmount" type="number" step="0.01" min="0" required defaultValue={liability.totalAmount} placeholder="0,00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Pozostało do spłaty</label>
                  <input name="remainingAmount" type="number" step="0.01" min="0" defaultValue={liability.remainingAmount} placeholder="= kwota całkowita" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Rata miesięczna</label>
                  <input name="monthlyPayment" type="number" step="0.01" min="0" defaultValue={liability.monthlyPayment ?? ''} placeholder="0,00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Oprocentowanie (%)</label>
                  <input name="interestRate" type="number" step="0.01" min="0" defaultValue={liability.interestRate ?? ''} placeholder="0,00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Data zakończenia</label>
                <input name="dueDate" type="date" defaultValue={due} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 rounded-lg border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center justify-center"
                  title="Usuń zobowiązanie"
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
