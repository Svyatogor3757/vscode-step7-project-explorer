// Extension Host integration tests; excluded from the distributed VSIX.
import * as vscode from 'vscode';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {Workspace} from './workspace';
import {Bridge} from './bridge';
export async function run(){
 const extension=vscode.extensions.getExtension('step7project.step7project');assert(extension);await extension.activate();
 const root=vscode.workspace.workspaceFolders![0].uri.fsPath,w=new Workspace(root,new Bridge());
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
 fs.writeFileSync(path.join(root,'ui-test-results.json'),JSON.stringify({passed:['vscode_opens_real_scl_document','vscode_save_creates_previous_version_backup','vscode_opens_symbols_custom_editor','vscode_symbols_open_as_text_uses_same_file','vscode_read_only_document_uses_content_provider','vscode_read_only_view_refreshes_after_export']},null,2));
}
