# Server initial configure

## For windows 10

### Удал. управление - SSH

```powershell
# Проверка
Get-Service sshd

# Установить OpenSSH Server
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0

# Запустить
Start-Service sshd

# Автозапуск при загрузке
Set-Service -Name sshd -StartupType Automatic
```

### SSH ключи — синхронизация с GitHub

Сервер автоматически принимает все SSH-ключи пользователей из GitHub.
Список аккаунтов задаётся в `scripts/github-keys.ps1` (`$githubUsers`).

**1. Скопировать скрипт на сервер:**

```powershell
Copy-Item scripts\github-keys.ps1 C:\ProgramData\ssh\github-keys.ps1
```

**2. Запустить вручную первый раз (проверка):**

```powershell
powershell -ExecutionPolicy Bypass -File "C:\ProgramData\ssh\github-keys.ps1"
# Должно вывести: OK: Updated N keys from N accounts
```

**3. Создать задачу в Task Scheduler (каждые 10 минут):**

```powershell
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument '-ExecutionPolicy Bypass -File "C:\ProgramData\ssh\github-keys.ps1"'

$trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 10) -Once -At (Get-Date)

$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 2)

Register-ScheduledTask `
    -TaskName "SyncGitHubSSHKeys" `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -RunLevel Highest `
    -Force
```

**4. Запустить задачу немедленно (без ожидания 10 минут):**

```powershell
Start-ScheduledTask -TaskName "SyncGitHubSSHKeys"
```

**Проверить результат:**

```powershell
Get-Content C:\ProgramData\ssh\administrators_authorized_keys
```

**Добавить нового разработчика:**
Отредактировать `$githubUsers` в `scripts/github-keys.ps1`, скопировать на сервер, запустить задачу.
Убрать разработчика — то же самое: удалить из списка, запустить задачу.

---

### Прямой прокси для сервера - haproxy

ссылка на конфиг, он тут где-то был в репке.
