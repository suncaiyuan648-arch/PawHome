from pathlib import Path
from PIL import Image, ImageChops, ImageStat
import json, re

repo = Path(__file__).resolve().parents[2]
refs = repo / 'docs' / 'figma-export' / 'frames-png'
shots = repo / 'docs' / 'design-audit' / 'screenshots' / 'pawhome'
output = repo / 'docs' / 'design-audit' / 'visual-audit-metrics.json'

rows = []
for ref in sorted(refs.glob('*.png')):
    match = re.match(r'(\d+)_', ref.name)
    if not match:
        continue
    index = int(match.group(1))
    reference = Image.open(ref).convert('RGB')
    # `latest-exact` files are normalized batch probes (cropped from a generic
    # browser viewport), not accepted visual evidence. Natural-size captures
    # and the established per-frame captures remain eligible below.
    candidates = [
        candidate
        for candidate in list(shots.glob(f'frame{index}-*.png')) + list(shots.glob(f'frame{index}-*.jpg'))
        if '-latest-exact' not in candidate.name
    ]
    exact = []
    for candidate in candidates:
        try:
            if Image.open(candidate).size == reference.size:
                exact.append(candidate)
        except OSError:
            pass
    if not exact:
        rows.append({'index': index, 'reference': ref.name, 'size': list(reference.size), 'screenshot': None, 'sameSize': False, 'mae': None, 'passed': False})
        continue
    actual_path = max(exact, key=lambda p: p.stat().st_mtime)
    actual = Image.open(actual_path).convert('RGB')
    diff = ImageChops.difference(reference, actual)
    mae = round(sum(ImageStat.Stat(diff).mean) / 3, 2)
    rows.append({'index': index, 'reference': ref.name, 'size': list(reference.size), 'screenshot': actual_path.name, 'sameSize': True, 'mae': mae, 'passed': mae <= 10})

output.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'wrote {output}')
print(f'exact-size={sum(r["sameSize"] for r in rows)} passed={sum(r["passed"] for r in rows)} pending={sum(not r["passed"] for r in rows)}')
