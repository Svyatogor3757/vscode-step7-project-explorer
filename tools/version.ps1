$ProgressPreference='SilentlyContinue'
foreach($file in @('C:/Progra~2/Siemens/Step7/S7BIN/S7tgtopx.exe','C:/Progra~2/Siemens/Step7/s7scl/s7sclapx.exe')) {
 $v=(Get-Item $file).VersionInfo;Write-Output ($v.FileName+' | '+$v.ProductVersion+' | '+$v.FileVersion)
}
