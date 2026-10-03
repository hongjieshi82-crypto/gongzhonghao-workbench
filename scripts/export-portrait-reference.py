# 作者：史鸿洁 · © 2026 史鸿洁 · 采用 CC BY-NC 4.0 许可（署名 · 非商业性使用），详见 LICENSE
import base64, hashlib, json, re, urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]
with urllib.request.urlopen('http://127.0.0.1:4173/api/document',timeout=10) as response:
    state=json.load(response)
url=(state.get('portraitReference') or {}).get('dataUrl','')
match=re.fullmatch(r'data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=\s]+)',url)
if not match: raise SystemExit('尚未上传有效人物照片')
raw=base64.b64decode(match[2],validate=True)
folder=root/'data'/'reference-images';folder.mkdir(parents=True,exist_ok=True)
name='portrait-'+hashlib.sha256(raw).hexdigest()[:16]+'.'+('jpg' if match[1]=='jpeg' else match[1])
path=folder/name
if not path.exists(): path.write_bytes(raw);path.chmod(0o600)
print(path)
