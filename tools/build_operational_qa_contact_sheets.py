from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / "outputs" / "operaciones-qa" / "xlsx"


def font(size, bold=False):
    for name in (["arialbd.ttf", "segoeuib.ttf"] if bold else ["arial.ttf", "segoeui.ttf"]):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default(size=size)


def make(prefix, output_name):
    files = sorted(QA.glob(f"{prefix}-*.png"))
    thumb_w = 900
    margin = 28
    label_h = 42
    tiles = []
    for file in files:
        image = Image.open(file).convert("RGB")
        ratio = thumb_w / image.width
        thumb = image.resize((thumb_w, max(1, int(image.height * ratio))), Image.Resampling.LANCZOS)
        tiles.append((file.stem.replace(prefix + "-", ""), thumb))

    width = thumb_w * 2 + margin * 3
    heights = [margin, margin]
    for index, (_, image) in enumerate(tiles):
        heights[index % 2] += label_h + image.height + margin
    canvas = Image.new("RGB", (width, max(heights)), "#D7DDE1")
    draw = ImageDraw.Draw(canvas)
    y = [margin, margin]
    for index, (label, image) in enumerate(tiles):
        column = index % 2
        x = margin + column * (thumb_w + margin)
        draw.rectangle((x, y[column], x + thumb_w, y[column] + label_h), fill="#0B0F12")
        draw.text((x + 14, y[column] + 9), label, font=font(19, True), fill="white")
        y[column] += label_h
        canvas.paste(image, (x, y[column]))
        y[column] += image.height + margin
    canvas.save(QA.parent / output_name, optimize=True)


make("ACI-PQ-001-Paquete-Formatos-Operacionales", "QA-Paquete-Operacional.png")
make("ACI-PQ-002-Control-Documental-Competencia", "QA-Control-Competencia.png")
