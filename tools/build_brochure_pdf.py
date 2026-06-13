from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "outputs" / "brochure"
ASSETS = ROOT / "assets"
W, H = 1240, 1754


def font(size, bold=False, serif=False):
    candidates = []
    if serif:
        candidates += ["georgiab.ttf" if bold else "georgia.ttf", "times.ttf"]
    else:
        candidates += ["arialbd.ttf" if bold else "arial.ttf", "segoeuib.ttf" if bold else "segoeui.ttf"]
    for name in candidates:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default(size=size)


F = {
    "eyebrow": font(20, True),
    "h1": font(100, True, True),
    "h2": font(54, True, True),
    "h3": font(24, True),
    "body": font(21),
    "small": font(18),
    "small_bold": font(18, True),
    "value": font(22, True),
}


def wrap(draw, text, fnt, max_width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = word if not current else f"{current} {word}"
        if draw.textlength(test, font=fnt) <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_wrapped(draw, xy, text, fnt, fill, max_width, leading=1.25):
    x, y = xy
    for line in wrap(draw, text, fnt, max_width):
        draw.text((x, y), line, font=fnt, fill=fill)
        y += int(fnt.size * leading)
    return y


def fit_cover(img, size):
    iw, ih = img.size
    sw, sh = size
    scale = max(sw / iw, sh / ih)
    nw, nh = int(iw * scale), int(ih * scale)
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - sw) // 2
    top = (nh - sh) // 2
    return resized.crop((left, top, left + sw, top + sh))


def overlay(base, color):
    layer = Image.new("RGBA", base.size, color)
    return Image.alpha_composite(base.convert("RGBA"), layer)


def paste_logo(page, logo_path, box, mode="contain"):
    logo = Image.open(logo_path).convert("RGBA")
    x, y, w, h = box
    ratio = min(w / logo.width, h / logo.height) if mode == "contain" else max(w / logo.width, h / logo.height)
    logo = logo.resize((int(logo.width * ratio), int(logo.height * ratio)), Image.Resampling.LANCZOS)
    page.alpha_composite(logo, (x, y))


def cover_page():
    hero = Image.open(ASSETS / "oil-tanker-hero.png").convert("RGB")
    page = fit_cover(hero, (W, H)).convert("RGBA")
    page = ImageEnhance.Contrast(page).enhance(0.92)
    page = overlay(page, (0, 0, 0, 112))
    grad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for x in range(W):
        alpha = int(180 * (1 - x / W))
        gd.line((x, 0, x, H), fill=(4, 7, 9, alpha))
    page = Image.alpha_composite(page, grad)
    draw = ImageDraw.Draw(page)

    paste_logo(page, ASSETS / "aci-logo-black.jpeg", (88, 92, 370, 140))

    x = 88
    y = 1070
    amber = (212, 155, 72, 255)
    white = (255, 255, 255, 255)
    soft = (232, 235, 232, 225)
    draw.text((x, y), "LOSS CONTROL PETROLERO Y EXPEDITING", font=F["eyebrow"], fill=amber)
    y += 50
    draw.text((x, y), "ACI LATAM", font=F["h1"], fill=white)
    y += 120
    y = draw_wrapped(
        draw,
        (x, y),
        "Control tecnico independiente para operaciones de carga, descarga, transferencia y almacenamiento de mercancias petroleras.",
        font(32),
        soft,
        860,
        1.2,
    )
    y += 44

    strip_x, strip_y, strip_w, strip_h = x, y, 940, 148
    draw.rectangle((strip_x, strip_y, strip_x + strip_w, strip_y + strip_h), fill=(11, 15, 18, 204), outline=(255, 255, 255, 58))
    col_w = strip_w // 3
    items = [
        ("FOCO", "Cantidad, calidad, tiempos y evidencia"),
        ("COBERTURA", "Chile, Ecuador, Colombia, Peru, Caribe y Estados Unidos"),
        ("CONTACTO", "contacto@acilatam.cl"),
    ]
    for i, (label, value) in enumerate(items):
        cx = strip_x + i * col_w
        if i:
            draw.line((cx, strip_y, cx, strip_y + strip_h), fill=(255, 255, 255, 45), width=1)
        draw.text((cx + 28, strip_y + 27), label, font=F["small_bold"], fill=amber)
        draw_wrapped(draw, (cx + 28, strip_y + 62), value, F["value"], soft, col_w - 56, 1.15)
    return page.convert("RGB")


def card(draw, x, y, w, h, title, body):
    draw.rounded_rectangle((x, y, x + w, y + h), radius=10, fill=(255, 255, 255), outline=(211, 218, 223), width=2)
    draw.text((x + 26, y + 24), title, font=F["h3"], fill=(31, 88, 103))
    draw_wrapped(draw, (x + 26, y + 64), body, F["small"], (52, 65, 73), w - 52, 1.28)


def content_page():
    page = Image.new("RGB", (W, H), (246, 247, 244))
    draw = ImageDraw.Draw(page)
    logo = Image.open(ASSETS / "aci-logo-black.jpeg").convert("RGBA")
    logo.thumbnail((300, 110), Image.Resampling.LANCZOS)
    page.paste(logo, (88, 74), logo)
    draw.text((910, 105), "BROCHURE CORPORATIVO", font=F["small_bold"], fill=(93, 104, 112))
    draw.line((88, 190, 1152, 190), fill=(207, 214, 218), width=2)

    y = 250
    draw.text((88, y), "Presencia tecnica donde", font=F["h2"], fill=(16, 20, 23))
    y += 60
    draw.text((88, y), "cada barril importa.", font=F["h2"], fill=(16, 20, 23))
    y += 86
    y = draw_wrapped(
        draw,
        (88, y),
        "ACI LATAM protege los intereses operacionales y economicos del cliente durante operaciones petroleras criticas. Actuamos como ojos tecnicos en terreno, registrando eventos, verificando mediciones, consolidando evidencias y emitiendo reportes claros para reducir perdidas, controversias y decisiones sin respaldo.",
        F["body"],
        (38, 52, 59),
        980,
        1.33,
    )
    y += 34

    cards = [
        ("Loss control y expediting", "Presencia en operaciones de carga, descarga y transferencia, con control de eventos, tiempos y alertas tempranas."),
        ("Reconciliacion operativa", "Comparacion de cantidades, documentos, mediciones y diferencias entre nave, terminal, planta o cliente."),
        ("Control cantidad/calidad", "Supervision de aforos, temperatura, muestreo, documentacion de laboratorio y consistencia operacional."),
        ("Soporte a reclamos", "Consolidacion de lineas de tiempo, fotografias, comunicaciones, calculos y documentos criticos."),
        ("Informes trazables", "Reportes preliminares, bitacoras de operacion, dossier documental e informe final con hallazgos."),
        ("Control documental", "Ordenamiento de evidencia operacional para respaldar cierres, diferencias, auditorias y decisiones ejecutivas."),
    ]
    card_w, card_h = 336, 178
    gap = 28
    start_x = 88
    for idx, data in enumerate(cards):
        cx = start_x + (idx % 3) * (card_w + gap)
        cy = y + (idx // 3) * (card_h + gap)
        card(draw, cx, cy, card_w, card_h, *data)

    y = y + 2 * card_h + gap + 50
    left = (88, y, 646, y + 260)
    right = (674, y, 1152, y + 260)
    draw.rounded_rectangle(left, radius=10, fill=(84, 110, 87))
    draw.rounded_rectangle(right, radius=10, fill=(17, 24, 29))
    draw.text((left[0] + 30, left[1] + 28), "Cobertura", font=font(30, True), fill=(255, 255, 255))
    draw_wrapped(draw, (left[0] + 30, left[1] + 74), "Capacidad de coordinacion para operaciones nacionales, regionales e internacionales.", F["small"], (230, 237, 230), 490, 1.25)
    bullets = ["Chile, Ecuador, Colombia y Peru.", "Caribe y Estados Unidos.", "Puertos, terminales, plantas, buques y puntos de transferencia."]
    by = left[1] + 142
    for bullet in bullets:
        draw.ellipse((left[0] + 32, by + 7, left[0] + 42, by + 17), fill=(212, 155, 72))
        draw_wrapped(draw, (left[0] + 56, by), bullet, F["small"], (238, 241, 238), 465, 1.2)
        by += 35

    draw.text((right[0] + 30, right[1] + 28), "Solicite cobertura", font=font(30, True), fill=(255, 255, 255))
    draw_wrapped(draw, (right[0] + 30, right[1] + 78), "Envienos los datos de la operacion, producto, terminal, fecha estimada y servicio requerido.", F["small"], (224, 229, 232), 405, 1.25)
    draw.text((right[0] + 30, right[1] + 172), "contacto@acilatam.cl", font=font(28, True), fill=(255, 255, 255))

    draw.line((88, 1664, 1152, 1664), fill=(207, 214, 218), width=2)
    draw.text((88, 1692), "ACI LATAM | Loss Control Experts", font=F["small"], fill=(101, 113, 123))
    draw.text((978, 1692), "www.acilatam.cl", font=F["small"], fill=(101, 113, 123))
    return page


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    pages = [cover_page(), content_page()]
    pngs = []
    for i, page in enumerate(pages, 1):
        path = OUT / f"ACI-LATAM-Brochure-Pagina-{i}.png"
        page.save(path, optimize=True)
        pngs.append(path)

    pdf = OUT / "ACI-LATAM-Brochure-Corporativo.pdf"
    pages[0].save(pdf, "PDF", resolution=150, save_all=True, append_images=pages[1:])

    preview = Image.new("RGB", (W, H * 2), (214, 221, 225))
    preview.paste(pages[0], (0, 0))
    preview.paste(pages[1], (0, H))
    preview_path = OUT / "ACI-LATAM-Brochure-Preview.png"
    preview.save(preview_path, optimize=True)

    print(pdf)
    print(preview_path)
    for path in pngs:
        print(path)


if __name__ == "__main__":
    main()
