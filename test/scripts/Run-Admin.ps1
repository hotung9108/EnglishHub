param([switch]$CheckOnly,[switch]$Watch,[string]$Case,[string]$Cases,[int]$Slow=1800)
$ErrorActionPreference = 'Stop'
$suite = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\selenium'))
Push-Location -LiteralPath $suite
try {
  $runnerArgs = @('run.js','--role=admin')
  if ($CheckOnly) { $runnerArgs += '--list' }
  if ($Watch) { $env:SELENIUM_HEADLESS = 'false' }
  if ($Case) { $runnerArgs += $Case }
  if ($Cases) { $runnerArgs += @($Cases -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }) }
  & node @runnerArgs
  $runExit = $LASTEXITCODE
} finally { Pop-Location }
exit $runExit
