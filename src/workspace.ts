import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {Backend,Manifest,Snapshot,Entry,NativeItem,Operation,BackupMode,Mnemonics} from './model';
import {atomic,inside,safeName,hash,readText,copyProject,contains} from './storage';
import {parseAsc,toCsv,parseCsv,toAsc} from './symbols';
import {Backups} from './backups';
import {intervals} from './backups';
import {agentGuide,launcher} from './guidance';
export interface Change {entry:Entry;state:'modified'|'new'|'delete'|'missing'|'readOnly'|'unchanged'}
export class Workspace {
  manifest:Manifest;
  constructor(readonly root:string,readonly backend:Backend){
    this.root=path.resolve(root);this.manifest=JSON.parse(readText(path.join(root,'step7project.json')));
    if(this.manifest.schema!==1)throw Error('Unsupported workspace schema');
    if(!Object.hasOwn(intervals,this.manifest.backupMode))throw Error('Invalid backup mode in workspace manifest');
    const mnemonics=this.manifest.awlMnemonics||'english';if(!['english','german'].includes(mnemonics))throw Error('Invalid AWL mnemonics in workspace manifest');
    this.backend=backend.withMnemonics?.(mnemonics)||backend;
    for(const e of this.manifest.entries){inside(root,e.file);inside(root,'.step7project/base/'+hash(e.id));}
    if(new Set(this.manifest.entries.map(e=>e.file.toLowerCase())).size!==this.manifest.entries.length)throw Error('Duplicate managed paths');
  }
  static async open(project:string,root:string,backend:Backend,format:'csv'|'asc'='csv',mode:BackupMode='everySave',mnemonics:Mnemonics='english'){
    project=path.resolve(project);root=path.resolve(root);
    if(contains(path.dirname(project),root))throw Error('Choose an editing workspace outside the native project folder');
    if(fs.existsSync(path.join(root,'step7project.json')))throw Error('Workspace is already initialized. Use refresh.');
    if(fs.existsSync(path.join(root,'Programs'))||fs.existsSync(path.join(root,'.step7project')))throw Error('Choose a clean editing workspace; managed files already exist');
    const snapshot=await (backend.withMnemonics?.(mnemonics)||backend).read(project);
    const manifest:Manifest={schema:1,project,projectName:snapshot.name,encoding:snapshot.encoding,programs:snapshot.programs,entries:[],symbolsFormat:format,backupMode:mode,awlMnemonics:mnemonics};
    fs.mkdirSync(root,{recursive:true});atomic(path.join(root,'step7project.json'),JSON.stringify(manifest,null,2));
    const w=new Workspace(root,backend);w.merge(snapshot);new Backups(root,w.manifest).observe(Date.now(),true);
    // Project-owned guidance; never overwrite an existing user's AGENTS.md.
    if(!fs.existsSync(path.join(root,'AGENTS.md')))atomic(path.join(root,'AGENTS.md'),agentGuide());
    if(!fs.existsSync(path.join(root,'step7project.cmd')))atomic(path.join(root,'step7project.cmd'),launcher());
    return w;
  }
  save(){atomic(path.join(this.root,'step7project.json'),JSON.stringify(this.manifest,null,2)+'\n');}
  base(e:Entry){return inside(this.root,'.step7project/base/'+hash(e.id));}
  content(i:NativeItem){return i.kind==='symbols'&&this.manifest.symbolsFormat==='csv'?toCsv(parseAsc(i.content),false):i.content;}
  private makeEntry(i:NativeItem):Entry {
    const prg=this.manifest.programs.find(p=>p.id===i.program);if(!prg)throw Error('Unknown program '+i.program);
    const base=['Programs',...prg.path.map(safeName)].join('/');
    const name=safeName(i.kind==='block'?i.nativeName+(i.name&&i.name!==i.nativeName?'.'+i.name:''):i.name);
    const ext=i.kind==='symbols'?`.symbols.${this.manifest.symbolsFormat}`:i.kind==='block'?'.awl':'.'+(i.language||'txt').toLowerCase();
    const folder=i.kind==='source'?'Sources':i.kind==='symbols'?'Symbols':'Blocks/'+safeName(i.blockType);
    let file=`${base}/${folder}/${name}${ext}`;
    if(this.manifest.entries.some(e=>e.file.toLowerCase()===file.toLowerCase()))file=`${base}/${folder}/${name}.${hash(i.id).slice(0,8)}${ext}`;
    const {content,...rest}=i;return {...rest,file,baseHash:hash(this.content(i))};
  }
  merge(snapshot:Snapshot){
    this.manifest.programs=snapshot.programs;
    for(const i of snapshot.items){
      let e=this.manifest.entries.find(x=>x.id===i.id);
      if(e){if(e.pending||!fs.existsSync(inside(this.root,e.file))||hash(fs.readFileSync(inside(this.root,e.file)))!==e.baseHash)continue;}
      else {e=this.makeEntry(i);this.manifest.entries.push(e);}
      const text=this.content(i);atomic(inside(this.root,e.file),text);atomic(this.base(e),text);
      Object.assign(e,{name:i.name,language:i.language,baseHash:hash(text),version:i.version,revision:i.revision,readOnly:i.readOnly,canDelete:i.canDelete,reason:i.reason});
      if(e.readOnly)fs.chmodSync(inside(this.root,e.file),0o444);
    }
    // External deletions remove only untouched local representations.
    this.manifest.entries=this.manifest.entries.filter(e=>{
      if(snapshot.items.some(i=>i.id===e.id)||e.pending)return true;
      const file=inside(this.root,e.file);if(fs.existsSync(file)&&hash(fs.readFileSync(file))!==e.baseHash)return true;
      if(fs.existsSync(file)){fs.chmodSync(file,0o666);fs.unlinkSync(file);}return false;
    });this.save();
  }
  status():Change[]{return this.manifest.entries.map(entry=>{
    const file=inside(this.root,entry.file);
    let state:Change['state']=entry.pending==='delete'?'delete':!fs.existsSync(file)?'missing':entry.pending==='create'?'new':hash(fs.readFileSync(file))!==entry.baseHash||entry.renamed?'modified':'unchanged';
    if(entry.readOnly&&state!=='unchanged'&&!(state==='delete'&&entry.canDelete))state='readOnly';return {entry,state};
  });}
  entry(id:string){const e=this.manifest.entries.find(e=>e.id===id||e.file===id);if(!e)throw Error('Unknown object: '+id);return e;}
  delete(id:string){const e=this.entry(id);if(e.readOnly&&!e.canDelete)throw Error(e.reason||'Read-only object');if(e.kind==='symbols')throw Error('Clear symbol rows in the table instead of deleting the symbol table');if(e.pending==='create'){new Backups(this.root,this.manifest).observe(Date.now(),true);const file=inside(this.root,e.file);if(fs.existsSync(file))fs.unlinkSync(file);this.manifest.entries=this.manifest.entries.filter(x=>x!==e);}else e.pending='delete';this.save();}
  rename(id:string,name:string){const e=this.entry(id);if(e.kind!=='source'||e.readOnly)throw Error('Only writable source names can be renamed; block numbers require a new block');if(!name.trim()||/[\\/\x00-\x1f]/.test(name))throw Error('Invalid source name');if(this.manifest.entries.some(x=>x.program===e.program&&x.kind==='source'&&(x.renamed||x.nativeName).toLowerCase()===name.toLowerCase()))throw Error('Source name already exists');e.renamed=name;this.save();}
  create(program:string,type:string,number:number,language:'scl'|'awl'='scl',instanceOf?:string):Entry {
    if(!this.manifest.programs.some(p=>p.id===program))throw Error('Unknown program');
    type=type.toUpperCase();if(!['OB','FC','FB','DB','UDT'].includes(type)||!Number.isInteger(number)||number<1||number>65535)throw Error('Invalid block type or number');
    if(instanceOf&&type!=='DB')throw Error('Only DB can be an instance block');
    const name=type+number;if(this.manifest.entries.some(e=>e.program===program&&(e.nativeName===name||e.name===name)))throw Error('Block number is already used');
    const source=template(type,number,language,instanceOf);
    const native:NativeItem={id:program+'|source|'+name,program,kind:'source',name,nativeName:name,blockType:language,language,content:source,version:'',readOnly:false};
    const entry=this.makeEntry(native);entry.pending='create';this.manifest.entries.push(entry);atomic(inside(this.root,entry.file),source);this.save();return entry;
  }
  operations(selection?:string[]):Operation[]{
    const selected=selection?new Set(selection.map(id=>this.entry(id).id)):undefined;
    const changes=this.status().filter(c=>c.state!=='unchanged'&&(!selected||selected.has(c.entry.id)));
    for(const c of changes)if(['missing','readOnly'].includes(c.state))throw Error(`${c.entry.file}: ${c.state}. Restore the file or explicitly mark a writable object for deletion.`);
    const ops=changes.map(({entry:e,state})=>{
      let content=state==='delete'?'':readText(inside(this.root,e.file));
      if(e.kind==='symbols')content=this.manifest.symbolsFormat==='csv'?toAsc(parseCsv(content)):toAsc(parseAsc(content));
      if(!content.trim()&&state!=='delete'&&e.kind!=='symbols')throw Error('Empty source: '+e.file);
      return {program:e.program,kind:e.kind,name:e.kind==='block'?e.nativeName:e.renamed||e.name,nativeName:e.nativeName,blockType:e.kind==='source'?e.language:e.blockType,content,action:state==='delete'?'delete':state==='new'?'create':'update'} as Operation;
    });
    const changedPrograms=new Set(ops.filter(o=>o.kind==='source').map(o=>o.program));
    if(ops.some(o=>o.kind==='block'&&changedPrograms.has(o.program)))throw Error('Apply source changes and direct block changes separately to avoid conflicting compiler outputs');
    return ops.sort((a,b)=>(a.kind==='symbols'?-1:b.kind==='symbols'?1:0));
  }
  async check(selection?:string[]):Promise<{operations:Operation[];snapshot:Snapshot}>{
    if(this.manifest.recovery)throw Error('Previous apply has unresolved recovery state: '+this.manifest.recovery.directory);
    const operations=this.operations(selection),snapshot=await this.backend.read(this.manifest.project);
    // A source can overwrite several blocks: check the entire program, including newly added objects.
    const programs=new Set(operations.map(o=>o.program));
    const expected=this.manifest.entries.filter(e=>programs.has(e.program)&&e.pending!=='create');
    if(snapshot.items.filter(i=>programs.has(i.program)).length!==expected.length)throw Error('Native project changed: object inventory differs. Refresh and review.');
    for(const e of expected){const current=snapshot.items.find(i=>i.id===e.id);if(!current||current.version!==e.version||current.readOnly!==e.readOnly||(e.revision&&current.revision!==e.revision))throw Error('Native conflict: '+e.file);}
    return {operations,snapshot};
  }
  async apply(dryRun=false,selection?:string[]):Promise<unknown>{
    return this.lock(async()=>{
      const {operations}=await this.check(selection);if(!operations.length)return {applied:0};
      const submitted=JSON.stringify(operations);
      new Backups(this.root,this.manifest).observe(Date.now(),true);
      const temp=fs.mkdtempSync(path.join(os.tmpdir(),'SPB-stage-')),stage=path.join(temp,'project');
      const originalDir=path.dirname(this.manifest.project);
      copyProject(originalDir,stage);
      const stagedResult=await this.backend.stage(this.manifest.project,operations);
      const staged=stagedResult.snapshot;
      this.verify(staged,operations);
      if(dryRun)return {checked:operations.length,stage:stagedResult.project};
      if(JSON.stringify(this.operations(selection))!==submitted)throw Error('Working files changed during staging. Review and apply again.');
      await this.check(selection);
      const backup=new Backups(this.root,this.manifest).project();
      // An interrupted native call must leave a durable barrier, even with backups disabled.
      this.manifest.recovery={directory:backup||stage,message:'Apply in progress; native state must be inspected before retry'};this.save();
      await this.backend.execute(this.manifest.project,operations);
      const actual=await this.backend.read(this.manifest.project);this.verify(actual,operations);
      if(JSON.stringify(this.operations(selection))!==submitted)throw Error('Working files changed during native apply. Native result is available; local edits preserved. Inspect recovery state.');
      // Compare affected program output with the successful staged compile.
      const affected=new Set(operations.map(o=>o.program));
      const signatures=(s:Snapshot)=>s.items.filter(i=>affected.has(i.program)).map(i=>i.id+'|'+i.version).sort();
      if(JSON.stringify(signatures(actual))!==JSON.stringify(signatures(staged)))throw Error('Native re-export differs from staged result; inspect recovery snapshot');
      const changed=this.status().filter(c=>c.state!=='unchanged'&&operations.some(o=>o.program===c.entry.program&&o.kind===c.entry.kind&&o.nativeName===c.entry.nativeName));
      for(const {entry:e} of changed){
        if(e.pending==='delete'||e.renamed){this.manifest.entries=this.manifest.entries.filter(x=>x!==e);const file=inside(this.root,e.file);if(fs.existsSync(file)){fs.chmodSync(file,0o666);fs.unlinkSync(file);}continue;}
        delete e.pending;
        // Mark current file as the baseline only after both native verification steps passed.
        e.baseHash=hash(fs.readFileSync(inside(this.root,e.file)));
      }
      delete this.manifest.recovery;this.merge(actual);return {applied:operations.length,backup,stage:stagedResult.project};
    });
  }
  private verify(snapshot:Snapshot,ops:Operation[]){
    for(const op of ops){
      const found=snapshot.items.find(i=>i.program===op.program&&i.kind===op.kind&&i.nativeName===(op.action==='delete'?op.nativeName:op.name));
      if(op.action==='delete'){if(found)throw Error('Deletion verification failed: '+op.nativeName);continue;}
      if(op.kind==='source'){
        if(!found||normalize(found.content)!==normalize(op.content))throw Error('Source import verification failed: '+op.name);
        const ids=declaredBlocks(op.content);
        for(const id of ids)if(!snapshot.items.some(i=>i.program===op.program&&i.kind==='block'&&i.nativeName.replace(/\s/g,'')===id))throw Error('Expected compiled block missing: '+id);
      }else if(op.kind==='symbols'){
        const canonical=(s:string)=>parseAsc(s).map(r=>JSON.stringify({...r,address:r.address.replace(/\s/g,''),type:r.type.replace(/\s/g,'')})).sort();
        if(!found||JSON.stringify(canonical(found.content))!==JSON.stringify(canonical(op.content)))throw Error('Symbols replacement verification failed; deletions or field values were not retained');
      }else if(!found)throw Error('Block missing after compilation: '+op.nativeName);
    }
  }
  async lock<T>(action:()=>Promise<T>):Promise<T>{
    const lock=path.join(path.dirname(this.manifest.project),'.step7project-write.lock');
    let fd:number;try{fd=fs.openSync(lock,'wx');}catch{throw Error('Project is locked by another Step7Project operation. Inspect the lock owner before removing a stale lock.');}
    fs.writeFileSync(fd,JSON.stringify({pid:process.pid,workspace:this.root,at:new Date().toISOString()}));
    try{return await action();}finally{fs.closeSync(fd);fs.unlinkSync(lock);}
  }
  switchSymbols(format:'csv'|'asc'){
    if(format===this.manifest.symbolsFormat)return;
    if(this.status().some(c=>c.entry.kind==='symbols'&&c.state!=='unchanged'))throw Error('Apply or revert symbol changes before switching format');
    for(const e of this.manifest.entries.filter(e=>e.kind==='symbols')){
      const old=inside(this.root,e.file),rows=this.manifest.symbolsFormat==='csv'?parseCsv(readText(old)):parseAsc(readText(old));
      e.file=e.file.replace(/\.(csv|asc)$/,'.'+format);const text=format==='csv'?toCsv(rows):toAsc(rows);atomic(inside(this.root,e.file),text);atomic(this.base(e),text);e.baseHash=hash(text);fs.unlinkSync(old);
    }
    this.manifest.symbolsFormat=format;this.save();
  }
}
function normalize(s:string){return s.replace(/\r\n/g,'\n').trim();}
export function declaredBlocks(source:string):string[]{
  const stripped=source.replace(/\(\*[\s\S]*?\*\)|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
  return [...stripped.matchAll(/^\s*(?:FUNCTION_BLOCK|FUNCTION|ORGANIZATION_BLOCK|DATA_BLOCK|TYPE)\s+((?:FB|FC|OB|DB|UDT)\s*\d+)\b/gim)].map(m=>m[1].replace(/\s/g,'').toUpperCase());
}
export function template(type:string,n:number,lang:'scl'|'awl',instanceOf?:string):string{
  const id=type+(lang==='scl'?'':' ')+n;
  const version=lang==='scl'?"'0.1'":'0.1';
  if(type==='UDT')return `TYPE ${id}\nVERSION : 0.1\nSTRUCT\n  Value : INT;\nEND_STRUCT;\nEND_TYPE\n`;
  if(type==='DB'){
    if(instanceOf&&!/^FB\s*\d+$/i.test(instanceOf))throw Error('Instance DB requires an FB number');
    return `DATA_BLOCK ${id}\nVERSION : 0.1\n${instanceOf?(lang==='scl'?instanceOf.replace(/\s/g,''):instanceOf).toUpperCase():'STRUCT\n  Value : INT;\nEND_STRUCT;'}\nBEGIN\nEND_DATA_BLOCK\n`;
  }
  const keyword={OB:'ORGANIZATION_BLOCK',FC:'FUNCTION',FB:'FUNCTION_BLOCK'}[type];
  return `${keyword} ${id}${type==='FC'?' : VOID':''}\nVERSION : ${version}\nVAR_TEMP\n  scratchValue : INT;\nEND_VAR\nBEGIN\n${lang==='awl'?'  NOP 0;':'  scratchValue := 0;'}\nEND_${keyword}\n`;
}
