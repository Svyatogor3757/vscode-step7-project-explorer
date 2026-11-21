// Development-only SSH runner. Remote script is encoded, never shell-interpolated.
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const script=fs.readFileSync(process.argv[2],'utf8');
const r=spawnSync('ssh',['-o','BatchMode=yes','vmware-siemens','C:/Windows/SysWOW64/WindowsPowerShell/v1.0/powershell.exe','-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{stdio:'inherit'});
process.exit(r.status??1);
