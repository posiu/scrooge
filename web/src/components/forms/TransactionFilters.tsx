'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { Account, Category } from '@/lib/db/schema';

interface Props { accounts: Account[]; categories: Category[] }

export function TransactionFilters({ accounts, categories }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp?.toString() ?? '');
    if (value) params.set(key, value); else params.delete(key);
    params.delete('page');
    router.push(`/transactions?${params}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <input
        type="month"
        defaultValue={sp?.get('month') ?? ''}
        onChange={(e) => update('month', e.target.value)}
        className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#01581E]"
      />
      <select
        defaultValue={sp?.get('type') ?? ''}
        onChange={(e) => update('type', e.target.value)}
        className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#01581E]"
      >
        <option value="">Wszystkie typy</option>
        <option value="income">Przychody</option>
        <option value="expense">Wydatki</option>
        <option value="transfer">Przelewy</option>
      </select>
      <select
        defaultValue={sp?.get('account') ?? ''}
        onChange={(e) => update('account', e.target.value)}
        className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#01581E]"
      >
        <option value="">Wszystkie konta</option>
        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
    </div>
  );
}
