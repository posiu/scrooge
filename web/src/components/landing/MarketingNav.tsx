import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';

export function MarketingNav({ variant = 'home' }: { variant?: 'home' | 'pricing' }) {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            {variant === 'home' ? (
              <>
                <Link
                  href="/#funkcje"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
                >
                  Funkcje
                </Link>
                <Link
                  href="/pricing"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
                >
                  Cennik
                </Link>
              </>
            ) : (
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Strona główna
              </Link>
            )}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#01581E] text-white text-sm font-medium hover:bg-[#01581E]/90 transition-colors"
            >
              Zaloguj się
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
