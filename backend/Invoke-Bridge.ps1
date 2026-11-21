param([Parameter(Mandatory=$true)][string]$BridgePath)
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
[Console]::InputEncoding=New-Object Text.UTF8Encoding($false)
[Console]::OutputEncoding=New-Object Text.UTF8Encoding($false)
$request=[Console]::In.ReadToEnd()
$root=Join-Path $env:TEMP ('SPB-RPC-'+[guid]::NewGuid().ToString('N'))
[void](New-Item -ItemType Directory -Path $root)
$inputFile=Join-Path $root 'request.json'
$outputFile=Join-Path $root 'response.json'
[IO.File]::WriteAllText($inputFile,$request,(New-Object Text.UTF8Encoding($false)))
$taskName='Step7Project-'+[guid]::NewGuid().ToString('N')
$registered=$false
try {
 if([Diagnostics.Process]::GetCurrentProcess().SessionId -eq 0) {
  # STEP 7 editors are out-of-process COM servers and need the user's desktop.
  $identity=[Security.Principal.WindowsIdentity]::GetCurrent().Name
  $principal=New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
  $arguments='"{0}" "{1}"' -f $inputFile,$outputFile
  $launch="Start-Process -FilePath '{0}' -ArgumentList '{1}' -WindowStyle Hidden -Wait" -f $BridgePath.Replace("'","''"),$arguments.Replace("'","''")
  $encoded=[Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($launch))
  $action=New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-NoProfile -WindowStyle Hidden -EncodedCommand '+$encoded)
  $settings=New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  [void](Register-ScheduledTask -TaskName $taskName -Action $action -Principal $principal -Settings $settings)
  $registered=$true
  Start-ScheduledTask -TaskName $taskName
  $started=[DateTime]::UtcNow
  while(!(Test-Path -LiteralPath $outputFile)) {
   Start-Sleep -Milliseconds 200
   $info=Get-ScheduledTaskInfo -TaskName $taskName
   if(([DateTime]::UtcNow-$started).TotalSeconds -gt 5 -and (Get-ScheduledTask -TaskName $taskName).State -ne 'Running') {
    throw ('STEP 7 desktop bridge did not produce a response. Sign into Windows with the same account as Remote SSH. Task result: '+$info.LastTaskResult+'. Request: '+$root)
   }
  }
 } else {
  $proc=Start-Process -FilePath $BridgePath -ArgumentList ('"'+$inputFile+'" "'+$outputFile+'"') -WindowStyle Hidden -PassThru -Wait
  if(!(Test-Path -LiteralPath $outputFile)) {throw ('Bridge exited without response: '+$proc.ExitCode+'. Request: '+$root)}
 }
 $result=[IO.File]::ReadAllText($outputFile)|ConvertFrom-Json
 [Console]::Out.Write($result.stdout)
 [Console]::Error.Write($result.stderr)
 exit [int]$result.exitCode
} catch {
 [Console]::Error.WriteLine($_.Exception.Message)
 exit 1
} finally {
 if($registered) {
  for($cleanupAttempt=0;$cleanupAttempt -lt 25 -and (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue).State -eq 'Running';$cleanupAttempt++) {Start-Sleep -Milliseconds 100}
  if((Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue).State -ne 'Running') {Unregister-ScheduledTask -TaskName $taskName -Confirm:$false}
 }
}
