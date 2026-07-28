import { db } from '@/lib/db';
import { accounts, categories } from '@/lib/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';

export async function userOwnsAccount(userId: string, accountId: string): Promise<boolean> {
  const row = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, accountId), eq(accounts.userId, userId)),
    columns: { id: true },
  });
  return !!row;
}

// System categories (userId = null) are shared and usable by anyone.
export async function userCanUseCategory(userId: string, categoryId: string): Promise<boolean> {
  const row = await db.query.categories.findFirst({
    where: and(eq(categories.id, categoryId), or(eq(categories.userId, userId), isNull(categories.userId))),
    columns: { id: true },
  });
  return !!row;
}
