@echo off
cd /d "%~dp0"

echo [1/3] 🚀 正在啟動 Discord Bot (Docker Compose)...
docker-compose up -d

echo [2/3] 🧹 正在清理舊的背景監控腳本...
:: 根據檔案名稱殺掉舊的 PowerShell 監控行程，避免重複啟動
powershell -Command "Get-Process powershell | Where-Object { (Get-CimInstance Win32_Process -Filter \"ProcessId = $($_.Id)\").CommandLine -match 'monitor_bot.ps1' } | Stop-Process -Force" 2>nul

echo [3/3] 🕵️ 正在啟動新的背景監控腳本 (PowerShell)...
start /b powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0monitor_bot.ps1"

echo.
echo ==========================================
echo ✅ 系統已重新校準並啟動！
echo ==========================================
timeout /t 3 > nul
exit