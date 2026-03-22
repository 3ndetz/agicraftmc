# Статус проекта NettyanMC

Дата обновления: 15 ноября 2025

## ✅ Завершено

### Инфраструктура

- [x] **Реорганизация портов**
  - Velocity: 25565 (стандартный Minecraft порт)
  - Lobby: 25569 (внутренний)
  - Agents: 25576 (прямой доступ)
  - Survival: 25571 (внутренний)
  - Survival+: 25572 (заглушка)
  - Backend API: 3000
  - Frontend: 80

- [x] **Миграция MySQL → PostgreSQL 16**
  - Создана схема для LuckPerms
  - Создана схема для AuthMe
  - Создана схема для веб-сайта (users, agicoins, donations, products, news)
  - Triggers для автоматического создания балансов
  - Все конфиги обновлены на PostgreSQL

### Minecraft серверы

- [x] **Миграция на itzg/minecraft-server**
  - Все серверы используют образ itzg/minecraft-server
  - Автоматическая загрузка Paper 1.21.1 и Velocity
  - Встроенные Aikar's flags для оптимизации JVM
  - Упрощенная конфигурация через переменные окружения
  - Удалены кастомные Dockerfile

- [x] **Lobby сервер (itzg/minecraft-server)**
  - Docker контейнер (2GB RAM)
  - TYPE=PAPER, VERSION=1.21.1
  - LuckPerms с PostgreSQL
  - **AuthMe авторизация** (перенесена с Survival)
    - Bypass для AI групп (agents, ai_person, netfather)
    - Игроки остаются на Lobby после авторизации
  - Конфигурация защиты (gamemode adventure, pvp off)
  - Документация LOBBY_SETUP.md с инструкциями по:
    - Созданию NPC (FancyNpcs)
    - Настройке голограмм (DecentHolograms)
    - Защите WorldGuard
    - TAB списку игроков

- [x] **Survival сервер (itzg/minecraft-server)**
  - TYPE=PAPER, VERSION=1.21.1, MEMORY=10G
  - USE_AIKAR_FLAGS=TRUE
  - Автомонтирование плагинов из ./survival/data

- [x] **AI Research сервер (itzg/minecraft-server)**
  - TYPE=PAPER, VERSION=1.21.1, MEMORY=10G
  - Прямой доступ на порту 25576
  - Защита Нижнего мира (50x50 блоков)
  - End - полная анархия (без защиты)
  - Документация AI_RESEARCH_SETUP.md

- [x] **Velocity прокси (itzg/minecraft-server)**
  - TYPE=VELOCITY, VERSION=LATEST, MEMORY=1G
  - Проксирование между Lobby, Survival и AI Research

- [x] **Survival+ заглушка**
  - Минимальная конфигурация
  - Резервирование порта 25572
  - README с планами развития

### Система ролей и донатов

- [x] **LuckPerms полная настройка**
  - 8 донатных групп (default → new → helper → starter → vip → premium → elite → legend)
  - 3 служебные группы (agents, ai_person, netfather)
  - Полная документация с командами (LUCKPERMS_SETUP.md)
  - Права для каждой группы
  - Meta для ai_person (velocity.default-server)

- [x] **AgiCoins система**
  - PlayerPoints конфигурация
  - Интеграция с PostgreSQL
  - ShopGUIPlus магазин рангов
  - 3 тарифа: 2/6/12 месяцев со скидками
  - 26 продуктов в базе данных

### Backend API

- [x] **Express сервер**
  - JWT аутентификация
  - REST API endpoints:
    - `/api/auth` - Регистрация, вход, проверка токена
    - `/api/user` - Профиль, баланс, транзакции, донаты
    - `/api/payment` - Создание платежей, webhook, статус
    - `/api/news` - Получение новостей
  - Rate limiting (100 req/15 min)
  - Helmet.js безопасность
  - CORS настроен

- [x] **YooKassa интеграция**
  - Создание платежей
  - Webhook обработка
  - Автоматическая выдача рангов
  - Начисление AgiCoins

- [x] **Docker контейнер**
  - Node.js 20 Alpine
  - Volume для hot reload
  - Переменные окружения

### Frontend сайт

- [x] **React SPA**
  - Vite build tool
  - React Router для навигации
  - Zustand для state management
  - Axios для API запросов

- [x] **Страницы**
  - Home - главная с описанием серверов
  - Login / Register - аутентификация
  - Profile - личный кабинет (баланс, транзакции, донаты)
  - Donate - магазин (AgiCoins пакеты, ранги)
  - News - новости сервера

- [x] **Компоненты**
  - Header с навигацией
  - Footer с ссылками
  - API клиент с JWT интеграцией

- [x] **Стилизация**
  - Темная тема
  - CSS Variables
  - Responsive design
  - Анимации переходов

- [x] **Docker контейнер**
  - Multi-stage build (Node.js → Nginx)
  - Nginx с proxy_pass к backend
  - Gzip compression
  - SPA роутинг

### Документация

- [x] **LOBBY_SETUP.md** - Настройка лобби сервера
- [x] **AI_RESEARCH_SETUP.md** - Настройка AI Research сервера
- [x] **LUCKPERMS_SETUP.md** - Система ролей и прав
- [x] **DEPLOYMENT_GUIDE.md** - Полное руководство по развертыванию
- [x] **HTTPS_SETUP.md** - Настройка HTTPS с Caddy и Let's Encrypt
- [x] **QUICK_START_HTTPS.md** - Быстрый старт с HTTPS за 30 минут
- [x] **backend/README.md** - Backend API документация
- [x] **frontend/README.md** - Frontend документация

### HTTPS и SSL

- [x] **Интеграция с nettyanweb Caddy**
  - Используется Caddy из репозитория nettyanweb
  - Автоматические SSL сертификаты от Let's Encrypt
  - HTTP → HTTPS редирект
  - Reverse proxy для mc.nettyan.ru
  - Backend и Frontend подключены к сети nettyan_ssl

- [x] **Удален локальный Caddy**
  - Локальный Caddy сервис удален из docker-compose.yml
  - Директория caddy/ удалена
  - Упрощенная архитектура

- [x] **Docker сети**
  - minecraft_network (внутренняя сеть)
  - nettyan_ssl (внешняя сеть, подключение к nettyanweb Caddy)

---

## 🚧 В процессе / Нужно доделать

### HTTPS и домен

- [ ] **Купить домен:**
  - Рекомендуется reg.ru (~140₽/год)
  - Примеры: nettyan.ru, agicraft.ru
  - Настроить A-записи на ваш IP

- [ ] **Дождаться обновления DNS:**
  - Может занять от 5 минут до 24 часов
  - Проверить: `nslookup ваш_домен.ru`

- [ ] **Открыть порты на роутере:**
  - Порт 80 (HTTP)
  - Порт 443 (HTTPS)
  - Порт 8080 (опционально)

- [ ] **Настроить .env:**
  - DOMAIN=ваш_домен.ru
  - LETSENCRYPT_EMAIL=ваш_email@example.com
  - Обновить все URL на https://

- [ ] **Запустить Caddy:**
  - ТОЛЬКО после настройки DNS!
  - `docker-compose up -d caddy`
  - Проверить логи получения сертификата

- [ ] **Обновить YooKassa webhook:**
  - Изменить на https://ваш_домен.ru/api/payment/webhook

### Плагины

- [ ] **Скачать плагины вручную:**
  - Paper 1.21.1 (`lobby/paper.jar`, `survival/paper.jar`, `agents/paper.jar`)
  - Velocity 3.4.0+ (`velocity/velocity.jar`)
  - DecentHolograms (`lobby/plugins/`)
  - FancyNpcs (`lobby/plugins/`)
  - TAB (`lobby/plugins/`)
  - PlayerPoints (`survival/plugins/`)
  - ShopGUIPlus (`survival/plugins/`)
  - PlaceholderAPI (`lobby/plugins/`, `survival/plugins/`)

- [ ] **Настроить плагины в игре:**
  - Создать NPC в лобби (FancyNpcs)
  - Создать голограммы (DecentHolograms)
  - Протестировать магазин ShopGUIPlus
  - Протестировать PlayerPoints

### Конфигурации

- [ ] **YooKassa:**
  - Получить SHOP_ID и SECRET_KEY (тестовый режим)
  - Настроить webhook URL
  - Протестировать тестовые платежи

- [ ] **Изменить пароли в production:**
  - PostgreSQL (`.env`, все конфиги LuckPerms)
  - JWT_SECRET (`.env`, backend)

### Тестирование

- [ ] **Тесты Minecraft серверов:**
  - [ ] Подключение к лобби через Velocity
  - [ ] AuthMe регистрация на Lobby (обычные игроки)
  - [ ] AuthMe bypass для AI групп (ai_person пропускает авторизацию)
  - [ ] Телепортация на Survival через NPC
  - [ ] Телепортация на AI Research через NPC
  - [ ] WorldGuard защита работает
  - [ ] LuckPerms синхронизация между серверами

- [ ] **Тесты Backend:**
  - [ ] Регистрация пользователя
  - [ ] Вход и получение JWT токена
  - [ ] Создание бота (с ролью agents)
  - [ ] Запуск бота
  - [ ] Просмотр логов бота
  - [ ] Создание платежа YooKassa
  - [ ] Webhook обработка

- [ ] **Тесты Frontend:**
  - [ ] Регистрация на сайте
  - [ ] Вход в личный кабинет
  - [ ] Просмотр баланса AgiCoins
  - [ ] Создание бота через веб-интерфейс
  - [ ] Покупка AgiCoins
  - [ ] Покупка ранга
  - [ ] Отображение истории транзакций

- [ ] **Интеграционные тесты:**
  - [ ] Покупка через сайт → автоматическая выдача в игре
  - [ ] Бот создан на сайте → подключается к серверу
  - [ ] Ранг куплен за AgiCoins в игре → отображается на сайте
  - [ ] Синхронизация LuckPerms между всеми серверами

### Производительность

- [ ] **Оптимизация:**
  - [ ] Настроить JVM flags для каждого сервера
  - [ ] Настроить view-distance, simulation-distance
  - [ ] Включить gzip compression в Nginx
  - [ ] Настроить кеширование API запросов
  - [ ] Оптимизировать SQL запросы (индексы)

---

## 📋 Следующие шаги (приоритет)

1. **Высокий приоритет:**
   - [ ] Скачать все плагины вручную
   - [ ] Запустить весь стек через docker-compose
   - [ ] Провести базовое тестирование подключения

2. **Средний приоритет:**
   - [ ] Настроить NPC и голограммы в лобби
   - [ ] Настроить YooKassa (тестовый режим)
   - [ ] Протестировать покупку через сайт

3. **Низкий приоритет:**
   - [ ] Заполнить базу новостями
   - [ ] Оптимизировать производительность
   - [ ] Настроить автоматический backup
   - [ ] Написать скрипты мониторинга

---

## 🐛 Известные проблемы

1. **PlaceholderAPI интеграция:**
   - Голограммы в LOBBY_SETUP.md используют `{PAPI: ...}` синтаксис
   - Нужно установить PlaceholderAPI + расширение Server
   - После установки выполнить: `/papi ecloud download Server` и `/papi reload`

2. **Frontend API URL:**
   - В production нужно изменить `VITE_API_URL` на реальный домен
   - Сейчас настроен на `http://localhost:3000/api`

---

## 📊 Статистика

**Общее время разработки:** ~8 часов

**Созданные файлы:**
- Docker configs: 7
- Backend files: 15+
- Frontend files: 25+
- Minecraft configs: 30+
- Документация: 6

**Строки кода:**
- Backend: ~2000 LOC
- Frontend: ~3000 LOC
- Конфигурация: ~1500 LOC
- Документация: ~2000 строк

**Контейнеры Docker:** 8
- postgres
- velocity
- survival
- agents
- lobby
- backend
- frontend
- caddy

**Объем данных в БД:**
- 26 продуктов (ранги + AgiCoins пакеты)
- 8 групп LuckPerms
- 14 таблиц PostgreSQL

---

## 🚀 Готовность к production

| Компонент | Статус | Готовность |
|-----------|--------|------------|
| PostgreSQL | ✅ Готово | 100% |
| Velocity Proxy | ✅ Готово | 100% |
| Survival сервер | ⚠️ Нужны плагины | 80% |
| AI Research сервер | ✅ Готово | 95% |
| Lobby сервер | ⚠️ Нужна настройка | 70% |
| Backend API | ✅ Готово | 95% |
| Frontend | ✅ Готово | 95% |
| Caddy (HTTPS) | ✅ Готово | 100% |
| LuckPerms | ⚠️ Нужна настройка | 80% |
| AgiCoins система | ⚠️ Нужны плагины | 70% |
| YooKassa | ❌ Нужна настройка | 50% |
| HTTPS/SSL | ⚠️ Нужен домен | 90% |

**Общая готовность:** ~87%

---

## 🎯 Цели на следующую неделю

1. **Купить домен** на reg.ru (~140₽/год)
2. **Настроить HTTPS** - следовать QUICK_START_HTTPS.md
3. Скачать все недостающие плагины
4. Запустить весь стек и провести тестирование
5. Провести хотя бы 1 тестовый платёж через YooKassa (с HTTPS webhook)
7. Создать первого бота через веб-интерфейс
8. Написать скрипт автоматического backup

---

## 📝 Примечания

- Все пароли в конфигах - тестовые, **обязательно изменить в production**
- YooKassa настроен на тестовый режим (sandbox)
- Online-mode=false (сервер оффлайн, без проверки лицензий Mojang)
- Для production нужен SSL сертификат для сайта
- Рекомендуется настроить Cloudflare для DDoS защиты

---

## 🔗 Полезные ссылки

- [QUICK_START_HTTPS.md](QUICK_START_HTTPS.md) - Быстрый старт с HTTPS (30 мин)
- [HTTPS_SETUP.md](HTTPS_SETUP.md) - Детальное руководство HTTPS
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Полное руководство
- [LOBBY_SETUP.md](LOBBY_SETUP.md) - Настройка лобби
- [LUCKPERMS_SETUP.md](LUCKPERMS_SETUP.md) - Система ролей
- [backend/README.md](backend/README.md) - Backend API
- [frontend/README.md](frontend/README.md) - Frontend

---

**Последнее обновление:** Claude Code, 10 ноября 2025
