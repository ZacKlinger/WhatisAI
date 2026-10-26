#!/usr/bin/env python3
"""Catch YAML frontmatter that parses into the wrong types (for example an
unquoted colon turning a string into a mapping) before Astro's build does."""
import glob, sys, yaml

bad = 0
for f in sorted(glob.glob('src/content/modules/*.mdx')):
    d = yaml.safe_load(open(f).read().split('---')[1])
    for i, o in enumerate(d.get('objectives', [])):
        if not isinstance(o, str):
            print(f'{f}: objective {i} is not a string: {o}'); bad += 1
    for t in d.get('keyTerms', []):
        if not all(isinstance(t.get(k), str) for k in ('term', 'def')):
            print(f'{f}: malformed key term {t}'); bad += 1
sys.exit(1 if bad else 0)
