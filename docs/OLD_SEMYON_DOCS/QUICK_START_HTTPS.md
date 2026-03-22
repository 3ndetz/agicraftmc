# Быстрый старт с HTTPS

Краткое руководство для запуска AgiCraft с HTTPS за 30 минут.

## Что нужно

- ✅ Домен (купить на reg.ru за 140₽/год)
- ✅ Открытые порты 80, 443 на роутере
- ✅ Docker и Docker Compose
- ✅ 30 минут времени

---

## Шаг 1: Купить домен (5 минут)

1. Открыть https://www.reg.ru/
2. Найти свободный домен (например: `nettyan.ru`)
3. Купить за ~140₽/год
4. Оплатить

**Готово:** У вас есть домен ✅

---

## Шаг 2: Настроить DNS (2 минуты)

В личном кабинете reg.ru:

1. Мои домены → Выбрать домен → Управление
2. DNS-серверы и управление зоной
3. Добавить записи:

```
A   @     ВАШ_IP_АДРЕС   600
A   www   ВАШ_IP_АДРЕС   600
```

**Пример для IP 188.242.12.214:**
```
A   @     188.242.12.214   600
A   www   188.242.12.214   600
```

**Готово:** DNS настроен ✅

**Ждите 5 минут - 1 час** пока DNS обновится.

Проверить:
```bash
nslookup nettyan.ru
# Должен вернуть ваш IP
```

---

## Шаг 3: Открыть порты на роутере (5 минут)

Зайти в роутер (обычно `192.168.0.1` или `192.168.1.1`)

**Forwarding → Virtual Servers:**

| Порт | Внутренний IP | Протокол |
|------|---------------|----------|
| 80 | 192.168.0.246 | TCP |
| 443 | 192.168.0.246 | TCP |
| 8080 | 192.168.0.246 | TCP |
| 25565 | 192.168.0.246 | TCP/UDP |

**Готово:** Порты открыты ✅

Проверить: https://www.yougetsignal.com/tools/open-ports/

---

## Шаг 4: Настроить .env (3 минуты)

```bash
cd N:\Minecraftserver
cp .env.example .env
notepad .env
```

**Изменить:**
```env
# Ваш домен (БЕЗ https://)
DOMAIN=nettyan.ru

# Ваш email для Let's Encrypt
LETSENCRYPT_EMAIL=your_email@gmail.com

# Frontend URL (С https://)
FRONTEND_URL=https://nettyan.ru

# YooKassa URLs
YOOKASSA_RETURN_URL=https://nettyan.ru/payment/success
YOOKASSA_WEBHOOK_URL=https://nettyan.ru/api/payment/webhook

# Изменить все пароли!
POSTGRES_PASSWORD=YourPassword123!
JWT_SECRET=your_random_secret_min_32_chars
RCON_PASSWORD=YourRconPass123!
```

**Готово:** .env настроен ✅

---

## Шаг 5: Запустить всё (10 минут)

### 5.1 Запустить без Caddy (сначала)

```bash
cd N:\Minecraftserver

# Запустить всё кроме Caddy
docker-compose up -d postgres velocity survival agents lobby backend frontend

# Подождать 2 минуты пока всё запустится
docker-compose ps
```

Все контейнеры должны быть **Up** ✅

### 5.2 Проверить что DNS работает

```bash
nslookup nettyan.ru
```

**Должен вернуть ваш IP!** Если нет - ждите ещё.

### 5.3 Запустить Caddy

```bash
docker-compose up -d caddy

# Смотрим логи
docker-compose logs -f caddy
```

**Успех выглядит так:**

```
caddy | {"level":"info","msg":"certificate obtained successfully"}
caddy | {"level":"info","msg":"serving initial configuration"}
```

**Если ошибка:**
- DNS ещё не обновился → подождите 1 час
- Порт 80 не открыт → проверьте роутер

**Готово:** HTTPS работает! ✅

---

## Шаг 6: Проверка (2 минуты)

### Открыть сайт

```
https://nettyan.ru
```

Должна появиться главная страница с замком 🔒

### Проверить API

```
https://nettyan.ru/health
```

Должно вернуть: `{"status":"OK",...}`

### Проверить Minecraft

```
Подключиться к: nettyan.ru:25565
```

Должен попасть в лобби.

**Готово:** Всё работает! 🎉

---

## Шаг 7: Настроить YooKassa (5 минут)

1. Войти в https://yookassa.ru/
2. Настройки → HTTP-уведомления
3. Добавить webhook: `https://nettyan.ru/api/payment/webhook`
4. Выбрать события: `payment.succeeded`, `payment.canceled`
5. Сохранить

**Готово:** Платежи работают ✅

---

## Что дальше?

- ✅ Скачать плагины вручную (см. DEPLOYMENT_GUIDE.md)
- ✅ Настроить NPC в лобби (см. LOBBY_SETUP.md)
- ✅ Создать группы LuckPerms (см. LUCKPERMS_SETUP.md)
- ✅ Протестировать покупку на сайте

---

## Если что-то не работает

### DNS не обновился

**Решение:** Подождать 1-24 часа. Проверять каждый час:

```bash
nslookup nettyan.ru
```

### Caddy не получил сертификат

**Проверить:**
1. DNS работает? → `nslookup nettyan.ru`
2. Порт 80 открыт? → https://www.yougetsignal.com/tools/open-ports/
3. Домен указывает на правильный IP?

**Решение:**
```bash
# Остановить Caddy
docker-compose stop caddy

# Подождать 1 час

# Запустить снова
docker-compose up -d caddy
```

### Сайт не открывается

**Проверить:**
```bash
# Контейнеры запущены?
docker-compose ps

# Логи Caddy
docker-compose logs caddy

# Логи Frontend
docker-compose logs frontend

# Логи Backend
docker-compose logs backend
```

---

## Полная документация

- **Детальное HTTPS руководство:** [HTTPS_SETUP.md](HTTPS_SETUP.md)
- **Развертывание:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Настройка лобби:** [LOBBY_SETUP.md](LOBBY_SETUP.md)
- **Система ролей:** [LUCKPERMS_SETUP.md](LUCKPERMS_SETUP.md)

---

## Итого

| Шаг | Время | Стоимость |
|-----|-------|-----------|
| Купить домен | 5 мин | 140₽/год |
| Настроить DNS | 2 мин | Бесплатно |
| Открыть порты | 5 мин | Бесплатно |
| Настроить .env | 3 мин | Бесплатно |
| Запустить | 10 мин | Бесплатно |
| Проверить | 2 мин | Бесплатно |
| YooKassa | 5 мин | Бесплатно |
| **ИТОГО** | **~30 мин** | **140₽/год** |

**SSL сертификат:** Бесплатно от Let's Encrypt ✅
**Автообновление:** Автоматически каждые 90 дней ✅

---

**Вопросы?** Создайте issue на GitHub или пишите в Discord: discord.gg/agicraft
