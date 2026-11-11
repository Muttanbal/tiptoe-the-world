#!/usr/bin/env node
// Produce a reproducible inventory of city photo assignments.
// Usage: node scripts/report-city-photo-coverage.mjs
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('city-photo-manifest.json', root), 'utf8'));
const entries = manifest.cities || [];
const byStatus = {};
const byHost = {};
const missing = [];
const fragile = [];
const pending = [];
for (const item of entries) {
  byStatus[item.status] = (byStatus[item.status] || 0) + 1;
  const record = {key:item.key,city:item.city,country:item.country,status:item.status,url:item.url || ''};
  if (!item.url) { missing.push(record); continue; }
  let host = 'invalid';
  try { host = new URL(item.url).hostname; } catch {}
  byHost[host] = (byHost[host] || 0) + 1;
  if (/^unsplash\.com$/i.test(host) && /\/download(?:\?|$)/.test(item.url)) fragile.push(record);
  if (item.status !== 'verified') pending.push(record);
}
const report = {
  generatedAt: new Date().toISOString(),
  note: 'Manifest inventory only. A URL or verified status does not prove the photograph renders on the live page.',
  total: entries.length,
  assigned: entries.length - missing.length,
  missingUrl: missing.length,
  markedVerified: entries.filter(x => x.status === 'verified').length,
  statusCounts: byStatus,
  hostCounts: byHost,
  missing,
  fragileUnsplashDownloads: fragile,
  assignedButNotVerified: pending
};
fs.writeFileSync(new URL('photo-coverage-report.json', root), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({
 total:report.total, assigned:report.assigned, missingUrl:report.missingUrl,
 markedVerified:report.markedVerified, fragileUnsplashDownloads:fragile.length,
 statusCounts:byStatus, hostCounts:byHost
},null,2));
