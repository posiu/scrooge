export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { investments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { INVESTMENT_CATEGORY_LABELS } from '@/lib/investmentCategories';
import { Header } from '@/components/layout/Header';
import { AddInvestmentButton } from '@/components/forms/AddInvestmentButton';
import { EditInvestmentButton } from '@/components/forms/EditInvestmentButton';
import { LineChart } from 'lucide-react';

export default async function InvestmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const items = await db.query.investments.findMany({
    where: and(eq(investments.userId, user.id), eq(investments.isActive, true)),
    orderBy: (i, { asc }) => [asc(i.name)],
  });

  const totalValue = items.reduce((sum, i) => sum + Number(i.currentValue), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Header title="Inwestycje" />

      {/* Total value */}
      <div className="bg-[#01581E] rounded-2xl p-6 text-white">
        <p className="text-white/70 text-sm mb-1">Łączna wartość inwestycji</p>
        <p className="text-4xl font-bold">{formatCurrency(totalValue)}</p>
        <p className="text-white/60 text-xs mt-2">{items.length} {items.length === 1 ? 'pozycja' : 'pozycji'}</p>
      </div>

      {/* Add investment */}
      <div className="flex justify-end">
        <AddInvestmentButton />
      </div>

      {/* Investments grid */}
      {items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <LineChart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Brak inwestycji</p>
          <p className="text-xs text-muted-foreground">Dodaj swoją pierwszą inwestycję.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((investment) => (
            <div
              key={investment.id}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <LineChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{investment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {INVESTMENT_CATEGORY_LABELS[investment.category] ?? investment.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{investment.currency}</span>
                  <EditInvestmentButton investment={investment} />
                </div>
              </div>

              {investment.institution && (
                <p className="text-xs text-muted-foreground mb-3">{investment.institution}</p>
              )}

              <div className="pt-3 border-t border-border">
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(investment.currentValue, investment.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
