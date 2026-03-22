# NetTyan Minecraft Server

Полнофункциональный Minecraft сервер с веб-интерфейсом, системой донатов и AI Research платформой.

TODO - ПОРТЫ И СЕРВИСЫ ОБНОВИЛИСЬ, И ДОКА ТОЖЕ, ОБНОВИТЬ!! НАПРИМЕР ПРО МАНИФЕСТЫ ПЛАГИНОВ НАДО УКАЗАТЬ

ТАКЖЕ ЗДЕСЬ НЕ АКТУАЛЬНА ДОКА И ПУТИ К НЕЙ И ПУТИ К СЕРВАКАМ
И АКТУАЛЬНЫХ СЕРВЕРА СЕЙЧАС ТОЛЬКО 2: proxy и ai research! Остальные все не используются!!

---

## Архитектура

```
Velocity Proxy (25565)
    ├─> Lobby (25569) - Точка входа с авторизацией
    ├─> Survival (25571) - Классический выживание
    ├─> Agents (25576) - Сервер для AI ботов
    └─> Survival+ (25572) - В разработке

PostgreSQL (5432) - Единая БД
Backend API (3000) - REST API
Frontend (80) - Веб-сайт
Caddy (nettyanweb) - HTTPS Reverse Proxy
```

**Интеграция с nettyanweb:**
Проект использует Caddy из репозитория [nettyanweb](https://github.com/kragger-ra/nettyanweb) для HTTPS и reverse proxy. Backend и frontend подключаются к сети `nettyan_ssl`.

---

## Быстрый старт

### 1. Клонировать репозиторий

```bash
git clone https://github.com/kragger-ra/NetTyanMC.git
cd NetTyanMC
```

### 2. Следовать инструкции

**Подробная инструкция:** [docs/POST_CLONE_SETUP.md](docs/POST_CLONE_SETUP.md)

Кратко:
1. Скачать Java 21+ и Docker
2. **Не нужно** скачивать Paper/Velocity JAR - автоматически через itzg/minecraft-server
3. Скачать плагины (список в docs/POST_CLONE_SETUP.md)
4. Создать `.env` из `.env.example`
5. Убедиться что nettyanweb развернут и сеть `nettyan_ssl` создана
6. Запустить: `docker-compose up -d`

---

## Документация

**Вся документация находится в папке [docs/](docs/)**

| Документ | Описание |
|----------|----------|
| **[docs/POST_CLONE_SETUP.md](docs/POST_CLONE_SETUP.md)** | Полная инструкция развертывания после клонирования |
| [docs/STATUS.md](docs/STATUS.md) | Текущий статус проекта и выполненные задачи |
| [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | Детальное руководство по развертыванию |
| [docs/LUCKPERMS_SETUP.md](docs/LUCKPERMS_SETUP.md) | Система ролей и прав (команды для настройки) |
| [docs/HTTPS_SETUP.md](docs/HTTPS_SETUP.md) | Настройка HTTPS с Let's Encrypt |
| [docs/RUNNER_SETUP.md](docs/RUNNER_SETUP.md) | Настройка GitHub Actions Self-Hosted Runner |
| [docs/CRAFTY_CONTROLLER.md](docs/CRAFTY_CONTROLLER.md) | Веб-панель управления серверами |
| [docs/BACKUP_GUIDE.md](docs/BACKUP_GUIDE.md) | Стратегия резервного копирования |
| [docs/MONITORING_GUIDE.md](docs/MONITORING_GUIDE.md) | Мониторинг и алерты |
| [docs/SECURITY_GUIDE.md](docs/SECURITY_GUIDE.md) | Безопасность и secrets management |

**Полный список документации:** [docs/README.md](docs/README.md)

---

## Технологии

### Minecraft инфраструктура
- **itzg/minecraft-server** - Docker образ для Minecraft серверов
- **Paper 1.21.1** - серверное ядро (автозагрузка)
- **Velocity** - прокси-сервер (автозагрузка)
- **PostgreSQL 16** - база данных
- **Docker** - контейнеризация

### Плагины
- **LuckPerms** - система прав
- **AuthMe** - авторизация (Lobby)
- **WorldGuard / WorldEdit** - защита регионов
- **EssentialsX** - базовые команды
- **PlayerPoints** - валюта (AgiCoins)
- **ShopGUIPlus** - магазин
- **DecentHolograms / FancyNpcs** - NPC и голограммы

### Веб-платформа
- **Backend:** Node.js, Express, JWT, YooKassa API
- **Frontend:** React, Vite, Zustand
- **Reverse Proxy:** Caddy из nettyanweb (авто SSL через Let's Encrypt)

---

## Структура проекта

```
NetTyanMC/
├── lobby/               # Lobby сервер (itzg/minecraft-server)
│   └── config/          # Конфиги плагинов (AuthMe, LuckPerms, и т.д.)
├── survival/            # Survival сервер (itzg/minecraft-server)
│   └── config/          # Конфиги плагинов
├── agents/         # AI Research сервер (itzg/minecraft-server)
│   └── config/
├── velocity/            # Velocity прокси (itzg/minecraft-server)
│   └── config/
├── backend/             # Backend API
│   ├── src/
│   └── package.json
├── frontend/            # React frontend
│   ├── src/
│   └── package.json
├── postgres/            # PostgreSQL схемы
│   └── init.sql
├── scripts/             # Утилиты и скрипты
│   ├── backup.sh
│   └── generate-secrets.sh
├── docs/                # Документация
│   ├── README.md        # Оглавление документации
│   └── *.md             # Руководства
├── .github/             # CI/CD workflows
│   └── workflows/
├── docker-compose.yml   # Оркестрация всех сервисов
└── .gitignore           # Исключения Git

# Paper/Velocity JAR автоматически загружаются через itzg образ
# Миры и данные хранятся в именованных Docker volumes
```

---

## Требования

- **Java:** 21+
- **Docker:** 20.10+ и Docker Compose
- **RAM:** Минимум 24GB
  - Velocity: 1GB
  - Lobby: 2GB
  - Survival: 10GB
  - AI Research: 10GB
  - PostgreSQL: 512MB
  - Backend: 512MB
- **Диск:** 10GB+ свободно (без учета миров)
- **nettyanweb:** Развернутый репозиторий с Caddy


## Автоматический деплой

Проект настроен на автоматический деплой через GitHub Actions с self-hosted runner:

- Push в main автоматически пересобирает и перезапускает сервисы
- Secrets автоматически создаются в .env из GitHub Secrets
- Timeout защита - git pull прерывается через 30 секунд если зависает

Подробнее: docs/RUNNER_SETUP.md
