from pathlib import Path
p = Path(r"C:\Users\pugga\coolbrador-site\coolbrador_c07e60e725e0bf09\js\layout.js")
t = p.read_text(encoding="utf-8")
old2 = "    if (!isDemoAccountId(safe)) return safe;\n\n    // Real session stuck on a demo id (e.g. Cardbrador=2): reallocate into 0..1 or 24+."
new2 = """    var demoBase = (window.CB_DEMO_ID_BASE != null) ? Number(window.CB_DEMO_ID_BASE) : 2;
    var demoEnd = demoBase + 21;
    var nSafe = parseInt(safe, 10);
    var inDemoBand = !isNaN(nSafe) && nSafe >= demoBase && nSafe <= demoEnd;
    // Never leave a signed-in Labrador on demo band ids 2..23 (Cardbrador etc).
    if (!inDemoBand && !isDemoAccountId(safe)) return safe;

    // Real session stuck on a demo id (e.g. Cardbrador=2): reallocate into 0..1 or 24+."""
if old2 not in t:
    raise SystemExit("missing old2")
p.write_text(t.replace(old2, new2, 1), encoding="utf-8")
print("OK broaden ensure")
