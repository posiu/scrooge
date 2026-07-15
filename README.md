# Scrooge — Domowy Controlling

**Inteligentne narzędzie do zarządzania finansami osobistymi i firmowymi.**

---

## Spis treści

- [Opis projektu](#opis-projektu)
- [Stack technologiczny](#stack-technologiczny)
- [Uruchomienie lokalne](#uruchomienie-lokalne)
- [Funkcjonalności](#funkcjonalności)
- [Struktura projektu](#struktura-projektu)
- [Zmienne środowiskowe](#zmienne-środowiskowe)
- [Import danych](#import-danych)
- [Eksport danych](#eksport-danych)
- [Panel admina](#panel-admina)
- [PWA](#pwa)
- [Roadmap](#roadmap)

---

## Opis projektu

Scrooge to kompleksowy system domowego controllingu, umożliwiający:

- Śledzenie przychodów, wydatków i transferów między kontami
- Planowanie budżetu miesięcznego i rocznego z szablonami
- Zarządzanie zobowiązaniami finansowymi, podatkami i zajęciami egzekucyjnymi
- Wyznaczanie i śledzenie celów oszczędnościowych
- Import transakcji z plików Excel/CSV
- Eksport raportów do Excel/CSV
- AI asystent finansowy

---

## Stack technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Frontend | Next.js 15 (App Router, RSC) |
| Backend API | Next.js Route Handlers |
| ORM | Drizzle ORM |
| Baza danych | Supabase PostgreSQL |
| Autentykacja | Supabase Auth (magic link, OTP) |
| UI / Style | Vanilla CSS + CSS variables |
| Wykresy | Recharts |
| Import | xlsx + papaparse |
| Eksport | xlsx + jsPDF |
| Walidacja | Zod |

---

## Uruchomienie lokalne

```bash
# 1. Zainstaluj zależności
cd web && npm install

# 2. Skopiuj i uzupełnij zmienne środowiskowe
cp .env.example .env.local

# 3. Uruchom migracje DB
npm run db:generate
npm run db:migrate

# 4. Uruchom serwer deweloperski
npm run dev
```

Aplikacja będzie dostępna pod adresem: **http://localhost:3000**

---

## Funkcjonalności

### 📊 Dashboard
- Przegląd miesięczny/roczny: przychody, wydatki, oszczędności, zobowiązania
- Przełącznik miesiąc/rok z nawigacją (`?month=YYYY-MM&mode=month|year`)
- Przełącznik motywu jasny/ciemny
- Bloczek podsumowania podatków i zajęć egzekucyjnych (kwoty do zapłaty, link do szczegółów)
- Wyodrębniona zagregowana wartość inwestycji
- Wykresy: trendy 6-miesięczne, struktura wydatków (pie chart)
- Skróty do kluczowych sekcji

### 💸 Transakcje
- Dodawanie / edycja / usuwanie transakcji
- Filtrowanie po miesiącu, typie, koncie
- Auto-kategoryzacja przy imporcie

### 📅 Budżet
- Miesięczne plany budżetowe per kategoria
- Widok roczny z sumami
- Szablony budżetów (create, apply to month, delete)
- Realizacja budżetu w ujęciu procentowym

### 🏦 Konta
- Konta bankowe, oszczędnościowe, gotówkowe, kryptowalutowe
- Salda i historia transakcji

### 📈 Inwestycje (`/investments`)
- Osobna sekcja menu, analogiczna do Kont
- Dodawanie / edycja / usuwanie inwestycji z bieżącą wartością
- Kategorie: akcje, obligacje skarbowe, obligacje korporacyjne, ETF, lokaty, fundusze inwestycyjne, waluty, metale szlachetne, dzieła sztuki, kryptowaluty, udziały w firmach, instrumenty pochodne, inne
- Podsumowanie łącznej wartości portfela

### 📋 Zobowiązania
- Kredyty, pożyczki (osobista, bankowa, z firmy), karty kredytowe, subskrypcje, raty
- Kalkulator rat i harmonogram spłat

### 🧾 Podatki (`/taxes`)
- Rejestr podatków: PIT, CIT, od nieruchomości, PCC, od inwestycji
- Historia wpłat z auto-aktualizacją statusu
- Statusy: oczekujący, częściowo opłacony, opłacony, zaległy

### ⚖️ Zajęcia egzekucyjne (`/enforcement`)
- Rejestr zajęć na rachunkach
- Kalkulator odsetek ustawowych (live, aktualizowany co sekundę)
- Możliwość ustawienia niestandardowej stopy procentowej
- Historia spłat częściowych

### 🎯 Cele oszczędnościowe (`/goals`)
- Wizualne karty z paskami postępu
- Dodawanie / edycja / usuwanie celów
- Ikony i kolory per cel
- Historia wpłat
- Licznik dni do terminu / przekroczenia

### 📥 Import transakcji (`/import`)
- Obsługuje: `.xlsx`, `.xls`, `.csv`
- Elastyczne mapowanie kolumn (auto-dopasowanie nagłówków po polsku)
- Deduplicacja transakcji (hash: data + kwota + opis)
- Podgląd pierwszych 5 wierszy przed importem
- Obsługiwane formaty daty: `DD.MM.YYYY`, `DD-MM-YYYY`, ISO 8601

### 📤 Eksport raportów
- Excel (`.xlsx`) i CSV
- Transakcje za wybrany miesiąc
- Budżet za wybrany miesiąc
- Dostępny z widoku **Wykresy i raporty** (`/reports`)

### 🤖 AI Asystent (`/ai-chat`)
- Pytania o budżet, trendy, porady finansowe

### 🛡️ Panel admina (`/admin`, tylko `isAdmin=true`)
- **Użytkownicy** (`/admin/users`) — lista wszystkich kont (dane z Supabase Auth + profil z `user_settings`)
  - Dodawanie kont (email, imię, opcjonalnie nazwisko, waluta domyślna, plan)
  - Edycja profilu i zmiana planu abonamentowego (Free / Basic / Pro) w górę i w dół
  - Blokowanie i czasowe zawieszanie dostępu (np. po nieopłaceniu abonamentu) — bez usuwania danych
  - Usuwanie kont (dane finansowe użytkownika pozostają w bazie)
- Zarządzanie kategoriami systemowymi i szablonami budżetów
- Ładowanie / czyszczenie danych demonstracyjnych

### 📱 PWA
- Aplikacja instalowalna na telefonie / komputerze
- Manifest: `/manifest.json`
- Motyw ciemny/jasny z systemem

---

## Struktura projektu

```
web/
├── src/
│   ├── app/
│   │   ├── (app)/           # Chronione strony (wymagają logowania)
│   │   │   ├── dashboard/
│   │   │   ├── transactions/
│   │   │   ├── budget/
│   │   │   ├── accounts/
│   │   │   ├── investments/
│   │   │   ├── liabilities/
│   │   │   ├── taxes/
│   │   │   ├── enforcement/
│   │   │   ├── goals/
│   │   │   ├── import/
│   │   │   ├── reports/
│   │   │   ├── trends/
│   │   │   ├── ai-chat/
│   │   │   ├── settings/
│   │   │   ├── roadmap/
│   │   │   └── admin/            # layout.tsx — server-side isAdmin guard
│   │   │       ├── users/
│   │   │       ├── categories/
│   │   │       ├── templates/
│   │   │       └── page.tsx    # Panel demo data
│   │   ├── api/             # API Route Handlers
│   │   │   ├── accounts/
│   │   │   ├── investments/ (+ /[id])
│   │   │   ├── budgets/
│   │   │   ├── budget/templates/  (+ /apply)
│   │   │   ├── categories/  (+ /[id])
│   │   │   ├── charts/
│   │   │   ├── export/
│   │   │   ├── goals/       (+ /[id])
│   │   │   ├── import/
│   │   │   ├── taxes/       (+ /[id] + /[id]/payments)
│   │   │   ├── enforcement/ (+ /[id] + /[id]/payments)
│   │   │   ├── liabilities/ (+ /[id])
│   │   │   ├── transactions/(+ /[id])
│   │   │   └── admin/
│   │   │       ├── demo/
│   │   │       └── users/   (+ /[id], /[id]/access)
│   │   └── (auth)/          # Strony logowania/rejestracji
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx      # Menu boczne (isAdmin-gated)
│   │   │   ├── MobileNav.tsx
│   │   │   └── Header.tsx
│   │   ├── charts/
│   │   │   ├── DashboardCharts.tsx
│   │   │   ├── ReportExpenseStructure.tsx
│   │   │   ├── ReportIncomeStructure.tsx
│   │   │   └── ReportBudgetVsActual.tsx
│   │   └── dashboard/
│   │       └── DashboardMonthNav.tsx
│   └── lib/
│       ├── db/
│       │   ├── index.ts         # Singleton postgres connection
│       │   ├── schema.ts        # Drizzle schema
│       │   └── migrations/
│       ├── supabase/            # server.ts eksportuje też createAdminClient() (service role)
│       ├── auth/
│       │   └── admin.ts         # requireAdmin() — wspólny guard dla API admina
│       └── utils.ts
└── public/
    └── manifest.json            # PWA manifest
```

---

## Zmienne środowiskowe

Plik: `web/.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[PUBLISHABLE KEY]
SUPABASE_SERVICE_ROLE_KEY=[SECRET KEY]

# Baza danych (Supabase pooler — session mode)
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres

# AI (opcjonalne)
GOOGLE_AI_API_KEY=[KEY]
```

> ⚠️ `DATABASE_URL` musi wskazywać na **pooler** Supabase (`*.pooler.supabase.com`), nie na bezpośrednie połączenie, ze względu na limity połączeń.

---

## Import danych

Ścieżka: **Narzędzia → Import danych** (`/import`)

### Obsługiwane formaty
- `.xlsx` / `.xls` — pliki Excel
- `.csv` — pliki CSV (UTF-8, separator `,` lub `;`)

### Mapowanie kolumn
Aplikacja auto-dopasowuje nagłówki kolumn do pól Scrooge na podstawie popularnych nazw polskich:
- Data: `Data`, `Data transakcji`, `Data operacji`
- Kwota: `Kwota`, `Wartość`, `Kwota operacji`
- Opis: `Opis`, `Tytuł`, `Odbiorca/Zleceniodawca`
- Kategoria: `Kategoria`, `Typ`, `Rodzaj`

### Obsługiwane formaty dat
- `DD.MM.YYYY` (np. `31.12.2025`)
- `DD-MM-YYYY`
- ISO 8601 (`YYYY-MM-DD`)

### Deduplicacja
Duplikaty są wykrywane na podstawie MD5 hash z: `data + kwota + opis`.

---

## Eksport danych

Ścieżka: **Analityka → Wykresy** (`/reports`) → przycisk **Eksport**

### Formaty
- **Excel (.xlsx)** — pełny arkusz z danymi
- **CSV** — plik tekstowy z separatorem `;`

### Typy eksportu
| Typ | Kolumny |
|-----|---------|
| Transakcje | Data, Typ, Kwota, Waluta, Konto, Kategoria, Opis |
| Budżet | Miesiąc, Kategoria, Typ, Planowano |

Eksport jest filtrowany według aktualnie wybranego miesiąca.

---

## Panel admina

Dostępny wyłącznie dla kont z flagą `is_admin = true` w tabeli `user_settings`.

### Funkcje
- **Załaduj dane demo** — wypełnia wszystkie sekcje przykładowymi danymi
- **Usuń dane demo** — czyści dane demo

### Nadanie uprawnień admina
```sql
UPDATE user_settings SET is_admin = true WHERE user_id = '[UUID_UŻYTKOWNIKA]';
```

---

## PWA

Aplikacja jest w pełni instalowalna jako PWA (Progressive Web App):

1. W Chrome/Edge: kliknij ikonę instalacji w pasku adresu
2. Na iOS: Safari → Udostępnij → Dodaj do ekranu głównego

Manifest: [`/manifest.json`](./web/public/manifest.json)

---

## Roadmap

| Status | Funkcja |
|--------|---------|
| ✅ DONE | Import transakcji z Excel/CSV |
| ✅ DONE | Auto-kategoryzacja (fuzzy match) |
| ✅ DONE | Eksport Excel/CSV |
| ✅ DONE | Budżetowanie miesięczne z szablonami |
| ✅ DONE | Cele oszczędnościowe |
| ✅ DONE | Podatki i zajęcia egzekucyjne |
| ✅ DONE | Kalkulator odsetek (statutory + custom rate) |
| ✅ DONE | Dashboard z przełącznikiem miesięcy i widokiem rocznym |
| ✅ DONE | PWA manifest |
| ✅ DONE | Interaktywne kategorie i szablony budżetów |
| ✅ DONE | Pełna edycja i usuwanie elementów (konta, transakcje, zobowiązania, podatki, zajęcia) |
| ✅ DONE | Klikalny kalendarz w widoku budżetu z przejściem do dnia transakcji |
| 🔄 IN PROGRESS | AI asystent finansowy |
| 📋 PLANNED | Transakcje cykliczne (subskrypcje, raty) |
| 📋 PLANNED | Powiadomienia o przekroczeniu budżetu |
| 📋 PLANNED | Raport PDF |
| 📋 PLANNED | Porównania miesiąc do miesiąca |
| 📋 PLANNED | Aplikacja mobilna (React Native) |
