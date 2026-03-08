# AgiCraft Frontend

React SPA фронтенд для сервера AgiCraft. Личный кабинет, донат система.

## Функции

- ✅ Регистрация и авторизация пользователей
- ✅ Личный кабинет с балансом AgiCoins
- ✅ Система покупки рангов через YooKassa
- ✅ История транзакций и покупок
- ✅ Новости сервера

## Технологии

- **React 18** - UI библиотека
- **Vite** - Build tool
- **React Router** - Маршрутизация
- **Zustand** - State management
- **Axios** - HTTP клиент

## Запуск

### Через Docker (рекомендуется):

```bash
docker-compose up -d frontend
```

Откройте браузер: http://localhost:80

### Локально (для разработки):

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Откройте браузер: http://localhost:3001

## Структура проекта

```
frontend/
├── src/
│   ├── components/        # Переиспользуемые компоненты
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   ├── pages/             # Страницы приложения
│   │   ├── Home.jsx       # Главная страница
│   │   ├── Login.jsx      # Вход
│   │   ├── Register.jsx   # Регистрация
│   │   ├── Profile.jsx    # Личный кабинет
│   │   ├── Donate.jsx     # Магазин донатов
│   │   └── News.jsx       # Новости
│   ├── services/          # API клиенты
│   │   └── api.js         # Axios instance + API functions
│   ├── store/             # State management (Zustand)
│   │   └── authStore.js   # Аутентификация
│   ├── App.jsx            # Главный компонент
│   └── main.jsx           # Entry point
├── public/                # Статические файлы
├── Dockerfile             # Docker multi-stage build
├── nginx.conf             # Nginx конфигурация
├── vite.config.js         # Vite конфигурация
└── package.json
```

## Страницы

### Главная (/)
- Информация о серверах (Survival, AI Research, Survival+)
- IP адрес для подключения
- Кнопки регистрации и доната

### Вход (/login) и Регистрация (/register)
- JWT аутентификация
- Форма с валидацией
- Автоматический редирект после входа

### Личный кабинет (/profile)
- Информация о пользователе
- Баланс AgiCoins
- История транзакций
- История покупок

### Донат (/donate)
- Пакеты AgiCoins
- Ранги (2/6/12 месяцев)
- Оплата через YooKassa
- Автоматическая активация после оплаты

### Новости (/news)
- Список новостей сервера
- Публичный доступ

## API интеграция

Frontend общается с Backend API через Axios. Все запросы автоматически включают JWT токен из localStorage.

## Деплой

### Production build:

```bash
npm run build
```

Собранные файлы будут в директории `dist/`.

### Docker deployment:

```bash
docker build -t agicraft-frontend .
docker run -p 80:80 agicraft-frontend
```

## Переменные окружения

Скопируйте `.env.example` в `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

В production измените на реальный URL backend API.

## Разработка

### Запуск dev сервера с hot reload:

```bash
npm run dev
```

### Линтинг:

```bash
npm run lint
```

### Build для production:

```bash
npm run build
```

### Preview production build:

```bash
npm run preview
```

## Стилизация

Используется чистый CSS с CSS Variables для темизации.

Основные цвета:
- `--primary-color`: #f59e0b (оранжевый)
- `--secondary-color`: #3b82f6 (синий)
- `--success-color`: #10b981 (зеленый)
- `--danger-color`: #ef4444 (красный)
- `--bg-dark`: #1a1a1a (темный фон)
- `--text-light`: #f5f5f5 (светлый текст)

## Лицензия

MIT
