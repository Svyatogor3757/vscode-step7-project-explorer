const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
test('localization_covers_manifest_and_runtime_strings_with_matching_parameters',()=>{
 const en=JSON.parse(fs.readFileSync('package.nls.json','utf8')),ru=JSON.parse(fs.readFileSync('package.nls.ru.json','utf8')),bundle=JSON.parse(fs.readFileSync('l10n/bundle.l10n.ru.json','utf8'));
 const p=JSON.parse(fs.readFileSync('package.json','utf8'));
 for(const [,key] of JSON.stringify(p).matchAll(/%([^%]+)%/g)){assert.equal(typeof en[key],'string',key);assert.equal(typeof ru[key],'string',key);assert.notEqual(ru[key],undefined);}
 const source=ts.createSourceFile('extension.ts',fs.readFileSync('src/extension.ts','utf8'),ts.ScriptTarget.Latest,true);
 function walk(node){if(ts.isCallExpression(node)&&node.expression.getText(source)==='vscode.l10n.t'&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0])){const key=node.arguments[0].text;assert.equal(typeof bundle[key],'string',key);assert.deepEqual([...bundle[key].matchAll(/\{\w+\}/g)].map(m=>m[0]).sort(),[...key.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort(),key);}ts.forEachChild(node,walk);}walk(source);
 assert.equal(en['command.open'],'Open Project');assert.equal(ru['command.open'],'Открыть проект');assert.equal(ru['view.explorer'],'Проводник Step 7 проекта');
});
