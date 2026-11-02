import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../city-photo-manifest.json', import.meta.url), 'utf8'));
const cities = manifest.cities || [];
const missing = cities.filter(x => !x.url);
const external = cities.filter(x => x.url && /^https?:\/\//i.test(x.url));
const duplicateKeys = cities.filter((x,i) => cities.findIndex(y => y.key === x.key) !== i);
const byUrl = new Map();
for (const c of cities) if(c.url) byUrl.set(c.url, [...(byUrl.get(c.url) || []), c.key]);
const reused = [...byUrl].filter(([,keys]) => keys.length > 1);
const unverified = cities.filter(x => x.status !== 'verified');
console.log(JSON.stringify({
  total: cities.length,
  missing: missing.map(x => x.key),
  external: external.map(x => x.key),
  duplicateKeys: duplicateKeys.map(x => x.key),
  reusedImages: reused,
  unverified: unverified.map(x => x.key)
}, null, 2));
if(missing.length || duplicateKeys.length || reused.length || unverified.length || external.length) {
  console.error('Photo library is not yet fully verified and locally hosted.');
  process.exitCode = 1;
}
