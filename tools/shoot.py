"""Screenshot pages at given scroll positions.
Usage: python shoot.py <outdir> <page.html> <w>x<h> <y1,y2,...>   (y as px, or 'f0.25' = fraction of the first scrub section)
"""
import sys, time, os
from playwright.sync_api import sync_playwright

out, page_name, size, ys = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].split(",")
w, h = map(int, size.split("x"))
os.makedirs(out, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge")
    mobile = w < 700
    ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile)
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    pg.goto(f"http://localhost:5600/{page_name}", wait_until="networkidle", timeout=120000)
    time.sleep(3.5)
    for i, y in enumerate(ys):
        if y.startswith("f"):
            px = pg.evaluate(f"(()=>{{const s=document.querySelector('.scrub');return s.offsetTop+(s.offsetHeight-innerHeight)*{y[1:]}}})()")
        elif y.startswith("#"):
            px = pg.evaluate(f"document.querySelector('{y}').getBoundingClientRect().top+scrollY-80")
        else:
            px = float(y)
        pg.evaluate(f"window.lenis.scrollTo({px},{{immediate:true}})")
        time.sleep(2.2)
        pg.screenshot(path=os.path.join(out, f"{page_name[:-5]}_{w}_{i:02d}.png"))
    print("errors:", errs[:5])
    b.close()
