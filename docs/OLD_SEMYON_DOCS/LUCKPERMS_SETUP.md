# Настройка LuckPerms и системы ролей

## 1. Создание групп и иерархия

### Базовая группа (default)
```bash
/lp creategroup default
/lp group default weight 0
/lp group default meta setprefix "&7"
```

### Донатные группы

**NEW (35₽ за 2 месяца)**
```bash
/lp creategroup new
/lp group new parent add default
/lp group new weight 10
/lp group new meta setprefix "&f[NEW] "
```

**HELPER (99₽ за 2 месяца)**
```bash
/lp creategroup helper
/lp group helper parent add new
/lp group helper weight 20
/lp group helper meta setprefix "&e[HELPER] "
```

**STARTER (199₽ за 2 месяца)**
```bash
/lp creategroup starter
/lp group starter parent add helper
/lp group starter weight 30
/lp group starter meta setprefix "&a[STARTER] "
```

**VIP (399₽ за 2 месяца)**
```bash
/lp creategroup vip
/lp group vip parent add starter
/lp group vip weight 40
/lp group vip meta setprefix "&b[VIP] "
```

**PREMIUM (699₽ за 2 месяца)**
```bash
/lp creategroup premium
/lp group premium parent add vip
/lp group premium weight 50
/lp group premium meta setprefix "&d[PREMIUM] "
```

**ELITE (1199₽ за 2 месяца)**
```bash
/lp creategroup elite
/lp group elite parent add premium
/lp group elite weight 60
/lp group elite meta setprefix "&5[ELITE] "
```

**LEGEND (1999₽ за 2 месяца)**
```bash
/lp creategroup legend
/lp group legend parent add elite
/lp group legend weight 70
/lp group legend meta setprefix "&6[LEGEND] "
```

---

## 2. Специальные группы (служебные)

**AI_RESEARCH (доступ к серверу AI Research)**
```bash
/lp creategroup ai_research
/lp group ai_research weight 5
/lp group ai_research meta setprefix "&3[AI] "
/lp group ai_research permission set server.ai_research true
# Bypass AuthMe (авторизация не требуется на Lobby)
/lp group ai_research permission set authme.bypass.register true
/lp group ai_research permission set authme.bypass.login true
```

**AI_PERSON (AI агенты)**
```bash
/lp creategroup ai_person
/lp group ai_person parent add ai_research
/lp group ai_person weight 6
/lp group ai_person meta setprefix "&3[BOT] "
/lp group ai_person meta set velocity.default-server ai_research
# Наследуют authme.bypass.* от ai_research
```

**NETFATHER (владелец сервера)**
```bash
/lp creategroup netfather
/lp group netfather weight 100
/lp group netfather meta setprefix "&4&l[NETFATHER] "
/lp group netfather permission set * true
# Полный bypass всего включая AuthMe (через wildcard *)
```

---

## 3. Базовые права для всех игроков (default)

```bash
# Базовые команды
/lp group default permission set essentials.spawn true
/lp group default permission set essentials.help true
/lp group default permission set essentials.rules true
/lp group default permission set essentials.motd true
/lp group default permission set essentials.list true

# Команды для переключения серверов
/lp group default permission set velocity.command.server true

# Базовый функционал
/lp group default permission set essentials.tpa true
/lp group default permission set essentials.tpaccept true
/lp group default permission set essentials.tpdeny true
/lp group default permission set essentials.msg true
/lp group default permission set essentials.mail true
/lp group default permission set essentials.mail.send true

# Дома (1 дом для default)
/lp group default permission set essentials.sethome true
/lp group default permission set essentials.sethome.multiple.home1 true
/lp group default permission set essentials.home true
/lp group default permission set essentials.delhome true
```

---

## 4. Права донатных групп

### NEW (белый префикс, автосортировка, 4 дома)
```bash
# Дома (4 дома)
/lp group new permission set essentials.sethome.multiple.home1 true
/lp group new permission set essentials.sethome.multiple.home2 true
/lp group new permission set essentials.sethome.multiple.home3 true
/lp group new permission set essentials.sethome.multiple.home4 true

# Автосортировка инвентаря (требует InvSort плагин)
/lp group new permission set invsort.sort true
/lp group new permission set invsort.autosort true
```

### HELPER (желтый префикс, флай 5 мин/час, 6 домов, /heal раз в час)
```bash
# Дома (6 домов)
/lp group helper permission set essentials.sethome.multiple.home5 true
/lp group helper permission set essentials.sethome.multiple.home6 true

# Полет (ограничен плагином - 5 мин/час)
/lp group helper permission set essentials.fly true

# Хил раз в час
/lp group helper permission set essentials.heal true
/lp group helper permission set essentials.heal.cooldown.3600 true

# Переименование предметов
/lp group helper permission set essentials.nick true
/lp group helper permission set essentials.nick.color true
```

### STARTER (зеленый, флай 10 мин/час, 8 домов, /heal 30 мин, /feed час)
```bash
# Дома (8 домов)
/lp group starter permission set essentials.sethome.multiple.home7 true
/lp group starter permission set essentials.sethome.multiple.home8 true

# Полет увеличен в конфиге плагина (10 мин/час)
# essentials.fly уже унаследовано

# Хил раз в 30 минут
/lp group starter permission unset essentials.heal.cooldown.3600
/lp group starter permission set essentials.heal.cooldown.1800 true

# Фид раз в час
/lp group starter permission set essentials.feed true
/lp group starter permission set essentials.feed.cooldown.3600 true

# Enderchest доступ
/lp group starter permission set essentials.enderchest true
```

### VIP (голубой, флай 20 мин/час, 10 домов, /hat, /workbench)
```bash
# Дома (10 домов)
/lp group vip permission set essentials.sethome.multiple.home9 true
/lp group vip permission set essentials.sethome.multiple.home10 true

# Полет 20 мин/час (настройка в конфиге)

# Хил без кулдауна
/lp group vip permission unset essentials.heal.cooldown.1800
/lp group vip permission set essentials.heal true

# Фид без кулдауна
/lp group vip permission unset essentials.feed.cooldown.3600
/lp group vip permission set essentials.feed true

# Предмет на голову
/lp group vip permission set essentials.hat true

# Верстак из любого места
/lp group vip permission set essentials.workbench true

# Цветные знаки
/lp group vip permission set essentials.signs.color true
```

### PREMIUM (розовый, флай без лимита, 15 домов, /repair, /fix)
```bash
# Дома (15 домов)
/lp group premium permission set essentials.sethome.multiple.home11 true
/lp group premium permission set essentials.sethome.multiple.home12 true
/lp group premium permission set essentials.sethome.multiple.home13 true
/lp group premium permission set essentials.sethome.multiple.home14 true
/lp group premium permission set essentials.sethome.multiple.home15 true

# Полет без лимита (установить в конфиге)
# essentials.fly уже унаследовано

# Ремонт предметов
/lp group premium permission set essentials.repair true
/lp group premium permission set essentials.repair.all true

# Фикс брони
/lp group premium permission set essentials.fix true

# Телепортация к игрокам без запроса (осторожно!)
/lp group premium permission set essentials.tp true

# Наковальня без ограничений уровня
/lp group premium permission set essentials.anvil.nolimit true
```

### ELITE (темно-фиолетовый, 20 домов, /back после смерти, кит раз в день)
```bash
# Дома (20 домов)
/lp group elite permission set essentials.sethome.multiple.home16 true
/lp group elite permission set essentials.sethome.multiple.home17 true
/lp group elite permission set essentials.sethome.multiple.home18 true
/lp group elite permission set essentials.sethome.multiple.home19 true
/lp group elite permission set essentials.sethome.multiple.home20 true

# Возврат к месту смерти
/lp group elite permission set essentials.back true
/lp group elite permission set essentials.back.ondeath true

# Киты
/lp group elite permission set essentials.kits.elite true

# Игнорирование ванишнутых игроков
/lp group elite permission set essentials.vanish.interact true

# Обход лимита зачарований
/lp group elite permission set essentials.enchantments.* true
```

### LEGEND (золотой, 30 домов, /tppos, /speed, эффекты)
```bash
# Дома (30 домов)
/lp group legend permission set essentials.sethome.multiple.home21 true
/lp group legend permission set essentials.sethome.multiple.home22 true
/lp group legend permission set essentials.sethome.multiple.home23 true
/lp group legend permission set essentials.sethome.multiple.home24 true
/lp group legend permission set essentials.sethome.multiple.home25 true
/lp group legend permission set essentials.sethome.multiple.home26 true
/lp group legend permission set essentials.sethome.multiple.home27 true
/lp group legend permission set essentials.sethome.multiple.home28 true
/lp group legend permission set essentials.sethome.multiple.home29 true
/lp group legend permission set essentials.sethome.multiple.home30 true

# Телепортация по координатам
/lp group legend permission set essentials.tppos true

# Изменение скорости полета
/lp group legend permission set essentials.speed true
/lp group legend permission set essentials.speed.fly true
/lp group legend permission set essentials.speed.walk true

# Постоянные эффекты (через плагин эффектов)
/lp group legend permission set effectlib.effects.speed true
/lp group legend permission set effectlib.effects.nightvision true
/lp group legend permission set effectlib.effects.waterbreathing true

# Киты Legend
/lp group legend permission set essentials.kits.legend true

# Цветные сообщения в чате
/lp group legend permission set essentials.chat.color true
/lp group legend permission set essentials.chat.format true
```

---

## 5. Настройка meta для Velocity

**Для ai_person - автоматический вход на AI Research сервер:**
```bash
/lp group ai_person meta set velocity.default-server ai_research
```

**Для остальных игроков - вход через Lobby:**
```bash
/lp group default meta set velocity.default-server lobby
```

---

## 6. Назначение игроков в группы

### Назначить донатную группу игроку (временно):
```bash
# Пример: выдать NEW на 2 месяца
/lp user <nickname> parent addtemp new 60d

# Пример: выдать VIP на 6 месяцев
/lp user <nickname> parent addtemp vip 180d

# Пример: выдать LEGEND на 12 месяцев
/lp user <nickname> parent addtemp legend 365d
```

### Назначить постоянную группу (для администрации):
```bash
# Выдать ai_research постоянно
/lp user <nickname> parent add ai_research

# Выдать netfather постоянно
/lp user netfather parent add netfather
```

### Проверка прав игрока:
```bash
/lp user <nickname> info
/lp user <nickname> permission check <permission>
```

---

## 7. Синхронизация между серверами

LuckPerms автоматически синхронизируется через PostgreSQL. Проверить синхронизацию:

```bash
# На любом сервере (Velocity, Survival, AI Research, Lobby)
/lp sync
```

Настройка уже выполнена в `config.yml`:
```yaml
messaging-service: sql
```

---

## 8. Интеграция с веб-сайтом

### Автоматическая выдача ранга через RCON (вызывается из Node.js API):

```javascript
// После успешной оплаты через YooKassa
const Rcon = require('rcon-client').Rcon;

async function grantRank(nickname, groupName, durationDays) {
  const rcon = await Rcon.connect({
    host: 'velocity',
    port: 25575,
    password: 'your_rcon_password'
  });

  await rcon.send(`lp user ${nickname} parent addtemp ${groupName} ${durationDays}d`);
  await rcon.end();
}

// Пример использования
await grantRank('Player123', 'vip', 60); // VIP на 2 месяца
```

---

## 9. Команды для тестирования

### Проверить группу игрока:
```bash
/lp user <nickname> info
```

### Проверить права группы:
```bash
/lp group <groupname> permission info
```

### Посмотреть иерархию групп:
```bash
/lp listgroups
```

### Временно выдать себе группу для теста:
```bash
/lp user netfather parent addtemp legend 1h
```

### Удалить группу у игрока:
```bash
/lp user <nickname> parent remove <groupname>
```

---

## 10. Плагины для поддержки функций

### Обязательные плагины:

1. **EssentialsX** - базовые команды (/home, /heal, /feed, /fly)
   - https://essentialsx.net/downloads.html

2. **PlayerPoints** - валюта AgiCoins
   - https://www.spigotmc.org/resources/playerpoints.80745/

3. **Vault** - API для экономики
   - https://www.spigotmc.org/resources/vault.34315/

4. **InvSort** - автосортировка инвентаря
   - https://www.spigotmc.org/resources/invsort.13693/

### Опциональные плагины:

5. **EffectLib** - постоянные эффекты для LEGEND
   - https://www.spigotmc.org/resources/effectlib.87084/

6. **ShopGUIPlus** - магазин для покупки за AgiCoins
   - https://www.spigotmc.org/resources/shopguiplus.6515/

---

## 11. Настройка AgiCoins (PlayerPoints)

### Конфигурация PlayerPoints:

**Файл: `survival/plugins/PlayerPoints/config.yml`**
```yaml
currency-name: AgiCoins
currency-symbol: "⚡"

# Интеграция с PlaceholderAPI
placeholderapi:
  enabled: true

# Команды для игроков
commands:
  balance: true
  pay: true
  give: false  # Только администраторам
  take: false  # Только администраторам
```

### Команды администратора:

```bash
# Выдать AgiCoins игроку (через RCON из веб-панели)
/points give <nickname> <amount>

# Забрать AgiCoins
/points take <nickname> <amount>

# Проверить баланс
/points look <nickname>

# Установить баланс
/points set <nickname> <amount>
```

### Пример RCON команды из Node.js:

```javascript
// После покупки AgiCoins через сайт
async function giveAgiCoins(nickname, amount) {
  const rcon = await Rcon.connect({
    host: 'survival',
    port: 25575,
    password: 'your_rcon_password'
  });

  await rcon.send(`points give ${nickname} ${amount}`);
  await rcon.end();
}

// Пример: начислить 110 AgiCoins (100₽ + 10% бонус)
await giveAgiCoins('Player123', 110);
```

### Команды для игроков:

```bash
# Проверить свой баланс AgiCoins
/points

# Перевести AgiCoins другому игроку
/points pay <nickname> <amount>
```

---

## 12. Настройка магазина (ShopGUIPlus)

### Создание магазина рангов:

**Файл: `survival/plugins/ShopGUIPlus/shops/ranks.yml`**
```yaml
shop-name: "Магазин рангов"
shop-rows: 3

items:
  new:
    type: item
    item:
      material: WHITE_WOOL
      name: "&f&lNEW (2 месяца)"
      lore:
        - "&7Белый префикс"
        - "&7Автосортировка"
        - "&74 дома"
        - ""
        - "&eЦена: 35 AgiCoins"
    buy-price: 35
    commands:
      - "lp user %player% parent addtemp new 60d"
      - "tell %player% &aРанг NEW выдан на 2 месяца!"

  helper:
    type: item
    item:
      material: YELLOW_WOOL
      name: "&e&lHELPER (2 месяца)"
      lore:
        - "&7Желтый префикс"
        - "&7Флай 5 мин/час"
        - "&76 домов, /heal раз в час"
        - ""
        - "&eЦена: 99 AgiCoins"
    buy-price: 99
    commands:
      - "lp user %player% parent addtemp helper 60d"
      - "tell %player% &aРанг HELPER выдан на 2 месяца!"

  # ... остальные ранги аналогично
```

---

## Готово!

Все группы созданы и настроены. LuckPerms синхронизируется через PostgreSQL между всеми серверами.

**Для запуска:**
1. Запустить все контейнеры: `docker-compose up -d`
2. Подключиться к Velocity: `docker attach minecraft_velocity`
3. Выполнить все команды из разделов 1-5
4. Проверить: `/lp listgroups`

**Для тестирования донатной системы:**
1. Настроить RCON на Velocity и Survival серверах
2. Запустить веб-сервер (Express API)
3. Протестировать покупку через YooKassa (тестовый режим)
4. Проверить автоматическую выдачу ранга через RCON
