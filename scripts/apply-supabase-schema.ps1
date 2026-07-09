$scriptPath = Join-Path $PSScriptRoot 'apply-supabase-schema.js'

if (-not (Test-Path $scriptPath)) {
  throw "Schema runner not found: $scriptPath"
}

node $scriptPath

if ($LASTEXITCODE -ne 0) {
  throw "Schema apply failed with exit code $LASTEXITCODE"
}