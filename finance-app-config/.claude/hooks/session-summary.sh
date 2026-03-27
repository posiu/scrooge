#!/bin/bash
# .claude/hooks/session-summary.sh
# Wyświetla podsumowanie po zakończeniu zadania przez Claude

echo "" >&2
echo "─────────────────────────────────────" >&2
echo "📋 SESJA ZAKOŃCZONA" >&2
echo "─────────────────────────────────────" >&2

# Pokaż zmienione pliki (jeśli jesteśmy w git repo)
if git rev-parse --git-dir > /dev/null 2>&1; then
  CHANGED=$(git status --short 2>/dev/null)
  if [ -n "$CHANGED" ]; then
    echo "📝 Zmienione pliki:" >&2
    echo "$CHANGED" >&2
  fi
fi

echo "─────────────────────────────────────" >&2

exit 0
