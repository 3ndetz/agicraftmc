FROM alpine:3.19

# bash for scripting, tar+gzip for archives, tzdata for Moscow time, postgresql-client for pg_dump
RUN apk add --no-cache bash tar gzip tzdata postgresql-client

COPY backup.sh /usr/local/bin/backup.sh
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /usr/local/bin/backup.sh /entrypoint.sh

# Run backup daily at 03:00 Moscow time
# TZ= inline гарантирует правильный timezone внутри cron-задачи
RUN echo "0 3 * * * TZ=Europe/Moscow /usr/local/bin/backup.sh >> /proc/1/fd/1 2>&1" >> /etc/crontabs/root

ENV TZ=Europe/Moscow

ENTRYPOINT ["/entrypoint.sh"]
