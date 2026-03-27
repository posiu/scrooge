# SKILL: Schema bazy danych — konwencje

## Kiedy używać
Przy każdej zmianie schematu bazy, tworzeniu nowych tabel, pisaniu migracji.

## Zasady ogólne

- ORM: Drizzle ORM (`drizzle-orm` + `better-sqlite3`)
- Schema: `backend/src/db/schema.ts` — jeden plik dla wszystkich tabel
- Migracje: `drizzle-kit generate` → nigdy ręczne SQL w produkcji
- **Soft delete zawsze** — kolumna `deleted_at timestamp` zamiast fizycznego usuwania

## Szablon tabeli

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const transactions = sqliteTable('transactions', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  date:        text('date').notNull(),                    // ISO 8601: YYYY-MM-DD
  amount:      real('amount').notNull(),                  // zawsze dodatnie!
  type:        text('type', { enum: ['income', 'expense', 'transfer'] }).notNull(),
  description: text('description'),
  categoryId:  integer('category_id').references(() => categories.id),
  accountId:   integer('account_id').references(() => accounts.id).notNull(),
  tags:        text('tags'),                              // JSON array jako string
  createdAt:   text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt:   text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  deletedAt:   text('deleted_at'),                       // soft delete
})
```

## Ważna konwencja: kwoty

**`amount` zawsze jest dodatnie.** Typ transakcji (income/expense) decyduje o kierunku.
- Nigdy: `-500` dla wydatku
- Zawsze: `amount: 500, type: 'expense'`

Dlaczego: upraszcza walidację, zapobiega błędom przy raportach.

## Tabele w projekcie

### `accounts` — konta/portfele
```typescript
export const accounts = sqliteTable('accounts', {
  id:      integer('id').primaryKey({ autoIncrement: true }),
  name:    text('name').notNull(),
  type:    text('type', { enum: ['bank', 'cash', 'crypto', 'fund', 'insurance', 'other'] }).notNull(),
  currency: text('currency').default('PLN'),
  color:   text('color'),   // hex, do UI
  icon:    text('icon'),    // emoji lub nazwa ikony
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text('deleted_at'),
})
```

### `categories` — kategorie (hierarchiczne)
```typescript
export const categories = sqliteTable('categories', {
  id:       integer('id').primaryKey({ autoIncrement: true }),
  name:     text('name').notNull(),
  parentId: integer('parent_id').references((): AnySQLiteColumn => categories.id),
  type:     text('type', { enum: ['income', 'expense', 'liability'] }).notNull(),
  color:    text('color'),
  icon:     text('icon'),
})
```

### `monthly_budgets` — budżety miesięczne
```typescript
export const monthlyBudgets = sqliteTable('monthly_budgets', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  month:       text('month').notNull(),  // YYYY-MM
  categoryId:  integer('category_id').references(() => categories.id).notNull(),
  plannedAmount: real('planned_amount').notNull(),
})
```

### `liabilities` — zobowiązania
```typescript
export const liabilities = sqliteTable('liabilities', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  name:           text('name').notNull(),
  totalAmount:    real('total_amount').notNull(),
  remainingAmount: real('remaining_amount').notNull(),
  monthlyPayment: real('monthly_payment').notNull(),
  dueDate:        text('due_date'),   // YYYY-MM-DD
  accountId:      integer('account_id').references(() => accounts.id),
  deletedAt:      text('deleted_at'),
})
```

## Przed każdą zmianą schematu

1. Backup: `npm run db:backup`
2. Zmień `schema.ts`
3. `npx drizzle-kit generate`
4. Sprawdź wygenerowany plik migracji — czy robi to co oczekujesz?
5. `npx drizzle-kit migrate`
