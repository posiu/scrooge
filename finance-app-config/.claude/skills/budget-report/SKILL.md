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

### SQL query (Drizzle)

```typescript
// Transakcje w miesiącu per kategoria
const actuals = await db
  .select({
    categoryId: transactions.categoryId,
    categoryName: categories.name,
    total: sql<number>`sum(${transactions.amount})`
  })
  .from(transactions)
  .leftJoin(categories, eq(transactions.categoryId, categories.id))
  .where(
    and(
      sql`strftime('%Y-%m', ${transactions.date}) = ${month}`,
      eq(transactions.type, 'expense'),
      isNull(transactions.deletedAt)
    )
  )
  .groupBy(transactions.categoryId)

// Budżety na miesiąc
const budgets = await db
  .select()
  .from(monthlyBudgets)
  .where(eq(monthlyBudgets.month, month))
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
