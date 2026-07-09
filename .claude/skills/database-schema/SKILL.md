# SKILL: Schema bazy danych — konwencje

## Kiedy używać
Przy każdej zmianie schematu bazy, tworzeniu nowych tabel, pisaniu migracji.

## Zasady ogólne

- ORM: Drizzle ORM (`drizzle-orm/pg-core`) — PostgreSQL
- Baza: Supabase PostgreSQL (Transaction Pool mode / pgbouncer)
- Schema: `web/src/lib/db/schema.ts` — jeden plik dla wszystkich tabel
- Migracje: `cd web && npm run db:generate` → sprawdź SQL → `npm run db:migrate` — nigdy ręczne SQL
- **Drizzle instance musi mieć `prepare: false`** (wymagane przy pgbouncer/Transaction Pool)
- **Soft delete zawsze** — kolumna `deleted_at timestamp` zamiast fizycznego usuwania

## Szablon nowej tabeli

```typescript
import {
  pgTable, pgEnum, uuid, text, numeric, timestamp, boolean, integer, index
} from 'drizzle-orm/pg-core'

export const myTable = pgTable('my_table', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull(),               // zawsze powiąż z userem
  name:        text('name').notNull(),
  amount:      numeric('amount', { precision: 15, scale: 2 }).notNull(), // kwoty: numeric
  isActive:    boolean('is_active').notNull().default(true),
  sortOrder:   integer('sort_order').notNull().default(0),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:   timestamp('deleted_at', { withTimezone: true }),           // soft delete
}, (t) => [
  index('my_table_user_id_idx').on(t.userId),
])
```

## Ważna konwencja: kwoty

**`amount` zawsze jest dodatnie.** Typ transakcji (income/expense) decyduje o kierunku.
- Nigdy: `-500` dla wydatku
- Zawsze: `amount: '500.00', type: 'expense'`
- Typ kolumny: `numeric` (string w JS/TS) — zawsze `parseFloat()` przed operacjami arytmetycznymi

## Enums PostgreSQL

Drizzle pg-core używa natywnych enumów PostgreSQL:

```typescript
export const accountTypeEnum = pgEnum('account_type', [
  'bank', 'cash', 'crypto', 'fund', 'insurance', 'other',
])
// Użycie w tabeli:
type: accountTypeEnum('type').notNull(),
```

## Tabele w projekcie (aktualny stan)

### `user_settings` — ustawienia użytkownika + konfiguracja AI
### `accounts` — konta (bank/cash/crypto/fund/insurance/other)
### `categories` — kategorie hierarchiczne (user_id = null → systemowe)
### `transactions` — transakcje z soft delete i import_hash
### `budget_templates` + `budget_template_items` — szablony budżetów
### `budgets` — miesięczne plany (YYYY-MM), unique: user+category+month
### `liabilities` — zobowiązania (loan/credit/subscription/installment)
### `ai_chat_sessions` — tylko metadata, wiadomości w localStorage
### `feature_requests` + `feature_votes` + `feature_comments` — roadmap

Pełna schema: `web/src/lib/db/schema.ts`

## Drizzle queries — wzorce dla PostgreSQL

```typescript
import { db } from '@/lib/db'
import { transactions, categories } from '@/lib/db/schema'
import { eq, and, gte, lte, isNull, sum } from 'drizzle-orm'

// Filtrowanie po miesiącu — używaj zakresu dat (nie string formatting):
const monthStart = new Date(year, month - 1, 1)
const monthEnd   = new Date(year, month, 0, 23, 59, 59, 999)

const actuals = await db
  .select({
    categoryId: transactions.categoryId,
    total: sum(transactions.amount),
  })
  .from(transactions)
  .where(
    and(
      eq(transactions.userId, userId),
      eq(transactions.type, 'expense'),
      gte(transactions.date, monthStart),
      lte(transactions.date, monthEnd),
      isNull(transactions.deletedAt),        // zawsze filtruj soft delete!
    )
  )
  .groupBy(transactions.categoryId)

// Wynik sum() to string — zawsze parseFloat:
const total = parseFloat(actuals[0]?.total ?? '0')
```

## Przed każdą zmianą schematu

1. Backup: Supabase Dashboard → Project → Settings → Backups
2. Zmień `web/src/lib/db/schema.ts`
3. `cd web && npm run db:generate`
4. Sprawdź wygenerowany plik SQL w `web/src/lib/db/migrations/`
5. `cd web && npm run db:migrate`
