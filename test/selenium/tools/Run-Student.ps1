param([string]$CaseId, [switch]$Watch, [switch]$Quick, [switch]$FreshFixtures, [int]$DelayMs = 1500, [switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Join-Path $PSScriptRoot '..')
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host 'Install Node.js 22+ first.'; exit 2 }
if ($CheckOnly) {
    foreach ($qa30Required in @('node_modules/selenium-webdriver/package.json', 'run-student.js', 'fixtures/qa29-writing-sample.pdf', 'tools/check-student-staging.mjs')) {
        if (-not (Test-Path -LiteralPath $qa30Required)) { Write-Host ('Missing launcher prerequisite: ' + $qa30Required); exit 2 }
    }
    & node --check run-student.js
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    & node --input-type=module -e "import {studentCases} from './tests/student/cases.js'; if(Number(process.versions.node.split('.')[0])<22)process.exit(2); console.log('QA30 launcher OK: '+studentCases.length+' cases; no network, browser, setup or test execution.');"
    exit $LASTEXITCODE
}
if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
    Write-Host 'Configure QA Admin, Teacher and Student credentials in test/selenium/.env, then run again.'
    exit 2
}
if (-not (Test-Path -LiteralPath 'node_modules/selenium-webdriver/package.json')) {
    & npm.cmd ci --no-audit --no-fund --cache .cache/npm
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
$env:SELENIUM_HEADLESS = 'true'
$qa30Arguments = @()
if ($CaseId) { $qa30Arguments += "--case=$CaseId" }
if ($Watch) { $qa30Arguments += '--watch'; $qa30Arguments += "--delay-ms=$DelayMs" }
if ($Quick) { $qa30Arguments += '--quick' }
if ($FreshFixtures) { $qa30Arguments += '--fresh-fixtures' }
New-Item -ItemType Directory -Path 'reports' -Force | Out-Null
$qa30Started = [DateTime]::UtcNow
$qa30Log = Join-Path (Get-Location) ('reports/launcher-qa30-' + $qa30Started.ToString('yyyyMMdd-HHmmss') + '.log')
if ($CaseId) { Write-Host ("QA30: " + $CaseId + ' - single case.') }
else { Write-Host 'QA30: Student suite on staging; each full run prepares a new isolated QA class and assignments.' }
Write-Host 'Wait for completion. The report opens automatically. Failed cases require review.'
Write-Host 'QA30 v8: preflight, independent filter checks and linked product dependencies.'
$ErrorActionPreference = 'Continue'
& node run-student.js @qa30Arguments 2>&1 | Tee-Object -FilePath $qa30Log
$qa30Exit = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
$qa30Pointer = 'reports/latest-qa30.txt'
if ((Test-Path -LiteralPath $qa30Pointer) -and (Get-Item -LiteralPath $qa30Pointer).LastWriteTimeUtc -ge $qa30Started) {
    $qa30Report = (Get-Content -LiteralPath $qa30Pointer -Raw).Trim()
    if (Test-Path -LiteralPath $qa30Report) {
        Copy-Item -LiteralPath $qa30Log -Destination (Join-Path (Split-Path -Parent $qa30Report) 'terminal.log')
        Write-Host ('REPORT: ' + $qa30Report)
        Invoke-Item -LiteralPath $qa30Report
    }
} else { Write-Host ('Read launcher log: ' + $qa30Log) }
exit $qa30Exit
