import * as vscode from 'vscode';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {Bridge} from './bridge';
import {Workspace} from './workspace';
import {Backups} from './backups';
import {Entry,BackupMode} from './model';
import {inside,readText} from './storage';
import {parseCsv,toCsv,SymbolRow} from './symbols';
interface Node {label:string;children?:Node[];workspace:Workspace;entry?:Entry;state?:string}
const config=()=>vscode.workspace.getConfiguration('step7project');
class Projects implements vscode.TreeDataProvider<Node>,vscode.Disposable {
 private event=new vscode.EventEmitter<Node|undefined>();onDidChangeTreeData=this.event.event;
 roots:Node[]=[];workspaces:Workspace[]=[];backups=new Map<string,Backups>();
 constructor(readonly backend:Bridge,readonly report:(e:unknown)=>void){}
 reload(){
  this.roots=[];this.workspaces=[];
  for(const folder of vscode.workspace.workspaceFolders||[]){
   const root=folder.uri.fsPath;if(!fs.existsSync(path.join(root,'step7project.json')))continue;
   try{
    const w=new Workspace(root,this.backend);this.workspaces.push(w);
    const prior=this.backups.get(root);const b=new Backups(root,w.manifest);if(prior)Object.assign(b,{last:(prior as unknown as {last:number}).last});this.backups.set(root,b);
    const node:Node={label:w.manifest.projectName+(w.manifest.recovery?' [recovery required]':''),children:[],workspace:w};this.roots.push(node);
    for(const c of w.status()){
     const parts=c.entry.file.split('/').slice(1);let parent=node;
     for(const part of parts.slice(0,-1)){let next=parent.children!.find(x=>x.label===part);if(!next){next={label:part,children:[],workspace:w};parent.children!.push(next);}parent=next;}
     parent.children!.push({label:parts.at(-1)!,workspace:w,entry:c.entry,state:c.state});
    }
   }catch(e){this.report(e);}
  }
  this.event.fire(undefined);
 }
 getChildren(n?:Node){return n?.children||this.roots;}
 getTreeItem(n:Node){
  const t=new vscode.TreeItem(n.label,n.children?vscode.TreeItemCollapsibleState.Collapsed:vscode.TreeItemCollapsibleState.None);
  if(n.entry){
   t.resourceUri=vscode.Uri.file(inside(n.workspace.root,n.entry.file));t.contextValue='file';
   t.description=n.entry.readOnly?'read only':n.state==='unchanged'?'':n.state;
   t.tooltip=n.entry.reason||`${n.entry.program}\n${n.entry.nativeName}\n${n.entry.file}`;
   t.command={command:'step7project.openEntry',title:'Open',arguments:[n]};
  }else t.iconPath=new vscode.ThemeIcon('folder');
  return t;
 }
 dispose(){this.event.dispose();}
}
class SymbolsEditor implements vscode.CustomTextEditorProvider {
 async resolveCustomTextEditor(document:vscode.TextDocument,panel:vscode.WebviewPanel){
  panel.webview.options={enableScripts:true};const nonce=crypto.randomBytes(16).toString('hex');
  panel.webview.html=`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'"><style>
  body{font-family:var(--vscode-font-family);color:var(--vscode-foreground)}table{border-collapse:collapse;width:100%}th{text-align:left}td,th{padding:5px;border-bottom:1px solid var(--vscode-panel-border)}input{box-sizing:border-box;width:100%;color:var(--vscode-input-foreground);background:var(--vscode-input-background);border:1px solid var(--vscode-input-border);padding:5px}button{color:var(--vscode-button-foreground);background:var(--vscode-button-background);border:0;padding:5px;cursor:pointer}#error{color:var(--vscode-errorForeground)}
  </style></head><body><h3>STEP 7 Symbols</h3><p>Changes edit the CSV document. Save, then use Step7Project: Apply Changes.</p><p id="error"></p><table><thead><tr><th>Symbol</th><th>Address</th><th>Type</th><th>Comment</th><th></th></tr></thead><tbody id="rows"></tbody></table><p><button id="add">Add symbol</button></p><script nonce="${nonce}">
  const api=acquireVsCodeApi();let rows=[];const keys=['symbol','address','type','comment'];
  function send(){api.postMessage({type:'edit',rows});}
  function render(){const body=document.getElementById('rows');body.replaceChildren();rows.forEach((r,i)=>{const tr=document.createElement('tr');keys.forEach(k=>{const td=document.createElement('td'),input=document.createElement('input');input.value=r[k];input.addEventListener('change',()=>{r[k]=input.value;send();});td.append(input);tr.append(td);});const td=document.createElement('td'),b=document.createElement('button');b.textContent='Delete';b.onclick=()=>{rows.splice(i,1);send();render();};td.append(b);tr.append(td);body.append(tr);});}
  window.addEventListener('message',e=>{if(e.data.error){document.getElementById('error').textContent=e.data.error;return;}rows=e.data.rows;document.getElementById('error').textContent='';render();});
  document.getElementById('add').onclick=()=>{rows.push({symbol:'',address:'',type:'BOOL',comment:''});render();};api.postMessage({type:'ready'});
  </script></body></html>`;
  const update=()=>{try{void panel.webview.postMessage({rows:parseCsv(document.getText(),false)});}catch(e){void panel.webview.postMessage({error:String(e)});}};
  const change=vscode.workspace.onDidChangeTextDocument(e=>{if(e.document.uri.toString()===document.uri.toString())update();});
  const messages=panel.webview.onDidReceiveMessage(async m=>{
   if(m.type==='ready'){update();return;}
   if(m.type!=='edit')return;
   try{
    if(!Array.isArray(m.rows)||m.rows.length>100000)throw Error('Invalid symbol table');
    const rows:SymbolRow[]=m.rows.map((r:Record<string,unknown>)=>{for(const k of ['symbol','address','type','comment'])if(typeof r[k]!=='string')throw Error('Invalid symbol value');return r as unknown as SymbolRow;});
    const edit=new vscode.WorkspaceEdit();edit.replace(document.uri,new vscode.Range(document.positionAt(0),document.positionAt(document.getText().length)),toCsv(rows));
    if(!await vscode.workspace.applyEdit(edit))throw Error('Could not update symbols document');
   }catch(e){void panel.webview.postMessage({error:String(e)});}
  });panel.onDidDispose(()=>{change.dispose();messages.dispose();});
 }
}
export function activate(context:vscode.ExtensionContext){
 const out=vscode.window.createOutputChannel('Step7Project');
 const report=(e:unknown)=>{const message=e instanceof Error?e.message:String(e);out.appendLine(message);void vscode.window.showErrorMessage('Step7Project: '+message);};
 const backend=new Bridge(config().get<string>('backend.path')||undefined),tree=new Projects(backend,report);
 const view=vscode.window.createTreeView('step7project.tree',{treeDataProvider:tree,showCollapseAll:true});
 context.subscriptions.push(out,tree,view,vscode.window.registerCustomEditorProvider('step7project.symbols',new SymbolsEditor()));
 const readonlyChanged=new vscode.EventEmitter<vscode.Uri>();
 const readonlyProvider=vscode.workspace.registerTextDocumentContentProvider('step7-readonly',{onDidChange:readonlyChanged.event,provideTextDocumentContent(uri){return fs.readFileSync(uri.query,'utf8');}});
 context.subscriptions.push(readonlyProvider,readonlyChanged,tree.onDidChangeTreeData(()=>{for(const doc of vscode.workspace.textDocuments)if(doc.uri.scheme==='step7-readonly'&&fs.existsSync(doc.uri.query))readonlyChanged.fire(doc.uri);}));
 function register(name:string,action:(...args:any[])=>unknown){context.subscriptions.push(vscode.commands.registerCommand('step7project.'+name,async(...args:any[])=>{try{return await action(...args);}catch(e){report(e);}}));}
 async function workspace(n?:Node){if(n?.workspace)return n.workspace;if(tree.workspaces.length===1)return tree.workspaces[0];const pick=await vscode.window.showQuickPick(tree.workspaces.map(w=>({label:w.manifest.projectName,description:w.root,w})));return pick?.w;}
 async function open(n:Node,asText=false){
  const e=n.entry!;const file=vscode.Uri.file(inside(n.workspace.root,e.file));
  if(e.readOnly){await vscode.window.showTextDocument(vscode.Uri.from({scheme:'step7-readonly',path:'/'+path.basename(e.file),query:file.fsPath}));return;}
  const editor=config().get<string>('symbols.editor');
  if(!asText&&e.kind==='symbols'&&file.path.endsWith('.csv')&&editor==='table')await vscode.commands.executeCommand('vscode.openWith',file,'step7project.symbols');
  else if(!asText&&e.kind==='symbols'&&editor==='default')await vscode.commands.executeCommand('vscode.open',file);
  else await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(file));
 }
 register('openEntry',open);register('text',(n:Node)=>open(n,true));
 register('copyPath',(n:Node)=>vscode.env.clipboard.writeText(inside(n.workspace.root,n.entry!.file)));
 register('copyRelativePath',(n:Node)=>vscode.env.clipboard.writeText(n.entry!.file));
 register('reveal',(n:Node)=>vscode.commands.executeCommand('revealFileInOS',vscode.Uri.file(inside(n.workspace.root,n.entry!.file))));
 register('diff',(n:Node)=>vscode.commands.executeCommand('vscode.diff',vscode.Uri.file(n.workspace.base(n.entry!)),vscode.Uri.file(inside(n.workspace.root,n.entry!.file)),n.entry!.name+' — STEP 7 changes'));
 register('open',async()=>{
  const selected=await vscode.window.showOpenDialog({title:'Open STEP 7 Classic project',filters:{'STEP 7':['s7p','s7l']},canSelectMany:false});if(!selected)return;
  const folders=await vscode.window.showOpenDialog({title:'Choose parent folder for the editing workspace',canSelectFiles:false,canSelectFolders:true,canSelectMany:false});if(!folders)return;
  const root=path.join(folders[0].fsPath,path.basename(selected[0].fsPath,path.extname(selected[0].fsPath))+'-code');
  await vscode.window.withProgress({location:vscode.ProgressLocation.Notification,title:'Reading STEP 7 project'},()=>Workspace.open(selected[0].fsPath,root,backend,config().get('symbols.format','csv'),config().get('backup.mode','everySave'),config().get('awl.mnemonics','english')));
  vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders?.length||0,0,{uri:vscode.Uri.file(root)});
 });
 register('refresh',async(n?:Node)=>{const w=await workspace(n);if(!w){tree.reload();return;}w.merge(await w.backend.read(w.manifest.project));tree.reload();});
 async function apply(dry:boolean,n?:Node){
  const w=await workspace(n);if(!w)return;
  const dirty=vscode.workspace.textDocuments.filter(d=>d.isDirty&&d.uri.scheme==='file'&&w.manifest.entries.some(e=>inside(w.root,e.file)===d.uri.fsPath));
  for(const doc of dirty)if(!await doc.save())throw Error('Save failed: '+doc.uri.fsPath);
  w.manifest.backupMode=config().get<BackupMode>('backup.mode','everySave');w.manifest.backupDirectory=config().get('backup.directory','');w.save();
  const selection=n?.entry?[n.entry.id]:undefined;
  const changes=w.operations(selection);if(!changes.length){void vscode.window.showInformationMessage('No changes to apply.');return;}
  if(!dry&&await vscode.window.showWarningMessage(`Apply ${changes.length} changes to ${w.manifest.projectName}?\n`+changes.map(o=>o.action+' '+o.nativeName).join('\n'),{modal:true},'Apply')!=='Apply')return;
  try{const result=await vscode.window.withProgress({location:vscode.ProgressLocation.Notification,title:dry?'Checking changes on a project copy':'Applying STEP 7 changes'},()=>w.apply(dry,selection));out.appendLine(JSON.stringify(result,null,2));void vscode.window.showInformationMessage(dry?'STEP 7 check completed.':'STEP 7 changes applied and verified.');}finally{tree.reload();}
 }
 register('check',(n?:Node)=>apply(true,n));register('apply',(n?:Node)=>apply(false,n));
 register('delete',(n:Node)=>{n.workspace.delete(n.entry!.id);tree.reload();});
 register('rename',async(n:Node)=>{const name=await vscode.window.showInputBox({prompt:'New STEP 7 source name',value:n.entry!.name});if(name){n.workspace.rename(n.entry!.id,name);tree.reload();}});
 register('create',async(n?:Node)=>{
  const w=await workspace(n);if(!w)return;
  const program=await vscode.window.showQuickPick(w.manifest.programs.map(p=>({label:p.path.join(' / '),id:p.id})));if(!program)return;
  const type=await vscode.window.showQuickPick(['OB','FC','FB','DB','UDT']);if(!type)return;
  const number=await vscode.window.showInputBox({prompt:type+' number',validateInput:s=>/^\d+$/.test(s)&&+s>0&&+s<=65535?null:'Enter a number from 1 to 65535'});if(!number)return;
  const language=await vscode.window.showQuickPick(['scl','awl']);if(!language)return;
  let instance:string|undefined;if(type==='DB'&&await vscode.window.showQuickPick(['Global DB','Instance DB'])==='Instance DB'){instance=await vscode.window.showInputBox({prompt:'Function block, for example FB 20'});if(!instance)return;}
  const entry=w.create(program.id,type,+number,language as 'scl'|'awl',instance);tree.reload();await open({label:entry.name,entry,workspace:w});
 });
 register('symbolFormat',async()=>{const w=await workspace();if(!w)return;const format=await vscode.window.showQuickPick(['csv','asc']);if(format){w.switchSymbols(format as 'csv'|'asc');tree.reload();}});
 register('restore',async()=>{const backup=await vscode.window.showOpenDialog({title:'Select backup directory',canSelectFiles:false,canSelectFolders:true});if(!backup)return;const destination=await vscode.window.showSaveDialog({title:'Restore to a NEW path'});if(destination){Backups.restore(backup[0].fsPath,destination.fsPath);void vscode.window.showInformationMessage('Restored to '+destination.fsPath);}});
 const watcher=vscode.workspace.createFileSystemWatcher('**/{step7project.json,Programs/**}');let reload:NodeJS.Timeout|undefined;
 const changed=()=>{for(const b of tree.backups.values()){try{b.manifest.backupMode=config().get<BackupMode>('backup.mode','everySave');b.manifest.backupDirectory=config().get('backup.directory','');b.observe();}catch(e){out.appendLine('Backup: '+String(e));}}if(reload)clearTimeout(reload);reload=setTimeout(()=>tree.reload(),250);};
 context.subscriptions.push(watcher,watcher.onDidChange(changed),watcher.onDidCreate(changed),watcher.onDidDelete(changed),vscode.workspace.onDidSaveTextDocument(changed),vscode.workspace.onDidChangeWorkspaceFolders(()=>tree.reload()),vscode.workspace.onDidChangeConfiguration(e=>{if(e.affectsConfiguration('step7project'))changed();}));
 const timer=setInterval(()=>{for(const b of tree.backups.values()){try{b.observe();}catch(e){out.appendLine('Backup: '+String(e));}}},1000);context.subscriptions.push({dispose(){clearInterval(timer);if(reload)clearTimeout(reload);}});
 tree.reload();
 return {cli:path.resolve(context.extensionPath,'bin/step7project.cjs')};
}
