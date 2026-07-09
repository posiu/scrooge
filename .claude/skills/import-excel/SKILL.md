# SKILL: Import transakcji z Excela

## Kiedy używać
Gdy użytkownik chce zaimportować transakcje z pliku `.xlsx` lub `.csv`.

## Architektura importu

Import odbywa się przez Next.js API route (`POST /api/transactions` w `web/src/app/api/transactions/route.ts`).
Parser `xlsx` (SheetJS) działa server-side w Next.js (serverless function).
Dane trafiają do Supabase PostgreSQL przez Drizzle ORM.
Deduplikacja: pole `import_hash` = hash z `(date + amount + description)`.

## Zasady importu

### Faza 1: ANALIZA pliku (zawsze najpierw)
1. Odczytaj plik i pokaż użytkownikowi:
   - Liczbę wierszy
   - Nazwy kolumn
   - Pierwsze 5 wierszy jako podgląd
   - Wykryte problemy (puste komórki, dziwne formaty dat, ujemne wartości)
2. Zaproponuj mapowanie kolumn → pola w bazie
3. CZEKAJ na potwierdzenie użytkownika przed insertem

### Faza 2: WALIDACJA
Każdy wiersz sprawdzaj pod kątem:
- `date` — czy parsuje się poprawnie? Akceptuj: `DD.MM.YYYY`, `YYYY-MM-DD`, `DD/MM/YYYY`
- `amount` — czy to liczba? Obsłuż przecinek jako separator dziesiętny
- `description` — opcjonalne, ale jeśli jest — przytnij whitespace
- Duplikaty: sprawdź `import_hash` w bazie — jeśli istnieje, pomiń z logiem

### Faza 3: IMPORT

```typescript
import { generateImportHash } from '@/lib/utils'   // hash(date + amount + description)

const results = { imported: 0, skipped: 0, errors: [] as { row: unknown; error: string }[] }

// Każdy wiersz osobno — błąd jednego nie blokuje reszty
for (const row of rows) {
  try {
    const importHash = generateImportHash(row.date, row.amount, row.description ?? '')

    // Sprawdź duplikat
    const existing = await db.query.transactions.findFirst({
      where: eq(transactions.importHash, importHash),
    })
    if (existing) { results.skipped++; continue }

    // Insert
    await db.insert(transactions).values({
      userId,
      accountId: row.accountId,
      categoryId: row.categoryId ?? null,
      amount:      String(Math.abs(row.amount)),
      type:        row.amount >= 0 ? 'income' : 'expense',
      date:        new Date(row.date),
      description: row.description?.trim() ?? null,
      importHash,
    })
    results.imported++
  } catch (e) {
    results.errors.push({ row, error: (e as Error).message })
  }
}
```

### Faza 4: RAPORT
Po imporcie zawsze pokaż:
- ✅ Zaimportowano: X transakcji
- ⏭️ Pominięto (duplikaty): Y
- ❌ Błędy: Z (pokaż szczegóły)
- 💰 Suma importowanych: kwota

## Częste problemy w polskich Excelach
- Kwoty z przecinkiem: `1 234,56` → zamień spację i przecinek przed parseFloat
- Daty w formacie Excel (liczba dni od 1900) → użyj `xlsx` library do konwersji
- Kodowanie znaków: zawsze otwieraj przez SheetJS, nie przez fs.readFile

## Przykład kodu parsera

```typescript
import * as XLSX from 'xlsx'

export function parseExcelFile(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { raw: false, dateNF: 'YYYY-MM-DD' })
  return rows
}

export function normalizeAmount(value: string | number): number {
  if (typeof value === 'number') return value
  // Obsługa polskiego formatu: "1 234,56"
  return parseFloat(value.replace(/\s/g, '').replace(',', '.'))
}
```

> Uwaga: W środowisku serverless (Next.js API route / Vercel) nie ma dostępu do systemu plików.
> Plik Excel należy przesłać jako `multipart/form-data` i odczytać jako `Buffer` z `formData.get('file')`.
