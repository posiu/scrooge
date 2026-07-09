# SKILL: Raport budżet vs. realizacja

## Kiedy używać
Gdy użytkownik pyta o: "jak mi idzie w tym miesiącu", "czy przekroczyłem budżet", "podsumowanie wydatków", "budżet vs. realizacja".

## Logika raportu

### Dane wejściowe
- `month`: YYYY-MM (domyślnie bieżący miesiąc)
- `account_id`: opcjonalnie — wszystkie konta lub jedno

### Struktura raportu

```
Raport: Styczeń 2025
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KATEGORIA       PLAN    FAKT    %      STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Jedzenie        1200    980     82%    ✅
Mieszkanie      2500    2500    100%   ✅
Transport       400     520     130%   ⚠️ +120 PLN
Rozrywka        300     410     137%   ❌ +110 PLN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMA WYDATKÓW   4400    4410    100%
PRZYCHODY               6200
BILANS                  +1790
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Statusy przekroczenia
- ✅ `<= 100%` — w normie
- ⚠️ `101-120%` — lekkie przekroczenie
- ❌ `> 120%` — przekroczenie wymaga uwagi
- 🔵 brak budżetu — nie planowane

### Drizzle query (PostgreSQL)

```typescript
import { db } from '@/lib/db'
import { transactions, categories, budgets } from '@/lib/db/schema'
import { eq, and, gte, lte, isNull, sum } from 'drizzle-orm'

const [y, m] = month.split('-').map(Number)
const monthStart = new Date(y, m - 1, 1)
const monthEnd   = new Date(y, m, 0, 23, 59, 59, 999)

// Rzeczywiste wydatki per kategoria
const actuals = await db
  .select({
    categoryId: transactions.categoryId,
    categoryName: categories.name,
    total: sum(transactions.amount),
  })
  .from(transactions)
  .leftJoin(categories, eq(transactions.categoryId, categories.id))
  .where(
    and(
      eq(transactions.userId, userId),
      eq(transactions.type, 'expense'),
      gte(transactions.date, monthStart),
      lte(transactions.date, monthEnd),
      isNull(transactions.deletedAt),        // zawsze filtruj soft delete!
    )
  )
  .groupBy(transactions.categoryId, categories.name)

// Budżety na miesiąc (tabela: budgets, kolumna: month = 'YYYY-MM')
const monthBudgets = await db.query.budgets.findMany({
  where: and(eq(budgets.userId, userId), eq(budgets.month, month)),
  with: { category: true },
})

// Kwoty z numeric są stringami — parseFloat przed arytmetyką
const actualsMap = Object.fromEntries(
  actuals.map(a => [a.categoryId, parseFloat(a.total ?? '0')])
)
```

### Zasady wyświetlania
- Sortuj: najpierw przekroczenia (❌), potem ⚠️, potem ✅
- Kategorie bez transakcji ale z budżetem: pokaż jako 0% wykonania
- Kategorie z transakcjami bez budżetu: pokaż z flagą 🔵
- Zawsze pokaż bilans (przychody - wydatki)
- Dodaj porównanie z poprzednim miesiącem jeśli dostępne

## Format odpowiedzi Claude

Gdy pokazujesz raport, zawsze dodaj 2-3 zdania komentarza:
- Co poszło dobrze
- Co wymaga uwagi
- Jeden konkretny wniosek (np. "Restauracje to 40% wydatków na jedzenie — warto sprawdzić")
