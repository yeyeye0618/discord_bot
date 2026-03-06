# ==========================================
# SETTINGS
# ==========================================
$CONTAINER_NAME = "my-discord-bot"
$PYTHON_PROJECT_ROOT = Resolve-Path "$PSScriptRoot\..\resource_transfer"
$PYTHON_EXE = "$PYTHON_PROJECT_ROOT\.venv\Scripts\pythonw.exe"
$PYTHON_MAIN = "$PYTHON_PROJECT_ROOT\main.py"
$SIGNAL_FILE = "$PYTHON_PROJECT_ROOT\.restart_signal"

$global:pythonProcess = $null

# ==========================================
# 1. ADMIN PRIVILEGE CHECK
# ==========================================
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

# 🚩 核心：啟動與關閉函數
function Safe-Start-Python {
    $existing = Get-Process | Where-Object { $_.ProcessName -eq "python" -and $_.Path -eq $PYTHON_EXE }
    if (-not $existing) {
        Write-Host "[$(Get-Date)] Action: Launching Python GUI..." -ForegroundColor Cyan
        $global:pythonProcess = Start-Process $PYTHON_EXE -ArgumentList $PYTHON_MAIN `
                                             -WorkingDirectory $PYTHON_PROJECT_ROOT `
                                             -Verb RunAs `
                                             -WindowStyle Hidden `
                                             -PassThru
    }
}

function Safe-Stop-Python {
    Write-Host "[$(Get-Date)] Action: Stopping Python..." -ForegroundColor Red
    Get-Process | Where-Object { $_.ProcessName -eq "python" -and $_.Path -eq $PYTHON_EXE } | Stop-Process -Force -ErrorAction SilentlyContinue
    $global:pythonProcess = $null
}

# ==========================================
# 2. MAIN MONITORING LOOP (並行監控)
# ==========================================
Write-Host "Status: ERTS Monitor is running..." -ForegroundColor Green
Write-Host "Monitoring Signal: $SIGNAL_FILE" -ForegroundColor Gray

# 紀錄上一次 Docker 的狀態，用來比對變化
$lastDockerStatus = ""

function Safe-Stop-Python {
    Write-Host "[$(Get-Date)] Action: Stopping Python..." -ForegroundColor Red
    
    # 1. 獲取所有相關進程
    $procs = Get-Process | Where-Object { $_.ProcessName -match "python" -and $_.Path -like "*$($PYTHON_PROJECT_ROOT)*" }
    
    if ($procs) {
        $procs | Stop-Process -Force -ErrorAction SilentlyContinue
        
        # 2. 驗證環節：等待進程真正消失 (最多等 5 秒)
        $timeout = 5
        while ((Get-Process | Where-Object { $_.ProcessName -match "python" -and $_.Path -like "*$($PYTHON_PROJECT_ROOT)*" }) -and $timeout -gt 0) {
            Start-Sleep -Seconds 1
            $timeout--
            Write-Host "Waiting for process to exit... ($timeout)" -ForegroundColor Gray
        }
    }
    $global:pythonProcess = $null
}

while ($true) {
    # --- A. 監控訊號檔 (每秒檢查) ---
    if (Test-Path $SIGNAL_FILE) {
        Write-Host "[$(Get-Date)] Signal detected: Restarting Python..." -ForegroundColor Yellow
    
        # 移除訊號檔放在前面，防止重複觸發
        Remove-Item $SIGNAL_FILE -Force -ErrorAction SilentlyContinue
        
        Safe-Stop-Python
        
        # 額外保險：強制檢查一次是否有殘留，確保環境乾淨
        Start-Sleep -Seconds 1 
        
        Safe-Start-Python
    }

    # --- B. 監控 Docker 狀態 ---
    $currentStatus = docker inspect --format='{{.State.Running}}' $CONTAINER_NAME 2>$null
    Start-Sleep -Seconds 1 
    if ($currentStatus -eq "true" -and $lastDockerStatus -ne "true") {
        Write-Host "[$(Get-Date)] Event: Bot Started." -ForegroundColor Cyan
        Safe-Start-Python
    }
    elseif ($currentStatus -ne "true" -and $lastDockerStatus -eq "true") {
        Write-Host "[$(Get-Date)] Event: Bot Stopped." -ForegroundColor Red
        Safe-Stop-Python
        exit
    }

    $lastDockerStatus = $currentStatus

    # --- C. 保持監聽頻率 (約 1 秒一次) ---
    Start-Sleep -Seconds 1
}