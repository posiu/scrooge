'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Map, Plus, ThumbsUp, MessageSquare, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = 'open' | 'planned' | 'in_progress' | 'done' | 'rejected';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: Status;
  voteCount: number;
  authorName: string | null;
  adminNote: string | null;
  createdAt: string;
  hasVoted?: boolean;
  commentCount?: number;
}

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  open:        { label: 'Otwarte',       color: 'text-blue-600',   bg: 'bg-blue-500/10' },
  planned:     { label: 'Planowane',     color: 'text-amber-600',  bg: 'bg-amber-500/10' },
  in_progress: { label: 'W realizacji',  color: 'text-[#01581E]',  bg: 'bg-[#01581E]/10' },
  done:        { label: 'Zrealizowane',  color: 'text-[#01581E]',  bg: 'bg-[#01581E]/15' },
  rejected:    { label: 'Odrzucone',     color: 'text-muted-foreground', bg: 'bg-muted' },
};

export default function RoadmapPage() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/feature-requests')
      .then((r) => r.json())
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleVote(id: string) {
    const res = await fetch(`/api/feature-requests/${id}/vote`, { method: 'POST' });
    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, voteCount: r.hasVoted ? r.voteCount - 1 : r.voteCount + 1, hasVoted: !r.hasVoted }
            : r,
        ),
      );
    }
  }

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);
  const statusCounts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Header title="Roadmap" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Map className="w-5 h-5 text-[#01581E]" />
            Public Roadmap
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Zgłaszaj pomysły, głosuj i śledź postęp.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#01581E] text-white text-sm font-medium hover:bg-[#01581E]/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Zgłoś pomysł
        </button>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            filter === 'all' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          Wszystkie ({requests.length})
        </button>
        {(Object.entries(STATUS_META) as [Status, typeof STATUS_META[Status]][]).map(([status, meta]) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filter === status ? `${meta.bg} ${meta.color}` : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {meta.label} {statusCounts[status] ? `(${statusCounts[status]})` : ''}
          </button>
        ))}
      </div>

      {/* Feature requests */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Map className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Brak zgłoszeń. Bądź pierwszy!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered
            .sort((a, b) => b.voteCount - a.voteCount)
            .map((req) => {
              const meta = STATUS_META[req.status];
              const isExpanded = expandedId === req.id;
              return (
                <div key={req.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-4 p-4">
                    {/* Vote */}
                    <button
                      onClick={() => handleVote(req.id)}
                      className={cn(
                        'flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-lg border transition-colors shrink-0',
                        req.hasVoted
                          ? 'border-[#01581E] bg-[#01581E]/10 text-[#01581E]'
                          : 'border-border text-muted-foreground hover:border-[#01581E]/50 hover:text-[#01581E]',
                      )}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{req.voteCount}</span>
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : req.id)}
                          className="text-sm font-medium text-foreground text-left hover:text-[#01581E] transition-colors"
                        >
                          {req.title}
                        </button>
                        <span className={cn('shrink-0 text-xs px-2 py-0.5 rounded-full font-medium', meta.bg, meta.color)}>
                          {meta.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{req.authorName ?? 'Anonim'}</span>
                        <span>·</span>
                        <span>{new Date(req.createdAt).toLocaleDateString('pl-PL')}</span>
                        {(req.commentCount ?? 0) > 0 && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> {req.commentCount}
                            </span>
                          </>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm text-muted-foreground leading-relaxed">{req.description}</p>
                          {req.adminNote && (
                            <div className="bg-[#01581E]/5 border border-[#01581E]/20 rounded-lg p-3">
                              <p className="text-xs font-medium text-[#01581E] mb-1">Odpowiedź admina:</p>
                              <p className="text-xs text-foreground">{req.adminNote}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Submit form modal */}
      {showForm && (
        <SubmitFeatureForm
          onClose={() => setShowForm(false)}
          onSubmit={(req) => { setRequests((prev) => [req, ...prev]); setShowForm(false); }}
        />
      )}
    </div>
  );
}

function SubmitFeatureForm({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (req: FeatureRequest) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, authorName, authorEmail }),
      });
      if (!res.ok) throw new Error('Błąd zgłoszenia');
      const data = await res.json();
      onSubmit(data);
    } catch {
      setError('Nie udało się wysłać zgłoszenia. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="p-5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Zgłoś nowy pomysł</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Tytuł *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Krótki, konkretny opis funkcji"
              required
              maxLength={100}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Opis *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opisz szczegółowo czego potrzebujesz i dlaczego to ważne..."
              required
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#01581E]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Imię</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Opcjonalnie"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Email</label>
              <input
                type="email"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder="Do powiadomień"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]"
              />
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              Anuluj
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-[#01581E] text-white text-sm font-medium hover:bg-[#01581E]/90 transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Wyślij zgłoszenie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
