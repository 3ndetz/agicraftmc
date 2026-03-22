# Crafty Controller - Веб-панель управления серверами

Crafty Controller - это веб-интерфейс для управления Minecraft серверами, работающий в Docker.

---

## 🎯 Что это такое?

Crafty Controller предоставляет красивый веб-интерфейс для:
- Управления серверами (запуск, остановка, перезагрузка)
- Мониторинга ресурсов (CPU, RAM, диск)
- Просмотра логов в реальном времени
- Выполнения команд через веб-консоль
- Управления файлами сервера
- Создания и восстановления бэкапов
- Управления пользователями и правами доступа

**Официальный сайт:** https://craftycontrol.com/
**Документация:** https://docs.craftycontrol.com/
**GitLab:** https://gitlab.com/crafty-controller/crafty-4

---

## ⚡ Быстрый старт

### 1. Запустить Crafty Controller

Crafty уже добавлен в `docker-compose.yml`:

```bash
docker-compose up -d crafty
```

### 2. Открыть веб-интерфейс

Перейти по адресу: **https://localhost:8443**

⚠️ При первом запуске браузер покажет предупреждение о самоподписанном сертификате - это нормально, нажмите "Продолжить".

### 3. Первый вход

**Дефолтные credentials:**
- Username: `admin`
- Password: `crafty`

⚠️ **ВАЖНО:** Сразу после входа измените пароль!

### 4. Добавить существующие серверы

Crafty может управлять серверами, запущенными через `itzg/minecraft-server`:

1. В веб-интерфейсе: **Servers → Create New Server**
2. Выберите тип: **Import Existing Server**
3. Укажите путь к серверу:
   - Survival: `/var/lib/docker/volumes/nettyanmc_survival_data/_data`
   - Lobby: `/var/lib/docker/volumes/nettyanmc_lobby_data/_data`
   - Agents: `/var/lib/docker/volumes/nettyanmc_agents_data/_data`
   - Velocity: `/var/lib/docker/volumes/nettyanmc_velocity_data/_data`

---

## 🔧 Конфигурация

### Docker Compose секция

```yaml
crafty:
  image: registry.gitlab.com/crafty-controller/crafty-4:latest
  container_name: crafty_controller
  restart: unless-stopped
  ports:
    - "8443:8443"   # HTTPS Web UI
    - "8123:8123"   # Websocket
  volumes:
    - crafty_data:/crafty/app/config
    - crafty_backups:/crafty/backups
    - crafty_logs:/crafty/logs
    - crafty_servers:/crafty/servers
    - /var/run/docker.sock:/var/run/docker.sock:ro
  networks:
    - minecraft_network
    - nettyan_ssl
  environment:
    TZ: Europe/Moscow
```

### Volumes

- **crafty_data** - конфигурация Crafty (пользователи, настройки)
- **crafty_backups** - резервные копии серверов
- **crafty_logs** - логи Crafty Controller
- **crafty_servers** - данные серверов (если созданы через Crafty)

---

## 🚀 Возможности

### 1. Dashboard

Главная страница показывает:
- Статус всех серверов (online/offline)
- Использование ресурсов (CPU, RAM, диск)
- Количество игроков онлайн
- Графики нагрузки

### 2. Server Management

Для каждого сервера доступно:
- **Start/Stop/Restart** - управление сервером
- **Console** - веб-консоль для выполнения команд
- **Logs** - просмотр логов в реальном времени
- **Files** - файловый менеджер (редактирование конфигов)
- **Backup** - создание и восстановление бэкапов
- **Schedule** - планировщик задач (рестарты, бэкапы)

### 3. User Management

Создание пользователей с разными уровнями доступа:
- **Super Admin** - полный доступ ко всему
- **Admin** - управление серверами
- **User** - просмотр и базовые команды
- **Guest** - только просмотр

### 4. Scheduled Tasks

Автоматизация задач:
```yaml
# Пример: Ежедневный рестарт в 4:00
Type: Restart Server
Schedule: 0 4 * * *

# Пример: Бэкап каждые 6 часов
Type: Backup Server
Schedule: 0 */6 * * *
```

### 5. Notifications

Уведомления в:
- Email
- Discord webhook
- Telegram bot

---

## 🔐 Безопасность

### 1. Изменить дефолтный пароль

```
Settings → Users → admin → Change Password
```

### 2. Создать нового администратора

```
Settings → Users → Create User
Username: yourusername
Role: Super Admin
```

### 3. Удалить дефолтного admin

```
Settings → Users → admin → Delete
```

### 4. HTTPS сертификат

По умолчанию используется самоподписанный сертификат.

Для production:
1. Получить Let's Encrypt сертификат
2. Положить в `/crafty/app/config/web/certs/`
3. Перезапустить: `docker restart crafty_controller`

### 5. Firewall

Если Crafty доступен из интернета:
```bash
# Разрешить только с вашего IP
sudo ufw allow from YOUR_IP to any port 8443
```

---

## 📊 Мониторинг ресурсов

### CPU и RAM

Crafty показывает использование ресурсов для каждого сервера:
- CPU usage (%)
- RAM usage (MB)
- Disk usage (GB)

### Графики

Исторические данные за:
- Последний час
- Последние 24 часа
- Последние 7 дней

---

## 💾 Бэкапы

### Ручной бэкап

```
Server → Backup → Create Backup
```

Бэкапы сохраняются в `/crafty/backups/`

### Автоматический бэкап

```
Server → Schedule → Create Schedule
Type: Backup
Cron: 0 */6 * * *  # Каждые 6 часов
```

### Восстановление

```
Server → Backup → Restore
Select backup → Confirm
```

⚠️ Сервер будет остановлен на время восстановления!

---

## 🛠️ Troubleshooting

### Проблема: Crafty не запускается

**Решение:**
```bash
# Проверить логи
docker logs crafty_controller

# Проверить что порт свободен
netstat -tuln | grep 8443

# Перезапустить контейнер
docker restart crafty_controller
```

### Проблема: Не видит существующие серверы

**Решение:**
Убедиться что Crafty имеет доступ к Docker socket:
```bash
docker exec crafty_controller ls -la /var/run/docker.sock
```

Должно быть: `srw-rw---- root docker`

### Проблема: Ошибка "Permission denied" при импорте сервера

**Решение:**
Дать Crafty права на чтение volumes:
```bash
sudo chmod -R 755 /var/lib/docker/volumes/nettyanmc_*
```

### Проблема: Сервер не запускается через Crafty

**Решение:**
Crafty может конфликтовать с серверами, запущенными через `docker-compose`.

**Рекомендация:** Использовать либо Crafty, либо docker-compose для управления, но не оба одновременно.

---

## 🎨 Интеграция с nettyanweb

### Добавить Crafty в Caddy

Если хотите доступ через домен (например, `crafty.nettyan.ru`):

1. Добавить в `nettyanweb/Caddyfile`:
```
crafty.nettyan.ru {
    reverse_proxy crafty_controller:8443 {
        transport http {
            tls_insecure_skip_verify
        }
    }
}
```

2. Перезапустить Caddy:
```bash
cd nettyanweb
docker-compose restart caddy
```

3. Открыть: https://crafty.nettyan.ru

---

## 📱 Mobile Access

Crafty полностью responsive и работает на мобильных:
- iOS Safari
- Android Chrome
- Планшеты

---

## 🔗 Полезные ссылки

- **Документация:** https://docs.craftycontrol.com/
- **Discord сообщество:** https://discord.gg/crafty-controller
- **Reddit:** https://www.reddit.com/r/craftycontrol/
- **YouTube туториалы:** https://www.youtube.com/@CraftyController

---

## 💡 Альтернативы Crafty Controller

Если Crafty не подходит, рассмотрите:

1. **Pterodactyl** - более мощная панель управления
   - https://pterodactyl.io/
   - Поддержка множества игр

2. **AMP (Application Management Panel)**
   - https://cubecoders.com/AMP
   - Платная, но очень функциональная

3. **MineOS**
   - https://minecraft.codeemo.com/
   - Open source, на базе FreeNAS/TrueNAS

---

## 🚫 Отключение Crafty Controller

Если решите не использовать Crafty:

### Вариант 1: Остановить без удаления

```bash
docker stop crafty_controller
```

### Вариант 2: Удалить полностью

```bash
docker-compose stop crafty
docker-compose rm crafty
docker volume rm nettyanmc_crafty_data nettyanmc_crafty_backups nettyanmc_crafty_logs nettyanmc_crafty_servers
```

### Вариант 3: Использовать Docker Compose profiles

В `docker-compose.yml` раскомментируйте:
```yaml
profiles: ["management"]
```

Тогда Crafty запустится только с флагом:
```bash
docker-compose --profile management up -d crafty
```

---

**Последнее обновление:** 2025-11-21
**Версия Crafty:** 4.x
**Автор:** Claude Code
