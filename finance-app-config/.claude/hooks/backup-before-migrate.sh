#!/bin/bash
# .claude/hooks/backup-before-migrate.sh
# Automatycznie backupuje bazę danych przed każdą migracją

DB_PATH="${DB_PATH:-./finance.db}"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="$BACKUP_DIR/finance_$TIMESTAMP.db"

# Utwórz folder backupów jeśli nie istnieje
mkdir -p "$BACKUP_DIR"

# Backup tylko jeśli baza istnieje
if [ -f "$DB_PATH" ]; then
  cp "$DB_PATH" "$BACKUP_PATH"
  echo "✅ Backup bazy: $BACKUP_PATH" >&2
else
  echo "ℹ️ Baza $DB_PATH nie istnieje jeszcze — backup pominięty" >&2
fi

exit 0
