# Настройка SSH для CI/CD на Windows

Пошаговая инструкция для Windows 10/11.

---

## Шаг 1: Выберите инструмент

У вас есть 3 варианта (выберите один):

### Вариант A: Git Bash (рекомендуется)
- Устанавливается вместе с Git for Windows
- Команды как в Linux
- **Проверка:** Откройте "Git Bash" из меню Пуск

### Вариант B: PowerShell
- Встроен в Windows
- Команды немного отличаются
- **Проверка:** Откройте PowerShell из меню Пуск

### Вариант C: WSL (Windows Subsystem for Linux)
- Нужно устанавливать отдельно
- Полноценный Linux внутри Windows
- **Проверка:** Откройте "Ubuntu" или "WSL" из меню Пуск

**Я буду показывать команды для всех трёх вариантов.**

---

## Шаг 2: Создайте SSH ключ

### Вариант A: Git Bash

```bash
# Откройте Git Bash (правой кнопкой на рабочем столе → Git Bash Here)

# Создайте ключ
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy"

# Вопросы:
# "Enter file in which to save the key" → нажмите ENTER
# "Enter passphrase" → нажмите ENTER (без пароля)
# "Enter same passphrase again" → нажмите ENTER

# Готово! Созданы файлы:
# C:\Users\ВашеИмя\.ssh\id_rsa
# C:\Users\ВашеИмя\.ssh\id_rsa.pub
```

### Вариант B: PowerShell

```powershell
# Откройте PowerShell (Win+X → Windows PowerShell)

# Создайте ключ
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy"

# Нажмите ENTER на все вопросы (3 раза)

# Готово! Созданы файлы:
# C:\Users\ВашеИмя\.ssh\id_rsa
# C:\Users\ВашеИмя\.ssh\id_rsa.pub
```

### Вариант C: WSL

```bash
# Откройте WSL/Ubuntu из меню Пуск

# Создайте ключ
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy"

# Нажмите ENTER на все вопросы

# Готово! Созданы файлы:
# ~/.ssh/id_rsa
# ~/.ssh/id_rsa.pub
```

---

## Шаг 3: Посмотрите публичный ключ

### Вариант A: Git Bash

```bash
cat ~/.ssh/id_rsa.pub
```

### Вариант B: PowerShell

```powershell
# Способ 1: С помощью Get-Content
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub

# Способ 2: С помощью type
type $env:USERPROFILE\.ssh\id_rsa.pub

# Способ 3: Открыть в Блокноте
notepad $env:USERPROFILE\.ssh\id_rsa.pub
```

### Вариант C: WSL

```bash
cat ~/.ssh/id_rsa.pub
```

**Результат выглядит так:**
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC8... github-actions-deploy
```

**Скопируйте ВСЮ эту строку** (выделите мышкой и Ctrl+C).

---

## Шаг 4: Добавьте публичный ключ на сервер

### Способ 1: Автоматический (через ssh-copy-id)

#### Git Bash или WSL:

```bash
# Замените USER и SERVER_IP на ваши значения
ssh-copy-id -i ~/.ssh/id_rsa.pub USER@SERVER_IP

# Пример:
ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@123.45.67.89

# Введите пароль от сервера (последний раз!)
```

#### PowerShell:

```powershell
# В PowerShell нет ssh-copy-id, используйте способ 2 (ручной)
```

### Способ 2: Ручной (работает везде)

**Шаг 4.1: Подключитесь к серверу**

```bash
# Git Bash или WSL
ssh USER@SERVER_IP

# PowerShell
ssh USER@SERVER_IP

# Введите пароль
```

**Шаг 4.2: На сервере выполните команды**

```bash
# Создайте директорию .ssh (если её нет)
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Откройте файл authorized_keys
nano ~/.ssh/authorized_keys

# ВСТАВЬТЕ ваш публичный ключ (скопированный на шаге 3)
# Если в файле уже есть ключи - добавьте на новую строку!
# Сохраните: Ctrl+X, затем Y, затем Enter

# Установите правильные права
chmod 600 ~/.ssh/authorized_keys

# Выйдите
exit
```

---

## Шаг 5: Проверьте подключение БЕЗ пароля

### Git Bash или WSL:

```bash
ssh USER@SERVER_IP

# Должно подключиться БЕЗ запроса пароля!
# Если спрашивает пароль - вернитесь к шагу 4
```

### PowerShell:

```powershell
ssh USER@SERVER_IP

# Должно подключиться БЕЗ запроса пароля!
```

---

## Шаг 6: Скопируйте ПРИВАТНЫЙ ключ для GitHub

⚠️ **ВАЖНО:** Теперь копируем ПРИВАТНЫЙ ключ (без .pub)!

### Вариант A: Git Bash

```bash
cat ~/.ssh/id_rsa

# Скопируйте ВЕСЬ вывод (включая строки BEGIN и END)
```

### Вариант B: PowerShell

**Способ 1: Вывести в консоль**
```powershell
Get-Content $env:USERPROFILE\.ssh\id_rsa

# Скопируйте ВЕСЬ вывод
```

**Способ 2: Открыть в Блокноте (проще)**
```powershell
notepad $env:USERPROFILE\.ssh\id_rsa

# В Блокноте: Ctrl+A (выделить всё) → Ctrl+C (копировать)
```

### Вариант C: WSL

```bash
cat ~/.ssh/id_rsa

# Скопируйте ВЕСЬ вывод
```

**Должно выглядеть так:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAACFwAAAAdzc2gtcn
... (много строк) ...
AAAAAAEC
-----END OPENSSH PRIVATE KEY-----
```

**Скопируйте ВЕСЬ текст от BEGIN до END включительно!**

---

## Шаг 7: Добавьте секреты в GitHub

### 7.1 Откройте страницу секретов

1. Откройте: https://github.com/kragger-ra/NetTyanMC
2. Нажмите **Settings** (вверху)
3. Слева: **Secrets and variables** → **Actions**
4. Нажмите зеленую кнопку **New repository secret**

### 7.2 Добавьте 4 секрета

#### Секрет 1: SSH_PRIVATE_KEY

```
Name: SSH_PRIVATE_KEY
Secret: [вставьте содержимое приватного ключа из шага 6]
```

Нажмите **Add secret**.

#### Секрет 2: SERVER_HOST

```
Name: SERVER_HOST
Secret: 123.45.67.89
```
(замените на IP вашего сервера)

Нажмите **Add secret**.

#### Секрет 3: SERVER_USER

```
Name: SERVER_USER
Secret: ubuntu
```
(замените на имя пользователя на вашем сервере)

Нажмите **Add secret**.

#### Секрет 4: DEPLOY_PATH

```
Name: DEPLOY_PATH
Secret: /opt/nettyan/NetTyanMC
```
(замените на путь где находится проект на сервере)

Нажмите **Add secret**.

### 7.3 Проверьте

Должно быть 4 секрета:
- ✓ SSH_PRIVATE_KEY
- ✓ SERVER_HOST
- ✓ SERVER_USER
- ✓ DEPLOY_PATH

---

## Шаг 8: Проверьте что проект на сервере

Подключитесь к серверу и убедитесь что проект клонирован:

### Git Bash или WSL:

```bash
ssh USER@SERVER_IP

# На сервере:
cd /opt/nettyan/NetTyanMC
git status
docker compose ps
```

### PowerShell:

```powershell
ssh USER@SERVER_IP

# На сервере:
cd /opt/nettyan/NetTyanMC
git status
docker compose ps
```

---

## Шаг 9: Убедитесь что пользователь может использовать docker

На сервере выполните:

```bash
# Добавить пользователя в группу docker
sudo usermod -aG docker $USER

# Выйдите и зайдите снова
exit

# Подключитесь снова
ssh USER@SERVER_IP

# Проверьте что docker работает БЕЗ sudo
docker ps

# Если показывает контейнеры или пустой список - всё ОК
# Если ошибка "permission denied" - повторите команду usermod
```

---

## Шаг 10: Тестовый запуск автодеплоя

Теперь проверим что всё работает!

### В командной строке (любой вариант)

```bash
# Перейдите в директорию проекта
cd N:\Minecraftserver

# Добавьте файлы CI/CD
git add .github/ deploy.sh CI_CD_SETUP.md SSH_SETUP_GUIDE.md SSH_SETUP_WINDOWS.md
git commit -m "Setup CI/CD автодеплой"
git push origin main
```

### В GitHub

1. Откройте: https://github.com/kragger-ra/NetTyanMC/actions
2. Вы увидите запущенный workflow **"Deploy to Production"**
3. Кликните на него
4. Смотрите логи в реальном времени

**Что должно произойти:**
- ✓ Checkout code
- ✓ Setup SSH key
- ✓ Deploy to server
  - Подключение по SSH ✓
  - git pull origin main ✓
  - Перезапуск сервисов ✓
  - Проверка статуса ✓

Если всё зелёное - деплой работает!

---

## Полезные команды для Windows

### Git Bash

```bash
# Посмотреть публичный ключ
cat ~/.ssh/id_rsa.pub

# Посмотреть приватный ключ
cat ~/.ssh/id_rsa

# Подключиться к серверу
ssh user@server-ip

# Скопировать файл на сервер
scp file.txt user@server-ip:/path/to/destination
```

### PowerShell

```powershell
# Посмотреть публичный ключ
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub

# Посмотреть приватный ключ
Get-Content $env:USERPROFILE\.ssh\id_rsa

# Открыть ключ в Блокноте
notepad $env:USERPROFILE\.ssh\id_rsa.pub

# Подключиться к серверу
ssh user@server-ip

# Узнать путь к .ssh
echo $env:USERPROFILE\.ssh
```

### Проводник Windows

Путь к SSH ключам:
```
C:\Users\ВашеИмя\.ssh\
```

Можете открыть в Проводнике:
1. Win+R
2. Введите: `%USERPROFILE%\.ssh`
3. Enter

Там будут файлы:
- `id_rsa` - приватный ключ (СЕКРЕТ!)
- `id_rsa.pub` - публичный ключ
- `known_hosts` - список известных серверов

---

## Troubleshooting для Windows

### Ошибка: "ssh-keygen не является внутренней командой"

**Решение:**

1. Установите Git for Windows: https://git-scm.com/download/win
2. Или включите OpenSSH в Windows:
   - Параметры → Приложения → Дополнительные компоненты
   - Найдите "Клиент OpenSSH"
   - Установите

### Ошибка: "Permission denied (publickey)" при подключении

**Решение:**

```bash
# Проверьте что используете правильный ключ
ssh -i ~/.ssh/id_rsa user@server-ip

# С отладкой (покажет что именно не так)
ssh -vvv user@server-ip
```

На сервере проверьте:
```bash
ls -la ~/.ssh/
cat ~/.ssh/authorized_keys

# Должны быть правильные права
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Не могу скопировать из терминала

**PowerShell:**
- Выделите текст мышкой
- Нажмите Enter (скопирует)
- Или правой кнопкой → Копировать

**Git Bash:**
- Выделите текст мышкой
- Ctrl+Insert (копировать)
- Shift+Insert (вставить)

**Альтернатива:**
Используйте `notepad` для открытия файлов.

### Ошибка: "Could not open a connection to your authentication agent"

**Решение (Git Bash):**
```bash
eval $(ssh-agent)
ssh-add ~/.ssh/id_rsa
```

**Решение (PowerShell):**
```powershell
Start-Service ssh-agent
ssh-add $env:USERPROFILE\.ssh\id_rsa
```

---

## Визуальная схема

```
┌──────────────────────────┐
│ Ваш компьютер (Windows)  │
│                          │
│ 1. Создаём SSH ключ      │
│    C:\Users\You\.ssh\    │
│    - id_rsa (приватный)  │
│    - id_rsa.pub (публичн)│
│                          │
│ 2. git push origin main  │
└──────────┬───────────────┘
           │
           v
┌──────────────────────────────┐
│ GitHub                       │
│                              │
│ Secrets:                     │
│ - SSH_PRIVATE_KEY (приватный)│
│ - SERVER_HOST                │
│ - SERVER_USER                │
│ - DEPLOY_PATH                │
│                              │
│ Actions workflow запускается │
└──────────┬───────────────────┘
           │ SSH подключение
           v
┌──────────────────────────────┐
│ Удалённый сервер (Linux)     │
│                              │
│ ~/.ssh/authorized_keys       │
│ (содержит публичный ключ)    │
│                              │
│ Проект: /opt/nettyan/NetTyan │
│                              │
│ Выполняет:                   │
│ - git pull                   │
│ - docker compose restart     │
└──────────────────────────────┘
```

---

## Быстрая шпаргалка для Windows

### Создать ключ
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions"
# Нажать Enter 3 раза
```

### Посмотреть публичный ключ
```powershell
notepad $env:USERPROFILE\.ssh\id_rsa.pub
```

### Посмотреть приватный ключ
```powershell
notepad $env:USERPROFILE\.ssh\id_rsa
```

### Подключиться к серверу
```bash
ssh user@server-ip
```

### Добавить ключ на сервер (на сервере)
```bash
nano ~/.ssh/authorized_keys
# Вставить публичный ключ
# Ctrl+X → Y → Enter
chmod 600 ~/.ssh/authorized_keys
```

### Проверить подключение
```bash
ssh user@server-ip
# Должно подключиться БЕЗ пароля
```

---

**Готово! Теперь автодеплой работает.**

При каждом `git push` в main - GitHub автоматически обновит сервер.
