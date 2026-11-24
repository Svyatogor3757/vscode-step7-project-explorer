// Extension Host integration tests; excluded from the distributed VSIX.
import * as vscode from 'vscode';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {Workspace} from './workspace';
import {Bridge} from './bridge';
import {Projects,ProjectControls} from './extension';
export async function run(){
 const extension=vscode.extensions.getExtension('step7project.step7project');assert(extension);const api=await extension.activate();
 await vscode.commands.executeCommand('step7project.tree.focus');await vscode.commands.executeCommand('step7project.showControls');
 for(let i=0;i<50&&!api.getViewState().controls.visible;i++)await new Promise(r=>setTimeout(r,100));
 const state=api.getViewState(),russian=vscode.env.language.startsWith('ru');
 assert.equal(state.controls.visible,true);assert.equal(state.project.visible,true);assert.equal(state.project.message||'', '');
 assert.equal(state.project.title,russian?'Проект':'Project');assert.equal(state.controls.title,russian?'Управление проектом':'Project Controls');
 console.log('PASS vscode_controls_focus_reveals_group_without_project_banner');
 const workspace=vscode.workspace.workspaceFolders![0].uri.fsPath,projects=new Projects(new Bridge(),e=>{throw e;});await projects.discover();
 assert.equal(projects.workspaces.length,2);assert(projects.workspaces.every(w=>w.root.startsWith(path.join(workspace,'views'))));
 console.log('PASS vscode_discovers_nested_project_views_and_ignores_backups');
 const root=path.join(workspace,'views','code'),w=projects.workspaces.find(w=>w.root===root)!;assert(w);projects.select(w);
 const launcher=fs.readFileSync(path.join(root,'step7project.cmd'),'utf8');assert(launcher.includes('rem Step7Project generated launcher'));assert(launcher.toLowerCase().includes(process.execPath.toLowerCase()));assert(launcher.toLowerCase().includes(path.join(extension.extensionPath,'bin','step7project.cjs').toLowerCase()));
 console.log('PASS vscode_generated_launcher_uses_current_extension_host');
 const controlProvider=new ProjectControls(projects),items=controlProvider.getChildren();
 const actions=items.filter(item=>['open','refresh','apply','check','create'].includes(item.id||''));
 assert.deepEqual(actions.map(item=>item.command!.command),['step7project.open','step7project.refresh','step7project.apply','step7project.check','step7project.create']);
 const registered=await vscode.commands.getCommands();for(const item of actions){assert(registered.includes(item.command!.command));assert(item.iconPath instanceof vscode.ThemeIcon);}
 const locale=process.env.STEP7PROJECT_TEST_LOCALE||'en';assert.equal(vscode.env.language.split('-')[0],locale);
 assert.equal(actions[0].label,locale==='ru'?'Открыть проект':'Open Project');assert.equal(actions[2].label,locale==='ru'?'Применить изменения':'Apply Changes');
 const contributions=extension.packageJSON.contributes;assert.deepEqual(contributions.views.step7project.map((v:{id:string})=>v.id),['step7project.controls','step7project.tree']);
 assert.equal(contributions.views.step7project[0].name,locale==='ru'?'Управление проектом':'Project Controls');
 console.log('PASS vscode_localized_controls_are_separate_and_all_actions_are_visible');
 const settings=contributions.configuration.properties;
 assert.deepEqual(settings['step7project.backup.mode'].enum,['off','everySave','1m','10m','30m','1h']);
 assert.equal(settings['step7project.backup.mode'].enumItemLabels[1],russian?'Каждое сохранение':'Every save');
 assert.equal(settings['step7project.projectPath.mode'].enumItemLabels[0],russian?'Относительный, если возможно':'Relative when possible');
 assert.equal(settings['step7project.symbols.editor'].enumItemLabels[0],russian?'Таблица':'Table');
 assert.deepEqual(settings['step7project.interface.language'].enum,['auto','en_us','ru_ru','custom']);assert(registered.includes('step7project.chooseLanguage'));
 console.log('PASS vscode_settings_show_translated_enum_labels_and_discovered_languages');
 const configuration=vscode.workspace.getConfiguration('step7project'),priorLanguage=configuration.inspect('interface.language')?.workspaceValue,priorFile=configuration.inspect('interface.customFile')?.globalValue;
 async function setLanguage(value:string|undefined,title:string){await configuration.update('interface.language',value,vscode.ConfigurationTarget.Workspace);for(let i=0;i<50&&api.getViewState().project.title!==title;i++)await new Promise(r=>setTimeout(r,100));assert.equal(api.getViewState().project.title,title);}
 try{
  await setLanguage('en_us','Project');assert.equal(controlProvider.getChildren().find(item=>item.id==='open')!.label,'Open Project');
  await setLanguage('ru_ru','Проект');assert.equal(controlProvider.getChildren().find(item=>item.id==='open')!.label,'Открыть проект');
  const customFile=path.join(workspace,'interface_de_de.json');fs.writeFileSync(customFile,JSON.stringify({name:'Deutsch test',vscodeLocale:'de',messages:{Project:'Projekt test'}}));
  await configuration.update('interface.customFile',customFile,vscode.ConfigurationTarget.Global);await setLanguage('custom','Projekt test');
  assert.equal(controlProvider.getChildren().find(item=>item.id==='refresh')!.label,'Refresh');
 }finally{await configuration.update('interface.customFile',priorFile,vscode.ConfigurationTarget.Global);await setLanguage(priorLanguage as string|undefined,russian?'Проект':'Project');}
 console.log('PASS vscode_language_override_and_partial_custom_translation_refresh_live');
 const native=items.find(item=>item.id==='native')!,representation=items.find(item=>item.id==='representation')!;
 assert.equal(native.tooltip,w.manifest.project);assert.equal(native.command!.arguments![0].workspace.root,w.root);assert.equal(native.command!.command,'step7project.revealNative');
 assert.equal(representation.tooltip,w.root);assert.equal(representation.command!.command,'step7project.revealView');
 const clipboard=await vscode.env.clipboard.readText();
 try {
  await vscode.commands.executeCommand('step7project.copyLocation',native);assert.equal(await vscode.env.clipboard.readText(),w.manifest.project);
  await vscode.commands.executeCommand('step7project.copyRelativeLocation',native);assert.equal(await vscode.env.clipboard.readText(),path.relative(w.root,w.manifest.project));
  await vscode.commands.executeCommand('step7project.copyRelativeLocation',representation);assert.equal(await vscode.env.clipboard.readText(),'.');
 }finally{await vscode.env.clipboard.writeText(clipboard);}
 assert.equal(native.contextValue,'location.native');assert.equal(representation.contextValue,'location.view');
 for(const command of ['copyLocation','copyRelativeLocation','revealLocation','revealLocationInWorkspace'])assert(contributions.menus['view/item/context'].some((item:{command:string})=>item.command==='step7project.'+command));
 console.log('PASS vscode_project_location_context_menu_copies_correct_paths');
 const second=projects.workspaces.find(other=>other.root!==w.root)!,secondFile=path.join(second.root,second.manifest.entries[0].file);
 projects.selectFile(vscode.Uri.file(secondFile));assert.equal(projects.active!.root,second.root);assert.equal(controlProvider.getChildren().find(i=>i.id==='representation')!.tooltip,second.root);
 projects.select(w);projects.reload();assert.equal(projects.active!.root,w.root);
 console.log('PASS vscode_active_project_controls_show_native_and_view_locations');
 const source=w.manifest.entries.find(e=>e.kind==='source')!,symbols=w.manifest.entries.find(e=>e.kind==='symbols')!,ro=w.manifest.entries.find(e=>e.readOnly)!;
 const node=(entry:typeof source)=>({label:entry.name,entry,workspace:w});
 const file=path.join(root,source.file),before=fs.readFileSync(file,'utf8');
 await vscode.commands.executeCommand('step7project.text',node(source));
 let document=vscode.window.activeTextEditor!.document;
 assert.equal(document.uri.fsPath,file);assert.equal(document.getText(),before);assert.equal(document.languageId,'step7-scl');
 console.log('PASS vscode_opens_real_scl_document');
 const edit=new vscode.WorkspaceEdit();edit.insert(document.uri,new vscode.Position(0,0),'// Extension Host save\n');assert.equal(await vscode.workspace.applyEdit(edit),true);assert.equal(await document.save(),true);
 assert.equal(fs.readFileSync(file,'utf8'),'// Extension Host save\n'+before);
 const backups=path.join(root,'.step7project/backups/files');let oldSaved=false;
 for(let i=0;i<50;i++){if(fs.existsSync(backups))oldSaved=fs.readdirSync(backups).some(d=>fs.readFileSync(path.join(backups,d,'content'),'utf8')===before);if(oldSaved)break;await new Promise(r=>setTimeout(r,100));}
 assert.equal(oldSaved,true);console.log('PASS vscode_save_creates_previous_version_backup');
 await vscode.commands.executeCommand('step7project.openEntry',node(symbols));
 assert(vscode.window.tabGroups.all.flatMap(g=>g.tabs).some(t=>t.input instanceof vscode.TabInputCustom&&t.input.viewType==='step7project.symbols'));
 assert.equal(fs.readFileSync(path.join(root,symbols.file),'utf8').split('\r\n')[0],'symbol,address,type,comment');
 console.log('PASS vscode_opens_symbols_custom_editor');
 await vscode.commands.executeCommand('step7project.text',node(symbols));document=vscode.window.activeTextEditor!.document;assert.equal(document.uri.fsPath,path.join(root,symbols.file));
 console.log('PASS vscode_symbols_open_as_text_uses_same_file');
 await vscode.commands.executeCommand('step7project.openEntry',node(ro));document=vscode.window.activeTextEditor!.document;
 assert.equal(document.uri.scheme,'step7-readonly');assert.equal(document.getText(),'// protected interface\n');
 console.log('PASS vscode_read_only_document_uses_content_provider');
 const readonlyFile=path.join(root,ro.file);fs.chmodSync(readonlyFile,0o666);fs.writeFileSync(readonlyFile,'// Обновлённый интерфейс\n');
 for(let i=0;i<50&&document.getText()!=='// Обновлённый интерфейс\n';i++)await new Promise(r=>setTimeout(r,100));
 assert.equal(document.getText(),'// Обновлённый интерфейс\n');console.log('PASS vscode_read_only_view_refreshes_after_export');
 await vscode.commands.executeCommand('workbench.action.closeAllEditors');
 const initialFolders=vscode.workspace.workspaceFolders!.map(folder=>folder.uri.fsPath),nativeFolder=path.dirname(w.manifest.project);
 const nativeNavigation=await vscode.commands.executeCommand<{folder:string}>('step7project.revealNative',{workspace:w});
 assert.equal(nativeNavigation!.folder,nativeFolder);assert(vscode.workspace.workspaceFolders!.some(folder=>folder.uri.fsPath===nativeFolder));assert.deepEqual(vscode.workspace.workspaceFolders!.slice(0,initialFolders.length).map(f=>f.uri.fsPath),initialFolders);
 const parentNavigation=await vscode.commands.executeCommand<{folder:string}>('step7project.revealView',{workspace:w});assert.equal(parentNavigation!.folder,workspace);
 assert.equal(api.getViewState().project.visible,false);
 console.log('PASS vscode_native_and_view_links_open_explorer_and_keep_existing_roots');
 async function changeFolders(start:number,remove:number,root?:string){await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{subscription.dispose();reject(Error('Workspace change timed out'));},10000),subscription=vscode.workspace.onDidChangeWorkspaceFolders(()=>{clearTimeout(timer);subscription.dispose();resolve();});if(!vscode.workspace.updateWorkspaceFolders(start,remove,...(root?[{uri:vscode.Uri.file(root)}]:[]))){clearTimeout(timer);subscription.dispose();reject(Error('Workspace change rejected'));}});}
 await changeFolders(vscode.workspace.workspaceFolders!.length,0,w.root);
 const specificNavigation=await vscode.commands.executeCommand<{folder:string}>('step7project.revealView',{workspace:w});assert.equal(specificNavigation!.folder,w.root);assert.equal(vscode.workspace.getWorkspaceFolder(vscode.Uri.file(w.root))!.uri.fsPath,w.root);
 console.log('PASS vscode_view_link_reuses_more_specific_workspace_root');
 await changeFolders(vscode.workspace.workspaceFolders!.findIndex(folder=>folder.uri.fsPath===w.root),1);
 const parentAgain=await vscode.commands.executeCommand<{folder:string}>('step7project.revealView',{workspace:w});assert.equal(parentAgain!.folder,workspace);assert(api.getViewState().roots.includes(w.root));
 console.log('PASS vscode_removing_specific_root_keeps_project_under_open_parent');
 const detachedRoot=path.join(path.dirname(workspace),'detached-code'),detached=new Workspace(detachedRoot,new Bridge());
 await vscode.commands.executeCommand('step7project.revealView',{workspace:detached});assert.equal(api.getViewState().activeRoot,detachedRoot);
 const detachedIndex=vscode.workspace.workspaceFolders!.findIndex(folder=>folder.uri.fsPath===detachedRoot);assert(detachedIndex>0);await changeFolders(detachedIndex,1);
 for(let i=0;i<50&&api.getViewState().roots.includes(detachedRoot);i++)await new Promise(r=>setTimeout(r,100));
 assert.notEqual(api.getViewState().activeRoot,detachedRoot);assert(!api.getViewState().roots.includes(detachedRoot));assert.deepEqual([...api.getViewState().roots].sort(),[...projects.workspaces.map(w=>w.root)].sort());
 const restoredNavigation=await vscode.commands.executeCommand<{folder:string}>('step7project.revealView',{workspace:detached});assert.equal(restoredNavigation!.folder,detachedRoot);assert(vscode.workspace.workspaceFolders!.some(folder=>folder.uri.fsPath===detachedRoot));
 console.log('PASS vscode_removed_view_folder_closes_connection_and_explicit_open_reconnects');
 await vscode.commands.executeCommand('workbench.action.closeAllEditors');
 controlProvider.dispose();projects.dispose();
 fs.writeFileSync(path.join(workspace,'ui-test-results.json'),JSON.stringify({locale,passed:['vscode_settings_show_translated_enum_labels_and_discovered_languages','vscode_language_override_and_partial_custom_translation_refresh_live','vscode_controls_focus_reveals_group_without_project_banner','vscode_discovers_nested_project_views_and_ignores_backups','vscode_generated_launcher_uses_current_extension_host','vscode_localized_controls_are_separate_and_all_actions_are_visible','vscode_active_project_controls_show_native_and_view_locations','vscode_project_location_context_menu_copies_correct_paths','vscode_opens_real_scl_document','vscode_save_creates_previous_version_backup','vscode_opens_symbols_custom_editor','vscode_symbols_open_as_text_uses_same_file','vscode_read_only_document_uses_content_provider','vscode_read_only_view_refreshes_after_export','vscode_native_and_view_links_open_explorer_and_keep_existing_roots','vscode_view_link_reuses_more_specific_workspace_root','vscode_removing_specific_root_keeps_project_under_open_parent','vscode_removed_view_folder_closes_connection_and_explicit_open_reconnects']},null,2));
}
