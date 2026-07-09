param(
  [string]$OutputPath = 'data/serbia-settlements-full.json',
  [string]$DistrictsPath = 'C:\Users\mmilosev\Downloads\rs.json'
)

$repoRoot = Split-Path $PSScriptRoot -Parent
$tempDir = Join-Path $env:TEMP 'evorupa-geonames'
$zipPath = Join-Path $tempDir 'RS.zip'
$geonamesPath = Join-Path $tempDir 'RS.txt'
$admin2Path = Join-Path $tempDir 'admin2Codes.txt'
$fallbackDistrictsPath = Join-Path $repoRoot 'data\serbia-districts.json'

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
Invoke-WebRequest -UseBasicParsing -Uri 'https://download.geonames.org/export/dump/RS.zip' -OutFile $zipPath
Invoke-WebRequest -UseBasicParsing -Uri 'https://download.geonames.org/export/dump/admin2Codes.txt' -OutFile $admin2Path
Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force

if (-not (Test-Path $DistrictsPath)) {
  $DistrictsPath = $fallbackDistrictsPath
}

$scriptPath = Join-Path $PSScriptRoot 'build-serbia-settlements.js'
node $scriptPath --geonames $geonamesPath --admin2 $admin2Path --districts $DistrictsPath --output $OutputPath