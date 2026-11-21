// Additional native edge cases; run after the main integration suite on its TEMP project.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {Workspace}=require('./dist/workspace'),{Bridge}=require('./dist/bridge'),{toCsv}=require('./dist/symbols');
const root=__dirname,project=fs.readFileSync(path.join(root,'project.txt'),'utf8'),bridge=new Bridge(path.join(root,'Step7Bridge.exe'));
const results=[];
async function step(name,fn){await fn();results.push(name);console.log('PASS '+name);fs.writeFileSync(path.join(root,'extra-results.json'),JSON.stringify(results,null,2));}
(async()=>{
 const w=await Workspace.open(project,path.join(root,'extra-'+Date.now()),bridge),program=w.manifest.programs[0].id;
 await step('symbols_empty_table',async()=>{const e=w.manifest.entries.find(e=>e.kind==='symbols');fs.writeFileSync(path.join(w.root,e.file),toCsv([]));await w.apply();const actual=await bridge.read(project);assert.equal(actual.items.find(i=>i.kind==='symbols').content.trim(),'');});
 await step('db_udt_structure_edit',async()=>{
  w.create(program,'DB',930,'awl');w.create(program,'UDT',931,'awl');await w.apply();
  for(const id of ['DB930','UDT931']){const e=w.manifest.entries.find(e=>e.kind==='block'&&e.nativeName===id),file=path.join(w.root,e.file);assert(!e.readOnly);const old=fs.readFileSync(file,'utf8');assert(/END_STRUCT/i.test(old));fs.writeFileSync(file,old.replace(/END_STRUCT/i,'  Extra : DINT;\nEND_STRUCT'));}
  await w.apply();const actual=await bridge.read(project);for(const id of ['DB930','UDT931'])assert.match(actual.items.find(i=>i.kind==='block'&&i.nativeName===id).content,/Extra\s*:\s*DINT/i);
 });
 await step('invalid_ob_is_rejected_without_native_change',async()=>{const before=await bridge.read(project),e=w.create(program,'OB',65535,'scl');await assert.rejects(()=>w.apply(true));const after=await bridge.read(project);assert.deepEqual(after.items.map(i=>[i.id,i.version,i.revision]),before.items.map(i=>[i.id,i.version,i.revision]));w.delete(e.id);});
 await step('unrepresentable_symbol_comment_preserves_native',async()=>{
  const before=await bridge.read(project),e=w.manifest.entries.find(e=>e.kind==='symbols'),file=path.join(w.root,e.file),old=fs.readFileSync(file,'utf8');assert.notEqual(before.encoding,65001,'Test VM must use an ANSI STEP 7 project codepage');
  fs.writeFileSync(file,toCsv([{symbol:'EmojiTest',address:'M 110.0',type:'BOOL',comment:'Unrepresentable: 😀'}]));await assert.rejects(()=>w.apply());const after=await bridge.read(project);assert.deepEqual(after.items.map(i=>[i.id,i.version,i.revision]),before.items.map(i=>[i.id,i.version,i.revision]));fs.writeFileSync(file,old);
 });
 await step('extra_created_objects_removed',async()=>{
  const entries=w.manifest.entries.filter(e=>['DB930','UDT931'].includes(e.nativeName));
  for(const e of entries.filter(e=>e.kind==='source'))w.delete(e.id);await w.apply();for(const e of entries.filter(e=>e.kind==='block'))w.delete(e.id);await w.apply();
  assert(!w.manifest.entries.some(e=>['DB930','UDT931'].includes(e.nativeName)));assert(w.status().every(c=>c.state==='unchanged'));
 });
 console.log('ALL EXTRA NATIVE TESTS PASSED');
})().catch(e=>{console.error(e.stack);fs.writeFileSync(path.join(root,'extra-error.txt'),e.stack);process.exitCode=1;});
