#!/usr/bin/env node
/**
 * Import explicitly verified destination photographs into the repository.
 * Usage: node scripts/import-verified-photos.mjs
 * Only entries with status "verified", a reviewed source URL, and licence
 * metadata are eligible. Unverified candidates are never auto-published.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const path = resolve(root, 'city-photo-manifest.json');
const manifest = JSON.parse(await readFile(path, 'utf8'));
const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
let imported = 0, skipped = 0, failed = 0;
for (const city of manifest.cities) {
  if (city.status !== 'verified' || !(city.sourceUrl || /^https:\/\//.test(city.url || '')) || !city.license || !city.credit) {
    skipped++; continue;
  }
  const downloadUrl = city.sourceUrl || city.url;
  if (!/^https:\/\//.test(downloadUrl)) { failed++; console.error('Invalid source:', city.key); continue; }
  try {
    const response = await fetch(downloadUrl, {signal: AbortSignal.timeout(20000)});
    if (!response.ok) throw Error('HTTP ' + response.status);
    const type = response.headers.get('content-type')?.split(';')[0]?.toLowerCase();
    if (!allowed.has(type)) throw Error('Not a supported image: ' + type);
    const data = Buffer.from(await response.arrayBuffer());
    if (data.length < 10000 || data.length > 12000000) throw Error('Image size outside accepted range');
    const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
    const file = 'assets/images/cities/' + city.key.replace(/[^a-z0-9-]/g, '-') + '.' + ext;
    const full = resolve(root, file);
    await mkdir(dirname(full), {recursive:true});
    await writeFile(full, data);
    city.sourceUrl = downloadUrl;
    city.url = './' + file;
    city.sha256 = createHash('sha256').update(data).digest('hex');
    imported++;
    console.log('Imported', city.key, file);
  } catch (e) { failed++; console.error('FAILED', city.key, e.message); }
}
if(imported) await writeFile(path, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({imported,skipped,failed}));
if(failed) process.exitCode = 1;
