$ProgressPreference='SilentlyContinue'
Get-ScheduledTask | Where-Object {$_.TaskName -like 'Step7Project-*'} | Select-Object TaskName,State | Format-Table | Out-String | Write-Output
Get-Process | Where-Object {$_.Name -match 's7|Step7Bridge'} | Select-Object Id,ProcessName,SessionId,MainWindowTitle | Format-Table -AutoSize | Out-String -Width 240 | Write-Output
Get-ChildItem $env:TEMP -Directory -Filter SPB* | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object {Write-Output $_.FullName;Get-ChildItem $_.FullName -Include *.log,compile-results.txt -Recurse | ForEach-Object {Get-Content $_.FullName -Tail 15}}
