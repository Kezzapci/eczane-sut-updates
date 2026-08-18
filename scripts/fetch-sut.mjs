import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';

const indexUrl = 'https://www.sgk.gov.tr/birimler/duyurular/GENEL-SAGLIK-SIGORTASI-GENEL-MUDURLUGU-2026-01-28-02-00-42';
const outputDir = process.env.SUT_OUTPUT_DIR || '/tmp/sut-fetch';
const resultPath = path.join(outputDir, 'result.json');
const packagePath = path.join(outputDir, 'sut-package.zip');
const currentManifestPath = new URL('../sut/latest.json', import.meta.url);

function decodeHtml(value) {
  return value.replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

async function getText(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'Eczane-SUT-Kontrol-Updates/1.0' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

function absolute(value, base) { return new URL(value, base).toString(); }

function latestAnnouncement(html) {
  const items = [...html.matchAll(/<a\s+href="([^"]*\/duyuru\/detay\/[^" ]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({ url: absolute(match[1], indexUrl), title: decodeHtml(match[2]) }))
    .filter((item) => item.title.includes('SUT Değişiklik Tebliği İşlenmiş Güncel 2013 SUT'));
  if (!items[0]) throw new Error('Güncel işlenmiş SUT duyurusu bulunamadı');
  return items[0];
}

function packageUrl(detailHtml, detailUrl) {
  const href = [...detailHtml.matchAll(/href="([^"]+)"/gi)].map((match) => match[1]).find((value) => /DownloadFile|\.zip/i.test(value));
  if (!href) throw new Error('SUT ZIP indirme bağlantısı bulunamadı');
  return absolute(href, detailUrl);
}

const current = JSON.parse(await fs.readFile(currentManifestPath, 'utf8'));
const indexHtml = await getText(indexUrl);
const announcement = latestAnnouncement(indexHtml);
const detailHtml = await getText(announcement.url);
const sourceUrl = packageUrl(detailHtml, announcement.url);
const response = await fetch(sourceUrl, { headers: { 'user-agent': 'Eczane-SUT-Kontrol-Updates/1.0' } });
if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${sourceUrl}`);
const buffer = Buffer.from(await response.arrayBuffer());
const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
const titleText = decodeHtml(detailHtml);
const fileMatch = titleText.match(/\d{4}\.\d{2}\.\d{2}[^\n]{0,180}?\.zip/i);
const publishedMatch = announcement.title.match(/\d{2}\/\d{2}\/\d{4}/);
const published = publishedMatch?.[0] || current.published;
const dateParts = published.split('/');
const dataVersion = dateParts.length === 3 ? `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}` : current.dataVersion;
const result = {
  changed: current.sourceUrl !== announcement.url || current.sha256 !== sha256,
  dataVersion,
  published,
  sourceUrl: announcement.url,
  sourceFile: fileMatch?.[0]?.trim() || current.sourceFile,
  downloadUrl: sourceUrl,
  sha256,
  bytes: buffer.byteLength,
  packagePath,
  checkedAt: new Date().toISOString(),
};
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(packagePath, buffer);
await fs.writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(`changed=${result.changed}`);
console.log(JSON.stringify(result, null, 2));
