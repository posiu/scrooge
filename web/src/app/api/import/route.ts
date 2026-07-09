import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { transactions, categories } from '@/lib/db/schema';
import { eq, or, isNull, and } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';

const RowSchema = z.object({
  date:        z.string(),
  amount:      z.coerce.number(),
  description: z.string().optional().default(''),
  categoryName: z.string().optional().default(''),
  type:        z.enum(['income', 'expense', 'transfer']).optional(),
  accountId:   z.string().uuid().optional(),
});

const ImportSchema = z.object({
  rows:      z.array(RowSchema),
  accountId: z.string().uuid(),
  mapping: z.object({
    date:         z.string(),
    amount:       z.string(),
    description:  z.string().optional(),
    category:     z.string().optional(),
    type:         z.string().optional(),
  }),
  skipDuplicates: z.boolean().default(true),
});

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  // Try DD.MM.YYYY, DD-MM-YYYY, YYYY-MM-DD, MM/DD/YYYY
  const formats = [
    /^(\d{2})\.(\d{2})\.(\d{4})$/, // DD.MM.YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/,   // DD-MM-YYYY
  ];
  for (const fmt of formats) {
    const m = raw.match(fmt);
    if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T12:00:00Z`);
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = ImportSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { rows, accountId, mapping, skipDuplicates } = parsed.data;

  // Load user categories for auto-mapping
  const userCategories = await db.query.categories.findMany({
    where: and(or(eq(categories.userId, user.id), isNull(categories.userId)), eq(categories.isActive, true)),
  });
  const catByName = new Map(userCategories.map(c => [c.name.toLowerCase().trim(), c]));

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const date = parseDate(row.date);
      if (!date) { errors++; continue; }

      const amount = Math.abs(row.amount);
      if (amount === 0) { skipped++; continue; }

      // Determine type: positive = income, negative = expense (unless explicitly set)
      const type = row.type ?? (row.amount < 0 ? 'expense' : 'income');

      // Category matching (fuzzy: substring match)
      let categoryId: string | null = null;
      if (row.categoryName) {
        const key = row.categoryName.toLowerCase().trim();
        const match = catByName.get(key) ?? [...catByName.entries()].find(([k]) => k.includes(key) || key.includes(k))?.[1];
        categoryId = match?.id ?? null;
      }

      // Dedup hash
      const hash = crypto.createHash('md5')
        .update(`${date.toISOString().split('T')[0]}_${amount}_${row.description}`)
        .digest('hex');

      if (skipDuplicates) {
        const existing = await db.query.transactions.findFirst({
          where: and(eq(transactions.userId, user.id), eq(transactions.importHash, hash)),
        });
        if (existing) { skipped++; continue; }
      }

      await db.insert(transactions).values({
        userId:      user.id,
        accountId,
        categoryId,
        amount:      String(amount),
        type,
        currency:    'PLN',
        description: row.description || null,
        date,
        importHash:  hash,
      });

      imported++;
    } catch {
      errors++;
    }
  }

  return NextResponse.json({ imported, skipped, errors });
}
