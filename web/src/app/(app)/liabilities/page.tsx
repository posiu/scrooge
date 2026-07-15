export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { liabilities } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { AddLiabilityButton } from '@/components/forms/AddLiabilityButton';
import { EditLiabilityButton } from '@/components/forms/EditLiabilityButton';
import { HandCoins, CreditCard, RefreshCw, ShoppingBag, MoreHorizontal, User, Landmark, Briefcase } from 'lucide-react';

const liabilityTypeLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  loan:          { label: 'Kredyt',            icon: HandCoins,      color: 'text-red-600 dark:text-red-400' },
  credit:        { label: 'Karta',             icon: CreditCard,     color: 'text-orange-600 dark:text-orange-400' },
  subscription:  { label: 'Subskrypcja',       icon: RefreshCw,      color: 'text-blue-600 dark:text-blue-400' },
  installment:   { label: 'Rata',               icon: ShoppingBag,    color: 'text-amber-600 dark:text-amber-400' },
  personal_loan: { label: 'Pożyczka osobista', icon: User,           color: 'text-pink-600 dark:text-pink-400' },
  bank_loan:     { label: 'Pożyczka bankowa',  icon: Landmark,       color: 'text-cyan-600 dark:text-cyan-400' },
  company_loan:  { label: 'Pożyczka z firmy',  icon: Briefcase,      color: 'text-teal-600 dark:text-teal-400' },
  other:         { label: 'Inne',               icon: MoreHorizontal, color: 'text-muted-foreground' },
};

export default async function LiabilitiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const items = await db.query.liabilities.findMany({
    where: and(
      eq(liabilities.userId, user.id),
      eq(liabilities.isActive, true),
    ),
    with: { category: true },
    orderBy: (l, { asc }) => [asc(l.dueDate)],
  });

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Zobowiązania</h1>
          <p className="text-sm text-muted-foreground">Kredyty, pożyczki, raty i subskrypcje</p>
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
                  <div className="text-right flex items-start gap-2">
                    <div>
                      <p className="text-sm font-bold text-destructive">{formatCurrency(remaining)}</p>
                      <p className="text-xs text-muted-foreground">z {formatCurrency(total)}</p>
                    </div>
                    <EditLiabilityButton liability={l} />
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
