'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, ArrowLeftRight, CalendarDays, BarChart3, TrendingUp,
  Landmark, HandCoins, Tags, FileStack, Map, Settings, LogOut,
  ChevronRight, Brain, Receipt, Gavel, ShieldCheck,
  Download, Target, LineChart, Users, ListChecks,
} from 'lucide-react';
import { useState } from 'react';
import { Logo } from './Logo';

interface NavItem {
  key: string;
  href?: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'transactions', href: '/transactions', icon: ArrowLeftRight },
  {
    key: 'budget',
    icon: CalendarDays,
    children: [
      { key: 'budgetMonthly', href: '/budget/monthly', icon: CalendarDays },
      { key: 'budgetYearly', href: '/budget/yearly', icon: FileStack },
    ],
  },
  { key: 'accounts', href: '/accounts', icon: Landmark },
  { key: 'investments', href: '/investments', icon: LineChart },
];

const liabilityItems: NavItem[] = [
  { key: 'liabilities', href: '/liabilities', icon: HandCoins },
  { key: 'taxes', href: '/taxes', icon: Receipt },
  { key: 'enforcement', href: '/enforcement', icon: Gavel },
];

const analyticsItems: NavItem[] = [
  { key: 'reports', href: '/reports', icon: BarChart3 },
  { key: 'trends', href: '/trends', icon: TrendingUp },
];

const toolItems: NavItem[] = [
  { key: 'aiAssistant', href: '/ai-chat', icon: Brain },
  { key: 'import', href: '/import', icon: Download },
  { key: 'goals', href: '/goals', icon: Target },
  { key: 'roadmap', href: '/roadmap', icon: Map },
];

const adminItems: NavItem[] = [
  { key: 'adminUsers', href: '/admin/users', icon: Users },
  { key: 'adminWaitlist', href: '/admin/waitlist', icon: ListChecks },
  { key: 'adminCategories', href: '/admin/categories', icon: Tags },
  { key: 'adminTemplates', href: '/admin/templates', icon: FileStack },
  { key: 'adminPanel', href: '/admin', icon: ShieldCheck },
  { key: 'settings', href: '/settings', icon: Settings },
];

export function Sidebar({ userEmail, isAdmin = false }: { userEmail?: string | null; isAdmin?: boolean }) {
  const t = useTranslations('Sidebar');
  const tCommon = useTranslations('Common');
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [expandedItems, setExpandedItems] = useState<string[]>(['budget']);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  function toggleExpand(key: string) {
    setExpandedItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function isActive(href: string) {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(href + '/');
  }

  function renderItem(item: NavItem, depth = 0) {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.key);
    const active = item.href ? isActive(item.href) : false;
    const label = t(item.key);

    if (hasChildren) {
      return (
        <div key={item.key}>
          <button
            onClick={() => toggleExpand(item.key)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm',
              'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
              'transition-colors group',
              depth > 0 && 'pl-9 text-xs',
            )}
          >
            <item.icon className="w-4 h-4 shrink-0 opacity-70 group-hover:opacity-100" />
            <span className="flex-1 text-left">{label}</span>
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
        <span>{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />}
      </Link>
    );
  }

  return (
    <aside className="sidebar-width h-full bg-sidebar flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <Logo variant="inverted" showWordmark={false} iconClassName="w-8 h-8 shrink-0 group-hover:opacity-90 transition-opacity" />
          <div>
            <p className="text-sidebar-foreground font-semibold text-sm leading-none">Scrooge</p>
            <p className="text-sidebar-foreground/50 text-xs mt-0.5">{t('tagline')}</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => renderItem(item))}

        {/* Liabilities / Debt */}
        <div className="pt-4 pb-1">
          <p className="px-3 text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider">{t('sectionLiabilities')}</p>
        </div>
        {liabilityItems.map((item) => renderItem(item))}

        {/* Analytics */}
        <div className="pt-4 pb-1">
          <p className="px-3 text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider">{t('sectionAnalytics')}</p>
        </div>
        {analyticsItems.map((item) => renderItem(item))}

        {/* Tools */}
        <div className="pt-4 pb-1">
          <p className="px-3 text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider">{t('sectionTools')}</p>
        </div>
        {toolItems.map((item) => renderItem(item))}

        {/* Admin — only visible for admins */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-1">
              <p className="px-3 text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider">{t('sectionAdmin')}</p>
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
            <p className="text-sidebar-foreground text-xs font-medium truncate">{userEmail ?? t('defaultUser')}</p>
          </div>
          <button
            onClick={handleSignOut}
            title={tCommon('signOut')}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
