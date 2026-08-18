from __future__ import annotations

import argparse
import hashlib
import json
import tempfile
import zipfile
from pathlib import Path


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--package', type=Path, required=True)
    parser.add_argument('--index', type=Path, required=True)
    parser.add_argument('--result', type=Path, required=True)
    args = parser.parse_args()

    with tempfile.TemporaryDirectory() as temp:
        root = Path(temp)
        with zipfile.ZipFile(args.package) as archive:
            archive.extractall(root)
        target = root / 'medicine-index.json'
        target.write_bytes(args.index.read_bytes())
        enriched = args.package.with_name('sut-package-enriched.zip')
        with zipfile.ZipFile(enriched, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
            for path in sorted(root.rglob('*')):
                if path.is_file():
                    archive.write(path, path.relative_to(root).as_posix())
        result = json.loads(args.result.read_text(encoding='utf-8'))
        result['packagePath'] = str(enriched)
        result['sha256'] = sha256(enriched)
        result['bytes'] = enriched.stat().st_size
        result['deliveryPackage'] = 'SUT arşivi + SGK EK-4A barkod indeksi'
        result['medicineIndexCount'] = json.loads(args.index.read_text(encoding='utf-8')).get('count', 0)
        args.result.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps({'package': str(enriched), 'bytes': result['bytes'], 'sha256': result['sha256'], 'medicineIndexCount': result['medicineIndexCount']}))


if __name__ == '__main__':
    main()
