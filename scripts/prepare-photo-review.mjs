import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(resolve(root, 'city-photo-manifest.json'), 'utf8'));
const out = resolve(root, 'photo-review');
await mkdir(out, {recursive: true});
const cities = manifest.cities || [];
const csv = ['key,city,country,status,source_url,download_result'];
const summary = {total: cities.length, downloaded: 0, failed: 0, missingUrl: 0, awaitingVerification: 0, locallyHosted: 0};
const quote = x => '"' + String(x ?? '').replaceAll('"', '""') + '"';
const results = await Promise.all(cities.map(async (c) => {
  if (c.status !== 'verified') summary.awaitingVerification++;
  let result;
  if (!c.url) { summary.missingUrl++; result = 'missing-url'; }
  else if (!/^https:\/\//i.test(c.url)) { summary.locallyHosted++; result = 'local-image-reference'; }
  else {
    try {
      let downloadUrl = c.url;
      let response = await fetch(downloadUrl, {signal: AbortSignal.timeout(12000)});
      if (response.status === 401 && /^https:\/\/unsplash\.com\/photos\/[^/]+\/download/.test(downloadUrl)) {
        const pageUrl = downloadUrl.split('/download')[0];
        const page = await fetch(pageUrl, {signal: AbortSignal.timeout(12000)});
        if (page.ok) {
          const html = await page.text();
          const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
          if (match) {
            const candidate = match[1].replaceAll('&amp;', '&');
            if (/^https:\/\/images\.unsplash\.com\/photo-/.test(candidate)) {
              downloadUrl = candidate;
              response = await fetch(downloadUrl, {signal: AbortSignal.timeout(12000)});
            }
          }
        }
      }
      if (!response.ok) throw Error('HTTP ' + response.status);
      const mime = (response.headers.get('content-type') || '').split(';')[0].toLowerCase();
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) throw Error('Unsupported content type ' + mime);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 10000 || bytes.length > 12000000) throw Error('Unexpected image size');
      const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
      const filename = resolve(out, c.key.replace(/[^a-z0-9-]/g, '-') + '.' + ext);
      await mkdir(dirname(filename), {recursive: true});
      await writeFile(filename, bytes);
      summary.downloaded++;
      result = 'downloaded-for-review-not-approved' + (downloadUrl !== c.url ? ' (resolved-unsplash-image)' : '');
    } catch (error) { summary.failed++; result = 'download-failed: ' + error.message; }
  }
  return [c.key, c.city, c.country, c.status, c.url, result].map(quote).join(',');
}));
csv.push(...results);
await writeFile(resolve(out, 'review.csv'), csv.join('\n') + '\n');
await writeFile(resolve(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
const report = ['# Destination photograph review', '', '| Metric | Count |', '|---|---:|', ...Object.entries(summary).map(([key,value]) => '| ' + key + ' | ' + value + ' |'), '', 'Downloads are candidates only; destination accuracy and rights require verification before publishing.'];
await writeFile(resolve(out, 'SUMMARY.md'), report.join('\n') + '\n');
console.log(JSON.stringify(summary));
if (summary.failed) console.warn('Some candidate image downloads failed; inspect review.csv.');
