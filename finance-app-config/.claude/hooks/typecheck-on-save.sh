#!/bin/bash
# .claude/hooks/typecheck-on-save.sh
# Uruchamia TypeScript check po zapisaniu pliku .ts/.tsx

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('path',''))" 2>/dev/null)

# Sprawdź tylko pliki TS/TSX
if [[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.tsx ]]; then
  exit 0
fi

# Określ czy to backend czy frontend
if [[ "$FILE_PATH" == *"/backend/"* ]]; then
  DIR="backend"
elif [[ "$FILE_PATH" == *"/frontend/"* ]]; then
  DIR="frontend"
else
  exit 0
fi

# Uruchom tsc --noEmit (tylko sprawdzenie typów, bez buildu)
if [ -f "$DIR/tsconfig.json" ]; then
  cd "$DIR"
  RESULT=$(npx tsc --noEmit 2>&1)
  if [ $? -ne 0 ]; then
    echo "⚠️ TypeScript errors w $DIR:" >&2
    echo "$RESULT" | head -20 >&2
  fi
fi

exit 0
