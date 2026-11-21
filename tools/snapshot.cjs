const fs=require('node:fs');
const {Bridge}=require('../dist/bridge');
const {parseAsc}=require('../dist/symbols');
new Bridge().read('Examples/S15-2026/S15-2026.s7p').then(s=>{fs.writeFileSync('.scratch/snapshot.json',JSON.stringify(s,null,2));console.log('Programs:',s.programs.length,'Items:',s.items.length);for(const i of s.items.filter(i=>i.kind==='symbols'))console.log(i.program,parseAsc(i.content).filter(r=>!r.symbol||!r.address||!r.type));}).catch(e=>{console.error(e);process.exitCode=1;});
