# GitHub Actions Self-Hosted Runner Setup

Настройка собственного runner для GitHub Actions для автоматического развертывания NetTyanMC.

---

## 🎯 Зачем нужен Self-Hosted Runner?

**GitHub предоставляет бесплатные runners**, но они имеют ограничения:
- ❌ Нет доступа к вашему серверу
- ❌ Не могут управлять локальными Docker контейнерами
- ❌ Ограничение по времени выполнения (2000 минут/месяц)

**Self-Hosted Runner преимущества:**
- ✅ Прямой доступ к production серверу
- ✅ Автоматический deploy при push в main
- ✅ Неограниченное время выполнения
- ✅ Доступ к локальным ресурсам

---

## 📋 Требования

- **OS:** Linux (Ubuntu 20.04+, Debian 11+)
- **RAM:** Минимум 2GB
- **Disk:** 10GB свободного места
- **Docker:** Установлен и запущен
- **Права:** sudo доступ

---

## ⚡ Быстрая установка

### 1. Создать runner на GitHub

1. Открыть репозиторий: https://github.com/kragger-ra/NetTyanMC
2. **Settings → Actions → Runners → New self-hosted runner**
3. Выбрать **Linux** и **x64**
4. GitHub покажет команды установки:

```bash
# Пример команд (ваши будут отличаться!)
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
```

### 2. Настроить runner

```bash
# Ваш токен будет показан на странице GitHub
./config.sh --url https://github.com/kragger-ra/NetTyanMC --token YOUR_TOKEN_HERE

# Когда спросит имя runner:
Enter the name of the runner: production-server

# Когда спросит labels:
Enter any additional labels: self-hosted,linux,x64,production

# Когда спросит рабочую директорию:
Enter name of work folder: [press Enter for _work]
```

### 3. Установить как системный сервис

```bash
# Установить зависимости
sudo ./sbin/install-dependencies.sh

# Создать systemd сервис
sudo ./svc.sh install

# Запустить сервис
sudo ./svc.sh start

# Проверить статус
sudo ./svc.sh status
```

### 4. Проверить подключение

Вернуться на GitHub → Settings → Actions → Runners

Должен появиться runner со статусом **"Idle"** (зеленый).

---

## 🔧 Конфигурация runner

### Добавить runner в Docker group

Runner должен иметь доступ к Docker:

```bash
# Добавить пользователя в группу docker
sudo usermod -aG docker $(whoami)

# Перезапустить сервис
sudo ./svc.sh stop
sudo ./svc.sh start

# Проверить доступ
docker ps  # Должно работать без sudo
```

### Настроить переменные окружения

Создать файл `.env` в `/home/runner/.env`:

```bash
# Runner environment
RUNNER_WORK_DIRECTORY=/home/runner/actions-runner/_work
DOCKER_COMPOSE_FILE=/home/user/NetTyanMC/docker-compose.yml
```

---

## 🚀 Создание GitHub Actions Workflow

### Создать workflow файл

Создаем `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch:  # Позволяет запускать вручную

jobs:
  deploy:
    runs-on: [self-hosted, linux, production]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Create .env file
        run: |
          echo "Creating .env from secrets..."
          cat > .env << EOF
          POSTGRES_DB=${{ secrets.POSTGRES_DB }}
          POSTGRES_USER=${{ secrets.POSTGRES_USER }}
          POSTGRES_PASSWORD=${{ secrets.POSTGRES_PASSWORD }}
          JWT_SECRET=${{ secrets.JWT_SECRET }}
          YOOKASSA_SHOP_ID=${{ secrets.YOOKASSA_SHOP_ID }}
          YOOKASSA_SECRET_KEY=${{ secrets.YOOKASSA_SECRET_KEY }}
          FRONTEND_URL=${{ secrets.FRONTEND_URL }}
          VITE_API_URL=${{ secrets.VITE_API_URL }}
          NODE_ENV=production
          EOF

      - name: Pull latest Docker images
        run: docker-compose pull

      - name: Build custom images
        run: docker-compose build --no-cache backend frontend

      - name: Deploy with Docker Compose
        run: |
          docker-compose up -d --remove-orphans
          docker-compose ps

      - name: Wait for services to be healthy
        run: |
          echo "Waiting for services to start..."
          sleep 30
          docker-compose ps

      - name: Run database migrations (if any)
        run: |
          echo "Running migrations..."
          # docker-compose exec -T postgres psql -U ${{ secrets.POSTGRES_USER }} -d ${{ secrets.POSTGRES_DB }} -f /migrations/latest.sql

      - name: Cleanup old images
        run: docker image prune -f

      - name: Send notification
        if: always()
        run: |
          if [ ${{ job.status }} == 'success' ]; then
            echo "✅ Deployment successful!"
          else
            echo "❌ Deployment failed!"
          fi
```

---

## 🔐 Настройка Secrets в GitHub

### Добавить secrets в репозиторий

GitHub → Settings → Secrets and variables → Actions → New repository secret

**Обязательные secrets:**

```
POSTGRES_DB=minecraft_server
POSTGRES_USER=mcserver
POSTGRES_PASSWORD=your_secure_password_here
JWT_SECRET=your_jwt_secret_key_here
YOOKASSA_SHOP_ID=your_yookassa_shop_id
YOOKASSA_SECRET_KEY=your_yookassa_secret_key
FRONTEND_URL=https://mc.nettyan.ru
VITE_API_URL=/api
```

**Как добавить:**
1. **New repository secret**
2. Name: `POSTGRES_PASSWORD`
3. Value: `your_secure_password`
4. **Add secret**
5. Повторить для всех secrets

---

## 📊 Monitoring Runner

### Проверить статус runner

```bash
# Статус systemd сервиса
sudo systemctl status actions.runner.kragger-ra-NetTyanMC.production-server.service

# Логи runner
sudo journalctl -u actions.runner.*.service -f

# Ручная проверка
cd ~/actions-runner
./run.sh  # Запустить в foreground для отладки
```

### Мониторинг через GitHub

GitHub → Settings → Actions → Runners → [Your Runner]

Показывает:
- Статус (Idle/Active/Offline)
- Labels
- Last job run
- System info

---

## 🛡️ Безопасность

### 1. Ограничить доступ к runner

Runner должен запускаться **только** для доверенных репозиториев:

```bash
# Проверить что runner настроен только для вашего репо
cat ~/actions-runner/.runner

# Должно быть:
# GitHubUrl: https://github.com/kragger-ra/NetTyanMC
```

### 2. Изолировать runner пользователя

Не запускать runner от root:

```bash
# Создать отдельного пользователя
sudo useradd -m -s /bin/bash github-runner
sudo usermod -aG docker github-runner

# Переустановить runner под этим пользователем
sudo su - github-runner
# Повторить установку
```

### 3. Firewall

```bash
# Runner НЕ требует входящих подключений
# Только исходящие к api.github.com

# Проверить что firewall не блокирует
curl -I https://api.github.com
```

### 4. Регулярно обновлять runner

GitHub уведомит об обновлениях через:
- Email
- GitHub UI (красный badge на runner)

```bash
# Обновить runner
cd ~/actions-runner
sudo ./svc.sh stop
./config.sh remove --token YOUR_REMOVE_TOKEN
# Скачать новую версию
# Повторить установку
```

---

## 🔄 Автоматический deploy workflow

### Полный пример production workflow

`.github/workflows/production-deploy.yml`:

```yaml
name: Production Deploy

on:
  push:
    branches: [main]
    paths-ignore:
      - 'docs/**'
      - '**.md'
      - '.gitignore'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install backend dependencies
        run: cd backend && npm ci

      - name: Run backend tests
        run: cd backend && npm test

      - name: Install frontend dependencies
        run: cd frontend && npm ci

      - name: Build frontend
        run: cd frontend && npm run build

  deploy:
    needs: test
    runs-on: [self-hosted, linux, production]

    steps:
      - uses: actions/checkout@v4

      - name: Create .env
        run: |
          cat > .env << 'EOF'
          POSTGRES_DB=${{ secrets.POSTGRES_DB }}
          POSTGRES_USER=${{ secrets.POSTGRES_USER }}
          POSTGRES_PASSWORD=${{ secrets.POSTGRES_PASSWORD }}
          JWT_SECRET=${{ secrets.JWT_SECRET }}
          RCON_PASSWORD=${{ secrets.RCON_PASSWORD }}
          YOOKASSA_SHOP_ID=${{ secrets.YOOKASSA_SHOP_ID }}
          YOOKASSA_SECRET_KEY=${{ secrets.YOOKASSA_SECRET_KEY }}
          YOOKASSA_RETURN_URL=${{ secrets.YOOKASSA_RETURN_URL }}
          YOOKASSA_WEBHOOK_URL=${{ secrets.YOOKASSA_WEBHOOK_URL }}
          FRONTEND_URL=${{ secrets.FRONTEND_URL }}
          VITE_API_URL=${{ secrets.VITE_API_URL }}
          NODE_ENV=production
          SURVIVAL_MEMORY=10G
          AI_RESEARCH_MEMORY=10G
          LOBBY_MEMORY=2G
          VELOCITY_MEMORY=1G
          TZ=Europe/Moscow
          EOF

      - name: Backup database
        run: |
          mkdir -p backups
          docker exec minecraft_postgres pg_dump -U ${{ secrets.POSTGRES_USER }} ${{ secrets.POSTGRES_DB }} > backups/db_backup_$(date +%Y%m%d_%H%M%S).sql
          # Оставить только последние 7 бэкапов
          ls -t backups/db_backup_*.sql | tail -n +8 | xargs -r rm

      - name: Pull latest images
        run: docker-compose pull

      - name: Build custom images
        run: docker-compose build backend frontend

      - name: Deploy
        run: |
          docker-compose up -d --remove-orphans
          echo "Waiting for services to be healthy..."
          sleep 45
          docker-compose ps

      - name: Health check
        run: |
          # Проверить что backend отвечает
          curl -f http://localhost:3000/health || exit 1

          # Проверить что Velocity запущен
          docker-compose exec -T velocity ps aux | grep java || exit 1

      - name: Cleanup
        run: |
          docker image prune -f
          docker volume prune -f

      - name: Notify Discord
        if: always()
        env:
          DISCORD_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK }}
        run: |
          STATUS="${{ job.status }}"
          COLOR=$([[ "$STATUS" == "success" ]] && echo "3066993" || echo "15158332")

          curl -H "Content-Type: application/json" \
            -d "{\"embeds\": [{\"title\": \"Deployment $STATUS\", \"color\": $COLOR, \"fields\": [{\"name\": \"Commit\", \"value\": \"${{ github.sha }}\"}]}]}" \
            $DISCORD_WEBHOOK
```

---

## 🧪 Тестирование runner

### Создать тестовый workflow

`.github/workflows/test-runner.yml`:

```yaml
name: Test Self-Hosted Runner

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: [self-hosted, linux, production]

    steps:
      - name: Check runner info
        run: |
          echo "Runner name: $RUNNER_NAME"
          echo "Runner OS: $RUNNER_OS"
          echo "Runner workspace: $RUNNER_WORKSPACE"

      - name: Check Docker access
        run: docker ps

      - name: Check disk space
        run: df -h

      - name: Check memory
        run: free -h

      - name: Test network
        run: curl -I https://api.github.com
```

Запустить:
1. GitHub → Actions → Test Self-Hosted Runner
2. **Run workflow**
3. Проверить логи

---

## 🚨 Troubleshooting

### Runner не подключается

```bash
# Проверить сетевой доступ
curl -I https://api.github.com

# Проверить статус сервиса
sudo systemctl status actions.runner.*.service

# Посмотреть логи
sudo journalctl -u actions.runner.*.service -n 50
```

### Runner показывает "Offline"

```bash
# Перезапустить сервис
cd ~/actions-runner
sudo ./svc.sh stop
sudo ./svc.sh start

# Переконфигурировать (если нужно)
./config.sh remove --token YOUR_REMOVE_TOKEN
./config.sh --url https://github.com/kragger-ra/NetTyanMC --token YOUR_NEW_TOKEN
sudo ./svc.sh install
sudo ./svc.sh start
```

### Workflow падает с "Permission denied"

```bash
# Убедиться что runner в группе docker
groups $(whoami)  # Должна быть группа "docker"

# Если нет, добавить:
sudo usermod -aG docker $(whoami)

# Перелогиниться или перезапустить сервис
sudo ./svc.sh restart
```

### Не хватает места на диске

```bash
# Очистить Docker
docker system prune -a --volumes -f

# Очистить старые builds
cd ~/actions-runner/_work
rm -rf */

# Настроить автоочистку в workflow (см. пример выше)
```

---

## 📚 Дополнительные ресурсы

- **GitHub Docs:** https://docs.github.com/en/actions/hosting-your-own-runners
- **Best Practices:** https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners#self-hosted-runner-security
- **Examples:** https://github.com/actions/runner/tree/main/docs

---

## 🔄 Обновление runner

GitHub периодически выпускает обновления:

```bash
# 1. Остановить runner
cd ~/actions-runner
sudo ./svc.sh stop

# 2. Удалить конфигурацию (сохранится на GitHub)
./config.sh remove --token YOUR_REMOVE_TOKEN

# 3. Скачать новую версию
cd ~
wget https://github.com/actions/runner/releases/download/vX.XXX.X/actions-runner-linux-x64-X.XXX.X.tar.gz
tar xzf actions-runner-linux-x64-X.XXX.X.tar.gz -C actions-runner/

# 4. Переконфигурировать
cd actions-runner
./config.sh --url https://github.com/kragger-ra/NetTyanMC --token YOUR_TOKEN

# 5. Переустановить сервис
sudo ./svc.sh install
sudo ./svc.sh start
```

---

**Последнее обновление:** 2025-11-21
**GitHub Actions Runner Version:** 2.311.0
**Автор:** Claude Code
