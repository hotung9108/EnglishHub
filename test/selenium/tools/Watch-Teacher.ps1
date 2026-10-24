$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Join-Path $PSScriptRoot '..')
Write-Host 'QA-29 - Watch teacher tests in Chrome'
Write-Host 'Default delay: 2.5 seconds before each action.'
Write-Host 'Leave blank for full expanded suite. Example single case: QA29-003'
$selectedCase = (Read-Host 'Case ID').Trim().ToUpperInvariant()
if ($selectedCase -and $selectedCase -notmatch '^QA29-\d{3}$') {
    Write-Host 'Case ID format: QA29-003.' -ForegroundColor Red
    exit 2
}
if (-not (Test-Path -LiteralPath '.env')) {
    Write-Host 'Configure test/selenium/.env first.'
    exit 2
}
if (-not (Test-Path -LiteralPath 'node_modules\selenium-webdriver\package.json')) {
    & npm.cmd ci --no-audit --no-fund --cache .cache/npm
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
if ($selectedCase) {
    & node run-teacher.js --watch "--case=$selectedCase"
} else {
    & node run-teacher.js --watch
}
exit $LASTEXITCODE
