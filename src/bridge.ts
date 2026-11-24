import {spawn} from 'node:child_process';
import path from 'node:path';
import {windowsPowerShellEnvironment} from './processEnvironment';
import {Backend,Snapshot,Operation,Mnemonics} from './model';
export class Bridge implements Backend {
  constructor(readonly executable=process.env.STEP7PROJECT_BACKEND||path.resolve(__dirname,'../backend/bin/Step7Bridge.exe'),readonly mnemonics:Mnemonics='english'){}
  withMnemonics(mnemonics:Mnemonics){return new Bridge(this.executable,mnemonics);}
  request<T>(request:unknown):Promise<T>{
    if(process.platform!=='win32')return Promise.reject(Error('STEP 7 backend requires Windows on the extension host. Connect to Windows using VS Code Remote SSH.'));
    return new Promise((resolve,reject)=>{
      const native=['execute','stage'].includes((request as {command:string}).command);
      const exe=native?'powershell.exe':this.executable;
      const args=native?['-NoProfile','-ExecutionPolicy','Bypass','-File',path.resolve(__dirname,'../backend/Invoke-Bridge.ps1'),'-BridgePath',this.executable]:[];
      const child=spawn(exe,args,{windowsHide:true,stdio:['pipe','pipe','pipe'],env:native?windowsPowerShellEnvironment():process.env});let out='',err='';let settled=false;
      // Do not kill a compiler on a timeout: native mutation may still be in progress.
      child.stdout.setEncoding('utf8').on('data',s=>out+=s);child.stderr.setEncoding('utf8').on('data',s=>err+=s);
      child.on('error',e=>{settled=true;reject(Error(`Cannot start STEP 7 backend: ${e.message}`));});
      child.on('close',code=>{if(settled)return;if(code!==0){let message=err||`Backend exited ${code}`;try{message=JSON.parse(err).error||message;}catch{}reject(Error(message));return;}try{resolve(JSON.parse(out.replace(/^\uFEFF/,'')));}catch{reject(Error('Invalid backend response: '+out.slice(0,500)));}});
      child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify({...request as object,mnemonics:this.mnemonics}));
    });
  }
  read(project:string){return this.request<Snapshot>({command:'read',project});}
  async execute(project:string,operations:Operation[]){await this.request({command:'execute',project,operations});}
  stage(project:string,operations:Operation[]){return this.request<{snapshot:Snapshot;project:string}>({command:'stage',project,operations});}
  doctor(){return this.request({command:'doctor'});}
}
