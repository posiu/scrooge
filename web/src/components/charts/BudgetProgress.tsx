'use client';

import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Props {
  planned: number;
  actual:  number;
  label?:  string;
}

export function BudgetProgress({ planned, actual, label }: Props) {
  const pct = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0;
  const over = actual > planned;

  return (
    <div>
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-foreground">{label}</span>
          <div className="flex items-center gap-2 text-xs">
            <span className={over ? 'text-destructive font-medium' : 'text-foreground'}>
              {formatCurrency(actual)}
            </span>
            <span className="text-muted-foreground">/ {formatCurrency(planned)}</span>
          </div>
        </div>
      )}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            over ? 'bg-destructive' : pct > 80 ? 'bg-amber-500' : 'bg-[#01581E]',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
