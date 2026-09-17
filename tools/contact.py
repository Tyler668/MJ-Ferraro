import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
R=Path(__file__).resolve().parent.parent; m=json.loads((R/"tools/manifest.json").read_text(encoding="utf-8"))
out=Path(r"C:\Users\tyler\AppData\Local\Temp\claude\C--Users-tyler-CaptionASR\8b856431-a00c-484c-bda0-62089c9ed32b\scratchpad")
font=ImageFont.truetype("arial.ttf",18); C=4; cell=420
for i in range(0,len(m),12):
    chunk=m[i:i+12]; rows=(len(chunk)+C-1)//C
    sheet=Image.new("RGB",(C*cell,rows*(cell+30)),"white"); d=ImageDraw.Draw(sheet)
    for j,e in enumerate(chunk):
        im=Image.open(R/"images/thumb"/f"{e['slug']}.jpg"); im.thumbnail((cell-10,cell-10))
        x=(j%C)*cell; y=(j//C)*(cell+30)
        sheet.paste(im,(x+5,y+5)); d.text((x+5,y+cell),f"{i+j}: {e['slug'][:38]}",fill="black",font=font)
    sheet.save(out/f"sheet{i//12}.jpg",quality=85)
