# บ้านยาสุขใจ — Dashboard Launcher
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = "http://localhost:3000"
$port = 3000

# Check if already running on port 3000
$portInUse = netstat -ano 2>$null | Select-String ":$port " | Select-String "LISTENING"

if (-not $portInUse) {
    Write-Host "🏥 กำลังเริ่ม Dashboard บ้านยาสุขใจ..." -ForegroundColor Cyan
    
    # Start server in background (hidden window)
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "cmd.exe"
    $psi.Arguments = "/c cd /d `"$projectPath`" && npm start"
    $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    $psi.CreateNoWindow = $true
    $process = [System.Diagnostics.Process]::Start($psi)
    
    Write-Host "⏳ รอระบบพร้อม..." -ForegroundColor Yellow
    
    # Wait for server to be ready (max 30 seconds)
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        try {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 1 -ErrorAction Stop
            $ready = $true
            break
        } catch { }
    }
    
    if ($ready) {
        Write-Host "✅ ระบบพร้อมใช้งาน!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  เปิด browser แล้ว (ระบบอาจยังโหลดอยู่)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ ระบบกำลังทำงานอยู่แล้ว" -ForegroundColor Green
}

# Open browser
Start-Process $url
Write-Host "🌐 เปิด $url แล้ว" -ForegroundColor Cyan
Start-Sleep -Seconds 2
