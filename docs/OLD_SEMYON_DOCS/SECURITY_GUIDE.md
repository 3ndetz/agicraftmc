# Security Guide - Безопасность и Secrets Management

Руководство по обеспечению безопасности NetTyanMC проекта.

---

## 🔐 Критические улучшения безопасности

### Проблемы в текущей конфигурации

❌ **Хардкод паролей** в конфигах плагинов
❌ **Дефолтные пароли** в `.env.example`
❌ **Отсутствие secrets rotation**
❌ **Нет двухфакторной аутентификации**

---

## 🛡️ Secrets Management

### 1. Генерация безопасных паролей

Создать скрипт `scripts/generate-secrets.sh`:

```bash
#!/bin/bash
# Генератор безопасных секретов для NetTyanMC

set -e

echo "🔐 Generating secure secrets for NetTyanMC..."
echo ""

# PostgreSQL password (32 символа)
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"

# JWT Secret (64 символа)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
echo "JWT_SECRET=$JWT_SECRET"

# RCON Password (24 символа)
RCON_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)
echo "RCON_PASSWORD=$RCON_PASSWORD"

echo ""
echo "✅ Secrets generated! Copy them to your .env file."
echo ""
echo "⚠️  ВАЖНО: Сохраните эти пароли в безопасном месте!"
echo "⚠️  Никогда не коммитьте .env в Git!"
```

**Использование:**

```bash
chmod +x scripts/generate-secrets.sh
./scripts/generate-secrets.sh > .secrets.tmp

# Скопировать пароли в .env
cat .secrets.tmp >> .env

# Удалить временный файл
rm .secrets.tmp
```

### 2. Безопасное хранение secrets

#### Вариант A: Environment Variables (текущий подход)

**Плюсы:**
- ✅ Простота
- ✅ Поддержка Docker Compose

**Минусы:**
- ❌ Видны в `docker inspect`
- ❌ Видны в логах (если не аккуратно)

**Рекомендации:**
1. Никогда не коммитить `.env` в Git
2. Использовать `.env.example` как шаблон
3. Ограничить права доступа: `chmod 600 .env`

#### Вариант B: Docker Secrets

**Плюсы:**
- ✅ Зашифрованы в swarm
- ✅ Не видны в `docker inspect`
- ✅ Монтируются как файлы (не env vars)

**Минусы:**
- ❌ Требует Docker Swarm
- ❌ Сложнее в настройке

**Пример использования:**

```bash
# Создать secrets
echo "your_postgres_password" | docker secret create postgres_password -
echo "your_jwt_secret" | docker secret create jwt_secret -

# Использовать в docker-compose.yml
secrets:
  postgres_password:
    external: true
  jwt_secret:
    external: true

services:
  postgres:
    secrets:
      - postgres_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
```

#### Вариант C: HashiCorp Vault (для enterprise)

**Для крупных проектов:**
- Централизованное хранилище секретов
- Динамическая генерация credentials
- Audit logs
- Secrets rotation

**Документация:** https://www.vaultproject.io/

---

## 🔑 Обновление паролей в production

### 1. Изменить PostgreSQL пароль

```bash
# 1. Сгенерировать новый пароль
NEW_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# 2. Изменить в PostgreSQL
docker exec -it minecraft_postgres psql -U postgres
ALTER USER mcserver WITH PASSWORD 'NEW_PASSWORD_HERE';
\q

# 3. Обновить .env
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$NEW_PASSWORD/" .env

# 4. Обновить конфиги LuckPerms
# lobby/config/plugins/LuckPerms/config.yml
# survival/config/plugins/LuckPerms/config.yml
# agents/config/plugins/LuckPerms/config.yml
# velocity/config/plugins/LuckPerms/config.yml

# 5. Перезапустить серверы
docker-compose restart velocity survival lobby agents
```

### 2. Изменить JWT Secret

```bash
# 1. Сгенерировать новый JWT secret
NEW_JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# 2. Обновить .env
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" .env

# 3. Перезапустить backend
docker-compose restart backend

# ⚠️ Все пользователи будут разлогинены!
```

### 3. Изменить RCON пароль

```bash
# 1. Сгенерировать новый RCON пароль
NEW_RCON=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)

# 2. Обновить .env
sed -i "s/RCON_PASSWORD=.*/RCON_PASSWORD=$NEW_RCON/" .env

# 3. Обновить server.properties каждого сервера
# или использовать environment variables если поддерживается

# 4. Перезапустить серверы
docker-compose restart velocity survival lobby agents
```

---

## 🚪 Firewall настройка

### UFW (Ubuntu/Debian)

```bash
# Установить UFW
sudo apt install ufw

# Дефолтные правила
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Разрешить SSH (ВАЖНО!)
sudo ufw allow 22/tcp

# Разрешить Minecraft
sudo ufw allow 25565/tcp comment 'Minecraft Velocity'
sudo ufw allow 25576/tcp comment 'Minecraft Agents (direct)'

# Разрешить HTTPS (для nettyanweb Caddy)
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Опционально: Crafty Controller (только с вашего IP)
sudo ufw allow from YOUR_IP_ADDRESS to any port 8443 comment 'Crafty Controller'

# Включить firewall
sudo ufw enable

# Проверить статус
sudo ufw status verbose
```

### Ограничить доступ к админ панелям

```bash
# Crafty Controller доступен только с определенного IP
sudo ufw delete allow 8443
sudo ufw allow from YOUR_ADMIN_IP to any port 8443

# PostgreSQL НЕ должен быть доступен извне
# (по умолчанию expose в docker-compose.yml отсутствует)
```

---

## 🌐 HTTPS и SSL

### 1. Обязательные настройки

```bash
# В production ВСЕГДА использовать HTTPS
# Никогда не передавать credentials по HTTP

# Проверить что Caddy настроен корректно
docker logs caddy | grep -i "certificate"
```

### 2. Let's Encrypt Rate Limits

Let's Encrypt имеет лимиты:
- **50 сертификатов / неделя** на домен
- **5 дубликатов / неделя** на поддомен

**Рекомендации:**
- Тестировать на staging окружении
- Использовать wildcard сертификаты (*.nettyan.ru)
- Не пересоздавать сертификаты часто

### 3. HSTS (HTTP Strict Transport Security)

Добавить в Caddyfile:

```
mc.nettyan.ru {
    header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    reverse_proxy backend:3000
}
```

---

## 🔒 Безопасность приложения

### Backend API

#### 1. Rate Limiting (уже реализован)

```javascript
// backend/src/server.js:49-62
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

**Рекомендации:**
- Строже лимиты для auth endpoints (5 req/min)
- IP whitelist для admin endpoints

#### 2. JWT токены

**Текущая реализация:**
- ✅ JWT для аутентификации
- ❌ Нет refresh tokens
- ❌ Нет revocation mechanism

**Улучшения:**

```javascript
// Добавить refresh tokens
// Хранить blacklist невалидных токенов в Redis
const redis = require('redis');
const client = redis.createClient();

async function revokeToken(token) {
  const decoded = jwt.decode(token);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  await client.setEx(`revoked:${token}`, ttl, '1');
}

async function isTokenRevoked(token) {
  return await client.exists(`revoked:${token}`);
}
```

#### 3. SQL Injection защита

**Текущая реализация:**
- ✅ Используется `pg` с параметризованными запросами

**Проверка:**

```javascript
// ✅ Правильно (защищено от SQL injection)
const result = await pool.query(
  'SELECT * FROM users WHERE username = $1',
  [username]
);

// ❌ НИКОГДА не делать так
const result = await pool.query(
  `SELECT * FROM users WHERE username = '${username}'`
);
```

#### 4. XSS защита

**Рекомендации:**
- Sanitize user input на frontend
- Escape HTML в React (по умолчанию)
- Content Security Policy headers

```javascript
// В backend/src/server.js добавить:
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
  }
}));
```

---

## 🎮 Безопасность Minecraft серверов

### 1. AuthMe конфигурация

**Важные настройки в `lobby/config/plugins/AuthMe/config.yml`:**

```yaml
settings:
  restrictions:
    # Ограничить регистрации с одного IP
    maxRegPerIp: 3

    # Минимальная длина пароля
    minPasswordLength: 8

    # Требовать сложные пароли
    unsafePasswords:
      - '123456'
      - 'password'
      - 'qwerty'

  security:
    # Хешировать пароли с bcrypt
    passwordHash: BCRYPT

    # Количество rounds (чем больше, тем безопаснее, но медленнее)
    bCryptLog2Rounds: 10
```

### 2. LuckPerms permissions

**Ограничить опасные команды:**

```bash
# НЕ давать обычным игрокам
/lp group default permission unset minecraft.command.op
/lp group default permission unset minecraft.command.deop
/lp group default permission unset luckperms.*

# Только для netfather (admin)
/lp group netfather permission set *
```

### 3. WorldGuard регионы

**Защитить критичные зоны:**

```bash
# Spawn protection
/rg flag spawn pvp deny
/rg flag spawn block-break deny
/rg flag spawn block-place deny
/rg flag spawn tnt deny
/rg flag spawn creeper-explosion deny

# AI Research safe zone
/rg flag nether_spawn pvp deny
/rg flag nether_spawn mob-spawning deny
```

---

## 📊 Audit Logging

### 1. Backend audit logs

**Создать middleware для логирования:**

```javascript
// backend/src/middleware/audit.js
const fs = require('fs');
const path = require('path');

function auditLog(req, res, next) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    user: req.user?.username || 'anonymous',
    method: req.method,
    path: req.path,
    userAgent: req.get('user-agent')
  };

  fs.appendFileSync(
    path.join(__dirname, '../../logs/audit.log'),
    JSON.stringify(logEntry) + '\n'
  );

  next();
}

module.exports = auditLog;
```

**Использовать:**

```javascript
// backend/src/server.js
const auditLog = require('./middleware/audit');
app.use('/api/admin', auditLog);
```

### 2. Minecraft actions logging

LuckPerms автоматически логирует все действия:

```sql
-- Посмотреть последние 100 действий
SELECT * FROM luckperms_actions
ORDER BY time DESC
LIMIT 100;

-- Посмотреть действия конкретного администратора
SELECT * FROM luckperms_actions
WHERE actor_name = 'AdminUsername'
ORDER BY time DESC;
```

---

## 🚨 Incident Response

### Что делать при компрометации

#### 1. При утечке PostgreSQL пароля

```bash
# Немедленно изменить пароль
docker exec -it minecraft_postgres psql -U postgres
ALTER USER mcserver WITH PASSWORD 'NEW_SECURE_PASSWORD';

# Обновить все конфиги
# Перезапустить все сервисы
docker-compose restart
```

#### 2. При взломе аккаунта админа

```bash
# Удалить права у скомпрометированного игрока
/lp user HackedAdmin parent remove netfather
/lp user HackedAdmin parent set default

# Забанить временно
/ban HackedAdmin 7d Проверка безопасности аккаунта

# Проверить последние действия
SELECT * FROM luckperms_actions
WHERE actor_name = 'HackedAdmin'
ORDER BY time DESC;
```

#### 3. При DDoS атаке

```bash
# Включить Cloudflare DDoS Protection
# Или использовать fail2ban

# Установить fail2ban
sudo apt install fail2ban

# Настроить для SSH
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🔍 Security Checklist

### Перед production запуском

- [ ] Все дефолтные пароли изменены
- [ ] `.env` не в Git (проверить `.gitignore`)
- [ ] PostgreSQL доступен только из Docker network
- [ ] HTTPS настроен корректно
- [ ] Firewall настроен (только нужные порты открыты)
- [ ] Crafty Controller доступен только admin IP
- [ ] AuthMe настроен (минимум 8 символов пароль)
- [ ] Rate limiting включен в backend
- [ ] Backup скрипт настроен
- [ ] Мониторинг настроен (алерты)
- [ ] Audit logging включен
- [ ] Документация secrets в безопасном месте

### Регулярное обслуживание

- [ ] Обновлять Docker images (1 раз в месяц)
- [ ] Обновлять плагины Minecraft (проверять security fixes)
- [ ] Ротация паролей (каждые 3 месяца)
- [ ] Проверка логов на подозрительную активность
- [ ] Тестирование backup восстановления
- [ ] Обновление Let's Encrypt сертификатов (автоматически)

---

## 📚 Ресурсы

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **Docker Security:** https://docs.docker.com/engine/security/
- **Node.js Security Best Practices:** https://nodejs.org/en/docs/guides/security/
- **PostgreSQL Security:** https://www.postgresql.org/docs/current/auth-methods.html
- **Minecraft Security:** https://www.spigotmc.org/wiki/firewall-guide/

---

**Последнее обновление:** 2025-11-21
**Security Level:** Production Ready (после применения всех рекомендаций)
**Автор:** Claude Code
