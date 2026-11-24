const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),path=require('node:path'),os=require('node:os');
const {loadCatalog,readLanguage,selectLanguage,translate}=require('../language/catalog.cjs');
const {generate}=require('../tools/generate-language.cjs');
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'SPB-language-'));t.after(()=>{assert.equal(path.dirname(root),os.tmpdir());fs.rmSync(root,{recursive:true,force:true});});fs.mkdirSync(path.join(root,'language'));for(const code of ['en_us','ru_ru'])fs.copyFileSync(`language/interface_${code}.json`,path.join(root,`language/interface_${code}.json`));fs.copyFileSync('package.json',path.join(root,'package.json'));return root;}
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const write=(file,data)=>fs.writeFileSync(file,JSON.stringify(data));
test('localization_covers_manifest_and_runtime_strings_with_matching_parameters',()=>{
 const en=read('package.nls.json'),ru=read('package.nls.ru.json'),bundle=read('language/interface_ru_ru.json').messages,english=read('language/interface_en_us.json').messages;
 const p=JSON.parse(fs.readFileSync('package.json','utf8'));
 for(const [,key] of JSON.stringify(p).matchAll(/%([^%]+)%/g)){assert.equal(typeof en[key],'string',key);assert.equal(typeof ru[key],'string',key);assert.notEqual(ru[key],undefined);}
 const source=ts.createSourceFile('extension.ts',fs.readFileSync('src/extension.ts','utf8'),ts.ScriptTarget.Latest,true);
 function walk(node){if(ts.isCallExpression(node)&&node.expression.getText(source)==='i18n.t'&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0])){const key=node.arguments[0].text;assert.equal(typeof bundle[key],'string',key);assert.equal(typeof english[key],'string',key);assert.deepEqual([...bundle[key].matchAll(/\{\w+\}/g)].map(m=>m[0]).sort(),[...key.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort(),key);}ts.forEachChild(node,walk);}walk(source);
 assert.equal(en['command.open'],'Open Project');assert.equal(ru['command.open'],'Открыть проект');assert.equal(ru['view.explorer'],'Проводник Step 7 проекта');
 for(const command of ['copyLocation','copyRelativeLocation','revealLocation']){
  const menu=p.contributes.menus['view/item/context'].find(item=>item.command==='step7project.'+command),pattern=/viewItem =~ \/(.+)\//.exec(menu.when);assert(pattern,command);
  const regex=new RegExp(pattern[1]);assert(regex.test('location.native'),command);assert(regex.test('location.view'),command);assert(!regex.test('file'),command);
 }
});
test('languages_generate_settings_from_discovered_files',t=>{
 const root=fixture(t),directory=path.join(root,'language');
 write(path.join(directory,'interface_de_de.json'),{name:'Deutsch',vscodeLocale:'de',manifest:{'command.open':'Projekt öffnen'},messages:{Project:'Projekt'}});
 write(path.join(directory,'unrelated.json'),{});
 const result=generate(root),manifest=read(path.join(root,'package.json')),setting=manifest.contributes.configuration.properties['step7project.interface.language'];
 assert.deepEqual(result.languages,['de_de','en_us','ru_ru']);assert.deepEqual(setting.enum,['auto','de_de','en_us','ru_ru','custom']);assert.equal(setting.default,'auto');
 const de=read(path.join(root,'package.nls.de.json'));assert.equal(de['command.open'],'Projekt öffnen');assert.equal(de['command.refresh'],'Refresh');assert.equal(de['language.name.de_de'],'Deutsch (de_de)');
 const catalog=loadCatalog(directory);assert.deepEqual(catalog.errors,[]);assert.equal(translate(selectLanguage(catalog.languages,'auto','de-DE'),'Project'),'Projekt');assert.equal(translate(selectLanguage(catalog.languages,'auto','de-DE'),'Refresh'),'Refresh');
});
test('languages_translate_setting_labels_without_changing_stored_values',()=>{
 const properties=read('package.json').contributes.configuration.properties,ru=read('package.nls.ru.json');
 assert.deepEqual(properties['step7project.backup.mode'].enum,['off','everySave','1m','10m','30m','1h']);assert.deepEqual(properties['step7project.projectPath.mode'].enum,['relative','absolute']);
 for(const [key,setting]of Object.entries(properties))if(setting.enum){assert.equal(setting.enumItemLabels.length,setting.enum.length,key);for(const ref of setting.enumItemLabels){assert.match(ref,/^%[^%]+%$/);assert.equal(typeof ru[ref.slice(1,-1)],'string',key);}}
 assert.equal(ru[properties['step7project.backup.mode'].enumItemLabels[1].slice(1,-1)],'Каждое сохранение');assert.equal(ru[properties['step7project.symbols.editor'].enumItemLabels[0].slice(1,-1)],'Таблица');
});
test('languages_select_environment_region_override_and_english_fallback',()=>{
 const {languages,errors}=loadCatalog('language');assert.deepEqual(errors,[]);
 for(const [selection,environment,expected]of [['auto','ru-RU','ru_ru'],['auto','ru','ru_ru'],['auto','en-GB','en_us'],['auto','fr-FR','en_us'],['en_us','ru','en_us'],['ru_ru','en','ru_ru'],['invalid','ru','en_us']])assert.equal(selectLanguage(languages,selection,environment).code,expected);
 assert.equal(selectLanguage([],'auto','ru'),undefined);
});
test('languages_partial_translation_uses_standard_english_per_key',t=>{
 const root=fixture(t),english=read(path.join(root,'language/interface_en_us.json'));english.messages.Refresh='Standard refresh';write(path.join(root,'language/interface_en_us.json'),english);
 const file=path.join(root,'language/interface_de_de.json');write(file,{name:'Deutsch',vscodeLocale:'de',messages:{Project:'Projekt','Restored to {0}':'Wiederhergestellt: {0}'}});
 const language=readLanguage(file,readLanguage(path.join(root,'language/interface_en_us.json')));
 assert.equal(translate(language,'Project'),'Projekt');assert.equal(translate(language,'Refresh'),'Standard refresh');assert.equal(translate(language,'Restored to {0}','D:/$&/{1}'),'Wiederhergestellt: D:/$&/{1}');assert.equal(translate(language,'Unknown {0}',123),'Unknown 123');
 const result=loadCatalog(path.join(root,'language'));assert.deepEqual(result.errors,[]);assert.equal(translate(selectLanguage(result.languages,'auto','de'),'Refresh'),'Standard refresh');
});
for(const [name,filename,data,pattern]of [
 ['invalid_code','interface_DE_DE.json',{name:'X',vscodeLocale:'de'},/lowercase/],
 ['invalid_locale','interface_de_de.json',{name:'X',vscodeLocale:'../de'},/vscodeLocale/],
 ['empty_name','interface_de_de.json',{name:' ',vscodeLocale:'de'},/name/],
 ['invalid_section','interface_de_de.json',{name:'X',vscodeLocale:'de',messages:[]},/Missing object/],
 ['empty_message','interface_de_de.json',{name:'X',vscodeLocale:'de',messages:{Project:''}},/nonempty/],
 ['missing_placeholder','interface_de_de.json',{name:'X',vscodeLocale:'de',messages:{'Restored to {0}':'Restored'}},/placeholders/],
 ['repeated_placeholder','interface_de_de.json',{name:'X',vscodeLocale:'de',messages:{'Restored to {0}':'{0} {0}'}},/placeholders/]
])test('languages_reject_'+name,t=>{const root=fixture(t),directory=path.join(root,'language');write(path.join(directory,filename),data);const result=loadCatalog(directory);assert.equal(result.errors.length,1);assert.match(result.errors[0],pattern);assert.deepEqual(result.languages.map(language=>language.code),['en_us','ru_ru']);assert.throws(()=>generate(root),pattern);});
test('languages_reject_malformed_json_and_duplicate_native_locale',t=>{
 const root=fixture(t),file=path.join(root,'language/interface_de_de.json');fs.writeFileSync(file,'{ broken');assert.equal(loadCatalog(path.dirname(file)).errors.length,1);assert.throws(()=>generate(root),/interface_de_de/);
 write(file,{name:'Duplicate',vscodeLocale:'ru'});assert.match(loadCatalog(path.dirname(file)).errors.join('\n'),/Duplicate vscodeLocale/);assert.throws(()=>generate(root),/Duplicate vscodeLocale/);
});
test('languages_require_english_and_missing_directory_is_reported',t=>{
 const root=fixture(t);fs.unlinkSync(path.join(root,'language/interface_en_us.json'));const before=fs.readFileSync(path.join(root,'package.json'));
 assert.throws(()=>generate(root),/interface_en_us.json is required/);assert.deepEqual(fs.readFileSync(path.join(root,'package.json')),before);assert.equal(loadCatalog(path.join(root,'absent')).errors.length,1);
});
test('languages_remove_only_stale_generated_files_and_reject_unsafe_index',t=>{
 const root=fixture(t);generate(root);write(path.join(root,'package.nls.manual.json'),{keep:true});fs.unlinkSync(path.join(root,'language/interface_ru_ru.json'));generate(root);
 assert.equal(fs.existsSync(path.join(root,'package.nls.ru.json')),false);assert.deepEqual(read(path.join(root,'package.nls.manual.json')),{keep:true});assert.deepEqual(read(path.join(root,'package.json')).contributes.configuration.properties['step7project.interface.language'].enum,['auto','en_us','custom']);
 write(path.join(root,'language/generated.json'),['../escape.json']);assert.throws(()=>generate(root),/Invalid generated localization index/);
});
test('languages_runtime_custom_file_supports_partial_translation_and_invalid_file_fallback',t=>{
 const root=fixture(t),runtime=require('../dist/localization'),file=path.join(root,'language/interface_de_de.json');
 write(file,{name:'Deutsch',vscodeLocale:'de',messages:{Project:'Projekt'}});
 assert.equal(runtime.configureLanguage(root,'custom','ru',file).active,'de_de');assert.equal(runtime.t('Project'),'Projekt');assert.equal(runtime.t('Refresh'),'Refresh');
 const result=runtime.configureLanguage(root,'custom','ru',path.join(root,'absent.json'));assert.equal(result.active,'en_us');assert.equal(result.errors.length,1);assert.equal(runtime.t('Project'),'Project');
 assert.equal(runtime.configureLanguage(root,'ru_ru','en').active,'ru_ru');assert.equal(runtime.t('Project'),'Проект');assert.equal(runtime.configureLanguage(root,'auto','en').active,'en_us');
});
test('languages_import_preserves_partial_file_bytes_and_discovers_saved_translation',async t=>{
 const root=fixture(t),runtime=require('../dist/localization'),file=path.join(root,'language/interface_de_de.json'),directory=path.join(root,'user-language');
 fs.writeFileSync(file,'\uFEFF'+JSON.stringify({name:'Deutsch',vscodeLocale:'de',messages:{Project:'Projekt'}})+'\r\n');
 const imported=await runtime.importLanguage(file,directory,root,async()=>assert.fail('No overwrite confirmation for a new file'));
 assert.equal(imported.file,path.join(directory,'interface_de_de.json'));assert.deepEqual(fs.readFileSync(imported.file),fs.readFileSync(file));
 const saved=runtime.userLanguages(directory,root);assert.deepEqual(saved.errors,[]);assert.deepEqual(saved.languages.map(language=>language.code),['de_de']);
 assert.equal(runtime.configureLanguage(root,'custom','ru',imported.file).active,'de_de');assert.equal(runtime.t('Project'),'Projekt');assert.equal(runtime.t('Refresh'),'Refresh');
 await runtime.importLanguage(imported.file,directory,root,async()=>assert.fail('Same file must not prompt'));
});
test('languages_import_cancel_preserves_saved_file_and_confirm_replaces_it',async t=>{
 const root=fixture(t),runtime=require('../dist/localization'),file=path.join(root,'language/interface_de_de.json'),directory=path.join(root,'user-language');
 write(file,{name:'Deutsch',vscodeLocale:'de',messages:{Project:'Alt'}});const initial=await runtime.importLanguage(file,directory,root,async()=>true);const before=fs.readFileSync(initial.file);
 write(file,{name:'Deutsch',vscodeLocale:'de',messages:{Project:'Neu'}});let asked=0;
 assert.equal(await runtime.importLanguage(file,directory,root,async language=>{asked++;assert.equal(language.code,'de_de');return false;}),undefined);assert.equal(asked,1);assert.deepEqual(fs.readFileSync(initial.file),before);
 await runtime.importLanguage(file,directory,root,async()=>true);assert.deepEqual(fs.readFileSync(initial.file),fs.readFileSync(file));
});
test('languages_invalid_import_does_not_create_saved_translation',async t=>{
 const root=fixture(t),runtime=require('../dist/localization'),file=path.join(root,'language/interface_de_de.json'),directory=path.join(root,'user-language');
 write(file,{name:'Deutsch',vscodeLocale:'de',messages:{'Restored to {0}':'Missing argument'}});
 await assert.rejects(()=>runtime.importLanguage(file,directory,root,async()=>assert.fail('Invalid file must not prompt')),/placeholders/);assert.equal(fs.existsSync(directory),false);
});
