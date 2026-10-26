#!/usr/bin/env python3
"""Wrap frontmatter string values containing ': ' in double quotes, so YAML
reads them as strings rather than as nested mappings. Safe to run repeatedly."""
import glob, re

KEYS = r'(title|summary|def|term|note|authors|org)'
fixed = 0
for f in sorted(glob.glob('src/content/modules/*.mdx')):
    head, fm, body = open(f).read().split('---', 2)
    out = []
    for line in fm.split('\n'):
        m = re.match(r'^(\s*(?:-\s+)?(?:' + KEYS + r':\s+)?)(.*)$', line)
        prefix, val = m.group(1), m.group(3)
        keyed = re.search(KEYS + r':\s+$', prefix)
        list_item = re.match(r'^\s*-\s+$', prefix)
        if val and ': ' in val and not val.startswith(('"', "'", '[', '{')) and (keyed or list_item):
            line = prefix + '"' + val.replace('\\', '\\\\').replace('"', '\\"') + '"'
            fixed += 1
        out.append(line)
    open(f, 'w').write('---'.join([head, '\n'.join(out), body]))
print(f'quoted {fixed} value(s)')
