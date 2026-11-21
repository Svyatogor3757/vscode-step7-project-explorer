export interface SymbolRow { symbol:string; address:string; type:string; comment:string }
const widths=[24,12,10,80];
export function parseAsc(text:string):SymbolRow[] {
  return text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.length>0).map((line,n)=>{
    if(!line.startsWith('126,')||line.length!==130)throw Error(`ASC line ${n+1}: expected 126, and 126 fixed-width characters`);
    let offset=4;const fields=widths.map(w=>{const v=line.slice(offset,offset+w).trimEnd();offset+=w;return v;});
    return {symbol:fields[0],address:fields[1],type:fields[2],comment:fields[3]};
  });
}
export function validateRows(rows:SymbolRow[]):void {
  const names=new Set<string>();
  for(const [n,r] of rows.entries()){
    const fields=[r.symbol,r.address,r.type,r.comment];
    if(!r.symbol.trim()||!r.address.trim()||(!r.type.trim()&&!/^VAT\s*\d+$/i.test(r.address)))throw Error(`Symbols row ${n+1}: symbol, address and type are required (VAT has no data type)`);
    fields.forEach((f,i)=>{if(/[\r\n\x00-\x1f]/.test(f)||f.length>widths[i])throw Error(`Symbols row ${n+1}: invalid field or exceeds ${widths[i]} characters`);});
    const key=r.symbol.toUpperCase();if(names.has(key))throw Error(`Duplicate symbol: ${r.symbol}`);names.add(key);
  }
}
export function toAsc(rows:SymbolRow[]):string {
  validateRows(rows);
  return rows.map(r=>'126,'+[r.symbol,r.address,r.type,r.comment].map((s,i)=>s.padEnd(widths[i])).join('')).join('\r\n')+(rows.length?'\r\n':'');
}
export function toCsv(rows:SymbolRow[],validate=true):string {
  if(validate)validateRows(rows);const quote=(s:string)=>'"'+s.replace(/"/g,'""')+'"';
  return ['symbol,address,type,comment',...rows.map(r=>[r.symbol,r.address,r.type,r.comment].map(quote).join(','))].join('\r\n')+'\r\n';
}
export function parseCsv(text:string,validate=true):SymbolRow[] {
  const records:string[][]=[];let row:string[]=[],field='',quoted=false,after=false;
  text=text.replace(/^\uFEFF/,'');
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;after=true;}}else field+=c;continue;}
    if(c==='"'){if(field||after)throw Error('Invalid CSV quoting');quoted=true;}
    else if(c===','){row.push(field);field='';after=false;}
    else if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);records.push(row);row=[];field='';after=false;}
    else {if(after)throw Error('Unexpected text after CSV quote');field+=c;}
  }
  if(quoted)throw Error('Unclosed CSV quote');if(field||row.length){row.push(field);records.push(row);}
  if(records.shift()?.join(',')!=='symbol,address,type,comment')throw Error('CSV header must be symbol,address,type,comment');
  const rows=records.map((r,n)=>{if(r.length!==4)throw Error(`CSV row ${n+2}: expected 4 columns`);return {symbol:r[0],address:r[1],type:r[2],comment:r[3]};});
  if(validate)validateRows(rows);return rows;
}
