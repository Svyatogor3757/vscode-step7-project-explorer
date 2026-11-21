$ErrorActionPreference='Stop';$ProgressPreference='SilentlyContinue'
$s=New-Object -ComObject Simatic.Simatic;$s.UnattendedServerMode=$true
$root=Join-Path $env:TEMP ('SPB-symbols-'+[guid]::NewGuid().ToString('N'));[void](New-Item -ItemType Directory $root)
$p=$s.Projects.Add(('SPB_'+[guid]::NewGuid().ToString('N').Substring(0,8)),$root,1122305);$prg=$p.Programs.Add('SymbolsTest',1327361)
$sym=$prg.SymbolTable;Write-Output ('Symbols='+$sym.Name)
$file=Join-Path $root 'symbols.asc'
$line='126,'+'TagOne'.PadRight(24)+'M 100.0'.PadRight(12)+'BOOL'.PadRight(10)+'Test'.PadRight(80)+"`r`n"
[IO.File]::WriteAllText($file,$line,[Text.Encoding]::ASCII)
Write-Output ('ImportReturn='+$sym.Import($file,1))
$sym.Export((Join-Path $root 'before.asc'))
Write-Output 'Before:';Get-Content (Join-Path $root 'before.asc')
$sym.Remove();Write-Output 'Removed'
$sym=$prg.SymbolTable
Write-Output ('SymbolsAfterRemove='+$sym.Name)
Write-Output ('ImportAfterRemoveReturn='+$sym.Import($file,1))
$sym.Export((Join-Path $root 'after.asc'));Write-Output 'After:';Get-Content (Join-Path $root 'after.asc')
$s.Save();Write-Output ('ROOT='+$root)
