#!/bin/bash
# ============================================
# Backup Script for NetTyanMC
# ============================================
# Создает резервные копии всех критических данных
#
# Usage: ./backup.sh [destination_dir]
# Example: ./backup.sh /mnt/backups

set -e

# Конфигурация
BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="nettyanmc_backup_$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Количество бэкапов для хранения (старые будут удалены)
KEEP_BACKUPS=7

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Starting NetTyanMC backup...${NC}"
echo "Backup destination: $BACKUP_PATH"
echo ""

# Создать директорию для бэкапов
mkdir -p "$BACKUP_PATH"/{database,minecraft,configs}

# ============================================
# 1. PostgreSQL Database Backup
# ============================================
echo -e "${YELLOW}📊 Backing up PostgreSQL database...${NC}"

if docker ps | grep -q minecraft_postgres; then
    # Получить credentials из .env или использовать дефолтные
    POSTGRES_USER=${POSTGRES_USER:-mcserver}
    POSTGRES_DB=${POSTGRES_DB:-minecraft_server}

    # Бэкап через pg_dump
    docker exec minecraft_postgres pg_dump \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        -F c \
        -b \
        -v \
        -f /tmp/db_backup.dump

    # Копировать из контейнера
    docker cp minecraft_postgres:/tmp/db_backup.dump "$BACKUP_PATH/database/postgres_backup.dump"

    # Также создать SQL версию для читаемости
    docker exec minecraft_postgres pg_dump \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        > "$BACKUP_PATH/database/postgres_backup.sql"

    echo -e "${GREEN}✅ Database backup completed${NC}"
else
    echo -e "${RED}❌ PostgreSQL container not running!${NC}"
    exit 1
fi

# ============================================
# 2. Minecraft Worlds Backup
# ============================================
echo -e "${YELLOW}🌍 Backing up Minecraft worlds...${NC}"

# Функция для бэкапа Docker volume
backup_volume() {
    local volume_name=$1
    local backup_name=$2

    echo "  Backing up $volume_name..."

    docker run --rm \
        -v "$volume_name:/data:ro" \
        -v "$BACKUP_PATH/minecraft:/backup" \
        alpine \
        tar czf "/backup/${backup_name}.tar.gz" -C /data .

    echo -e "  ${GREEN}✓${NC} $backup_name backed up"
}

# Бэкап всех Minecraft volumes
backup_volume "nettyanmc_velocity_data" "velocity"
backup_volume "nettyanmc_survival_data" "survival"
backup_volume "nettyanmc_lobby_data" "lobby"
backup_volume "nettyanmc_agents_data" "agents"

echo -e "${GREEN}✅ Minecraft worlds backup completed${NC}"

# ============================================
# 3. Configurations Backup
# ============================================
echo -e "${YELLOW}⚙️  Backing up configurations...${NC}"

# Копировать конфиги из Git (они уже версионированы, но на всякий случай)
cp -r ./lobby/config "$BACKUP_PATH/configs/lobby_config" 2>/dev/null || true
cp -r ./survival/config "$BACKUP_PATH/configs/survival_config" 2>/dev/null || true
cp -r ./agents/config "$BACKUP_PATH/configs/agents_config" 2>/dev/null || true
cp -r ./velocity/config "$BACKUP_PATH/configs/velocity_config" 2>/dev/null || true
cp -r ./backend/src "$BACKUP_PATH/configs/backend_src" 2>/dev/null || true
cp -r ./frontend/src "$BACKUP_PATH/configs/frontend_src" 2>/dev/null || true

# Копировать важные файлы
cp docker-compose.yml "$BACKUP_PATH/configs/" 2>/dev/null || true
cp .env.example "$BACKUP_PATH/configs/" 2>/dev/null || true
# НЕ копируем .env с реальными паролями!

echo -e "${GREEN}✅ Configurations backup completed${NC}"

# ============================================
# 4. Create Backup Metadata
# ============================================
cat > "$BACKUP_PATH/backup_info.txt" << EOF
NetTyanMC Backup
================
Date: $(date)
Timestamp: $TIMESTAMP
Hostname: $(hostname)
Docker Version: $(docker --version)

Contents:
- PostgreSQL database (dump + SQL)
- Velocity server data
- Survival server data
- Lobby server data
- AI Research server data
- Server configurations

Backup Size: $(du -sh "$BACKUP_PATH" | cut -f1)

Restore Instructions: See docs/BACKUP_GUIDE.md
EOF

# ============================================
# 5. Compress Entire Backup
# ============================================
echo -e "${YELLOW}📦 Compressing backup...${NC}"

cd "$BACKUP_DIR"
tar czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

BACKUP_SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)
echo -e "${GREEN}✅ Backup compressed: ${BACKUP_NAME}.tar.gz ($BACKUP_SIZE)${NC}"

# ============================================
# 6. Cleanup Old Backups
# ============================================
echo -e "${YELLOW}🧹 Cleaning up old backups (keeping last $KEEP_BACKUPS)...${NC}"

# Удалить старые бэкапы, оставить только последние N
ls -t "$BACKUP_DIR"/nettyanmc_backup_*.tar.gz 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm
REMAINING=$(ls -1 "$BACKUP_DIR"/nettyanmc_backup_*.tar.gz 2>/dev/null | wc -l)
echo -e "${GREEN}✅ Cleanup completed. $REMAINING backups remaining.${NC}"

# ============================================
# 7. Calculate Checksum
# ============================================
echo -e "${YELLOW}🔐 Calculating checksum...${NC}"

CHECKSUM=$(sha256sum "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | awk '{print $1}')
echo "$CHECKSUM" > "$BACKUP_DIR/${BACKUP_NAME}.tar.gz.sha256"
echo -e "${GREEN}✅ Checksum: $CHECKSUM${NC}"

# ============================================
# Done!
# ============================================
echo ""
echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo ""
echo "Backup location: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo "Backup size: $BACKUP_SIZE"
echo "Checksum file: $BACKUP_DIR/${BACKUP_NAME}.tar.gz.sha256"
echo ""
echo "To restore this backup, see: docs/BACKUP_GUIDE.md"
echo ""
