# ARCHITECTURE.md — Scrooge Architecture

System zarządzania finansami osobistymi Scrooge.

## Stack Technologiczny

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Supabase) + Drizzle ORM
- **Frontend**: React + Vite + Tailwind CSS
- **Validation**: Zod
- **Runner**: tsx

## Struktura Projektu

- `/backend`: Serwer Express, definicje bazy danych, endpointy REST.
- `/frontend`: Aplikacja React (UI).
- `/finance-app-config`: Dokumentacja i pliki startowe.

## Architektura Backend (v1.0)

Serwer Express jest zbudowany w sposób modularny:
- `/src/index.ts`: Entry point, konfiguracja middleware i mountowanie routerów.
- `/src/db`: Konfiguracja połączenia, migracje i schemat (Drizzle).
- `/src/routes`: Logika endpointów podzielona na moduły (accounts, categories, transactions).

### Schemat Bazy Danych

#### `accounts`
Przechowuje konta finansowe użytkownika.
- `id` (serial PK)
- `name` (text, NOT NULL)
- `type` (enum: bank, cash, crypto, fund, insurance, other)
- `currency` (text, default 'PLN')
- `institution` (text, bank/instytucja)
- `description` (text)

#### `categories`
Hierarchiczne kategorie wydatków/przychodów.
- `id` (serial PK)
- `name` (text, NOT NULL)
- `type` (enum: income, expense, obligation)
- `parentId` (references categories.id)

#### `transactions`
Główna tabela operacji finansowych.
- `id` (serial PK)
- `accountId` (references accounts.id, NOT NULL)
- `categoryId` (references categories.id)
- `amount` (text, NOT NULL) — kwota jako tekst (numeric 12,2)
- `type` (enum: income, expense, obligation)
- `currency` (text, default 'PLN')
- `description` (text)
- `date` (timestamp, defaultNow)

---
*Ostatnia aktualizacja: 2026-03-27*
