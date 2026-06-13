import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "docs", "operaciones");
await fs.mkdir(outDir, { recursive: true });

const COLORS = {
  ink: "#0B0F12",
  white: "#FFFFFF",
  amber: "#C88C3A",
  sea: "#1F5867",
  steel: "#5D788A",
  paper: "#F6F7F4",
  line: "#D7DDE1",
  input: "#FFF4D6",
  green: "#E4F1E7",
  red: "#FCE8E6",
};

function setWidths(sheet, widths) {
  Object.entries(widths).forEach(([column, width]) => {
    sheet.getRange(`${column}:${column}`).format.columnWidth = width;
  });
}

function title(sheet, code, name, lastColumn = "H") {
  sheet.showGridLines = false;
  sheet.mergeCells(`A1:${lastColumn}1`);
  sheet.getRange("A1").values = [[`${code} | ${name}`]];
  sheet.getRange(`A1:${lastColumn}1`).format = {
    fill: COLORS.ink,
    font: { bold: true, color: COLORS.white, size: 16 },
    verticalAlignment: "center",
    rowHeight: 34,
  };
  sheet.mergeCells(`A2:${lastColumn}2`);
  sheet.getRange("A2").values = [["ACI LATAM | Version 1.0 | Para aprobacion e implementacion piloto | 12-06-2026"]];
  sheet.getRange(`A2:${lastColumn}2`).format = {
    fill: COLORS.sea,
    font: { color: COLORS.white, size: 9 },
    verticalAlignment: "center",
    rowHeight: 22,
  };
}

function section(sheet, row, text, lastColumn = "H") {
  sheet.mergeCells(`A${row}:${lastColumn}${row}`);
  sheet.getRange(`A${row}`).values = [[text]];
  sheet.getRange(`A${row}:${lastColumn}${row}`).format = {
    fill: COLORS.sea,
    font: { bold: true, color: COLORS.white },
    rowHeight: 23,
    verticalAlignment: "center",
  };
}

function grid(sheet, range) {
  sheet.getRange(range).format.borders = { preset: "all", style: "thin", color: COLORS.line };
  sheet.getRange(range).format.wrapText = true;
  sheet.getRange(range).format.verticalAlignment = "top";
}

function headers(sheet, range) {
  sheet.getRange(range).format = {
    fill: COLORS.ink,
    font: { bold: true, color: COLORS.white },
    borders: { preset: "all", style: "thin", color: COLORS.line },
    wrapText: true,
    verticalAlignment: "center",
    rowHeight: 29,
  };
}

function inputs(sheet, range) {
  sheet.getRange(range).format.fill = COLORS.input;
  sheet.getRange(range).format.borders = { preset: "all", style: "thin", color: COLORS.line };
  sheet.getRange(range).format.wrapText = true;
}

function keyValueRows(sheet, startRow, items, lastColumn = "H") {
  const split = lastColumn === "H" ? ["A", "B", "E", "F", "H"] : ["A", "B", "D", "E", lastColumn];
  let row = startRow;
  for (let i = 0; i < items.length; i += 2) {
    const left = items[i];
    const right = items[i + 1];
    sheet.getRange(`${split[0]}${row}`).values = [[left?.[0] || ""]];
    sheet.mergeCells(`${split[1]}${row}:${String.fromCharCode(split[2].charCodeAt(0) - 1)}${row}`);
    sheet.getRange(`${split[1]}${row}`).values = [[left?.[1] || ""]];
    sheet.getRange(`${split[3]}${row}`).values = [[right?.[0] || ""]];
    sheet.mergeCells(`${split[4]}${row}:${lastColumn}${row}`);
    sheet.getRange(`${split[4]}${row}`).values = [[right?.[1] || ""]];
    sheet.getRange(`${split[0]}${row}`).format = { fill: COLORS.paper, font: { bold: true }, borders: { preset: "all", style: "thin", color: COLORS.line } };
    sheet.getRange(`${split[3]}${row}`).format = { fill: COLORS.paper, font: { bold: true }, borders: { preset: "all", style: "thin", color: COLORS.line } };
    inputs(sheet, `${split[1]}${row}:${String.fromCharCode(split[2].charCodeAt(0) - 1)}${row}`);
    inputs(sheet, `${split[4]}${row}:${lastColumn}${row}`);
    sheet.getRange(`A${row}:${lastColumn}${row}`).format.rowHeight = 25;
    row += 1;
  }
  return row;
}

function addInstructions(workbook, name, description, sheets) {
  const sheet = workbook.worksheets.add("Inicio");
  title(sheet, "ACI-PQ-001", name, "H");
  setWidths(sheet, { A: 4, B: 24, C: 24, D: 24, E: 24, F: 24, G: 24, H: 4 });
  section(sheet, 4, "Objeto del libro", "H");
  sheet.mergeCells("A5:H7");
  sheet.getRange("A5").values = [[description]];
  sheet.getRange("A5:H7").format = { fill: COLORS.paper, wrapText: true, verticalAlignment: "center", borders: { preset: "all", style: "thin", color: COLORS.line } };
  section(sheet, 9, "Reglas de uso", "H");
  const rules = [
    ["1", "Completar los campos amarillos; no modificar codigos ni encabezados controlados."],
    ["2", "Crear una copia por orden de servicio y nombrarla con el numero OS-AAAA-NNN."],
    ["3", "Registrar hora local y zona horaria; identificar claramente informacion de terceros."],
    ["4", "No eliminar registros originales. Toda correccion debe ser trazable."],
    ["5", "La version solo sera vigente despues de aprobacion de Gerencia y capacitacion."],
  ];
  sheet.getRange("B10:G14").values = rules.map(([n, rule]) => [n, rule, "", "", "", ""]);
  sheet.mergeCells("C10:G10"); sheet.mergeCells("C11:G11"); sheet.mergeCells("C12:G12"); sheet.mergeCells("C13:G13"); sheet.mergeCells("C14:G14");
  sheet.getRange("B10:B14").format = { fill: COLORS.amber, font: { bold: true, color: COLORS.ink }, horizontalAlignment: "center", borders: { preset: "all", style: "thin", color: COLORS.line } };
  sheet.getRange("C10:G14").format = { fill: COLORS.white, wrapText: true, borders: { preset: "all", style: "thin", color: COLORS.line }, rowHeight: 27 };
  section(sheet, 16, "Contenido", "H");
  sheet.getRange(`B17:F${16 + sheets.length}`).values = sheets.map((item) => [item.code, item.name, item.owner, item.moment, ""]);
  headers(sheet, "B17:E17");
  sheet.getRange("B17:E17").values = [["Codigo", "Formato", "Responsable", "Momento de uso"]];
  if (sheets.length > 1) {
    sheet.getRange(`B18:E${17 + sheets.length}`).values = sheets.map((item) => [item.code, item.name, item.owner, item.moment]);
    grid(sheet, `B18:E${17 + sheets.length}`);
  }
  sheet.freezePanes.freezeRows(2);
  return sheet;
}

function buildOperationalWorkbook() {
  const wb = Workbook.create();
  addInstructions(wb, "Paquete de Formatos Operacionales", "Libro maestro para documentar el ciclo completo de servicios de loss control y expediting. Los formatos deben utilizarse junto con ACI-MO-001.", [
    { code: "ACI-F-001", name: "Orden de servicio", owner: "Coordinador", moment: "Recepcion y planificacion" },
    { code: "ACI-F-002", name: "Checklist operacional", owner: "Inspector", moment: "Antes, durante y despues" },
    { code: "ACI-F-003", name: "Bitacora de eventos", owner: "Inspector", moment: "Durante toda la operacion" },
    { code: "ACI-F-004", name: "Registro fotografico", owner: "Inspector", moment: "Al generar evidencia visual" },
    { code: "ACI-F-005", name: "Reporte preliminar", owner: "Inspector / Coordinador", moment: "Cierre preliminar" },
    { code: "ACI-F-006", name: "Informe final", owner: "Inspector / Revisor", moment: "Cierre tecnico" },
  ]);

  const f1 = wb.worksheets.add("F001 Orden Servicio");
  title(f1, "ACI-F-001", "Orden de Servicio");
  setWidths(f1, { A: 18, B: 18, C: 18, D: 18, E: 18, F: 18, G: 18, H: 18 });
  section(f1, 4, "Identificacion y control");
  let r = keyValueRows(f1, 5, [["N. orden", "OS-AAAA-NNN"], ["Estado", "Borrador"], ["Cliente", ""], ["Contacto", ""], ["Email", ""], ["Telefono", ""], ["Pais / ciudad", ""], ["Terminal / instalacion", ""]]);
  section(f1, r + 1, "Datos de la operacion"); r += 2;
  r = keyValueRows(f1, r, [["Producto", ""], ["Cantidad estimada", ""], ["Unidad", ""], ["Buque / unidad", ""], ["ETA / fecha", ""], ["Duracion estimada", ""], ["Tipo operacion", ""], ["Zona horaria", ""]]);
  section(f1, r + 1, "Alcance y entregables"); r += 2;
  f1.mergeCells(`A${r}:H${r + 3}`); inputs(f1, `A${r}:H${r + 3}`); f1.getRange(`A${r}`).values = [["Describir hitos presenciales, controles de cantidad/calidad, expediting, frecuencia de comunicaciones, reportes y exclusiones."]];
  r += 5;
  section(f1, r, "Asignacion y aprobacion"); r += 1;
  r = keyValueRows(f1, r, [["Inspector", ""], ["Revisor tecnico", ""], ["Coordinador", ""], ["Plazo preliminar", ""], ["Plazo final", ""], ["Aprobacion cliente", "Pendiente"]]);
  f1.getRange("F5:H5").dataValidation = { rule: { type: "list", values: ["Borrador", "Confirmada", "En ejecucion", "Cerrada", "Cancelada"] } };
  f1.freezePanes.freezeRows(2);

  const f2 = wb.worksheets.add("F002 Checklist");
  title(f2, "ACI-F-002", "Checklist Operacional");
  setWidths(f2, { A: 6, B: 18, C: 46, D: 16, E: 38, F: 28, G: 18, H: 18 });
  section(f2, 4, "Datos de control");
  keyValueRows(f2, 5, [["Orden", ""], ["Operacion", ""], ["Inspector", ""], ["Fecha", ""]]);
  f2.getRange("A8:H8").values = [["N.", "Etapa", "Control", "Estado", "Observacion / desviacion", "Evidencia", "Responsable", "Hora"]]; headers(f2, "A8:H8");
  const checklist = [
    [1, "Antes", "Instrucciones y alcance revisados"], [2, "Antes", "Independencia y competencia confirmadas"], [3, "Antes", "Accesos, EPP, contactos y equipos preparados"],
    [4, "Inicio", "Induccion y condiciones iniciales registradas"], [5, "Inicio", "Tanques, lineas, producto y unidades confirmados"], [6, "Inicio", "Mediciones, sellos y documentos iniciales revisados"],
    [7, "Durante", "Bitacora y registro fotografico actualizados"], [8, "Durante", "Tiempos, detenciones y causas registrados"], [9, "Durante", "Muestreo y cadena de custodia observados"], [10, "Durante", "Desviaciones comunicadas y escaladas"],
    [11, "Termino", "Mediciones y condicion final registradas"], [12, "Termino", "Cifras preliminares reconciliadas"], [13, "Termino", "Documentos finales solicitados/recibidos"],
    [14, "Cierre", "Reporte preliminar emitido"], [15, "Cierre", "Dossier completo y respaldado"], [16, "Cierre", "Informe final revisado y enviado"],
  ];
  f2.getRange("A9:H24").values = checklist.map((x) => [x[0], x[1], x[2], "Pendiente", "", "", "", ""]); grid(f2, "A9:H24"); inputs(f2, "D9:H24");
  f2.getRange("D9:D24").dataValidation = { rule: { type: "list", values: ["Pendiente", "Conforme", "No conforme", "No aplica"] } };
  f2.getRange("D9:D24").conditionalFormats.add("containsText", { text: "Conforme", format: { fill: COLORS.green, font: { color: "#22552E" } } });
  f2.getRange("D9:D24").conditionalFormats.add("containsText", { text: "No conforme", format: { fill: COLORS.red, font: { color: "#8C1D18", bold: true } } });
  f2.freezePanes.freezeRows(8);

  const f3 = wb.worksheets.add("F003 Bitacora");
  title(f3, "ACI-F-003", "Bitacora de Eventos");
  setWidths(f3, { A: 6, B: 14, C: 12, D: 48, E: 26, F: 34, G: 18, H: 26 });
  section(f3, 4, "Datos de control"); keyValueRows(f3, 5, [["Orden", ""], ["Zona horaria", ""], ["Operacion", ""], ["Inspector", ""]]);
  f3.getRange("A8:H8").values = [["N.", "Fecha", "Hora", "Evento / hecho observado", "Fuente", "Accion / comunicacion", "Nivel", "Evidencia asociada"]]; headers(f3, "A8:H8");
  const logRows = Array.from({ length: 50 }, (_, i) => [i + 1, "", "", "", "", "", "", ""]);
  f3.getRange("A9:H58").values = logRows; grid(f3, "A9:H58"); inputs(f3, "B9:H58");
  f3.getRange("G9:G58").dataValidation = { rule: { type: "list", values: ["Bajo", "Medio", "Alto", "Critico"] } };
  f3.freezePanes.freezeRows(8);

  const f4 = wb.worksheets.add("F004 Fotografias");
  title(f4, "ACI-F-004", "Registro Fotografico");
  setWidths(f4, { A: 7, B: 14, C: 12, D: 26, E: 48, F: 26, G: 24, H: 22 });
  section(f4, 4, "Datos de control"); keyValueRows(f4, 5, [["Orden", ""], ["Operacion", ""], ["Inspector", ""], ["Zona horaria", ""]]);
  f4.getRange("A8:H8").values = [["Foto", "Fecha", "Hora", "Ubicacion / objeto", "Descripcion objetiva", "Archivo", "Evento relacionado", "Autor"]]; headers(f4, "A8:H8");
  f4.getRange("A9:H48").values = Array.from({ length: 40 }, (_, i) => [i + 1, "", "", "", "", "", "", ""]); grid(f4, "A9:H48"); inputs(f4, "B9:H48");
  f4.freezePanes.freezeRows(8);

  const f5 = wb.worksheets.add("F005 Reporte Preliminar");
  title(f5, "ACI-F-005", "Reporte Preliminar");
  setWidths(f5, { A: 18, B: 18, C: 18, D: 18, E: 18, F: 18, G: 18, H: 18 });
  section(f5, 4, "Identificacion"); r = keyValueRows(f5, 5, [["Orden", ""], ["Cliente", ""], ["Operacion", ""], ["Producto", ""], ["Fecha/hora emision", ""], ["Estado", "Preliminar"]]);
  const prelimSections = ["Resumen ejecutivo", "Cronologia y eventos relevantes", "Cantidades y diferencias preliminares", "Calidad / muestras", "Demoras y restricciones", "Alertas emitidas y respuesta", "Documentos pendientes", "Proximos pasos"];
  r += 1;
  prelimSections.forEach((name) => { section(f5, r, name); f5.mergeCells(`A${r + 1}:H${r + 4}`); inputs(f5, `A${r + 1}:H${r + 4}`); r += 6; });
  f5.freezePanes.freezeRows(2);

  const f6 = wb.worksheets.add("F006 Informe Final");
  title(f6, "ACI-F-006", "Informe Final");
  setWidths(f6, { A: 18, B: 18, C: 18, D: 18, E: 18, F: 18, G: 18, H: 18 });
  section(f6, 4, "Identificacion y aprobacion"); r = keyValueRows(f6, 5, [["Orden", ""], ["Cliente", ""], ["Operacion", ""], ["Producto", ""], ["Inspector", ""], ["Revisor tecnico", ""], ["Version", "1.0"], ["Fecha emision", ""]]);
  const finalSections = ["1. Resumen ejecutivo", "2. Alcance y limitaciones", "3. Antecedentes y metodologia", "4. Cronologia de la operacion", "5. Control de cantidad y reconciliacion", "6. Control de calidad y muestras", "7. Tiempos, demoras y eventos", "8. Hallazgos y desviaciones", "9. Conclusiones tecnicas", "10. Documentos y anexos"];
  r += 1;
  finalSections.forEach((name) => { section(f6, r, name); f6.mergeCells(`A${r + 1}:H${r + 5}`); inputs(f6, `A${r + 1}:H${r + 5}`); r += 7; });
  section(f6, r, "Control de revision");
  f6.getRange(`A${r + 1}:H${r + 3}`).values = [["Revision", "Nombre", "Fecha", "Resultado", "Observaciones", "", "", ""], ["Tecnica", "", "", "Pendiente", "", "", "", ""], ["Emision", "", "", "Pendiente", "", "", "", ""]];
  f6.mergeCells(`E${r + 1}:H${r + 1}`); f6.mergeCells(`E${r + 2}:H${r + 2}`); f6.mergeCells(`E${r + 3}:H${r + 3}`); grid(f6, `A${r + 1}:H${r + 3}`); inputs(f6, `B${r + 2}:H${r + 3}`);
  f6.freezePanes.freezeRows(2);
  return wb;
}

function buildControlWorkbook() {
  const wb = Workbook.create();
  addInstructions(wb, "Control Documental y Competencia", "Herramientas para controlar versiones, retencion, perfiles, habilitacion, capacitacion y evaluacion del personal que ejecuta o revisa servicios ACI.", [
    { code: "ACI-F-101", name: "Listado maestro", owner: "Calidad", moment: "Control permanente" },
    { code: "ACI-F-107", name: "Matriz de retencion", owner: "Calidad", moment: "Definicion y revision anual" },
    { code: "ACI-F-201", name: "Perfil de cargo", owner: "Gerencia / Personas", moment: "Antes de contratar o asignar" },
    { code: "ACI-F-202", name: "Matriz de competencia", owner: "Operaciones / Calidad", moment: "Habilitacion y revision" },
    { code: "ACI-F-203", name: "Registro de capacitacion", owner: "Personas / Calidad", moment: "Cada actividad formativa" },
    { code: "ACI-F-204", name: "Evaluacion de desempeno", owner: "Supervisor", moment: "Inicial y periodica" },
  ]);

  const m = wb.worksheets.add("F101 Maestro Documentos");
  title(m, "ACI-F-101", "Listado Maestro de Documentos", "J");
  setWidths(m, { A: 16, B: 38, C: 14, D: 14, E: 18, F: 20, G: 20, H: 18, I: 30, J: 16 });
  m.getRange("A4:J4").values = [["Codigo", "Titulo", "Tipo", "Version", "Fecha vigencia", "Propietario", "Aprobador", "Estado", "Ubicacion / enlace", "Proxima revision"]]; headers(m, "A4:J4");
  const docs = [
    ["ACI-MO-001", "Manual Operacional Loss Control y Expediting", "Manual", "1.0", "", "Operaciones", "Gerencia", "Para aprobacion", "", ""],
    ["ACI-OP-000", "Indice Maestro Operacional", "Indice", "1.0", "", "Calidad", "Gerencia", "Para aprobacion", "", ""],
    ["ACI-PT-001", "Control de Cantidad y Reconciliacion", "Procedimiento", "1.0", "", "Operaciones", "Gerencia", "Para aprobacion", "", ""],
    ["ACI-PT-002", "Muestreo, Calidad y Cadena de Custodia", "Procedimiento", "1.0", "", "Operaciones", "Gerencia", "Para aprobacion", "", ""],
    ["ACI-PT-003", "Expediting y Control de Tiempos", "Procedimiento", "1.0", "", "Operaciones", "Gerencia", "Para aprobacion", "", ""],
    ["ACI-PT-004", "Evidencia, Fotografias y Reportabilidad", "Procedimiento", "1.0", "", "Operaciones", "Gerencia", "Para aprobacion", "", ""],
    ["ACI-PT-005", "Investigacion de Diferencias y Soporte a Reclamos", "Procedimiento", "1.0", "", "Operaciones", "Gerencia", "Para aprobacion", "", ""],
    ["ACI-HSE-001", "Seguridad Operacional y Respuesta a Emergencias", "Manual", "1.0", "", "HSE / Operaciones", "Gerencia", "Para aprobacion", "", ""],
    ["ACI-PC-001", "Capacitacion y Habilitacion Tecnica", "Programa", "1.0", "", "Operaciones / Calidad", "Gerencia", "Para aprobacion", "", ""],
    ["ACI-F-001", "Orden de Servicio", "Formato", "1.0", "", "Operaciones", "Calidad", "Para aprobacion", "Paquete Operacional", ""],
    ["ACI-F-002", "Checklist Operacional", "Formato", "1.0", "", "Operaciones", "Calidad", "Para aprobacion", "Paquete Operacional", ""],
    ["ACI-F-003", "Bitacora de Eventos", "Formato", "1.0", "", "Operaciones", "Calidad", "Para aprobacion", "Paquete Operacional", ""],
    ["ACI-F-004", "Registro Fotografico", "Formato", "1.0", "", "Operaciones", "Calidad", "Para aprobacion", "Paquete Operacional", ""],
    ["ACI-F-005", "Reporte Preliminar", "Formato", "1.0", "", "Operaciones", "Calidad", "Para aprobacion", "Paquete Operacional", ""],
    ["ACI-F-006", "Informe Final", "Formato", "1.0", "", "Operaciones", "Calidad", "Para aprobacion", "Paquete Operacional", ""],
  ];
  m.getRange("A5:J44").values = [...docs, ...Array.from({ length: 40 - docs.length }, () => Array(10).fill(""))]; grid(m, "A5:J44"); inputs(m, "D5:J44");
  m.getRange("H5:H44").dataValidation = { rule: { type: "list", values: ["Borrador", "Para aprobacion", "Vigente", "Obsoleto"] } };
  m.freezePanes.freezeRows(4);

  const ret = wb.worksheets.add("F107 Retencion");
  title(ret, "ACI-F-107", "Matriz de Retencion Documental", "I");
  setWidths(ret, { A: 18, B: 38, C: 20, D: 20, E: 20, F: 18, G: 26, H: 28, I: 18 });
  ret.getRange("A4:I4").values = [["Categoria", "Registro", "Responsable", "Repositorio", "Acceso", "Plazo", "Base / criterio", "Disposicion final", "Revision"]]; headers(ret, "A4:I4");
  const retRows = [
    ["Operacional", "Orden, checklist, bitacora, fotos, reportes y dossier", "Operaciones", "Repositorio OS", "Equipo asignado", "5 anos propuesto", "Contrato / requisito legal", "Eliminacion segura autorizada", "Anual"],
    ["Competencia", "Perfil, matriz, capacitacion y desempeno", "Personas / Calidad", "Repositorio Personas", "Restringido", "Relacion + 5 anos", "Laboral / contractual", "Eliminacion segura autorizada", "Anual"],
    ["Calidad", "Auditorias, NC, acciones, revision de direccion", "Calidad", "Repositorio SGC", "Gerencia / Calidad", "5 anos propuesto", "Sistema de gestion", "Archivo o eliminacion autorizada", "Anual"],
  ];
  ret.getRange("A5:I24").values = [...retRows, ...Array.from({ length: 17 }, () => Array(9).fill(""))]; grid(ret, "A5:I24"); inputs(ret, "A8:I24"); ret.freezePanes.freezeRows(4);

  const profile = wb.worksheets.add("F201 Perfil Cargo");
  title(profile, "ACI-F-201", "Perfil de Cargo"); setWidths(profile, { A: 20, B: 22, C: 22, D: 22, E: 22, F: 22, G: 22, H: 22 });
  section(profile, 4, "Identificacion"); let r = keyValueRows(profile, 5, [["Cargo", "Inspector / Loss Controller"], ["Area", "Operaciones"], ["Reporta a", "Coordinador de Operaciones"], ["Version", "1.0"]]);
  const profSections = ["Proposito del cargo", "Responsabilidades principales", "Formacion minima", "Experiencia minima", "Conocimientos tecnicos", "Competencias conductuales", "Autoridad y limites", "Criterios de habilitacion"];
  r += 1; profSections.forEach((name) => { section(profile, r, name); profile.mergeCells(`A${r + 1}:H${r + 4}`); inputs(profile, `A${r + 1}:H${r + 4}`); r += 6; });

  const comp = wb.worksheets.add("F202 Competencia");
  title(comp, "ACI-F-202", "Matriz de Competencia y Habilitacion", "M");
  setWidths(comp, { A: 24, B: 22, C: 18, D: 16, E: 16, F: 16, G: 16, H: 16, I: 16, J: 16, K: 18, L: 24, M: 18 });
  comp.getRange("A4:M4").values = [["Persona", "Rol", "Pais/base", "Operaciones", "Cantidad", "Calidad/muestreo", "Expediting", "Evidencia", "Reportes", "Seguridad", "Estado", "Brecha / accion", "Revision"]]; headers(comp, "A4:M4");
  comp.getRange("A5:M34").values = Array.from({ length: 30 }, () => ["", "", "", "", "", "", "", "", "", "", "", "", ""]); grid(comp, "A5:M34"); inputs(comp, "A5:J34"); inputs(comp, "L5:M34");
  comp.getRange("D5:J34").dataValidation = { rule: { type: "list", values: ["1", "2", "3", "4"] } };
  comp.getRange("K5").formulas = [["=IFERROR(IF(COUNT(D5:J5)<7,\"\",IF(MIN(D5:J5)>=3,\"HABILITADO\",IF(AVERAGE(D5:J5)>=2,\"EN FORMACION\",\"NO HABILITADO\"))),\"\")"]];
  comp.getRange("K5:K34").fillDown();
  comp.getRange("K5:K34").conditionalFormats.add("containsText", { text: "HABILITADO", format: { fill: COLORS.green, font: { color: "#22552E", bold: true } } });
  comp.getRange("K5:K34").conditionalFormats.add("containsText", { text: "NO HABILITADO", format: { fill: COLORS.red, font: { color: "#8C1D18", bold: true } } });
  comp.freezePanes.freezeRows(4);

  const training = wb.worksheets.add("F203 Capacitacion");
  title(training, "ACI-F-203", "Registro de Capacitacion", "J");
  setWidths(training, { A: 14, B: 28, C: 38, D: 20, E: 18, F: 18, G: 18, H: 18, I: 24, J: 26 });
  training.getRange("A4:J4").values = [["Fecha", "Persona", "Actividad / curso", "Tipo", "Duracion h", "Evaluacion", "Resultado", "Evidencia", "Instructor", "Proxima accion"]]; headers(training, "A4:J4");
  training.getRange("A5:J44").values = Array.from({ length: 40 }, () => Array(10).fill("")); grid(training, "A5:J44"); inputs(training, "A5:J44");
  training.getRange("D5:D44").dataValidation = { rule: { type: "list", values: ["Induccion", "Tecnica", "Seguridad", "Calidad", "Supervision en terreno"] } };
  training.getRange("G5:G44").dataValidation = { rule: { type: "list", values: ["Aprobado", "Pendiente", "No aprobado"] } };
  training.freezePanes.freezeRows(4);

  const perf = wb.worksheets.add("F204 Desempeno");
  title(perf, "ACI-F-204", "Evaluacion de Desempeno Operacional"); setWidths(perf, { A: 22, B: 18, C: 18, D: 18, E: 18, F: 18, G: 18, H: 22 });
  section(perf, 4, "Identificacion"); r = keyValueRows(perf, 5, [["Persona", ""], ["Rol", ""], ["Orden / periodo", ""], ["Evaluador", ""]]);
  perf.getRange("A8:H8").values = [["Criterio", "1", "2", "3", "4", "Puntaje", "Evidencia", "Observacion"]]; headers(perf, "A8:H8");
  const criteria = ["Preparacion", "Cumplimiento de instrucciones", "Rigor tecnico", "Bitacora y evidencia", "Comunicacion y alertas", "Seguridad", "Calidad de reportes", "Criterio e independencia"];
  perf.getRange("A9:H16").values = criteria.map((c) => [c, "Insuficiente", "Basico", "Competente", "Avanzado", "", "", ""]); grid(perf, "A9:H16"); inputs(perf, "F9:H16");
  perf.getRange("F9:F16").dataValidation = { rule: { type: "list", values: ["1", "2", "3", "4"] } };
  section(perf, 18, "Resultado y plan");
  perf.getRange("A19:B22").values = [["Promedio", ""], ["Resultado", ""], ["Brechas", ""], ["Acciones / plazo", ""]];
  perf.getRange("B19").formulas = [["=IFERROR(AVERAGE(F9:F16),\"\")"]];
  perf.getRange("B20").formulas = [["=IF(B19=\"\",\"\",IF(B19>=3,\"SATISFACTORIO\",IF(B19>=2,\"EN DESARROLLO\",\"NO SATISFACTORIO\")))"]];
  perf.mergeCells("B21:H21"); perf.mergeCells("B22:H22"); grid(perf, "A19:H22"); inputs(perf, "B19:H22");
  return wb;
}

async function exportAndPreview(workbook, filename, previewSheet, previewRange) {
  const xlsx = await SpreadsheetFile.exportXlsx(workbook);
  const outputPath = path.join(outDir, filename);
  await xlsx.save(outputPath);
  const preview = await workbook.render({ sheetName: previewSheet, range: previewRange, scale: 1.2, format: "png" });
  await fs.writeFile(path.join(outDir, `${path.parse(filename).name}-preview.png`), new Uint8Array(await preview.arrayBuffer()));
  return outputPath;
}

const operational = buildOperationalWorkbook();
const control = buildControlWorkbook();
console.log(await exportAndPreview(operational, "ACI-PQ-001-Paquete-Formatos-Operacionales.xlsx", "F002 Checklist", "A1:H24"));
console.log(await exportAndPreview(control, "ACI-PQ-002-Control-Documental-Competencia.xlsx", "F202 Competencia", "A1:M18"));
