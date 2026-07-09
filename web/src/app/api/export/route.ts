import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { transactions, budgets } from '@/lib/db/schema';
import { eq, and, gte, lte, isNull, desc } from 'drizzle-orm';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format  = searchParams.get('format') ?? 'excel';  // excel | csv
  const month   = searchParams.get('month');               // YYYY-MM  (optional — if absent: all)
  const type    = searchParams.get('type') ?? 'transactions'; // transactions | budget

  // ── date range
  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number);
    dateFrom = new Date(`${y}-${String(m).padStart(2, '0')}-01T00:00:00Z`);
    const lastDay = new Date(y, m, 0).getDate();
    dateTo   = new Date(`${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59Z`);
  }

  if (type === 'budget') {
    // Export budget plan
    const rows = await db.query.budgets.findMany({
      where: month
        ? and(eq(budgets.userId, user.id), eq(budgets.month, month))
        : eq(budgets.userId, user.id),
      with: { category: true },
      orderBy: [desc(budgets.month)],
    });

    const data = rows.map(r => ({
      Miesiąc:     r.month,
      Kategoria:   r.category?.name ?? '',
      Typ:         r.category?.type === 'income' ? 'Przychód' : r.category?.type === 'obligation' ? 'Zobowiązanie' : 'Wydatek',
      Planowano:   Number(r.plannedAmount),
    }));

    return buildResponse(data, format, `budzet${month ? '_' + month : ''}`);
  }

  // Export transactions
  const conditions: ReturnType<typeof and>[] = [eq(transactions.userId, user.id), isNull(transactions.deletedAt)];
  if (dateFrom) conditions.push(gte(transactions.date, dateFrom));
  if (dateTo)   conditions.push(lte(transactions.date, dateTo));

  const rows = await db.query.transactions.findMany({
    where: and(...conditions),
    with: { category: true, account: true },
    orderBy: [desc(transactions.date)],
  });

  const data = rows.map(r => ({
    Data:       new Date(r.date).toLocaleDateString('pl-PL'),
    Typ:        r.type === 'income' ? 'Przychód' : r.type === 'expense' ? 'Wydatek' : 'Transfer',
    Kwota:      Number(r.amount),
    Waluta:     r.currency,
    Konto:      r.account?.name ?? '',
    Kategoria:  r.category?.name ?? '',
    Opis:       r.description ?? '',
  }));

  return buildResponse(data, format, `transakcje${month ? '_' + month : ''}`);
}

function buildResponse(data: object[], format: string, fileName: string) {
  if (format === 'csv') {
    if (data.length === 0) return new NextResponse('Brak danych', { status: 404 });
    const headers = Object.keys(data[0]);
    const rows = [headers.join(';'), ...data.map(r => headers.map(h => String((r as Record<string, unknown>)[h] ?? '')).join(';'))];
    return new NextResponse(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}.csv"`,
      },
    });
  }

  // Excel
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Scrooge Export');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}.xlsx"`,
    },
  });
}
