# PORTS.md — AgicraftMC Port Reference

## Правило нумерации портов

### Minecraft-серверы — диапазон `255XX`

Все внутренние порты Minecraft-серверов находятся в диапазоне **255XX**.

| Поддиапазон | Назначение |
| --- | --- |
| `2557X` | Игровые порты серверов (SERVER_PORT) |
| `2558X` | RCON порты серверов (RCON_PORT = игровой порт + 10) |
| `244XX` | Voice chat порты серверов (по серверу) |
| `256XX` | Веб-сервисы серверов (BlueMap, карты и т.п.) |

Последняя цифра в `2557X` — это **ID сервера**:

| ID | Сервер | Игровой порт | RCON порт | Voice chat порт |
| --- | --- | --- | --- | --- |
| 6 | agents (основной) | 25576 | 25586 | 24454 |
| 1 | survival | 25571 | — | — |
| 3 | survivalplus | 25573 | — | — |
| 4 | private | 25574 | 25584 | 24455 |
| 5 | lobby | 25575 | — | — |
| 7 | voice proxy (UDP) | 25577 | — | — |
| 8 | limbo | 25578 | — | — |
| 9 | nanolimbo | 25579 | — | — |

> **RCON правило:** `RCON_PORT = SERVER_PORT + 10`
> Пример: agents SERVER_PORT=25576 → RCON_PORT=25586

### Proxy (Velocity)

Velocity работает в `network_mode: host` — порты биндятся напрямую на хост без Docker NAT.
Это обеспечивает видимость реальных IP игроков.

| Порт | Протокол | Назначение |
| --- | --- | --- |
| 25565 | TCP+UDP | Minecraft Java вход |
| 19132 | UDP | Bedrock Edition (GeyserMC) |
| 25577 | UDP | Voice Chat proxy |

### Прочие сервисы

Все остальные сервисы используют либо стандартные порты, либо назначенные вручную.

---

## Полная таблица портов

### Minecraft — внутренние (Docker network `mc`)

| Порт | Протокол | Сервис | Назначение |
| --- | --- | --- | --- |
| 25565 | TCP+UDP | Velocity (host) | Minecraft Java вход |
| 25576 | TCP | agents | Игровой порт основного сервера |
| 25571 | TCP | survival | Игровой порт survival-сервера |
| 25573 | TCP | survivalplus | Игровой порт survival+-сервера |
| 25574 | TCP | private | Игровой порт private-сервера |
| 25575 | TCP | lobby | Игровой порт лобби-сервера |
| 25577 | UDP | Velocity (host) | Voice Chat proxy порт |
| 25578 | TCP | limbo | Игровой порт limbo-сервера |
| 25579 | TCP | nanolimbo | Игровой порт nanolimbo-сервера |
| 25586 | TCP | agents | RCON порт (=25576+10) |
| 25584 | TCP | private | RCON порт (=25574+10) |
| 24454 | UDP | agents | Voice Chat (плагин) |
| 24455 | UDP | private | Voice Chat (плагин) |
| 5432 | TCP | postgres | PostgreSQL база данных |
| 3000 | TCP | backend | Express.js API |
| 80 | TCP | frontend | React frontend (Nginx внутри) |
| 9000 | TCP | portainer | Portainer Docker UI (только внутри) |

### Внешние порты (проброс на хост)

| Хост:Контейнер | Протокол | Сервис | Назначение |
| --- | --- | --- | --- |
| `25565` | TCP+UDP | Velocity (host) | Minecraft Java вход |
| `19132` | UDP | Velocity (host) | Bedrock Edition (GeyserMC) |
| `25577` | UDP | Velocity (host) | Voice Chat proxy |
| `127.0.0.1:25576:25576` | TCP | agents | Игровой порт (localhost only) |
| `127.0.0.1:25586:25586` | TCP | agents | RCON (localhost only) |
| `127.0.0.1:24454:24454` | UDP | agents | Voice chat (localhost only) |
| `127.0.0.1:25574:25574` | TCP | private | Игровой порт (localhost only) |
| `127.0.0.1:25584:25584` | TCP | private | RCON (localhost only) |
| `127.0.0.1:24455:24455` | UDP | private | Voice chat (localhost only) |
| `25610` | TCP | agents | BlueMap веб-карта |
| `4326` | TCP | rcon-panel | RCON Web Admin UI |
| `4327` | TCP | rcon-panel | RCON Web Admin (второй порт) |

### Через Caddy (agicraftweb проект — внешние)

| Порт | Назначение |
| --- | --- |
| 80 | HTTP → redirect HTTPS |
| 443 | HTTPS (Let's Encrypt), проксирует frontend/backend/панели |

---

## Схема трафика

```text
Игрок (Java)
  → WAN:25565 → Velocity (host network) :25565
    → 127.0.0.1:25576 (agents) / :25574 (private) / :25571 (survival) / ...

Игрок (Bedrock)
  → WAN:19132 → Velocity (host network) :19132 (GeyserMC)

Voice Chat
  → WAN:25577 UDP → Velocity (host) :25577 (proxy)
    → 127.0.0.1:24454 (agents) / :24455 (private)

Веб
  → WAN:443 → Caddy (agicraftweb) → frontend:80 / backend:3000

Карта
  → WAN:25610 → Docker agents:25610 (BlueMap)
```

---

## Velocity server routing (velocity.toml)

```toml
[servers]
agents     = "127.0.0.1:25576"   # основной, default
private    = "127.0.0.1:25574"
nanolimbo  = "127.0.0.1:25579"   # fallback
lobby      = "127.0.0.1:25575"
survival   = "127.0.0.1:25571"
limbo      = "127.0.0.1:25578"
```

---

## Конфигурационные файлы

| Файл | Что там |
| --- | --- |
| `docker-compose.yml` | Все Docker порты |
| `velocity/velocity.toml` | Роутинг Velocity → серверы |
| `agents/config/config/paper-global.yml` | Paper конфиг (velocity forwarding) |
| `agents/config/plugins/BlueMap/webserver.conf` | BlueMap port 25610 |
| `agicraft_backend/src/server.js` | Backend port 3000 |
| `velocity/plugins/voicechat/voicechat-proxy.properties` | Voice chat proxy port 25577 |
