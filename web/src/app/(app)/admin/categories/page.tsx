'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tags, Plus, Pencil, Trash2, Loader2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type CategoryType = 'income' | 'expense' | 'obligation';

interface Category {
  id: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
}

const TYPE_LABELS: Record<CategoryType, string> = { income: 'Przychody', expense: 'Wydatki', obligation: 'Zobowiązania' };
const TYPE_COLORS: Record<CategoryType, string> = { income: 'text-green-600', expense: 'text-red-500', obligation: 'text-amber-600' };

const emptyForm = { name: '', type: 'expense' as CategoryType, icon: '', parentId: '' };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setForm(emptyForm); setEditTarget(null); setShowForm(true); }
  function openEdit(cat: Category) { setForm({ name: cat.name, type: cat.type, icon: cat.icon ?? '', parentId: cat.parentId ?? '' }); setEditTarget(cat); setShowForm(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const payload = { name: form.name, type: form.type, icon: form.icon || null, parentId: form.parentId || null };
    if (editTarget) {
      await fetch(`/api/categories/${editTarget.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    setSubmitting(false);
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Usunąć kategorię "${name}"?`)) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    load();
  }

  const grouped = (['income', 'expense', 'obligation'] as CategoryType[]).map(type => ({
    type,
    roots: categories.filter(c => c.type === type && !c.parentId),
    children: categories.filter(c => c.type === type && c.parentId),
  }));

  const parents = categories.filter(c => !c.parentId && c.type === form.type);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
            <Tags className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Zarządzanie kategoriami</h1>
            <p className="text-sm text-muted-foreground">Dodawaj, edytuj i organizuj kategorie transakcji</p>
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 transition-colors">
          <Plus className="w-4 h-4" /> Nowa kategoria
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ type, roots, children }) => (
            <div key={type} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                <Tags className={cn('w-4 h-4', TYPE_COLORS[type])} />
                <h2 className="text-sm font-semibold text-foreground">{TYPE_LABELS[type]}</h2>
                <span className="ml-auto text-xs text-muted-foreground">{roots.length + children.length}</span>
              </div>
              {roots.length === 0 && children.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Brak kategorii. Kliknij "Nowa kategoria" żeby dodać.</p>
              ) : (
                <div className="divide-y divide-border">
                  {roots.map(cat => {
                    const subs = children.filter(c => c.parentId === cat.id);
                    return (
                      <div key={cat.id} className="px-5 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {cat.icon && <span>{cat.icon}</span>}
                            <span className="text-sm font-medium text-foreground">{cat.name}</span>
                            {cat.isSystem && <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">systemowa</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(cat)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edytuj">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {!cat.isSystem && (
                              <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors" title="Usuń">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {subs.map(sub => (
                          <div key={sub.id} className="flex items-center justify-between mt-1.5 ml-5">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="text-xs">↳</span>
                              {sub.icon && <span>{sub.icon}</span>}
                              <span>{sub.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEdit(sub)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDelete(sub.id, sub.name)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">{editTarget ? 'Edytuj kategorię' : 'Nowa kategoria'}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nazwa *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="np. Jedzenie"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Typ *</label>
                  <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CategoryType, parentId: '' }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                    <option value="expense">Wydatki</option>
                    <option value="income">Przychody</option>
                    <option value="obligation">Zobowiązania</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Emoji (ikona)</label>
                  <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🍕"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
              </div>
              {parents.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Kategoria nadrzędna (opcjonalnie)</label>
                  <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                    <option value="">— brak (kategoria główna) —</option>
                    {parents.map(p => <option key={p.id} value={p.id}>{p.icon ? `${p.icon} ` : ''}{p.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted">Anuluj</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" />{editTarget ? 'Zapisz' : 'Dodaj'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
