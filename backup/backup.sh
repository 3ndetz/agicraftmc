#!/usr/bin/env bash
# ==============================================================================
# Minecraft server backup script — airesearch
# Rotation policy:
#   daily-YYYY-MM-DD.tar.gz   — created every day, kept last 2
#   weekly-YYYY-MM-DD.tar.gz  — promoted every Monday, kept last 1
#   monthly-YYYY-MM-DD.tar.gz — promoted on 1st of month, kept last 1
# ==============================================================================
set -uo pipefail   # НЕ -e: tar может вернуть 1 если файлы менялись во время архивации (сервер работает)

DATE=$(date +%Y-%m-%d)
DOW=$(date +%u)   # 1=Monday ... 7=Sunday
DOM=$(date +%d)   # 01-31

DEST=/backups/airesearch
SRC=/source        # mounted from ./ai_research/data

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
die() { log "ERROR: $*"; exit 1; }

mkdir -p "$DEST"

log "=== Backup started: $DATE ==="

# ------------------------------------------------------------------------------
# Dump PostgreSQL
# ------------------------------------------------------------------------------
PG_DUMP=/tmp/postgres-backup.sql
log "Dumping PostgreSQL (${POSTGRES_DB})..."
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$POSTGRES_HOST" \
    -U "$POSTGRES_USER" \
    "$POSTGRES_DB" \
    > "$PG_DUMP" || die "pg_dump failed"
log "PostgreSQL dump: $(du -sh "$PG_DUMP" | cut -f1)"

# ------------------------------------------------------------------------------
# Create daily archive
# Исключаем: logs, cache, BlueMap тайлы (регенерируются, огромные)
# tar может вернуть 1 если файл изменился во время архивации — это нормально для живого сервера
# ------------------------------------------------------------------------------
ARCHIVE="$DEST/daily-$DATE.tar.gz"

tar -czf "$ARCHIVE" \
    --exclude='./logs' \
    --exclude='./logs/*' \
    --exclude='./cache' \
    --exclude='./cache/*' \
    --exclude='./plugins/BlueMap/web/maps' \
    -C "$SRC" . \
    -C /tmp postgres-backup.sql
TAR_EXIT=$?

rm -f "$PG_DUMP"

# exit 1 от tar = "файлы менялись" — архив при этом создаётся корректно
# exit 2 = реальная ошибка (нет места, нет прав и т.д.)
if [ "$TAR_EXIT" -gt 1 ]; then
    die "tar failed with exit code $TAR_EXIT (disk full? permission denied?)"
elif [ "$TAR_EXIT" -eq 1 ]; then
    log "WARNING: Some files changed during backup (server was running) — archive is OK"
fi

[ -s "$ARCHIVE" ] || die "Archive is empty or not created: $ARCHIVE"

SIZE=$(du -sh "$ARCHIVE" | cut -f1)
log "Archive created: $ARCHIVE ($SIZE)"

# ------------------------------------------------------------------------------
# Promote to weekly checkpoint on Monday
# ------------------------------------------------------------------------------
if [ "$DOW" = "1" ]; then
    WEEKLY="$DEST/weekly-$DATE.tar.gz"
    cp "$ARCHIVE" "$WEEKLY"
    log "Weekly checkpoint: $WEEKLY"
    # Keep only the latest weekly
    find "$DEST" -name "weekly-*.tar.gz" | sort | head -n -1 | xargs -r rm -v
fi

# ------------------------------------------------------------------------------
# Promote to monthly checkpoint on 1st of month
# ------------------------------------------------------------------------------
if [ "$DOM" = "01" ]; then
    MONTHLY="$DEST/monthly-$DATE.tar.gz"
    cp "$ARCHIVE" "$MONTHLY"
    log "Monthly checkpoint: $MONTHLY"
    # Keep only the latest monthly
    find "$DEST" -name "monthly-*.tar.gz" | sort | head -n -1 | xargs -r rm -v
fi

# ------------------------------------------------------------------------------
# Keep only last 2 daily archives
# ------------------------------------------------------------------------------
DAILY_COUNT=$(find "$DEST" -name "daily-*.tar.gz" | wc -l)
if [ "$DAILY_COUNT" -gt 2 ]; then
    find "$DEST" -name "daily-*.tar.gz" | sort | head -n -2 | xargs -r rm -v
fi

# ------------------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------------------
log "=== Done. Current backups: ==="
find "$DEST" -name "*.tar.gz" | sort | while read -r f; do
    SIZE=$(du -sh "$f" | cut -f1)
    log "  $SIZE  $(basename "$f")"
done
