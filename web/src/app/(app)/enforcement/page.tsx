'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Gavel, Plus, ChevronDown, ChevronUp, Loader2, X,
  AlertTriangle, CheckCircle2, PauseCircle, Scale,
  TrendingUp, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

type InterestType = 'statutory' | 'statutory_commercial' | 'contractual' | 'tax' | 'tax_delayed' | 'custom';
type EnforcementStatus = 'active' | 'partially_paid' | 'satisfied' | 'appealed' | 'suspended';

const INTEREST_TYPE_RATES: Record<InterestType, number | null> = {
  statutory:             11.25,
  statutory_commercial:  13.25,
  tax:                   14.50,
  tax_delayed:           7.25,
  contractual:           null,
  custom:                null,
};
const INTEREST_TYPES: InterestType[] = ['statutory', 'statutory_commercial', 'tax', 'tax_delayed', 'contractual', 'custom'];

const STATUS_META: Record<EnforcementStatus, { className: string; icon: React.ElementType }> = {
  active:         { className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',         icon: AlertTriangle },
  partially_paid: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',    icon: TrendingUp },
  satisfied:      { className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  appealed:       { className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Scale },
  suspended:      { className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: PauseCircle },
};
const ENFORCEMENT_STATUSES: EnforcementStatus[] = ['active', 'partially_paid', 'satisfied', 'appealed', 'suspended'];
const INTL_LOCALE: Record<Locale, string> = { pl: 'pl-PL', en: 'en-US' };

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

export default function EnforcementPage() {
  const t = useTranslations('Enforcement');
  const tInterest = useTranslations('InterestTypes');
  const tStatuses = useTranslations('EnforcementStatuses');
  const tCommon = useTranslations('Common');
  const locale = useLocale() as Locale;
  const fmt = (n: string | number) => Number(n).toLocaleString(INTL_LOCALE[locale], { style: 'currency', currency: 'PLN' });
  const [proceedings, setProceedings] = useState<Proceeding[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Proceeding | null>(null);
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

  function openAdd() {
    setEditTarget(null);
    setForm({
      creditor: '', enforcementAuthority: '', caseNumber: '', reason: '', originalAmount: '', remainingAmount: '', interestType: 'statutory', interestRateCustom: '', garnishmentDate: new Date().toISOString().split('T')[0], status: 'active', description: ''
    });
    setShowForm(true);
  }

  function handleStartEdit(proc: Proceeding) {
    setEditTarget(proc);
    setForm({
      creditor: proc.creditor,
      enforcementAuthority: proc.enforcementAuthority,
      caseNumber: proc.caseNumber ?? '',
      reason: proc.reason,
      originalAmount: proc.originalAmount,
      remainingAmount: proc.remainingAmount,
      interestType: proc.interestType,
      interestRateCustom: proc.interestRateCustom ?? '',
      garnishmentDate: proc.garnishmentDate ? new Date(proc.garnishmentDate).toISOString().split('T')[0] : '',
      status: proc.status,
      description: proc.description ?? '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const body = {
      ...form,
      originalAmount:     Number(form.originalAmount),
      remainingAmount:    Number(form.remainingAmount),
      interestRateCustom: form.interestRateCustom ? Number(form.interestRateCustom) : null,
      garnishmentDate:    new Date(form.garnishmentDate).toISOString(),
    };
    if (editTarget) {
      await fetch(`/api/enforcement/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      await fetch('/api/enforcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    setSubmitting(false);
    setShowForm(false);
    setForm({ creditor: '', enforcementAuthority: '', caseNumber: '', reason: '', originalAmount: '', remainingAmount: '', interestType: 'statutory', interestRateCustom: '', garnishmentDate: new Date().toISOString().split('T')[0], status: 'active', description: '' });
    setEditTarget(null);
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
    if (!confirm(t('deleteConfirm'))) return;
    await fetch(`/api/enforcement/${id}`, { method: 'DELETE' });
    load();
  }

  const active       = proceedings.filter(p => ['active', 'partially_paid'].includes(p.status));
  const totalOriginal = active.reduce((s, p) => s + Number(p.originalAmount), 0);
  const totalRemaining = active.reduce((s, p) => s + Number(p.remainingAmount), 0);
  const totalInterest  = active.reduce((s, p) => s + p.computedInterest, 0);
  const needsRate      = ['custom', 'contractual'].includes(form.interestType);
  const defaultRate    = INTEREST_TYPE_RATES[form.interestType];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
            <Gavel className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t('addButton')}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('originalAmount'), value: fmt(totalOriginal), color: 'text-foreground' },
          { label: t('remaining'), value: fmt(totalRemaining), color: 'text-amber-600' },
          { label: t('accruedInterest'), value: fmt(totalInterest), color: 'text-red-600' },
          { label: t('totalDebt'), value: fmt(totalRemaining + totalInterest), color: 'text-red-700 font-bold' },
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
          <p>{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proceedings.map(p => {
            const st = STATUS_META[p.status];
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
                        <st.icon className="w-3 h-3" />{tStatuses(p.status)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{p.reason}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>{p.enforcementAuthority}</span>
                      {p.caseNumber && <span>· {t('caseNumber', { number: p.caseNumber })}</span>}
                      {p.account && <span>· {p.account.name}</span>}
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{t('paidOf', { paid: fmt(Number(p.originalAmount) - Number(p.remainingAmount)), total: fmt(p.originalAmount) })}</span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-base font-semibold text-foreground">{fmt(p.remainingAmount)}</p>
                    <p className="text-xs text-red-500">+{fmt(p.computedInterest)} {t('interestSuffix')}</p>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-auto" /> : <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border px-5 py-4 space-y-4">
                    {/* Interest info */}
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm space-y-1">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium">
                        <TrendingUp className="w-4 h-4" />
                        {t('interestCalculator')}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>{t('type')} <span className="text-foreground">{tInterest(p.interestType)}</span></div>
                        <div>{t('rate')} <span className="text-foreground">{t('ratePerAnnum', { rate: p.computedInterestRate })}</span></div>
                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {t('daysSince')} <span className="text-foreground">{p.daysSinceGarnishment}</span></div>
                        <div>{t('accrued')} <span className="font-semibold text-red-600">{fmt(p.computedInterest)}</span></div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t.rich('totalWithInterest', {
                          amount: fmt(Number(p.remainingAmount) + p.computedInterest),
                          b: (chunks) => <strong className="text-red-700">{chunks}</strong>,
                        })}
                      </p>
                    </div>

                    {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}

                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('paymentHistory')}</p>
                      <div className="flex gap-3">
                        <button onClick={() => { setShowPayForm(p.id); setPayDate(new Date().toISOString().split('T')[0]); }}
                          className="text-xs text-[#01581E] hover:underline">{t('registerPayment')}</button>
                        <button onClick={() => handleStartEdit(p)} className="text-xs text-blue-600 hover:underline">{t('editButton')}</button>
                        <button onClick={() => handleDelete(p.id)} className="text-xs text-red-500 hover:text-red-700">{t('deleteButton')}</button>
                      </div>
                    </div>

                    {showPayForm === p.id && (
                      <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/20">
                        <div className="grid grid-cols-2 gap-2">
                          <input type="number" step="0.01" min="0" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                            placeholder={t('paymentAmountPlaceholder')} className="px-2 py-1.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-[#01581E]" />
                          <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
                            className="px-2 py-1.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-[#01581E]" />
                        </div>
                        <input value={payDesc} onChange={e => setPayDesc(e.target.value)} placeholder={t('paymentDescPlaceholder')}
                          className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-[#01581E]" />
                        <div className="flex gap-2">
                          <button onClick={() => setShowPayForm(null)} className="flex-1 py-1.5 text-xs border border-border rounded-md text-muted-foreground hover:bg-muted">{tCommon('cancel')}</button>
                          <button onClick={() => handlePayment(p.id)} disabled={!payAmount}
                            className="flex-1 py-1.5 text-xs bg-[#01581E] text-white rounded-md font-medium hover:bg-[#01581E]/90 disabled:opacity-50">{tCommon('save')}</button>
                        </div>
                      </div>
                    )}

                    {p.payments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t('noPayments')}</p>
                    ) : (
                      <div className="space-y-2">
                        {p.payments.map(pay => (
                          <div key={pay.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                            <div>
                              <p className="font-medium text-foreground">{pay.description ?? t('defaultPaymentNote')}</p>
                              <p className="text-xs text-muted-foreground">{new Date(pay.paymentDate).toLocaleDateString(INTL_LOCALE[locale])}</p>
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
              <h2 className="font-semibold text-foreground">{editTarget ? t('editModalTitle') : t('addModalTitle')}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{t('creditorLabel')}</label>
                <input required value={form.creditor} onChange={e => setForm(f => ({ ...f, creditor: e.target.value }))}
                  placeholder={t('creditorPlaceholder')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{t('authorityLabel')}</label>
                <input required value={form.enforcementAuthority} onChange={e => setForm(f => ({ ...f, enforcementAuthority: e.target.value }))}
                  placeholder={t('authorityPlaceholder')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t('caseNumberLabel')}</label>
                  <input value={form.caseNumber} onChange={e => setForm(f => ({ ...f, caseNumber: e.target.value }))}
                    placeholder={t('caseNumberPlaceholder')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t('garnishmentDateLabel')}</label>
                  <input required type="date" value={form.garnishmentDate} onChange={e => setForm(f => ({ ...f, garnishmentDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{t('reasonLabel')}</label>
                <input required value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder={t('reasonPlaceholder')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t('originalAmountLabel')}</label>
                  <input required type="number" step="0.01" min="0" value={form.originalAmount} onChange={e => setForm(f => ({ ...f, originalAmount: e.target.value }))}
                    placeholder="0.00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t('remainingAmountLabel')}</label>
                  <input required type="number" step="0.01" min="0" value={form.remainingAmount} onChange={e => setForm(f => ({ ...f, remainingAmount: e.target.value }))}
                    placeholder="0.00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{t('interestTypeLabel')}</label>
                <select value={form.interestType} onChange={e => setForm(f => ({ ...f, interestType: e.target.value as InterestType, interestRateCustom: '' }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                  {INTEREST_TYPES.map((v) => (
                    <option key={v} value={v}>{tInterest(v)}{INTEREST_TYPE_RATES[v] ? ` — ${INTEREST_TYPE_RATES[v]}% p.a.` : ''}</option>
                  ))}
                </select>
                {!needsRate && defaultRate && (
                  <p className="text-xs text-muted-foreground">{t('appliedRate', { rate: defaultRate })}</p>
                )}
              </div>
              {needsRate && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t('customRateLabel')}</label>
                  <input required={needsRate} type="number" step="0.01" min="0" max="100" value={form.interestRateCustom}
                    onChange={e => setForm(f => ({ ...f, interestRateCustom: e.target.value }))}
                    placeholder={t('customRatePlaceholder')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t('statusLabel')}</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as EnforcementStatus }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                    {ENFORCEMENT_STATUSES.map((v) => <option key={v} value={v}>{tStatuses(v)}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{t('descriptionLabel')}</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder={t('descriptionPlaceholder')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E] resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">{tCommon('cancel')}</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editTarget ? t('submitSave') : t('submitAdd'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
