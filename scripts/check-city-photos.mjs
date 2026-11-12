#!/usr/bin/env node
// Run: node scripts/check-city-photos.mjs
import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync(new URL('../city-photo-manifest.json',import.meta.url),'utf8'));
const entries=manifest.cities||[];
const keys=new Set(), locations=new Set(), errors=[];
for(const item of entries){
 const loc=item.country+'|'+item.city;
 if(keys.has(item.key))errors.push('Duplicate key: '+item.key);
 if(locations.has(loc))errors.push('Duplicate destination: '+loc);
 keys.add(item.key);locations.add(loc);
 if(item.status==='verified' && !/^https:\/\//.test(item.url||''))errors.push('Verified without HTTPS URL: '+loc);
 if(item.url && !/^https:\/\//.test(item.url))errors.push('Invalid URL: '+loc);
}
const statuses={};
for(const x of entries)statuses[x.status]=(statuses[x.status]||0)+1;
console.log(JSON.stringify({total:entries.length,missingUrl:entries.filter(x=>!x.url).length,statuses,errors},null,2));

if(process.argv.includes('--check-remote')){
 const verified=entries.filter(x=>x.url);
 const remote=[];
 // Check images concurrently to keep the scheduled audit practical as the manifest grows.
 const concurrency=8;
 let cursor=0;
 async function worker(){
  while(cursor<verified.length){
   const x=verified[cursor++];
   try{
    const response=await fetch(x.url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'TiptoePhotoAudit/1.0'}});
    const type=response.headers.get('content-type')||'';
    const valid=response.ok&&type.toLowerCase().startsWith('image/');
    if(response.body)await response.body.cancel();
    remote.push({key:x.key,city:x.city,country:x.country,photoStatus:x.status,status:response.status,contentType:type,valid});
    if(!valid && x.status==='verified')errors.push('Verified image did not return an image: '+x.key+' (HTTP '+response.status+', '+type+')');
   }catch(e){
    remote.push({key:x.key,city:x.city,country:x.country,photoStatus:x.status,error:String(e),valid:false});
    if(x.status==='verified')errors.push('Verified image request failed: '+x.key);
   }
  }
 }
 await Promise.all(Array.from({length:Math.min(concurrency,verified.length)},()=>worker()));
 remote.sort((a,b)=>a.key.localeCompare(b.key));
 const failures=remote.filter(x=>!x.valid);
 const verifiedFailures=failures.filter(x=>x.photoStatus==='verified');
 const failureByHost={};
 for(const x of failures){
  const source=entries.find(item=>item.key===x.key);
  const host=source?.url ? new URL(source.url).hostname : 'unknown';
  failureByHost[host]=(failureByHost[host]||0)+1;
 }
 const report={checkedAt:new Date().toISOString(),total:entries.length,assigned:verified.length,missingUrl:entries.length-verified.length,loaded:remote.length-failures.length,failed:failures.length,verifiedFailures, failureByHost,failures,results:remote};
 fs.writeFileSync(new URL('../photo-url-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
 console.log('Photo URL audit written to photo-url-audit.json');
 for(const x of failures)console.log('::warning file=city-photo-manifest.json::Photo URL failed for '+x.key+': '+(x.error||'HTTP '+x.status+' '+x.contentType));
 console.log('Remote photo summary:',JSON.stringify({checked:remote.length,loaded:remote.length-failures.length,failed:failures.length,verifiedFailures, failureByHost,failedDestinations:failures.map(x=>({city:x.city,country:x.country,status:x.status,error:x.error||x.contentType}))},null,2));
 console.log('Remote photo checks (candidates are informational, not visually verified):',JSON.stringify(remote,null,2));
}
if(errors.length)process.exitCode=1;

