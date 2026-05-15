param(
  [string]$Repo = "mmilosevic14/gderupa",
  [string]$EnvFile = ".env.cloudflare.local"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $EnvFile)) {
  throw "Missing $EnvFile. Create it first with CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN."
}

$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
  throw "GitHub CLI (gh) is not installed or not in PATH. Install gh and run: gh auth login"
}

$vars = @{}
Get-Content $EnvFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
    $parts = $line.Split("=", 2)
    $vars[$parts[0].Trim()] = $parts[1].Trim()
  }
}

if (-not $vars.ContainsKey("CLOUDFLARE_ACCOUNT_ID") -or -not $vars.ContainsKey("CLOUDFLARE_API_TOKEN")) {
  throw "Both CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must exist in $EnvFile"
}

$vars["CLOUDFLARE_ACCOUNT_ID"] | gh secret set CLOUDFLARE_ACCOUNT_ID --repo $Repo --body -
$vars["CLOUDFLARE_API_TOKEN"] | gh secret set CLOUDFLARE_API_TOKEN --repo $Repo --body -

Write-Host "Cloudflare secrets updated in $Repo"
