"""Restore exact, checksum-verified guidance snapshots without updating versions."""
from pathlib import Path
import hashlib,json,urllib.request
root=Path(__file__).resolve().parents[1]
lock=json.loads((root/'upstream-guidance.lock.json').read_text())
cache=root/'.cache/guidance'
cache.mkdir(parents=True,exist_ok=True)
for item in lock['sources']:
    target=cache/item['cache_file']
    if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest()==item['sha256']:
        continue
    data=urllib.request.urlopen(item['url'],timeout=30).read()
    if hashlib.sha256(data).hexdigest()!=item['sha256']:
        raise RuntimeError('Guidance checksum mismatch: '+item['id'])
    temporary=target.with_suffix('.tmp')
    temporary.write_bytes(data)
    temporary.replace(target)
print(json.dumps({'status':'verified','documents':len(lock['sources']),'directory':str(cache)}))
