param(
  [string]$OutputDir = "_site"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$resolvedOutputDir = if ([System.IO.Path]::IsPathRooted($OutputDir)) {
  $OutputDir
} else {
  Join-Path $repoRoot $OutputDir
}
$resolvedOutputDir = [System.IO.Path]::GetFullPath($resolvedOutputDir)

function New-CleanDirectory {
  param([string]$Path)

  if (Test-Path -LiteralPath $Path) {
    Remove-Item -LiteralPath $Path -Recurse -Force
  }

  New-Item -ItemType Directory -Path $Path | Out-Null
}

function Copy-RepoFile {
  param(
    [string]$SourceRelativePath,
    [string]$DestinationRelativePath = $SourceRelativePath
  )

  $sourcePath = Join-Path $repoRoot $SourceRelativePath
  if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "缺少发布文件：$SourceRelativePath"
  }

  $destinationPath = Join-Path $resolvedOutputDir $DestinationRelativePath
  $destinationParent = Split-Path -Parent $destinationPath
  if ($destinationParent) {
    New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
  }

  Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Force
}

function Copy-RepoDirectory {
  param(
    [string]$SourceRelativePath,
    [string]$DestinationRelativePath = $SourceRelativePath
  )

  $sourcePath = Join-Path $repoRoot $SourceRelativePath
  if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "缺少发布目录：$SourceRelativePath"
  }

  $destinationPath = Join-Path $resolvedOutputDir $DestinationRelativePath
  $destinationParent = Split-Path -Parent $destinationPath
  if ($destinationParent) {
    New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
  }

  Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Recurse -Force
}

function Copy-GeoBoundariesAssets {
  $geoRoot = Join-Path $repoRoot "data\geoboundaries"
  $manifestPath = Join-Path $geoRoot "adm1-manifest.json"
  if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "缺少 geoBoundaries ADM1 清单：data/geoboundaries/adm1-manifest.json"
  }

  Copy-RepoFile ".nojekyll"
  Copy-RepoFile "data/geoboundaries/adm0.geojson"
  Copy-RepoFile "data/geoboundaries/adm1-manifest.json"
  Copy-RepoFile "data/geoboundaries/ATTRIBUTION.txt"

  $manifestText = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8
  $pathMatches = [System.Text.RegularExpressions.Regex]::Matches(
    $manifestText,
    '"path"\s*:\s*"(?<path>[^"]+)"'
  )
  foreach ($match in $pathMatches) {
    $path = $match.Groups["path"].Value
    if ([string]::IsNullOrWhiteSpace($path)) {
      continue
    }

    $normalizedRelativePath = $path -replace '^[./\\]+', ''
    Copy-RepoFile "data/geoboundaries/$normalizedRelativePath"
  }
}

New-CleanDirectory -Path $resolvedOutputDir

Copy-RepoFile ".nojekyll"
Copy-RepoFile "index.html"
Copy-RepoFile "app.js"
Copy-RepoFile "styles.css"
Copy-RepoDirectory "Cesium-1.139.1/Build/Cesium" "Cesium-1.139.1/Build/Cesium"
Copy-RepoDirectory "data/catalog"
Copy-GeoBoundariesAssets

$siteFiles = Get-ChildItem -LiteralPath $resolvedOutputDir -Recurse -File
$siteSizeMb = [math]::Round((($siteFiles | Measure-Object Length -Sum).Sum / 1MB), 2)

Write-Host "GitHub Pages package ready: $resolvedOutputDir"
Write-Host "Files: $($siteFiles.Count)"
Write-Host "SizeMB: $siteSizeMb"
