$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Join-Path $PSScriptRoot '..')
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host 'Install Node.js 22+ first.'; exit 2 }
if (-not (Test-Path -LiteralPath '.env')) { Write-Host 'Configure test/selenium/.env first.'; exit 2 }
if (-not (Test-Path -LiteralPath 'node_modules/selenium-webdriver/package.json')) {
    & npm.cmd ci --no-audit --no-fund --cache .cache/npm
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
$env:SELENIUM_HEADLESS = 'true'
New-Item -ItemType Directory -Path 'reports' -Force | Out-Null
$qa29Started = [DateTime]::UtcNow
$qa29Log = Join-Path (Get-Location) ('reports/launcher-' + $qa29Started.ToString('yyyyMMdd-HHmmss') + '.log')
Write-Host 'QA-29: full 51-case staging suite; Chrome runs hidden, without observation delay.'
Write-Host 'The report and terminal log will open/save after completion. Do not run another suite on the same fixtures.'
$ErrorActionPreference = 'Continue'
& node run-teacher.js 2>&1 | Tee-Object -FilePath $qa29Log
$qa29Exit = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
$qa29Pointer = 'reports/latest-qa29.txt'
if ((Test-Path -LiteralPath $qa29Pointer) -and (Get-Item -LiteralPath $qa29Pointer).LastWriteTimeUtc -ge $qa29Started) {
    $qa29Report = (Get-Content -LiteralPath $qa29Pointer -Raw).Trim()
    if (Test-Path -LiteralPath $qa29Report) {
        Copy-Item -LiteralPath $qa29Log -Destination (Join-Path (Split-Path -Parent $qa29Report) 'terminal.log')
        Write-Host ('REPORT: ' + $qa29Report)
        Invoke-Item -LiteralPath $qa29Report
    }
} else { Write-Host ('No completed report pointer. Read launcher log: ' + $qa29Log) }
exit $qa29Exit
