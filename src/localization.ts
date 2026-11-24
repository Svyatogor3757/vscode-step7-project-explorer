import path from 'node:path';
import fs from 'node:fs';
export interface InterfaceLanguage {code:string;name:string;vscodeLocale:string;manifest:Record<string,string>;messages:Record<string,string>}
const catalog=require('../language/catalog.cjs') as {
 loadCatalog(directory:string,english?:InterfaceLanguage):{languages:InterfaceLanguage[];errors:string[]};
 readLanguage(file:string,english?:InterfaceLanguage):InterfaceLanguage;
 selectLanguage(languages:InterfaceLanguage[],selection:string,environment:string):InterfaceLanguage|undefined;
 translate(language:InterfaceLanguage|undefined,key:string,...args:unknown[]):string;
};
let active:InterfaceLanguage|undefined;
function english(extensionPath:string){return catalog.readLanguage(path.join(extensionPath,'language/interface_en_us.json'));}
export function readLanguageFile(file:string,extensionPath:string){return catalog.readLanguage(file,english(extensionPath));}
export function userLanguages(directory:string,extensionPath:string){return catalog.loadCatalog(directory,english(extensionPath));}
export async function importLanguage(file:string,directory:string,extensionPath:string,confirm:(language:InterfaceLanguage)=>Promise<boolean>){
 const language=readLanguageFile(file,extensionPath),destination=path.join(directory,`interface_${language.code}.json`),content=fs.readFileSync(file);
 if(fs.existsSync(destination)&&!fs.readFileSync(destination).equals(content)&&!await confirm(language))return undefined;
 fs.mkdirSync(directory,{recursive:true});
 if(path.resolve(file)!==path.resolve(destination))fs.writeFileSync(destination,content);
 return {file:destination,language};
}
export function configureLanguage(extensionPath:string,selection='auto',environment='en',customFile='',userDirectory=''){
 const result=catalog.loadCatalog(path.join(extensionPath,'language'));
 const available=[...result.languages];
 if(userDirectory&&fs.existsSync(userDirectory)){
  const personal=catalog.loadCatalog(userDirectory,available.find(language=>language.code==='en_us'));
  result.errors.push(...personal.errors);
  for(const language of personal.languages)if(!available.some(existing=>existing.code===language.code))available.push(language);
 }
 active=catalog.selectLanguage(available,selection,environment);
 if(selection==='custom')try{active=readLanguageFile(customFile,extensionPath);}catch(error){result.errors.push(String(error));}
 return {...result,active:active?.code};
}
export function t(key:string,...args:unknown[]){return catalog.translate(active,key,...args);}
