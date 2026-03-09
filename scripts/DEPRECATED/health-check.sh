#!/bin/bash
# Health Check Script for NetTyanMC
# Проверяет состояние всех сервисов

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🏥 NetTyanMC Health Check"
echo "========================="
echo ""

check_service() {
    local name=$1
    local container=$2
    local check_cmd=$3

    printf "%-20s " "$name:"
    if docker ps | grep -q "$container"; then
        if eval "$check_cmd" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Healthy${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠ Running but unhealthy${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ Not running${NC}"
        return 1
    fi
}

# Check all services
check_service "PostgreSQL" "minecraft_postgres" "docker exec minecraft_postgres pg_isready -U mcserver"
check_service "Backend API" "agicraft_backend" "curl -sf http://localhost:3000/health"
check_service "Frontend" "agicraft_frontend" "curl -sf http://localhost:80"
check_service "Velocity" "minecraft_velocity" "docker exec minecraft_velocity ps aux | grep -q java"
check_service "Survival" "minecraft_survival" "docker exec minecraft_survival ps aux | grep -q java"
check_service "Lobby" "minecraft_lobby" "docker exec minecraft_lobby ps aux | grep -q java"
check_service "AI Research" "minecraft_airesearch" "docker exec minecraft_airesearch ps aux | grep -q java"

echo ""
echo "Docker Resources:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
