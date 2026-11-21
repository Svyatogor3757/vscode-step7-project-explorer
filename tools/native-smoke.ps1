$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$root='__REMOTE_ROOT__'
$s=New-Object -ComObject Simatic.Simatic
$s.UnattendedServerMode=$true
$p=$s.Projects.Add(('SPB_'+[guid]::NewGuid().ToString('N').Substring(0,8)),$root,1122305)
$prg=$p.Programs.Add('TestProgram',1327361)
$s.Save()
$native=(Get-ChildItem $p.LogPath -Filter *.s7p).FullName
[IO.File]::WriteAllText((Join-Path $root 'project.txt'),$native)
$programId=$prg.LogPath.Substring($prg.LogPath.IndexOf('\')+1)
[IO.File]::WriteAllText((Join-Path $root 'program.txt'),$programId)
Write-Output ('Native='+$native+' Program='+$programId)
$request=@{command='execute';project=$native;operations=@(@{program=$programId;kind='source';name='TestFC';nativeName='TestFC';blockType='awl';action='create';content="FUNCTION FC 901 : VOID`r`nBEGIN`r`nNOP 0;`r`nEND_FUNCTION`r`n"})}|ConvertTo-Json -Depth 10 -Compress
$request | & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root 'Invoke-Bridge.ps1') -BridgePath (Join-Path $root 'Step7Bridge.exe')
if($LASTEXITCODE -ne 0){throw 'Bridge execute failed'}
$read=@{command='read';project=$native}|ConvertTo-Json -Compress
$json=$read | & (Join-Path $root 'Step7Bridge.exe')
$snapshot=$json|ConvertFrom-Json
Write-Output ('Sources='+@($snapshot.items|Where-Object {$_.kind -eq 'source'}).Count+' Blocks='+@($snapshot.items|Where-Object {$_.kind -eq 'block'}).Count)
[IO.File]::WriteAllText((Join-Path $root 'snapshot.json'),$json)
