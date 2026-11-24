param([string]$Package='',[string]$Project='Examples/S15-2026/S15-2026.s7p',[switch]$SkipExample)
$ErrorActionPreference='Stop'
if(!$Package) {$Package='releases/step7project-'+(Get-Content 'package.json' -Raw | ConvertFrom-Json).version+'.vsix'}
Add-Type -AssemblyName System.IO.Compression.FileSystem
New-Item -ItemType Directory -Path '.scratch' -Force | Out-Null
$root=Join-Path (Resolve-Path '.scratch') ('package-'+[guid]::NewGuid().ToString('N'))
[IO.Compression.ZipFile]::ExtractToDirectory((Resolve-Path $Package),$root)
$extension=Join-Path $root 'extension'
$paths=@(Get-ChildItem $extension -File -Recurse | ForEach-Object {$_.FullName.Substring($extension.Length+1).Replace('\','/')})
foreach($path in $paths) {
 if($path -match '^(Examples|S-15|S15-2026|\.scratch|\.github|test|tools|src|node_modules|[Rr]eleases)/|^third-party/sources/|^\.gitmodules$|libnodave_|vscodeSmoke|vscodeUpgradeSeed|debug\.log$|\.pdb$|\.map$') {throw ('Unexpected packaged file: '+$path)}
}
$packagedManifest=Get-Content (Join-Path $extension 'package.json') -Raw | ConvertFrom-Json
$sourceManifest=Get-Content 'package.json' -Raw | ConvertFrom-Json
if($packagedManifest.version -ne $sourceManifest.version -or $packagedManifest.name -ne $sourceManifest.name -or $packagedManifest.publisher -ne $sourceManifest.publisher) {throw 'Packaged identity differs from the source manifest'}
foreach($legal in @('LICENSE','AUTHORS.md','THIRD-PARTY-NOTICES.md','third-party/inventory.json','README.md','README.ru.md','CHANGELOG.md','CHANGELOG.ru.md')) {
 $packaged=Join-Path $extension $legal
 # VSCE packages the root LICENSE as LICENSE.txt; old fixtures use LICENSE.
 if($legal -eq 'LICENSE' -and !(Test-Path -LiteralPath $packaged)) {$packaged=Join-Path $extension 'LICENSE.txt'}
 if(!(Test-Path -LiteralPath $packaged)) {throw ('Missing packaged legal/documentation file: '+$legal)}
 if((Get-FileHash -LiteralPath $packaged -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $legal -Algorithm SHA256).Hash) {throw ('Packaged file differs from source: '+$legal)}
}
$inventory=Get-Content (Join-Path $extension 'third-party/inventory.json') -Raw | ConvertFrom-Json
$knownDlls=@($inventory.nuget | ForEach-Object { $_.shippedFiles } | ForEach-Object { $_.path })
foreach($file in $paths) {if($file -match '\.dll$' -and $file -notin $knownDlls) {throw ('Uninventoried packaged DLL: '+$file)}}
foreach($component in $inventory.nuget) {
 foreach($record in @($component.shippedFiles)+@($component.notices)) {
  $file=Join-Path $extension $record.path
  if(!(Test-Path -LiteralPath $file)) {throw ('Missing inventoried file: '+$record.path)}
  if((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant() -ne $record.sha256) {throw ('Inventoried file hash differs: '+$record.path)}
 }
}
foreach($record in $inventory.generatedCodeNotices) {
 $file=Join-Path $extension $record.path
 if(!(Test-Path -LiteralPath $file) -or (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant() -ne $record.sha256) {throw ('Generated-code notice differs: '+$record.path)}
}
Write-Output 'PASS packaged_manifest_and_license_inventory'
foreach($required in @('dist/extension.js','dist/cli.js','dist/projectViews.js','dist/navigation.js','dist/localization.js','package.nls.json','package.nls.ru.json','language/catalog.cjs','language/interface_en_us.json','language/interface_ru_ru.json','bin/step7project.cjs','backend/bin/Step7Bridge.exe','backend/Invoke-Bridge.ps1','docs/AGENT-USAGE.md','docs/BACKEND.md','docs/VERIFICATION.md','AGENTS.md','THIRD-PARTY-NOTICES.md','third-party/Toolbox.LICENSE.txt')) {
 if(!(Test-Path (Join-Path $extension $required))) {throw ('Missing packaged file: '+$required)}
}
$cli=Join-Path $extension 'bin/step7project.cjs'
$output=& node $cli doctor --json
if($LASTEXITCODE -ne 0) {throw 'Packaged doctor failed'}
$doctor=$output|ConvertFrom-Json
if(!$doctor.windows -or !$doctor.x86) {throw 'Unexpected backend architecture'}
Write-Output 'PASS packaged_backend_doctor'
if($SkipExample) {
 Write-Output 'SKIP user_example_offline_export: explicitly omitted; no STEP 7/PLC compatibility claim'
 Write-Output ('PACKAGE_TEST_ROOT='+$root)
 return
}
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
