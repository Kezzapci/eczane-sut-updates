import fs from 'node:fs/promises';

const result = JSON.parse(await fs.readFile(process.env.SUT_RESULT || '/tmp/sut-fetch/result.json', 'utf8'));
const updatesRepo = process.env.UPDATES_REPO || 'Kezzapci/eczane-sut-updates';
const releaseTag = `sut-data-${result.dataVersion}-${result.sha256.slice(0, 8)}`;
const assetName = `sut-${result.dataVersion}.zip`;
const manifest = {
  schemaVersion: 1,
  dataVersion: result.dataVersion,
  published: result.published,
  sourceUrl: result.sourceUrl,
  sourceFile: result.sourceFile,
  sha256: result.sha256,
  bytes: result.bytes,
  packageUrl: `https://github.com/${updatesRepo}/releases/download/${releaseTag}/${assetName}`,
  delivery: 'github-release',
  generatedAt: new Date().toISOString()
};
await fs.writeFile('sut/latest.json', `${JSON.stringify(manifest, null, 2)}\n`);
await fs.writeFile(process.env.MANIFEST_OUTPUT || '/tmp/sut-fetch/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
