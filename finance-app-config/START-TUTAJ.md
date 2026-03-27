# 🚀 START TUTAJ — Instrukcja uruchomienia

Wykonaj kroki po kolei. Każdy krok to 5-15 minut.

---

## KROK 1: Instalacja Claude Code

```bash
# Wymagania: Node.js 18+ (sprawdź: node --version)
npm install -g @anthropic-ai/claude-code

# Zaloguj się (otworzy przeglądarkę)
claude login

# Sprawdź czy działa
claude --version
```

---

## KROK 2: Skopiuj pliki konfiguracyjne do projektu

```bash
# Utwórz folder projektu
mkdir ~/scrooge
cd ~/scrooge

# Skopiuj CLAUDE.md (z tego folderu)
cp /ścieżka/do/pobranych/plików/CLAUDE.md .

# Skopiuj folder .claude
cp -r /ścieżka/do/pobranych/plików/.claude .

# Skopiuj .mcp.json
cp /ścieżka/do/pobranych/plików/.mcp.json .

# Nadaj uprawnienia wykonania hookom
chmod +x .claude/hooks/*.sh
```

---

## KROK 3: Podmień swój username w .mcp.json

```bash
# Sprawdź swój username
whoami

# Otwórz .mcp.json i zamień TWOJ_USERNAME na wynik powyższego
# np. /Users/michal/scrooge
```

---

## KROK 4: Zainstaluj MCP serwery

```bash
# Będąc w folderze ~/scrooge:

# MCP dla systemu plików
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem ~/scrooge

# MCP dla SQLite (baza danych)
claude mcp add sqlite -- npx -y @modelcontextprotocol/server-sqlite --db-path ./finance.db

# Sprawdź
claude mcp list
```

---

## KROK 5: Zainicjuj git

```bash
cd ~/Scrooge
git init
echo "node_modules/" > .gitignore
echo "*.db" >> .gitignore
echo "*.db.backup" >> .gitignore
echo "backups/" >> .gitignore
echo ".env" >> .gitignore
git add .
git commit -m "init: konfiguracja Claude Code"
```

---

## KROK 6: Pierwsze uruchomienie Claude Code

```bash
cd ~/scrooge
claude
```

Po uruchomieniu napisz:
```
Cześć! Zacznijmy budować aplikację do finansów osobistych. 
Najpierw zainicjalizuj strukturę projektu zgodnie z CLAUDE.md — 
utwórz foldery backend/ i frontend/, zainstaluj podstawowe zależności 
i skonfiguruj TypeScript w obu.
```

---

## KROK 7: Import Excela (gdy aplikacja jest gotowa)

Gdy backend jest uruchomiony, wrzuć swój plik Excel do folderu projektu, potem:
```
/import-excel ./moje-transakcje.xlsx
```

---

## Przydatne komendy Claude Code

| Komenda | Co robi |
|---------|---------|
| `claude` | Uruchamia interaktywną sesję |
| `claude "zrób X"` | Jednorazowe zadanie |
| `/monthly-report` | Raport budżet vs. realizacja |
| `/import-excel` | Import z Excela |
| `Ctrl+C` | Przerywa bieżące zadanie |
| `/clear` | Czyści kontekst sesji |

---

## Jeśli coś nie działa

**Hook nie odpala się?**
```bash
# Sprawdź uprawnienia
ls -la .claude/hooks/
chmod +x .claude/hooks/*.sh
```

**MCP nie widzi bazy?**
```bash
# Upewnij się że ścieżka do bazy jest absolutna
claude mcp remove sqlite
claude mcp add sqlite -- npx -y @modelcontextprotocol/server-sqlite --db-path ~/scrooge/finance.db
```

**TypeScript errors?**
```bash
cd backend && npx tsc --noEmit
# Popraw błędy zanim przejdziesz dalej
```
