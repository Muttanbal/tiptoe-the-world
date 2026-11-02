import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const m=JSON.parse(await readFile(resolve(root,'city-photo-manifest.json'),'utf8'));
const out=resolve(root,'photo-review');
await mkdir(out,{recursive:true});
const rows=['key,city,country,status,source_url,download_result'];
let ok=0,fail=0,skipped=0;
for(const c of m.cities){
  if(!c.url || !/^https:\/\//.test(c.url)){skipped++;continue}
  const url=c.url;
  let result='failed';
  try{
    const r=await fetch(url,{signal:AbortSignal.timeout(18000),headers:{'User-Agent':'TiptoePhotoAudit/1.0'}});
    if(!r.ok)throw Error('HTTP '+r.status);
    const mime=r.headers.get('content-type')||'';
    if(!mime.startsWith('image/'))throw Error('Non-image content: '+mime);
    const bytes=Buffer.from(await r.arrayBuffer());
    if(bytes.length<10000 || bytes.length>12000000)throw Error('Unexpected image size');
    const ext=mime.includes('png')?'png':mime.includes('webp')?'webp':'jpg';
    const path=resolve(out,c.key.replace(/[^a-z0-9-]/g,'-')+'.'+ext);
    await mkdir(dirname(path),{recursive:true});
    await writeFile(path,bytes);
    result='downloaded-for-manual-review';ok++;
  }catch(e){result=String(e.message).replaceAll(',',';');fail++}
  const q=x=>'"'+String(x??'').replaceAll('"','""')+'"';
  rows.push([c.key,c.city,c.country,c.status,url,result].map(q).join(','));
}
await writeFile(resolve(out,'review.csv'),rows.join('\n')+'\n');
console.log(JSON.stringify({downloaded:ok,failed:fail,noUrl:skipped,total:m.cities.length}));
