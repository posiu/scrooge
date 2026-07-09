export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { accounts, transactions } from '@/lib/db/schema';
import { eq, and, isNull, sum, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { AddAccountButton } from '@/components/forms/AddAccountButton';
import {
  Landmark,
  Wallet,
  Bitcoin,
  PiggyBank,
  ShieldCheck,
  Boxes,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const accountTypeLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  bank:      { label: 'Konto bankowe', icon: Landmark,   color: 'text-blue-600 dark:text-blue-400' },
  cash:      { label: 'Gotówka',       icon: Wallet,      color: 'text-amber-600 dark:text-amber-400' },
  crypto:    { label: 'Kryptowaluty', icon: Bitcoin,     color: 'text-orange-600 dark:text-orange-400' },
  fund:      { label: 'Fundusz',       icon: PiggyBank,   color: 'text-[#01581E]' },
  insurance: { label: 'Polisa',        icon: ShieldCheck, color: 'text-purple-600 dark:text-purple-400' },
  other:     { label: 'Inne',          icon: Boxes,       color: 'text-muted-foreground' },
};

async function getAccountsWithBalance(userId: string) {
  const userAccounts = await db.query.accounts.findMany({
    where: and(
      eq(accounts.userId, userId),
      eq(accounts.isActive, true),
    ),
    orderBy: (a, { asc }) => [asc(a.sortOrder), asc(a.name)],
  });

  const balances = await Promise.all(
    userAccounts.map(async (account) => {
      const incomeResult = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.accountId, account.id),
            eq(transactions.type, 'income'),
            isNull(transactions.deletedAt),
          ),
        );

      const expenseResult = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.accountId, account.id),
            eq(transactions.type, 'expense'),
            isNull(transactions.deletedAt),
          ),
        );

      const income = parseFloat(incomeResult[0]?.total ?? '0');
      const expense = parseFloat(expenseResult[0]?.total ?? '0');
      const balance = income - expense;

      return { ...account, balance, income, expense };
    }),
  );

  return balances;
}

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const accountsWithBalance = await getAccountsWithBalance(user.id);
  const totalBalance = accountsWithBalance.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Header title="Konta" />

      {/* Total balance */}
      <div className="bg-[#01581E] rounded-2xl p-6 text-white">
        <p className="text-white/70 text-sm mb-1">Łączny majątek</p>
        <p className="text-4xl font-bold">{formatCurrency(totalBalance)}</p>
        <p className="text-white/60 text-xs mt-2">{accountsWithBalance.length} aktywnych kont</p>
      </div>

      {/* Add account */}
      <div className="flex justify-end">
        <AddAccountButton />
      </div>

      {/* Accounts grid */}
      {accountsWithBalance.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Landmark className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Brak kont</p>
          <p className="text-xs text-muted-foreground">Dodaj swoje pierwsze konto finansowe.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {accountsWithBalance.map((account) => {
            const meta = accountTypeLabels[account.type] ?? accountTypeLabels.other;
            const Icon = meta.icon;

            return (
              <div
                key={account.id}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{account.name}</p>
                      <p className="text-xs text-muted-foreground">{meta.label}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{account.currency}</span>
                </div>

                {account.institution && (
                  <p className="text-xs text-muted-foreground mb-3">{account.institution}</p>
                )}

                <div className="pt-3 border-t border-border">
                  <p className={`text-xl font-bold ${account.balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-1 text-xs text-[#01581E]">
                      <TrendingUp className="w-3 h-3" />
                      {formatCurrency(account.income)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingDown className="w-3 h-3" />
                      {formatCurrency(account.expense)}
                    </div>
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
