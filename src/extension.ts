import * as vscode from 'vscode';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {Bridge} from './bridge';
import {Workspace} from './workspace';
import {Backups} from './backups';
import {Entry,BackupMode} from './model';
import {inside,contains} from './storage';
import {parseCsv,toCsv,SymbolRow} from './symbols';
import {ProjectViewIndex,projectKey,rememberProjectViews,findProjectViews} from './projectViews';
import {refreshLauncher} from './guidance';
interface Node {label:string;children?:Node[];workspace:Workspace;entry?:Entry;state?:string}
const config=()=>vscode.workspace.getConfiguration('step7project');
export class Projects implements vscode.TreeDataProvider<Node>,vscode.Disposable {
 private event=new vscode.EventEmitter<Node|undefined>();onDidChangeTreeData=this.event.event;
 roots:Node[]=[];workspaces:Workspace[]=[];backups=new Map<string,Backups>();
 private discovered:string[]=[];private discovery=0;
 constructor(readonly backend:Bridge,readonly report:(e:unknown)=>void,public activeRoot?:string){}
 get active(){return this.workspaces.find(w=>w.root===this.activeRoot)||this.workspaces[0];}
 select(w:Workspace){this.activeRoot=w.root;this.event.fire(undefined);}
 selectFile(uri?:vscode.Uri){
  if(!uri||!['file','step7-readonly'].includes(uri.scheme))return;
  const file=uri.scheme==='file'?uri.fsPath:uri.query;
  const w=[...this.workspaces].sort((a,b)=>b.root.length-a.root.length).find(w=>contains(w.root,file));
  if(w&&w.root!==this.activeRoot)this.select(w);
 }
 async discover(){
  const generation=++this.discovery;
  const found=await vscode.workspace.findFiles('**/step7project.json','**/{.git,node_modules,.step7project,.scratch}/**');
  if(generation!==this.discovery)return;
  this.discovered=found.filter(uri=>uri.scheme==='file').map(uri=>path.dirname(uri.fsPath));this.reload();
 }
 reload(){
  this.roots=[];this.workspaces=[];
  const folders=(vscode.workspace.workspaceFolders||[]).filter(f=>f.uri.scheme==='file').map(f=>f.uri.fsPath);
  for(const root of new Set([...folders,...this.discovered])){
   if(!folders.some(folder=>contains(folder,root))||!fs.existsSync(path.join(root,'step7project.json')))continue;
   try{
    const w=new Workspace(root,this.backend);refreshLauncher(root);this.workspaces.push(w);
    const prior=this.backups.get(root);const b=new Backups(root,w.manifest);if(prior)Object.assign(b,{last:(prior as unknown as {last:number}).last});this.backups.set(root,b);
    const node:Node={label:w.manifest.projectName+(w.manifest.recovery?' ['+vscode.l10n.t('recovery required')+']':''),children:[],workspace:w};this.roots.push(node);
    for(const c of w.status()){
     const parts=c.entry.file.split('/').slice(1);let parent=node;
     for(const part of parts.slice(0,-1)){let next=parent.children!.find(x=>x.label===part);if(!next){next={label:part,children:[],workspace:w};parent.children!.push(next);}parent=next;}
     parent.children!.push({label:parts.at(-1)!,workspace:w,entry:c.entry,state:c.state});
    }
   }catch(e){this.report(e);}
  }
  for(const root of this.backups.keys())if(!this.workspaces.some(w=>w.root===root))this.backups.delete(root);
  this.activeRoot=this.active?.root;this.event.fire(undefined);
 }
 getChildren(n?:Node){return n?.children||this.roots;}
 getTreeItem(n:Node){
  const t=new vscode.TreeItem(n.label,n.children?vscode.TreeItemCollapsibleState.Collapsed:vscode.TreeItemCollapsibleState.None);
  if(n.entry){
   t.resourceUri=vscode.Uri.file(inside(n.workspace.root,n.entry.file));t.contextValue=n.entry.kind==='source'&&!n.entry.readOnly?'source':'file';
   const states:Record<string,string>={modified:vscode.l10n.t('modified'),new:vscode.l10n.t('new'),delete:vscode.l10n.t('pending deletion'),missing:vscode.l10n.t('missing'),readOnly:vscode.l10n.t('read only')};
   t.description=n.entry.renamed?vscode.l10n.t('Rename to {0} after Apply',n.entry.renamed):n.entry.readOnly?vscode.l10n.t('read only'):n.state==='unchanged'?'':states[n.state||''];
   t.tooltip=n.entry.reason||`${n.entry.program}\n${n.entry.nativeName}\n${n.entry.file}`;
   t.command={command:'step7project.openEntry',title:vscode.l10n.t('Open File'),arguments:[n]};
  }else t.iconPath=new vscode.ThemeIcon('folder');
  return t;
 }
 dispose(){this.event.dispose();}
}
export class ProjectLocation extends vscode.TreeItem {
 constructor(label:string,readonly location:string,readonly root:string,kind:'native'|'view'){super(label);this.contextValue='location.'+kind;}
}
export class ProjectControls implements vscode.TreeDataProvider<vscode.TreeItem>,vscode.Disposable {
 private event=new vscode.EventEmitter<void>();onDidChangeTreeData=this.event.event;
 constructor(readonly projects:Projects){}
 refresh(){this.event.fire();}
 getChildren(parent?:vscode.TreeItem){if(parent)return [];const actions=[
  ['open',vscode.l10n.t('Open Project'),'folder-open'],
  ['refresh',vscode.l10n.t('Refresh'),'refresh'],
  ['apply',vscode.l10n.t('Apply Changes'),'save-all'],
  ['check',vscode.l10n.t('Check Changes'),'check'],
  ['create',vscode.l10n.t('Create Block'),'new-file']
 ].map(([command,label,icon])=>{const item=new vscode.TreeItem(label);item.id=command;item.iconPath=new vscode.ThemeIcon(icon);item.command={command:'step7project.'+command,title:label};item.tooltip=command==='apply'?vscode.l10n.t('Save files, compile a copy, then write changes to the STEP 7 project.'):command==='check'?vscode.l10n.t('Compile changes on a copy without writing to the STEP 7 project.'):label;return item;});
  const w=this.projects.active;if(!w)return actions;
  const native=new ProjectLocation(vscode.l10n.t('Native project: {0}',w.manifest.projectName),w.manifest.project,w.root,'native');native.id='native';native.tooltip=w.manifest.project;native.iconPath=new vscode.ThemeIcon('file-binary');native.command={command:'step7project.revealNative',title:vscode.l10n.t('Reveal native project'),arguments:[{workspace:w}]};
  const representation=new ProjectLocation(vscode.l10n.t('Project view: {0}',path.basename(w.root)),w.root,w.root,'view');representation.id='representation';representation.tooltip=w.root;representation.iconPath=new vscode.ThemeIcon('folder');representation.command={command:'step7project.revealView',title:vscode.l10n.t('Reveal project view'),arguments:[{workspace:w}]};
  const selection=new vscode.TreeItem(vscode.l10n.t('Select Active Project'));selection.id='select';selection.iconPath=new vscode.ThemeIcon('project');selection.command={command:'step7project.selectProject',title:vscode.l10n.t('Select Active Project')};
  return [native,representation,...(this.projects.workspaces.length>1?[selection]:[]),...actions];
 }
 getTreeItem(item:vscode.TreeItem){return item;}
 dispose(){this.event.dispose();}
}
class SymbolsEditor implements vscode.CustomTextEditorProvider {
 async resolveCustomTextEditor(document:vscode.TextDocument,panel:vscode.WebviewPanel){
  panel.webview.options={enableScripts:true};const nonce=crypto.randomBytes(16).toString('hex');
  panel.webview.html=`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'"><style>
  body{font-family:var(--vscode-font-family);color:var(--vscode-foreground)}table{border-collapse:collapse;width:100%}th{text-align:left}td,th{padding:5px;border-bottom:1px solid var(--vscode-panel-border)}input{box-sizing:border-box;width:100%;color:var(--vscode-input-foreground);background:var(--vscode-input-background);border:1px solid var(--vscode-input-border);padding:5px}button{color:var(--vscode-button-foreground);background:var(--vscode-button-background);border:0;padding:5px;cursor:pointer}#error{color:var(--vscode-errorForeground)}
  </style></head><body><h3>${vscode.l10n.t('STEP 7 Symbols')}</h3><p>${vscode.l10n.t('Changes edit the CSV document. Save, then use Apply Changes to write to STEP 7.')}</p><p id="error"></p><table><thead><tr><th>${vscode.l10n.t('Symbol')}</th><th>${vscode.l10n.t('Address')}</th><th>${vscode.l10n.t('Type')}</th><th>${vscode.l10n.t('Comment')}</th><th></th></tr></thead><tbody id="rows"></tbody></table><p><button id="add">${vscode.l10n.t('Add symbol')}</button></p><script nonce="${nonce}">
  const api=acquireVsCodeApi();let rows=[];const keys=['symbol','address','type','comment'];
  function send(){api.postMessage({type:'edit',rows});}
  function render(){const body=document.getElementById('rows');body.replaceChildren();rows.forEach((r,i)=>{const tr=document.createElement('tr');keys.forEach(k=>{const td=document.createElement('td'),input=document.createElement('input');input.value=r[k];input.addEventListener('change',()=>{r[k]=input.value;send();});td.append(input);tr.append(td);});const td=document.createElement('td'),b=document.createElement('button');b.textContent=${JSON.stringify(vscode.l10n.t('Delete'))};b.onclick=()=>{rows.splice(i,1);send();render();};td.append(b);tr.append(td);body.append(tr);});}
  window.addEventListener('message',e=>{if(e.data.error){document.getElementById('error').textContent=e.data.error;return;}rows=e.data.rows;document.getElementById('error').textContent='';render();});
  document.getElementById('add').onclick=()=>{rows.push({symbol:'',address:'',type:'BOOL',comment:''});render();};api.postMessage({type:'ready'});
  </script></body></html>`;
  const update=()=>{try{void panel.webview.postMessage({rows:parseCsv(document.getText(),false)});}catch(e){void panel.webview.postMessage({error:String(e)});}};
  const change=vscode.workspace.onDidChangeTextDocument(e=>{if(e.document.uri.toString()===document.uri.toString())update();});
  const messages=panel.webview.onDidReceiveMessage(async m=>{
   if(m.type==='ready'){update();return;}
   if(m.type!=='edit')return;
   try{
    if(!Array.isArray(m.rows)||m.rows.length>100000)throw Error(vscode.l10n.t('Invalid symbol table'));
    const rows:SymbolRow[]=m.rows.map((r:Record<string,unknown>)=>{for(const k of ['symbol','address','type','comment'])if(typeof r[k]!=='string')throw Error(vscode.l10n.t('Invalid symbol value'));return r as unknown as SymbolRow;});
    const edit=new vscode.WorkspaceEdit();edit.replace(document.uri,new vscode.Range(document.positionAt(0),document.positionAt(document.getText().length)),toCsv(rows));
    if(!await vscode.workspace.applyEdit(edit))throw Error(vscode.l10n.t('Could not update symbols document'));
   }catch(e){void panel.webview.postMessage({error:String(e)});}
  });panel.onDidDispose(()=>{change.dispose();messages.dispose();});
 }
}
export async function activate(context:vscode.ExtensionContext){
 const out=vscode.window.createOutputChannel('Step7Project');
 const report=(e:unknown)=>{const message=e instanceof Error?e.message:String(e);out.appendLine(message);void vscode.window.showErrorMessage('Step7Project: '+message);};
 const backend=new Bridge(config().get<string>('backend.path')||undefined),tree=new Projects(backend,report,context.workspaceState.get<string>('activeProject'));
 const view=vscode.window.createTreeView('step7project.tree',{treeDataProvider:tree,showCollapseAll:true});
 const controlProvider=new ProjectControls(tree),controls=vscode.window.createTreeView('step7project.controls',{treeDataProvider:controlProvider});
 view.message=vscode.l10n.t('Save files → Check Changes → Apply Changes to write to STEP 7.');
 context.subscriptions.push(out,tree,view,controls,controlProvider,tree.onDidChangeTreeData(()=>{
  controlProvider.refresh();if(context.workspaceState.get<string>('activeProject')!==tree.active?.root)void context.workspaceState.update('activeProject',tree.active?.root);
  const previous=context.globalState.get<ProjectViewIndex>('projectViews',{}),next=rememberProjectViews(previous,tree.workspaces.map(w=>({project:w.manifest.project,root:w.root})));
  if(JSON.stringify(previous)!==JSON.stringify(next))void context.globalState.update('projectViews',next);
 }),vscode.window.registerCustomEditorProvider('step7project.symbols',new SymbolsEditor()));
 const readonlyChanged=new vscode.EventEmitter<vscode.Uri>();
 const readonlyProvider=vscode.workspace.registerTextDocumentContentProvider('step7-readonly',{onDidChange:readonlyChanged.event,provideTextDocumentContent(uri){return fs.readFileSync(uri.query,'utf8');}});
 context.subscriptions.push(readonlyProvider,readonlyChanged,tree.onDidChangeTreeData(()=>{for(const doc of vscode.workspace.textDocuments)if(doc.uri.scheme==='step7-readonly'&&fs.existsSync(doc.uri.query))readonlyChanged.fire(doc.uri);}));
 function register(name:string,action:(...args:any[])=>unknown){context.subscriptions.push(vscode.commands.registerCommand('step7project.'+name,async(...args:any[])=>{try{return await action(...args);}catch(e){report(e);}}));}
 async function chooseProject(){const pick=await vscode.window.showQuickPick(tree.workspaces.map(w=>({label:w.manifest.projectName,description:w.root,w})),{title:vscode.l10n.t('Choose a project')});if(pick)tree.select(pick.w);return pick?.w;}
 async function workspace(n?:Node){if(n?.workspace){tree.select(n.workspace);return n.workspace;}return tree.active||chooseProject();}
 async function open(n:Node,asText=false){
  tree.select(n.workspace);
  const e=n.entry!;const file=vscode.Uri.file(inside(n.workspace.root,e.file));
  if(e.readOnly){await vscode.window.showTextDocument(vscode.Uri.from({scheme:'step7-readonly',path:'/'+path.basename(e.file),query:file.fsPath}));return;}
  const editor=config().get<string>('symbols.editor');
  if(!asText&&e.kind==='symbols'&&file.path.endsWith('.csv')&&editor==='table')await vscode.commands.executeCommand('vscode.openWith',file,'step7project.symbols');
  else if(!asText&&e.kind==='symbols'&&editor==='default')await vscode.commands.executeCommand('vscode.open',file);
  else await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(file));
 }
 register('openEntry',open);register('text',(n:Node)=>open(n,true));
 register('selectProject',chooseProject);
 register('revealNative',(n:Node)=>vscode.commands.executeCommand('revealFileInOS',vscode.Uri.file(n.workspace.manifest.project)));
 register('revealView',(n:Node)=>vscode.commands.executeCommand('revealInExplorer',vscode.Uri.file(n.workspace.root)));
 register('copyLocation',(n:ProjectLocation)=>vscode.env.clipboard.writeText(n.location));
 register('copyRelativeLocation',(n:ProjectLocation)=>vscode.env.clipboard.writeText(path.relative(n.root,n.location)||'.'));
 register('revealLocation',(n:ProjectLocation)=>vscode.commands.executeCommand('revealFileInOS',vscode.Uri.file(n.location)));
 register('revealLocationInWorkspace',(n:ProjectLocation)=>vscode.commands.executeCommand('revealInExplorer',vscode.Uri.file(n.location)));
 register('copyPath',(n:Node)=>vscode.env.clipboard.writeText(inside(n.workspace.root,n.entry!.file)));
 register('copyRelativePath',(n:Node)=>vscode.env.clipboard.writeText(n.entry!.file));
 register('reveal',(n:Node)=>vscode.commands.executeCommand('revealFileInOS',vscode.Uri.file(inside(n.workspace.root,n.entry!.file))));
 register('diff',(n:Node)=>vscode.commands.executeCommand('vscode.diff',vscode.Uri.file(n.workspace.base(n.entry!)),vscode.Uri.file(inside(n.workspace.root,n.entry!.file)),n.entry!.name+' — '+vscode.l10n.t('STEP 7 changes')));
 async function attach(root:string){
  const w=new Workspace(root,backend);
  const previous=context.globalState.get<ProjectViewIndex>('projectViews',{});await context.globalState.update('projectViews',rememberProjectViews(previous,[{project:w.manifest.project,root:w.root}]));
  tree.activeRoot=w.root;
  if(!(vscode.workspace.workspaceFolders||[]).some(f=>contains(f.uri.fsPath,w.root)))vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders?.length||0,0,{uri:vscode.Uri.file(w.root)});
  await tree.discover();tree.select(w);await vscode.commands.executeCommand('step7project.tree.focus');
 }
 register('open',async()=>{
  const selected=await vscode.window.showOpenDialog({title:vscode.l10n.t('Open STEP 7 project or step7project.json'),filters:{'STEP 7 / Project View':['s7p','s7l','json']},canSelectMany:false});if(!selected)return;
  const file=selected[0].fsPath;
  if(path.basename(file).toLowerCase()==='step7project.json'){await attach(path.dirname(file));return;}
  if(!/\.s7[pl]$/i.test(file))throw Error(vscode.l10n.t('Choose a STEP 7 project or step7project.json.'));
  const index=context.globalState.get<ProjectViewIndex>('projectViews',{});
  const known=findProjectViews(file,[...tree.workspaces.map(w=>w.root),...(index[projectKey(file)]||[])]);
  if(known.length){const root=known.length===1?known[0]:await vscode.window.showQuickPick(known,{title:vscode.l10n.t('Choose a project view')});if(root)await attach(root);return;}
  const folders=await vscode.window.showOpenDialog({title:vscode.l10n.t('Choose parent folder for the editing workspace'),canSelectFiles:false,canSelectFolders:true,canSelectMany:false});if(!folders)return;
  const root=path.join(folders[0].fsPath,path.basename(selected[0].fsPath,path.extname(selected[0].fsPath))+'-code');
  if(findProjectViews(file,[root]).length){await attach(root);return;}
  await vscode.window.withProgress({location:vscode.ProgressLocation.Notification,title:vscode.l10n.t('Reading STEP 7 project')},()=>Workspace.open(selected[0].fsPath,root,backend,config().get('symbols.format','csv'),config().get('backup.mode','everySave'),config().get('awl.mnemonics','english'),config().get('projectPath.mode','relative')));
  await attach(root);
 });
 register('refresh',async(n?:Node)=>{await tree.discover();const w=await workspace(n);if(!w)return;w.merge(await w.backend.read(w.manifest.project));tree.reload();});
 async function apply(dry:boolean,n?:Node){
  const w=await workspace(n);if(!w)return;
  const dirty=vscode.workspace.textDocuments.filter(d=>d.isDirty&&d.uri.scheme==='file'&&w.manifest.entries.some(e=>inside(w.root,e.file)===d.uri.fsPath));
  for(const doc of dirty)if(!await doc.save())throw Error(vscode.l10n.t('Save failed: {0}',doc.uri.fsPath));
  w.manifest.backupMode=config().get<BackupMode>('backup.mode','everySave');w.manifest.backupDirectory=config().get('backup.directory','');w.save();
  const selection=n?.entry?[n.entry.id]:undefined;
  const changes=w.operations(selection);if(!changes.length){void vscode.window.showInformationMessage(vscode.l10n.t('No changes to apply.'));return;}
  if(!dry&&await vscode.window.showWarningMessage(vscode.l10n.t('Apply {0} changes to {1}?',changes.length,w.manifest.projectName)+'\n'+changes.map(o=>o.action+' '+o.nativeName).join('\n'),{modal:true},vscode.l10n.t('Apply'))!==vscode.l10n.t('Apply'))return;
  try{const result=await vscode.window.withProgress({location:vscode.ProgressLocation.Notification,title:dry?vscode.l10n.t('Checking changes on a project copy'):vscode.l10n.t('Applying STEP 7 changes')},()=>w.apply(dry,selection));out.appendLine(JSON.stringify(result,null,2));void vscode.window.showInformationMessage(dry?vscode.l10n.t('STEP 7 check completed.'):vscode.l10n.t('STEP 7 changes applied and verified.'));}finally{tree.reload();}
 }
 register('check',(n?:Node)=>apply(true,n));register('apply',(n?:Node)=>apply(false,n));
 register('delete',(n:Node)=>{n.workspace.delete(n.entry!.id);tree.reload();});
 register('rename',async(n:Node)=>{const name=await vscode.window.showInputBox({title:vscode.l10n.t('Rename Source'),prompt:vscode.l10n.t('Source object name (up to 24 characters). Block names and references inside the source are unchanged.'),value:n.entry!.renamed||n.entry!.nativeName,validateInput:value=>{const problem=n.workspace.renameProblem(n.entry!.id,value);return problem?vscode.l10n.t(problem):undefined;}});if(name!==undefined){n.workspace.rename(n.entry!.id,name);tree.reload();}});
 register('create',async(n?:Node)=>{
  const w=await workspace(n);if(!w)return;
  const program=await vscode.window.showQuickPick(w.manifest.programs.map(p=>({label:p.path.join(' / '),id:p.id})),{title:vscode.l10n.t('Choose a program / CPU')});if(!program)return;
  const type=await vscode.window.showQuickPick(['OB','FC','FB','DB','UDT'],{title:vscode.l10n.t('Choose block type')});if(!type)return;
  const number=await vscode.window.showInputBox({prompt:vscode.l10n.t('Block number for {0}',type),validateInput:s=>/^\d+$/.test(s)&&+s>0&&+s<=65535?null:vscode.l10n.t('Enter a number from 1 to 65535')});if(!number)return;
  const language=await vscode.window.showQuickPick(['scl','awl'],{title:vscode.l10n.t('Choose source language')});if(!language)return;
  let instance:string|undefined;if(type==='DB'){
   const dbType=await vscode.window.showQuickPick([vscode.l10n.t('Global DB'),vscode.l10n.t('Instance DB')],{title:vscode.l10n.t('Choose DB type')});if(!dbType)return;
   if(dbType===vscode.l10n.t('Instance DB')){instance=await vscode.window.showInputBox({prompt:vscode.l10n.t('Function block, for example FB 20')});if(!instance)return;}
  }
  const entry=w.create(program.id,type,+number,language as 'scl'|'awl',instance);tree.reload();await open({label:entry.name,entry,workspace:w});
 });
 register('symbolFormat',async()=>{
  const w=await workspace();if(!w)return;
  const format=await vscode.window.showQuickPick(['csv','asc'],{title:vscode.l10n.t('Choose Symbols format. Selecting the current format also simplifies legacy filenames.')});if(!format)return;
  const files=w.manifest.entries.filter(e=>e.kind==='symbols').map(e=>inside(w.root,e.file));
  const changing=format!==w.manifest.symbolsFormat||files.some(f=>/\.symbols\.(csv|asc)$/i.test(f));
  const open=vscode.window.tabGroups.all.flatMap(g=>g.tabs).some(tab=>{const input=tab.input;return (input instanceof vscode.TabInputText||input instanceof vscode.TabInputCustom)&&files.includes(input.uri.fsPath);});
  if(changing&&open)throw Error(vscode.l10n.t('Close Symbols editors before changing filenames or format. Save or discard unsaved edits first.'));
  w.switchSymbols(format as 'csv'|'asc');tree.reload();
 });
 register('restore',async()=>{const backup=await vscode.window.showOpenDialog({title:vscode.l10n.t('Select backup directory'),canSelectFiles:false,canSelectFolders:true});if(!backup)return;const destination=await vscode.window.showSaveDialog({title:vscode.l10n.t('Restore to a NEW path')});if(destination){Backups.restore(backup[0].fsPath,destination.fsPath);void vscode.window.showInformationMessage(vscode.l10n.t('Restored to {0}',destination.fsPath));}});
 const watcher=vscode.workspace.createFileSystemWatcher('**/{step7project.json,Programs/**}');let reload:NodeJS.Timeout|undefined,discoverPending=false;
 const changed=(event?:vscode.Uri|vscode.TextDocument)=>{for(const b of tree.backups.values()){try{b.manifest.backupMode=config().get<BackupMode>('backup.mode','everySave');b.manifest.backupDirectory=config().get('backup.directory','');b.observe();}catch(e){out.appendLine('Backup: '+String(e));}}if(reload)clearTimeout(reload);const uri=event instanceof vscode.Uri?event:event?.uri;if(uri&&path.basename(uri.fsPath)==='step7project.json')discoverPending=true;reload=setTimeout(()=>{if(discoverPending){discoverPending=false;void tree.discover().catch(report);}else tree.reload();},250);};
 context.subscriptions.push(watcher,watcher.onDidChange(changed),watcher.onDidCreate(changed),watcher.onDidDelete(changed),vscode.workspace.onDidSaveTextDocument(changed),vscode.workspace.onDidChangeWorkspaceFolders(()=>{void tree.discover().catch(report);}),vscode.window.onDidChangeActiveTextEditor(editor=>tree.selectFile(editor?.document.uri)),vscode.workspace.onDidChangeConfiguration(e=>{if(e.affectsConfiguration('step7project'))changed();}));
 const timer=setInterval(()=>{for(const b of tree.backups.values()){try{b.observe();}catch(e){out.appendLine('Backup: '+String(e));}}},1000);context.subscriptions.push({dispose(){clearInterval(timer);if(reload)clearTimeout(reload);}});
 await tree.discover();tree.selectFile(vscode.window.activeTextEditor?.document.uri);
 return {cli:path.resolve(context.extensionPath,'bin/step7project.cjs')};
}
