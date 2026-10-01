$proj = "d:\12.Project\12_Business_Dashboard\pharmacy-dashboard"
$launch = "$proj\launch.ps1"
$desktop = [System.Environment]::GetFolderPath("Desktop")
$lnkPath = "$desktop\Dashboard-BaanYa.lnk"

$sh = New-Object -ComObject WScript.Shell
$lnk = $sh.CreateShortcut($lnkPath)
$lnk.TargetPath = "powershell.exe"
$lnk.Arguments = "-ExecutionPolicy Bypass -WindowStyle Normal -File `"$launch`""
$lnk.WorkingDirectory = $proj
$lnk.IconLocation = "shell32.dll,14"
$lnk.Save()

Write-Host "Created: $lnkPath"
