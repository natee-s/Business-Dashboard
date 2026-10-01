# สร้าง Desktop Shortcut สำหรับ บ้านยาสุขใจ Dashboard
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$launchScript = Join-Path $projectPath "launch.ps1"
$desktopPath = [System.Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "บ้านยาสุขใจ Dashboard.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$shortcut = $WshShell.CreateShortcut($shortcutPath)

# Target: PowerShell runs launch.ps1 with a nice window
$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = "-ExecutionPolicy Bypass -WindowStyle Normal -File `"$launchScript`""
$shortcut.WorkingDirectory = $projectPath
$shortcut.Description = "เปิด Dashboard ร้านยาบ้านยาสุขใจ"

# Use a pharmacy/medical icon (built-in Windows icon)
# Shell32.dll icon index 76 = globe/web, 21 = computer
$shortcut.IconLocation = "shell32.dll,23"

$shortcut.Save()

Write-Host ""
Write-Host "✅ สร้าง Shortcut บน Desktop สำเร็จ!" -ForegroundColor Green
Write-Host "   ไฟล์: $shortcutPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "วิธีใช้: Double-click ที่ไอคอน 'บ้านยาสุขใจ Dashboard' บน Desktop" -ForegroundColor Yellow
Write-Host ""
Read-Host "กด Enter เพื่อปิด"
