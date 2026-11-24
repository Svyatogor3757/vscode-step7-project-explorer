import fs from 'node:fs';
import path from 'node:path';
import {contains} from './storage';
export interface PendingNavigation {target:string;folder:string;viewRoot?:string}
export interface NavigationHost {
 folders():string[];
 requiresRestart?():boolean;
 add(folder:string):boolean;
 onFoldersChanged(listener:()=>void):{dispose():void};
 reveal(target:string):Promise<void>;
 savePending(pending:PendingNavigation|undefined):Promise<void>;
}
export class NavigationError extends Error {
 constructor(readonly reason:'missing'|'folder'|'rejected'|'timeout',readonly location:string){super(reason+': '+location);}
}
export function containingFolder(folders:string[],target:string){return [...folders].filter(folder=>contains(folder,target)).sort((a,b)=>b.length-a.length)[0];}
export class ProjectNavigator {
 private queue:Promise<unknown>=Promise.resolve();
 private restarting=false;
 constructor(readonly host:NavigationHost,readonly timeoutMs=10000){}
 get awaitingRestart(){return this.restarting;}
 open(target:string,folder:string,viewRoot?:string):Promise<{folder:string;restarting:boolean}>{
  const result=this.queue.then(()=>this.openNow(path.resolve(target),path.resolve(folder),viewRoot));
  this.queue=result.catch(()=>{});return result;
 }
 private async openNow(target:string,folder:string,viewRoot?:string){
  if(this.restarting)throw new NavigationError('rejected',folder);
  if(!fs.existsSync(target))throw new NavigationError('missing',target);
  if(!fs.existsSync(folder)||!fs.statSync(folder).isDirectory()||!contains(folder,target))throw new NavigationError('folder',folder);
  const folders=this.host.folders(),existing=containingFolder(folders,target);
  if(existing){await this.host.savePending(undefined);await this.host.reveal(target);return {folder:existing,restarting:false};}
  await this.host.savePending({target,folder,...(viewRoot?{viewRoot}:{})});
  // Changing the first root restarts Extension Host without a folders-changed event.
  // Activation resumes the saved reveal in that same editor session.
  if(!folders.length||this.host.requiresRestart?.()){
   this.restarting=true;
   try {if(!this.host.add(folder))throw new NavigationError('rejected',folder);}
   catch(error){this.restarting=false;await this.host.savePending(undefined);throw error;}
   return {folder,restarting:true};
  }
  let subscription:{dispose():void}|undefined,timer:ReturnType<typeof setTimeout>|undefined;
  try {
   await new Promise<void>((resolve,reject)=>{
    const check=()=>{if(containingFolder(this.host.folders(),target))resolve();};
    subscription=this.host.onFoldersChanged(check);
    timer=setTimeout(()=>reject(new NavigationError('timeout',folder)),this.timeoutMs);
    try {if(!this.host.add(folder))reject(new NavigationError('rejected',folder));}catch(error){reject(error);}
   });
  }catch(error){await this.host.savePending(undefined);throw error;}
  finally{subscription?.dispose();if(timer)clearTimeout(timer);}
  await this.host.savePending(undefined);await this.host.reveal(target);return {folder:containingFolder(this.host.folders(),target)!,restarting:false};
 }
 async resume(pending:PendingNavigation|undefined){
  this.restarting=false;
  if(!pending)return;
  try {
   if(!containingFolder(this.host.folders(),pending.target))throw new NavigationError('rejected',pending.folder);
   return await this.open(pending.target,pending.folder,pending.viewRoot);
  }
  catch(error){await this.host.savePending(undefined);throw error;}
 }
}
