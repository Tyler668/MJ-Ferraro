"""Screenshot helper: python tools/shot.py <page> <name> [js-to-run-before] [width height] [wait]"""
import sys, asyncio
from playwright.async_api import async_playwright
OUT = r"C:\Users\tyler\AppData\Local\Temp\claude\C--Users-tyler-CaptionASR\8b856431-a00c-484c-bda0-62089c9ed32b\scratchpad"
async def main():
    page_url, name = sys.argv[1], sys.argv[2]
    js = sys.argv[3] if len(sys.argv) > 3 else ""
    w, h = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (1440, 900)
    wait = float(sys.argv[6]) if len(sys.argv) > 6 else 1.8
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="msedge")
        pg = await b.new_page(viewport={"width": w, "height": h})
        msgs = []
        pg.on("console", lambda m: msgs.append(f"{m.type}: {m.text}"))
        pg.on("pageerror", lambda e: msgs.append(f"PAGEERROR: {e}"))
        await pg.goto("http://localhost:8765/" + page_url, wait_until="networkidle")
        await pg.add_style_tag(content="html{scroll-behavior:auto!important}")
        await pg.wait_for_timeout(600)
        for step in js.split("||"):
            if step.strip():
                if step.startswith("CLICK:"): await pg.mouse.click(*map(int, step[6:].split(",")))
                elif step.startswith("MOVE:"): await pg.mouse.move(*map(int, step[5:].split(",")), steps=8)
                elif step.startswith("WAIT:"): await pg.wait_for_timeout(int(step[5:]))
                else: await pg.evaluate(step)
                await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(int(wait * 1000))
        await pg.screenshot(path=f"{OUT}/{name}.png", full_page=name.endswith("-full"))
        for m in msgs: print(m)
        await b.close()
asyncio.run(main())
