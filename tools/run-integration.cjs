const fs=require('node:fs'),{spawnSync}=require('node:child_process');
const root=fs.readFileSync('.scratch/remote-root.txt','utf8'),remote=root.replace(/\\/g,'/');
function run(exe,args){const r=spawnSync(exe,args,{stdio:'inherit'});if(r.status)process.exit(r.status||1);}
const prepare=`$ProgressPreference='SilentlyContinue';[void](New-Item -Force -ItemType Directory '${root}/dist')`;
run('ssh',['vmware-siemens','powershell','-NoProfile','-EncodedCommand',Buffer.from(prepare,'utf16le').toString('base64')]);
for(const file of fs.readdirSync('dist').filter(f=>f.endsWith('.js')))run('scp',['dist/'+file,'vmware-siemens:'+remote+'/dist/'+file]);
const script=process.argv.includes('--awl')?'vm-awl-logic.cjs':process.argv.includes('--extra')?'vm-extra.cjs':'vm-integration.cjs';
run('scp',['tools/'+script,'vmware-siemens:'+remote+'/integration.cjs']);
run('scp',['C:/Program Files/nodejs/node.exe','vmware-siemens:'+remote+'/node.exe']);
run('scp',['backend/Invoke-Bridge.ps1','vmware-siemens:'+remote+'/Invoke-Bridge.ps1']);
run('scp',['backend/bin/Step7Bridge.exe','vmware-siemens:'+remote+'/Step7Bridge.exe']);
for(const file of fs.readdirSync('backend/bin').filter(f=>f.endsWith('.dll')&&!f.startsWith('libnodave_')))run('scp',['backend/bin/'+file,'vmware-siemens:'+remote+'/'+file]);
run('scp',['backend/bin/Step7Bridge.exe.config','vmware-siemens:'+remote+'/Step7Bridge.exe.config']);
// Runtime expects the wrapper under backend/ relative to dist/.
const ps=`$ProgressPreference='SilentlyContinue';[void](New-Item -Force -ItemType Directory '${root}/backend');Copy-Item '${root}/Invoke-Bridge.ps1' '${root}/backend/Invoke-Bridge.ps1'; & '${root}/node.exe' '${root}/integration.cjs';exit $LASTEXITCODE`;
run('ssh',['vmware-siemens','powershell','-NoProfile','-EncodedCommand',Buffer.from(ps,'utf16le').toString('base64')]);
