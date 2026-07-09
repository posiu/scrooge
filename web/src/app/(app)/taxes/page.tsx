'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Receipt, Plus, ChevronDown, ChevronUp, Wallet, Clock,
  CheckCircle2, AlertCircle, Loader2, X, CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TaxType = 'personal_income' | 'corporate' | 'real_estate' | 'land' | 'pcc' | 'investment' | 'capital_gains' | 'other';
type TaxStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue';

const TAX_TYPE_LABELS: Record<TaxType, string> = {
  personal_income: 'PIT — podatek dochodowy osobisty',
  corporate:       'CIT — podatek dochodowy firm',
  real_estate:     'Podatek od nieruchomości',
  land:            'Podatek od gruntu',
  pcc:             'PCC — czynności cywilnoprawne',
  investment:      'Podatek Belki (zyski kapitałowe)',
  capital_gains:   'Podatek od sprzedaży udziałów',
  other:           'Inny',
};

const STATUS_STYLES: Record<TaxStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending:         { label: 'Oczekuje',         className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',  icon: Clock },
  partially_paid:  { label: 'Częściowo spłacony', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',    icon: Wallet },
  paid:            { label: 'Zapłacony',        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  overdue:         { label: 'Zaległy',          className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',         icon: AlertCircle },
};

interface Tax {
  id: string;
  name: string;
  type: TaxType;
  taxPeriod: string | null;
  taxOffice: string | null;
  amountDue: string;
  amountPaid: string;
  dueDate: string | null;
  status: TaxStatus;
  description: string | null;
  payments: { id: string; amount: string; paymentDate: string; description: string | null }[];
}

function fmt(n: string | number) {
  return Number(n).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' });
}

export default function TaxesPage() {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'personal_income' as TaxType, taxPeriod: '',
    taxOffice: '', amountDue: '', amountPaid: '0', dueDate: '', status: 'pending' as TaxStatus, description: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/taxes');
    const data = await res.json();
    setTaxes(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch('/api/taxes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amountDue: Number(form.amountDue), amountPaid: Number(form.amountPaid) }),
    });
    setSubmitting(false);
    setShowForm(false);
    setForm({ name: '', type: 'personal_income', taxPeriod: '', taxOffice: '', amountDue: '', amountPaid: '0', dueDate: '', status: 'pending', description: '' });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Usunąć ten podatek?')) return;
    await fetch(`/api/taxes/${id}`, { method: 'DELETE' });
    load();
  }

  const totalDue  = taxes.reduce((s, t) => s + Number(t.amountDue), 0);
  const totalPaid = taxes.reduce((s, t) => s + Number(t.amountPaid), 0);
  const totalLeft = totalDue - totalPaid;
  const overdue   = taxes.filter(t => t.status === 'overdue').length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
            <Receipt className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Podatki</h1>
            <p className="text-sm text-muted-foreground">Ewidencja zobowiązań podatkowych</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Dodaj podatek
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Do zapłaty łącznie', value: fmt(totalDue), color: 'text-foreground' },
          { label: 'Zapłacone', value: fmt(totalPaid), color: 'text-green-600' },
          { label: 'Pozostało', value: fmt(totalLeft), color: totalLeft > 0 ? 'text-amber-600' : 'text-green-600' },
          { label: 'Zaległe pozycje', value: String(overdue), color: overdue > 0 ? 'text-red-600' : 'text-muted-foreground' },
        ].map(c => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
            <p className={cn('text-xl font-bold', c.color)}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : taxes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Brak podatków. Dodaj pierwsze zobowiązanie podatkowe.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {taxes.map(tax => {
            const st = STATUS_STYLES[tax.status];
            const pct = Math.min(100, (Number(tax.amountPaid) / Number(tax.amountDue)) * 100);
            const isOpen = expanded === tax.id;
            return (
              <div key={tax.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-muted/30 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : tax.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-foreground">{tax.name}</span>
                      <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', st.className)}>
                        <st.icon className="w-3 h-3" />{st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>{TAX_TYPE_LABELS[tax.type]}</span>
                      {tax.taxPeriod && <span>· {tax.taxPeriod}</span>}
                      {tax.taxOffice && <span>· {tax.taxOffice}</span>}
                      {tax.dueDate && <span>· termin: {new Date(tax.dueDate).toLocaleDateString('pl-PL')}</span>}
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{fmt(tax.amountPaid)} / {fmt(tax.amountDue)}</span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[#01581E] rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-base font-semibold text-foreground">{fmt(Number(tax.amountDue) - Number(tax.amountPaid))}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border px-5 py-4 space-y-3">
                    {tax.description && <p className="text-sm text-muted-foreground">{tax.description}</p>}
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Historia wpłat</p>
                      <button onClick={() => handleDelete(tax.id)} className="text-xs text-red-500 hover:text-red-700">Usuń podatek</button>
                    </div>
                    {tax.payments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Brak zarejestrowanych wpłat.</p>
                    ) : (
                      <div className="space-y-2">
                        {tax.payments.map(p => (
                          <div key={p.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                            <div>
                              <p className="font-medium text-foreground">{p.description ?? 'Wpłata'}</p>
                              <p className="text-xs text-muted-foreground">{new Date(p.paymentDate).toLocaleDateString('pl-PL')}</p>
                            </div>
                            <span className="font-semibold text-green-600">{fmt(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">Nowy podatek</h2>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nazwa *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="np. PIT-37 2024" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Typ *</label>
                  <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TaxType }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                    {Object.entries(TAX_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TaxStatus }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                    {Object.entries(STATUS_STYLES).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Kwota należna (PLN) *</label>
                  <input required type="number" step="0.01" min="0" value={form.amountDue} onChange={e => setForm(f => ({ ...f, amountDue: e.target.value }))}
                    placeholder="0.00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Zapłacono (PLN)</label>
                  <input type="number" step="0.01" min="0" value={form.amountPaid} onChange={e => setForm(f => ({ ...f, amountPaid: e.target.value }))}
                    placeholder="0.00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Okres</label>
                  <input value={form.taxPeriod} onChange={e => setForm(f => ({ ...f, taxPeriod: e.target.value }))}
                    placeholder="2024 / 2024-Q3" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Termin płatności</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Urząd skarbowy</label>
                <input value={form.taxOffice} onChange={e => setForm(f => ({ ...f, taxOffice: e.target.value }))}
                  placeholder="np. US Warszawa-Praga" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Opis</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Opcjonalne uwagi..." className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E] resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">Anuluj</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dodaj'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
