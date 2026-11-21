$ErrorActionPreference='Stop'
$failed=$false
foreach($file in Get-ChildItem backend,tools -Filter *.ps1 -Recurse) {
 $parseErrors=$null;$tokens=$null
 [void][Management.Automation.Language.Parser]::ParseFile($file.FullName,[ref]$tokens,[ref]$parseErrors)
 if($parseErrors.Count){$failed=$true;Write-Output $file.FullName;$parseErrors|ForEach-Object {Write-Output $_.Message}}
}
if($failed){exit 1};Write-Output 'PowerShell syntax OK'
