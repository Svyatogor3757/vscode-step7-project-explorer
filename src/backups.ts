import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {BackupMode,Manifest} from './model';
import {atomic,inside,hash,copyProject} from './storage';
export const intervals:Record<BackupMode,number>={off:Infinity,everySave:0,'1m':60000,'10m':600000,'30m':1800000,'1h':3600000};
export class Backups {
  private last=0;
  constructor(readonly root:string,readonly manifest:Manifest){}
  get directory(){return this.manifest.backupDirectory?path.resolve(this.root,this.manifest.backupDirectory):path.join(this.root,'.step7project','backups');}
  observe(now=Date.now(),force=false):string[]{
    const mode=this.manifest.backupMode;
    if(!force&&now-this.last<intervals[mode])return [];
    const made:string[]=[];
    for(const e of this.manifest.entries){
      const file=inside(this.root,e.file),shadow=inside(this.root,'.step7project/shadows/'+hash(e.id));
      const previous=fs.existsSync(shadow)?fs.readFileSync(shadow):undefined,current=fs.existsSync(file)?fs.readFileSync(file):undefined;
      if(previous&&(!current||!previous.equals(current))&&mode!=='off'){
        const folder=path.join(this.directory,'files',`${now}-${crypto.randomUUID()}`);
        atomic(path.join(folder,'content'),previous);atomic(path.join(folder,'backup.json'),JSON.stringify({file:e.file,id:e.id,at:new Date(now).toISOString()},null,2));made.push(folder);
      }
      if(current){if(!previous||!previous.equals(current))atomic(shadow,current);}else if(fs.existsSync(shadow))fs.unlinkSync(shadow);
    }
    this.last=now;return made;
  }
  project():string|undefined {
    if(this.manifest.backupMode==='off')return;
    const dest=path.join(this.directory,'projects',new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomUUID());
    copyProject(path.dirname(this.manifest.project),dest);return dest;
  }
  static restore(backup:string,dest:string):void {
    if(fs.existsSync(dest))throw Error('Restore destination must not exist');
    if(fs.existsSync(path.join(backup,'backup.json'))){atomic(dest,fs.readFileSync(path.join(backup,'content')));return;}
    copyProject(backup,dest);
  }
}
