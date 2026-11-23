import fs from 'node:fs';
import path from 'node:path';
export type ProjectViewIndex=Record<string,string[]>;
export function projectReference(project:string,root:string,mode:'relative'|'absolute'){
 const full=path.resolve(root,project),relative=path.relative(root,full);
 return mode==='relative'&&!path.isAbsolute(relative)?relative.replace(/\\/g,'/'):full;
}
export function projectKey(file:string){const full=path.resolve(file);return process.platform==='win32'?full.toLowerCase():full;}
export function rememberProjectViews(previous:ProjectViewIndex,views:{project:string;root:string}[]):ProjectViewIndex {
 const next={...previous};
 for(const {project,root} of views){const key=projectKey(project),known=Array.isArray(next[key])?next[key].filter(p=>typeof p==='string'):[];
  next[key]=[...new Map([...known,root].map(p=>[projectKey(p),p])).values()];
 }return next;
}
// A remembered path is only a hint. Verify its current manifest before reconnecting.
export function findProjectViews(project:string,roots:string[]):string[]{
 return [...new Map(roots.filter(root=>{
  try {const manifest=JSON.parse(fs.readFileSync(path.join(root,'step7project.json'),'utf8').replace(/^\uFEFF/,''));return [1,2].includes(manifest.schema)&&typeof manifest.project==='string'&&projectKey(path.resolve(root,manifest.project))===projectKey(project);}
  catch{return false;}
 }).map(root=>[projectKey(root),root])).values()];
}
