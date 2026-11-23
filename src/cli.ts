import path from 'node:path';
import fs from 'node:fs';
import {Workspace} from './workspace';
import {Bridge} from './bridge';
import {Backups} from './backups';
import {intervals} from './backups';
export async function main(args=process.argv.slice(2)){
 const command=args.shift()||'help',options:Record<string,string>={};
 while(args.length){const key=args.shift()!;if(!key.startsWith('--'))throw Error('Expected --option, got '+key);options[key.slice(2)]=args.length&&!args[0].startsWith('--')?args.shift()!:'true';}
 const specific:Record<string,string[]>={help:[],doctor:['mnemonics'],export:['project','format','mnemonics','project-path'],status:[],refresh:[],check:['file'],apply:['file'],create:['program','type','number','language','instance-of'],delete:['file'],rename:['file','name'],'symbols-format':['format'],backups:[],restore:['backup','destination'],configure:['backup-mode','backup-directory','mnemonics','project-path'],recover:['acknowledge-native-state']};
 if(!Object.hasOwn(specific,command))throw Error('Unknown command: '+command);
 for(const key of Object.keys(options))if(!['workspace','backend','json',...specific[command]].includes(key))throw Error(`Unknown option --${key} for ${command}. Use check for a dry run.`);
 if(options.language&&!['scl','awl'].includes(options.language))throw Error('Language must be scl or awl');
 if(options.format&&!['csv','asc'].includes(options.format))throw Error('Format must be csv or asc');
 if(options.mnemonics&&!['english','german'].includes(options.mnemonics))throw Error('Mnemonics must be english or german');
 if(options['project-path']&&!['relative','absolute'].includes(options['project-path']))throw Error('Project path mode must be relative or absolute');
 const bridge=new Bridge(options.backend,options.mnemonics==='german'?'german':'english'),root=path.resolve(options.workspace||'.');let result:unknown;
 const required=(key:string)=>{if(!options[key])throw Error('--'+key+' is required');return options[key];};
 if(command==='help'){return {usage:'step7project <doctor|export|status|refresh|check|apply|create|delete|rename|symbols-format|backups|restore|configure|recover> --workspace <folder> [--json]',examples:['export --project C:/Projects/Demo/Demo.s7p --workspace C:/Code/Demo','create --program "Station\\CPU\\Program" --type FC --number 901 --language scl','delete --file Programs/.../FC901.awl','check','apply'],note:'check compiles changes on a disposable copy; apply repeats staging and then writes the native project. Native operations require Windows/STEP 7.'};}
 if(command==='doctor')return bridge.doctor();
 if(command==='export')return {workspace:(await Workspace.open(required('project'),root,bridge,options.format==='asc'?'asc':'csv','everySave',options.mnemonics==='german'?'german':'english',options['project-path']==='absolute'?'absolute':'relative')).root};
 if(command==='restore'){Backups.restore(required('backup'),path.resolve(required('destination')));return {restored:options.destination};}
 const w=new Workspace(root,bridge);
 switch(command){
  case 'status': result={project:w.manifest.project,workspace:w.root,projectPathMode:w.manifest.projectPathMode,recovery:w.manifest.recovery,awlMnemonics:w.manifest.awlMnemonics||'english',programs:w.manifest.programs,changes:w.status().map(c=>({file:c.entry.file,id:c.entry.id,kind:c.entry.kind,state:c.state,readOnly:c.entry.readOnly,canDelete:c.entry.canDelete??(!c.entry.readOnly&&c.entry.kind!=='symbols'),reason:c.entry.reason}))};break;
  case 'refresh': w.merge(await w.backend.read(w.manifest.project));result={refreshed:true};break;
  case 'check': result=await w.apply(true,options.file?[options.file]:undefined);break;
  case 'apply': result=await w.apply(false,options.file?[options.file]:undefined);break;
  case 'create': result=w.create(required('program'),required('type'),Number(required('number')),options.language==='awl'?'awl':'scl',options['instance-of']);break;
  case 'delete': w.delete(required('file'));result={pendingDelete:options.file};break;
  case 'rename': w.rename(required('file'),required('name'));result={pendingRename:options.name};break;
  case 'symbols-format':{const f=required('format');if(f!=='csv'&&f!=='asc')throw Error('Format must be csv or asc');w.switchSymbols(f);result={format:f};break;}
  case 'backups': result={directory:new Backups(root,w.manifest).directory};break;
  case 'configure': if(options.mnemonics){if(w.status().some(c=>c.state!=='unchanged'))throw Error('Apply or revert local changes before switching AWL mnemonics');w.manifest.awlMnemonics=options.mnemonics as 'english'|'german';}if(options['backup-mode']){if(!Object.hasOwn(intervals,options['backup-mode']))throw Error('Invalid backup mode');w.manifest.backupMode=options['backup-mode'] as keyof typeof intervals;}if(Object.hasOwn(options,'backup-directory'))w.manifest.backupDirectory=options['backup-directory'];if(options['project-path'])w.manifest.projectPathMode=options['project-path'] as 'relative'|'absolute';w.save();result={configured:true};break;
  case 'recover': {
   if(!w.manifest.recovery)throw Error('No recovery state');
   if(options['acknowledge-native-state']!=='true')throw Error('Inspect native project and restore if needed, then use --acknowledge-native-state. This does not restore or discard edits.');
   const snapshot=await w.backend.read(w.manifest.project);delete w.manifest.recovery;
   // Rebase version checks only; local edits remain visible and must be reviewed before applying again.
   for(const e of w.manifest.entries){const i=snapshot.items.find(i=>i.id===e.id);if(i){e.version=i.version;e.revision=i.revision;}}
   w.save();result={recoveryAcknowledged:true};break;
  }
  default: throw Error('Unknown command: '+command);
 }
 return result;
}
