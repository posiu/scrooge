'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Receipt, Plus, ChevronDown, ChevronUp, Wallet, Clock,
  CheckCircle2, AlertCircle, Loader2, X, CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

type TaxType = 'personal_income' | 'corporate' | 'real_estate' | 'land' | 'pcc' | 'investment' | 'capital_gains' | 'other';
type TaxStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue';

const TAX_TYPES: TaxType[] = ['personal_income', 'corporate', 'real_estate', 'land', 'pcc', 'investment', 'capital_gains', 'other'];

const STATUS_META: Record<TaxStatus, { className: string; icon: React.ElementType }> = {
  pending:         { className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',  icon: Clock },
  partially_paid:  { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',    icon: Wallet },
  paid:            { className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  overdue:         { className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',         icon: AlertCircle },
};
const TAX_STATUSES: TaxStatus[] = ['pending', 'partially_paid', 'paid', 'overdue'];
const INTL_LOCALE: Record<Locale, string> = { pl: 'pl-PL', en: 'en-US' };

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

export default function TaxesPage() {
  const t = useTranslations('Taxes');
  const tTypes = useTranslations('TaxTypes');
  const tStatuses = useTranslations('TaxStatuses');
  const tCommon = useTranslations('Common');
  const locale = useLocale() as Locale;
  const fmt = (n: string | number) => Number(n).toLocaleString(INTL_LOCALE[locale], { style: 'currency', currency: 'PLN' });
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Tax | null>(null);
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

  function openAdd() {
    setEditTarget(null);
    setForm({ name: '', type: 'personal_income', taxPeriod: '', taxOffice: '', amountDue: '', amountPaid: '0', dueDate: '', status: 'pending', description: '' });
    setShowForm(true);
  }

  function handleStartEdit(tax: Tax) {
    setEditTarget(tax);
    setForm({
      name: tax.name,
      type: tax.type,
      taxPeriod: tax.taxPeriod ?? '',
      taxOffice: tax.taxOffice ?? '',
      amountDue: tax.amountDue,
      amountPaid: tax.amountPaid,
      dueDate: tax.dueDate ? new Date(tax.dueDate).toISOString().split('T')[0] : '',
      status: tax.status,
      description: tax.description ?? '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const body = {
      ...form,
      amountDue: Number(form.amountDue),
      amountPaid: Number(form.amountPaid),
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
    };
    if (editTarget) {
      await fetch(`/api/taxes/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      await fetch('/api/taxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    setSubmitting(false);
    setShowForm(false);
    setForm({ name: '', type: 'personal_income', taxPeriod: '', taxOffice: '', amountDue: '', amountPaid: '0', dueDate: '', status: 'pending', description: '' });
    setEditTarget(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return;
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('totalDue'), value: fmt(totalDue), color: 'text-foreground' },
          { label: t('totalPaid'), value: fmt(totalPaid), color: 'text-green-600' },
          { label: t('remaining'), value: fmt(totalLeft), color: totalLeft > 0 ? 'text-amber-600' : 'text-green-600' },
          { label: t('overdueCount'), value: String(overdue), color: overdue > 0 ? 'text-red-600' : 'text-muted-foreground' },
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
          <p>{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {taxes.map(tax => {
            const st = STATUS_META[tax.status];
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
                        <st.icon className="w-3 h-3" />{tStatuses(tax.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>{tTypes(tax.type)}</span>
                      {tax.taxPeriod && <span>· {tax.taxPeriod}</span>}
                      {tax.taxOffice && <span>· {tax.taxOffice}</span>}
                      {tax.dueDate && <span>· {t('dueLabel', { date: new Date(tax.dueDate).toLocaleDateString(INTL_LOCALE[locale]) })}</span>}
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
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('paymentHistory')}</p>
                      <div className="flex gap-3">
                        <button onClick={() => handleStartEdit(tax)} className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium">{t('editButton')}</button>
                        <button onClick={() => handleDelete(tax.id)} className="text-xs text-red-500 hover:text-red-700 hover:underline">{t('deleteButton')}</button>
                      </div>
                    </div>
                    {tax.payments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t('noPayments')}</p>
                    ) : (
                      <div className="space-y-2">
                        {tax.payments.map(p => (
                          <div key={p.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                            <div>
                              <p className="font-medium text-foreground">{p.description ?? t('defaultPaymentNote')}</p>
                              <p className="text-xs text-muted-foreground">{new Date(p.paymentDate).toLocaleDateString(INTL_LOCALE[locale])}</p>
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
              <h2 className="font-semibold text-foreground">{editTarget ? t('editModalTitle') : t('addModalTitle')}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{t('nameLabel')}</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={t('namePlaceholder')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t('typeLabel')}</label>
                  <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TaxType }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                    {TAX_TYPES.map((v) => <option key={v} value={v}>{tTypes(v)}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t('statusLabel')}</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TaxStatus }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                    {TAX_STATUSES.map((v) => <option key={v} value={v}>{tStatuses(v)}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t('amountDueLabel')}</label>
                  <input required type="number" step="0.01" min="0" value={form.amountDue} onChange={e => setForm(f => ({ ...f, amountDue: e.target.value }))}
                    placeholder="0.00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t('amountPaidLabel')}</label>
                  <input type="number" step="0.01" min="0" value={form.amountPaid} onChange={e => setForm(f => ({ ...f, amountPaid: e.target.value }))}
                    placeholder="0.00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t('periodLabel')}</label>
                  <input value={form.taxPeriod} onChange={e => setForm(f => ({ ...f, taxPeriod: e.target.value }))}
                    placeholder={t('periodPlaceholder')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t('dueDateLabel')}</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{t('taxOfficeLabel')}</label>
                <input value={form.taxOffice} onChange={e => setForm(f => ({ ...f, taxOffice: e.target.value }))}
                  placeholder={t('taxOfficePlaceholder')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
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
