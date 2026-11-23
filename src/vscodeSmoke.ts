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
 controlProvider.dispose();projects.dispose();
 fs.writeFileSync(path.join(workspace,'ui-test-results.json'),JSON.stringify({locale,passed:['vscode_controls_focus_reveals_group_without_project_banner','vscode_discovers_nested_project_views_and_ignores_backups','vscode_generated_launcher_uses_current_extension_host','vscode_localized_controls_are_separate_and_all_actions_are_visible','vscode_active_project_controls_show_native_and_view_locations','vscode_project_location_context_menu_copies_correct_paths','vscode_opens_real_scl_document','vscode_save_creates_previous_version_backup','vscode_opens_symbols_custom_editor','vscode_symbols_open_as_text_uses_same_file','vscode_read_only_document_uses_content_provider','vscode_read_only_view_refreshes_after_export']},null,2));
}
