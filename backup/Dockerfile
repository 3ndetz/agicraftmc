FROM alpine:3.19

# bash for scripting, tar+gzip for archives, tzdata for Moscow time, postgresql-client for pg_dump
RUN apk add --no-cache bash tar gzip tzdata postgresql-client

COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

# Run backup daily at 03:00 Moscow time
# Logs go to stdout so `docker logs mc_backup` works
RUN echo "0 3 * * * /usr/local/bin/backup.sh >> /proc/1/fd/1 2>&1" >> /etc/crontabs/root

ENV TZ=Europe/Moscow

CMD ["crond", "-f", "-l", "6"]
