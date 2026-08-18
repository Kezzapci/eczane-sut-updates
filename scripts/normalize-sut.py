#!/usr/bin/env python3
"""Normalize the official SGK SUT archive without discarding the original files."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import zipfile
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Any
import xml.etree.ElementTree as ET

import pandas as pd

EK_RE = re.compile(r"EK[- ]\d+[A-Z]?(?:[- ]\d+)?", re.IGNORECASE)
DOCX_NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def clean(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).replace("\u00a0", " ").strip()
    return text or None


def json_safe(value: Any) -> Any:
    if pd.isna(value):
        return None
    if hasattr(value, "item"):
        try:
            return json_safe(value.item())
        except Exception:
            pass
    return clean(value)


def extract_docx_text(content: bytes) -> list[str]:
    with zipfile.ZipFile(BytesIO(content)) as docx:
        xml = docx.read("word/document.xml")
    root = ET.fromstring(xml)
    paragraphs: list[str] = []
    for paragraph in root.findall(".//w:p", DOCX_NS):
        text = "".join(node.text or "" for node in paragraph.findall(".//w:t", DOCX_NS)).strip()
        if text:
            paragraphs.append(text)
    return paragraphs


def spreadsheet_data(content: bytes, suffix: str) -> tuple[dict[str, list[list[str | None]]], list[str]]:
    errors: list[str] = []
    engine = "xlrd" if suffix.lower() == ".xls" else "openpyxl"
    try:
        sheets = pd.read_excel(BytesIO(content), sheet_name=None, header=None, dtype=str, engine=engine)
    except Exception as exc:  # Preserve a source error instead of silently losing data.
        return {}, [str(exc)]
    result: dict[str, list[list[str | None]]] = {}
    for sheet_name, frame in sheets.items():
        result[str(sheet_name)] = [[json_safe(value) for value in row] for row in frame.values.tolist()]
    return result, errors


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)

    inventory: list[dict[str, Any]] = []
    documents: list[dict[str, Any]] = []
    spreadsheets: list[dict[str, Any]] = []
    parse_errors: list[dict[str, str]] = []

    with zipfile.ZipFile(args.archive) as archive:
        for info in archive.infolist():
            if info.is_dir():
                continue
            content = archive.read(info.filename)
            relative = info.filename.replace("\\", "/")
            suffix = Path(relative).suffix.lower()
            category_matches = EK_RE.findall(Path(relative).name) or EK_RE.findall(relative)
            category = category_matches[-1].upper().replace(" ", "-") if category_matches else "SUT"
            entry = {
                "path": relative,
                "bytes": len(content),
                "sha256": hashlib.sha256(content).hexdigest(),
                "category": category,
                "legacy": "MÜLGA" in relative.upper() or "MULGA" in relative.upper(),
                "extension": suffix,
            }
            inventory.append(entry)

            if suffix == ".docx":
                try:
                    paragraphs = extract_docx_text(content)
                    documents.append({**entry, "paragraphs": paragraphs})
                except Exception as exc:
                    parse_errors.append({"path": relative, "error": str(exc)})
            elif suffix in {".xlsx", ".xls"}:
                sheets, errors = spreadsheet_data(content, suffix)
                spreadsheets.append({**entry, "sheets": sheets})
                parse_errors.extend({"path": relative, "error": error} for error in errors)

    package = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceArchive": args.archive.name,
        "sourceSha256": hashlib.sha256(args.archive.read_bytes()).hexdigest(),
        "fileCount": len(inventory),
        "inventory": inventory,
        "documents": documents,
        "spreadsheets": spreadsheets,
        "parseErrors": parse_errors,
        "validation": {
            "archiveNonEmpty": len(inventory) > 0,
            "hasSutDocument": any(item["extension"] == ".docx" for item in inventory),
            "hasEk4a": any(item["category"] == "EK-4A" and not item["legacy"] for item in inventory),
            "spreadsheetCount": len(spreadsheets),
            "documentCount": len(documents),
            "parseErrorCount": len(parse_errors),
        },
    }
    (args.output / "sut-data.json").write_text(json.dumps(package, ensure_ascii=False, indent=2), encoding="utf-8")
    (args.output / "inventory.json").write_text(json.dumps(inventory, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(package["validation"], ensure_ascii=False))
    if parse_errors:
        print(f"parse_errors={len(parse_errors)}")


if __name__ == "__main__":
    main()
