param([switch]$CheckOnly,[switch]$Watch,[string]$Case,[string]$Cases,[int]$Slow=1800)
$ErrorActionPreference = 'Stop'
$suite = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\selenium'))
Push-Location -LiteralPath $suite
try {
  $runnerArgs = @('run-admin.js')
  if ($CheckOnly) { $runnerArgs += '--check-only' }
  if ($Watch) { $runnerArgs += @('--watch',"--slow=$Slow") }
  if ($Case) { $runnerArgs += "--case=$Case" }
  if ($Cases) { $runnerArgs += "--cases=$Cases" }
  if ($CheckOnly) { & node @runnerArgs; $runExit = $LASTEXITCODE }
  else {
    New-Item -ItemType Directory -Force -Path '.cache' | Out-Null
    $logPath = Join-Path $suite ('.cache\qa31-console-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.log')
    $runStarted = [DateTime]::UtcNow
    & node @runnerArgs 2>&1 | Tee-Object -FilePath $logPath
    $runExit = $LASTEXITCODE
    $pointer = Join-Path $suite 'reports\latest-qa31.json'
    if ((Test-Path -LiteralPath $pointer) -and (Get-Item -LiteralPath $pointer).LastWriteTimeUtc -ge $runStarted) {
      $reportPath = (Get-Content -LiteralPath $pointer -Raw | ConvertFrom-Json).report
      if (Test-Path -LiteralPath $reportPath) { Start-Process -FilePath $reportPath }
    }
    Write-Host "Console log: $logPath"
  }
} finally { Pop-Location }
exit $runExit
