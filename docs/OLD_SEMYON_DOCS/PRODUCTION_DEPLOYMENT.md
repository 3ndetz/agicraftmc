# Пошаговое руководство по развертыванию на production сервере

Это детальное руководство по развертыванию NetTyanMC на удаленном сервере с интеграцией nettyanweb (Caddy + HTTPS).

## Содержание

1. [Предварительные требования](#предварительные-требования)
2. [Подготовка локального проекта](#подготовка-локального-проекта)
3. [Настройка удаленного сервера](#настройка-удаленного-сервера)
4. [Интеграция с nettyanweb](#интеграция-с-nettyanweb)
5. [Перенос проекта на сервер](#перенос-проекта-на-сервер)
6. [Первый запуск](#первый-запуск)
7. [Проверка работоспособности](#проверка-работоспособности)
8. [Обновление проекта](#обновление-проекта)

---

## Предварительные требования

### На локальной машине:
- Git установлен
- SSH клиент
- Доступ к репозиторию GitHub

### На удаленном сервере:
- ✅ Ubuntu 20.04+ (или другой Linux)
- ✅ Docker 20.10+
- ✅ Docker Compose 2.0+
- ✅ SSH доступ с правами sudo
- ✅ nettyanweb развернут и работает
- ✅ Домен настроен и указывает на IP сервера
- Минимум 28GB RAM (рекомендуется 32GB+)
- Минимум 50GB свободного места

### Проверка требований на сервере:

```bash
# Подключитесь к серверу
ssh user@your-server-ip

# Проверьте Docker
docker --version
# Должно быть: Docker version 20.10.0+

# Проверьте Docker Compose
docker compose version
# Должно быть: Docker Compose version 2.0.0+

# Проверьте что nettyanweb работает
docker ps | grep caddy
# Должен быть запущен контейнер с Caddy

# Проверьте сеть nettyan_ssl
docker network ls | grep nettyan_ssl
# Должна существовать сеть nettyan_ssl
```

---

## Подготовка локального проекта

### 1. Убедитесь что изменения закоммичены

```bash
# На локальной машине в папке проекта
cd N:\Minecraftserver

# Проверьте статус
git status

# Если есть незакоммиченные изменения
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### 2. Создайте production .env файл

```bash
# Создайте .env файл из шаблона
cp .env.example .env
```

Отредактируйте `.env` файл со следующими значениями:

```env
# PostgreSQL - ОБЯЗАТЕЛЬНО смените пароль!
POSTGRES_DB=minecraft_server
POSTGRES_USER=mcserver
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE_CHANGE_THIS

# Backend - ОБЯЗАТЕЛЬНО смените секрет!
JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY_MINIMUM_32_CHARS_CHANGE_THIS
NODE_ENV=production

# YooKassa - получите из личного кабинета
YOOKASSA_SHOP_ID=your_shop_id_from_yookassa
YOOKASSA_SECRET_KEY=your_secret_key_from_yookassa

# Замените YOUR_DOMAIN на ваш реальный домен
YOOKASSA_RETURN_URL=https://YOUR_DOMAIN/payment/success
YOOKASSA_WEBHOOK_URL=https://YOUR_DOMAIN/api/payment/webhook

# RCON - ОБЯЗАТЕЛЬНО смените пароль!
RCON_PASSWORD=YOUR_RCON_PASSWORD_CHANGE_THIS

# Memory allocation
SURVIVAL_MEMORY=10G
AI_RESEARCH_MEMORY=10G
LOBBY_MEMORY=2G
VELOCITY_MEMORY=1G

# Frontend - замените YOUR_DOMAIN на ваш реальный домен
FRONTEND_URL=https://YOUR_DOMAIN
VITE_API_URL=/api
```

**ВАЖНО:** Замените все значения `YOUR_*` на реальные значения!

### 3. Проверьте .gitignore

Убедитесь что `.env` файл НЕ закоммичен в Git:

```bash
cat .gitignore | grep ".env"
# Должен быть: .env
```

---

## Настройка удаленного сервера

### 1. Подключитесь к серверу

```bash
ssh user@your-server-ip
```

### 2. Создайте директорию для проекта

```bash
# Создайте директорию для приложений
sudo mkdir -p /opt/nettyan
sudo chown $USER:$USER /opt/nettyan

# Перейдите в директорию
cd /opt/nettyan
```

### 3. Настройте Git (если еще не настроен)

```bash
# Настройте Git credentials для GitHub
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"

# Если репозиторий приватный, настройте SSH ключ
# или используйте Personal Access Token
```

---

## Интеграция с nettyanweb

### 1. Обновите Caddyfile на сервере

```bash
# Перейдите в директорию nettyanweb
cd /opt/nettyan/nettyanweb

# Создайте backup
cp Caddyfile Caddyfile.backup
```

Добавьте в `Caddyfile` следующие строки (замените `YOUR_DOMAIN` на ваш домен):

```caddyfile
# Существующие конфиги
nettyan.ru {
    reverse_proxy react-frontend:80
}

n8n.nettyan.ru {
    reverse_proxy n8n:5678
}

# ДОБАВЬТЕ ЭТИ СТРОКИ для NetTyanMC:
mc.YOUR_DOMAIN {
    # Frontend
    handle {
        reverse_proxy agicraft_frontend:80
    }

    # Backend API
    handle /api/* {
        reverse_proxy agicraft_backend:3000
    }
}
```

**Пример для домена nettyan.ru:**

```caddyfile
mc.nettyan.ru {
    handle {
        reverse_proxy agicraft_frontend:80
    }

    handle /api/* {
        reverse_proxy agicraft_backend:3000
    }
}
```

### 2. Перезапустите Caddy

```bash
# Находясь в /opt/nettyan/nettyanweb
docker compose restart caddy

# Проверьте логи
docker compose logs -f caddy

# Нажмите Ctrl+C когда увидите успешный запуск
```

**Что проверить в логах:**
- Caddy должен запуститься без ошибок
- Сертификат для `mc.YOUR_DOMAIN` должен быть автоматически получен от Let's Encrypt
- Не должно быть ошибок в конфигурации

---

## Перенос проекта на сервер

### Вариант 1: Через Git (рекомендуется)

```bash
# На сервере
cd /opt/nettyan

# Клонируйте репозиторий
git clone https://github.com/kragger-ra/NetTyanMC.git
cd NetTyanMC

# Или если репозиторий уже клонирован:
cd /opt/nettyan/NetTyanMC
git pull origin main
```

### Вариант 2: Через rsync (если нужно перенести .env)

```bash
# На локальной машине
# ВНИМАНИЕ: Убедитесь что .env содержит production значения!

rsync -avz --exclude 'node_modules' --exclude '.git' \
  /n/Minecraftserver/ user@your-server-ip:/opt/nettyan/NetTyanMC/
```

### После переноса файлов:

```bash
# На сервере
cd /opt/nettyan/NetTyanMC

# Создайте .env если его нет (или скопируйте с локальной машины)
nano .env
# Вставьте содержимое production .env (см. шаг 2 выше)

# Проверьте что .env создан правильно
cat .env

# Убедитесь что все плагины на месте (если требуется)
# Скопируйте плагины если их нет в репозитории
```

---

## Первый запуск

### 1. Запустите проект

```bash
cd /opt/nettyan/NetTyanMC

# Запустите все сервисы
docker compose up -d

# Это займет несколько минут при первом запуске:
# - Скачаются Docker образы
# - Будут созданы volumes
# - Запустятся все контейнеры
```

### 2. Мониторинг запуска

```bash
# Смотрите логи всех сервисов
docker compose logs -f

# Или конкретных сервисов:
docker compose logs -f postgres     # База данных
docker compose logs -f velocity     # Minecraft прокси
docker compose logs -f backend      # Backend API
docker compose logs -f frontend     # React frontend

# Нажмите Ctrl+C чтобы выйти из просмотра логов
```

**Что должно произойти (займет 2-5 минут):**

1. **PostgreSQL** (30 сек):
   - База данных инициализируется
   - Таблицы создаются из `postgres/init.sql`
   - Healthcheck становится healthy

2. **Backend** (30 сек):
   - Устанавливаются зависимости (если не установлены)
   - Подключается к PostgreSQL
   - Запускается на порту 3000

3. **Frontend** (30 сек):
   - Билд собирается (если не собран)
   - Nginx запускается на порту 80

4. **Minecraft серверы** (2-5 минут):
   - **Lobby, Survival, AI Research** запускаются
   - Paper JAR автоматически скачивается через itzg образ
   - Миры генерируются или загружаются
   - Плагины инициализируются

5. **Velocity** (1-2 минуты):
   - Velocity JAR автоматически скачивается
   - Подключается к Paper серверам
   - Прокси готов принимать соединения

### 3. Проверьте статус всех контейнеров

```bash
docker compose ps

# Все контейнеры должны быть в статусе "Up" или "Up (healthy)"
```

**Пример успешного вывода:**

```
NAME                     STATUS                 PORTS
minecraft_velocity       Up 2 minutes           0.0.0.0:25565->25577/tcp
minecraft_lobby          Up 2 minutes
minecraft_survival       Up 2 minutes
minecraft_airesearch     Up 2 minutes           0.0.0.0:25570->25565/tcp
minecraft_postgres       Up 2 minutes (healthy)
agicraft_backend         Up 2 minutes
agicraft_frontend        Up 2 minutes
```

---

## Проверка работоспособности

### 1. Проверьте веб-сайт

```bash
# На сервере
curl -I https://mc.YOUR_DOMAIN

# Должен вернуть: HTTP/2 200
```

Откройте в браузере: `https://mc.YOUR_DOMAIN`

**Что должно работать:**
- ✅ Главная страница загружается
- ✅ HTTPS работает (зеленый замок)
- ✅ Можно открыть страницу регистрации
- ✅ Можно войти в личный кабинет

### 2. Проверьте Backend API

```bash
# Health check
curl https://mc.YOUR_DOMAIN/api/health

# Должен вернуть: {"status":"ok"}
```

### 3. Проверьте базу данных

```bash
# Подключитесь к PostgreSQL
docker exec -it minecraft_postgres psql -U mcserver -d minecraft_server

# Проверьте таблицы
\dt

# Должны быть таблицы:
# - luckperms_*
# - web_users
# - web_agicoins_balance
# - web_donations
# и т.д.

# Выйдите
\q
```

### 4. Проверьте Minecraft сервер

**Вариант 1: Из Minecraft клиента**

1. Откройте Minecraft 1.21.1
2. Multiplayer → Add Server
3. Введите адрес: `YOUR_DOMAIN:25565`
4. Подключитесь

**Должно произойти:**
- ✅ Подключение успешно
- ✅ Попадаете в Lobby
- ✅ Работает авторизация (если настроена AuthMe)

**Вариант 2: Через консоль сервера**

```bash
# Подключитесь к консоли Velocity
docker attach minecraft_velocity

# Выполните команду (когда подключен игрок)
/glist

# Отключитесь от консоли (не останавливая сервер)
# Нажмите: Ctrl+P, затем Ctrl+Q
```

### 5. Проверьте логи на ошибки

```bash
# Проверьте логи всех сервисов
docker compose logs --tail=50 | grep -i error

# Если нет вывода - значит нет критических ошибок
```

---

## Настройка Minecraft серверов (первый запуск)

После успешного запуска всех контейнеров нужно выполнить первоначальную настройку:

### 1. Настройка LuckPerms (система прав)

См. подробную инструкцию: [LUCKPERMS_SETUP.md](LUCKPERMS_SETUP.md)

```bash
# Подключитесь к Velocity консоли
docker attach minecraft_velocity

# Создайте основные группы
/lp creategroup new
/lp creategroup helper
/lp creategroup vip
/lp creategroup ai_research
/lp creategroup ai_person

# Настройте права (см. LUCKPERMS_SETUP.md)

# Отключитесь от консоли
# Ctrl+P, затем Ctrl+Q
```

### 2. Настройка Lobby

См. подробную инструкцию: [LOBBY_SETUP.md](LOBBY_SETUP.md)

Основные шаги:
- Создать платформу spawn
- Настроить WorldGuard защиту
- Создать NPC для телепортации

### 3. Настройка AI Research

См. подробную инструкцию: [AI_RESEARCH_SETUP.md](AI_RESEARCH_SETUP.md)

---

## Обновление проекта

Когда вам нужно обновить проект с новым кодом:

### 1. Сделайте backup (опционально, но рекомендуется)

```bash
# На сервере
cd /opt/nettyan/NetTyanMC

# Backup базы данных
docker exec minecraft_postgres pg_dump -U mcserver minecraft_server > backup_$(date +%Y%m%d).sql

# Backup миров (опционально, занимает много времени)
docker cp minecraft_survival:/data/world ./backup_worlds/survival_world_$(date +%Y%m%d)
```

### 2. Обновите код

```bash
cd /opt/nettyan/NetTyanMC

# Получите последние изменения
git pull origin main

# Если изменились .env переменные - обновите .env файл
nano .env
```

### 3. Перезапустите нужные сервисы

```bash
# Если изменился только backend/frontend:
docker compose restart backend frontend
docker compose build backend frontend  # Если нужно пересобрать
docker compose up -d backend frontend

# Если изменились конфиги Minecraft:
docker compose restart velocity survival lobby airesearch

# Полный перезапуск (если изменился docker-compose.yml):
docker compose down
docker compose up -d
```

### 4. Проверьте что все работает

```bash
docker compose ps
docker compose logs -f
```

---

## Полезные команды

### Управление сервисами

```bash
# Остановить все
docker compose down

# Запустить все
docker compose up -d

# Перезапустить конкретный сервис
docker compose restart velocity

# Пересобрать и запустить
docker compose up -d --build backend

# Просмотр логов
docker compose logs -f [service_name]

# Использование ресурсов
docker stats
```

### Minecraft консоли

```bash
# Подключиться к консоли
docker attach minecraft_velocity
docker attach minecraft_lobby
docker attach minecraft_survival
docker attach minecraft_airesearch

# Отключиться без остановки: Ctrl+P, затем Ctrl+Q
# Остановить сервер: /stop
```

### База данных

```bash
# Подключиться к PostgreSQL
docker exec -it minecraft_postgres psql -U mcserver -d minecraft_server

# Полезные команды:
\dt                    # Список таблиц
\d table_name         # Структура таблицы
SELECT * FROM ...     # SQL запросы
\q                    # Выход
```

### Backup и восстановление

```bash
# Backup БД
docker exec minecraft_postgres pg_dump -U mcserver minecraft_server > backup.sql

# Восстановление БД
cat backup.sql | docker exec -i minecraft_postgres psql -U mcserver minecraft_server

# Backup мира
docker cp minecraft_survival:/data/world ./world_backup

# Восстановление мира (сервер должен быть остановлен!)
docker cp ./world_backup minecraft_survival:/data/world
```

---

## Решение проблем

### Проблема: Сайт не открывается (502 Bad Gateway)

**Причина:** Backend или Frontend не запустились, или Caddy не может их достучаться.

**Решение:**

```bash
# Проверьте статус
docker compose ps

# Проверьте логи
docker compose logs backend
docker compose logs frontend

# Проверьте что контейнеры в сети nettyan_ssl
docker network inspect nettyan_ssl

# Перезапустите
docker compose restart backend frontend
```

### Проблема: Не могу подключиться к Minecraft серверу

**Причина:** Порт 25565 не открыт в firewall или Velocity не запустился.

**Решение:**

```bash
# Проверьте что Velocity запущен
docker compose logs velocity

# Проверьте порты
sudo ss -tulpn | grep 25565

# Откройте порт в firewall (Ubuntu/Debian)
sudo ufw allow 25565/tcp
sudo ufw allow 25570/tcp  # Для AI Research

# Проверьте на сервере
telnet localhost 25565
```

### Проблема: Игроки не могут зайти (kicked whilst connecting)

**Причина:** Velocity не может подключиться к Paper серверам.

**Решение:**

```bash
# Проверьте что все Paper серверы запущены
docker compose ps

# Проверьте логи
docker compose logs survival
docker compose logs lobby
docker compose logs airesearch

# Проверьте Velocity логи
docker compose logs velocity | grep -i error

# Убедитесь что все серверы в одной сети
docker network inspect minecraft_network
```

### Проблема: Backend не может подключиться к PostgreSQL

**Решение:**

```bash
# Проверьте что PostgreSQL здоров
docker compose ps postgres
# Статус должен быть: Up (healthy)

# Проверьте логи
docker compose logs postgres

# Проверьте подключение вручную
docker exec -it minecraft_postgres psql -U mcserver -d minecraft_server

# Если база не инициализирована - пересоздайте volume
docker compose down
docker volume rm nettyanmc_postgres_data  # ВНИМАНИЕ: Удалит все данные!
docker compose up -d
```

### Проблема: Caddy не может получить SSL сертификат

**Причина:** Домен не указывает на сервер, или порты 80/443 заблокированы.

**Решение:**

```bash
# Проверьте что домен указывает на ваш IP
dig mc.YOUR_DOMAIN
nslookup mc.YOUR_DOMAIN

# Проверьте firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Проверьте логи Caddy
cd /opt/nettyan/nettyanweb
docker compose logs caddy

# Перезапустите Caddy
docker compose restart caddy
```

---

## Мониторинг и обслуживание

### Регулярные задачи

**Ежедневно:**
- Проверяйте логи на ошибки: `docker compose logs --tail=100 | grep -i error`
- Проверяйте использование диска: `df -h`

**Еженедельно:**
- Делайте backup базы данных
- Проверяйте обновления: `git pull origin main`

**Ежемесячно:**
- Делайте backup миров
- Обновляйте Docker образы: `docker compose pull && docker compose up -d`

### Мониторинг ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Использование диска
df -h
du -sh /var/lib/docker/volumes/*

# Использование памяти
free -h

# Логи Minecraft серверов (TPS, память)
docker attach minecraft_survival
# Затем в консоли: /spark tps
```

---

## Контрольный список перед запуском

- [ ] Сервер соответствует требованиям (28GB RAM, 50GB диск)
- [ ] Docker и Docker Compose установлены
- [ ] nettyanweb развернут и работает
- [ ] Сеть `nettyan_ssl` создана
- [ ] Домен указывает на IP сервера
- [ ] Порты 80, 443, 25565, 25570 открыты в firewall
- [ ] `.env` файл создан с production значениями
- [ ] Caddyfile обновлен с конфигом для `mc.YOUR_DOMAIN`
- [ ] Проект перенесен на сервер в `/opt/nettyan/NetTyanMC`
- [ ] Все пароли в `.env` изменены с дефолтных значений
- [ ] YooKassa ключи настроены (если используется донат)

---

## Поддержка

Если возникли проблемы:
1. Проверьте раздел "Решение проблем" выше
2. Проверьте логи: `docker compose logs -f`
3. Проверьте документацию: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
4. Создайте issue на GitHub: https://github.com/kragger-ra/NetTyanMC/issues
