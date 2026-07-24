# Scrooge — Architektura systemu

## Przegląd architektury

```
┌─────────────────────────────────────────────────────┐
│                    KLIENT (Browser)                  │
│  Next.js RSC + Client Components + PWA Manifest      │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│                 Next.js 15 App Router                │
│         (Vercel / Node.js / Docker)                  │
│                                                      │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │  React Server   │  │   API Route Handlers      │  │
│  │  Components     │  │   (/api/*)                │  │
│  │  (SSR pages)    │  │   (REST endpoints)        │  │
│  └────────┬────────┘  └───────────┬──────────────┘  │
│           │                       │                  │
│  ┌────────▼───────────────────────▼──────────────┐  │
│  │           Drizzle ORM (singleton conn)        │  │
│  └────────────────────────┬───────────────────────┘  │
└───────────────────────────┼─────────────────────────┘
                            │ PostgreSQL wire protocol
┌───────────────────────────▼─────────────────────────┐
│              Supabase (hosted PostgreSQL)             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐   │
│  │ Session     │  │  Auth        │  │  Storage  │   │
│  │ Pooler      │  │  (magic link │  │  (future) │   │
│  │ max 15 conn │  │   / OTP)     │  │           │   │
│  └─────────────┘  └──────────────┘  └───────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Schemat bazy danych

### Tabele główne

```
accounts           — Konta bankowe/gotówkowe/krypto
categories         — Kategorie transakcji (systemowe + użytkownika)
transactions       — Wszystkie transakcje
budgets            — Plany budżetowe (miesiąc × kategoria)
budget_templates   — Szablony budżetów
budget_template_items — Pozycje szablonu
liabilities        — Zobowiązania (kredyty, pożyczki)
user_settings      — Profil i ustawienia użytkownika (imię, nazwisko, plan, isAdmin, itd.)
ai_chat_sessions   — Sesje AI asystenta
feature_requests   — System propozycji funkcji
```

### Tabela inwestycji

```
investments        — Inwestycje (akcje, obligacje, ETF, krypto, metale, itd.)
```

### Tabele modułu Podatki

```
taxes              — Rejestr podatków (PIT, CIT, od nieruchomości...)
tax_payments       — Historia wpłat podatkowych
```

### Tabele modułu Zajęcia egzekucyjne

```
enforcement_proceedings — Zajęcia na rachunkach
enforcement_payments    — Historia spłat zajęć
```

### Tabele celów oszczędnościowych

```
savings_goals      — Cele oszczędnościowe
goal_deposits      — Historia wpłat na cel
```

### Tabela waitlisty

```
waitlist_entries   — Zapisy na listę oczekujących (przed publicznym startem)
```

### Enumy

| Enum | Wartości |
|------|---------|
| `account_type` | bank, cash, crypto, fund, insurance, other |
| `investment_category` | stocks, treasury_bonds, corporate_bonds, etf, deposits, mutual_funds, currencies, precious_metals, art, cryptocurrencies, company_shares, derivatives, other |
| `transaction_type` | income, expense, transfer |
| `category_type` | income, expense, obligation |
| `liability_type` | loan, credit, subscription, installment, personal_loan, bank_loan, company_loan, other |
| `tax_type` | personal_income, corporate, real_estate, land, pcc, investment, capital_gains, other |
| `tax_status` | pending, partially_paid, paid, overdue |
| `interest_type` | statutory, statutory_commercial, contractual, tax, tax_delayed, custom |
| `enforcement_status` | active, partially_paid, satisfied, appealed, suspended |
| `goal_status` | active, completed, cancelled |
| `subscription_plan` | free, basic, pro |

---

## API Reference

### Autentykacja
Wszystkie endpointy wymagają aktywnej sesji Supabase (cookie-based).

### Endpointy

#### Konta
| Method | Path | Opis |
|--------|------|------|
| GET | `/api/accounts` | Lista kont użytkownika |
| POST | `/api/accounts` | Utwórz konto |
| PUT | `/api/accounts/[id]` | Zaktualizuj konto |
| DELETE | `/api/accounts/[id]` | Usuń konto |

#### Inwestycje
| Method | Path | Opis |
|--------|------|------|
| GET | `/api/investments` | Lista inwestycji użytkownika |
| POST | `/api/investments` | Dodaj inwestycję |
| PUT | `/api/investments/[id]` | Edytuj inwestycję |
| DELETE | `/api/investments/[id]` | Usuń inwestycję |

#### Transakcje
| Method | Path | Opis |
|--------|------|------|
| GET | `/api/transactions?month=YYYY-MM` | Lista transakcji |
| POST | `/api/transactions` | Dodaj transakcję |
| PUT | `/api/transactions/[id]` | Edytuj transakcję |
| DELETE | `/api/transactions/[id]` | Usuń (soft delete) |

#### Budżety
| Method | Path | Opis |
|--------|------|------|
| GET | `/api/budgets?month=YYYY-MM` | Budżet na miesiąc |
| POST | `/api/budgets` | Ustaw pozycję budżetową |

#### Szablony budżetów
| Method | Path | Opis |
|--------|------|------|
| GET | `/api/budget/templates` | Lista szablonów |
| POST | `/api/budget/templates` | Utwórz szablon |
| DELETE | `/api/budget/templates/[id]` | Usuń szablon |
| POST | `/api/budget/templates/apply` | Zastosuj szablon do miesiąca |

#### Kategorie
| Method | Path | Opis |
|--------|------|------|
| GET | `/api/categories` | Wszystkie kategorie (systemowe + użytkownika) |
| POST | `/api/categories` | Utwórz kategorię |
| PUT | `/api/categories/[id]` | Edytuj kategorię |
| DELETE | `/api/categories/[id]` | Soft-delete kategorii |

#### Podatki
| Method | Path | Opis |
|--------|------|------|
| GET | `/api/taxes` | Lista podatków |
| POST | `/api/taxes` | Dodaj podatek |
| PUT | `/api/taxes/[id]` | Edytuj podatek |
| DELETE | `/api/taxes/[id]` | Usuń podatek |
| POST | `/api/taxes/[id]/payments` | Dodaj wpłatę |

#### Zajęcia egzekucyjne
| Method | Path | Opis |
|--------|------|------|
| GET | `/api/enforcement` | Lista zajęć |
| POST | `/api/enforcement` | Dodaj zajęcie |
| PUT | `/api/enforcement/[id]` | Edytuj zajęcie |
| DELETE | `/api/enforcement/[id]` | Usuń zajęcie |
| POST | `/api/enforcement/[id]/payments` | Dodaj spłatę częściową |

#### Zobowiązania
| Method | Path | Opis |
|--------|------|------|
| GET | `/api/liabilities` | Lista zobowiązań |
| POST | `/api/liabilities` | Utwórz zobowiązanie |
| PUT | `/api/liabilities/[id]` | Edytuj zobowiązanie |
| DELETE | `/api/liabilities/[id]` | Usuń zobowiązanie |

#### Cele oszczędnościowe
| Method | Path | Opis |
|--------|------|------|
| GET | `/api/goals` | Lista celów |
| POST | `/api/goals` | Utwórz cel |
| PUT | `/api/goals/[id]` | Edytuj cel |
| POST | `/api/goals/[id]` | Dodaj wpłatę |
| DELETE | `/api/goals/[id]` | Usuń cel |

#### Import / Eksport
| Method | Path | Opis |
|--------|------|------|
| POST | `/api/import` | Importuj transakcje (JSON rows) |
| GET | `/api/export?format=excel&type=transactions&month=YYYY-MM` | Eksport Excel/CSV |

#### Waitlist (publiczny, bez autoryzacji)
| Method | Path | Opis |
|--------|------|------|
| POST | `/api/waitlist` | Zapisz się na listę oczekujących (email + imię) |

#### Wykresy
| Method | Path | Opis |
|--------|------|------|
| GET | `/api/charts/category-breakdown?month=YYYY-MM` | Struktura wydatków |
| GET | `/api/charts/income-breakdown?month=YYYY-MM` | Struktura przychodów |
| GET | `/api/charts/monthly-summary?months=6` | Trendy miesięczne |

#### Admin (wymaga isAdmin=true)
| Method | Path | Opis |
|--------|------|------|
| POST | `/api/admin/demo` | Załaduj dane demo |
| DELETE | `/api/admin/demo` | Usuń dane demo |
| GET | `/api/admin/users` | Lista użytkowników (auth.users + userSettings, przez Supabase Admin API) |
| POST | `/api/admin/users` | Utwórz użytkownika (email, imię, nazwisko, waluta, plan) |
| PUT | `/api/admin/users/[id]` | Edytuj profil użytkownika (imię, nazwisko, waluta, plan) |
| DELETE | `/api/admin/users/[id]` | Usuń konto użytkownika (dane finansowe pozostają) |
| PUT | `/api/admin/users/[id]/access` | Zablokuj / zawieś czasowo / odblokuj dostęp (`action: block\|suspend\|unblock`) |
| GET | `/api/admin/waitlist` | Lista zapisów na waitlistę |
| DELETE | `/api/admin/waitlist/[id]` | Usuń wpis z waitlisty |

---

## Connection pooling

Aplikacja używa **singletonu postgres.js** (`globalForDb._pgClient`) aby uniknąć wyczerpania puli połączeń Supabase (limit 15 w session mode).

```typescript
// src/lib/db/index.ts
const globalForDb = global as typeof globalThis & {
  _pgClient?: ReturnType<typeof postgres>;
};

if (!globalForDb._pgClient) {
  globalForDb._pgClient = postgres(process.env.DATABASE_URL!, {
    prepare: false,   // wymagane dla Supabase transaction pooler
    max: 5,           // bezpieczny limit < 15
    idle_timeout: 20,
  });
}
```

---

## Migracje

```bash
# Generuj nową migrację
npm run db:generate -- --name nazwa_migracji

# Zastosuj migracje
npm run db:migrate

# Studio podglądu
npm run db:studio
```

Migracje: `src/lib/db/migrations/`

| Numer | Nazwa | Zawartość |
|-------|-------|-----------|
| 0000 | init | Tabele bazowe: accounts, categories, transactions, budgets, liabilities, user_settings, ai_chat_sessions, feature_requests |
| 0001 | add_taxes_enforcement | Tabele: taxes, tax_payments, enforcement_proceedings, enforcement_payments |
| 0002 | add_savings_goals | Tabele: savings_goals, goal_deposits |
| 0003 | abnormal_wallop | Enum `investment_category`, `liability_type.{personal_loan,bank_loan,company_loan}` |
| 0004 | special_wolverine | Tabela `investments`; cofnięcie `account_type.investment` i kolumny `accounts.investment_category` (inwestycje przeniesione do własnej tabeli) |
| 0005 | cool_squadron_sinister | Enum `subscription_plan`; kolumny `user_settings.{first_name,last_name,plan}` |
| 0006 | thankful_doctor_faustus | Tabela `waitlist_entries` |

---

## Bezpieczeństwo

- Wszystkie API endpointy weryfikują sesję via `supabase.auth.getUser()`
- Dane użytkownika izolowane przez `WHERE user_id = :userId`
- Kategorie systemowe chronione przed usunięciem (`isSystem = true`)
- Panel admina gated przez `userSettings.isAdmin` — sprawdzane zarówno w `src/app/(app)/admin/layout.tsx` (server-side redirect), jak i w każdym API route przez `requireAdmin()` (`src/lib/auth/admin.ts`)
- Zarządzanie kontami (tworzenie, usuwanie, blokowanie, zawieszanie) odbywa się przez Supabase Auth Admin API (`SUPABASE_SERVICE_ROLE_KEY`, `createAdminClient()` w `src/lib/supabase/server.ts`) — blokada/zawieszenie to ustawienie `auth.users.banned_until` (`ban_duration`), bez duplikowania stanu w naszym schemacie
- Import ograniczony do 1000 wierszy na raz
- Eksport ograniczony do zalogowanego użytkownika
- **Next.js: pilnuj wersji.** 15.1.7 miał krytyczne RCE (CVE-2025-66478, CVSS 10.0) i krytyczne ominięcie autoryzacji w middleware (GHSA-f82v-jwr5-mffw, CVSS 9.1) — załatane w 15.5.21 (2026-07-16). Sprawdzaj `npm audit` przy większych zmianach.
- `npm audit` (2026-07-16) pokazuje dodatkowo m.in. `xlsx` (HIGH, brak fixa od SheetJS od dawna — używany tylko do importu Excela, dane wejściowe od zalogowanego użytkownika), `drizzle-orm`, `ws`, `lodash`, `postcss`, `sharp`, `nodemailer` (HIGH) oraz `shell-quote` (CRITICAL, ale wyłącznie transitive dep `drizzle-kit` — dev-only CLI, nie wchodzi do buildu runtime). Do przeglądu osobno, niezależnie od patcha Next.js.

---

## Wdrożenie i podział domen

Jeden deployment na Vercel obsługuje dwie domeny wskazujące na ten sam projekt:

| Domena | Rola |
|--------|------|
| `usescrooge.com` (+ `www.`) | Landing / marketing (`/`, `/pricing`, `/roadmap`) |
| `app.usescrooge.com` | Właściwa aplikacja (logowanie, dashboard, wszystko poza marketingiem) |

Podział realizuje `src/middleware.ts` na podstawie nagłówka `Host` (stała `APEX_HOST`/`APP_HOST`/`MARKETING_PATHS`):
- Na domenie apex każda ścieżka spoza `MARKETING_PATHS` (i spoza `/api/`, `/auth/`, plików statycznych) jest przekierowywana (307) na `app.usescrooge.com` z zachowaniem ścieżki.
- Na `app.usescrooge.com` pusty root (`/`) przekierowuje na `/login`.
- Logika jest nieaktywna dla każdego innego hosta (localhost, podglądy Vercel) — `host` musi dokładnie pasować do jednej z dwóch domen produkcyjnych.

**Ważne:** `middleware.ts` musi leżeć w `src/middleware.ts` (obok `src/app/`), nie w katalogu głównym `web/` — inaczej Next.js go w ogóle nie buduje (brak wpisu `ƒ Middleware` w outpucie `next build`) i cała logika (w tym ten podział domen) po cichu nie działa — aplikacja mimo to wygląda na chronioną, bo `(app)/layout.tsx` ma niezależne, własne sprawdzenie sesji.

Endpointy pod `/api/*` są celowo wyłączone ze sprawdzania sesji w middleware (przekierowanie do HTML `/login` zepsułoby każdy `fetch()` z frontendu) — każdy route sam weryfikuje `supabase.auth.getUser()` i zwraca JSON 401.

`/roadmap` leży poza grupą `(app)/` (własny `src/app/roadmap/layout.tsx`), żeby faktycznie działać jako publiczna trasa zgodnie z `PUBLIC_PATHS`/`MARKETING_PATHS`: zalogowani widzą pełną powłokę aplikacji (`AppShell` — Sidebar/MobileNav, współdzielona z `(app)/layout.tsx`), goście dostają lekki pasek z samym logo. Głosowanie (`POST /api/feature-requests/[id]/vote`) nadal wymaga logowania, przeglądanie i zgłaszanie pomysłów — nie.
