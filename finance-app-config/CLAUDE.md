# Scrooge — Domowy Controlling

## Cel projektu
Aplikacja do zarządzania finansami osobistymi dla "niefinansisty". Nie chodzi o bankowość — chodzi o świadomość: gdzie idą pieniądze, skąd przychodzą, jak zmieniają się zobowiązania, co zostaje.

Punkt odniesienia: **domowy controlling**. Budżet vs. realizacja, trendy, przekroczenia, podział na kategorie. Proste wykresy, zero żargonu.

## Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + TypeScript + Express (lub Fastify)
- **Baza danych**: Supabase (PostgreSQL w chmurze) — dane dostępne na każdym urządzeniu
- **ORM**: Drizzle ORM (type-safe, lekki, obsługuje PostgreSQL)
- **Wykresy**: Recharts
- **Style**: Tailwind CSS

## Struktura projektu

```
scrooge/
├── CLAUDE.md                  # ten plik
├── .claude/
│   ├── settings.json          # hooki i uprawnienia
│   └── commands/              # slash commands
│       ├── new-transaction.md
│       ├── monthly-report.md
│       └── import-excel.md
├── .mcp.json                  # MCP serwery
├── backend/
│   ├── src/
│   │   ├── db/                # schema, migracje
│   │   ├── routes/            # API endpoints
│   │   └── services/          # logika biznesowa
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── hooks/
    └── package.json
```

## Domeny danych (co śledzimy)

### 1. Transakcje
Podstawowy atom — każda operacja finansowa.
- `id`, `date`, `amount`, `type` (income/expense/transfer)
- `category_id`, `account_id`, `description`, `tags`
- Import z Excelu (.xlsx) jako pierwsze źródło danych

### 2. Konta
Miejsca gdzie żyją pieniądze: konto bankowe, gotówka, kryptowaluty, fundusze, polisy.
- Każde konto ma `balance` = suma transakcji na tym koncie
- Typy: `bank`, `cash`, `crypto`, `fund`, `insurance`, `other`

### 3. Kategorie
Hierarchiczne (np. "Jedzenie > Restauracje"). 
- Wbudowany zestaw startowy (można edytować)
- Podział na: wydatki, przychody, zobowiązania

### 4. Budżety
Miesięczny plan dla kategorii wydatkowych.
- `category_id`, `month` (YYYY-MM), `planned_amount`
- Raport: budżet vs. realizacja, % wykonania, przekroczenia

### 5. Zobowiązania
Kredyty, raty, subskrypcje — rzeczy które regularnie "znikają".
- `name`, `total_amount`, `remaining_amount`, `monthly_payment`, `due_date`
- Historia spłat (automatycznie z transakcji)

## Zasady developmentu

### Bezpieczeństwo danych
- Dane finansowe NIGDY nie wychodzą poza localhost
- Żadnych zewnętrznych API call z danymi transakcji
- Backup bazy przed każdą migracją: Supabase Dashboard → Database → Backups

### Kod
- TypeScript strict mode — zawsze
- Funkcje max 40 linii, potem refactor
- Każdy endpoint API musi mieć walidację (Zod)
- Testy dla logiki finansowej (obliczenia budżetów, balansy kont)

### Baza danych
- Schema w `backend/src/db/schema.ts` (Drizzle)
- Migracje nigdy ręcznie — zawsze przez `drizzle-kit generate`
- Przed każdą migracją: backup
- Soft delete dla transakcji (`deleted_at`) — nigdy nie kasujemy na twardo

### Import Excel
- Parser: `xlsx` (SheetJS)
- Walidacja każdego wiersza przed insertem
- Import idempotentny — duplikaty wykrywane po `(date, amount, description)`
- Błędne wiersze: logowane do pliku, nie blokują reszty importu

## Konwencje nazewnictwa

- Pliki komponentów: `PascalCase.tsx`
- Hooki: `useNazwa.ts`
- Endpointy: REST, `kebab-case` — np. `/api/transactions`, `/api/budget-reports`
- Kolumny w DB: `snake_case`
- Zmienne w TS: `camelCase`

## Komendy

```bash
# Backend
cd backend && npm run dev          # dev server (port 3001)
cd backend && npm run test         # testy
cd backend && npm run db:migrate   # migracje
# backup przez Supabase Dashboard (Database → Backups)

# Frontend  
cd frontend && npm run dev         # dev server (port 5173)
cd frontend && npm run build       # build produkcyjny
```

## Styl komunikacji z Claude

- Mów po polsku jeśli nie piszę po angielsku
- Przed większymi zmianami zawsze powiedz co planujesz zrobić
- Nie rób "na wszelki wypadek" — tylko to co zostało poproszone
- Jeśli coś jest niejasne, zapytaj ZANIM zaczniesz pisać kod
- Przy imporcie danych — zawsze najpierw pokaż próbkę parsowania, potem dopiero insert

## Zmienne środowiskowe

Plik `.env` w folderze `backend/` — nigdy nie commituj do gita.

```
DATABASE_URL=postgresql://postgres:[HASŁO]@db.[PROJEKT-ID].supabase.co:5432/postgres
NODE_ENV=development
API_PORT=3001
```

`.gitignore` musi zawierać `.env` — Claude Code pilnuje tego automatycznie.
