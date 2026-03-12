#!/bin/sh
# Запускает тестовый бэкап при старте контейнера, потом запускает crond
# Так сразу видно в логах что всё работает (или в чём ошибка)

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Container started. Running initial backup to verify setup..."
/usr/local/bin/backup.sh
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Initial backup done. Starting cron daemon (daily at 03:00 MSK)."

exec crond -f -l 6
