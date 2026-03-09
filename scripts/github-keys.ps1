# Синхронизация SSH ключей с GitHub -> authorized_keys
# Запускается по расписанию через Task Scheduler
# Список GitHub-аккаунтов чьи ключи принимаем на сервер
$githubUsers = @("3ndetz", "kragger-ra")

$keysFile = "C:\ProgramData\ssh\administrators_authorized_keys"
$keys = @()

foreach ($ghUser in $githubUsers) {
    try {
        $response = Invoke-WebRequest -Uri "https://github.com/$ghUser.keys" -UseBasicParsing -TimeoutSec 10
        $userKeys = $response.Content.Trim()
        if ($userKeys) {
            $keys += "# $ghUser"
            $keys += $userKeys
        }
    } catch {
        Write-Host "WARNING: Could not fetch keys for $ghUser"
    }
}

if ($keys.Count -gt 0) {
    $keys | Set-Content -Path $keysFile -Encoding UTF8
    # Права обязательны, иначе SSH игнорирует файл
    icacls $keysFile /inheritance:r /grant "Administrators:F" /grant "SYSTEM:F" | Out-Null
    Write-Host "OK: Updated $($keys.Count) keys from $($githubUsers.Count) accounts"
} else {
    Write-Host "ERROR: No keys fetched, keeping existing file"
}
