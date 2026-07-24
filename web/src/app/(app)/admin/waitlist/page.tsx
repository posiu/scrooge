'use client';

import { useState, useEffect, useCallback } from 'react';
import { ListChecks, Loader2, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface WaitlistEntry {
  id: string;
  email: string;
  firstName: string;
  createdAt: string;
}

export default function AdminWaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/waitlist');
    const data = await res.json();
    setEntries(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(entry: WaitlistEntry) {
    if (!confirm(`Usunąć wpis "${entry.email}" z waitlisty?`)) return;
    await fetch(`/api/admin/waitlist/${entry.id}`, { method: 'DELETE' });
    load();
  }

  async function copyEmails() {
    await navigator.clipboard.writeText(entries.map((e) => e.email).join(', '));
    setCopied(true);
    toast.success('Adresy email skopiowane');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
            <ListChecks className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Waitlist</h1>
            <p className="text-sm text-muted-foreground">Osoby zapisane na powiadomienie o publicznym starcie</p>
          </div>
        </div>
        {entries.length > 0 && (
          <button
            onClick={copyEmails}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-[#01581E]" /> : <Copy className="w-4 h-4" />}
            Kopiuj wszystkie emaile
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs text-muted-foreground mb-1">Łącznie zapisanych</p>
        <p className="text-xl font-bold text-foreground">{entries.length}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : entries.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <ListChecks className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Waitlista jest pusta</p>
          <p className="text-xs text-muted-foreground">Zapisy pojawią się tutaj, gdy ktoś kliknie „Powiadom mnie" na stronie głównej.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-medium text-muted-foreground">
                  {entry.firstName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{entry.firstName}</p>
                  <p className="text-xs text-muted-foreground truncate">{entry.email}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {new Date(entry.createdAt).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
                <button
                  onClick={() => handleDelete(entry)} title="Usuń"
                  className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-muted-foreground hover:text-red-600 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
