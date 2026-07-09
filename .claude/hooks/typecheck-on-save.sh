#!/bin/bash
# .claude/hooks/typecheck-on-save.sh
# Uruchamia TypeScript check po zapisaniu pliku .ts/.tsx

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null)

# Sprawdź tylko pliki TS/TSX
if [[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.tsx ]]; then
  exit 0
fi

# Sprawdź czy plik należy do katalogu web/
if [[ "$FILE_PATH" != *"/web/"* ]]; then
  exit 0
fi

# Uruchom tsc --noEmit (tylko sprawdzenie typów, bez buildu)
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
if [ -f "$PROJECT_ROOT/web/tsconfig.json" ]; then
  cd "$PROJECT_ROOT/web"
  RESULT=$(npx tsc --noEmit 2>&1)
  if [ $? -ne 0 ]; then
    echo "⚠️ TypeScript errors w web/:" >&2
    echo "$RESULT" | head -20 >&2
  fi
fi

exit 0
