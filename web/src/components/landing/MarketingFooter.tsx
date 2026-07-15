import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';

export function MarketingFooter() {
  return (
    <footer className="border-t border-border px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo iconClassName="w-6 h-6" textClassName="text-sm font-semibold text-foreground" />
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/#funkcje" className="hover:text-foreground transition-colors">
            Funkcje
          </Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            Cennik
          </Link>
          <span>Domowy Controlling · {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
