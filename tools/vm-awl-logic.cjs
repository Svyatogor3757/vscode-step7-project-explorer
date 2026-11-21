const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {Workspace}=require('./dist/workspace'),{Bridge}=require('./dist/bridge');
(async()=>{
 const project=fs.readFileSync(path.join(__dirname,'project.txt'),'utf8'),bridge=new Bridge(path.join(__dirname,'Step7Bridge.exe'));
 const w=await Workspace.open(project,path.join(__dirname,'awl-logic-'+Date.now()),bridge),program=w.manifest.programs[0].id;
 const source=w.create(program,'FC',940,'awl');
 fs.writeFileSync(path.join(w.root,source.file),'FUNCTION FC 940 : VOID\nBEGIN\n A M 100.0;\n = M 100.1;\nEND_FUNCTION\n');await w.apply();
 const block=w.manifest.entries.find(e=>e.kind==='block'&&e.nativeName==='FC940'),file=path.join(w.root,block.file),old=fs.readFileSync(file,'utf8');
 assert.match(old,/100\.1/);fs.writeFileSync(file,old.replace(/100\.1/g,'100.2'));await w.apply();
 const actual=await bridge.read(project);assert.match(actual.items.find(i=>i.kind==='block'&&i.nativeName==='FC940').content,/100\.2/);
 w.delete(source.id);await w.apply();w.delete(block.id);await w.apply();assert(!w.manifest.entries.some(e=>e.nativeName==='FC940'));
 fs.writeFileSync(path.join(__dirname,'awl-logic-results.json'),JSON.stringify({passed:['awl_boolean_logic_round_trip']},null,2));console.log('PASS awl_boolean_logic_round_trip');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
