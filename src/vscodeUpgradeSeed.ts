// Seed the actual VS Code layout with the original single-view release.
import * as vscode from 'vscode';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
export async function run(){
 const extension=vscode.extensions.getExtension('step7project.step7project');assert(extension);assert.equal(extension.packageJSON.version,'0.1.0');
 await extension.activate();await vscode.commands.executeCommand('step7project.tree.focus');
 await new Promise(r=>setTimeout(r,500));
 fs.writeFileSync(path.join(vscode.workspace.workspaceFolders![0].uri.fsPath,'upgrade-seed-results.json'),JSON.stringify({version:extension.packageJSON.version,focused:'step7project.tree'}));
}
