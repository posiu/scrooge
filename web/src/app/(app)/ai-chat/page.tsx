'use client';

import { useEffect, useRef, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Brain, Send, Loader2, Settings, Plus, Trash2, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

interface AiConfig {
  provider: string;
  modelId: string;
  apiKey: string;
  endpoint?: string;
}

const STORAGE_KEY = 'scrooge_ai_sessions';
const CONFIG_KEY = 'scrooge_ai_config';

const PROVIDERS = [
  { id: 'openai',     label: 'OpenAI',         models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { id: 'anthropic',  label: 'Anthropic',      models: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'] },
  { id: 'google',     label: 'Google Gemini',  models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
  { id: 'custom',     label: 'Custom (OpenAI-compatible)', models: [] },
];

function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const loaded: Session[] = raw ? JSON.parse(raw) : [];
    setSessions(loaded);
    if (loaded.length > 0) setActiveId(loaded[0].id);
  }, []);

  function save(updated: Session[]) {
    setSessions(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function newSession(): string {
    const s: Session = { id: crypto.randomUUID(), title: 'Nowa rozmowa', messages: [], createdAt: Date.now() };
    const updated = [s, ...sessions];
    save(updated);
    setActiveId(s.id);
    return s.id;
  }

  function deleteSession(id: string) {
    const updated = sessions.filter((s) => s.id !== id);
    save(updated);
    setActiveId(updated[0]?.id ?? null);
  }

  function appendMessage(sessionId: string, msg: Message) {
    const updated = sessions.map((s) => {
      if (s.id !== sessionId) return s;
      const messages = [...s.messages, msg];
      const title = s.messages.length === 0 && msg.role === 'user'
        ? msg.content.slice(0, 40) + (msg.content.length > 40 ? '…' : '')
        : s.title;
      return { ...s, messages, title };
    });
    save(updated);
  }

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  return { sessions, activeSession, activeId, setActiveId, newSession, deleteSession, appendMessage };
}

function useConfig() {
  const [config, setConfig] = useState<AiConfig | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) setConfig(JSON.parse(raw));
  }, []);

  function saveConfig(c: AiConfig) {
    setConfig(c);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
    setShowConfig(false);
  }

  return { config, showConfig, setShowConfig, saveConfig };
}

export default function AiChatPage() {
  const { sessions, activeSession, activeId, setActiveId, newSession, deleteSession, appendMessage } = useSessions();
  const { config, showConfig, setShowConfig, saveConfig } = useConfig();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    if (!config) { setShowConfig(true); return; }

    const currentSessionId = activeId ?? newSession();
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim(), timestamp: Date.now() };
    appendMessage(currentSessionId, userMsg);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const messages = [...(activeSession?.messages ?? []), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, config }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Błąd serwera');
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content,
        timestamp: Date.now(),
      };
      appendMessage(currentSessionId, assistantMsg);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Nieznany błąd';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sessions sidebar */}
      <div className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-muted/20 overflow-hidden">
        <div className="p-3 border-b border-border">
          <button
            onClick={() => newSession()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#01581E] text-white text-xs font-medium hover:bg-[#01581E]/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nowa rozmowa
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={cn(
                'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                s.id === activeId ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-muted',
              )}
              onClick={() => setActiveId(s.id)}
            >
              <span className="flex-1 text-xs truncate">{s.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center pt-4">Brak rozmów</p>
          )}
        </div>
        <div className="p-3 border-t border-border">
          <button
            onClick={() => setShowConfig(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Settings className="w-3.5 h-3.5" /> Konfiguracja LLM
          </button>
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-background flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#01581E]" />
            <span className="text-sm font-medium text-foreground">
              {activeSession?.title ?? 'AI Asystent Finansowy'}
            </span>
            {config && (
              <span className="text-xs text-muted-foreground">· {config.provider}/{config.modelId}</span>
            )}
          </div>
          <button
            onClick={() => setShowConfig(true)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!config && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#01581E]/10 flex items-center justify-center">
                <Brain className="w-7 h-7 text-[#01581E]" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Skonfiguruj model AI</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Podepnij dowolny model LLM (OpenAI, Anthropic, Google lub własny endpoint).
                  Klucz API jest przechowywany lokalnie na Twoim urządzeniu.
                </p>
              </div>
              <button
                onClick={() => setShowConfig(true)}
                className="px-4 py-2 rounded-lg bg-[#01581E] text-white text-sm font-medium hover:bg-[#01581E]/90 transition-colors"
              >
                Skonfiguruj teraz
              </button>
            </div>
          )}

          {config && (!activeSession || activeSession.messages.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <Bot className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Zadaj pytanie dotyczące Twoich finansów.
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                {[
                  'Jakie mam największe wydatki w tym miesiącu?',
                  'Podsumuj mój budżet za ostatnie 3 miesiące.',
                  'Gdzie mogę zaoszczędzić?',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-[#01581E]/50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSession?.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-[#01581E]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-[#01581E]" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-[#01581E] text-white rounded-tr-sm'
                    : 'bg-muted text-foreground rounded-tl-sm',
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={cn('text-xs mt-1', msg.role === 'user' ? 'text-white/60' : 'text-muted-foreground')}>
                  {new Date(msg.timestamp).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#01581E]/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#01581E]" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Myślę...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-background">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={config ? 'Zadaj pytanie o swoje finanse...' : 'Najpierw skonfiguruj model AI'}
              disabled={!config || loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#01581E] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!config || !input.trim() || loading}
              className="px-3 py-2.5 rounded-xl bg-[#01581E] text-white hover:bg-[#01581E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Rozmowy są przechowywane lokalnie na Twoim urządzeniu.
          </p>
        </div>
      </div>

      {/* Config modal */}
      {showConfig && (
        <ConfigModal config={config} onSave={saveConfig} onClose={() => setShowConfig(false)} />
      )}
    </div>
  );
}

function ConfigModal({ config, onSave, onClose }: {
  config: AiConfig | null;
  onSave: (c: AiConfig) => void;
  onClose: () => void;
}) {
  const [provider, setProvider] = useState(config?.provider ?? 'openai');
  const [modelId, setModelId] = useState(config?.modelId ?? 'gpt-4o');
  const [apiKey, setApiKey] = useState(config?.apiKey ?? '');
  const [endpoint, setEndpoint] = useState(config?.endpoint ?? '');
  const [customModel, setCustomModel] = useState('');

  const providerMeta = PROVIDERS.find((p) => p.id === provider);
  const models = providerMeta?.models ?? [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ provider, modelId: provider === 'custom' ? customModel : modelId, apiKey, endpoint: provider === 'custom' ? endpoint : undefined });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#01581E]" /> Konfiguracja modelu AI
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Klucz API jest przechowywany tylko lokalnie (localStorage) — nigdy nie trafia na serwer w postaci jawnej.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Provider</label>
            <select
              value={provider}
              onChange={(e) => { setProvider(e.target.value); setModelId(PROVIDERS.find((p) => p.id === e.target.value)?.models[0] ?? ''); }}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#01581E]"
            >
              {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>

          {provider !== 'custom' ? (
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Model</label>
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#01581E]"
              >
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Endpoint URL</label>
                <input
                  type="url"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#01581E]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Nazwa modelu</label>
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="np. llama-3.1-70b"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#01581E]"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Klucz API</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#01581E]"
            />
            <p className="text-xs text-muted-foreground mt-1">Przechowywany tylko lokalnie na tym urządzeniu.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-[#01581E] text-white text-sm font-medium hover:bg-[#01581E]/90 transition-colors"
            >
              Zapisz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
