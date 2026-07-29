'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Bell, X, Check, Loader2 } from 'lucide-react';

interface WaitlistButtonProps {
  className: string;
  children: React.ReactNode;
}

export function WaitlistButton({ className, children }: WaitlistButtonProps) {
  const t = useTranslations('Waitlist');
  const tCommon = useTranslations('Common');
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function close() {
    setOpen(false);
    setTimeout(() => {
      setDone(false);
      setEmail('');
      setFirstName('');
      setConsent(false);
      setError('');
    }, 200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setError(t('errorConsent'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, consent }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === 'string' ? data.error : t('errorGeneric'));
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>{children}</button>

      {open && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={close}>
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#01581E]/10 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-[#01581E]" />
                </div>
                <h3 className="font-semibold text-foreground">{t('successTitle')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('successBody')}
                </p>
                <button
                  onClick={close}
                  className="mt-2 px-4 py-2 rounded-lg bg-[#01581E] text-white text-sm font-medium hover:bg-[#01581E]/90 transition-colors"
                >
                  {tCommon('close')}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#01581E]" />
                    <h2 className="font-semibold text-foreground">{t('title')}</h2>
                  </div>
                  <button onClick={close}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t('subtitle')}
                  </p>
                  {error && (
                    <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{t('firstNameLabel')}</label>
                    <input
                      required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t('firstNamePlaceholder')}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{t('emailLabel')}</label>
                    <input
                      required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('emailPlaceholder')}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]"
                    />
                  </div>
                  <label className="flex items-start gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 accent-[#01581E]"
                    />
                    <span>
                      {t.rich('consentText', {
                        privacy: (chunks) => (
                          <Link href="/privacy" target="_blank" className="underline hover:text-foreground">
                            {chunks}
                          </Link>
                        ),
                        terms: (chunks) => (
                          <Link href="/terms" target="_blank" className="underline hover:text-foreground">
                            {chunks}
                          </Link>
                        ),
                      })}
                    </span>
                  </label>
                  <button
                    type="submit" disabled={submitting || !consent}
                    className="w-full py-2.5 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('submit')}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
