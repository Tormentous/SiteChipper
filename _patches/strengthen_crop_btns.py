# -*- coding: utf-8 -*-
from pathlib import Path
p = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09\js\image-crop.js")
c = p.read_text(encoding="utf-8")
old = (
    '".cb-crop-actions button{appearance:none;-webkit-appearance:none;min-width:88px;width:auto;height:auto;display:inline-flex;align-items:center;justify-content:center;padding:8px 14px;font:inherit;font-size:0.95rem;font-weight:700;cursor:pointer;border-radius:999px;border:1px solid rgba(var(--cb-accent-rgb),0.35);background:linear-gradient(135deg,var(--cb-accent),var(--cb-accent-2));background-image:linear-gradient(135deg,var(--cb-accent),var(--cb-accent-2));color:var(--cb-accent-text,#fff);box-shadow:none;}",\n'
    '      ".cb-crop-actions button.ghost{background:transparent;background-image:none;color:var(--cb-text);border:1px solid rgba(var(--cb-accent-rgb),0.35);}",\n'
    '      ".cb-crop-actions button.primary{background:linear-gradient(135deg,var(--cb-accent),var(--cb-accent-2));background-image:linear-gradient(135deg,var(--cb-accent),var(--cb-accent-2));border:none;color:var(--cb-accent-text,#fff);}",'
)
new = (
    '".cb-crop-actions button{appearance:none!important;-webkit-appearance:none!important;min-width:88px!important;width:auto!important;height:auto!important;display:inline-flex!important;align-items:center;justify-content:center;padding:8px 14px!important;font:inherit!important;font-size:0.95rem!important;font-weight:700!important;cursor:pointer;border-radius:999px!important;border:1px solid rgba(var(--cb-accent-rgb),0.35)!important;background:linear-gradient(135deg,var(--cb-accent),var(--cb-accent-2))!important;background-image:linear-gradient(135deg,var(--cb-accent),var(--cb-accent-2))!important;color:var(--cb-accent-text,#fff)!important;box-shadow:none!important;clip-path:none!important;}",\n'
    '      ".cb-crop-actions button.ghost{background:transparent!important;background-image:none!important;color:var(--cb-text)!important;border:1px solid rgba(var(--cb-accent-rgb),0.35)!important;}",\n'
    '      ".cb-crop-actions button.primary{background:linear-gradient(135deg,var(--cb-accent),var(--cb-accent-2))!important;background-image:linear-gradient(135deg,var(--cb-accent),var(--cb-accent-2))!important;border:none!important;color:var(--cb-accent-text,#fff)!important;}",'
)
if old not in c:
    raise SystemExit("old css not found")
p.write_text(c.replace(old, new, 1), encoding="utf-8")
assert 'class="primary" id="cbCropApply"' in p.read_text(encoding="utf-8")
print("OK strengthened")
