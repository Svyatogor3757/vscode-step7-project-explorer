param([string]$Package='',[string]$Project='Examples/S15-2026/S15-2026.s7p')
$ErrorActionPreference='Stop'
if(!$Package) {$Package='step7project-'+(Get-Content 'package.json' -Raw | ConvertFrom-Json).version+'.vsix'}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root=Join-Path (Resolve-Path '.scratch') ('package-'+[guid]::NewGuid().ToString('N'))
[IO.Compression.ZipFile]::ExtractToDirectory((Resolve-Path $Package),$root)
$extension=Join-Path $root 'extension'
$paths=@(Get-ChildItem $extension -File -Recurse | ForEach-Object {$_.FullName.Substring($extension.Length+1).Replace('\','/')})
foreach($path in $paths) {
 if($path -match '^(Examples|S-15|S15-2026|\.scratch|test|tools|src|node_modules)/|libnodave_|vscodeSmoke|debug\.log$|\.pdb$|\.map$') {throw ('Unexpected packaged file: '+$path)}
}
foreach($required in @('dist/extension.js','dist/cli.js','dist/projectViews.js','package.nls.json','package.nls.ru.json','l10n/bundle.l10n.ru.json','bin/step7project.cjs','backend/bin/Step7Bridge.exe','backend/Invoke-Bridge.ps1','docs/AGENT-USAGE.md','docs/BACKEND.md','docs/VERIFICATION.md','AGENTS.md','THIRD-PARTY-NOTICES.md','third-party/Toolbox.LICENSE.txt')) {
 if(!(Test-Path (Join-Path $extension $required))) {throw ('Missing packaged file: '+$required)}
}
$cli=Join-Path $extension 'bin/step7project.cjs'
$output=& node $cli doctor --json
if($LASTEXITCODE -ne 0) {throw 'Packaged doctor failed'}
$doctor=$output|ConvertFrom-Json
if(!$doctor.windows -or !$doctor.x86) {throw 'Unexpected backend architecture'}
$workspace=Join-Path $root 'code'
& node $cli export --project (Resolve-Path $Project) --workspace $workspace --json
if($LASTEXITCODE -ne 0) {throw 'Packaged offline export failed'}
$status=(& node $cli status --workspace $workspace --json)|ConvertFrom-Json
if($LASTEXITCODE -ne 0) {throw 'Packaged status failed'}
if(@($status.programs).Count -ne 2 -or @($status.changes).Count -ne 112) {throw 'Unexpected example inventory'}
if(@($status.changes | Where-Object state -ne 'unchanged').Count -ne 0) {throw 'Fresh export has changes'}
if($status.project -ne (Resolve-Path $Project).Path) {throw 'Relative binding resolved to a wrong native project'}
$manifest=Get-Content (Join-Path $workspace 'step7project.json') -Raw | ConvertFrom-Json
if($manifest.schema -ne 2 -or $manifest.projectPathMode -ne 'relative' -or [IO.Path]::IsPathRooted($manifest.project)) {throw 'Expected portable relative project reference in schema 2'}
foreach($file in @('AGENTS.md','step7project.cmd','step7project.json')) {if(!(Test-Path (Join-Path $workspace $file))) {throw ('Missing generated '+$file)}}
Write-Output ('PASS packaged_cli_offline_export: 2 programs, 112 objects; '+$paths.Count+' packaged files')
Write-Output ('PACKAGE_TEST_ROOT='+$root)
