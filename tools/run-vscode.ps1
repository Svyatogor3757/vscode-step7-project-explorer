param([string]$CodePath,[string]$WorkspacePath,[string]$TestsPath,[string]$ExtensionPath,[string]$UserData,[string]$Locale='en')
$ErrorActionPreference='Stop'
$arguments=@('"'+$WorkspacePath+'"','--extensionDevelopmentPath="'+$ExtensionPath+'"','--extensionTestsPath="'+$TestsPath+'"','--user-data-dir="'+$UserData+'"','--extensions-dir="'+(Join-Path $UserData 'extensions')+'"','--locale='+$Locale,'--disable-extensions','--disable-gpu','--skip-welcome','--skip-release-notes','--disable-workspace-trust','--disable-telemetry','--new-window')
$p=Start-Process -FilePath $CodePath -ArgumentList $arguments -WindowStyle Hidden -PassThru -Wait
exit $p.ExitCode
