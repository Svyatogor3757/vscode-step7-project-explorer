import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const hash=(data:string|Buffer)=>crypto.createHash('sha256').update(data).digest('hex');
export function contains(root:string,target:string):boolean {
  const relative=path.relative(path.resolve(root),path.resolve(target));
  return relative===''||(relative!=='..'&&!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative));
}
export function safeName(s:string):string {
  let v=s.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/[ .]+$/,'');
  if(!v||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(v))v='_'+v;
  return v.slice(0,100);
}
export function inside(root:string,relative:string):string {
  if(path.isAbsolute(relative)||relative.split(/[\\/]/).includes('..'))throw Error('Path escapes workspace: '+relative);
  const full=path.resolve(root,relative),base=path.resolve(root);
  if(full!==base&&!full.startsWith(base+path.sep))throw Error('Path escapes workspace');
  let current=base;
  for(const part of path.relative(base,full).split(path.sep)) {current=path.join(current,part);if(fs.existsSync(current)&&fs.lstatSync(current).isSymbolicLink())throw Error('Symbolic links are not allowed in managed paths: '+current);}
  return full;
}
export function atomic(file:string,data:string|Buffer):void {
  fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=file+'.'+crypto.randomUUID()+'.tmp';
  try{fs.writeFileSync(tmp,data,{flag:'wx'});if(fs.existsSync(file))fs.chmodSync(file,0o666);fs.renameSync(tmp,file);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
}
export function readText(file:string):string {return fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');}
export function files(root:string):string[]{
  const result:string[]=[];
  for(const d of fs.readdirSync(root,{withFileTypes:true})){
    if(d.isSymbolicLink())throw Error('Project snapshot cannot include symbolic links: '+d.name);
    if(['.git','.step7project','output'].includes(d.name.toLowerCase())||/\.(lck|lock)$/i.test(d.name))continue;
    const full=path.join(root,d.name);if(d.isDirectory())result.push(...files(full));else result.push(full);
  }
  return result.sort();
}
export function fingerprint(root:string):string {return hash(files(root).map(f=>path.relative(root,f)+'\0'+hash(fs.readFileSync(f))).join('\n'));}
export function copyProject(root:string,dest:string):void {
  const abs=path.resolve(dest),source=path.resolve(root);
  if(contains(source,abs))throw Error('Snapshot must be outside the native project directory');
  const before=fingerprint(root);
  for(const file of files(root)){const target=path.join(dest,path.relative(root,file));fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);}
  if(before!==fingerprint(root)||before!==fingerprint(dest))throw Error('Native project changed while copying. Close editors in SIMATIC Manager and retry.');
}
