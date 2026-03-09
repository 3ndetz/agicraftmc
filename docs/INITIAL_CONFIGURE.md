# Server initial configure

## windows 10

### Удаленное управление SSH

Установка OpenSSH Server

```powershell
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Start-Service sshd
Set-Service -Name sshd -StartupType Automatic
```

### Авторизованные ключи — права (русская локаль!)

```powershell
icacls C:\ProgramData\ssh\administrators_authorized_keys /inheritance:r /grant "NT AUTHORITY\СИСТЕМА:(F)" /grant "BUILTIN\Администраторы:(F)"
```

### Синхронизация ключей с GitHub (Task Scheduler, каждые 10 мин)

Список аккаунтов — `scripts/github-keys.ps1` (`$githubUsers`).

```powershell
# Скопировать скрипт
Copy-Item scripts\github-keys.ps1 C:\ProgramData\ssh\github-keys.ps1

# Создать задачу
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument '-ExecutionPolicy Bypass -File "C:\ProgramData\ssh\github-keys.ps1"'
$trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 10) -Once -At (Get-Date)
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 2)
Register-ScheduledTask -TaskName "SyncGitHubSSHKeys" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest -Force

# Запустить сразу
Start-ScheduledTask -TaskName "SyncGitHubSSHKeys"
```

---

Github аккаунт должен быть добавлен в список в .ps1 файл. Также в github нужно подгрузить ключ своего устройства, чтобы сервак его авторизовал.

### Прямой прокси для сервера - haproxy

ссылка на конфиг, он тут где-то был в репке.
