# AgiCraft Backend API

Backend API для сервера AgiCraft. Обрабатывает аутентификацию, управление AgiCoins и покупки через YooKassa.

## Функции

- ✅ Регистрация и авторизация пользователей (JWT)
- ✅ Управление балансом AgiCoins
- ✅ Покупка рангов и AgiCoins через YooKassa
- ✅ REST API для фронтенда

## Технологии

- **Node.js + Express** - Backend framework
- **PostgreSQL** - База данных
- **JWT** - Аутентификация
- **YooKassa** - Платёжный шлюз (тестовый режим)

## Запуск

### Через Docker (рекомендуется):

```bash
docker-compose up -d backend
```

### Локально:

```bash
cd backend
npm install
cp .env.example .env
# Настроить .env
npm start
```

## API Endpoints

### Аутентификация (`/api/auth`)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/register` | Регистрация нового пользователя |
| POST | `/login` | Вход в систему |
| GET | `/verify` | Проверка токена |

### Пользователь (`/api/user`)

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/profile` | Профиль пользователя | ✅ |
| GET | `/balance` | Баланс AgiCoins | ✅ |
| GET | `/transactions` | История транзакций | ✅ |
| GET | `/donations` | История покупок | ✅ |

### Платежи (`/api/payment`)

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/products` | Список продуктов | ❌ |
| POST | `/create` | Создать платёж | ✅ |
| POST | `/webhook` | Webhook от YooKassa | ❌ |
| GET | `/status/:donationId` | Статус платежа | ✅ |

### Новости (`/api/news`)

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/` | Список новостей | ❌ |
| GET | `/:id` | Получить новость | ❌ |

## Переменные окружения

Скопируйте `.env.example` в `.env` и настройте:

```env
# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=minecraft_server
POSTGRES_USER=mcserver
POSTGRES_PASSWORD=StrongPass123!

# JWT
JWT_SECRET=your_super_secret_jwt_key

# Server
PORT=3000
NODE_ENV=production

# YooKassa (тестовый режим)
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
```

## Примеры запросов

### Регистрация:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "minecraft_nickname": "Steve"
  }'
```

### Вход:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

## Разработка

### Режим разработки с auto-reload:

```bash
npm run dev
```

### Тесты:

```bash
npm test
```

## Интеграция с плагинами

### PlayerPoints (AgiCoins)

Backend записывает транзакции в БД. Для начисления в игре используйте:

```bash
docker attach minecraft_survival
# В консоли:
points give PlayerName 100
```

### LuckPerms (ранги)

Выдача рангов производится вручную через консоль:

```bash
docker attach minecraft_velocity
# В консоли:
lp user PlayerName parent addtemp vip 60d
```

## Безопасность

- ✅ Хеширование паролей (bcrypt)
- ✅ JWT токены с истечением
- ✅ Rate limiting (100 запросов / 15 минут)
- ✅ Helmet.js для HTTP заголовков
- ✅ CORS настроен для фронтенда
- ✅ SQL injection защита (параметризованные запросы)

## Мониторинг

Проверка состояния API:

```bash
curl http://localhost:3000/health
```

Ответ:
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "service": "AgiCraft Backend API"
}
```

## Логи

Логи выводятся в stdout. Для просмотра логов Docker контейнера:

```bash
docker logs -f agicraft_backend
```

## Troubleshooting

### Не удаётся подключиться к PostgreSQL

Проверьте, что контейнер postgres запущен:

```bash
docker ps | grep postgres
```

### YooKassa webhook не работает

Для тестирования локально используйте ngrok:

```bash
ngrok http 3000
# Установите webhook URL в панели YooKassa
```

## Лицензия

MIT
