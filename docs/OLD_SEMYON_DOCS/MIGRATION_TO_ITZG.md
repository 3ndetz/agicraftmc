# Миграция на itzg/minecraft-server

Дата миграции: 15 ноября 2025

---

## Обзор

Проект мигрирован с кастомных Dockerfile (на базе `eclipse-temurin:21-jre`) на специализированный образ **[itzg/minecraft-server](https://github.com/itzg/docker-minecraft-server)**.

### Преимущества миграции:
- ✅ Автоматическая загрузка Paper/Velocity JAR файлов
- ✅ Встроенная оптимизация JVM (Aikar's flags)
- ✅ Упрощенная конфигурация через переменные окружения
- ✅ Поддержка автообновлений
- ✅ Меньше кода для поддержки
- ✅ Активная поддержка сообщества

---

## Изменения в docker-compose.yml

### До миграции (кастомный Dockerfile):
```yaml
survival:
  build: ./survival
  container_name: minecraft_survival
  volumes:
    - ./survival:/server
  environment:
    JAVA_MEMORY: ${SURVIVAL_MEMORY:-10G}
```

### После миграции (itzg образ):
```yaml
survival:
  image: itzg/minecraft-server
  container_name: minecraft_survival
  environment:
    TYPE: PAPER
    VERSION: 1.21.1
    MEMORY: ${SURVIVAL_MEMORY:-10G}
    EULA: "TRUE"
    ONLINE_MODE: "FALSE"
    SERVER_PORT: 25565
    USE_AIKAR_FLAGS: "TRUE"
  volumes:
    - ./survival:/data
```

**Ключевые изменения:**
- `build: ./survival` → `image: itzg/minecraft-server`
- `./survival:/server` → `./survival:/data` (новый путь монтирования)
- Добавлены переменные окружения для автоконфигурации

---

## Изменение путей

| Старый путь (кастомный) | Новый путь (itzg) | Описание |
|-------------------------|-------------------|----------|
| `/server/` | `/data/` | Корневая директория сервера |
| `/server/plugins/` | `/data/plugins/` | Плагины |
| `/server/world/` | `/data/world/` | Мир |
| `/server/paper.jar` | Автоматически | JAR файл загружается автоматически |
| `/server/eula.txt` | Через `EULA=TRUE` | EULA принимается через переменную |

**Важно:** Все существующие файлы (плагины, конфиги, миры) остаются на месте в `./survival/`, `./lobby/` и т.д. Изменяется только путь монтирования внутри контейнера.

---

## Переменные окружения

### Paper серверы (Survival, Lobby, AI Research)

| Переменная | Значение | Описание |
|------------|----------|----------|
| `TYPE` | `PAPER` | Тип сервера |
| `VERSION` | `1.21.1` | Версия Minecraft |
| `MEMORY` | `10G` | Выделенная RAM |
| `EULA` | `"TRUE"` | Принятие EULA |
| `ONLINE_MODE` | `"FALSE"` | Оффлайн режим |
| `SERVER_PORT` | `25565` | Внутренний порт |
| `USE_AIKAR_FLAGS` | `"TRUE"` | Оптимизация JVM |

### Velocity прокси

| Переменная | Значение | Описание |
|------------|----------|----------|
| `TYPE` | `VELOCITY` | Тип прокси |
| `VERSION` | `LATEST` | Последняя версия Velocity |
| `MEMORY` | `1G` | Выделенная RAM |
| `EULA` | `"TRUE"` | Принятие EULA |

---

## Удаленные файлы

Следующие файлы были удалены, так как больше не нужны:

- ❌ `velocity/Dockerfile`
- ❌ `survival/Dockerfile`
- ❌ `lobby/Dockerfile`
- ❌ `ai_research/Dockerfile`

**Paper/Velocity JAR файлы** теперь загружаются автоматически при первом запуске контейнера.

---

## Автозагрузка плагинов

itzg образ поддерживает автоматическую загрузку плагинов из различных источников:

### Через переменные окружения:

```yaml
environment:
  SPIGET_RESOURCES: "1234,5678"  # ID с SpigotMC
  MODRINTH_PROJECTS: "worldedit"  # Проекты с Modrinth
```

### Через монтирование (текущий подход):
```yaml
volumes:
  - ./survival:/data
```

Плагины размещаются в `./survival/plugins/` и автоматически загружаются при запуске.

---

## Первый запуск после миграции

### 1. Остановить старые контейнеры
```bash
docker-compose down
```

### 2. Очистить старые образы (опционально)
```bash
docker rmi $(docker images | grep minecraft_survival | awk '{print $3}')
docker rmi $(docker images | grep minecraft_lobby | awk '{print $3}')
docker rmi $(docker images | grep minecraft_airesearch | awk '{print $3}')
docker rmi $(docker images | grep minecraft_velocity | awk '{print $3}')
```

### 3. Запустить с новыми образами
```bash
docker-compose up -d
```

### 4. Проверить логи
```bash
docker-compose logs -f survival
docker-compose logs -f velocity
```

При первом запуске itzg образ:
1. Загрузит Paper/Velocity JAR файлы
2. Сгенерирует конфигурационные файлы
3. Применит переменные окружения
4. Запустит сервер

---

## Troubleshooting

### Проблема: Сервер не запускается

**Проверить логи:**
```bash
docker-compose logs survival
```

**Типичные причины:**
- Недостаточно RAM (проверить MEMORY переменную)
- Конфликт портов (проверить ports в docker-compose.yml)
- Неправильная VERSION (проверить совместимость плагинов)

### Проблема: Плагины не загружаются

**Проверить путь:**
```bash
docker-compose exec survival ls -la /data/plugins
```

Должны быть видны `.jar` файлы плагинов.

**Проверить permissions:**
```bash
ls -la survival/plugins
```

### Проблема: Миры не найдены

**Проверить монтирование:**
```bash
docker-compose exec survival ls -la /data/world
```

Если мир отсутствует, проверить что `./survival/world/` существует на хосте.

---

## Откат (если нужно)

Если возникли проблемы и нужно вернуться к старым Dockerfile:

### 1. Восстановить Dockerfile из Git истории
```bash
git checkout HEAD~1 -- velocity/Dockerfile
git checkout HEAD~1 -- survival/Dockerfile
git checkout HEAD~1 -- lobby/Dockerfile
git checkout HEAD~1 -- ai_research/Dockerfile
```

### 2. Обновить docker-compose.yml
Заменить `image: itzg/minecraft-server` на `build: ./название`

### 3. Пересобрать
```bash
docker-compose up -d --build
```

---

## Дополнительные возможности itzg образа

### Модпаки
```yaml
environment:
  TYPE: FORGE
  FORGEVERSION: 47.2.0
  MODPACK: https://example.com/modpack.zip
```

### Резервное копирование
```yaml
environment:
  ENABLE_ROLLING_LOGS: "true"
  BACKUP_INTERVAL: "2h"
```

### Мониторинг
```yaml
environment:
  ENABLE_RCON: "true"
  RCON_PASSWORD: "password"
```

Полная документация: https://docker-minecraft-server.readthedocs.io/

---

## Ссылки

- [itzg/minecraft-server GitHub](https://github.com/itzg/docker-minecraft-server)
- [Официальная документация](https://docker-minecraft-server.readthedocs.io/)
- [Примеры конфигураций](https://github.com/itzg/docker-minecraft-server/tree/master/examples)
