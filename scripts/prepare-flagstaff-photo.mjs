#!/usr/bin/env node
// Prepare a local Flagstaff candidate for visual review. Does not publish or change manifest.
// Run from repository root: node scripts/prepare-flagstaff-photo.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
const source='https://commons.wikimedia.org/wiki/Special:FilePath/Downtown_Flagstaff_%287177849494%29.jpg?width=1200';
const destination=path.resolve('assets/images/cities/flagstaff-arizona.jpg');
const response=await fetch(source,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'TiptoeTheWorldPhotoReview/1.0'}});
if(!response.ok)throw Error('Flagstaff download failed: HTTP '+response.status);
const type=(response.headers.get('content-type')||'').toLowerCase();
if(!type.startsWith('image/jpeg'))throw Error('Expected JPEG, got '+type);
const bytes=Buffer.from(await response.arrayBuffer());
if(bytes.length<20000||bytes[0]!==255||bytes[1]!==216)throw Error('Invalid or too-small JPEG');
await fs.mkdir(path.dirname(destination),{recursive:true});
await fs.writeFile(destination,bytes);
console.log('Saved '+destination+' ('+bytes.length+' bytes). Pending visual review and attribution before manifest changes.');
