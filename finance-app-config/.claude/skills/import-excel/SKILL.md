# SKILL: Import transakcji z Excela

## Kiedy używać
Gdy użytkownik chce zaimportować transakcje z pliku `.xlsx` lub `.csv`.

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
- Duplikaty: sprawdź `(date, amount, description)` w bazie — jeśli istnieje, pomiń z logiem

### Faza 3: IMPORT
```typescript
// Zawsze w transakcji bazodanowej
const results = { imported: 0, skipped: 0, errors: [] }

// Każdy wiersz osobno — błąd jednego nie blokuje reszty
for (const row of rows) {
  try {
    // validate → insert
    results.imported++
  } catch (e) {
    results.errors.push({ row, error: e.message })
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

export function parseExcelFile(filePath: string) {
  const workbook = XLSX.readFile(filePath)
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
