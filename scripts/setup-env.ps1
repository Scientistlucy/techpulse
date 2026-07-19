# TechPulse - one-time Firebase credential setup (Kenya-friendly)
# Usage: .\scripts\setup-env.ps1 -JsonPath "C:\Users\Admin\Downloads\techpulse-eae22-firebase-adminsdk-xxxxx.json"

param(
    [Parameter(Mandatory = $true)]
    [string]$JsonPath
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot ".env"

if (-not (Test-Path $JsonPath)) {
    Write-Error "JSON file not found: $JsonPath"
    exit 1
}

$json = Get-Content $JsonPath -Raw | ConvertFrom-Json
$oneLine = (Get-Content $JsonPath -Raw).Trim() -replace "`r`n", "" -replace "`n", ""

$content = @"
PORT=3000
FIREBASE_PROJECT_ID=techpulse-eae22
FIREBASE_SERVICE_ACCOUNT=$oneLine
CACHE_TTL_LIST_MS=300000
CACHE_TTL_ITEM_MS=900000
"@

Set-Content -Path $envFile -Value $content -Encoding UTF8
Write-Host "Done! .env updated for project: techpulse-eae22"
Write-Host "Run: npm start"
