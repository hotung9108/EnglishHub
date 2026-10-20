param([switch]$SelectOnly, [ValidateRange(0, 10000)][int]$DelayMs = 1500)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Join-Path $PSScriptRoot '..')
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host 'Install Node.js 22+ first.'; exit 2 }
if (-not (Test-Path -LiteralPath 'node_modules/selenium-webdriver/package.json')) {
    & npm.cmd ci --no-audit --no-fund --cache .cache/npm
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
$qa30CaseJson = & node --input-type=module -e "import {studentCases} from './tests/student/cases.js'; console.log(JSON.stringify(studentCases.map(({id,title})=>({id,title}))));"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
. (Join-Path $PSScriptRoot 'Student-Menu.ps1')
$qa30Cases = @(Get-QA30MenuCases -Json $qa30CaseJson)
Write-Host 'QA30 WATCH v8 - Chon MOT test case de xem Chrome chay' -ForegroundColor Cyan
Write-Host 'Kiem tra Temp, ket noi staging va Chrome truoc setup.'
Write-Host 'Tao du lieu moi CHI cho case da chon, sau do mo Chrome.'
Write-Host 'Setup co log tien do; khong tao ca bo bai khi chi xem mot case.'
Write-Host ("Delay quan sat: $DelayMs ms truoc moi thao tac. Report tu mo khi xong.")
foreach ($qa30Case in $qa30Cases) { Write-Host ($qa30Case.id + '  ' + $qa30Case.title) }
while ($true) {
    $qa30Choice = (Read-Host 'Nhap ma (7 / 007 / QA30-007) hoac ten day du; Enter de thoat').Trim()
    if (-not $qa30Choice) { exit 0 }
    $qa30Selected = @(Resolve-QA30MenuCase -Cases $qa30Cases -Choice $qa30Choice)
    if ($qa30Selected.Count -eq 1) { break }
    Write-Host 'Khong tim thay case. Nhap lai ma trong danh sach.' -ForegroundColor Yellow
}
Write-Host ('Da chon: ' + $qa30Selected[0].id + ' - ' + $qa30Selected[0].title) -ForegroundColor Green
if ($SelectOnly) { Write-Host 'Selection check only: no setup or Selenium.'; exit 0 }
& (Join-Path $PSScriptRoot 'Run-Student.ps1') -CaseId $qa30Selected[0].id -Watch -FreshFixtures -DelayMs $DelayMs
exit $LASTEXITCODE
