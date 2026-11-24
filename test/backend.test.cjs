const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {windowsPowerShellEnvironment}=require('../dist/processEnvironment');
test('backend_metadata_protects_advanced_and_unknown_attributes',{skip:process.platform!=='win32'},()=>{
 const assembly=path.resolve('backend/bin/Step7Bridge.exe');assert(fs.existsSync(assembly),'Run npm run build:backend first');
 const ps=path.join(process.env.SystemRoot,'SysWOW64/WindowsPowerShell/v1.0/powershell.exe');
 const output=execFileSync(ps,['-NoProfile','-ExecutionPolicy','Bypass','-File',path.resolve('test/backend-metadata.ps1'),'-AssemblyPath',assembly],{encoding:'utf8',timeout:30000,env:windowsPowerShellEnvironment()});
 assert.match(output,/Passed: 7, Failed: 0, Skipped: 0/);
 for(const name of ['metadata_plain','metadata_wincc_reference','metadata_unknown_field','metadata_zero_flag','metadata_deleted_row','metadata_empty_table','metadata_truncated_rejected'])assert(output.includes('PASS '+name),name);
});
