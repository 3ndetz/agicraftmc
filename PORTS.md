# PORTS.md — NetTyanMC Port Reference

## Правило нумерации портов

### Minecraft-серверы — диапазон `255XX`

Все внутренние порты Minecraft-серверов находятся в диапазоне **255XX**.

| Поддиапазон | Назначение |
| --- | --- |
| `2557X` | Игровые порты серверов (SERVER_PORT) |
| `2558X` | RCON порты серверов (RCON_PORT = игровой порт + 10) |
| `256XX` | Веб-сервисы серверов (BlueMap, карты и т.п.) |

Последняя цифра в `2557X` — это **ID сервера**:

| ID | Сервер | Игровой порт | RCON порт |
| --- | --- | --- | --- |
| 0 | airesearch (основной) | 25570 | 25580 |
| 1 | survival | 25571 | — |
| 3 | survivalplus | 25573 | — |
| 4 | private | 25574 | — |
| 5 | lobby | 25575 | — |
| 7 | voice proxy (UDP) | 25577 | — |
| 8 | limbo | 25578 | — |
| 9 | nanolimbo | 25579 | — |

> **RCON правило:** `RCON_PORT = SERVER_PORT + 10`
> Пример: airesearch SERVER_PORT=25570 → RCON_PORT=25580

### Proxy / Docker host mapping

Velocity внутри контейнера слушает стандартный `25565`.
На хост он маппится как `25500:25565`, чтобы gobetween/nginx мог форвардить реальный IP через HAProxy-протокол.

### Прочие сервисы

Все остальные сервисы используют либо стандартные порты, либо назначенные вручную.

---

## Полная таблица портов

### Minecraft — внутренние (Docker network `mc`)

| Порт | Протокол | Сервис | Назначение |
| --- | --- | --- | --- |
| 25565 | TCP | Velocity (internal) | Стандартный Minecraft Java порт внутри контейнера |
| 25570 | TCP | airesearch | Игровой порт основного сервера |
| 25571 | TCP | survival | Игровой порт survival-сервера |
| 25573 | TCP | survivalplus | Игровой порт survival+-сервера |
| 25575 | TCP | lobby | Игровой порт лобби-сервера |
| 25577 | UDP | Velocity | Plasmo Voice Chat proxy порт |
| 25578 | TCP | limbo | Игровой порт limbo-сервера |
| 25579 | TCP | nanolimbo | Игровой порт nanolimbo-сервера |
| 25580 | TCP | airesearch | RCON порт (=25570+10) |
| 24454 | UDP | airesearch/Velocity | Plasmo Voice Chat (плагин) |
| 5432 | TCP | postgres | PostgreSQL база данных |
| 3000 | TCP | backend | Express.js API |
| 80 | TCP | frontend | React frontend (Nginx внутри) |
| 9000 | TCP | portainer | Portainer Docker UI (только внутри) |

### Minecraft — внешние (проброс на хост)

| Хост:Контейнер | Протокол | Сервис | Назначение |
| --- | --- | --- | --- |
| `25500:25565` | TCP | Velocity | Java Minecraft вход (gobetween/nginx → 25500 → Velocity) |
| `25565:25565` | UDP | Velocity | Minecraft query протокол (server list ping) |
| `19133:19132` | UDP | Velocity | Bedrock Edition (через GeyserMC) |
| `24454:24454` | UDP | Velocity | Plasmo Voice Chat |
| `25577:25577` | UDP | Velocity | Voice Chat proxy |
| `25571:25565` | TCP | survival | Прямой доступ к серверу (debug/тест) |
| `25573:25565` | TCP | survivalplus | Прямой доступ к серверу (debug/тест) |
| `25575:25565` | TCP | lobby | Прямой доступ к серверу (debug/тест) |
| `25610:25610` | TCP | airesearch | BlueMap веб-карта |

### Веб-панели и утилиты (внешние)

| Порт | Сервис | URL | Назначение |
| --- | --- | --- | --- |
| 8090 | filebrowser | `http://<ip>:8090` | Веб файловый менеджер (JAR, миры, конфиги) |
| 4326 | rcon-panel | `http://<ip>:4326` | RCON Web Admin UI |
| 4327 | rcon-panel | `http://<ip>:4327` | RCON Web Admin (второй порт) |
| 25610 | BlueMap | `http://<ip>:25610` | Живая 3D-карта мира |

### Через Caddy (nettyanweb проект — внешние)

| Порт | Назначение |
| --- | --- |
| 80 | HTTP → redirect HTTPS |
| 443 | HTTPS (Let's Encrypt), проксирует frontend/backend/панели |

### Gobetween (опционально, вне Docker)

| Порт | Назначение |
| --- | --- |
| 25565 | Load balancer → `localhost:25500` (Java, HAProxy protocol) |
| 19132 | Load balancer → `localhost:19133` (Bedrock) |

---

## Схема трафика

```text
Игрок (Java)
  → WAN:25565 → gobetween:25565 (HAProxy protocol)
    → host:25500 → Docker Velocity:25565
      → airesearch:25570 / survival:25571 / lobby:25575 / ...

Игрок (Bedrock)
  → WAN:19132 → gobetween:19132
    → host:19133 → Docker Velocity:19132 (GeyserMC)

Voice Chat
  → WAN:24454 UDP → Docker Velocity:24454
  → WAN:25577 UDP → Docker Velocity:25577 (proxy)

Веб
  → WAN:443 → Caddy (nettyanweb) → frontend:80 / backend:3000

Карта
  → WAN:25610 → Docker airesearch:25610 (BlueMap)

Файлы (admin)
  → WAN:8090 → Docker filebrowser:80
```

---

## Velocity server routing (velocity.toml)

```toml
[servers]
airesearch = "airesearch:25570"   # основной, default
nanolimbo  = "localhost:25579"    # fallback
lobby      = "lobby:25575"
survival   = "survival:25571"
limbo      = "limbo:25578"
```

---

## Конфигурационные файлы

| Файл | Что там |
| --- | --- |
| `docker-compose.yml` | Все Docker порты |
| `velocity/velocity.toml` | Роутинг Velocity → серверы |
| `ai_research/config/plugins/BlueMap/webserver.conf` | BlueMap port 25610 |
| `backend/src/server.js` | Backend port 3000 |
| `backend/.env.example` | POSTGRES_PORT=5432 |
| `gobetween.toml` | Внешний LB порты 25565/19132 |
| `caddyfile.example` | HTTPS 80/443 + RCON 25580 |
