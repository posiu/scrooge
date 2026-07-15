'use client';

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function AddLiabilityButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/liabilities', {
        method: 'POST',
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
      toast.success('Zobowiązanie dodane');
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error('Nie udało się dodać zobowiązania');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#01581E] text-white text-sm font-medium hover:bg-[#01581E]/90 transition-colors">
        <Plus className="w-4 h-4" /> Dodaj zobowiązanie
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Nowe zobowiązanie</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Nazwa *</label>
                <input name="name" required placeholder="np. Kredyt hipoteczny" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Typ *</label>
                <select name="type" required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                  <option value="loan">Kredyt</option>
                  <option value="credit">Karta kredytowa</option>
                  <option value="subscription">Subskrypcja</option>
                  <option value="installment">Rata</option>
                  <option value="personal_loan">Pożyczka osobista</option>
                  <option value="bank_loan">Pożyczka bankowa</option>
                  <option value="company_loan">Pożyczka z firmy</option>
                  <option value="other">Inne</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Kwota całkowita *</label>
                  <input name="totalAmount" type="number" step="0.01" min="0" required placeholder="0,00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Pozostało do spłaty</label>
                  <input name="remainingAmount" type="number" step="0.01" min="0" placeholder="= kwota całkowita" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Rata miesięczna</label>
                  <input name="monthlyPayment" type="number" step="0.01" min="0" placeholder="0,00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Oprocentowanie (%)</label>
                  <input name="interestRate" type="number" step="0.01" min="0" placeholder="0,00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Data zakończenia</label>
                <input name="dueDate" type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
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
