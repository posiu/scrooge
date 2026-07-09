import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import {
  accounts, categories, transactions, taxes, taxPayments,
  enforcementProceedings, enforcementPayments, userSettings,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

async function isAdmin(userId: string): Promise<boolean> {
  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });
  return settings?.isAdmin ?? false;
}

// ─── POST /api/admin/demo — seed dummy data ───────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // ── 1. Accounts ──
  const [acc1] = await db.insert(accounts).values({
    userId: user.id, name: 'PKO BP — Konto osobiste', type: 'bank',
    currency: 'PLN', institution: 'PKO Bank Polski', isDemoData: true,
  } as any).returning();

  const [acc2] = await db.insert(accounts).values({
    userId: user.id, name: 'Oszczędności ING', type: 'bank',
    currency: 'PLN', institution: 'ING Bank Śląski', isDemoData: true,
  } as any).returning();

  const [acc3] = await db.insert(accounts).values({
    userId: user.id, name: 'Gotówka portfel', type: 'cash',
    currency: 'PLN', isDemoData: true,
  } as any).returning();

  // ── 2. Categories (system ones may exist — we create user ones) ──
  const catMap: Record<string, string> = {};
  const catDefs = [
    { name: 'Wynagrodzenie', type: 'income' as const },
    { name: 'Freelance', type: 'income' as const },
    { name: 'Inwestycje', type: 'income' as const },
    { name: 'Jedzenie', type: 'expense' as const },
    { name: 'Transport', type: 'expense' as const },
    { name: 'Mieszkanie', type: 'expense' as const },
    { name: 'Rozrywka', type: 'expense' as const },
    { name: 'Zdrowie', type: 'expense' as const },
    { name: 'Ubrania', type: 'expense' as const },
    { name: 'Kredyt hipoteczny', type: 'obligation' as const },
    { name: 'Rata samochód', type: 'obligation' as const },
  ];
  for (const cat of catDefs) {
    const [c] = await db.insert(categories).values({
      userId: user.id, ...cat, isSystem: false,
    } as any).returning();
    catMap[cat.name] = c.id;
  }

  // ── 3. Transactions (last 3 months) ──
  const now = new Date();
  const txDefs = [
    { desc: 'Wynagrodzenie kwiecień', amount: '8200', type: 'income' as const, cat: 'Wynagrodzenie', daysAgo: 75 },
    { desc: 'Wynagrodzenie maj', amount: '8200', type: 'income' as const, cat: 'Wynagrodzenie', daysAgo: 45 },
    { desc: 'Wynagrodzenie czerwiec', amount: '8200', type: 'income' as const, cat: 'Wynagrodzenie', daysAgo: 10 },
    { desc: 'Freelance — projekt UX', amount: '3500', type: 'income' as const, cat: 'Freelance', daysAgo: 60 },
    { desc: 'Dywidenda ETF', amount: '420', type: 'income' as const, cat: 'Inwestycje', daysAgo: 30 },
    { desc: 'Biedronka zakupy', amount: '340', type: 'expense' as const, cat: 'Jedzenie', daysAgo: 5 },
    { desc: 'Żabka', amount: '85', type: 'expense' as const, cat: 'Jedzenie', daysAgo: 8 },
    { desc: 'Restauracja La Scala', amount: '210', type: 'expense' as const, cat: 'Jedzenie', daysAgo: 14 },
    { desc: 'Paliwo Orlen', amount: '280', type: 'expense' as const, cat: 'Transport', daysAgo: 7 },
    { desc: 'Bilet miesięczny ZTM', amount: '110', type: 'expense' as const, cat: 'Transport', daysAgo: 30 },
    { desc: 'Czynsz + media', amount: '2200', type: 'expense' as const, cat: 'Mieszkanie', daysAgo: 30 },
    { desc: 'Czynsz + media', amount: '2200', type: 'expense' as const, cat: 'Mieszkanie', daysAgo: 60 },
    { desc: 'Netflix + Spotify', amount: '75', type: 'expense' as const, cat: 'Rozrywka', daysAgo: 15 },
    { desc: 'Kino + kolacja', amount: '160', type: 'expense' as const, cat: 'Rozrywka', daysAgo: 20 },
    { desc: 'Apteka', amount: '95', type: 'expense' as const, cat: 'Zdrowie', daysAgo: 12 },
    { desc: 'Wizyta stomatolog', amount: '350', type: 'expense' as const, cat: 'Zdrowie', daysAgo: 40 },
    { desc: 'H&M kurtka', amount: '299', type: 'expense' as const, cat: 'Ubrania', daysAgo: 25 },
    { desc: 'Rata kredyt hipoteczny', amount: '1850', type: 'expense' as const, cat: 'Kredyt hipoteczny', daysAgo: 30 },
    { desc: 'Rata kredyt hipoteczny', amount: '1850', type: 'expense' as const, cat: 'Kredyt hipoteczny', daysAgo: 60 },
    { desc: 'Rata samochód Toyota', amount: '680', type: 'expense' as const, cat: 'Rata samochód', daysAgo: 30 },
    { desc: 'Rata samochód Toyota', amount: '680', type: 'expense' as const, cat: 'Rata samochód', daysAgo: 60 },
  ];

  for (const tx of txDefs) {
    const txDate = new Date(now);
    txDate.setDate(txDate.getDate() - tx.daysAgo);
    await db.insert(transactions).values({
      userId:     user.id,
      accountId:  acc1.id,
      categoryId: catMap[tx.cat] ?? null,
      amount:     tx.amount,
      type:       tx.type,
      currency:   'PLN',
      description: tx.desc,
      date:        txDate,
    } as any);
  }

  // ── 4. Taxes ──
  const [tax1] = await db.insert(taxes).values({
    userId: user.id, name: 'PIT-37 2024', type: 'personal_income',
    taxPeriod: '2024', taxOffice: 'US Warszawa-Praga',
    amountDue: '4200', amountPaid: '4200', status: 'paid',
    dueDate: new Date('2025-04-30'), isDemoData: true,
    description: 'Roczne rozliczenie PIT za 2024',
  } as any).returning();

  const [tax2] = await db.insert(taxes).values({
    userId: user.id, name: 'Podatek od nieruchomości 2025', type: 'real_estate',
    taxPeriod: '2025', taxOffice: 'UM Warszawa',
    amountDue: '1240', amountPaid: '620', status: 'partially_paid',
    dueDate: new Date('2025-09-15'), isDemoData: true,
    description: 'Podatek od nieruchomości mieszkalnej — płatny w 4 ratach',
  } as any).returning();

  const [tax3] = await db.insert(taxes).values({
    userId: user.id, name: 'PCC zakup samochodu', type: 'pcc',
    taxPeriod: '2025', taxOffice: 'US Warszawa-Wola',
    amountDue: '680', amountPaid: '680', status: 'paid',
    dueDate: new Date('2025-03-10'), isDemoData: true,
    description: 'PCC-3 od zakupu samochodu używanego',
  } as any).returning();

  const [tax4] = await db.insert(taxes).values({
    userId: user.id, name: 'Podatek Belki 2024 Q4', type: 'investment',
    taxPeriod: '2024-Q4', taxOffice: 'US Warszawa-Praga',
    amountDue: '890', amountPaid: '0', status: 'overdue',
    dueDate: new Date('2025-01-31'), isDemoData: true,
    description: 'Podatek od zysków kapitałowych — ETF, dywidendy',
  } as any).returning();

  // Tax payments
  await db.insert(taxPayments).values({
    taxId: tax2.id, userId: user.id, amount: '310',
    paymentDate: new Date('2025-03-15'), isDemoData: true,
    description: 'I rata podatku od nieruchomości',
  } as any);
  await db.insert(taxPayments).values({
    taxId: tax2.id, userId: user.id, amount: '310',
    paymentDate: new Date('2025-06-15'), isDemoData: true,
    description: 'II rata podatku od nieruchomości',
  } as any);

  // ── 5. Enforcement proceedings ──
  const [ep1] = await db.insert(enforcementProceedings).values({
    userId:               user.id,
    accountId:            acc1.id,
    creditor:             'Bank BNP Paribas S.A.',
    enforcementAuthority: 'Komornik Sądowy Marek Kowalski, KM 1234/24',
    caseNumber:           'KM 1234/24',
    reason:               'Niespłacony kredyt gotówkowy — wyrok Sądu Rejonowego sygn. I C 567/23',
    originalAmount:       '18500',
    remainingAmount:      '14200',
    interestType:         'statutory',
    interestRate:         '11.25',
    garnishmentDate:      new Date('2024-09-01'),
    status:               'partially_paid',
    isDemoData:           true,
    description:          'Zajęcie na konto PKO BP. Miesięczne potrącenia 1000 zł.',
  } as any).returning();

  const [ep2] = await db.insert(enforcementProceedings).values({
    userId:               user.id,
    accountId:            acc2.id,
    creditor:             'Urząd Skarbowy Warszawa-Wola',
    enforcementAuthority: 'Naczelnik US Warszawa-Wola',
    caseNumber:           'UA/123/2025',
    reason:               'Zaległości podatkowe — VAT Q2 2023',
    originalAmount:       '5600',
    remainingAmount:      '5600',
    interestType:         'tax',
    interestRate:         '14.50',
    garnishmentDate:      new Date('2025-02-14'),
    status:               'active',
    isDemoData:           true,
    description:          'Zajęcie administracyjne na rachunku ING.',
  } as any).returning();

  // Enforcement payments
  await db.insert(enforcementPayments).values({
    proceedingId: ep1.id, userId: user.id, amount: '1000',
    paymentDate: new Date('2024-10-01'), isDemoData: true, description: 'Potrącenie październik 2024',
  } as any);
  await db.insert(enforcementPayments).values({
    proceedingId: ep1.id, userId: user.id, amount: '1000',
    paymentDate: new Date('2024-11-01'), isDemoData: true, description: 'Potrącenie listopad 2024',
  } as any);
  await db.insert(enforcementPayments).values({
    proceedingId: ep1.id, userId: user.id, amount: '1000',
    paymentDate: new Date('2024-12-01'), isDemoData: true, description: 'Potrącenie grudzień 2024',
  } as any);
  await db.insert(enforcementPayments).values({
    proceedingId: ep1.id, userId: user.id, amount: '1300',
    paymentDate: new Date('2025-01-05'), isDemoData: true, description: 'Potrącenie styczeń 2025 + odsetki',
  } as any);

  return NextResponse.json({ success: true, message: 'Demo data inserted' }, { status: 201 });
}

// ─── DELETE /api/admin/demo — remove all demo data ───────────────────────────
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Delete in FK-safe order (children first)
  await db.delete(enforcementPayments).where(and(eq(enforcementPayments.userId, user.id), eq(enforcementPayments.isDemoData as any, true)));
  await db.delete(taxPayments).where(and(eq(taxPayments.userId, user.id), eq(taxPayments.isDemoData as any, true)));
  await db.delete(enforcementProceedings).where(and(eq(enforcementProceedings.userId, user.id), eq(enforcementProceedings.isDemoData as any, true)));
  await db.delete(taxes).where(and(eq(taxes.userId, user.id), eq(taxes.isDemoData as any, true)));
  await db.delete(transactions).where(and(eq(transactions.userId, user.id)));
  await db.delete(categories).where(and(eq(categories.userId, user.id)));
  await db.delete(accounts).where(eq(accounts.userId, user.id));

  return NextResponse.json({ success: true, message: 'Demo data removed' });
}
