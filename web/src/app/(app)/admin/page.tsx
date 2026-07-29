'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Database, Trash2, Loader2, CheckCircle2, AlertTriangle, RefreshCw, Tags, FileStack, Users, ListChecks,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { translateApiError } from '@/lib/apiError';

type State = 'idle' | 'loading' | 'success' | 'error';

export default function AdminPage() {
  const t = useTranslations('Admin');
  const tErr = useTranslations('ApiErrors');
  const [seedState, setSeedState] = useState<State>('idle');
  const [clearState, setClearState] = useState<State>('idle');
  const [msg, setMsg] = useState('');

  const quickLinks = [
    { href: '/admin/users', icon: Users, label: t('usersLabel'), desc: t('usersDesc') },
    { href: '/admin/waitlist', icon: ListChecks, label: t('waitlistLabel'), desc: t('waitlistDesc') },
    { href: '/admin/categories', icon: Tags, label: t('categoriesLabel'), desc: t('categoriesDesc') },
    { href: '/admin/templates', icon: FileStack, label: t('templatesLabel'), desc: t('templatesDesc') },
  ];

  async function handleSeed() {
    if (!confirm(t('seedConfirm'))) return;
    setSeedState('loading');
    setMsg('');
    try {
      const res = await fetch('/api/admin/demo', { method: 'POST' });
      const data = await res.json();
      if (res.ok) { setSeedState('success'); setMsg(t('seedDone')); }
      else { setSeedState('error'); setMsg(translateApiError(data.error, tErr, t('seedError'))); }
    } catch {
      setSeedState('error'); setMsg(t('networkError'));
    }
  }

  async function handleClear() {
    if (!confirm(t('clearConfirm'))) return;
    setClearState('loading');
    setMsg('');
    try {
      const res = await fetch('/api/admin/demo', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) { setClearState('success'); setMsg(t('clearDone')); }
      else { setClearState('error'); setMsg(translateApiError(data.error, tErr, t('seedError'))); }
    } catch {
      setClearState('error'); setMsg(t('networkError'));
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quickLinks.map(item => (
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
            <h2 className="font-medium text-foreground">{t('demoDataTitle')}</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('demoDataDesc')}
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
                <p className="text-sm font-medium text-foreground">{t('seedCardTitle')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('seedCardDesc')}
                </p>
              </div>
              <button
                onClick={handleSeed}
                disabled={seedState === 'loading'}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 transition-colors disabled:opacity-50"
              >
                {seedState === 'loading' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t('loadingSeed')}</>
                ) : seedState === 'success' ? (
                  <><CheckCircle2 className="w-4 h-4" /> {t('seeded')}</>
                ) : (
                  <><Database className="w-4 h-4" /> {t('seedButton')}</>
                )}
              </button>
              {seedState === 'success' && (
                <button onClick={() => { setSeedState('idle'); setMsg(''); }} className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                  <RefreshCw className="w-3 h-3" /> {t('reload')}
                </button>
              )}
            </div>

            {/* Clear */}
            <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">{t('clearCardTitle')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('clearCardDesc')}
                </p>
              </div>
              <button
                onClick={handleClear}
                disabled={clearState === 'loading'}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {clearState === 'loading' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t('clearing')}</>
                ) : clearState === 'success' ? (
                  <><CheckCircle2 className="w-4 h-4" /> {t('cleared')}</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> {t('clearButton')}</>
                )}
              </button>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 dark:text-amber-400">
                <p className="font-medium mb-1">{t('requirementsTitle')}</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-600 dark:text-amber-500">
                  <li>{t.rich('requirement1', { code: (chunks) => <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">{chunks}</code> })}</li>
                  <li>{t.rich('requirement2', { code: (chunks) => <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">{chunks}</code> })}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
