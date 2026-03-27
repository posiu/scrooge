#!/bin/bash
# .claude/hooks/guard-database.sh
# Blokuje destruktywne operacje na bazie danych finansowych
# Odpala się jako PreToolUse hook dla wszystkich komend Bash

# Czyta komendę ze stdin (Claude Code przekazuje JSON)
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null)

# Niebezpieczne wzorce SQL
DANGEROUS_PATTERNS=(
  "DROP TABLE"
  "DROP DATABASE"
  "DELETE FROM transactions"
  "TRUNCATE"
  "DELETE FROM accounts"
  "DELETE FROM budgets"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qi "$pattern"; then
    echo "{\"decision\": \"block\", \"reason\": \"🛡️ ZABLOKOWANO: Komenda zawiera destruktywną operację SQL: '$pattern'. Jeśli to zamierzone, wykonaj ręcznie po backupie bazy.\"}"
    exit 2
  fi
done

exit 0
