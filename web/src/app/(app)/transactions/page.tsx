export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { transactions, accounts, categories } from '@/lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { TransactionFilters } from '@/components/forms/TransactionFilters';
import { AddTransactionButton } from '@/components/forms/AddTransactionButton';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; type?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const page = parseInt(params.page ?? '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  const txList = await db.query.transactions.findMany({
    where: and(
      eq(transactions.userId, user.id),
      isNull(transactions.deletedAt),
    ),
    with: {
      category: true,
      account: true,
    },
    orderBy: desc(transactions.date),
    limit,
    offset,
  });

  const userAccounts = await db.query.accounts.findMany({
    where: eq(accounts.userId, user.id),
    orderBy: (a, { asc }) => [asc(a.sortOrder)],
  });

  const userCategories = await db.query.categories.findMany({
    where: and(
      eq(categories.isActive, true),
    ),
    orderBy: (c, { asc }) => [asc(c.sortOrder)],
  });

  const typeIcon = {
    income: <ArrowUpRight className="w-4 h-4 text-[#01581E]" />,
    expense: <ArrowDownRight className="w-4 h-4 text-destructive" />,
    transfer: <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />,
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Header title="Transakcje" />

      {/* Top actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <TransactionFilters accounts={userAccounts} categories={userCategories} />
        <AddTransactionButton accounts={userAccounts} categories={userCategories} />
      </div>

      {/* Transaction list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {txList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Brak transakcji</p>
            <p className="text-xs text-muted-foreground">
              Dodaj pierwszą transakcję lub zaimportuj dane z Excela.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Data</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Opis</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Kategoria</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Konto</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Kwota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {txList.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(tx.date, 'dd.MM.yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {typeIcon[tx.type]}
                      <span className="text-sm text-foreground truncate max-w-48">
                        {tx.description ?? tx.category?.name ?? '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {tx.category ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-muted text-muted-foreground">
                        {tx.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                    {tx.account?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-sm font-medium ${
                        tx.type === 'income'
                          ? 'text-[#01581E]'
                          : tx.type === 'expense'
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                      {formatCurrency(tx.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {txList.length === limit && (
        <div className="flex justify-center">
          <Link
            href={`/transactions?page=${page + 1}`}
            className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Następna strona
          </Link>
        </div>
      )}
    </div>
  );
}
