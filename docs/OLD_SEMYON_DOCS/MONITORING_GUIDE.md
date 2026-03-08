# Monitoring Guide - Мониторинг и алерты

Быстрое руководство по мониторингу состояния NetTyanMC.

---

## ⚡ Быстрый старт

```bash
# Проверить здоровье всех сервисов
./scripts/health-check.sh

# Посмотреть логи
docker-compose logs -f --tail=50

# Статус контейнеров
docker-compose ps

# Использование ресурсов
docker stats
```

---

## 📊 Health Checks (уже реализованы)

### Docker Compose Health Checks

Все сервисы имеют health checks:

```yaml
# PostgreSQL
healthcheck:
  test: ["CMD-SHELL", "pg_isready"]
  interval: 10s

# Backend
healthcheck:
  test: ["CMD", "wget", "--spider", "http://localhost:3000/health"]
  interval: 30s

# Frontend
healthcheck:
  test: ["CMD", "wget", "--spider", "http://localhost:80"]
  interval: 30s
```

**Проверить:**
```bash
docker inspect --format='{{.State.Health.Status}}' agicraft_backend
# Должно быть: healthy
```

---

## 🔍 Логи

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker logs -f minecraft_survival

# Последние 100 строк
docker logs --tail=100 agicraft_backend

# С фильтром по времени
docker logs --since=1h minecraft_velocity

# Поиск ошибок
docker logs minecraft_survival 2>&1 | grep -i error
```

### Централизованные логи (опционально)

Для production рекомендуется Loki + Grafana:

```yaml
# docker-compose.yml (добавить)
loki:
  image: grafana/loki:latest
  ports:
    - "3100:3100"
  volumes:
    - loki_data:/loki

grafana:
  image: grafana/grafana:latest
  ports:
    - "3001:3000"
  volumes:
    - grafana_data:/var/lib/grafana
```

---

## 💾 Disk Space Monitoring

```bash
# Проверить место
df -h

# Docker использование
docker system df

# Volumes размер
docker system df -v | grep nettyanmc

# Очистить старые данные
docker system prune -a --volumes
```

**Автоочистка (cron):**
```bash
# Каждую неделю
0 0 * * 0 docker system prune -f
```

---

## 📈 Метрики

### Prometheus + Grafana (опционально)

Для детального мониторинга:

```yaml
prometheus:
  image: prom/prometheus
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus_data:/prometheus
```

---

## 🚨 Alerts

### Email алерты через cron

```bash
# /etc/cron.d/nettyanmc-monitor
*/5 * * * * root /home/user/NetTyanMC/scripts/health-check.sh || mail -s "NetTyanMC Health Check Failed" admin@nettyan.ru
```

### Discord Webhook

```bash
# scripts/discord-alert.sh
WEBHOOK_URL="your_discord_webhook"
MESSAGE="⚠️ Service down!"

curl -H "Content-Type: application/json" \
  -d "{\"content\": \"$MESSAGE\"}" \
  $WEBHOOK_URL
```

---

## 📚 Документация

- **Docker Logs:** https://docs.docker.com/config/containers/logging/
- **Health Checks:** https://docs.docker.com/engine/reference/builder/#healthcheck
- **Prometheus:** https://prometheus.io/docs/

---

**Автор:** Claude Code
