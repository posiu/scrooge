'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileStack, Plus, Copy, Trash2, Loader2, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateItem { id: string; categoryId: string; plannedAmount: string; category?: { name: string; type: string } | null; }
interface Template { id: string; name: string; description: string | null; isDefault: boolean; items: TemplateItem[]; }
interface Category { id: string; name: string; type: string; }

const TYPE_COLORS: Record<string, string> = { income: 'text-green-600', expense: 'text-red-500', obligation: 'text-amber-600' };

function fmt(n: string | number) { return Number(n).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' }); }

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [items, setItems] = useState<{ categoryId: string; plannedAmount: string }[]>([{ categoryId: '', plannedAmount: '' }]);
  const [applyModal, setApplyModal] = useState<Template | null>(null);
  const [applyMonth, setApplyMonth] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [tmplRes, catRes] = await Promise.all([fetch('/api/budget/templates'), fetch('/api/categories')]);
    if (tmplRes.ok) setTemplates(await tmplRes.json());
    if (catRes.ok) setCategories(await catRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const now = new Date();
    setApplyMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const payload = { name: form.name, description: form.description || null, items: items.filter(i => i.categoryId && i.plannedAmount) };
    const res = await fetch('/api/budget/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { setShowForm(false); setForm({ name: '', description: '' }); setItems([{ categoryId: '', plannedAmount: '' }]); load(); }
    setSubmitting(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Usunąć szablon "${name}"?`)) return;
    await fetch(`/api/budget/templates/${id}`, { method: 'DELETE' });
    load();
  }

  async function handleApply() {
    if (!applyModal || !applyMonth) return;
    await fetch('/api/budget/templates/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId: applyModal.id, month: applyMonth }) });
    setApplyModal(null);
  }

  const expenseTotal = (t: Template) => t.items.filter(i => i.category?.type === 'expense' || i.category?.type === 'obligation').reduce((s, i) => s + Number(i.plannedAmount), 0);
  const incomeTotal  = (t: Template) => t.items.filter(i => i.category?.type === 'income').reduce((s, i) => s + Number(i.plannedAmount), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
            <FileStack className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Szablony budżetów</h1>
            <p className="text-sm text-muted-foreground">Zapisz strukturę budżetu i stosuj ją w kolejnych miesiącach</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 transition-colors">
          <Plus className="w-4 h-4" /> Nowy szablon
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : templates.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <FileStack className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Brak szablonów</p>
          <p className="text-xs text-muted-foreground">Utwórz pierwszy szablon budżetu, aby szybko planować kolejne miesiące.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map(t => {
            const isOpen = expanded === t.id;
            return (
              <div key={t.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        {t.isDefault && <span className="text-xs px-1.5 py-0.5 rounded bg-[#01581E]/10 text-[#01581E]">domyślny</span>}
                      </div>
                      {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                    </div>
                    <button onClick={() => handleDelete(t.id, t.name)}
                      className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground mb-3">
                    <span>Przychody: <strong className="text-green-600">{fmt(incomeTotal(t))}</strong></span>
                    <span>Wydatki: <strong className="text-red-500">{fmt(expenseTotal(t))}</strong></span>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setApplyModal(t)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#01581E] text-white text-xs font-medium hover:bg-[#01581E]/90 transition-colors">
                      <Copy className="w-3 h-3" /> Zastosuj
                    </button>
                    <button onClick={() => setExpanded(isOpen ? null : t.id)}
                      className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1">
                      {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} {t.items.length} pozycji
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-border px-4 py-3 space-y-1.5">
                    {t.items.map(item => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span className={cn('text-muted-foreground', TYPE_COLORS[item.category?.type ?? 'expense'])}>
                          {item.category?.name ?? 'Bez kategorii'}
                        </span>
                        <span className="text-foreground font-medium">{fmt(item.plannedAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">Nowy szablon budżetu</h2>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nazwa szablonu *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="np. Budżet domowy standardowy"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Opis</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Opcjonalny opis szablonu"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Pozycje budżetowe</label>
                  <button type="button" onClick={() => setItems(i => [...i, { categoryId: '', plannedAmount: '' }])}
                    className="text-xs text-[#01581E] hover:underline">+ Dodaj pozycję</button>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select value={item.categoryId} onChange={e => setItems(i => i.map((it, j) => j === idx ? { ...it, categoryId: e.target.value } : it))}
                      className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-[#01581E]">
                      <option value="">— kategoria —</option>
                      {['income', 'expense', 'obligation'].map(type => (
                        <optgroup key={type} label={type === 'income' ? 'Przychody' : type === 'expense' ? 'Wydatki' : 'Zobowiązania'}>
                          {categories.filter(c => c.type === type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </optgroup>
                      ))}
                    </select>
                    <input type="number" step="0.01" min="0" value={item.plannedAmount}
                      onChange={e => setItems(i => i.map((it, j) => j === idx ? { ...it, plannedAmount: e.target.value } : it))}
                      placeholder="0.00 PLN" className="w-28 px-2 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-[#01581E]" />
                    {items.length > 1 && (
                      <button type="button" onClick={() => setItems(i => i.filter((_, j) => j !== idx))}
                        className="p-1 text-muted-foreground hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted">Anuluj</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Zapisz szablon</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply modal */}
      {applyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-5 space-y-4">
            <h2 className="font-semibold text-foreground">Zastosuj szablon "{applyModal.name}"</h2>
            <p className="text-sm text-muted-foreground">Wybierz miesiąc, dla którego chcesz wygenerować budżet na podstawie tego szablonu.</p>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Miesiąc (YYYY-MM)</label>
              <input type="month" value={applyMonth} onChange={e => setApplyMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setApplyModal(null)} className="flex-1 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted">Anuluj</button>
              <button onClick={handleApply} className="flex-1 py-2 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90">
                <Copy className="w-4 h-4 inline mr-1" /> Zastosuj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
