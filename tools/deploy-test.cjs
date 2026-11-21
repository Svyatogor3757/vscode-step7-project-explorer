// Upload only our test artifacts into a new TEMP directory on the VM.
const {spawnSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
function ssh(script){const r=spawnSync('ssh',['-o','BatchMode=yes','vmware-siemens','C:/Windows/SysWOW64/WindowsPowerShell/v1.0/powershell.exe','-NoProfile','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{encoding:'utf8'});if(r.status)throw Error(r.stderr);return r.stdout.trim();}
const remote=ssh("$ProgressPreference='SilentlyContinue';$d=Join-Path $env:TEMP ('Step7Project-'+[guid]::NewGuid().ToString('N'));[void](New-Item -ItemType Directory $d);[Console]::Write($d)");
console.log('REMOTE_TEST_ROOT='+remote);
fs.mkdirSync('.scratch',{recursive:true});fs.writeFileSync('.scratch/remote-root.txt',remote);
const paths=[...fs.readdirSync('backend/bin').filter(f=>(f.endsWith('.dll')&&!f.startsWith('libnodave_'))||f==='Step7Bridge.exe'||f==='Step7Bridge.exe.config').map(f=>'backend/bin/'+f),'backend/Invoke-Bridge.ps1'];
for(const file of paths){if(!fs.existsSync(file))continue;const r=spawnSync('scp',[file,'vmware-siemens:'+remote.replace(/\\/g,'/')+'/'+path.basename(file)],{stdio:'inherit'});if(r.status)process.exit(r.status);}
const script=fs.readFileSync('tools/native-smoke.ps1','utf8').replaceAll('__REMOTE_ROOT__',remote.replace(/'/g,"''"));
fs.writeFileSync('.scratch/native-smoke.ps1',script);
const r=spawnSync('scp',['.scratch/native-smoke.ps1','vmware-siemens:'+remote.replace(/\\/g,'/')+'/smoke.ps1'],{stdio:'inherit'});if(r.status)process.exit(r.status);
console.log(ssh(`$ProgressPreference='SilentlyContinue';& '${remote}/smoke.ps1'`));
