#!/bin/bash
# ============================================
# Generate Secure Secrets for NetTyanMC
# ============================================
# Генератор безопасных паролей для NetTyanMC проекта
#
# Usage: ./generate-secrets.sh

set -e

echo "🔐 Generating secure secrets for NetTyanMC..."
echo "=============================================="
echo ""

# PostgreSQL password (32 символа, alphanumeric + special chars)
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
echo "# PostgreSQL Database"
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
echo ""

# JWT Secret (64 символа для максимальной безопасности)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
echo "# Backend JWT"
echo "JWT_SECRET=$JWT_SECRET"
echo ""

# RCON Password (24 символа)
RCON_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)
echo "# Minecraft RCON"
echo "RCON_PASSWORD=$RCON_PASSWORD"
echo ""

echo "=============================================="
echo "✅ Secrets generated successfully!"
echo ""
echo "⚠️  ВАЖНО: Сохраните эти пароли в безопасном месте!"
echo "⚠️  Никогда не коммитьте .env с реальными паролями в Git!"
echo ""
echo "📝 Скопируйте эти значения в ваш .env файл:"
echo "   cp .env.example .env"
echo "   nano .env  # Вставьте сгенерированные пароли"
echo ""
echo "🔄 После обновления .env перезапустите сервисы:"
echo "   docker-compose down"
echo "   docker-compose up -d"
echo ""
