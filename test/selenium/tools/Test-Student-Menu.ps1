$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Join-Path $PSScriptRoot '..')
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
. (Join-Path $PSScriptRoot 'Student-Menu.ps1')
$json = & node --input-type=module -e "import {studentCases} from './tests/student/cases.js'; console.log(JSON.stringify(studentCases.map(({id,title})=>({id,title}))));"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$cases = @(Get-QA30MenuCases -Json $json)
if ($cases.Count -ne 45) { throw ('Menu must show 45 separate rows, found ' + $cases.Count) }
foreach ($choice in @('7', '007', 'QA30-007', 'qa30-007', ' QA30-007 ')) {
    $selected = @(Resolve-QA30MenuCase -Cases $cases -Choice $choice)
    if ($selected.Count -ne 1 -or $selected[0].id -ne 'QA30-007') { throw ('Cannot select case 007 using ' + $choice) }
}
foreach ($case in $cases) {
    $selected = @(Resolve-QA30MenuCase -Cases $cases -Choice $case.id)
    if ($selected.Count -ne 1 -or $selected[0].id -ne $case.id) { throw ('Cannot select ' + $case.id) }
}
$named = @(Resolve-QA30MenuCase -Cases $cases -Choice $cases[6].title)
if ($named.Count -ne 1 -or $named[0].id -ne 'QA30-007') { throw 'Cannot select by full case title.' }
foreach ($invalid in @('0', '46', '999', 'QA30-007;exit', '')) {
    $selected = @(Resolve-QA30MenuCase -Cases $cases -Choice $invalid)
    if ($selected.Count -ne 0) { throw ('Invalid selection was accepted: ' + $invalid) }
}
$watch = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'Watch-Student.ps1') -Raw
if ($watch -match '\s-Quick(?:\s|$)' -or $watch -notmatch '-FreshFixtures') { throw 'Interactive Watch must use normal fresh preparation.' }
Write-Output 'Student menu OK: 45 rows, numeric/ID/title input, normal preparation; no Selenium started.'
