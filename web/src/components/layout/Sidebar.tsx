'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, ArrowLeftRight, CalendarDays, BarChart3, TrendingUp,
  Landmark, HandCoins, Tags, FileStack, Map, Settings, LogOut,
  ChevronRight, TrendingDown, Brain, Receipt, Gavel, ShieldCheck,
  Download, Target, LineChart,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Transakcje', href: '/transactions', icon: ArrowLeftRight },
  {
    label: 'Budżet',
    icon: CalendarDays,
    children: [
      { label: 'Miesięczny', href: '/budget/monthly', icon: CalendarDays },
      { label: 'Roczny', href: '/budget/yearly', icon: FileStack },
    ],
  },
  { label: 'Konta', href: '/accounts', icon: Landmark },
  { label: 'Inwestycje', href: '/investments', icon: LineChart },
];

const liabilityItems: NavItem[] = [
  { label: 'Zobowiązania', href: '/liabilities', icon: HandCoins },
  { label: 'Podatki', href: '/taxes', icon: Receipt },
  { label: 'Zajęcia egzekucyjne', href: '/enforcement', icon: Gavel },
];

const analyticsItems: NavItem[] = [
  { label: 'Wykresy', href: '/reports', icon: BarChart3 },
  { label: 'Trendy', href: '/trends', icon: TrendingUp },
];

const toolItems: NavItem[] = [
  { label: 'AI Asystent', href: '/ai-chat', icon: Brain },
  { label: 'Import danych', href: '/import', icon: Download },
  { label: 'Cele oszczędnościowe', href: '/goals', icon: Target },
  { label: 'Roadmap', href: '/roadmap', icon: Map },
];

const adminItems: NavItem[] = [
  { label: 'Kategorie', href: '/admin/categories', icon: Tags },
  { label: 'Szablony budżetów', href: '/admin/templates', icon: FileStack },
  { label: 'Panel admina', href: '/admin', icon: ShieldCheck },
  { label: 'Ustawienia', href: '/settings', icon: Settings },
];

export function Sidebar({ userEmail, isAdmin = false }: { userEmail?: string | null; isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Budżet']);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  function toggleExpand(label: string) {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  }

  function isActive(href: string) {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(href + '/');
  }

  function renderItem(item: NavItem, depth = 0) {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label);
    const active = item.href ? isActive(item.href) : false;

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleExpand(item.label)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm',
              'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
              'transition-colors group',
              depth > 0 && 'pl-9 text-xs',
            )}
          >
            <item.icon className="w-4 h-4 shrink-0 opacity-70 group-hover:opacity-100" />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronRight className={cn('w-3 h-3 opacity-50 transition-transform duration-200', isExpanded && 'rotate-90')} />
          </button>
          {isExpanded && (
            <div className="mt-0.5 space-y-0.5">
              {item.children!.map((child) => renderItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    if (!item.href) return null;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm',
          'transition-colors group',
          depth > 0 ? 'pl-9 text-xs' : '',
          active
            ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60',
        )}
      >
        <item.icon className={cn('w-4 h-4 shrink-0 transition-opacity', active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100')} />
        <span>{item.label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />}
      </Link>
    );
  }

  return (
    <aside className="sidebar-width h-full bg-sidebar flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-sidebar-accent rounded-lg flex items-center justify-center group-hover:bg-sidebar-accent/80 transition-colors">
            <TrendingDown className="w-5 h-5 text-sidebar-foreground rotate-180" />
          </div>
          <div>
            <p className="text-sidebar-foreground font-semibold text-sm leading-none">Scrooge</p>
            <p className="text-sidebar-foreground/50 text-xs mt-0.5">Domowy Controlling</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => renderItem(item))}

        {/* Pasywa / Zadłużenie */}
        <div className="pt-4 pb-1">
          <p className="px-3 text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider">Pasywa / Zadłużenie</p>
        </div>
        {liabilityItems.map((item) => renderItem(item))}

        {/* Analytics */}
        <div className="pt-4 pb-1">
          <p className="px-3 text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider">Analityka</p>
        </div>
        {analyticsItems.map((item) => renderItem(item))}

        {/* Tools */}
        <div className="pt-4 pb-1">
          <p className="px-3 text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider">Narzędzia</p>
        </div>
        {toolItems.map((item) => renderItem(item))}

        {/* Admin — only visible for admins */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-1">
              <p className="px-3 text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider">Zarządzanie</p>
            </div>
            {adminItems.map((item) => renderItem(item))}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent/60 transition-colors group cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
            <span className="text-sidebar-foreground text-xs font-medium">
              {userEmail?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-foreground text-xs font-medium truncate">{userEmail ?? 'Użytkownik'}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Wyloguj się"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
