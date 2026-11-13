#!/usr/bin/env node
// Download a single location-verified, freely licensed photograph for review.
// Does not modify the manifest or publish anything.
// Usage: node scripts/prepare-auckland-photo.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
const output = path.resolve('assets/images/cities/auckland-paora-cc0.jpg');
const source = 'https://commons.wikimedia.org/wiki/Special:FilePath/Auckland_skyline_PA01.jpg';
const response = await fetch(source, {headers:{'User-Agent':'TiptoeTheWorldPhotoPreparation/1.0 (source attribution: Wikimedia Commons)'}});
if (!response.ok) throw Error('Auckland image download failed: HTTP '+response.status);
const type = response.headers.get('content-type') || '';
if (!type.toLowerCase().startsWith('image/jpeg')) throw Error('Unexpected image type: '+type);
const bytes = Buffer.from(await response.arrayBuffer());
if (bytes.length < 20000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw Error('Downloaded data is not a valid-sized JPEG');
await fs.mkdir(path.dirname(output), {recursive:true});
await fs.writeFile(output, bytes);
console.log('Prepared '+output+' ('+bytes.length+' bytes). Review image visually before adding to the manifest.');
