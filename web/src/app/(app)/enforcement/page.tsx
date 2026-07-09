'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Gavel, Plus, ChevronDown, ChevronUp, Loader2, X,
  AlertTriangle, CheckCircle2, PauseCircle, Scale,
  TrendingUp, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type InterestType = 'statutory' | 'statutory_commercial' | 'contractual' | 'tax' | 'tax_delayed' | 'custom';
type EnforcementStatus = 'active' | 'partially_paid' | 'satisfied' | 'appealed' | 'suspended';

const INTEREST_TYPE_LABELS: Record<InterestType, { label: string; rate: number | null }> = {
  statutory:             { label: 'Ustawowe za opóźnienie (art. 481 KC)',          rate: 11.25 },
  statutory_commercial:  { label: 'Ustawowe handlowe (transakcje handlowe)',       rate: 13.25 },
  tax:                   { label: 'Podatkowe (Ordynacja podatkowa)',               rate: 14.50 },
  tax_delayed:           { label: 'Obniżone podatkowe (50%)',                      rate: 7.25  },
  contractual:           { label: 'Umowne (wg umowy)',                             rate: null  },
  custom:                { label: 'Niestandardowe (wpisz ręcznie)',                rate: null  },
};

const STATUS_STYLES: Record<EnforcementStatus, { label: string; className: string; icon: React.ElementType }> = {
  active:         { label: 'Aktywne',           className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',         icon: AlertTriangle },
  partially_paid: { label: 'Częściowo spłacone', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',    icon: TrendingUp },
  satisfied:      { label: 'Zakończone',        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  appealed:       { label: 'Zaskarżone',        className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Scale },
  suspended:      { label: 'Zawieszone',        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: PauseCircle },
};

interface Proceeding {
  id: string;
  creditor: string;
  enforcementAuthority: string;
  caseNumber: string | null;
  reason: string;
  originalAmount: string;
  remainingAmount: string;
  interestType: InterestType;
  interestRateCustom: string | null;
  garnishmentDate: string;
  status: EnforcementStatus;
  description: string | null;
  computedInterestRate: number;
  computedInterest: number;
  daysSinceGarnishment: number;
  account?: { name: string } | null;
  payments: { id: string; amount: string; paymentDate: string; description: string | null }[];
}

function fmt(n: string | number) {
  return Number(n).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' });
}

export default function EnforcementPage() {
  const [proceedings, setProceedings] = useState<Proceeding[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPayForm, setShowPayForm] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payDesc, setPayDesc] = useState('');

  const [form, setForm] = useState({
    creditor: '', enforcementAuthority: '', caseNumber: '', reason: '',
    originalAmount: '', remainingAmount: '', interestType: 'statutory' as InterestType,
    interestRateCustom: '', garnishmentDate: new Date().toISOString().split('T')[0],
    status: 'active' as EnforcementStatus, description: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/enforcement');
    const data = await res.json();
    setProceedings(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch('/api/enforcement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        originalAmount:     Number(form.originalAmount),
        remainingAmount:    Number(form.remainingAmount),
        interestRateCustom: form.interestRateCustom ? Number(form.interestRateCustom) : null,
      }),
    });
    setSubmitting(false);
    setShowForm(false);
    setForm({ creditor: '', enforcementAuthority: '', caseNumber: '', reason: '', originalAmount: '', remainingAmount: '', interestType: 'statutory', interestRateCustom: '', garnishmentDate: new Date().toISOString().split('T')[0], status: 'active', description: '' });
    load();
  }

  async function handlePayment(id: string) {
    if (!payAmount) return;
    await fetch(`/api/enforcement/${id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(payAmount), paymentDate: payDate, description: payDesc || null }),
    });
    setShowPayForm(null);
    setPayAmount(''); setPayDesc('');
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Usunąć to zajęcie egzekucyjne?')) return;
    await fetch(`/api/enforcement/${id}`, { method: 'DELETE' });
    load();
  }

  const active       = proceedings.filter(p => ['active', 'partially_paid'].includes(p.status));
  const totalOriginal = active.reduce((s, p) => s + Number(p.originalAmount), 0);
  const totalRemaining = active.reduce((s, p) => s + Number(p.remainingAmount), 0);
  const totalInterest  = active.reduce((s, p) => s + p.computedInterest, 0);
  const needsRate      = ['custom', 'contractual'].includes(form.interestType);
  const defaultRate    = INTEREST_TYPE_LABELS[form.interestType].rate;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
            <Gavel className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Zajęcia egzekucyjne</h1>
            <p className="text-sm text-muted-foreground">Ewidencja zajęć komorniczych i skarbowych</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Dodaj zajęcie
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Kwota pierwotna (aktywne)', value: fmt(totalOriginal), color: 'text-foreground' },
          { label: 'Pozostało do spłaty', value: fmt(totalRemaining), color: 'text-amber-600' },
          { label: 'Naliczone odsetki', value: fmt(totalInterest), color: 'text-red-600' },
          { label: 'Łączne zadłużenie', value: fmt(totalRemaining + totalInterest), color: 'text-red-700 font-bold' },
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
      ) : proceedings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Gavel className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Brak zajęć egzekucyjnych. Dodaj pierwsze.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proceedings.map(p => {
            const st = STATUS_STYLES[p.status];
            const pct = Math.min(100, ((Number(p.originalAmount) - Number(p.remainingAmount)) / Number(p.originalAmount)) * 100);
            const isOpen = expanded === p.id;
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-muted/30 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : p.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-foreground">{p.creditor}</span>
                      <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', st.className)}>
                        <st.icon className="w-3 h-3" />{st.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{p.reason}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>{p.enforcementAuthority}</span>
                      {p.caseNumber && <span>· sygn. {p.caseNumber}</span>}
                      {p.account && <span>· {p.account.name}</span>}
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Spłacono {fmt(Number(p.originalAmount) - Number(p.remainingAmount))} / {fmt(p.originalAmount)}</span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-base font-semibold text-foreground">{fmt(p.remainingAmount)}</p>
                    <p className="text-xs text-red-500">+{fmt(p.computedInterest)} odsetek</p>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-auto" /> : <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border px-5 py-4 space-y-4">
                    {/* Interest info */}
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm space-y-1">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium">
                        <TrendingUp className="w-4 h-4" />
                        Kalkulator odsetek
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>Typ: <span className="text-foreground">{INTEREST_TYPE_LABELS[p.interestType].label}</span></div>
                        <div>Stopa: <span className="text-foreground">{p.computedInterestRate}% p.a.</span></div>
                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Dni od zajęcia: <span className="text-foreground">{p.daysSinceGarnishment}</span></div>
                        <div>Naliczone odsetki: <span className="font-semibold text-red-600">{fmt(p.computedInterest)}</span></div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Łączna kwota z odsetkami: <strong className="text-red-700">{fmt(Number(p.remainingAmount) + p.computedInterest)}</strong>
                      </p>
                    </div>

                    {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}

                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Historia spłat</p>
                      <div className="flex gap-2">
                        <button onClick={() => { setShowPayForm(p.id); setPayDate(new Date().toISOString().split('T')[0]); }}
                          className="text-xs text-[#01581E] hover:underline">+ Zarejestruj spłatę</button>
                        <button onClick={() => handleDelete(p.id)} className="text-xs text-red-500 hover:text-red-700">Usuń</button>
                      </div>
                    </div>

                    {showPayForm === p.id && (
                      <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/20">
                        <div className="grid grid-cols-2 gap-2">
                          <input type="number" step="0.01" min="0" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                            placeholder="Kwota (PLN)" className="px-2 py-1.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-[#01581E]" />
                          <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
                            className="px-2 py-1.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-[#01581E]" />
                        </div>
                        <input value={payDesc} onChange={e => setPayDesc(e.target.value)} placeholder="Opis spłaty (opcjonalnie)"
                          className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-[#01581E]" />
                        <div className="flex gap-2">
                          <button onClick={() => setShowPayForm(null)} className="flex-1 py-1.5 text-xs border border-border rounded-md text-muted-foreground hover:bg-muted">Anuluj</button>
                          <button onClick={() => handlePayment(p.id)} disabled={!payAmount}
                            className="flex-1 py-1.5 text-xs bg-[#01581E] text-white rounded-md font-medium hover:bg-[#01581E]/90 disabled:opacity-50">Zapisz</button>
                        </div>
                      </div>
                    )}

                    {p.payments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Brak zarejestrowanych spłat.</p>
                    ) : (
                      <div className="space-y-2">
                        {p.payments.map(pay => (
                          <div key={pay.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                            <div>
                              <p className="font-medium text-foreground">{pay.description ?? 'Spłata'}</p>
                              <p className="text-xs text-muted-foreground">{new Date(pay.paymentDate).toLocaleDateString('pl-PL')}</p>
                            </div>
                            <span className="font-semibold text-green-600">{fmt(pay.amount)}</span>
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
              <h2 className="font-semibold text-foreground">Nowe zajęcie egzekucyjne</h2>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Wierzyciel *</label>
                <input required value={form.creditor} onChange={e => setForm(f => ({ ...f, creditor: e.target.value }))}
                  placeholder="np. Bank PKO BP S.A." className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Organ egzekucyjny *</label>
                <input required value={form.enforcementAuthority} onChange={e => setForm(f => ({ ...f, enforcementAuthority: e.target.value }))}
                  placeholder="np. Komornik Sądowy Jan Kowalski, KM 123/24" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Numer sprawy</label>
                  <input value={form.caseNumber} onChange={e => setForm(f => ({ ...f, caseNumber: e.target.value }))}
                    placeholder="KM 123/24" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Data zajęcia *</label>
                  <input required type="date" value={form.garnishmentDate} onChange={e => setForm(f => ({ ...f, garnishmentDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tytuł egzekucyjny *</label>
                <input required value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="np. Niespłacony kredyt — wyrok SR sygn. I C 123/23" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Kwota pierwotna (PLN) *</label>
                  <input required type="number" step="0.01" min="0" value={form.originalAmount} onChange={e => setForm(f => ({ ...f, originalAmount: e.target.value }))}
                    placeholder="0.00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Pozostało do spłaty *</label>
                  <input required type="number" step="0.01" min="0" value={form.remainingAmount} onChange={e => setForm(f => ({ ...f, remainingAmount: e.target.value }))}
                    placeholder="0.00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Typ odsetek</label>
                <select value={form.interestType} onChange={e => setForm(f => ({ ...f, interestType: e.target.value as InterestType, interestRateCustom: '' }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                  {Object.entries(INTEREST_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l.label}{l.rate ? ` — ${l.rate}% p.a.` : ''}</option>
                  ))}
                </select>
                {!needsRate && defaultRate && (
                  <p className="text-xs text-muted-foreground">Stosowana stopa: {defaultRate}% p.a. (ustawowa)</p>
                )}
              </div>
              {needsRate && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Stopa odsetek (% rocznie) *</label>
                  <input required={needsRate} type="number" step="0.01" min="0" max="100" value={form.interestRateCustom}
                    onChange={e => setForm(f => ({ ...f, interestRateCustom: e.target.value }))}
                    placeholder="np. 12.00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as EnforcementStatus }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                    {Object.entries(STATUS_STYLES).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Opis / Uwagi</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Opcjonalne uwagi..." className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E] resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">Anuluj</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dodaj zajęcie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
