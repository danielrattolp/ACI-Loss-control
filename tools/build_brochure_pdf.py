from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "outputs" / "brochure"
ASSETS = ROOT / "assets"
W, H = 1240, 1754

AMBER  = (212, 155, 72)
NAVY   = (26,  47,  90)
GREEN  = (54,  94,  56)
INK    = (16,  20,  23)
MUTED  = (93, 104, 112)
LIGHT  = (246, 247, 244)
WHITE  = (255, 255, 255)
CARD_BD = (211, 218, 223)
STEEL  = (31,  88, 103)


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
    "eyebrow":    font(20, True),
    "h1":         font(100, True, True),
    "h2":         font(54, True, True),
    "h3":         font(24, True),
    "body":       font(21),
    "small":      font(18),
    "small_bold": font(18, True),
    "value":      font(22, True),
}


def wrap(draw, text, fnt, max_width):
    words = text.split()
    lines, current = [], ""
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
    top  = (nh - sh) // 2
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


# ── PÁGINA 1: PORTADA ──────────────────────────────────────────────────────
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

    x    = 88
    y    = 1050
    amberA = (*AMBER, 255)
    whiteA = (*WHITE, 255)
    softA  = (232, 235, 232, 225)

    draw.text((x, y), "LOSS CONTROL PETROLERO Y EXPEDITING", font=F["eyebrow"], fill=amberA)
    y += 50
    draw.text((x, y), "ACI LATAM", font=F["h1"], fill=whiteA)
    y += 120
    y = draw_wrapped(
        draw, (x, y),
        "Control tecnico independiente para operaciones de carga, descarga, "
        "transferencia y almacenamiento de mercancias petroleras.",
        font(32), softA, 860, 1.2,
    )
    y += 44

    strip_x, strip_y, strip_w, strip_h = x, y, 1064, 148
    draw.rectangle(
        (strip_x, strip_y, strip_x + strip_w, strip_y + strip_h),
        fill=(11, 15, 18, 204), outline=(255, 255, 255, 58),
    )
    col_w = strip_w // 3
    items = [
        ("FOCO",      "Cantidad, calidad, tiempos y evidencia"),
        ("COBERTURA", "Chile, Argentina, Ecuador, Colombia, Peru, Caribe y Estados Unidos"),
        ("CONTACTO",  "contacto@acilatam.cl"),
    ]
    for i, (label, value) in enumerate(items):
        cx = strip_x + i * col_w
        if i:
            draw.line((cx, strip_y, cx, strip_y + strip_h), fill=(255, 255, 255, 45), width=1)
        draw.text((cx + 28, strip_y + 27), label, font=F["small_bold"], fill=amberA)
        draw_wrapped(draw, (cx + 28, strip_y + 62), value, F["value"], softA, col_w - 56, 1.15)

    return page.convert("RGB")


# ── PÁGINA 2: CONTENIDO ────────────────────────────────────────────────────
def content_page():
    page = Image.new("RGB", (W, H), LIGHT)
    draw = ImageDraw.Draw(page)

    # Header
    logo = Image.open(ASSETS / "aci-logo-black.jpeg").convert("RGBA")
    logo.thumbnail((300, 110), Image.Resampling.LANCZOS)
    page.paste(logo, (88, 74), logo)
    draw.text((870, 105), "BROCHURE CORPORATIVO 2025", font=F["small_bold"], fill=MUTED)
    draw.line((88, 190, 1152, 190), fill=(207, 214, 218), width=2)

    # ── Título principal ──────────────────────────────────────────────────
    y = 226
    draw.text((88, y), "Presencia tecnica donde", font=F["h2"], fill=INK)
    y += 60
    draw.text((88, y), "cada barril importa.", font=F["h2"], fill=INK)
    y += 76
    y = draw_wrapped(
        draw, (88, y),
        "ACI LATAM actua como ojos tecnicos independientes en operaciones petroleras criticas. "
        "Cada intervencion genera evidencia estructurada, calculos trazables y reportes que "
        "respaldan decisiones ejecutivas, cierres contractuales y reclamaciones.",
        F["body"], (38, 52, 59), 1064, 1.3,
    )
    y += 28

    # ── CÓMO OPERAMOS ─────────────────────────────────────────────────────
    draw.text((88, y), "COMO OPERAMOS — FLUJO DE CADA OPERACION", font=F["eyebrow"], fill=AMBER)
    y += 32
    draw.text((88, y), "No hacemos inspecciones. Auditamos procesos de inspeccion.", font=font(22, True, True), fill=NAVY)
    y += 38

    steps = [
        ("01", "Datos de Origen",    "Conciliacion de datos origen para trazabilidad y analisis de desvio."),
        ("02", "Key Meeting",        "Verificacion de acuerdos y control para cumplimiento via cuestionario pre cargado basado en API 17.1."),
        ("03", "Medicion",           "Verificacion de acreditaciones y calibraciones de equipos y algoritmos de calculo basados en API 7, 11 y 12."),
        ("04", "Monitoreo",          "Durante la descarga, verificacion de rate hora a hora con comentarios a incumplimientos basados en el Key Meeting."),
        ("05", "Reporte Evolutivo",  "Conciliacion de toda la informacion desde origen hasta destino con analisis del Consultor IA y sus conclusiones."),
        ("06", "Reporte Final",      "Dossier trazable, certificados firmados y PDF completo exportable del sistema."),
    ]

    n_steps = len(steps)
    gap     = 14
    sw      = (1064 - gap * (n_steps - 1)) // n_steps   # ≈ 162px
    sh      = 158
    sx, sy  = 88, y

    for i, (num, title, desc) in enumerate(steps):
        bx = sx + i * (sw + gap)

        # Arrow between boxes
        if i > 0:
            ax, ay = bx - gap, sy + sh // 2
            draw.polygon([(ax, ay - 6), (ax + gap - 2, ay), (ax, ay + 6)], fill=AMBER)

        # Card
        draw.rounded_rectangle((bx, sy, bx + sw, sy + sh), radius=8, fill=WHITE, outline=CARD_BD, width=2)

        # Number badge
        draw.ellipse((bx + 14, sy + 13, bx + 44, sy + 43), fill=NAVY)
        draw.text((bx + 20, sy + 16), num, font=font(17, True), fill=WHITE)

        # Title
        draw.text((bx + 14, sy + 54), title, font=font(16, True), fill=NAVY)

        # Desc
        draw_wrapped(draw, (bx + 14, sy + 77), desc, font(13), MUTED, sw - 28, 1.22)

    y = sy + sh + 34

    # ── DOS COLUMNAS: REPORTES (izq) + IA (der) ───────────────────────────
    col1_x, col1_w = 88,  540
    col2_x, col2_w = 652, 500

    # Etiqueta sección
    draw.text((col1_x, y), "TIPOS DE REPORTES QUE EMITIMOS", font=F["eyebrow"], fill=AMBER)
    draw.text((col2_x, y), "CONSULTOR IA INTEGRADO", font=F["eyebrow"], fill=AMBER)
    y += 32

    reports_top = y

    reports = [
        ("Reporte Preliminar",      "Emitido durante la operacion con datos parciales y alertas tempranas."),
        ("Bitacora Operacional/SOF", "Registro cronologico de eventos, tiempos, pausas y acuerdos en cubierta."),
        ("Discharge Record",         "Log horario de volumenes bombeados, presiones y observaciones de descarga."),
        ("Certificate of Quantity",  "COQ: GOV, GSV, TCV, Free Water, API, BS&W y metodo de calculo aplicado."),
        ("Certificate of Quality",   "Analisis tecnico de los resultados de origen vs. destino basado en la informacion suministrada."),
        ("Reporte VEF Comparativo",  "Revision de la correcta imputacion de datos y validacion de viajes segun operacion calificable para confeccion del reporte."),
        ("Informe Final — Dossier",  "Hallazgos, analisis de diferencia, causas y evidencia fotografica completa."),
    ]

    ry = y
    for rpt_title, rpt_desc in reports:
        # Amber bullet
        draw.ellipse((col1_x, ry + 7, col1_x + 11, ry + 18), fill=AMBER)
        draw.text((col1_x + 20, ry), rpt_title, font=font(16, True), fill=NAVY)
        ry += 24
        ry = draw_wrapped(draw, (col1_x + 20, ry), rpt_desc, font(14), (60, 72, 80), col1_w - 20, 1.22)
        ry += 9

    # IA box — altura fijada para coincidir con la columna de reportes
    ia_h   = max(ry - reports_top, 280)
    ia_top = reports_top

    draw.rounded_rectangle(
        (col2_x, ia_top, col2_x + col2_w, ia_top + ia_h),
        radius=10, fill=NAVY,
    )

    iy = ia_top + 28
    draw.text((col2_x + 28, iy), "IA como segundo par", font=font(24, True), fill=WHITE)
    iy += 32
    draw.text((col2_x + 28, iy), "de ojos tecnicos", font=font(24, True), fill=WHITE)
    iy += 30
    iy = draw_wrapped(
        draw, (col2_x + 28, iy),
        "Complementa la experiencia del equipo escudrinando cada modulo, comparando origen vs. destino y entregando conclusiones objetivas basadas en normas y condiciones fisicoquimicas del producto.",
        font(13), (185, 200, 210), col2_w - 56, 1.25,
    )
    iy += 16

    ia_items = [
        ("Escrutinio modulo a modulo",
         "Revisa BL, ullage, VEF, termometros y checklist detectando inconsistencias entre datos ingresados."),
        ("Comparacion origen vs. destino",
         "Concilia cantidades y calidad entre puerto de carga y arribo con analisis de desvio cuantificado."),
        ("Causas fisicoquimicas del desvio",
         "Evalua temperatura, API, BS&W y condiciones de trim como variables explicativas de diferencias."),
        ("Clasificacion de error segun API MPMS 13",
         "Distingue error sistematico (sesgo del buque) de error aleatorio con fundamento estadistico."),
        ("Conclusiones objetivas para el informe",
         "Genera texto tecnico estructurado listo para incorporar al reporte final del inspector."),
    ]

    for ia_t, ia_d in ia_items:
        if iy + 70 > ia_top + ia_h - 20:
            break
        # Small amber line accent
        draw.rectangle((col2_x + 28, iy, col2_x + 36, iy + 2), fill=AMBER)
        iy += 10
        draw.text((col2_x + 28, iy), ia_t, font=font(15, True), fill=WHITE)
        iy += 22
        iy = draw_wrapped(draw, (col2_x + 28, iy), ia_d, font(13), (185, 200, 210), col2_w - 56, 1.2)
        iy += 14

    # Nota al pie de la caja IA
    footer_ia_y = ia_top + ia_h - 44
    draw.line((col2_x + 28, footer_ia_y, col2_x + col2_w - 28, footer_ia_y), fill=(255, 255, 255, 40), width=1)
    draw.text((col2_x + 28, footer_ia_y + 10), "Sistema Operacional — app.acilatam.cl", font=font(13), fill=(160, 180, 195))

    y = max(ry, ia_top + ia_h) + 36

    # ── COBERTURA + CONTACTO ──────────────────────────────────────────────
    box_h    = 236
    left_box = (88,  y, 644, y + box_h)
    rght_box = (672, y, 1152, y + box_h)

    draw.rounded_rectangle(left_box, radius=10, fill=GREEN)
    draw.rounded_rectangle(rght_box, radius=10, fill=(17, 24, 29))

    # Cobertura
    draw.text((left_box[0] + 30, left_box[1] + 24), "Cobertura regional", font=font(28, True), fill=WHITE)
    draw_wrapped(
        draw, (left_box[0] + 30, left_box[1] + 66),
        "Presencia en Sudamerica, Caribe y Estados Unidos.",
        F["small"], (210, 228, 210), 488, 1.25,
    )
    bullets = [
        "Chile y Argentina.",
        "Ecuador, Colombia y Peru.",
        "Caribe.",
        "Estados Unidos.",
    ]
    by = left_box[1] + 124
    for bullet in bullets:
        draw.ellipse((left_box[0] + 32, by + 5, left_box[0] + 42, by + 15), fill=AMBER)
        draw_wrapped(draw, (left_box[0] + 56, by), bullet, F["small"], (238, 241, 238), 465, 1.2)
        by += 27

    # Contacto
    draw.text((rght_box[0] + 30, rght_box[1] + 24), "Solicite cobertura", font=font(28, True), fill=WHITE)
    draw_wrapped(
        draw, (rght_box[0] + 30, rght_box[1] + 70),
        "Envienos los datos de la operacion, producto, terminal, fecha estimada y servicio requerido.",
        F["small"], (224, 229, 232), 408, 1.25,
    )
    draw.text((rght_box[0] + 30, rght_box[1] + 162), "contacto@acilatam.cl", font=font(26, True), fill=WHITE)
    draw_wrapped(
        draw, (rght_box[0] + 30, rght_box[1] + 200),
        "www.acilatam.cl", font(18), (160, 175, 185), 400, 1.2,
    )

    # Footer
    draw.line((88, 1686, 1152, 1686), fill=(207, 214, 218), width=2)
    draw.text((88,  1710), "ACI LATAM | Loss Control Experts", font=F["small"], fill=MUTED)
    draw.text((960, 1710), "www.acilatam.cl", font=F["small"], fill=MUTED)

    return page


# ── MAIN ──────────────────────────────────────────────────────────────────
def main():
    OUT.mkdir(parents=True, exist_ok=True)
    pages = [cover_page(), content_page()]
    pngs  = []
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
    for p in pngs:
        print(p)


if __name__ == "__main__":
    main()
