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

### Прямой прокси для сервера - Gobetween

ссылка на конфиг, он тут где-то был в репке.

