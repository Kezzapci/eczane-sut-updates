import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const indexUrl = 'https://www.sgk.gov.tr/birimler/duyurular/GENEL-SAGLIK-SIGORTASI-GENEL-MUDURLUGU-2026-01-28-02-00-42';
const metadataPath = new URL('../data/sut-source.json', import.meta.url);
const packagePath = new URL('../package.json', import.meta.url);
const lockPath = new URL('../package-lock.json', import.meta.url);

function decodeHtml(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(value, base) {
  return new URL(value, base).toString();
}

async function getText(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'Eczane-SUT-Kontrol/0.1 (+GitHub Actions)' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.text();
}

async function getSha256(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'Eczane-SUT-Kontrol/0.1 (+GitHub Actions)' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  return { sha256: crypto.createHash('sha256').update(buffer).digest('hex'), bytes: buffer.byteLength };
}

function findLatestAnnouncement(html) {
  const matches = [...html.matchAll(/<a\s+href="([^"]*\/duyuru\/detay\/[^" ]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  const candidates = matches
    .map((match) => ({ url: absoluteUrl(match[1], indexUrl), title: decodeHtml(match[2]) }))
    .filter((item) => item.title.includes('SUT Değişiklik Tebliği İşlenmiş Güncel 2013 SUT'));
  if (!candidates.length) throw new Error('SGK duyuru listesinde işlenmiş güncel SUT duyurusu bulunamadı');
  return candidates[0];
}

function findDownload(detailHtml, detailUrl) {
  const hrefs = [...detailHtml.matchAll(/href="([^"]+)"/gi)].map((match) => match[1]);
  const fileHref = hrefs.find((href) => /DownloadFile|\.zip/i.test(href));
  return fileHref ? absoluteUrl(fileHref, detailUrl) : '';
}

function nextPatch(version) {
  const [major, minor, patch] = version.split('.').map((part) => Number.parseInt(part, 10) || 0);
  return `${major}.${minor}.${patch + 1}`;
}

async function writeJson(url, value) {
  await fs.writeFile(url, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const previous = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
const indexHtml = await getText(indexUrl);
const latest = findLatestAnnouncement(indexHtml);
const detailHtml = await getText(latest.url);
const downloadUrl = findDownload(detailHtml, latest.url);
let fileInfo = { sha256: '', bytes: 0, downloadStatus: 'link-not-found' };

if (downloadUrl) {
  try {
    fileInfo = { ...(await getSha256(downloadUrl)), downloadStatus: 'verified' };
  } catch (error) {
    fileInfo = { sha256: '', bytes: 0, downloadStatus: `verification-failed: ${error.message}` };
  }
}

const filenameMatch = decodeHtml(detailHtml).match(/\d{4}\.\d{2}\.\d{2}[^\n]{0,180}?\.zip/i);
const discoveredFile = filenameMatch?.[0]?.trim() || previous.file || '';
const changed = previous.source !== latest.url || (fileInfo.sha256 && previous.sha256 && fileInfo.sha256 !== previous.sha256) || (!previous.sha256 && Boolean(fileInfo.sha256));
const now = new Date().toISOString();
const metadata = {
  source: latest.url,
  title: latest.title,
  indexSource: indexUrl,
  file: discoveredFile,
  downloadUrl,
  published: latest.title.match(/\d{2}\/\d{2}\/\d{4}/)?.[0] || previous.published || '',
  sha256: fileInfo.sha256,
  bytes: fileInfo.bytes,
  downloadStatus: fileInfo.downloadStatus,
  checkedAt: now
};

if (changed) {
  await writeJson(metadataPath, metadata);
  console.log('changed=true');
  console.log(`SUT veri değişikliği algılandı: ${metadata.published || metadata.file}`);
} else {
  await writeJson(metadataPath, { ...previous, ...metadata });
  console.log('changed=false');
  console.log('SUT kaynağında yeni sürüm bulunamadı.');
}
console.log(JSON.stringify(metadata, null, 2));
