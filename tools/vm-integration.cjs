// Runs on vmware-siemens inside the TEMP deployment; exercises production Workspace + Bridge.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {Workspace}=require('./dist/workspace'),{Bridge}=require('./dist/bridge'),{toCsv}=require('./dist/symbols');
const root=__dirname,project=fs.readFileSync(path.join(root,'project.txt'),'utf8');
const bridge=new Bridge(path.join(root,'Step7Bridge.exe'));
const results=[];
async function step(name,fn){await fn();results.push(name);console.log('PASS '+name);fs.writeFileSync(path.join(root,'integration-results.json'),JSON.stringify(results,null,2));}
(async()=>{
 const w=await Workspace.open(project,path.join(root,'code-'+Date.now()),bridge);const program=w.manifest.programs[0].id;
 await step('export_and_read_existing_fc',async()=>{assert(w.manifest.entries.some(e=>e.nativeName==='FC901'));assert.equal(w.status().filter(c=>c.state!=='unchanged').length,0);});
 await step('scl_create_fc_fb_ob_db_udt',async()=>{
  for(const [t,n] of [['FC',910],['FB',911],['OB',100],['UDT',912],['DB',913]])w.create(program,t,n,'scl');
  const result=await w.apply();assert.equal(result.applied,5);
  for(const id of ['FC910','FB911','OB100','UDT912','DB913'])assert(w.manifest.entries.some(e=>e.kind==='block'&&e.nativeName===id),id);
 });
 await step('instance_db',async()=>{w.create(program,'DB',914,'scl','FB 911');await w.apply();assert(w.manifest.entries.some(e=>e.nativeName==='DB914'&&e.kind==='block'));});
 await step('modify_scl_source',async()=>{const e=w.manifest.entries.find(e=>e.kind==='source'&&e.nativeName==='FC910');const file=path.join(w.root,e.file);fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('scratchValue := 0','scratchValue := 12'));await w.apply();assert(fs.readFileSync(file,'utf8').includes('scratchValue := 12'));});
 await step('symbols_create_edit_delete',async()=>{
  const e=w.manifest.entries.find(e=>e.kind==='symbols');assert(e,'symbol table');const file=path.join(w.root,e.file);
  fs.writeFileSync(file,toCsv([{symbol:'TestTag',address:'M 100.0',type:'BOOL',comment:'Test comment'},{symbol:'RemoveMe',address:'MW 102',type:'INT',comment:''}]));await w.apply();
  fs.writeFileSync(file,toCsv([{symbol:'TestTag',address:'M 101.0',type:'BOOL',comment:'Changed'}]));await w.apply();assert.equal(w.status().filter(c=>c.state!=='unchanged').length,0);
 });
 await step('direct_awl_block_edit',async()=>{const e=w.manifest.entries.find(e=>e.kind==='block'&&e.nativeName==='FC901');assert(!e.readOnly);const file=path.join(w.root,e.file);fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/NOP\s+0\s*;/i,'SET;\nCLR;'));await w.apply();});
 await step('compile_error_leaves_original_unchanged',async()=>{
  const before=await bridge.read(project),e=w.manifest.entries.find(e=>e.kind==='source'&&e.nativeName==='FC910'),file=path.join(w.root,e.file),text=fs.readFileSync(file,'utf8');fs.writeFileSync(file,text.replace('scratchValue := 12','THIS IS INVALID'));
  await assert.rejects(()=>w.apply());const after=await bridge.read(project);assert.deepEqual(after.items.map(i=>[i.id,i.version]),before.items.map(i=>[i.id,i.version]));fs.writeFileSync(file,text);
 });
 await step('rename_source',async()=>{const e=w.manifest.entries.find(e=>e.kind==='source'&&e.nativeName==='FC910');w.rename(e.id,'RenamedFC');await w.apply();assert(w.manifest.entries.some(e=>e.kind==='source'&&e.nativeName==='RenamedFC'));});
 await step('delete_created_objects',async()=>{
  for(const e of [...w.manifest.entries])if(['FC910','FB911','OB100','UDT912','DB913','DB914','RenamedFC'].includes(e.nativeName))w.delete(e.id);
  // Sources and blocks are separate operations by design.
  const sourceEntries=w.manifest.entries.filter(e=>e.pending==='delete'&&e.kind==='source');
  const blockEntries=w.manifest.entries.filter(e=>e.pending==='delete'&&e.kind==='block');for(const e of blockEntries)delete e.pending;w.save();await w.apply();
  for(const e of blockEntries)w.delete(e.id);await w.apply();assert(!w.manifest.entries.some(e=>['FC910','FB911','OB100','UDT912','DB913','DB914'].includes(e.nativeName)));
 });
 console.log('ALL NATIVE INTEGRATION TESTS PASSED');
})().catch(e=>{console.error(e.stack);fs.writeFileSync(path.join(root,'integration-error.txt'),e.stack);process.exitCode=1;});
