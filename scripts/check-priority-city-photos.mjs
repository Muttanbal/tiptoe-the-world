#!/usr/bin/env node
// Read-only verification of the priority destination image plan.
// Run: node scripts/check-priority-city-photos.mjs
import fs from 'node:fs';
const manifest = JSON.parse(fs.readFileSync(new URL('../city-photo-manifest.json',import.meta.url),'utf8'));
const priorities = [
 ['New Zealand','Auckland'],['New Zealand','Rotorua'],['New Zealand','Wellington'],
 ['Australia','Sydney'],['Australia','Melbourne'],['France','Paris'],
 ['Fiji','Nadi'],['Fiji','Suva'],['Fiji','Denarau Island'],['Spain','Barcelona']
];
const output = [];
for (const [country,city] of priorities) {
 const matches=(manifest.cities||[]).filter(x=>x.country===country && x.city===city);
 const x=matches[0];
 const issues=[];
 if(matches.length!==1)issues.push('Expected exactly one manifest record; found '+matches.length);
 if(!x?.url)issues.push('No image URL');
 if(x?.status!=='verified')issues.push('Not verified');
 if(x?.url && /unsplash\.com\/photos\/.*\/download/.test(x.url))issues.push('Fragile Unsplash download endpoint');
 if(x?.url && !x.url.startsWith('./assets/') && !x.url.startsWith('assets/'))issues.push('Externally hosted image (not a permanent local asset)');
 output.push({country,city,key:x?.key||null,status:x?.status||'missing',url:x?.url||'',issues});
}
console.log(JSON.stringify({priorityCount:output.length,readyForLocalDeployment:output.filter(x=>!x.issues.length).length,records:output},null,2));
if(process.argv.includes('--strict') && output.some(x=>x.issues.length))process.exitCode=1;
