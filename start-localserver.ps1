$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

$env:QUAKE_SERVER_URL = "http://127.0.0.1:8123"

$projectFile = Join-Path $repoRoot ".localserver\StaticServer.csproj"
$outputDir = Join-Path $repoRoot ".localserver\bin\Release\net10.0"
$exePath = Join-Path $outputDir "StaticServer.exe"
$repoLocalServerDir = Join-Path $repoRoot ".localserver"
$serverPort = 8123

$listenerPids = Get-NetTCPConnection -LocalPort $serverPort -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique

foreach ($pid in $listenerPids) {
  $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $pid" -ErrorAction SilentlyContinue
  if (-not $processInfo) {
    continue
  }

  $isRepoServer =
    ($processInfo.ExecutablePath -and $processInfo.ExecutablePath.StartsWith($repoLocalServerDir, [System.StringComparison]::OrdinalIgnoreCase)) -or
    ($processInfo.CommandLine -and $processInfo.CommandLine.IndexOf($repoLocalServerDir, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) -or
    ($processInfo.CommandLine -and $processInfo.CommandLine.IndexOf("StaticServer.dll", [System.StringComparison]::OrdinalIgnoreCase) -ge 0) -or
    ($processInfo.CommandLine -and $processInfo.CommandLine.IndexOf("StaticServer.exe", [System.StringComparison]::OrdinalIgnoreCase) -ge 0)

  if ($isRepoServer) {
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
  }
}

dotnet build $projectFile -c Release

if (-not (Test-Path $exePath)) {
  throw "未找到最新构建产物：$exePath"
}

& $exePath
