'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];

interface Props {
  currentMonth: string; // YYYY-MM
  mode: 'month' | 'year';
}

export function DashboardMonthNav({ currentMonth, mode }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [year, month] = currentMonth.split('-').map(Number);

  function navigate(newMonth: string, newMode = mode) {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('month', newMonth);
    params.set('mode', newMode);
    router.push(`${pathname}?${params.toString()}`);
  }

  function prevMonth() {
    const d = new Date(year, month - 2, 1);
    navigate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  function nextMonth() {
    const d = new Date(year, month, 1);
    navigate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  function goToday() {
    const now = new Date();
    navigate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }

  const isCurrentMonth = (() => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() + 1 === month;
  })();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Mode toggle */}
      <div className="flex items-center bg-muted rounded-lg p-1">
        <button
          onClick={() => navigate(currentMonth, 'month')}
          className={cn('px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            mode === 'month' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
        >Miesiąc</button>
        <button
          onClick={() => navigate(currentMonth, 'year')}
          className={cn('px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            mode === 'year' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
        >Rok</button>
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-1 bg-card border border-border rounded-lg">
        <button onClick={prevMonth}
          className="p-1.5 hover:bg-muted rounded-l-lg text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 py-1.5 text-sm font-medium text-foreground min-w-[110px] text-center">
          {mode === 'month' ? `${MONTHS[month - 1]} ${year}` : `Rok ${year}`}
        </span>
        <button onClick={nextMonth}
          className="p-1.5 hover:bg-muted rounded-r-lg text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {!isCurrentMonth && (
        <button onClick={goToday}
          className="flex items-center gap-1 text-xs px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Calendar className="w-3 h-3" /> Bieżący miesiąc
        </button>
      )}
    </div>
  );
}
