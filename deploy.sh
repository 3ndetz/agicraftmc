#!/bin/bash

# ============================================
# NetTyanMC Deployment Script
# ============================================
# Использование:
#   ./deploy.sh           - автоматический деплой
#   ./deploy.sh --force   - полный перезапуск всех сервисов
#   ./deploy.sh --check   - только проверка без изменений
# ============================================

set -e  # Остановка при ошибках

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Параметры
FORCE_RESTART=false
CHECK_ONLY=false

# Парсинг аргументов
while [[ $# -gt 0 ]]; do
  case $1 in
    --force)
      FORCE_RESTART=true
      shift
      ;;
    --check)
      CHECK_ONLY=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--force] [--check]"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}======================================"
echo "NetTyanMC Deployment Script"
echo "======================================${NC}"

# Проверка что мы в правильной директории
if [ ! -f "docker-compose.yml" ]; then
  echo -e "${RED}Error: docker-compose.yml not found${NC}"
  echo "Please run this script from the project root directory"
  exit 1
fi

# Проверка текущего коммита
echo -e "${YELLOW}Current commit:${NC}"
git log -1 --oneline

if [ "$CHECK_ONLY" = true ]; then
  echo -e "${GREEN}Check-only mode - no changes will be made${NC}"
  echo ""
  echo "Checking for updates..."
  git fetch origin
  if git status -uno | grep -q "Your branch is behind"; then
    echo -e "${YELLOW}Updates available!${NC}"
    git log HEAD..origin/main --oneline
  else
    echo -e "${GREEN}Already up to date${NC}"
  fi
  exit 0
fi

# Создаем backup перед обновлением
echo ""
echo -e "${YELLOW}Creating database backup...${NC}"
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
if docker compose ps postgres | grep -q "Up"; then
  docker exec minecraft_postgres pg_dump -U mcserver minecraft_server > "$BACKUP_FILE" 2>/dev/null || echo "Backup skipped (db not running)"
  if [ -f "$BACKUP_FILE" ]; then
    echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
  fi
fi

# Stash локальных изменений
if ! git diff-index --quiet HEAD --; then
  echo ""
  echo -e "${YELLOW}Stashing local changes...${NC}"
  git stash push -m "Auto-stash before deployment $(date +%Y%m%d_%H%M%S)"
fi

# Получаем последние изменения
echo ""
echo -e "${YELLOW}Pulling latest changes...${NC}"
BEFORE_COMMIT=$(git rev-parse HEAD)
git fetch origin
git pull origin main
AFTER_COMMIT=$(git rev-parse HEAD)

if [ "$BEFORE_COMMIT" = "$AFTER_COMMIT" ]; then
  echo -e "${GREEN}Already up to date - no deployment needed${NC}"
  if [ "$FORCE_RESTART" = false ]; then
    exit 0
  fi
  echo -e "${YELLOW}Force restart requested...${NC}"
fi

echo ""
echo -e "${GREEN}New commit:${NC}"
git log -1 --oneline

# Показываем изменённые файлы
echo ""
echo -e "${YELLOW}======================================"
echo "Changed files in this update:"
echo "======================================${NC}"
if [ "$BEFORE_COMMIT" != "$AFTER_COMMIT" ]; then
  git diff --name-status $BEFORE_COMMIT $AFTER_COMMIT
else
  echo "No changes"
fi
echo ""

# Определяем что нужно перезапустить
RESTART_SERVICES=""
BUILD_SERVICES=""

if [ "$FORCE_RESTART" = true ]; then
  echo -e "${YELLOW}Force restart - restarting all services${NC}"
  RESTART_SERVICES="all"
else
  # Проверяем изменения в backend
  if git diff --name-only $BEFORE_COMMIT $AFTER_COMMIT | grep -q "^backend/"; then
    echo -e "${YELLOW}Backend changes detected${NC}"
    RESTART_SERVICES="$RESTART_SERVICES backend"
    BUILD_SERVICES="$BUILD_SERVICES backend"
  fi

  # Проверяем изменения в frontend
  if git diff --name-only $BEFORE_COMMIT $AFTER_COMMIT | grep -q "^frontend/"; then
    echo -e "${YELLOW}Frontend changes detected${NC}"
    RESTART_SERVICES="$RESTART_SERVICES frontend"
    BUILD_SERVICES="$BUILD_SERVICES frontend"
  fi

  # Проверяем изменения в конфигах Minecraft
  if git diff --name-only $BEFORE_COMMIT $AFTER_COMMIT | grep -qE "(survival|lobby|agents|velocity)/config/"; then
    echo -e "${YELLOW}Minecraft config changes detected${NC}"
    RESTART_SERVICES="$RESTART_SERVICES survival lobby agents velocity"
  fi

  # Проверяем изменения в docker-compose.yml или postgres
  if git diff --name-only $BEFORE_COMMIT $AFTER_COMMIT | grep -qE "docker-compose.yml|postgres/"; then
    echo -e "${YELLOW}docker-compose.yml or postgres schema changed - full restart required${NC}"
    RESTART_SERVICES="all"
  fi
fi

# Перезапускаем сервисы
echo ""
echo -e "${GREEN}======================================"
echo "Restarting Services"
echo "======================================${NC}"

if [ "$RESTART_SERVICES" = "all" ]; then
  echo -e "${YELLOW}Performing full restart...${NC}"
  docker compose down
  docker compose up -d
elif [ -n "$RESTART_SERVICES" ]; then
  echo -e "${YELLOW}Restarting services: $RESTART_SERVICES${NC}"

  # Пересборка если нужно
  if [ -n "$BUILD_SERVICES" ]; then
    echo -e "${YELLOW}Rebuilding: $BUILD_SERVICES${NC}"
    docker compose build $BUILD_SERVICES
  fi

  # Перезапуск
  docker compose up -d $RESTART_SERVICES
else
  echo -e "${GREEN}No service restart required${NC}"
fi

# Ждем немного чтобы сервисы запустились
if [ -n "$RESTART_SERVICES" ]; then
  echo ""
  echo -e "${YELLOW}Waiting for services to start...${NC}"
  sleep 5
fi

# Проверяем статус
echo ""
echo -e "${GREEN}======================================"
echo "Service Status"
echo "======================================${NC}"
docker compose ps

# Проверяем логи на ошибки
echo ""
echo -e "${YELLOW}======================================"
echo "Checking Recent Logs for Errors"
echo "======================================${NC}"

# Проверяем каждый перезапущенный сервис
if [ "$RESTART_SERVICES" = "all" ]; then
  CHECK_SERVICES="postgres velocity survival lobby agents backend frontend"
elif [ -n "$RESTART_SERVICES" ]; then
  CHECK_SERVICES="$RESTART_SERVICES"
else
  CHECK_SERVICES=""
fi

HAS_ERRORS=false
for service in $CHECK_SERVICES; do
  echo ""
  echo -e "${YELLOW}Checking $service logs:${NC}"
  if docker compose logs --tail=10 $service 2>/dev/null | grep -iE "error|exception|fatal" | grep -v "ERROR_NORMAL" | head -5; then
    HAS_ERRORS=true
  else
    echo -e "${GREEN}✓ No errors${NC}"
  fi
done

# Финальный статус
echo ""
echo -e "${GREEN}======================================"
if [ "$HAS_ERRORS" = true ]; then
  echo -e "${RED}⚠️  Deployment completed with warnings${NC}"
  echo -e "${YELLOW}Please check the logs above for details${NC}"
  echo "To view full logs: docker compose logs -f [service_name]"
else
  echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
fi
echo -e "${GREEN}======================================${NC}"

# Показываем полезные команды
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  docker compose ps              - Check service status"
echo "  docker compose logs -f         - View all logs"
echo "  docker compose logs -f backend - View backend logs"
echo "  docker compose restart [name]  - Restart specific service"
echo "  docker stats                   - Monitor resource usage"
