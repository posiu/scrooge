'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Languages } from 'lucide-react';
import { LOCALE_COOKIE, type Locale } from '@/i18n/config';

const OTHER_LOCALE: Record<Locale, Locale> = { pl: 'en', en: 'pl' };
const LABEL: Record<Locale, string> = { pl: 'PL', en: 'EN' };

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations('Common');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const target = OTHER_LOCALE[locale];

  function handleClick() {
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; SameSite=Lax`;
    // Best-effort — silently no-ops for anonymous visitors (401).
    fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: target }),
    }).catch(() => {});
    startTransition(() => router.refresh());
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={t('switchLanguage')}
      className="flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
    >
      <Languages className="w-4 h-4" />
      <span className="text-xs font-medium">{LABEL[target]}</span>
    </button>
  );
}
