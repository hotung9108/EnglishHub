function Get-QA30MenuCases {
    param([string]$Json)
    $decoded = ConvertFrom-Json -InputObject $Json
    foreach ($entry in $decoded) {
        if (-not $entry.id -or -not $entry.title) { throw 'Invalid student case registry.' }
        [pscustomobject]@{ id = [string]$entry.id; title = [string]$entry.title }
    }
}

function Resolve-QA30MenuCase {
    param([object[]]$Cases, [string]$Choice)
    $choiceText = $Choice.Trim()
    $numeric = [regex]::Match($choiceText, '^(?:QA30-)?([0-9]{1,3})$', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($numeric.Success) {
        $caseId = 'QA30-' + ([int]$numeric.Groups[1].Value).ToString('000')
        foreach ($entry in $Cases) { if ($entry.id -eq $caseId) { $entry } }
    } else {
        foreach ($entry in $Cases) { if ($entry.title -eq $choiceText) { $entry } }
    }
}
