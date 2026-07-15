'use client';

import { useState } from 'react';
import {
  Database, Trash2, Loader2, CheckCircle2, AlertTriangle, RefreshCw, Tags, FileStack, Users,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type State = 'idle' | 'loading' | 'success' | 'error';

export default function AdminPage() {
  const [seedState, setSeedState] = useState<State>('idle');
  const [clearState, setClearState] = useState<State>('idle');
  const [msg, setMsg] = useState('');

  async function handleSeed() {
    if (!confirm('Załadować dane demonstracyjne? Zostaną dodane przykładowe konta, transakcje, podatki i zajęcia egzekucyjne.')) return;
    setSeedState('loading');
    setMsg('');
    try {
      const res = await fetch('/api/admin/demo', { method: 'POST' });
      const data = await res.json();
      if (res.ok) { setSeedState('success'); setMsg(data.message ?? 'Gotowe!'); }
      else { setSeedState('error'); setMsg(data.error ?? 'Błąd'); }
    } catch {
      setSeedState('error'); setMsg('Błąd sieci');
    }
  }

  async function handleClear() {
    if (!confirm('UWAGA: Usunięcie danych demo usunie też wszystkie transakcje i konta powiązane z demo. Kontynuować?')) return;
    setClearState('loading');
    setMsg('');
    try {
      const res = await fetch('/api/admin/demo', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) { setClearState('success'); setMsg(data.message ?? 'Usunięto.'); }
      else { setClearState('error'); setMsg(data.error ?? 'Błąd'); }
    } catch {
      setClearState('error'); setMsg('Błąd sieci');
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Panel administracyjny</h1>
        <p className="text-sm text-muted-foreground mt-1">Narzędzia dostępne wyłącznie dla administratorów.</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: '/admin/users', icon: Users, label: 'Użytkownicy', desc: 'Zarządzaj kontami, planami i dostępem' },
          { href: '/admin/categories', icon: Tags, label: 'Zarządzaj kategoriami', desc: 'Dodaj, edytuj i usuń kategorie transakcji' },
          { href: '/admin/templates', icon: FileStack, label: 'Szablony budżetów', desc: 'Konfiguruj domyślne szablony budżetów' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 hover:bg-muted/40 transition-colors">
            <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center shrink-0">
              <item.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Demo data section */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-medium text-foreground">Dane demonstracyjne</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Załaduj realistyczne przykładowe dane, aby przetestować wszystkie funkcje aplikacji.
            Obejmuje: 3 konta bankowe, ~20 transakcji z ostatnich 3 miesięcy, 4 podatki (w różnych statusach), 2 zajęcia egzekucyjne z historią spłat.
          </p>
        </div>

        <div className="p-5 space-y-4">
          {msg && (
            <div className={cn(
              'flex items-center gap-2 text-sm p-3 rounded-lg',
              (seedState === 'success' || clearState === 'success') && 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
              (seedState === 'error' || clearState === 'error') && 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
            )}>
              {(seedState === 'success' || clearState === 'success') && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {(seedState === 'error' || clearState === 'error') && <AlertTriangle className="w-4 h-4 shrink-0" />}
              {msg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Seed */}
            <div className="border border-border rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">Załaduj dane demo</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tworzy przykładowe rekordy we wszystkich sekcjach aplikacji. Bezpieczna operacja — dane są oznaczone flagą demo i nie nadpiszą Twoich danych.
                </p>
              </div>
              <button
                onClick={handleSeed}
                disabled={seedState === 'loading'}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 transition-colors disabled:opacity-50"
              >
                {seedState === 'loading' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Ładuję...</>
                ) : seedState === 'success' ? (
                  <><CheckCircle2 className="w-4 h-4" /> Załadowano</>
                ) : (
                  <><Database className="w-4 h-4" /> Załaduj dane demo</>
                )}
              </button>
              {seedState === 'success' && (
                <button onClick={() => { setSeedState('idle'); setMsg(''); }} className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Załaduj ponownie
                </button>
              )}
            </div>

            {/* Clear */}
            <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Usuń dane demo</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Usuwa wszystkie rekordy oznaczone jako demo: transakcje, konta demo, podatki demo, zajęcia demo. Twoje własne dane pozostają nienaruszone.
                </p>
              </div>
              <button
                onClick={handleClear}
                disabled={clearState === 'loading'}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {clearState === 'loading' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Usuwam...</>
                ) : clearState === 'success' ? (
                  <><CheckCircle2 className="w-4 h-4" /> Usunięto</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Usuń dane demo</>
                )}
              </button>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 dark:text-amber-400">
                <p className="font-medium mb-1">Wymagania</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-600 dark:text-amber-500">
                  <li>Funkcja dostępna wyłącznie dla kont z flagą <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">is_admin = true</code></li>
                  <li>Ustaw flagę w tabeli <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">user_settings</code> ręcznie w Supabase lub przez SQL</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
