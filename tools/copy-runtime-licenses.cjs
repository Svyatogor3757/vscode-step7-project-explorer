const fs=require('node:fs'),path=require('node:path');
const assets=require('../backend/obj/project.assets.json');
const folder=Object.keys(assets.packageFolders)[0];
for(const name of Object.keys(assets.libraries).filter(n=>n.startsWith('System.'))){
 const [pkg,version]=name.split('/');const root=path.join(folder,pkg.toLowerCase(),version);
 for(const file of ['LICENSE.TXT','THIRD-PARTY-NOTICES.TXT'])if(fs.existsSync(path.join(root,file)))fs.copyFileSync(path.join(root,file),path.join(__dirname,'../third-party',pkg+'.'+file));
}
