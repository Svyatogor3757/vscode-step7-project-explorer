const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const {Workspace}=require('../dist/workspace'),{toAsc}=require('../dist/symbols'),{hash}=require('../dist/storage');
(async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'SPB-vscode-')),native=path.join(temp,'native');fs.mkdirSync(native);const project=path.join(native,'ui.s7p');fs.writeFileSync(project,'UI fixture');
 const program={id:'Станция 1\\CPU 317\\S7 Программа',name:'S7 Программа',path:['Станция 1','CPU 317','S7 Программа']};
 const item=(kind,name,content,extra={})=>({id:program.id+'|'+kind+'|'+name,program:program.id,kind,name,nativeName:name,blockType:kind==='source'?'scl':'FC',language:kind==='source'?'scl':'AWL',content,version:hash(content),readOnly:false,...extra});
 const snapshot={name:'UI test',encoding:1251,programs:[program],items:[item('source','Main','FUNCTION FC1 : VOID\nBEGIN\nEND_FUNCTION\n'),item('symbols','Symbols',toAsc([{symbol:'Signal',address:'M 0.0',type:'BOOL',comment:'UI test'}])),item('block','FC2','// protected interface\n',{readOnly:true,reason:'Protected'})]};
 await Workspace.open(project,path.join(temp,'code'),{read:async()=>snapshot});
 const root=path.resolve(__dirname,'..');console.log('VSCODE_TEST_ROOT='+temp);
 const args=['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(root,'tools/run-vscode.ps1'),'-CodePath','C:/Program Files/Microsoft VS Code/Code.exe','-WorkspacePath',path.join(temp,'code'),'-TestsPath',path.join(root,'dist/vscodeSmoke.js'),'-ExtensionPath',root,'-UserData',path.join(temp,'profile')];
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const result=spawnSync('powershell.exe',args,{stdio:'inherit',env});
 if(result.status!==0)process.exit(result.status||1);
 const report=JSON.parse(fs.readFileSync(path.join(temp,'code/ui-test-results.json'),'utf8'));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
