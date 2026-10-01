// Create Windows Desktop Shortcut for Dashboard
const path = require('path');
const { execSync } = require('child_process');

const projectPath = __dirname;
const launchScript = path.join(projectPath, 'launch.ps1');
const desktopPath = require('os').homedir() + '\\Desktop';
const shortcutName = 'Dashboard - BaanYaSukjai.lnk';
const shortcutPath = path.join(desktopPath, shortcutName);

// PowerShell script to create shortcut (all ASCII-safe)
const ps = `
$WshShell = New-Object -ComObject WScript.Shell
$shortcut = $WshShell.CreateShortcut('${shortcutPath.replace(/\\/g, '\\\\')}')
$shortcut.TargetPath = 'powershell.exe'
$shortcut.Arguments = '-ExecutionPolicy Bypass -WindowStyle Normal -File \\"${launchScript.replace(/\\/g, '\\\\')}\\\"'
$shortcut.WorkingDirectory = '${projectPath.replace(/\\/g, '\\\\')}'
$shortcut.Description = 'Open Baan Ya Suk Jai Business Dashboard'
$shortcut.IconLocation = 'shell32.dll,14'
$shortcut.Save()
Write-Host 'Shortcut created: ${shortcutPath.replace(/\\/g, '\\\\')}'
`;

try {
  const result = execSync(`powershell -NoProfile -Command "${ps.replace(/\n/g, ' ')}"`, { encoding: 'utf8' });
  console.log('✅ Desktop shortcut created!');
  console.log('   File:', shortcutPath);
  console.log('   Double-click to launch the dashboard.');
} catch (e) {
  console.error('Error:', e.message);
}
