'use client';

import { useState, useEffect, useCallback } from 'react';
import { Target, Plus, Loader2, X, Check, PiggyBank, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalDeposit { id: string; amount: string; note: string | null; depositAt: string; }
interface Goal {
  id: string; name: string; targetAmount: string; currentAmount: string;
  targetDate: string | null; icon: string | null; color: string; status: string;
  description: string | null; deposits: GoalDeposit[];
}

const GOAL_ICONS = ['🏠', '🚗', '✈️', '🎓', '💍', '🏋️', '📱', '💻', '🌴', '🐕', '🎸', '📚', '🏊', '⛵', '🎯'];
const GOAL_COLORS = ['#01581E', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#ca8a04', '#0891b2', '#475569'];

function fmt(n: string | number) {
  return Number(n).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' });
}

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [depositTarget, setDepositTarget] = useState<Goal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [editTarget, setEditTarget] = useState<Goal | null>(null);

  const [form, setForm] = useState({ name: '', targetAmount: '', currentAmount: '0', targetDate: '', icon: '🎯', color: '#01581E', description: '' });

  function closeForm() {
    setShowForm(false);
    setEditTarget(null);
    setForm({ name: '', targetAmount: '', currentAmount: '0', targetDate: '', icon: '🎯', color: '#01581E', description: '' });
  }

  function handleStartEdit(goal: Goal) {
    setEditTarget(goal);
    setForm({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : '',
      icon: goal.icon ?? '🎯',
      color: goal.color,
      description: goal.description ?? '',
    });
    setShowForm(true);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/goals');
    const data = await res.json();
    setGoals(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const payload = { ...form, targetAmount: Number(form.targetAmount), currentAmount: Number(form.currentAmount) };
    if (editTarget) {
      await fetch(`/api/goals/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setSubmitting(false);
    closeForm();
    load();
  }

  async function handleDeposit(goal: Goal) {
    if (!depositAmount) return;
    await fetch(`/api/goals/${goal.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(depositAmount), note: depositNote || null }),
    });
    setDepositTarget(null); setDepositAmount(''); setDepositNote('');
    load();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Usunąć cel "${name}"?`)) return;
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    load();
  }

  const active    = goals.filter(g => g.status === 'active');
  const completed = goals.filter(g => g.status === 'completed');
  const totalTarget  = goals.reduce((s, g) => s + Number(g.targetAmount), 0);
  const totalSaved   = goals.reduce((s, g) => s + Number(g.currentAmount), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Cele oszczędnościowe</h1>
            <p className="text-sm text-muted-foreground">Wyznaczaj i realizuj swoje finansowe cele</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 transition-colors">
          <Plus className="w-4 h-4" /> Nowy cel
        </button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Łączny cel', value: fmt(totalTarget), color: 'text-foreground' },
            { label: 'Zaoszczędzono', value: fmt(totalSaved), color: 'text-green-600' },
            { label: 'Pozostało', value: fmt(totalTarget - totalSaved), color: 'text-amber-600' },
          ].map(c => (
            <div key={c.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
              <p className={cn('text-xl font-bold', c.color)}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Goals list */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <PiggyBank className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Brak celów oszczędnościowych</p>
          <p className="text-sm mt-1">Dodaj pierwszy cel i zacznij systematycznie oszczędzać</p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Aktywne ({active.length})</h2>
              {active.map(goal => {
                const pct = Math.min(100, (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100);
                const days = daysUntil(goal.targetDate);
                const isOpen = expanded === goal.id;
                return (
                  <div key={goal.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                          style={{ background: `${goal.color}20`, border: `2px solid ${goal.color}30` }}>
                          {goal.icon ?? '🎯'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-foreground">{goal.name}</h3>
                              {goal.description && <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => setExpanded(isOpen ? null : goal.id)}
                                className="p-1.5 rounded hover:bg-muted text-muted-foreground text-xs">Historia</button>
                              <button onClick={() => setDepositTarget(goal)} title="Dodaj wpłatę"
                                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-[#01581E]">
                                <TrendingUp className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleStartEdit(goal)} title="Edytuj cel"
                                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(goal.id, goal.name)}
                                className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 space-y-1.5">
                            <div className="flex justify-between text-sm">
                              <span className="font-semibold text-foreground">{fmt(goal.currentAmount)}</span>
                              <span className="text-muted-foreground">z {fmt(goal.targetAmount)}</span>
                            </div>
                            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, background: goal.color }} />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{pct.toFixed(1)}% ukończone</span>
                              {days !== null && (
                                <span className={cn(days < 0 ? 'text-red-500' : days < 30 ? 'text-amber-600' : 'text-muted-foreground')}>
                                  {days < 0 ? `${Math.abs(days)} dni po terminie` : `${days} dni do celu`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Deposit form inline */}
                      {depositTarget?.id === goal.id && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Dodaj wpłatę</p>
                          <div className="flex gap-2">
                            <input type="number" step="0.01" min="0" value={depositAmount}
                              onChange={e => setDepositAmount(e.target.value)} placeholder="Kwota (PLN)"
                              className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                            <input value={depositNote} onChange={e => setDepositNote(e.target.value)} placeholder="Opis (opcjonalnie)"
                              className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                            <button onClick={() => handleDeposit(goal)} disabled={!depositAmount}
                              className="px-3 py-1.5 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 disabled:opacity-50">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDepositTarget(null)} className="px-3 py-1.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Deposits history */}
                    {isOpen && (
                      <div className="border-t border-border px-5 py-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Historia wpłat</p>
                        {goal.deposits.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Brak wpłat.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {goal.deposits.slice(0, 10).map(d => (
                              <div key={d.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                                <div>
                                  <p className="font-medium text-foreground">{d.note ?? 'Wpłata'}</p>
                                  <p className="text-xs text-muted-foreground">{new Date(d.depositAt).toLocaleDateString('pl-PL')}</p>
                                </div>
                                <span className="font-semibold text-green-600">+{fmt(d.amount)}</span>
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

          {completed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ukończone ({completed.length})</h2>
              {completed.map(goal => (
                <div key={goal.id} className="bg-card border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-4 opacity-75">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${goal.color}20` }}>{goal.icon ?? '🎯'}</div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{goal.name}</p>
                    <p className="text-sm text-green-600 font-medium">✓ Cel osiągnięty — {fmt(goal.currentAmount)}</p>
                  </div>
                  <button onClick={() => handleStartEdit(goal)} title="Edytuj cel" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(goal.id, goal.name)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Goal form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">{editTarget ? 'Edytuj cel' : 'Nowy cel oszczędnościowy'}</h2>
              <button onClick={closeForm}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nazwa celu *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="np. Fundusz awaryjny, Wakacje, Nowy samochód..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Ikona celu</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                      className={cn('w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors',
                        form.icon === icon ? 'bg-[#01581E]/20 ring-2 ring-[#01581E]' : 'bg-muted hover:bg-muted/80')}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Kolor</label>
                <div className="flex gap-2 flex-wrap">
                  {GOAL_COLORS.map(color => (
                    <button key={color} type="button" onClick={() => setForm(f => ({ ...f, color }))}
                      className={cn('w-8 h-8 rounded-full transition-all', form.color === color ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-105')}
                      style={{ background: color }} />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Kwota docelowa (PLN) *</label>
                  <input required type="number" step="0.01" min="0" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                    placeholder="10000.00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Już zaoszczędzono (PLN)</label>
                  <input type="number" step="0.01" min="0" value={form.currentAmount} onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))}
                    placeholder="0.00" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Data docelowa (opcjonalnie)</label>
                <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Opis</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Po co oszczędzasz? (opcjonalnie)"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E] resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted">Anuluj</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> {editTarget ? 'Zapisz zmiany' : 'Utwórz cel'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
