// SPDX-License-Identifier: MIT
const fs=require('node:fs'),path=require('node:path');
const {loadCatalog}=require('../language/catalog.cjs');
function generate(root){
 const {languages,errors}=loadCatalog(path.join(root,'language'));
 if(errors.length)throw Error(errors.join('\n'));
 const english=languages.find(language=>language.code==='en_us');
 const file=path.join(root,'package.json'),manifest=JSON.parse(fs.readFileSync(file,'utf8'));
 delete manifest.l10n;
 const properties=manifest.contributes.configuration.properties;
 properties['step7project.interface.language']={type:'string',scope:'window',default:'auto',description:'%setting.step7project.interface.language%',enum:['auto',...languages.map(language=>language.code),'custom'],enumItemLabels:['%language.auto%',...languages.map(language=>`%language.name.${language.code}%`),'%language.custom%']};
 for(const [key,setting] of Object.entries(properties))if(setting.enum&&key!=='step7project.interface.language'){
  const labels=setting.enumDescriptions||setting.enum.map((_,index)=>`%enum.${key}.${index}%`);
  setting.enumItemLabels=[...labels];
 }
 const outputs=new Map([['package.json',manifest]]);
 for(const language of languages){
  const values={...english.manifest,...language.manifest};
  for(const item of languages)values['language.name.'+item.code]=item.name+' ('+item.code+')';
  const name=language===english?'package.nls.json':`package.nls.${language.vscodeLocale}.json`;
  outputs.set(name,values);
 }
 for(const [name,values] of outputs)if(name!=='package.json')for(const [,key] of JSON.stringify(manifest).matchAll(/%([^%]+)%/g))if(typeof values[key]!=='string')throw Error(name+': missing manifest translation '+key);
 const indexFile=path.join(root,'language/generated.json');
 const previous=fs.existsSync(indexFile)?JSON.parse(fs.readFileSync(indexFile,'utf8')):[];
 if(!Array.isArray(previous)||previous.some(name=>typeof name!=='string'||!/^package\.nls(?:\.[a-z0-9-]+)?\.json$/.test(name)))throw Error('Invalid generated localization index');
 for(const [name,value] of outputs){
  const content=JSON.stringify(value,null,2)+'\n',target=path.join(root,name);
  if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==content)fs.writeFileSync(target,content);
 }
 for(const name of previous)if(!outputs.has(name)&&fs.existsSync(path.join(root,name)))fs.unlinkSync(path.join(root,name));
 fs.writeFileSync(indexFile,JSON.stringify([...outputs.keys()].filter(name=>name!=='package.json'),null,2)+'\n');
 return {languages:languages.map(language=>language.code),outputs:[...outputs.keys()]};
}
if(require.main===module){try{console.log(JSON.stringify(generate(path.resolve(__dirname,'..'))));}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={generate};
