param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath
)

$scriptPath = Join-Path $PSScriptRoot 'import-settlements-json.js'
node $scriptPath $InputPath