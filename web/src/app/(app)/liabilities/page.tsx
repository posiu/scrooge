export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { liabilities } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { AddLiabilityButton } from '@/components/forms/AddLiabilityButton';
import { HandCoins, CreditCard, RefreshCw, ShoppingBag, MoreHorizontal } from 'lucide-react';

const liabilityTypeLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  loan:         { label: 'Kredyt',       icon: HandCoins,    color: 'text-red-600 dark:text-red-400' },
  credit:       { label: 'Karta',        icon: CreditCard,   color: 'text-orange-600 dark:text-orange-400' },
  subscription: { label: 'Subskrypcja', icon: RefreshCw,    color: 'text-blue-600 dark:text-blue-400' },
  installment:  { label: 'Rata',         icon: ShoppingBag,  color: 'text-amber-600 dark:text-amber-400' },
  other:        { label: 'Inne',         icon: MoreHorizontal, color: 'text-muted-foreground' },
};

export default async function LiabilitiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const items = await db.query.liabilities.findMany({
    where: and(eq(liabilities.userId, user.id), eq(liabilities.isActive, true)),
    with: { category: true },
    orderBy: (l, { asc }) => [asc(l.dueDate)],
  });

  const totalRemaining = items.reduce((s, l) => s + parseFloat(l.remainingAmount), 0);
  const totalMonthly = items.reduce((s, l) => s + parseFloat(l.monthlyPayment ?? '0'), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Header title="Zobowiązania" />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground mb-1">Łączne zadłużenie</p>
          <p className="text-2xl font-bold text-destructive">{formatCurrency(totalRemaining)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Miesięczne raty</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(totalMonthly)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Aktywnych</p>
          <p className="text-lg font-bold text-foreground">{items.length}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <AddLiabilityButton />
      </div>

      {/* Liabilities list */}
      {items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <HandCoins className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Brak zobowiązań</p>
          <p className="text-xs text-muted-foreground">Dodaj kredyt, ratę lub subskrypcję.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((l) => {
            const meta = liabilityTypeLabels[l.type] ?? liabilityTypeLabels.other;
            const Icon = meta.icon;
            const remaining = parseFloat(l.remainingAmount);
            const total = parseFloat(l.totalAmount);
            const paidPct = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;

            return (
              <div key={l.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{l.name}</p>
                      <p className="text-xs text-muted-foreground">{meta.label}{l.category ? ` · ${l.category.name}` : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-destructive">{formatCurrency(remaining)}</p>
                    <p className="text-xs text-muted-foreground">z {formatCurrency(total)}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-[#01581E] rounded-full transition-all"
                    style={{ width: `${paidPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{paidPct}% spłacono</span>
                  <div className="flex gap-3">
                    {l.monthlyPayment && (
                      <span>Rata: <span className="text-foreground font-medium">{formatCurrency(l.monthlyPayment)}/mies.</span></span>
                    )}
                    {l.dueDate && (
                      <span>Do: <span className="text-foreground">{formatDate(l.dueDate, 'MM/yyyy')}</span></span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
