const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {projectKey,projectReference,rememberProjectViews,findProjectViews}=require('../dist/projectViews');
test('project_view_index_reconnects_only_matching_manifests_and_preserves_multiple_views',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'spb-view-index-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const project=path.join(root,'native','Demo.s7p');
 const views=['first','second','foreign','broken','missing'].map(name=>path.join(root,name));
 for(const view of views.slice(0,4))fs.mkdirSync(view);
 for(const view of views.slice(0,2))fs.writeFileSync(path.join(view,'step7project.json'),JSON.stringify({schema:1,project}));
 fs.writeFileSync(path.join(views[2],'step7project.json'),JSON.stringify({schema:1,project:path.join(root,'other.s7p')}));fs.writeFileSync(path.join(views[3],'step7project.json'),'{bad json');
 const original={unknown:['keep this record']};const index=rememberProjectViews(original,[{project,root:views[0]},{project,root:views[1]},{project,root:views[0]}]);
 assert.deepEqual(index[projectKey(project)],views.slice(0,2));assert.deepEqual(index.unknown,['keep this record']);assert.deepEqual(original,{unknown:['keep this record']});
 assert.deepEqual(findProjectViews(project,[...views,views[0]]),views.slice(0,2));
 fs.writeFileSync(path.join(views[1],'step7project.json'),JSON.stringify({schema:99,project}));assert.deepEqual(findProjectViews(project,index[projectKey(project)]),[views[0]]);
});
test('project_view_index_resolves_relative_references_and_cross_drive_falls_back_to_absolute',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'spb-relative-index-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const project=path.join(root,'native','Demo.s7p'),view=path.join(root,'code');fs.mkdirSync(view);
 fs.writeFileSync(path.join(view,'step7project.json'),JSON.stringify({schema:2,project:'../native/Demo.s7p'}));assert.deepEqual(findProjectViews(project,[view]),[view]);
 assert.equal(projectReference(project,view,'relative'),'../native/Demo.s7p');assert.equal(projectReference(project,view,'absolute'),project);
 if(process.platform==='win32')assert.equal(projectReference('Z:\\Native\\Demo.s7p','C:\\Code','relative'),'Z:\\Native\\Demo.s7p');
});
