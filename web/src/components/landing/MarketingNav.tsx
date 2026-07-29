import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Bell, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { WaitlistButton } from './WaitlistButton';

export async function MarketingNav({ variant = 'home' }: { variant?: 'home' | 'pricing' }) {
  const t = await getTranslations('Nav');
  const tCommon = await getTranslations('Common');
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {variant === 'home' ? (
              <>
                <Link
                  href="/#funkcje"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
                >
                  {t('features')}
                </Link>
                <Link
                  href="/pricing"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
                >
                  {t('pricing')}
                </Link>
              </>
            ) : (
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t('home')}
              </Link>
            )}
            <LanguageSwitcher />
            <WaitlistButton className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#01581E] text-white text-sm font-medium hover:bg-[#01581E]/90 transition-colors">
              <Bell className="w-4 h-4" />
              {tCommon('notifyMe')}
            </WaitlistButton>
          </div>
        </div>
      </div>
    </nav>
  );
}
