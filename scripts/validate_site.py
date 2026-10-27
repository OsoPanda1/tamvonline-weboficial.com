#!/usr/bin/env python3
"""Dependency-free static quality checks for the TAMV institutional website."""
from __future__ import annotations

import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []
warnings: list[str] = []

class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.refs: list[tuple[str, str, str]] = []
        self.title_seen = False
        self.title_text = ""
        self.in_title = False
        self.lang = False
        self.viewport = False
        self.description = False
        self.main_seen = False
        self.header_seen = False
        self.footer_seen = False
        self.blank_target_links: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = dict(attrs)
        if tag == "html" and a.get("lang"):
            self.lang = True
        if tag == "title":
            self.in_title = True
            self.title_seen = True
        if tag == "meta":
            if (a.get("name") or "").lower() == "viewport":
                self.viewport = True
            if (a.get("name") or "").lower() == "description" and (a.get("content") or "").strip():
                self.description = True
        if tag == "main":
            self.main_seen = True
        if tag == "header":
            self.header_seen = True
        if tag == "footer":
            self.footer_seen = True
        if a.get("id"):
            self.ids.append(a["id"])
        for attr in ("href", "src", "poster"):
            value = a.get(attr)
            if value:
                self.refs.append((tag, attr, value))
        if tag == "a" and a.get("target") == "_blank":
            self.blank_target_links.append((a.get("href") or "", a.get("rel") or ""))

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_text += data.strip()

def local_target(page: Path, raw_url: str) -> Path | None:
    parsed = urlparse(raw_url)
    if parsed.scheme or parsed.netloc or raw_url.startswith("//"):
        return None
    path = unquote(parsed.path)
    if not path:
        return page
    if path.startswith("/"):
        path = path.lstrip("/")
        target = ROOT / path
    else:
        target = page.parent / path
    if target.is_dir():
        target = target / "index.html"
    return target

required = [
    "index.html", "catalogo.html", "recursos.html", "contribuir.html",
    "politica-editorial.html", "404.html", "favicon.svg", "site.webmanifest",
    "robots.txt", "sitemap.xml", "vercel.json", "data/catalogo.json"
]
for name in required:
    if not (ROOT / name).is_file():
        errors.append(f"Missing required file: {name}")

pages = sorted(ROOT.glob("*.html"))
for page in pages:
    parser = PageParser()
    try:
        parser.feed(page.read_text(encoding="utf-8"))
        parser.close()
    except Exception as exc:
        errors.append(f"{page.name}: HTML parse failed: {exc}")
        continue
    if page.name != "404.html":
        for ok, label in ((parser.lang, "lang attribute"), (parser.title_seen and bool(parser.title_text), "title"), (parser.viewport, "viewport meta"), (parser.description, "meta description"), (parser.main_seen, "main landmark")):
            if not ok:
                errors.append(f"{page.name}: missing {label}")
    seen = set()
    for ident in parser.ids:
        if ident in seen:
            errors.append(f"{page.name}: duplicate id '{ident}'")
        seen.add(ident)
    for href, rel in parser.blank_target_links:
        values = {x.lower() for x in rel.split()}
        if not {"noopener", "noreferrer"}.issubset(values):
            errors.append(f"{page.name}: target=_blank missing rel noopener noreferrer: {href}")
    for tag, attr, raw in parser.refs:
        if raw.startswith("#") or raw.startswith("data:") or raw.startswith("mailto:") or raw.startswith("tel:") or raw.startswith("javascript:"):
            if raw.startswith("#") and len(raw) > 1 and raw[1:] not in seen:
                errors.append(f"{page.name}: anchor target not found: {raw}")
            continue
        target = local_target(page, raw)
        if target is not None and not target.exists():
            errors.append(f"{page.name}: local {attr} target not found: {raw}")

for name in ("site.webmanifest", "vercel.json", "data/catalogo.json"):
    path = ROOT / name
    if path.exists():
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"{name}: invalid JSON: {exc}")

sitemap = ROOT / "sitemap.xml"
if sitemap.exists():
    try:
        tree = ET.parse(sitemap)
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        for loc in tree.findall(".//sm:loc", ns):
            url = urlparse(loc.text or "")
            p = (url.path or "/").lstrip("/")
            target = ROOT / (p if p else "index.html")
            if target.is_dir():
                target = target / "index.html"
            if not target.is_file():
                errors.append(f"sitemap.xml: listed page not found locally: {loc.text}")
    except Exception as exc:
        errors.append(f"sitemap.xml: invalid XML: {exc}")

data_path = ROOT / "data/catalogo.json"
if data_path.exists():
    try:
        data = json.loads(data_path.read_text(encoding="utf-8"))
        records = data.get("records", [])
        if not isinstance(records, list) or not records:
            errors.append("data/catalogo.json: records must be a non-empty array")
        else:
            ids = [item.get("id") for item in records]
            if len(ids) != len(set(ids)):
                errors.append("data/catalogo.json: duplicate record ids")
            for index, item in enumerate(records):
                for key in ("id", "title", "url", "resourceType", "sourceType", "evidenceScope", "reviewStatus"):
                    if not item.get(key):
                        errors.append(f"data/catalogo.json: record {index} missing {key}")
    except Exception:
        pass

if errors:
    print("TAMV STATIC VALIDATION: FAILED")
    for item in errors:
        print("ERROR:", item)
    for item in warnings:
        print("WARN:", item)
    sys.exit(1)

print(f"TAMV STATIC VALIDATION: PASSED ({len(pages)} HTML pages, {len(required)} required files)")
print("Checks: essential files, page metadata, duplicate IDs, local resource links, blank-target rel safety, JSON and sitemap structure.")
print("This is static validation only; it does not test browser behavior, accessibility with assistive technology, performance, HTTP headers or production deployment.")
