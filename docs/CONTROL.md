# CONTROL.md — управление сервером agicraft

Всё что нужно чтобы администрировать прод-сервер. Если работаешь через AI-агента — ему тоже сюда.

---

## Подключение по SSH

```bash
ssh agi
```

Алиас `agi` должен быть прописан в `~/.ssh/config` на локальной машине. Логин сразу попадает в `/home/agicraft/`.

Пользователь на сервере: **`agicraft`** (uid 1002). Состоит в группе `docker` — поэтому команды `docker` / `docker compose` не требуют `sudo`.

Рабочая директория репозитория: **`~/agicraftmc/`**.

### Типичные проблемы

- **SSH-сессия рвётся на длинных операциях** (>1 мин с передачей данных). Используй `nohup ... &` + `disown` чтобы детачить процесс от сессии, либо `screen`/`tmux`. Для копирования файлов предпочитай `scp` — он устойчивее.
- **Сервер не умеет быстро качать с некоторых CDN** (geysermc.org, иногда GitHub release assets) — рейт-лимит или проблемы IPv6-роутинга. Обход: качать локально и заливать через `scp`, или использовать SOCKS-прокси (см. ниже).

---

## SOCKS-прокси для обхода сетевых ограничений

Если сервер не может скачать файл (таймауты, 0 KB/s от geysermc-подобных CDN), можно пустить трафик через юзерский SOCKS:

```bash
# На хосте разработчика должен быть SOCKS на 127.0.0.1:2080
# Пробрасываем его на сервер через SSH -R:
ssh -R 2080:127.0.0.1:2080 agi

# Внутри сессии:
export ALL_PROXY=socks5h://127.0.0.1:2080
curl -fSL -o ... https://...
```

Альтернатива — качать на локалку и заливать через `scp`:

```bash
curl -fSL -o /tmp/plugin.jar "https://..."
scp /tmp/plugin.jar agi:~/agicraftmc/velocity/plugins/
```

---

## Копирование файлов (scp)

```bash
# С локалки на сервер
scp ./file.jar agi:~/agicraftmc/velocity/plugins/

# С сервера на локалку
scp agi:~/agicraftmc/velocity/plugins/file.jar ./

# Директория целиком (рекурсивно)
scp -r ./dir agi:~/path/
```

`scp` значительно надёжнее для больших файлов, чем `curl` в SSH-сессии.

---

## Права и владение

Почти всё в `~/agicraftmc/` принадлежит `agicraft:agicraft`. Есть несколько исключений — некоторые Docker-томы монтируются и создают файлы от `root` или от кастомных uid (itzg-образы). Если видишь `drwxr-xr-x root root` — не ломай, это штатное состояние.

**Критично:**
- Не делай `chmod -R 777` или `chown -R`. Плагины и миры имеют специфичные права, `itzg/minecraft-server` может отказаться стартовать после такого.
- Новые файлы, которые кладёшь в `./*/plugins/` или `./*/config/`, должны быть читаемы пользователем `agicraft` (по дефолту после `scp` — так и есть).
- **`.env`** — `chmod 600`, там секреты (RCON_PASSWORD и т.п.). Никогда не коммить.

### Если файл создан от root (через docker)

```bash
sudo chown agicraft:agicraft <file>
```

Пользователь `agicraft` есть в `sudo`, пароль запросит.

---

## Docker

Всё крутится через `docker compose` из корня репозитория. Конфиг — `docker-compose.yml`.

### Ключевые контейнеры

| Контейнер | Что это | Порт игры |
|---|---|---|
| `minecraft_velocity` | Прокси (Velocity, host network) | 25565 внешний |
| `minecraft_agents` | Основной Paper сервер | 25576 (localhost) |
| `minecraft_private` | Приватный Paper сервер | 25574 (localhost) |
| `minecraft_postgres` | PostgreSQL 16 | 5432 |
| `agicraft_backend` / `agicraft_frontend` | Веб-платформа | 3000 / 80 |
| `backup` | Автобэкапы | — |

Полный список портов — [PORTS.md](../PORTS.md).

### Команды

```bash
# Из ~/agicraftmc/
docker compose ps                          # статус всех контейнеров
docker compose logs -f velocity            # live логи прокси
docker compose logs --tail 100 agents      # последние 100 строк
docker compose restart velocity            # рестарт одного сервиса
docker compose up -d velocity              # поднять (после правки compose)
docker compose down && docker compose up -d  # полный перезапуск (destructive для uptime!)
```

### Рестарт — что ломается

**Velocity-рестарт** разрывает **все** коннекты игроков на всех серверах сети (~5 сек downtime, потом реконнект автоматом). Предупреждай в чате заранее для не-аварийных изменений.

**Отдельный Paper-сервер** (agents/private/etc) — отключит только игроков на нём, Velocity закинет их на fallback (`nanolimbo`).

---

## Обновление плагинов

Общая схема для любого плагина в `velocity/plugins/` или `*/config/plugins/` (для Paper-серверов плагины живут в `/data/plugins`, но конфиги — в `./<server>/config/plugins/`):

1. **Скачать новый jar** (локально или на сервере — см. SOCKS/scp выше).
2. **Переименовать старый** в `.bak` в директории плагинов:
   ```bash
   mv plugin.jar plugin.jar.bak
   ```
   Живой процесс JVM держит классы в памяти — файл на диске можно спокойно переименовать/удалить, падения не будет. Эффект только при следующем рестарте.
3. **Положить новый jar** рядом.
4. **Рестарт** соответствующего контейнера (`docker compose restart <service>`).
5. **Проверить логи** на `error|warn`:
   ```bash
   docker logs minecraft_velocity --tail 100 2>&1 | grep -iE "error|warn|loaded"
   ```
6. Через сутки стабильной работы — удалить `.bak`.

**Опасная ошибка:** оставить в `plugins/` и старый jar, и новый одновременно (оба `.jar`). На рестарте плагин загрузится дважды → конфликт → падение инициализации. Переименовывай старый в `.bak`, не забывай.

---

## Деплой и GitHub

- Репо: push в `main` → GitHub Actions self-hosted runner на сервере делает `git pull` и селективный `docker compose restart`. Логика — в [deploy.sh](../deploy.sh).
- Ручной деплой: `./deploy.sh` (с флагами `--check` для dry-run, `--force` для полного рестарта).
- Бэкапы БД — автоматом перед каждым деплоем через `deploy.sh`.

---

## Бэкапы

- Миры: каждодневные tar.gz через контейнер `backup` (см. [BACKUP.md](BACKUP.md)).
- БД: `deploy.sh` делает `pg_dump` перед каждым обновлением.
- Ручной бэкап мира перед рискованной операцией:
  ```bash
  ssh agi
  cd ~/agicraftmc
  sudo tar czf ~/manual-backup-$(date +%F).tar.gz agents/data/world
  ```

---

## Быстрые проверки здоровья

```bash
# Все контейнеры up?
docker compose ps --format "table {{.Name}}\t{{.Status}}"

# Свободное место (миры растут)
df -h | grep -E "/$|docker"

# Нагрузка
docker stats --no-stream
```
