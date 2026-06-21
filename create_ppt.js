const pptxgen = require("C:/Users/usuario/AppData/Roaming/npm/node_modules/pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "ACI Loss Control";
pres.title = "ACI Loss Control – Presentación Corporativa";

// ─── PALETTE ───────────────────────────────────────────────────
const NAVY   = "0D1B2A";   // fondo oscuro principal
const TEAL   = "00BFA5";   // acento verde-teal IA
const STEEL  = "1C3D5A";   // fondo secundario oscuro
const WHITE  = "FFFFFF";
const LIGHT  = "EAF4F4";   // fondo claro de slides de contenido
const AMBER  = "F5A623";   // callout / highlight
const GRAY   = "607D8B";   // texto secundario
const CARD   = "FFFFFF";

// ─── LOGOS ─────────────────────────────────────────────────────
const LOGO_ON_DARK  = "C:/Users/usuario/Documents/ACI Loss Control/assets/aci-logo-black.jpeg";
const LOGO_ON_LIGHT = "C:/Users/usuario/Documents/ACI Loss Control/assets/aci-logo-white.jpeg";

// ─── HELPERS ───────────────────────────────────────────────────
function darkBg(slide, color) {
  slide.background = { color: color || NAVY };
}
function lightBg(slide) {
  slide.background = { color: LIGHT };
}
function makeShadow() {
  return { type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.15 };
}
// Logo pequeño en esquina superior derecha (todas las slides de contenido)
function addLogoSmall(slide, isDark) {
  slide.addImage({ path: isDark ? LOGO_ON_DARK : LOGO_ON_LIGHT, x: 8.1, y: 0.08, w: 1.75, h: 0.58 });
}

// ─── SLIDE 1 – PORTADA ─────────────────────────────────────────
{
  const s = pres.addSlide();
  darkBg(s, NAVY);

  // Franja teal izquierda
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625,
    fill: { color: TEAL }, line: { color: TEAL }
  });

  // Franja teal inferior
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 4.9, w: 10, h: 0.725,
    fill: { color: STEEL }, line: { color: STEEL }
  });

  // Subtítulo superior
  s.addText("LOSS CONTROL · INSPECCIÓN · INTELIGENCIA ARTIFICIAL", {
    x: 0.5, y: 0.6, w: 9, h: 0.4,
    fontSize: 9, color: TEAL, bold: true, charSpacing: 4, align: "left"
  });

  // Título principal
  s.addText("ACI Loss Control", {
    x: 0.5, y: 1.15, w: 9, h: 1.3,
    fontSize: 52, fontFace: "Georgia", color: WHITE, bold: true, align: "left"
  });

  // Tagline
  s.addText("Protegemos tu operación de punta a punta\ncon tecnología de Inteligencia Artificial", {
    x: 0.5, y: 2.55, w: 8.5, h: 1.1,
    fontSize: 20, fontFace: "Calibri", color: "B0C4CE", align: "left"
  });

  // Línea decorativa
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 3.75, w: 2.2, h: 0.04,
    fill: { color: TEAL }, line: { color: TEAL }
  });

  // Logo prominente en portada (top-right)
  s.addImage({ path: LOGO_ON_DARK, x: 6.8, y: 0.12, w: 2.9, h: 0.97 });

  // Pie de página
  s.addText("Confidencial · 2025", {
    x: 0.5, y: 5.0, w: 5, h: 0.4,
    fontSize: 10, color: "607D8B", align: "left"
  });
  s.addText("www.acilatam.cl", {
    x: 6, y: 5.0, w: 3.8, h: 0.4,
    fontSize: 10, color: TEAL, align: "right"
  });
}

// ─── SLIDE 2 – QUIÉNES SOMOS ───────────────────────────────────
{
  const s = pres.addSlide();
  lightBg(s);

  // Barra lateral izquierda
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.12, h: 5.625,
    fill: { color: TEAL }, line: { color: TEAL }
  });

  s.addText("QUIÉNES SOMOS", {
    x: 0.35, y: 0.3, w: 9.5, h: 0.45,
    fontSize: 10, color: TEAL, bold: true, charSpacing: 3, align: "left"
  });
  s.addText("Una empresa dedicada a la inspección y control\nde pérdidas en operaciones de hidrocarburos", {
    x: 0.35, y: 0.75, w: 9.3, h: 0.9,
    fontSize: 26, fontFace: "Georgia", color: NAVY, bold: true, align: "left"
  });

  // 3 pilares
  const pillars = [
    { icon: "●", title: "Experiencia de campo", desc: "Inspectores certificados con amplia trayectoria en medición, muestreo y certificación de hidrocarburos en toda la cadena de custodia." },
    { icon: "●", title: "Cobertura nacional", desc: "Presencia en los principales polos de operación del país. Capacidad de respuesta rápida en plantas, terminales y buques." },
    { icon: "●", title: "Tecnología propia", desc: "Plataforma IA desarrollada in-house que digitaliza y audita cada proceso de inspección en tiempo real." },
  ];

  pillars.forEach((p, i) => {
    const x = 0.3 + i * 3.22;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.9, w: 3.0, h: 3.1,
      fill: { color: CARD }, line: { color: "D0E4E4", width: 1 },
      shadow: makeShadow()
    });
    // Acento teal top
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.9, w: 3.0, h: 0.07,
      fill: { color: TEAL }, line: { color: TEAL }
    });
    s.addText(p.title, {
      x: x + 0.18, y: 2.08, w: 2.65, h: 0.45,
      fontSize: 13, fontFace: "Calibri", color: NAVY, bold: true, align: "left"
    });
    s.addText(p.desc, {
      x: x + 0.18, y: 2.6, w: 2.65, h: 2.2,
      fontSize: 11, fontFace: "Calibri", color: GRAY, align: "left"
    });
  });
  addLogoSmall(s, false);
}

// ─── SLIDE 3 – COBERTURA ──────────────────────────────────────
{
  const s = pres.addSlide();
  darkBg(s, STEEL);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.12, h: 5.625,
    fill: { color: TEAL }, line: { color: TEAL }
  });

  s.addText("NUESTRA COBERTURA", {
    x: 0.35, y: 0.3, w: 9, h: 0.4,
    fontSize: 10, color: TEAL, bold: true, charSpacing: 3
  });
  s.addText("Servicios de inspección en toda la cadena de valor", {
    x: 0.35, y: 0.72, w: 9, h: 0.65,
    fontSize: 26, fontFace: "Georgia", color: WHITE, bold: true
  });

  const services = [
    ["Medición de Tanques", "Ullaje, temperatura, agua libre y sedimentos. Cálculo de volúmenes GSV/NSV a 15°C y 60°F."],
    ["Muestreo de Producto", "Obtención de muestras representativas según normas ASTM/IP. Trazabilidad completa del proceso."],
    ["Inspección de Buques", "Supervisión de operaciones de carga y descarga. Control de interfaces y documentación oficial."],
    ["Certificación de Calidad", "Análisis de laboratorio y emisión de certificados de calidad reconocidos internacionalmente."],
    ["Control de Pérdidas", "Identificación y cuantificación de diferencias. Reporte de desvíos con evidencia audiovisual."],
    ["Auditoría de Procesos", "Revisión integral de procedimientos operativos. Comparación contra estándares y mejores prácticas."],
  ];

  services.forEach((sv, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.3 + col * 3.22;
    const y = 1.7 + row * 1.7;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 3.0, h: 1.55,
      fill: { color: "112233", transparency: 20 }, line: { color: "1E4060", width: 1 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.06, h: 1.55,
      fill: { color: TEAL }, line: { color: TEAL }
    });
    s.addText(sv[0], {
      x: x + 0.15, y: y + 0.15, w: 2.75, h: 0.38,
      fontSize: 12, color: WHITE, bold: true, fontFace: "Calibri"
    });
    s.addText(sv[1], {
      x: x + 0.15, y: y + 0.52, w: 2.75, h: 0.9,
      fontSize: 10, color: "B0C4CE", fontFace: "Calibri"
    });
  });
  addLogoSmall(s, true);
}

// ─── SLIDE 4 – EL DESAFÍO ─────────────────────────────────────
{
  const s = pres.addSlide();
  lightBg(s);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.12, h: 5.625,
    fill: { color: AMBER }, line: { color: AMBER }
  });

  s.addText("EL DESAFÍO DEL SECTOR", {
    x: 0.35, y: 0.3, w: 9, h: 0.4,
    fontSize: 10, color: AMBER, bold: true, charSpacing: 3
  });
  s.addText("¿Por qué las pérdidas siguen ocurriendo?", {
    x: 0.35, y: 0.72, w: 9, h: 0.65,
    fontSize: 26, fontFace: "Georgia", color: NAVY, bold: true
  });

  // Stat callouts
  const stats = [
    ["0.3–1%", "de pérdida operativa\npromedio aceptada\nen la industria"],
    ["60%", "de desvíos originados\nen errores de proceso\no registro"],
    ["Sin trazabilidad", "la mayoría de los\nincidentes no pueden\nauditarse después"],
  ];

  stats.forEach((st, i) => {
    const x = 0.3 + i * 3.22;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.65, w: 3.0, h: 1.7,
      fill: { color: "FFF3E0" }, line: { color: "FFD180", width: 1 },
      shadow: makeShadow()
    });
    s.addText(st[0], {
      x: x + 0.12, y: 1.75, w: 2.76, h: 0.75,
      fontSize: st[0].length > 5 ? 22 : 32, fontFace: "Georgia", color: AMBER, bold: true, align: "center"
    });
    s.addText(st[1], {
      x: x + 0.12, y: 2.5, w: 2.76, h: 0.75,
      fontSize: 10.5, color: GRAY, align: "center", fontFace: "Calibri"
    });
  });

  // Bullets de problemática
  const problems = [
    "Los registros en papel o planillas son propensos a errores humanos e inconsistencias.",
    "No existe evidencia audiovisual que respalde las mediciones realizadas en campo.",
    "Los desvíos se detectan tarde: cuando el impacto económico ya es significativo.",
    "La cadena de custodia se rompe por falta de un sistema de trazabilidad integral.",
  ];

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 3.55, w: 9.4, h: 1.8,
    fill: { color: CARD }, line: { color: "D0D0D0", width: 1 }
  });

  problems.forEach((pb, i) => {
    s.addText([
      { text: "▸  ", options: { color: AMBER, bold: true } },
      { text: pb, options: { color: NAVY } }
    ], {
      x: 0.5, y: 3.67 + i * 0.39, w: 9.0, h: 0.37,
      fontSize: 11, fontFace: "Calibri"
    });
  });
  addLogoSmall(s, false);
}

// ─── SLIDE 5 – NUESTRA SOLUCIÓN IA ────────────────────────────
{
  const s = pres.addSlide();
  darkBg(s, NAVY);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.12, h: 5.625,
    fill: { color: TEAL }, line: { color: TEAL }
  });

  s.addText("NUESTRA SOLUCIÓN", {
    x: 0.35, y: 0.3, w: 9, h: 0.4,
    fontSize: 10, color: TEAL, bold: true, charSpacing: 3
  });
  s.addText("Procesos de inspección potenciados por IA", {
    x: 0.35, y: 0.72, w: 9, h: 0.65,
    fontSize: 26, fontFace: "Georgia", color: WHITE, bold: true
  });

  // Layout: texto izquierda, diagram derecha
  // Columna izquierda - descripción
  s.addText("Grabación inteligente de procesos", {
    x: 0.35, y: 1.55, w: 5.0, h: 0.45,
    fontSize: 16, color: TEAL, bold: true, fontFace: "Calibri"
  });
  s.addText("Cada operación de medición y muestreo es grabada en video. Nuestra plataforma de IA analiza el registro audiovisual y edita automáticamente el paso a paso del proceso, documentando cada acción del inspector con timestamps y anotaciones técnicas.", {
    x: 0.35, y: 2.05, w: 5.0, h: 1.5,
    fontSize: 12, color: "B0C4CE", fontFace: "Calibri"
  });

  const features = [
    "Detección automática de cada etapa del proceso",
    "Anotación de parámetros medidos (ullaje, temperatura, densidad)",
    "Generación del informe técnico desde el video",
    "Almacenamiento seguro en la nube con acceso auditado",
  ];
  features.forEach((f, i) => {
    s.addText([
      { text: "✓  ", options: { color: TEAL, bold: true } },
      { text: f, options: { color: WHITE } }
    ], {
      x: 0.35, y: 3.65 + i * 0.37, w: 5.0, h: 0.35,
      fontSize: 11, fontFace: "Calibri"
    });
  });

  // Diagrama derecha – flujo de 4 pasos
  const steps = ["GRABA", "ANALIZA", "EDITA", "REPORTA"];
  const stepColors = [TEAL, "00897B", "00695C", "004D40"];
  steps.forEach((st, i) => {
    const y = 1.55 + i * 0.95;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.0, y, w: 3.6, h: 0.78,
      fill: { color: stepColors[i] }, line: { color: stepColors[i] },
      shadow: makeShadow()
    });
    s.addText(`${i + 1}. ${st}`, {
      x: 6.0, y: y + 0.18, w: 3.6, h: 0.42,
      fontSize: 16, color: WHITE, bold: true, align: "center", fontFace: "Calibri"
    });
    // Flecha entre pasos
    if (i < 3) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 7.6, y: y + 0.78, w: 0.08, h: 0.17,
        fill: { color: "B0C4CE" }, line: { color: "B0C4CE" }
      });
    }
  });
  addLogoSmall(s, true);
}

// ─── SLIDE 6 – EDICIÓN IA DEL PASO A PASO ─────────────────────
{
  const s = pres.addSlide();
  lightBg(s);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.12, h: 5.625,
    fill: { color: TEAL }, line: { color: TEAL }
  });

  s.addText("EDICIÓN IA DEL PROCESO", {
    x: 0.35, y: 0.3, w: 9, h: 0.4,
    fontSize: 10, color: TEAL, bold: true, charSpacing: 3
  });
  s.addText("Del video al informe técnico en minutos", {
    x: 0.35, y: 0.72, w: 9, h: 0.65,
    fontSize: 26, fontFace: "Georgia", color: NAVY, bold: true
  });

  // Timeline horizontal
  const timeline = [
    { step: "01", label: "Grabación en campo", desc: "El inspector graba el proceso completo con audio y video desde el dispositivo móvil." },
    { step: "02", label: "Análisis de video IA", desc: "La IA identifica cada etapa: acceso al tanque, colocación de la cinta, lectura, extracción." },
    { step: "03", label: "Estructuración automática", desc: "Genera el paso a paso documentado con capturas, timestamps y parámetros anotados." },
    { step: "04", label: "Validación del inspector", desc: "El inspector revisa y confirma el informe generado. El consultor IA puede señalar observaciones." },
    { step: "05", label: "Entrega al cliente", desc: "Informe técnico certificado disponible en la plataforma con acceso inmediato." },
  ];

  timeline.forEach((t, i) => {
    const x = 0.22 + i * 1.92;
    // Círculo numerado
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.45, y: 1.55, w: 0.7, h: 0.7,
      fill: { color: TEAL }, line: { color: TEAL }
    });
    s.addText(t.step, {
      x: x + 0.45, y: 1.57, w: 0.7, h: 0.7,
      fontSize: 14, color: WHITE, bold: true, align: "center", valign: "middle"
    });
    // Línea conectora
    if (i < 4) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 1.15, y: 1.87, w: 0.75, h: 0.03,
        fill: { color: TEAL }, line: { color: TEAL }
      });
    }
    // Tarjeta
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.05, y: 2.45, w: 1.72, h: 2.8,
      fill: { color: CARD }, line: { color: "D0E4E4", width: 1 },
      shadow: makeShadow()
    });
    s.addText(t.label, {
      x: x + 0.12, y: 2.55, w: 1.58, h: 0.55,
      fontSize: 10.5, color: NAVY, bold: true, fontFace: "Calibri"
    });
    s.addText(t.desc, {
      x: x + 0.12, y: 3.12, w: 1.58, h: 2.0,
      fontSize: 9.5, color: GRAY, fontFace: "Calibri"
    });
  });
  addLogoSmall(s, false);
}

// ─── SLIDE 7 – CONSULTOR IA ───────────────────────────────────
{
  const s = pres.addSlide();
  darkBg(s, NAVY);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.12, h: 5.625,
    fill: { color: TEAL }, line: { color: TEAL }
  });

  s.addText("CONSULTOR IA", {
    x: 0.35, y: 0.3, w: 9, h: 0.4,
    fontSize: 10, color: TEAL, bold: true, charSpacing: 3
  });
  s.addText("Análisis de desvíos de punta a punta", {
    x: 0.35, y: 0.72, w: 9, h: 0.65,
    fontSize: 26, fontFace: "Georgia", color: WHITE, bold: true
  });

  // Panel central del consultor
  s.addShape(pres.shapes.RECTANGLE, {
    x: 3.2, y: 1.55, w: 3.6, h: 3.6,
    fill: { color: TEAL, transparency: 85 }, line: { color: TEAL, width: 2 },
    shadow: makeShadow()
  });
  s.addText("CONSULTOR IA", {
    x: 3.2, y: 2.2, w: 3.6, h: 0.5,
    fontSize: 15, color: WHITE, bold: true, align: "center", charSpacing: 2
  });
  s.addText("Motor de análisis\ninteligente", {
    x: 3.2, y: 2.75, w: 3.6, h: 0.7,
    fontSize: 12, color: TEAL, align: "center"
  });
  s.addText("Revisa la operación completa\nidentificando patrones de riesgo\ny desvíos vs. procedimientos", {
    x: 3.2, y: 3.5, w: 3.6, h: 1.0,
    fontSize: 10.5, color: "B0C4CE", align: "center", fontFace: "Calibri"
  });

  // Entradas (izquierda)
  const inputs = ["Video del proceso", "Parámetros medidos", "Histórico de operaciones", "Normas y procedimientos"];
  s.addText("ENTRADAS", {
    x: 0.2, y: 1.6, w: 2.8, h: 0.35,
    fontSize: 10, color: TEAL, bold: true, charSpacing: 2, align: "center"
  });
  inputs.forEach((inp, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.2, y: 2.05 + i * 0.72, w: 2.7, h: 0.58,
      fill: { color: STEEL }, line: { color: "1E4060" }
    });
    s.addText(inp, {
      x: 0.2, y: 2.05 + i * 0.72, w: 2.7, h: 0.58,
      fontSize: 10.5, color: WHITE, align: "center", valign: "middle", fontFace: "Calibri"
    });
    // Flecha →
    s.addShape(pres.shapes.RECTANGLE, {
      x: 2.9, y: 2.27 + i * 0.72, w: 0.3, h: 0.03,
      fill: { color: TEAL }, line: { color: TEAL }
    });
  });

  // Salidas (derecha)
  const outputs = ["Alerta de desvío", "Reporte de riesgo", "Recomendaciones", "Trazabilidad completa"];
  s.addText("SALIDAS", {
    x: 7.0, y: 1.6, w: 2.8, h: 0.35,
    fontSize: 10, color: AMBER, bold: true, charSpacing: 2, align: "center"
  });
  outputs.forEach((out, i) => {
    // Flecha →
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.8, y: 2.27 + i * 0.72, w: 0.3, h: 0.03,
      fill: { color: AMBER }, line: { color: AMBER }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.1, y: 2.05 + i * 0.72, w: 2.7, h: 0.58,
      fill: { color: STEEL }, line: { color: AMBER, width: 1 }
    });
    s.addText(out, {
      x: 7.1, y: 2.05 + i * 0.72, w: 2.7, h: 0.58,
      fontSize: 10.5, color: AMBER, align: "center", valign: "middle", fontFace: "Calibri", bold: true
    });
  });
  addLogoSmall(s, true);
}

// ─── SLIDE 8 – BENEFICIOS CLAVE ───────────────────────────────
{
  const s = pres.addSlide();
  lightBg(s);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.12, h: 5.625,
    fill: { color: TEAL }, line: { color: TEAL }
  });

  s.addText("BENEFICIOS CLAVE", {
    x: 0.35, y: 0.3, w: 9, h: 0.4,
    fontSize: 10, color: TEAL, bold: true, charSpacing: 3
  });
  s.addText("¿Qué gana tu operación?", {
    x: 0.35, y: 0.72, w: 9, h: 0.65,
    fontSize: 26, fontFace: "Georgia", color: NAVY, bold: true
  });

  const benefits = [
    {
      metric: "↓ Pérdidas",
      title: "Reducción de pérdidas",
      desc: "La detección temprana de desvíos en cada operación reduce significativamente las pérdidas no justificadas.",
      color: TEAL
    },
    {
      metric: "100%",
      title: "Trazabilidad total",
      desc: "Cada proceso queda documentado en video, con registro de parámetros, responsable y timestamp inmutable.",
      color: "00897B"
    },
    {
      metric: "⚡ Tiempo real",
      title: "Alertas inmediatas",
      desc: "El Consultor IA detecta anomalías al instante y notifica a supervisores antes de que el impacto escale.",
      color: AMBER
    },
    {
      metric: "✔ Compliance",
      title: "Cumplimiento normativo",
      desc: "Informes alineados a normas ASTM, IP e ISO. Documentación lista para auditorías y disputas comerciales.",
      color: "1565C0"
    },
  ];

  benefits.forEach((b, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.3 + col * 4.85;
    const y = 1.65 + row * 1.9;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.55, h: 1.75,
      fill: { color: CARD }, line: { color: "D0E4E4", width: 1 },
      shadow: makeShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.55, h: 0.07,
      fill: { color: b.color }, line: { color: b.color }
    });
    s.addText(b.metric, {
      x: x + 0.18, y: y + 0.13, w: 2.0, h: 0.5,
      fontSize: 14, color: b.color, bold: true, fontFace: "Calibri", align: "left"
    });
    s.addText(b.title, {
      x: x + 2.25, y: y + 0.15, w: 2.12, h: 0.45,
      fontSize: 13, color: NAVY, bold: true, fontFace: "Calibri"
    });
    s.addText(b.desc, {
      x: x + 0.18, y: y + 0.65, w: 4.2, h: 1.0,
      fontSize: 11, color: GRAY, fontFace: "Calibri"
    });
  });
  addLogoSmall(s, false);
}

// ─── SLIDE 9 – FLUJO INTEGRAL ─────────────────────────────────
{
  const s = pres.addSlide();
  darkBg(s, STEEL);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.12, h: 5.625,
    fill: { color: TEAL }, line: { color: TEAL }
  });

  s.addText("FLUJO INTEGRAL DE OPERACIÓN", {
    x: 0.35, y: 0.3, w: 9, h: 0.4,
    fontSize: 10, color: TEAL, bold: true, charSpacing: 3
  });
  s.addText("De la operación en campo al informe certificado", {
    x: 0.35, y: 0.72, w: 9, h: 0.65,
    fontSize: 24, fontFace: "Georgia", color: WHITE, bold: true
  });

  // Flujo en 6 etapas
  const flow = [
    { n: "1", label: "Operación\nen campo", color: TEAL },
    { n: "2", label: "Grabación\nIA activa", color: "009688" },
    { n: "3", label: "Análisis\nautomático", color: "00796B" },
    { n: "4", label: "Detección\nde desvíos", color: AMBER },
    { n: "5", label: "Informe\ntécnico", color: "1565C0" },
    { n: "6", label: "Entrega\ncertificada", color: NAVY },
  ];

  flow.forEach((f, i) => {
    const x = 0.4 + i * 1.55;
    const y = 1.7;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 1.35, h: 1.35,
      fill: { color: f.color }, line: { color: f.color },
      shadow: makeShadow()
    });
    s.addText(f.n, {
      x, y: y + 0.1, w: 1.35, h: 0.55,
      fontSize: 28, color: WHITE, bold: true, align: "center", fontFace: "Georgia"
    });
    s.addText(f.label, {
      x, y: y + 0.65, w: 1.35, h: 0.6,
      fontSize: 9.5, color: WHITE, align: "center", fontFace: "Calibri"
    });
    // Flecha
    if (i < 5) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 1.35, y: y + 0.63, w: 0.2, h: 0.03,
        fill: { color: "B0C4CE" }, line: { color: "B0C4CE" }
      });
    }
  });

  // Descripción abajo
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 3.25, w: 9.4, h: 2.1,
    fill: { color: "0D1B2A", transparency: 20 }, line: { color: "1E4060" }
  });

  const descs = [
    "El inspector activa la grabación al iniciar la operación. La IA reconoce automáticamente el contexto (medición de ullaje, toma de muestra, etc.).",
    "El Consultor IA compara cada paso con los procedimientos estándar y el historial del operador. Detecta desvíos en tiempo real.",
    "Al concluir, el sistema genera el informe técnico completo con evidencia audiovisual, parámetros registrados y estado de cumplimiento.",
  ];

  descs.forEach((d, i) => {
    s.addText([
      { text: `${["01", "02", "03"][i]}  `, options: { color: TEAL, bold: true } },
      { text: d, options: { color: "B0C4CE" } }
    ], {
      x: 0.5, y: 3.38 + i * 0.6, w: 9.0, h: 0.55,
      fontSize: 11, fontFace: "Calibri"
    });
  });
  addLogoSmall(s, true);
}

// ─── SLIDE 10 – POR QUÉ ACI ───────────────────────────────────
{
  const s = pres.addSlide();
  lightBg(s);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.12, h: 5.625,
    fill: { color: TEAL }, line: { color: TEAL }
  });

  s.addText("POR QUÉ ACI LOSS CONTROL", {
    x: 0.35, y: 0.3, w: 9, h: 0.4,
    fontSize: 10, color: TEAL, bold: true, charSpacing: 3
  });
  s.addText("La única firma que combina inspección certificada con IA propia", {
    x: 0.35, y: 0.72, w: 9.3, h: 0.65,
    fontSize: 22, fontFace: "Georgia", color: NAVY, bold: true
  });

  const diff = [
    { title: "Inspección + Tecnología", body: "No somos solo una empresa tecnológica ni solo una empresa inspectora. Somos ambas, integradas.", icon: "★" },
    { title: "IA desarrollada para el sector", body: "Nuestro motor IA fue entrenado específicamente con procesos de medición y muestreo de hidrocarburos.", icon: "★" },
    { title: "Evidencia irrefutable", body: "El video y los datos procesados por IA son evidencia válida ante cualquier disputa comercial o regulatoria.", icon: "★" },
    { title: "Implementación inmediata", body: "Sin hardware especial. El inspector usa su dispositivo móvil. La plataforma funciona desde el primer día.", icon: "★" },
    { title: "Mejora continua", body: "El Consultor IA aprende de cada operación, mejorando la precisión de detección de desvíos con el tiempo.", icon: "★" },
    { title: "Soporte 24 / 7", body: "Equipo técnico disponible para acompañar cualquier operación crítica y resolver consultas en tiempo real.", icon: "★" },
  ];

  diff.forEach((d, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.3 + col * 3.22;
    const y = 1.65 + row * 1.8;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 3.0, h: 1.62,
      fill: { color: CARD }, line: { color: "D0E4E4" },
      shadow: makeShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 3.0, h: 0.06,
      fill: { color: TEAL }, line: { color: TEAL }
    });
    s.addText(d.title, {
      x: x + 0.15, y: y + 0.14, w: 2.7, h: 0.42,
      fontSize: 12, color: NAVY, bold: true, fontFace: "Calibri"
    });
    s.addText(d.body, {
      x: x + 0.15, y: y + 0.58, w: 2.7, h: 0.95,
      fontSize: 10.5, color: GRAY, fontFace: "Calibri"
    });
  });
  addLogoSmall(s, false);
}

// ─── SLIDE 11 – CIERRE / CTA ──────────────────────────────────
{
  const s = pres.addSlide();
  darkBg(s, NAVY);

  // Franja teal izquierda
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625,
    fill: { color: TEAL }, line: { color: TEAL }
  });

  // Fondo derecho teal suave
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.5, y: 0, w: 4.5, h: 5.625,
    fill: { color: STEEL }, line: { color: STEEL }
  });

  s.addText("¿LISTO PARA TRANSFORMAR\nTU OPERACIÓN?", {
    x: 0.45, y: 1.1, w: 5.0, h: 1.8,
    fontSize: 28, fontFace: "Georgia", color: WHITE, bold: true, align: "left"
  });

  s.addText("Agenda una demostración gratuita y descubre cómo la IA de ACI puede proteger tu operación hoy.", {
    x: 0.45, y: 3.05, w: 4.9, h: 0.9,
    fontSize: 13, color: "B0C4CE", align: "left", fontFace: "Calibri"
  });

  // Botón CTA
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 4.1, w: 2.8, h: 0.65,
    fill: { color: TEAL }, line: { color: TEAL }
  });
  s.addText("SOLICITAR DEMO", {
    x: 0.45, y: 4.12, w: 2.8, h: 0.65,
    fontSize: 14, color: WHITE, bold: true, align: "center", valign: "middle", charSpacing: 2
  });

  // Contacto
  s.addText("CONTACTO", {
    x: 5.8, y: 1.3, w: 3.9, h: 0.4,
    fontSize: 10, color: TEAL, bold: true, charSpacing: 4
  });

  const contacts = [
    ["Email", "danielratto@acilatam.cl"],
    ["Web", "www.acilatam.cl"],
    ["Plataforma IA", "app.acilatam.cl"],
  ];
  contacts.forEach(([label, val], i) => {
    s.addText(label.toUpperCase(), {
      x: 5.8, y: 1.85 + i * 0.82, w: 3.9, h: 0.32,
      fontSize: 9, color: GRAY, bold: true, charSpacing: 2
    });
    s.addText(val, {
      x: 5.8, y: 2.16 + i * 0.82, w: 3.9, h: 0.38,
      fontSize: 13, color: WHITE, fontFace: "Calibri"
    });
  });

  // Tagline pie
  s.addText("ACI Loss Control · Inspección certificada potenciada por Inteligencia Artificial", {
    x: 0.45, y: 5.15, w: 9.3, h: 0.35,
    fontSize: 9.5, color: "607D8B", align: "center"
  });
  addLogoSmall(s, true);
}

// ─── WRITE FILE ────────────────────────────────────────────────
pres.writeFile({ fileName: "C:/Users/usuario/Documents/ACI Loss Control/ACI_Loss_Control_Presentacion.pptx" })
  .then(() => console.log("✅ Presentación creada: ACI_Loss_Control_Presentacion.pptx"))
  .catch(e => console.error("Error:", e));
