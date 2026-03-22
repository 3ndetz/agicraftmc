# Backup Guide - Стратегия резервного копирования

Полное руководство по созданию и восстановлению бэкапов NetTyanMC.

---

## 🎯 Что включает бэкап?

### Критические данные

✅ **PostgreSQL база данных**
- Пользователи, транзакции, донаты
- LuckPerms группы и права
- AuthMe аккаунты игроков

✅ **Minecraft миры**
- Velocity конфигурация
- Survival мир (overworld, nether, end)
- Lobby мир
- AI Research миры

✅ **Конфигурации**
- Конфиги всех плагинов
- Docker Compose конфигурация
- Backend/Frontend исходный код

❌ **НЕ включается:**
- `.env` с реальными паролями (хранить отдельно!)
- Docker images (можно пересобрать)
- Логи (опционально)

---

## ⚡ Быстрый старт

### Создать бэкап

```bash
# Простой бэкап в ./backups
./scripts/backup.sh

# Бэкап на внешний диск
./scripts/backup.sh /mnt/external/nettyanmc-backups

# Бэкап на удаленный сервер (после создания)
./scripts/backup.sh && \
  rsync -avz ./backups/ user@backup-server:/backups/nettyanmc/
```

### Восстановить бэкап

```bash
# 1. Остановить все сервисы
docker-compose down

# 2. Восстановить (см. раздел "Восстановление" ниже)
./scripts/restore.sh /path/to/backup.tar.gz

# 3. Запустить сервисы
docker-compose up -d
```

---

## 📦 Создание бэкапа

### Ручной бэкап

```bash
cd /home/user/NetTyanMC
./scripts/backup.sh
```

**Что делает скрипт:**
1. Создает pg_dump PostgreSQL базы
2. Архивирует все Docker volumes (миры)
3. Копирует конфигурации
4. Сжимает все в один .tar.gz
5. Создает SHA256 checksum
6. Удаляет старые бэкапы (хранит последние 7)

**Вывод:**
```
backups/
└── nettyanmc_backup_20251121_143022.tar.gz       # Архив
└── nettyanmc_backup_20251121_143022.tar.gz.sha256  # Checksum
```

### Автоматический бэкап через cron

```bash
# Редактировать crontab
crontab -e

# Добавить задачу (каждый день в 3:00)
0 3 * * * cd /home/user/NetTyanMC && ./scripts/backup.sh /mnt/backups >> /var/log/nettyanmc-backup.log 2>&1

# Каждые 6 часов
0 */6 * * * cd /home/user/NetTyanMC && ./scripts/backup.sh

# Каждую неделю (воскресенье 2:00)
0 2 * * 0 cd /home/user/NetTyanMC && ./scripts/backup.sh /mnt/weekly-backups
```

### Автоматический бэкап через systemd timer

Создать `/etc/systemd/system/nettyanmc-backup.service`:

```ini
[Unit]
Description=NetTyanMC Backup Service
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
User=user
WorkingDirectory=/home/user/NetTyanMC
ExecStart=/home/user/NetTyanMC/scripts/backup.sh /mnt/backups

[Install]
WantedBy=multi-user.target
```

Создать `/etc/systemd/system/nettyanmc-backup.timer`:

```ini
[Unit]
Description=NetTyanMC Backup Timer
Requires=nettyanmc-backup.service

[Timer]
OnCalendar=daily
OnCalendar=03:00
Persistent=true

[Install]
WantedBy=timers.target
```

Активировать:

```bash
sudo systemctl daemon-reload
sudo systemctl enable nettyanmc-backup.timer
sudo systemctl start nettyanmc-backup.timer

# Проверить статус
sudo systemctl status nettyanmc-backup.timer
sudo systemctl list-timers
```

---

## 🔄 Восстановление бэкапа

### Полное восстановление

```bash
# 1. Остановить все сервисы
cd /home/user/NetTyanMC
docker-compose down

# 2. Распаковать бэкап
BACKUP_FILE="/path/to/nettyanmc_backup_20251121_143022.tar.gz"
tar xzf "$BACKUP_FILE" -C /tmp/

# 3. Восстановить PostgreSQL
# ВАЖНО: Сначала запустить только PostgreSQL
docker-compose up -d postgres
sleep 10  # Дождаться запуска

# Восстановить дамп
cat /tmp/nettyanmc_backup_*/database/postgres_backup.sql | \
  docker exec -i minecraft_postgres psql -U mcserver -d minecraft_server

# 4. Восстановить Minecraft volumes
restore_volume() {
    local volume_name=$1
    local backup_file=$2

    echo "Restoring $volume_name..."

    # Создать volume если не существует
    docker volume create "$volume_name"

    # Восстановить данные
    docker run --rm \
        -v "$volume_name:/data" \
        -v "/tmp/nettyanmc_backup_*/minecraft:/backup:ro" \
        alpine \
        sh -c "cd /data && tar xzf /backup/${backup_file}.tar.gz"
}

restore_volume "nettyanmc_velocity_data" "velocity"
restore_volume "nettyanmc_survival_data" "survival"
restore_volume "nettyanmc_lobby_data" "lobby"
restore_volume "nettyanmc_agents_data" "agents"

# 5. Восстановить конфигурации (опционально, если были изменения)
# cp -r /tmp/nettyanmc_backup_*/configs/* ./

# 6. Запустить все сервисы
docker-compose up -d

# 7. Очистить временные файлы
rm -rf /tmp/nettyanmc_backup_*

echo "✅ Restore completed!"
```

### Частичное восстановление

#### Восстановить только базу данных

```bash
# Распаковать бэкап
tar xzf backup.tar.gz -C /tmp/

# Восстановить БД
docker exec -i minecraft_postgres psql -U mcserver -d minecraft_server < \
  /tmp/nettyanmc_backup_*/database/postgres_backup.sql
```

#### Восстановить только один мир

```bash
# Например, восстановить Survival
docker run --rm \
  -v nettyanmc_survival_data:/data \
  -v /tmp/nettyanmc_backup_*/minecraft:/backup:ro \
  alpine \
  sh -c "cd /data && rm -rf * && tar xzf /backup/survival.tar.gz"

# Перезапустить сервер
docker-compose restart survival
```

---

## 📊 Мониторинг бэкапов

### Проверить последний бэкап

```bash
# Посмотреть список бэкапов
ls -lht ./backups/nettyanmc_backup_*.tar.gz | head -5

# Проверить размер последнего бэкапа
du -sh ./backups/nettyanmc_backup_*.tar.gz | tail -1

# Посмотреть информацию о бэкапе
LATEST_BACKUP=$(ls -t ./backups/nettyanmc_backup_*.tar.gz | head -1)
tar xzf "$LATEST_BACKUP" -O nettyanmc_backup_*/backup_info.txt
```

### Проверить checksum

```bash
# Проверить целостность последнего бэкапа
LATEST_BACKUP=$(ls -t ./backups/nettyanmc_backup_*.tar.gz | head -1)
sha256sum -c "${LATEST_BACKUP}.sha256"

# Должно вывести: nettyanmc_backup_XXXXX.tar.gz: OK
```

### Тестовое восстановление

Регулярно проверяйте что бэкапы работают:

```bash
# Раз в месяц делать тестовое восстановление
# в отдельной директории/контейнере

mkdir /tmp/test-restore
tar xzf latest_backup.tar.gz -C /tmp/test-restore
# ... проверить файлы ...
rm -rf /tmp/test-restore
```

---

## 💾 Стратегия хранения бэкапов

### 3-2-1 Правило

**3 копии** данных:
1. Production данные (Docker volumes)
2. Локальный бэкап (./backups)
3. Удаленный бэкап (облако или другой сервер)

**2 разных типа** носителей:
- SSD/HDD локально
- Облачное хранилище (S3, Google Drive, etc)

**1 копия** offsite (за пределами сервера):
- AWS S3
- Backblaze B2
- Google Drive
- Другой физический сервер

### Схема хранения

```
Локальные бэкапы (./backups):
├── Daily backups (последние 7 дней)
└── Автоматическая ротация

Недельные бэкапы (/mnt/weekly):
├── Weekly backups (последние 4 недели)
└── Ручная очистка

Месячные бэкапы (облако):
├── Monthly backups (последние 12 месяцев)
└── Долгосрочное хранение
```

---

## ☁️ Облачное хранение

### AWS S3

```bash
# Установить AWS CLI
sudo apt install awscli

# Настроить credentials
aws configure

# Загрузить бэкап в S3
LATEST_BACKUP=$(ls -t ./backups/nettyanmc_backup_*.tar.gz | head -1)
aws s3 cp "$LATEST_BACKUP" s3://my-nettyanmc-backups/

# Автоматическая загрузка после бэкапа (добавить в cron)
0 4 * * * cd /home/user/NetTyanMC && ./scripts/backup.sh && aws s3 sync ./backups/ s3://my-nettyanmc-backups/daily/
```

### Backblaze B2

```bash
# Установить B2 CLI
pip install b2

# Авторизация
b2 authorize-account YOUR_KEY_ID YOUR_APP_KEY

# Загрузить бэкап
b2 upload-file nettyanmc-backups ./backups/latest.tar.gz latest.tar.gz

# Автоматическая загрузка
0 4 * * * cd /home/user/NetTyanMC && ./scripts/backup.sh && b2 sync ./backups/ b2://nettyanmc-backups/
```

### Google Drive (rclone)

```bash
# Установить rclone
curl https://rclone.org/install.sh | sudo bash

# Настроить Google Drive
rclone config

# Загрузить бэкап
rclone copy ./backups/ gdrive:NetTyanMC-Backups/

# Автоматическая синхронизация
0 4 * * * cd /home/user/NetTyanMC && ./scripts/backup.sh && rclone sync ./backups/ gdrive:NetTyanMC-Backups/
```

---

## 🔐 Шифрование бэкапов

### GPG шифрование

```bash
# Сгенерировать GPG ключ (если нет)
gpg --gen-key

# Зашифровать бэкап
gpg --encrypt --recipient your-email@example.com \
  backups/nettyanmc_backup_20251121_143022.tar.gz

# Результат: backup.tar.gz.gpg

# Расшифровать
gpg --decrypt backup.tar.gz.gpg > backup.tar.gz
```

### OpenSSL шифрование

```bash
# Зашифровать с паролем
openssl enc -aes-256-cbc -salt \
  -in backup.tar.gz \
  -out backup.tar.gz.enc

# Расшифровать
openssl enc -aes-256-cbc -d \
  -in backup.tar.gz.enc \
  -out backup.tar.gz
```

---

## 🚨 Disaster Recovery Plan

### Сценарий 1: Полная потеря сервера

**Что делать:**

1. Развернуть новый сервер
2. Установить Docker и Docker Compose
3. Склонировать репозиторий NetTyanMC
4. Скачать последний бэкап из облака
5. Восстановить данные (см. раздел "Восстановление")
6. Создать новый `.env` с паролями из безопасного хранилища
7. Запустить: `docker-compose up -d`
8. Проверить работоспособность

**Время восстановления:** 2-4 часа (зависит от размера бэкапа)

### Сценарий 2: Повреждение базы данных

```bash
# 1. Остановить все сервисы использующие БД
docker-compose stop velocity survival lobby agents backend

# 2. Восстановить БД из последнего бэкапа
LATEST_BACKUP=$(ls -t ./backups/nettyanmc_backup_*.tar.gz | head -1)
tar xzf "$LATEST_BACKUP" nettyanmc_backup_*/database/postgres_backup.sql

docker exec -i minecraft_postgres psql -U mcserver -d minecraft_server < \
  nettyanmc_backup_*/database/postgres_backup.sql

# 3. Запустить сервисы
docker-compose up -d
```

### Сценарий 3: Повреждение мира

```bash
# Восстановить конкретный мир (например, Survival)
LATEST_BACKUP=$(ls -t ./backups/nettyanmc_backup_*.tar.gz | head -1)
tar xzf "$LATEST_BACKUP" nettyanmc_backup_*/minecraft/survival.tar.gz

docker run --rm \
  -v nettyanmc_survival_data:/data \
  -v "$(pwd)/nettyanmc_backup_*/minecraft:/backup:ro" \
  alpine \
  sh -c "cd /data && rm -rf world world_nether world_the_end && tar xzf /backup/survival.tar.gz"

docker-compose restart survival
```

---

## 📝 Checklist восстановления

### Перед восстановлением

- [ ] Скачан последний бэкап
- [ ] Проверен checksum бэкапа
- [ ] Есть копия текущего .env
- [ ] Все игроки предупреждены о даунтайме
- [ ] Создан snapshot текущего состояния (если возможно)

### После восстановления

- [ ] Все контейнеры запущены
- [ ] PostgreSQL доступен
- [ ] Backend API отвечает (/health)
- [ ] Frontend загружается
- [ ] Minecraft серверы запущены
- [ ] Игроки могут подключиться
- [ ] LuckPerms права работают
- [ ] AuthMe аутентификация работает
- [ ] YooKassa интеграция работает

---

## 🛠️ Troubleshooting

### Проблема: Бэкап слишком большой

**Решение:**
```bash
# Использовать сжатие с максимальным уровнем
tar czf - backup/ | pigz -9 > backup.tar.gz

# Исключить ненужные файлы
tar czf backup.tar.gz backup/ \
  --exclude='*.log' \
  --exclude='cache/*'
```

### Проблема: Восстановление падает с ошибкой "Permission denied"

**Решение:**
```bash
# Дать права на Docker socket
sudo usermod -aG docker $USER
newgrp docker

# Проверить что volumes accessible
docker volume ls
```

### Проблема: После восстановления не работает LuckPerms

**Решение:**
```bash
# Проверить что PostgreSQL доступен
docker exec minecraft_postgres psql -U mcserver -d minecraft_server -c "\dt"

# Должны быть таблицы luckperms_*

# Перезапустить все Minecraft серверы
docker-compose restart velocity survival lobby agents
```

---

## 📚 Дополнительные ресурсы

- **PostgreSQL Backup:** https://www.postgresql.org/docs/current/backup.html
- **Docker Volumes Backup:** https://docs.docker.com/storage/volumes/#backup-restore-or-migrate-data-volumes
- **Disaster Recovery Best Practices:** https://www.ansible.com/hubfs/pdfs/CloudForms-RPO-RTO.pdf

---

**Последнее обновление:** 2025-11-21
**Версия скрипта:** 1.0
**Автор:** Claude Code
