const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {ProjectNavigator,containingFolder}=require('../dist/navigation');
function fixture(t){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'spb-navigation-'));t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
 const folder=path.join(temp,'Native project'),view=path.join(temp,'View'),other=path.join(temp,'Other');for(const dir of [folder,view,other])fs.mkdirSync(dir);
 const target=path.join(folder,'Demo.s7p');fs.writeFileSync(target,'native fixture');
 const listeners=new Set(),calls=[],state={folders:[temp],pending:undefined};
 const host={folders:()=>state.folders,add:dir=>{calls.push(['add',dir]);state.folders.push(dir);queueMicrotask(()=>{for(const fn of listeners)fn();});return true;},onFoldersChanged:fn=>{listeners.add(fn);return {dispose:()=>listeners.delete(fn)};},reveal:async file=>{calls.push(['reveal',file]);},savePending:async pending=>{state.pending=pending;calls.push(['pending',pending]);}};
 return {temp,folder,view,other,target,host,state,calls,listeners};
}
test('navigation_reuses_parent_and_prefers_specific_second_workspace_root',async t=>{
 const f=fixture(t),n=new ProjectNavigator(f.host);f.state.folders=[f.temp,f.folder];assert.equal(containingFolder(f.state.folders,f.target),f.folder);
 assert.deepEqual(await n.open(f.target,f.folder),{folder:f.folder,restarting:false});assert(!f.calls.some(c=>c[0]==='add'));assert.deepEqual(f.calls.at(-1),['reveal',f.target]);
 f.state.folders=[f.temp];assert.equal((await n.open(f.view,f.view)).folder,f.temp);assert(!f.calls.some(c=>c[0]==='add'));
});
test('navigation_appends_missing_folder_before_reveal_and_serializes_requests',async t=>{
 const f=fixture(t);f.state.folders=[f.other];const n=new ProjectNavigator(f.host),a=n.open(f.target,f.folder),b=n.open(f.target,f.folder);
 await Promise.all([a,b]);assert.deepEqual(f.state.folders,[f.other,f.folder]);assert.equal(f.calls.filter(c=>c[0]==='add').length,1);assert.equal(f.calls.filter(c=>c[0]==='reveal').length,2);assert.equal(f.state.pending,undefined);assert.equal(f.listeners.size,0);
 assert(f.calls.findIndex(c=>c[0]==='add')<f.calls.findIndex(c=>c[0]==='reveal'));
});
test('navigation_empty_workspace_persists_reveal_and_resumes_after_host_restart',async t=>{
 const f=fixture(t);f.state.folders=[];f.host.add=folder=>{f.calls.push(['add',folder]);f.state.folders.push(folder);return true;};
 const before=new ProjectNavigator(f.host);assert.deepEqual(await before.open(f.view,f.view),{folder:f.view,restarting:true});
 assert.deepEqual(f.state.pending,{target:f.view,folder:f.view});assert(!f.calls.some(c=>c[0]==='reveal'));assert.equal(f.listeners.size,0);
 await assert.rejects(()=>before.open(f.target,f.folder),e=>e.reason==='rejected');assert.equal(f.calls.filter(c=>c[0]==='add').length,1);assert.equal(f.state.pending.target,f.view);
 const after=new ProjectNavigator(f.host);await after.resume(f.state.pending);assert.equal(f.state.pending,undefined);assert.deepEqual(f.calls.at(-1),['reveal',f.view]);
});
test('navigation_missing_location_or_invalid_parent_keeps_workspace_unchanged',async t=>{
 const f=fixture(t),n=new ProjectNavigator(f.host),missing=path.join(f.temp,'missing');
 await assert.rejects(()=>n.open(missing,missing),e=>e.reason==='missing');await assert.rejects(()=>n.open(f.target,f.view),e=>e.reason==='folder');await assert.rejects(()=>n.open(f.target,f.target),e=>e.reason==='folder');
 assert.deepEqual(f.state.folders,[f.temp]);assert.deepEqual(f.calls,[]);
});
test('navigation_rejected_folder_add_cleans_pending_and_listeners',async t=>{
 const f=fixture(t);f.state.folders=[f.other];f.host.add=()=>false;const n=new ProjectNavigator(f.host);
 await assert.rejects(()=>n.open(f.target,f.folder),e=>e.reason==='rejected');assert.equal(f.state.pending,undefined);assert.equal(f.listeners.size,0);assert(!f.calls.some(c=>c[0]==='reveal'));
});
test('navigation_timeout_does_not_reveal_wrong_workspace_and_cleans_pending',async t=>{
 const f=fixture(t);f.state.folders=[f.other];f.host.add=()=>true;const n=new ProjectNavigator(f.host,5);
 await assert.rejects(()=>n.open(f.target,f.folder),e=>e.reason==='timeout');assert.equal(f.state.pending,undefined);assert.equal(f.listeners.size,0);assert(!f.calls.some(c=>c[0]==='reveal'));
});
test('navigation_stale_pending_path_is_reported_and_not_reopened',async t=>{
 const f=fixture(t);f.state.pending={target:path.join(f.temp,'gone'),folder:f.temp};const n=new ProjectNavigator(f.host);
 await assert.rejects(()=>n.resume(f.state.pending),e=>e.reason==='missing');assert.equal(f.state.pending,undefined);assert(!f.calls.some(c=>c[0]==='add'||c[0]==='reveal'));
});
test('navigation_waits_for_confirmed_workspace_event_not_tentative_folder_list',async t=>{
 const f=fixture(t);f.state.folders=[f.other];f.host.add=folder=>{f.state.folders.push(folder);return true;};const n=new ProjectNavigator(f.host);
 const navigating=n.open(f.target,f.folder);await new Promise(resolve=>setImmediate(resolve));
 assert(!f.calls.some(c=>c[0]==='reveal'));assert.equal(f.listeners.size,1);assert.equal(f.state.pending.target,f.target);
 for(const fn of f.listeners)fn();await navigating;assert.deepEqual(f.calls.at(-1),['reveal',f.target]);assert.equal(f.listeners.size,0);
});
test('navigation_single_folder_transition_can_resume_without_restarting_host',async t=>{
 const f=fixture(t);f.state.folders=[f.other];f.host.requiresRestart=()=>true;const n=new ProjectNavigator(f.host);
 assert.equal((await n.open(f.target,f.folder)).restarting,true);assert(n.awaitingRestart);assert(!f.calls.some(c=>c[0]==='reveal'));
 await n.resume(f.state.pending);assert(!n.awaitingRestart);assert.equal(f.state.pending,undefined);assert.deepEqual(f.calls.at(-1),['reveal',f.target]);
});
test('navigation_does_not_reopen_folder_removed_or_cancelled_before_resume',async t=>{
 const f=fixture(t);f.state.folders=[f.other];f.state.pending={target:f.target,folder:f.folder};const n=new ProjectNavigator(f.host);
 await assert.rejects(()=>n.resume(f.state.pending),e=>e.reason==='rejected');assert.equal(f.state.pending,undefined);assert(!f.calls.some(c=>c[0]==='add'||c[0]==='reveal'));
});
test('navigation_cancelled_restart_can_be_retried_only_by_new_request',async t=>{
 const f=fixture(t),normalAdd=f.host.add;f.state.folders=[f.other];f.host.requiresRestart=()=>true;f.host.add=()=>true;const n=new ProjectNavigator(f.host);
 await n.open(f.target,f.folder);assert(n.awaitingRestart);await assert.rejects(()=>n.resume(f.state.pending),e=>e.reason==='rejected');assert(!n.awaitingRestart);assert.equal(f.state.pending,undefined);assert(!f.calls.some(c=>c[0]==='reveal'));
 f.host.requiresRestart=()=>false;f.host.add=normalAdd;await n.open(f.target,f.folder);assert.deepEqual(f.calls.at(-1),['reveal',f.target]);
});
