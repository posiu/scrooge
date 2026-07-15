'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Sidebar } from './Sidebar';
import { Logo } from './Logo';
import { Menu, X, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function MobileNav({ userEmail, isAdmin = false }: { userEmail?: string | null; isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-background shrink-0">
        <Link href="/dashboard">
          <Logo iconClassName="w-7 h-7" textClassName="font-semibold text-sm text-foreground" />
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Sun className="w-4 h-4 text-muted-foreground dark:hidden" />
            <Moon className="w-4 h-4 text-muted-foreground hidden dark:block" />
          </button>

          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="relative h-full">
          <Sidebar userEmail={userEmail} isAdmin={isAdmin} />
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
