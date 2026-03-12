FROM alpine:3.19

# bash for scripting, tar+gzip for archives, tzdata for Moscow time, postgresql-client for pg_dump
RUN apk add --no-cache bash tar gzip tzdata postgresql-client

COPY backup.sh /usr/local/bin/backup.sh
# Strip Windows CRLF line endings — иначе shebang #!/usr/bin/env bash\r ломает запуск
RUN sed -i 's/\r$//' /usr/local/bin/backup.sh && chmod +x /usr/local/bin/backup.sh

# Run backup daily at 03:00 Moscow time
# TZ= inline гарантирует правильный timezone внутри cron-задачи
RUN echo "0 3 * * * TZ=Europe/Moscow /usr/local/bin/backup.sh >> /proc/1/fd/1 2>&1" >> /etc/crontabs/root

ENV TZ=Europe/Moscow

# Run initial backup on startup, then hand off to cron
# || true чтобы crond стартовал даже если первый бэкап упал
CMD ["/bin/bash", "-c", "echo '[startup] Running initial backup...' && /usr/local/bin/backup.sh || echo '[startup] Initial backup failed, check logs above'; echo '[startup] Starting cron daemon (daily at 03:00 MSK)'; exec crond -f -l 6"]
