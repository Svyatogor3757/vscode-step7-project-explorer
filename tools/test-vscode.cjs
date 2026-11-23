const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const {Workspace}=require('../dist/workspace'),{toAsc}=require('../dist/symbols'),{hash}=require('../dist/storage');
(async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'SPB-vscode-')),native=path.join(temp,'native');fs.mkdirSync(native);const project=path.join(native,'ui.s7p');fs.writeFileSync(project,'UI fixture');
 const program={id:'Станция 1\\CPU 317\\S7 Программа',name:'S7 Программа',path:['Станция 1','CPU 317','S7 Программа']};
 const item=(kind,name,content,extra={})=>({id:program.id+'|'+kind+'|'+name,program:program.id,kind,name,nativeName:name,blockType:kind==='source'?'scl':'FC',language:kind==='source'?'scl':'AWL',content,version:hash(content),readOnly:false,...extra});
 const snapshot={name:'UI test',encoding:1251,programs:[program],items:[item('source','Main','FUNCTION FC1 : VOID\nBEGIN\nEND_FUNCTION\n'),item('symbols','Symbols',toAsc([{symbol:'Signal',address:'M 0.0',type:'BOOL',comment:'UI test'}])),item('block','FC2','// protected interface\n',{readOnly:true,reason:'Protected'})]};
 const workspace=path.join(temp,'projects');fs.mkdirSync(workspace);const backend={read:async()=>snapshot};
 await Workspace.open(project,path.join(workspace,'views','code'),backend);
 const second=path.join(temp,'second-native');fs.mkdirSync(second);const secondProject=path.join(second,'second.s7p');fs.writeFileSync(secondProject,'Second fixture');
 await Workspace.open(secondProject,path.join(workspace,'views','second-code'),{read:async()=>({...snapshot,name:'Second project'})});
 await Workspace.open(project,path.join(workspace,'.step7project','hidden-code'),backend);
 const root=path.resolve(__dirname,'..');console.log('VSCODE_TEST_ROOT='+temp);
 const locale=process.argv.includes('--ru')?'ru':'en';
 if(locale==='ru'){
  const registered=path.join(process.env.APPDATA,'Code','languagepacks.json');
  if(!fs.existsSync(registered))throw Error('Install the VS Code Russian language pack before running --ru');
  const packs=JSON.parse(fs.readFileSync(registered,'utf8'));if(!packs.ru)throw Error('Russian language pack is not registered');
  fs.mkdirSync(path.join(temp,'profile'),{recursive:true});fs.writeFileSync(path.join(temp,'profile','languagepacks.json'),JSON.stringify({ru:packs.ru}));
 }
 const args=['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(root,'tools/run-vscode.ps1'),'-CodePath','C:/Program Files/Microsoft VS Code/Code.exe','-WorkspacePath',workspace,'-TestsPath',path.join(root,'dist/vscodeSmoke.js'),'-ExtensionPath',root,'-UserData',path.join(temp,'profile'),'-Locale',locale];
 const env={...process.env,STEP7PROJECT_TEST_LOCALE:locale};delete env.ELECTRON_RUN_AS_NODE;
 const result=spawnSync('powershell.exe',args,{stdio:'inherit',env});
 if(result.status!==0)process.exit(result.status||1);
 const report=JSON.parse(fs.readFileSync(path.join(workspace,'ui-test-results.json'),'utf8'));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
