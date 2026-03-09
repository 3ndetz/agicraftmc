#!/usr/bin/env bash
# ==============================================================================
# Minecraft server backup script — airesearch
# Rotation policy:
#   daily-YYYY-MM-DD.tar.gz  — created every day, kept last 2
#   weekly-YYYY-MM-DD.tar.gz — promoted every Monday, kept last 1
#   monthly-YYYY-MM-DD.tar.gz — promoted on 1st of month, kept last 1
# ==============================================================================
set -euo pipefail

DATE=$(date +%Y-%m-%d)
DOW=$(date +%u)   # 1=Monday ... 7=Sunday
DOM=$(date +%d)   # 01-31

DEST=/backups/airesearch
SRC=/source        # mounted from ./ai_research/data

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

mkdir -p "$DEST"

log "=== Backup started: $DATE ==="

# ------------------------------------------------------------------------------
# Create daily archive
# Backs up: world + all dimension worlds + plugins dynamic data + server JARs
# Excludes: logs, cache, BlueMap rendered tiles (regeneratable, huge)
# ------------------------------------------------------------------------------
ARCHIVE="$DEST/daily-$DATE.tar.gz"

tar -czf "$ARCHIVE" \
    --exclude='./logs' \
    --exclude='./logs/*' \
    --exclude='./cache' \
    --exclude='./cache/*' \
    --exclude='./plugins/BlueMap/web/maps' \
    --warning=no-file-changed \
    -C "$SRC" \
    .

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
