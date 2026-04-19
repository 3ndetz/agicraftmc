# agicraftmc — контекст для AI-агентов

RE-READ THIS FULLY IF THE CONVERSATION WAS SUMMARIZED! Always read this file at the start of every conversation before doing anything else.

> При первом прочтении или после суммаризации — скажи кратко (5-10 слов) выжимку правил. Не повторяй каждый раз.

## Что это

Minecraft-сеть **agicraft**: Velocity-прокси + несколько Paper-серверов (agents — основной, private, lobby, survival, limbo), PostgreSQL, веб-платформа (backend Node.js + frontend React), GeyserMC для Bedrock. Всё крутится в Docker на одном хосте.

## Структура

```text
agicraftmc/
├── velocity/          # Velocity прокси (конфиги + plugins/)
├── agents/            # Paper сервер agents (основной)
│   └── config/        # сконфигурированные плагины и Paper-конфиги
├── private/           # Paper сервер private
├── lobby/, survival/, limbo/, survival_plus/  # остальные Paper серверы
├── agicraft_backend/  # Express API
├── agicraft_frontend/ # React frontend
├── postgres/          # init.sql схемы
├── plugins-common/    # общие jar'ы плагинов для всех Paper серверов
├── docs/              # документация
├── docker-compose.yml # оркестрация
├── deploy.sh          # автодеплой
├── PORTS.md           # таблица портов
└── velocity/velocity.toml  # роутинг прокси → серверы
```

## Как управлять сервером

**Всё что про SSH, scp, прокси для обхода сетевых блоков, права файлов, docker, рестарты, обновление плагинов, бэкапы — смотри [docs/CONTROL.md](docs/CONTROL.md). Обязательно к прочтению перед любой работой с прод-сервером.**

Другие полезные доки:

- [PORTS.md](PORTS.md) — таблица портов и схема трафика
- [docs/BACKUP.md](docs/BACKUP.md) — стратегия бэкапов
- [docs/INITIAL_CONFIGURE.md](docs/INITIAL_CONFIGURE.md) — первоначальная настройка
- [docs/AIRESEARCH.md](docs/AIRESEARCH.md) — контекст про AI-ботов на agents

## STRICT Rules

- **Auto-commit и push после значимых изменений** (если не указано иначе). Пуш в `main` триггерит автодеплой через [deploy.sh](deploy.sh) → `docker compose restart` соответствующих сервисов.
  - **Do NOT add `Co-Authored-By` lines to commit messages.** Ever.
  - **All commits MUST use the owner's author name and email, not AI's.** Never use Anthropic/Claude credentials. Use существующий `git config user.name/email` (автор — `3ndetz`).
  - Префиксуй коммит модулем если применимо: `velocity: ...`, `agents: ...`, `backend: ...`, `docs: ...`.
  - Делай `git pull` периодически — есть параллельные правки от self-hosted runner'а.
- **Перед рестартом Velocity или любого Paper-сервера в проде — предупреждай юзера.** Это разрывает коннекты всех игроков. Для не-аварийных правок — спроси, можно ли сейчас, или жди отмашки.
- **Перед `rm`, `chown -R`, `chmod -R`, `docker compose down`, любой destructive-операцией на проде — подтверждение от юзера.** См. раздел про права в [CONTROL.md](docs/CONTROL.md).
- **Не коммить `.env`, `forwarding.secret`, jar-файлы плагинов, миры, логи.** Смотри `.gitignore`.
- **Для обновления плагина** — следуй пошаговой процедуре из [docs/CONTROL.md](docs/CONTROL.md) (backup старого в `.bak`, затем новый рядом, затем рестарт). Не оставляй две версии одного плагина активными одновременно.
- **Автономность:** если юзер дал задачу — делай её, не расползайся в смежные "заодно улучшения". Если вылезает что-то параллельное и релевантное — спроси, прежде чем делать.

## Tone & style

Сухо, без пафоса. Не писать "powerful / enterprise-grade / production-ready / robust". Коротко и по делу. Если звучит как лендинг стартапа — переписать.

Ответы в чате — минимально достаточные. Короткие апдейты во время работы ок, длинные простыни без запроса — нет.

## Введение в проект (план для AI)

1. Прочитать этот файл (`AGENTS.md`)
2. Прочитать [docs/CONTROL.md](docs/CONTROL.md) — как работать с сервером (SSH, docker, права, плагины)
3. При задаче на правку Minecraft-части — заглянуть в [PORTS.md](PORTS.md) и `velocity/velocity.toml`
4. При задаче на правку веб-части — `agicraft_backend/src/` и `agicraft_frontend/src/`
