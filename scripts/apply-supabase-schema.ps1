param(
  [string]$DatabaseUrl = $env:SUPABASE_DATABASE_URL
)

if (-not $DatabaseUrl) {
  throw 'Set SUPABASE_DATABASE_URL or pass -DatabaseUrl with a full Postgres connection string.'
}

$psql = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psql) {
  throw 'psql was not found on PATH. Install PostgreSQL client tools before running this script.'
}

$scriptPath = Join-Path $PSScriptRoot 'bootstrap-supabase.sql'

if (-not (Test-Path $scriptPath)) {
  throw "Schema file not found: $scriptPath"
}

& $psql.Source $DatabaseUrl -v ON_ERROR_STOP=1 -f $scriptPath

if ($LASTEXITCODE -ne 0) {
  throw "psql exited with code $LASTEXITCODE"
}