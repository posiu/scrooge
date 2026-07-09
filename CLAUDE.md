# Scrooge — Domowy Controlling

## Cel projektu
Aplikacja do zarządzania finansami osobistymi dla "niefinansisty". Nie chodzi o bankowość — chodzi o świadomość: gdzie idą pieniądze, skąd przychodzą, jak zmieniają się zobowiązania, co zostaje.

Punkt odniesienia: **domowy controlling**. Budżet vs. realizacja, trendy, przekroczenia, podział na kategorie. Proste wykresy, zero żargonu.

## Stack

- **Framework**: Next.js 15.1.7 (App Router) — frontend + API routes w jednym projekcie
- **Auth**: Supabase Auth (OTP / magic link, bez hasła)
- **Baza danych**: Supabase PostgreSQL (w chmurze) — dane dostępne na każdym urządzeniu
- **ORM**: Drizzle ORM (type-safe, `drizzle-orm/pg-core`, connection pooling przez Supabase Transaction Pool)
- **Hosting**: Vercel (darmowy tier, serverless API routes)
- **Wykresy**: Recharts (BarChart, PieChart, LineChart)
- **Style**: Tailwind CSS + komponenty w stylu shadcn/ui (Radix UI primitives)
- **Dark mode**: next-themes z CSS custom properties
- **AI Chat**: bezpośrednie wywołania API (OpenAI / Anthropic / Google / custom OpenAI-compatible)
- **Toasty**: Sonner
- **Ikony**: lucide-react

## Struktura projektu

```
scrooge/
├── CLAUDE.md                    # ten plik
├── .claude/
│   ├── settings.json            # uprawnienia i hooki
│   ├── agents/                  # subagenci
│   ├── commands/                # slash commands
│   ├── skills/                  # biblioteka wiedzy dla Claude
│   └── hooks/                   # shell hooks (pre/post tool use)
├── .mcp.json                    # MCP serwery (filesystem)
└── web/                         # Cały kod aplikacji (Next.js monolith)
    ├── src/
    │   ├── app/                 # Next.js App Router
    │   │   ├── (app)/           # Chronione trasy (dashboard, transakcje, budżety...)
    │   │   ├── (auth)/          # Auth (login, callback)
    │   │   ├── api/             # Serverless API routes (Next.js Route Handlers)
    │   │   ├── layout.tsx       # Root layout
    │   │   ├── page.tsx         # Landing page (publiczna)
    │   │   ├── not-found.tsx    # 404
    │   │   └── error.tsx        # 500
    │   ├── components/
    │   │   ├── layout/          # Sidebar, Header, MobileNav, ThemeToggle
    │   │   ├── forms/           # Formularze (AddTransactionButton itp.)
    │   │   ├── charts/          # Wykresy Recharts
    │   │   └── ui/              # Toaster i inne atomowe komponenty UI
    │   └── lib/
    │       ├── db/
    │       │   ├── schema.ts    # Drizzle schema (wszystkie tabele)
    │       │   ├── index.ts     # Instancja Drizzle (postgres + prepare: false)
    │       │   └── migrations/  # Wygenerowane migracje SQL
    │       ├── supabase/
    │       │   ├── client.ts    # createBrowserClient (komponenty klienckie)
    │       │   └── server.ts    # createServerClient (Server Components / API)
    │       └── utils.ts         # cn(), formatCurrency, getPolishHolidays() itp.
    ├── middleware.ts             # Session refresh + auth guard
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── drizzle.config.ts        # dialect: postgresql, schema: src/lib/db/schema.ts
    ├── package.json
    └── .env.local               # NIE commitować do gita
```

## Domeny danych (co śledzimy)

### 1. Transakcje (`transactions`)
Podstawowy atom — każda operacja finansowa.
- `id` (uuid), `date` (timestamp), `amount` (numeric), `type` (income/expense/transfer)
- `category_id`, `account_id`, `description`, `tags` (text[]), `import_hash`
- Soft delete: `deleted_at` timestamp — nigdy nie usuwamy na twardo
- Import z Excelu (.xlsx): deduplikacja po `import_hash = hash(date + amount + description)`

### 2. Konta (`accounts`)
Miejsca gdzie żyją pieniądze: konto bankowe, gotówka, kryptowaluty, fundusze, polisy.
- `balance` = obliczany dynamicznie z sumy transakcji na koncie
- Typy (enum): `bank`, `cash`, `crypto`, `fund`, `insurance`, `other`

### 3. Kategorie (`categories`)
Hierarchiczne (np. "Jedzenie > Restauracje").
- `user_id` = null → kategoria systemowa (widoczna dla wszystkich)
- `user_id` = UUID → kategoria użytkownika
- Typy (enum): `income`, `expense`, `obligation`
- `is_system` flag dla predefiniowanych kategorii

### 4. Budżety (`budgets`)
Miesięczny plan dla kategorii wydatkowych.
- `month` (tekst YYYY-MM), `planned_amount` (numeric)
- Unique constraint: `(user_id, category_id, month)` — upsert przy aktualizacji
- Szablony budżetów: `budget_templates` + `budget_template_items`

### 5. Zobowiązania (`liabilities`)
Kredyty, raty, subskrypcje.
- Typy: `loan`, `credit`, `subscription`, `installment`, `other`
- `remaining_amount`, `monthly_payment`, `interest_rate`, `due_date`

### 6. AI Chat (`ai_chat_sessions`)
- W bazie: tylko metadata sesji (title, model, message_count)
- Wiadomości: wyłącznie w `localStorage` urządzenia — nigdy w DB
- Obsługiwani providerzy: OpenAI, Anthropic, Google, custom (OpenAI-compatible API)

### 7. Feature Requests (`feature_requests`, `feature_votes`, `feature_comments`)
- Publiczna tablica roadmapy z głosowaniem
- Statusy: `open`, `planned`, `in_progress`, `done`, `rejected`

## Zasady developmentu

### Bezpieczeństwo danych
- Dane finansowe użytkownika wychodzą tylko do jego konta Supabase (RLS policies)
- Klucze API do AI przechowywane po stronie klienta (localStorage), nigdy plain text w DB
- Backup bazy: Supabase Dashboard → Project → Settings → Backups (automatyczne)

### Kod
- TypeScript strict mode — zawsze
- Funkcje max 40 linii, potem refactor
- Server Components dla odczytu danych (bez dodatkowego fetch)
- Client Components (`'use client'`) tylko gdy potrzebny stan lub interakcja
- `export const dynamic = 'force-dynamic'` na stronach korzystających z Supabase auth
- Walidacja wejścia: Zod w API routes

### Baza danych
- Schema: `web/src/lib/db/schema.ts` (Drizzle, PostgreSQL)
- Migracje: `drizzle-kit generate` → `drizzle-kit migrate` — nigdy ręczne SQL
- Drizzle instance z `prepare: false` (wymagane dla Supabase Transaction Pool / pgbouncer)
- Soft delete dla transakcji (`deleted_at`) — zawsze filtruj `isNull(transactions.deletedAt)`

### Import Excel
- Parser: `xlsx` (SheetJS) — zainstalowany w `web/package.json`
- Walidacja każdego wiersza przed insertem
- Import idempotentny — deduplikacja przez `import_hash`
- Błędne wiersze logowane, nie blokują reszty importu
- Zawsze pokaż podgląd przed insertem i czekaj na potwierdzenie

### Middleware / Auth Guard
- `web/middleware.ts` — odświeża session Supabase i przekierowuje niezalogowanych
- Chronione trasy: wszystkie poza `/`, `/login`, `/roadmap`, `/auth/callback`

## Konwencje nazewnictwa

- Pliki komponentów: `PascalCase.tsx`
- Hooki React: `useNazwa.ts`
- API routes: `app/api/[resource]/route.ts` (REST, kebab-case w URL)
- Kolumny w DB: `snake_case`
- Zmienne w TS: `camelCase`
- Kolory marki: `#01581E` (zielony primary), biały bg (light), `#0A0A0A` (dark bg)

## Komendy

```bash
# Praca z aplikacją (z katalogu web/)
cd web && npm run dev           # dev server (port 3000, turbopack)
cd web && npm run build         # build produkcyjny (NODE_ENV=production)
cd web && npm run start         # uruchom build produkcyjny

# Baza danych (Drizzle)
cd web && npm run db:generate   # wygeneruj SQL migracji z diff schematu
cd web && npm run db:migrate    # zastosuj migracje na bazie
cd web && npm run db:push       # push schema (dev bez migracji — używaj ostrożnie)
cd web && npm run db:studio     # Drizzle Studio (przeglądarka DB)

# Backup
# Supabase Dashboard → Project → Settings → Backups
```

## Styl komunikacji z Claude

- Mów po polsku jeśli nie piszę po angielsku
- Przed większymi zmianami zawsze powiedz co planujesz zrobić
- Nie rób "na wszelki wypadek" — tylko to co zostało poproszone
- Jeśli coś jest niejasne, zapytaj ZANIM zaczniesz pisać kod
- Przy imporcie danych — zawsze najpierw pokaż próbkę parsowania, potem dopiero insert

## Zmienne środowiskowe

Plik `web/.env.local` — nigdy nie commituj do gita.

```
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON-KEY]
DATABASE_URL=postgresql://postgres:[HASŁO]@db.[PROJEKT-ID].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
SUPABASE_SERVICE_ROLE_KEY=[SERVICE-ROLE-KEY]
ADMIN_EMAIL=[twoj@email.pl]
OPENAI_API_KEY=[opcjonalnie]
ANTHROPIC_API_KEY=[opcjonalnie]
GOOGLE_API_KEY=[opcjonalnie]
RESEND_API_KEY=[opcjonalnie — powiadomienia email]
```

`.gitignore` musi zawierać `.env.local` — Claude Code pilnuje tego automatycznie.
