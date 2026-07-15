'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Pencil, Trash2, Loader2, X, Check, Ban, ShieldOff, Clock, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Plan = 'free' | 'basic' | 'pro';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  plan: Plan;
  currency: string;
  isAdmin: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  bannedUntil: string | null;
}

const PLAN_LABELS: Record<Plan, string> = { free: 'Free', basic: 'Basic', pro: 'Pro' };
const PLAN_COLORS: Record<Plan, string> = {
  free: 'bg-muted text-muted-foreground',
  basic: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  pro: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};
const CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP'];
const BLOCK_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 365 * 2; // > 2 years out = treat as permanent block

function getStatus(bannedUntil: string | null) {
  if (!bannedUntil) return { label: 'Aktywny', color: 'bg-[#01581E]/10 text-[#01581E]' };
  const until = new Date(bannedUntil).getTime();
  if (until <= Date.now()) return { label: 'Aktywny', color: 'bg-[#01581E]/10 text-[#01581E]' };
  if (until - Date.now() > BLOCK_THRESHOLD_MS) return { label: 'Zablokowany', color: 'bg-destructive/10 text-destructive' };
  return { label: `Zawieszony do ${new Date(bannedUntil).toLocaleDateString('pl-PL')}`, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' };
}

const emptyForm = { email: '', firstName: '', lastName: '', currency: 'PLN', plan: 'free' as Plan };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);
  const [suspendDays, setSuspendDays] = useState('14');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setForm(emptyForm); setEditTarget(null); setError(''); setShowForm(true); }
  function openEdit(u: AdminUser) {
    setForm({ email: u.email, firstName: u.firstName, lastName: u.lastName ?? '', currency: u.currency, plan: u.plan });
    setEditTarget(u); setError(''); setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = editTarget
        ? await fetch(`/api/admin/users/${editTarget.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName || null, currency: form.currency, plan: form.plan }),
          })
        : await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: form.email, firstName: form.firstName, lastName: form.lastName || null, currency: form.currency, plan: form.plan }),
          });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === 'string' ? data.error : 'Nie udało się zapisać.');
        return;
      }
      setShowForm(false);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(u: AdminUser) {
    if (!confirm(`Usunąć konto "${u.email}"? Użytkownik straci dostęp do aplikacji. Jego dane finansowe NIE zostaną usunięte.`)) return;
    await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
    load();
  }

  async function handleBlock(u: AdminUser) {
    if (!confirm(`Zablokować konto "${u.email}"? Użytkownik nie będzie mógł się zalogować.`)) return;
    await fetch(`/api/admin/users/${u.id}/access`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'block' }),
    });
    load();
  }

  async function handleUnblock(u: AdminUser) {
    await fetch(`/api/admin/users/${u.id}/access`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'unblock' }),
    });
    load();
  }

  async function handleSuspend() {
    if (!suspendTarget) return;
    await fetch(`/api/admin/users/${suspendTarget.id}/access`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'suspend', days: Number(suspendDays) }),
    });
    setSuspendTarget(null);
    load();
  }

  const activeCount = users.filter((u) => getStatus(u.bannedUntil).label === 'Aktywny').length;
  const suspendedCount = users.filter((u) => getStatus(u.bannedUntil).label.startsWith('Zawieszony')).length;
  const blockedCount = users.filter((u) => getStatus(u.bannedUntil).label === 'Zablokowany').length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Użytkownicy</h1>
            <p className="text-sm text-muted-foreground">Zarządzaj kontami, planami i dostępem do aplikacji</p>
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 transition-colors">
          <Plus className="w-4 h-4" /> Dodaj użytkownika
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Wszyscy', value: users.length, color: 'text-foreground' },
          { label: 'Aktywni', value: activeCount, color: 'text-[#01581E]' },
          { label: 'Zawieszeni', value: suspendedCount, color: 'text-amber-600' },
          { label: 'Zablokowani', value: blockedCount, color: 'text-destructive' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : users.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Brak użytkowników</p>
          <p className="text-xs text-muted-foreground">Dodaj pierwsze konto.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {users.map((u) => {
              const status = getStatus(u.bannedUntil);
              const isBlocked = status.label !== 'Aktywny';
              const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ');
              return (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors flex-wrap sm:flex-nowrap">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-medium text-muted-foreground">
                    {(fullName || u.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{fullName || '—'}</p>
                      {u.isAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#01581E]/10 text-[#01581E] font-medium shrink-0">Admin</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <span className={cn('text-xs px-2 py-1 rounded-full font-medium shrink-0', PLAN_COLORS[u.plan])}>{PLAN_LABELS[u.plan]}</span>
                  <span className="text-xs text-muted-foreground shrink-0 w-10">{u.currency}</span>
                  <span className={cn('text-xs px-2 py-1 rounded-full font-medium shrink-0', status.color)}>{status.label}</span>
                  <div className="flex items-center gap-1 shrink-0 ml-auto">
                    <button onClick={() => openEdit(u)} title="Edytuj" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {isBlocked ? (
                      <button onClick={() => handleUnblock(u)} title="Odblokuj" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-[#01581E] transition-colors">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <>
                        <button onClick={() => { setSuspendTarget(u); setSuspendDays('14'); }} title="Zawieś czasowo" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-amber-600 transition-colors">
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleBlock(u)} title="Zablokuj" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button onClick={() => handleDelete(u)} title="Usuń" className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-muted-foreground hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">{editTarget ? 'Edytuj użytkownika' : 'Nowy użytkownik'}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Adres email *</label>
                <input
                  required type="email" disabled={!!editTarget}
                  value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="jan@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E] disabled:opacity-60"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Imię *</label>
                  <input required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="Jan"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Nazwisko</label>
                  <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Kowalski"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Waluta domyślna</label>
                  <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Plan</label>
                  <select value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as Plan }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
              </div>
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

      {/* Suspend modal */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">Zawieś konto</h2>
              <button onClick={() => setSuspendTarget(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Konto <span className="text-foreground font-medium">{suspendTarget.email}</span> zostanie tymczasowo zawieszone — użytkownik nie będzie mógł się zalogować przez podaną liczbę dni.
              </p>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Liczba dni zawieszenia</label>
                <input type="number" min={1} step={1} value={suspendDays} onChange={(e) => setSuspendDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSuspendTarget(null)} className="flex-1 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted">Anuluj</button>
                <button type="button" onClick={handleSuspend} disabled={!suspendDays || Number(suspendDays) < 1}
                  className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <ShieldOff className="w-4 h-4" /> Zawieś
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
