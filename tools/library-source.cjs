const fs=require('node:fs');
(async()=>{
 const ref='f0b2c5a98fe3e1b71861cd47403aac02338efc99',repo='dotnetprojects/DotNetSiemensPLCToolBoxLibrary';
 const r=await fetch(`https://api.github.com/repos/${repo}/git/trees/${ref}?recursive=1`,{headers:{'User-Agent':'Step7Project-build'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(r.status);
 const tree=await r.json();fs.mkdirSync('.scratch/library',{recursive:true});
 for(const entry of tree.tree.filter(e=>/(BlocksOfflineFolder|S7ConvertingOptions|S7FunctionBlock)\.cs$/.test(e.path))){const result=await fetch(`https://raw.githubusercontent.com/${repo}/${ref}/${entry.path}`);if(!result.ok)throw Error(result.status);const target='.scratch/library/'+entry.path.split('/').at(-1);fs.writeFileSync(target,await result.text());console.log(target);}
})().catch(e=>{console.error(e);process.exitCode=1;});
