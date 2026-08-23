#!/usr/bin/env python3
"""Check generated Jekyll HTML for missing local targets and basic structure."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class ReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []
        self.h1_count = 0
        self.is_redirect = False
        self.accessibility_issues = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "h1":
            self.h1_count += 1
        if tag == "meta" and values.get("http-equiv", "").lower() == "refresh":
            self.is_redirect = True
        if tag == "img" and "alt" not in values:
            self.accessibility_issues.append("image has no alt attribute")
        if tag == "iframe" and not values.get("title"):
            self.accessibility_issues.append("iframe has no title")
        for attribute in ("href", "src"):
            if values.get(attribute):
                self.references.append(values[attribute])


site = Path(__file__).resolve().parents[1] / "_site"
html_files = sorted(site.rglob("*.html"))
missing = []
accessibility_issues = []

for html_file in html_files:
    parser = ReferenceParser()
    parser.feed(html_file.read_text(encoding="utf-8"))
    if not parser.is_redirect and parser.h1_count != 1:
        accessibility_issues.append(
            (html_file.relative_to(site), f"expected one h1, found {parser.h1_count}")
        )
    for issue in parser.accessibility_issues:
        accessibility_issues.append((html_file.relative_to(site), issue))
    for raw_reference in parser.references:
        parsed = urlsplit(raw_reference)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        path = unquote(parsed.path)
        if path.startswith("/"):
            target = site / path.lstrip("/")
        else:
            target = html_file.parent / path
        if path.endswith("/") or not target.suffix:
            target /= "index.html"
        if not target.exists():
            missing.append((html_file.relative_to(site), raw_reference, target))

print(f"HTML files: {len(html_files)}")
print(f"Missing local targets: {len(missing)}")
for source, reference, target in missing:
    print(f"{source}: {reference} -> {target}")
print(f"Accessibility structure issues: {len(accessibility_issues)}")
for source, issue in accessibility_issues:
    print(f"{source}: {issue}")

raise SystemExit(bool(missing or accessibility_issues))
