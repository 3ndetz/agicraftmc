# Полное руководство по развертыванию AgiCraft

Это полное руководство охватывает развертывание всего стека AgiCraft: Minecraft серверы, Backend API, Frontend сайт, база данных.

## Содержание

1. [Быстрый старт](#быстрый-старт)
2. [Minecraft серверы](#minecraft-серверы)
3. [Backend API](#backend-api)
4. [Frontend сайт](#frontend-сайт)
5. [Плагины и настройки](#плагины-и-настройки)
6. [Тестирование](#тестирование)

---

## Быстрый старт

### 1. Требования

- **Docker 20.10+** и Docker Compose
- **RAM:** 28GB minimum
  - Survival: 10GB
  - AI Research: 10GB
  - Lobby: 2GB
  - Velocity: 1GB
  - PostgreSQL: 1GB
  - Backend: 2GB
  - Frontend: 1GB
- **Диск:** 50GB свободного места
- **ОС:** Windows 10/11 или Linux

### 2. Скачать необходимые файлы

**Paper 1.21.1:**
```bash
# Скачать с https://papermc.io/downloads/paper
# Положить в:
lobby/paper.jar
survival/paper.jar
ai_research/paper.jar
```

**Velocity 3.4.0+:**
```bash
# Скачать с https://papermc.io/downloads/velocity
# Положить в:
velocity/velocity.jar
```

**Плагины (см. LOBBY_SETUP.md для полного списка):**
- LuckPerms
- WorldGuard / WorldEdit
- EssentialsX
- AuthMe (для Lobby с bypass для AI групп)
- PlayerPoints (для AgiCoins)
- ShopGUIPlus (магазин рангов)
- DecentHolograms / FancyNpcs (для лобби)
- TAB (опционально)

### 3. Настроить переменные окружения

Создайте файл `.env` в корне проекта:

```env
# PostgreSQL
POSTGRES_DB=minecraft_server
POSTGRES_USER=mcserver
POSTGRES_PASSWORD=StrongPass123!

# Backend
JWT_SECRET=your_super_secret_jwt_key_change_this
NODE_ENV=production

# YooKassa (тестовый режим)
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key

# RCON
RCON_PASSWORD=your_rcon_password

# Memory
SURVIVAL_MEMORY=10G
AI_RESEARCH_MEMORY=10G
LOBBY_MEMORY=2G
```

### 4. Запустить все сервисы

```bash
# Запустить весь стек
docker-compose up -d

# Проверить статус
docker-compose ps

# Просмотреть логи
docker-compose logs -f
```

Ждите **2-3 минуты** для полной инициализации всех сервисов.

---

## Minecraft серверы

### Lobby (Лобби)

**Адрес:** lobby:25569 (внутренний)
**Роль:** Точка входа для всех игроков

**Первый запуск:**

```bash
docker attach minecraft_lobby
```

См. полную инструкцию: **[LOBBY_SETUP.md](LOBBY_SETUP.md)**

Основные шаги:
1. Создать платформу spawn 20x20 на Y=100
2. Настроить WorldGuard защиту
3. Создать NPC для телепортации на серверы
4. Настроить голограммы с онлайном

**Плагины:**
- Paper 1.21.1
- LuckPerms (PostgreSQL sync)
- WorldGuard / WorldEdit
- DecentHolograms
- FancyNpcs
- TAB (опционально)
- EssentialsX

### Survival (Выживание)

**Адрес:** survival:25571 (внутренний)
**Роль:** Классический survival с экономикой

**Настройка:**

```bash
docker attach minecraft_survival
```

Команды:
```bash
# Настройка spawn point
mvtp world
tp 0 70 0

# Установить world spawn
setworldspawn 0 70 0

# Настройка spawn protection (опционально)
rg define spawn_protection -50 0 -50 50 256 50
rg flag spawn_protection greeting "&aДобро пожаловать на Survival!"
```

**Плагины:**
- PlayerPoints (AgiCoins валюта)
- ShopGUIPlus (магазин рангов)
- Vault (экономика API)
- EssentialsX
- WorldGuard / WorldEdit
- Multiverse-Core

**Примечание:** Авторизация теперь на Lobby сервере (AuthMe убрана с Survival)

### AI Research

**Адрес:** airesearch:25570 (прямой доступ)
**Роль:** Сервер для тестирования AI ботов

**Настройка:**

См. **[AI_RESEARCH_SETUP.md](AI_RESEARCH_SETUP.md)**

Основные шаги:
1. Защита спавна (50x50 в Нижнем мире)
2. End - полная анархия (без защиты)
3. Права только для ai_research / ai_person

**Плагины:**
- LuckPerms
- WorldGuard
- EssentialsX

### Survival+ (Заглушка)

**Адрес:** survivalplus:25572
**Статус:** Placeholder (не запущен)

Минимальная конфигурация для будущего сервера.

---

## Backend API

**Адрес:** http://localhost:3000
**Технологии:** Node.js, Express, PostgreSQL

### Функции

- ✅ Регистрация и авторизация (JWT)
- ✅ Управление балансом AgiCoins
- ✅ Покупка через YooKassa
- ✅ RCON интеграция

### Запуск

```bash
# Через Docker (рекомендуется)
docker-compose up -d backend

# Локально (для разработки)
cd backend
npm install
cp .env.example .env
npm start
```

### API Endpoints

Полная документация: **[backend/README.md](backend/README.md)**

Основные endpoints:
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/user/profile` - Профиль
- `GET /api/payment/products` - Список продуктов
- `POST /api/payment/create` - Создать платёж

### Проверка работы

```bash
# Health check
curl http://localhost:3000/health

# Регистрация тестового пользователя
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "minecraft_nickname": "TestUser"
  }'
```

---

## Frontend сайт

**Адрес:** http://localhost:80
**Технологии:** React 18, Vite, Zustand

### Функции

- ✅ Главная страница (описание серверов)
- ✅ Регистрация / Вход
- ✅ Личный кабинет (баланс, история)
- ✅ Донат магазин (ранги, AgiCoins)
- ✅ Новости

### Запуск

```bash
# Через Docker (рекомендуется)
docker-compose up -d frontend

# Локально (для разработки)
cd frontend
npm install
npm run dev  # Откроется на http://localhost:3001
```

### Структура

Полная документация: **[frontend/README.md](frontend/README.md)**

```
frontend/
├── src/
│   ├── pages/        # Home, Login, Register, Profile, Bots, Donate, News
│   ├── components/   # Header, Footer
│   ├── services/     # API клиент (axios)
│   └── store/        # State management (zustand)
├── Dockerfile        # Multi-stage build
└── nginx.conf        # Nginx proxy
```

---

## Плагины и настройки

### LuckPerms (система ролей)

Полная инструкция: **[LUCKPERMS_SETUP.md](LUCKPERMS_SETUP.md)**

**Донатные группы:**
```
default → new → helper → starter → vip → premium → elite → legend
```

**Служебные группы:**
- `ai_research` - доступ к AI Research серверу
- `ai_person` - AI боты (bypass авторизации)
- `netfather` - владелец (все права)

**Команды настройки:**

```bash
# Подключиться к Velocity консоли
docker attach minecraft_velocity

# Создать группы
/lp creategroup new
/lp creategroup helper
/lp creategroup ai_research
/lp creategroup ai_person

# Установить веса
/lp group new weight 10
/lp group helper weight 20
/lp group ai_research weight 5

# Настроить права
/lp group new permission set essentials.sethome.multiple.home1 true
/lp group helper permission set essentials.fly true

# ai_person автовход на AI Research
/lp group ai_person meta set velocity.default-server ai_research
```

### PlayerPoints (AgiCoins)

Конфигурация: `survival/plugins/PlayerPoints/config.yml`

**Основные команды:**

```bash
# Проверить баланс
/points

# Перевести другому игроку
/points pay <nickname> <amount>

# Админ: выдать AgiCoins
/points give <nickname> <amount>
```

**Интеграция с веб-сайтом:**

После покупки через YooKassa, backend автоматически выдаёт AgiCoins через RCON:

```javascript
await RconService.giveAgiCoins('Player123', 110);
```

### ShopGUIPlus (магазин рангов)

Конфигурация: `survival/plugins/ShopGUIPlus/shops/ranks.yml`

**Команда для открытия магазина:**

```bash
/shop
```

**Добавление нового ранга:**

Отредактируйте `ranks.yml`:

```yaml
vip_2m:
  type: command
  item:
    material: CYAN_WOOL
    name: "&b&lVIP (2 месяца)"
    lore:
      - "&7Флай 20 мин/час"
      - "&710 домов"
      - ""
      - "&eЦена: 399 ⚡"
  buy-price: 399
  commands:
    - "lp user %player% parent addtemp vip 60d"
    - "tellraw %player% {\"text\":\"✓ Ранг VIP выдан!\",\"color\":\"green\"}"
```

### RCON (удалённое управление)

**Настройка server.properties:**

```properties
enable-rcon=true
rcon.port=25575
rcon.password=your_rcon_password
```

**Использование из backend:**

```javascript
const RconService = require('./services/RconService');

// Выдать ранг
await RconService.grantRank('Player123', 'vip', 60);

// Выдать AgiCoins
await RconService.giveAgiCoins('Player123', 100);

// Проверить онлайн
const online = await RconService.getOnlinePlayers('survival');
console.log(`Онлайн: ${online.online}/${online.max}`);
```

---

## Тестирование

### Тест 1: Подключение к серверу

```bash
# Minecraft client
Подключиться к: nettyan.ddns.net:25565

Должен попасть в лобби
Кликнуть ПКМ по NPC "Survival" -> телепорт на Survival
```

### Тест 2: Регистрация на сайте

```bash
# Открыть браузер
http://localhost:80

1. Нажать "Регистрация"
2. Заполнить форму
3. Войти в личный кабинет
4. Проверить баланс AgiCoins (0)
```

### Тест 3: Покупка AgiCoins (тест режим)

```bash
1. Перейти в "Донат"
2. Выбрать пакет "100 AgiCoins + 10% бонус"
3. Нажать "Купить"
4. Произвести оплату через YooKassa (тест режим)
5. Проверить баланс в профиле (должно быть 110 ⚡)
```

### Тест 4: Покупка ранга

**Вариант 1: Через сайт (за рубли)**

```bash
1. Донат -> Ранги
2. Выбрать "VIP (2 месяца)"
3. Оплатить через YooKassa
4. Подключиться к Minecraft - ранг выдан автоматически
```

**Вариант 2: Через игру (за AgiCoins)**

```bash
/shop
Выбрать ранг VIP -> Купить за 399 ⚡
```

### Тест 5: База данных

```bash
# Подключиться к PostgreSQL
docker exec -it minecraft_postgres psql -U mcserver -d minecraft_server

# Проверить таблицы
\dt

# Проверить пользователей сайта
SELECT * FROM web_users;

# Проверить баланс AgiCoins
SELECT * FROM web_agicoins_balance;

# Проверить транзакции
SELECT * FROM web_agicoins_transactions;

# Выйти
\q
```

### Тест 7: RCON

**Из backend:**

```bash
docker exec -it agicraft_backend sh

node
> const RconService = require('./src/services/RconService');
> RconService.executeCommand('list', 'velocity').then(console.log);
```

**Из командной строки:**

```bash
# Установить rcon-cli
npm install -g rcon-cli

# Подключиться
rcon -H localhost -p 25575 -P your_rcon_password

# Выполнить команду
> list
> lp user TestUser info
```

---

## Решение проблем

### Проблема: Backend не может подключиться к PostgreSQL

**Решение:**

```bash
# Проверить что PostgreSQL запущен
docker-compose ps postgres

# Проверить логи
docker-compose logs postgres

# Подождать пока база полностью запустится
# (healthcheck должен пройти)
```

### Проблема: Frontend показывает 502 Bad Gateway

**Решение:**

```bash
# Проверить что backend работает
curl http://localhost:3000/health

# Если не работает - перезапустить
docker-compose restart backend
```

### Проблема: Боты не подключаются к серверу

**Решение:**

```bash
# Проверить логи backend
docker-compose logs backend | grep "Bot"

# Проверить что AI Research сервер запущен
docker-compose ps airesearch

# Проверить порт 25570
telnet localhost 25570
```

### Проблема: Ранг не выдался после оплаты

**Решение:**

```bash
# Проверить webhook от YooKassa
docker-compose logs backend | grep "webhook"

# Проверить таблицу donations
docker exec -it minecraft_postgres psql -U mcserver -d minecraft_server
SELECT * FROM web_donations WHERE payment_status = 'pending';

# Проверить RCON подключение
docker-compose logs backend | grep "RCON"

# Выдать ранг вручную
docker attach minecraft_velocity
/lp user <nickname> parent addtemp vip 60d
```

---

## Полезные команды

### Docker

```bash
# Остановить всё
docker-compose down

# Остановить + удалить volumes
docker-compose down -v

# Перезапустить конкретный сервис
docker-compose restart survival

# Пересобрать образы
docker-compose build

# Просмотреть использование ресурсов
docker stats
```

### Minecraft консоли

```bash
# Подключиться к консоли
docker attach minecraft_lobby
docker attach minecraft_survival
docker attach minecraft_airesearch
docker attach minecraft_velocity

# Отключиться (без остановки)
Ctrl+P, Ctrl+Q

# Остановить сервер
stop
```

### Backup

```bash
# Резервная копия миров
docker cp minecraft_survival:/server/world ./backup/survival-world
docker cp minecraft_airesearch:/server/world_ai ./backup/ai-world
docker cp minecraft_lobby:/server/world ./backup/lobby-world

# Резервная копия БД
docker exec minecraft_postgres pg_dump -U mcserver minecraft_server > backup/db.sql

# Восстановление БД
cat backup/db.sql | docker exec -i minecraft_postgres psql -U mcserver minecraft_server
```

---

## Порты

| Сервис | Порт | Доступ |
|--------|------|--------|
| Velocity (Minecraft) | 25565 | Внешний |
| Query (мониторинг) | 25566 | Внешний |
| Lobby | 25569 | Внутренний |
| AI Research | 25570 | Внешний (для ботов) |
| Survival | 25571 | Внутренний |
| Survival+ (заглушка) | 25572 | Внутренний |
| PostgreSQL | 5432 | Внутренний |
| Backend API | 3000 | Внешний |
| Frontend | 80 | Внешний |

---

## Лицензия

MIT

## Поддержка

Вопросы? Создайте issue на GitHub или пишите в Discord: discord.gg/agicraft
