const test=require('node:test'),assert=require('node:assert/strict');
const {windowsPowerShellEnvironment}=require('../dist/processEnvironment');
test('legacy_powershell_environment_removes_module_paths_without_mutating_parent',()=>{
 const environment={PSModulePath:'core-only',psmodulepath:'other-core-path',Path:'C:/Windows',STEP7PROJECT_BACKEND:'D:/Bridge.exe',EMPTY:''};
 assert.deepEqual(windowsPowerShellEnvironment(environment),{Path:'C:/Windows',STEP7PROJECT_BACKEND:'D:/Bridge.exe',EMPTY:''});
 assert.equal(environment.PSModulePath,'core-only');assert.equal(environment.psmodulepath,'other-core-path');
 assert.deepEqual(windowsPowerShellEnvironment({Path:'unchanged'}),{Path:'unchanged'});
});
test('bridge_sanitizes_only_legacy_powershell_children',{skip:process.platform!=='win32'},async t=>{
 const cp=require('node:child_process'),{EventEmitter}=require('node:events'),{PassThrough,Writable}=require('node:stream'),{Bridge}=require('../dist/bridge'),calls=[];
 const previous=process.env.PSModulePath;process.env.PSModulePath='core-only-fixture';t.after(()=>{if(previous===undefined)delete process.env.PSModulePath;else process.env.PSModulePath=previous;});
 t.mock.method(cp,'spawn',(executable,args,options)=>{
  const child=new EventEmitter(),call={executable,args,options,request:''};calls.push(call);child.stdout=new PassThrough();child.stderr=new PassThrough();
  child.stdin=new Writable({write(chunk,encoding,done){call.request+=chunk.toString();done();},final(done){done();queueMicrotask(()=>{child.stdout.write('{"ok":true}');child.emit('close',0);});}});return child;
 });
 const bridge=new Bridge('fixture-bridge.exe','german');assert.deepEqual(await bridge.request({command:'stage',project:'fixture'}),{ok:true});assert.equal(calls[0].executable,'powershell.exe');assert(calls[0].args.includes('fixture-bridge.exe'));assert.equal(Object.keys(calls[0].options.env).some(key=>key.toUpperCase()==='PSMODULEPATH'),false);assert.equal(process.env.PSModulePath,'core-only-fixture');assert.equal(JSON.parse(calls[0].request).mnemonics,'german');
 assert.deepEqual(await bridge.request({command:'doctor'}),{ok:true});assert.equal(calls[1].executable,'fixture-bridge.exe');assert.equal(calls[1].options.env,process.env);
});
