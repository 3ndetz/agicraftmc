# POST CLONE SETUP - Развертывание после клонирования

Этот документ описывает все шаги для полного развертывания сервера после клонирования репозитория.

**⚠️ ВАЖНО:** Этот файл должен обновляться при любых изменениях требований к развертыванию!

---

## 📋 Чек-лист готовности

- [ ] Git репозиторий склонирован
- [ ] Установлен Java 21+
- [ ] Установлен Docker и Docker Compose
- [ ] Установлен PostgreSQL (или используется Docker)
- [ ] Достаточно RAM (минимум 24GB)

---

## 1️⃣ Скачивание JAR файлов

Все .jar файлы исключены из Git (.gitignore). Их нужно скачать вручную.

### 1.1 Server Cores (ядра серверов)

**Paper 1.21.1:**
```bash
# Ссылка: https://papermc.io/downloads/paper
# Версия: 1.21.1 (build #XXX или новее)

# Скачать и положить в:
lobby/paper.jar
survival/paper.jar
ai_research/paper.jar
```

**Velocity 3.4.0+:**
```bash
# Ссылка: https://papermc.io/downloads/velocity
# Версия: 3.4.0 или новее

# Скачать и положить в:
velocity/velocity.jar
```

### 1.2 Плагины

**Обязательные плагины для всех серверов:**

1. **LuckPerms** (https://luckperms.net/download)
   - `LuckPerms-Bukkit-5.5.17.jar` → `lobby/plugins/`, `survival/plugins/`, `ai_research/plugins/`
   - `LuckPerms-Velocity-5.5.17.jar` → `velocity/plugins/`

2. **WorldGuard** (https://enginehub.org/worldguard)
   - `worldguard-bukkit-7.0.14-dist.jar` → `lobby/plugins/`, `survival/plugins/`, `ai_research/plugins/`

3. **WorldEdit** (https://enginehub.org/worldedit)
   - `worldedit-bukkit-7.3.17.jar` → `lobby/plugins/`, `survival/plugins/`, `ai_research/plugins/`

4. **EssentialsX** (https://essentialsx.net/downloads.html)
   - `EssentialsX-2.22.0.jar` → `lobby/plugins/`, `survival/plugins/`, `ai_research/plugins/`
   - `EssentialsXSpawn-2.22.0.jar` → `survival/plugins/`

**Lobby сервер (дополнительно):**

5. **AuthMe** (https://www.spigotmc.org/resources/authmereloaded.6269/)
   - `AuthMe-5.6.0-legacy.jar` → `lobby/plugins/`
   - ⚠️ Авторизация теперь на Lobby, не на Survival!

6. **DecentHolograms** (https://www.spigotmc.org/resources/decentholograms.96927/)
   - `DecentHolograms-2.8.11.jar` → `lobby/plugins/`

7. **FancyNpcs** (https://modrinth.com/plugin/fancynpcs)
   - `FancyNpcs-2.2.5.jar` → `lobby/plugins/`

8. **TAB** (опционально) (https://github.com/NEZNAMY/TAB)
   - `TAB-5.0.3.jar` → `lobby/plugins/`

**Survival сервер (дополнительно):**

9. **Vault** (https://www.spigotmc.org/resources/vault.34315/)
   - `Vault.jar` → `survival/plugins/`

10. **PlayerPoints** (https://www.spigotmc.org/resources/playerpoints.80745/)
    - `PlayerPoints-3.2.7.jar` → `survival/plugins/`

11. **ShopGUIPlus** (https://www.spigotmc.org/resources/shopgui-1-8-1-21.6515/)
    - `ShopGUIPlus-1.117.0.jar` → `survival/plugins/`

12. **Multiverse-Core** (https://dev.bukkit.org/projects/multiverse-core)
    - `multiverse-core-5.3.3.jar` → `survival/plugins/`

13. **VoidGenerator** (опционально, для void миров)
    - `VoidGen-2.2.1.jar` → `survival/plugins/`

**AI Research сервер:**
- Только базовые плагины (LuckPerms, WorldGuard, WorldEdit, EssentialsX)

---

## 2️⃣ Настройка переменных окружения

### 2.1 Создать .env файл

Скопировать `.env.example` → `.env`:
```bash
cp .env.example .env
```

### 2.2 Обязательно изменить:

```env
# PostgreSQL (изменить пароль!)
POSTGRES_PASSWORD=StrongPass123!

# Backend JWT (сгенерировать новый секрет!)
JWT_SECRET=your_super_secret_jwt_key_change_this_to_random_string

# RCON (изменить пароль!)
RCON_PASSWORD=your_rcon_password

# YooKassa (получить в личном кабинете)
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key

# Domain (если есть домен)
DOMAIN=your_domain.ru
LETSENCRYPT_EMAIL=your_email@example.com
```

---

## 3️⃣ Запуск PostgreSQL

### Вариант A: Docker (рекомендуется)

```bash
docker-compose up -d postgres
```

### Вариант B: Локальная установка

Установить PostgreSQL 16:
- Windows: https://www.postgresql.org/download/windows/
- Linux: `sudo apt install postgresql-16`

Создать базу данных:
```bash
psql -U postgres
CREATE DATABASE minecraft_server;
CREATE USER mcserver WITH PASSWORD 'StrongPass123!';
GRANT ALL PRIVILEGES ON DATABASE minecraft_server TO mcserver;
\q
```

Применить схему:
```bash
psql -U mcserver -d minecraft_server -f postgres/init.sql
```

---

## 4️⃣ Первый запуск серверов

### 4.1 Запустить все через Docker

```bash
docker-compose up -d
```

Подождать 60-90 секунд для полной инициализации.

### 4.2 Проверить статус

```bash
docker-compose ps
```

Все контейнеры должны быть в статусе `Up`.

### 4.3 Проверить логи

```bash
docker logs minecraft_lobby
docker logs minecraft_survival
docker logs minecraft_airesearch
docker logs minecraft_velocity
```

---

## 5️⃣ Настройка в игре (In-game commands)

### 5.1 LuckPerms - создание групп

Подключиться к консоли Velocity или любого сервера:
```bash
docker attach minecraft_velocity
```

Выполнить команды из `LUCKPERMS_SETUP.md`:
```bash
# Создать донатные группы
/lp creategroup default
/lp creategroup new
/lp creategroup helper
/lp creategroup starter
/lp creategroup vip
/lp creategroup premium
/lp creategroup elite
/lp creategroup legend

# Создать AI группы
/lp creategroup ai_research
/lp creategroup ai_person
/lp creategroup netfather

# Настроить bypass AuthMe для AI групп
/lp group ai_research permission set authme.bypass.register true
/lp group ai_research permission set authme.bypass.login true
/lp group ai_person parent add ai_research
/lp group netfather permission set * true

# См. полный список команд в LUCKPERMS_SETUP.md
```

### 5.2 Lobby сервер - настройка

```bash
docker attach minecraft_lobby
```

Команды:
```bash
# Установить spawn point
setworldspawn 0 100 0

# Создать защиту spawn (WorldGuard)
/rg define spawn -50 0 -50 50 256 50
/rg flag spawn pvp deny
/rg flag spawn block-break deny
/rg flag spawn block-place deny
/rg flag spawn mob-spawning deny
/rg flag spawn greeting &aДобро пожаловать на сервер!

# Создать NPC для телепортации (FancyNpcs)
/npc create Survival
/npc action add command /server survival

/npc create AI_Research
/npc action add command /server ai_research

# См. подробную инструкцию в LOBBY_SETUP.md
```

### 5.3 Survival сервер - настройка

```bash
docker attach minecraft_survival
```

Команды:
```bash
# Установить spawn point
/mvtp world
/tp 0 70 0
/setworldspawn 0 70 0

# Настроить регионы (опционально)
# См. подробную инструкцию в DEPLOYMENT_GUIDE.md
```

### 5.4 AI Research сервер - настройка

```bash
docker attach minecraft_airesearch
```

Команды:
```bash
# Защита spawn
/rg define spawn -250 0 -250 250 320 250
/rg flag spawn pvp deny
/rg flag spawn block-break deny

# Защита Нижнего мира (50x50)
/mvtp world_ai_nether
/rg define nether_spawn -25 0 -25 25 128 25
/rg flag nether_spawn pvp deny

# См. подробную инструкцию в AI_RESEARCH_SETUP.md
```

---

## 6️⃣ Настройка Frontend/Backend

### 6.1 Установить зависимости

```bash
# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### 6.2 Запустить (опционально, если не используете Docker)

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

---

## 7️⃣ Настройка HTTPS (опционально)

Если у вас есть домен:

1. Купить домен (reg.ru, ~140₽/год)
2. Настроить A-запись на ваш IP
3. Открыть порты 80, 443 на роутере
4. Обновить `.env`:
   ```env
   DOMAIN=your_domain.ru
   LETSENCRYPT_EMAIL=your_email@example.com
   FRONTEND_URL=https://your_domain.ru
   ```
5. Запустить Caddy:
   ```bash
   docker-compose up -d caddy
   ```

См. подробную инструкцию: `HTTPS_SETUP.md` или `QUICK_START_HTTPS.md`

---

## 8️⃣ Проверка работоспособности

### 8.1 Тест подключения

Minecraft:
- `localhost:25565` - Velocity Proxy → Lobby
- `localhost:25570` - AI Research (прямой доступ)

Веб-сайт:
- `http://localhost` - Frontend
- `http://localhost:3000/api` - Backend API

### 8.2 Тест авторизации

1. Зайти на `localhost:25565`
2. Должен попасть на Lobby
3. Выполнить `/register password password`
4. После авторизации остаться на Lobby
5. Через NPC телепортироваться на Survival или AI Research

### 8.3 Тест AI групп bypass

1. Создать тестового бота:
   ```bash
   /lp user TestBot parent set ai_person
   ```
2. Подключиться под ником `TestBot`
3. Авторизация должна быть пропущена
4. Бот должен сразу попасть на AI Research

---

## 9️⃣ Дополнительные настройки

### 9.1 Изменение паролей в production

⚠️ **ОБЯЗАТЕЛЬНО** изменить:
- PostgreSQL пароль в `.env` и всех конфигах LuckPerms
- JWT_SECRET в `.env`
- RCON_PASSWORD в `.env`
- YooKassa credentials (получить в личном кабинете)

### 9.2 Настройка бэкапов

Создать скрипт автоматического бэкапа:
```bash
# TODO: Добавить в будущих версиях
```

### 9.3 Мониторинг

Проверка статуса контейнеров:
```bash
docker-compose ps
./status.bat  # Windows
```

Просмотр логов:
```bash
docker logs -f minecraft_lobby
docker logs -f minecraft_survival
docker logs -f minecraft_airesearch
```

---

## 🐛 Troubleshooting (Решение проблем)

### Проблема: Сервер не запускается

**Решение:**
1. Проверить логи: `docker logs minecraft_lobby`
2. Убедиться что Paper/Velocity JAR файлы скачаны
3. Проверить что `eula.txt` с `eula=true` создан

### Проблема: LuckPerms не синхронизирует данные

**Решение:**
1. Проверить что PostgreSQL запущен: `docker ps | grep postgres`
2. Проверить конфиг LuckPerms: `storage-method: postgresql`
3. Проверить `messaging-service: sql` во всех конфигах LuckPerms

### Проблема: AuthMe не пускает на сервер

**Решение:**
1. Убедиться что AuthMe только на Lobby сервере
2. Проверить bypass permissions для AI групп:
   ```bash
   /lp group ai_person permission check authme.bypass.login
   ```
3. Проверить конфиг AuthMe: `lobby/plugins/AuthMe/config.yml`

### Проблема: Frontend не подключается к Backend

**Решение:**
1. Проверить что Backend запущен: `docker ps | grep backend`
2. Проверить `VITE_API_URL` в frontend/.env
3. Проверить CORS настройки в backend/src/index.js

---

## 📝 Примечания

- Все конфиги плагинов уже настроены в репозитории
- Только JAR файлы и .env нужно создавать вручную
- Worlds (миры) создаются автоматически при первом запуске
- PlayerData будет пустым до первого входа игроков

---

## 🔄 Обновление этого файла

**При добавлении нового плагина:**
1. Добавить ссылку на скачивание в раздел 1.2
2. Указать путь куда класть JAR
3. Описать конфигурацию (если требуется)

**При изменении архитектуры:**
1. Обновить раздел 4️⃣ (запуск серверов)
2. Обновить раздел 5️⃣ (in-game команды)
3. Обновить раздел 8️⃣ (тесты)

**При изменении требований:**
1. Обновить раздел 2️⃣ (.env переменные)
2. Обновить раздел 3️⃣ (база данных)
3. Обновить чек-лист в начале файла

---

**Версия документа:** 1.0
**Последнее обновление:** 14 ноября 2025
**Совместимость:** Minecraft 1.21.1, Paper/Velocity latest, PostgreSQL 16
