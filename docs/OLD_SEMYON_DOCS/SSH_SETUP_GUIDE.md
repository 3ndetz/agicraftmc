# Пошаговая настройка SSH для GitHub Actions

Эта инструкция объяснит как настроить SSH подключение между GitHub Actions и вашим сервером.

---

## Что такое SSH ключи?

**SSH ключи** - пара файлов для безопасного подключения к серверу без пароля:
- **Приватный ключ** (`id_rsa`) - хранится у вас, никому не показываем
- **Публичный ключ** (`id_rsa.pub`) - размещается на сервере

**Аналогия:** Приватный ключ = ключ от двери, Публичный ключ = замок на двери.

---

## Шаг 1: Создание SSH ключей

### На Windows (через Git Bash или PowerShell)

```bash
# Откройте Git Bash или PowerShell
# Создайте новую пару ключей
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy"

# Программа спросит:
# "Enter file in which to save the key"
# Нажмите Enter (сохранится в C:\Users\ВашеИмя\.ssh\id_rsa)

# "Enter passphrase (empty for no passphrase)"
# Нажмите Enter (без пароля, для автоматизации)

# "Enter same passphrase again"
# Нажмите Enter
```

**Результат:** Созданы два файла:
```
C:\Users\ВашеИмя\.ssh\id_rsa       - приватный ключ (СЕКРЕТ!)
C:\Users\ВашеИмя\.ssh\id_rsa.pub   - публичный ключ
```

### На Linux/Mac

```bash
# Откройте терминал
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy"

# Нажмите Enter на все вопросы (без пароля)
```

**Результат:** Созданы файлы:
```
~/.ssh/id_rsa       - приватный ключ (СЕКРЕТ!)
~/.ssh/id_rsa.pub   - публичный ключ
```

---

## Шаг 2: Скопируйте публичный ключ

### Windows (Git Bash)

```bash
# Выведите содержимое публичного ключа
cat ~/.ssh/id_rsa.pub

# Или через PowerShell
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub

# Скопируйте весь вывод (одна длинная строка, начинается с "ssh-rsa")
```

### Linux/Mac

```bash
# Выведите публичный ключ
cat ~/.ssh/id_rsa.pub

# Скопируйте весь вывод
```

**Пример вывода:**
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDGh4j... github-actions-deploy
```

---

## Шаг 3: Добавьте публичный ключ на сервер

### Способ 1: Автоматический (рекомендуется)

```bash
# Замените USER и SERVER_IP на ваши значения
ssh-copy-id -i ~/.ssh/id_rsa.pub USER@SERVER_IP

# Пример:
ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@123.45.67.89

# Программа попросит ввести пароль от сервера (последний раз!)
```

После этого публичный ключ автоматически добавится на сервер.

### Способ 2: Ручной (если ssh-copy-id недоступен)

```bash
# 1. Подключитесь к серверу
ssh USER@SERVER_IP
# Введите пароль

# 2. Создайте директорию .ssh (если её нет)
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 3. Откройте файл authorized_keys
nano ~/.ssh/authorized_keys

# 4. Вставьте ваш публичный ключ (скопированный на шаге 2)
# Каждый ключ на отдельной строке!
# Сохраните: Ctrl+X, затем Y, затем Enter

# 5. Установите правильные права
chmod 600 ~/.ssh/authorized_keys

# 6. Выйдите с сервера
exit
```

---

## Шаг 4: Проверьте SSH подключение

Теперь вы должны подключиться БЕЗ пароля:

```bash
# Попробуйте подключиться
ssh -i ~/.ssh/id_rsa USER@SERVER_IP

# Пример:
ssh -i ~/.ssh/id_rsa ubuntu@123.45.67.89

# Если всё настроено правильно:
# - Вы подключитесь БЕЗ запроса пароля
# - Увидите приглашение командной строки сервера
```

**Если спрашивает пароль** - значит публичный ключ не добавлен правильно, вернитесь к Шагу 3.

---

## Шаг 5: Добавьте приватный ключ в GitHub Secrets

### 5.1 Скопируйте приватный ключ

**⚠️ ВАЖНО:** Копируем ПРИВАТНЫЙ ключ (без .pub)!

#### Windows (Git Bash)

```bash
cat ~/.ssh/id_rsa
```

#### Windows (PowerShell)

```powershell
Get-Content $env:USERPROFILE\.ssh\id_rsa | Out-String
```

#### Linux/Mac

```bash
cat ~/.ssh/id_rsa
```

**Скопируйте ВЕСЬ вывод**, включая строки:
```
-----BEGIN OPENSSH PRIVATE KEY-----
... (много строк) ...
-----END OPENSSH PRIVATE KEY-----
```

### 5.2 Добавьте в GitHub Secrets

1. Откройте ваш репозиторий на GitHub: https://github.com/kragger-ra/NetTyanMC

2. Перейдите в **Settings** → **Secrets and variables** → **Actions**

3. Нажмите **New repository secret**

4. Создайте секрет `SSH_PRIVATE_KEY`:
   - **Name:** `SSH_PRIVATE_KEY`
   - **Secret:** Вставьте содержимое приватного ключа (всё что скопировали)
   - Нажмите **Add secret**

5. Создайте секрет `SERVER_HOST`:
   - **Name:** `SERVER_HOST`
   - **Secret:** IP адрес вашего сервера (например: `123.45.67.89`)
   - Нажмите **Add secret**

6. Создайте секрет `SERVER_USER`:
   - **Name:** `SERVER_USER`
   - **Secret:** Имя пользователя на сервере (например: `ubuntu`)
   - Нажмите **Add secret**

7. Создайте секрет `DEPLOY_PATH`:
   - **Name:** `DEPLOY_PATH`
   - **Secret:** Путь к проекту на сервере (например: `/opt/nettyan/NetTyanMC`)
   - Нажмите **Add secret**

---

## Шаг 6: Убедитесь что проект клонирован на сервере

```bash
# Подключитесь к серверу
ssh USER@SERVER_IP

# Создайте директорию для проекта
sudo mkdir -p /opt/nettyan
sudo chown $USER:$USER /opt/nettyan
cd /opt/nettyan

# Клонируйте репозиторий (если ещё не клонирован)
git clone https://github.com/kragger-ra/NetTyanMC.git
cd NetTyanMC

# Проверьте что всё работает
git status
docker compose ps
```

---

## Шаг 7: Проверьте что пользователь в группе docker

GitHub Actions будет запускать `docker compose`, поэтому пользователь должен иметь права:

```bash
# На сервере
# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER

# Выйдите и зайдите снова чтобы изменения применились
exit
ssh USER@SERVER_IP

# Проверьте что docker работает БЕЗ sudo
docker ps
# Должен показать контейнеры (или пустой список без ошибок)
```

---

## Шаг 8: Тестовый запуск

Теперь всё готово для тестирования!

### 8.1 Сделайте тестовый commit

На локальной машине:

```bash
cd N:\Minecraftserver

# Добавьте файлы CI/CD
git add .github/ deploy.sh CI_CD_SETUP.md
git commit -m "Setup CI/CD автодеплой"
git push origin main
```

### 8.2 Смотрите прогресс в GitHub

1. Откройте: https://github.com/kragger-ra/NetTyanMC/actions
2. Вы увидите запущенный workflow "Deploy to Production"
3. Кликните на него чтобы посмотреть логи

**Что должно произойти:**
- ✓ Checkout code
- ✓ Setup SSH key
- ✓ Deploy to server
  - Подключение по SSH
  - git pull origin main
  - Определение изменённых файлов
  - Перезапуск нужных сервисов
  - Проверка статуса

### 8.3 Проверьте на сервере

```bash
ssh USER@SERVER_IP
cd /opt/nettyan/NetTyanMC

# Посмотрите последний коммит
git log -1

# Проверьте статус сервисов
docker compose ps
```

---

## Визуальная схема работы

```
┌─────────────────┐
│ Локальная машина│
│                 │
│  git push       │
└────────┬────────┘
         │
         v
┌─────────────────────────────┐
│ GitHub Actions              │
│                             │
│ 1. Забирает код             │
│ 2. Использует SSH_PRIVATE_KEY│
│    из Secrets               │
└────────┬────────────────────┘
         │ SSH соединение
         v
┌─────────────────────────────┐
│ Удалённый сервер            │
│                             │
│ 1. Проверяет SSH ключ       │
│    (authorized_keys)        │
│ 2. Разрешает подключение    │
│ 3. Выполняет git pull       │
│ 4. Перезапускает сервисы    │
└─────────────────────────────┘
```

---

## Troubleshooting

### Ошибка: "Permission denied (publickey)"

**Причина:** SSH ключ настроен неправильно

**Решение:**

```bash
# На сервере проверьте содержимое authorized_keys
cat ~/.ssh/authorized_keys

# Должен быть ваш публичный ключ (ssh-rsa AAA...)
# Если его нет - повторите Шаг 3

# Проверьте права
ls -la ~/.ssh/
# Должно быть:
# drwx------ (700) для .ssh/
# -rw------- (600) для .ssh/authorized_keys

# Если права неправильные:
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Ошибка: "Host key verification failed"

**Причина:** Сервер не добавлен в known_hosts

**Решение:**

```bash
# На локальной машине
ssh-keyscan -H SERVER_IP >> ~/.ssh/known_hosts

# Или просто подключитесь один раз вручную
ssh USER@SERVER_IP
# Введите "yes" когда спросит про fingerprint
```

### Ошибка: "docker: permission denied"

**Причина:** Пользователь не в группе docker

**Решение:**

```bash
# На сервере
sudo usermod -aG docker $USER

# Выйдите и зайдите снова
exit
ssh USER@SERVER_IP

# Проверьте
docker ps
```

### GitHub Actions не запускается

**Причина:** Workflow файл не в правильном месте или ошибка в YAML

**Решение:**

```bash
# Проверьте что файл в правильном месте
ls -la .github/workflows/deploy.yml

# Проверьте синтаксис YAML
cat .github/workflows/deploy.yml

# Проверьте что файл закоммичен
git log --all -- .github/workflows/deploy.yml
```

---

## Безопасность

### ✅ Правильно:
- Приватный ключ только в GitHub Secrets
- Публичный ключ на сервере в `~/.ssh/authorized_keys`
- Файл `authorized_keys` с правами 600
- Использовать отдельный ключ для CI/CD

### ❌ Неправильно:
- Коммитить приватный ключ в Git
- Публиковать приватный ключ в Issues/Discussions
- Использовать один ключ для всех целей
- Давать права 777 на .ssh директорию

---

## Дополнительно: Создание отдельного пользователя для деплоя

Для повышенной безопасности можно создать отдельного пользователя:

```bash
# На сервере (под root или sudo)
sudo useradd -m -s /bin/bash deployer
sudo usermod -aG docker deployer

# Настройте SSH для нового пользователя
sudo mkdir -p /home/deployer/.ssh
sudo nano /home/deployer/.ssh/authorized_keys
# Вставьте публичный ключ
sudo chown -R deployer:deployer /home/deployer/.ssh
sudo chmod 700 /home/deployer/.ssh
sudo chmod 600 /home/deployer/.ssh/authorized_keys

# Дайте права на директорию проекта
sudo chown -R deployer:deployer /opt/nettyan/NetTyanMC
```

Затем используйте `deployer` в GitHub Secret `SERVER_USER`.

---

## Полезные команды

```bash
# ====================================
# Управление SSH ключами
# ====================================

# Посмотреть публичный ключ
cat ~/.ssh/id_rsa.pub

# Посмотреть приватный ключ
cat ~/.ssh/id_rsa

# Посмотреть все ключи
ls -la ~/.ssh/

# Удалить ключи (если нужно начать заново)
rm ~/.ssh/id_rsa ~/.ssh/id_rsa.pub

# ====================================
# Проверка подключения
# ====================================

# Тестовое SSH подключение с отладкой
ssh -vvv -i ~/.ssh/id_rsa USER@SERVER_IP

# Проверить что ключ работает
ssh -i ~/.ssh/id_rsa USER@SERVER_IP "echo 'SSH works!'"

# ====================================
# На сервере
# ====================================

# Посмотреть authorized_keys
cat ~/.ssh/authorized_keys

# Посмотреть логи SSH
sudo tail -f /var/log/auth.log

# Проверить права
ls -la ~/.ssh/
```

---

**Готово! Теперь GitHub Actions может деплоить проект на сервер автоматически.**
