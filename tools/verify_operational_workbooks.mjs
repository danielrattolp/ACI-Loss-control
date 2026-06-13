import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const root = path.resolve(import.meta.dirname, "..");
const sourceDir = path.join(root, "docs", "operaciones");
const qaDir = path.join(root, "outputs", "operaciones-qa", "xlsx");
await fs.mkdir(qaDir, { recursive: true });

const files = [
  "ACI-PQ-001-Paquete-Formatos-Operacionales.xlsx",
  "ACI-PQ-002-Control-Documental-Competencia.xlsx",
];

for (const filename of files) {
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(path.join(sourceDir, filename)));
  const summary = await workbook.inspect({ kind: "sheet", include: "id,name" });
  console.log(filename);
  console.log(summary.ndjson);
  const errors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 100 },
    summary: "formula error scan",
  });
  console.log(errors.ndjson);

  const sheetNames = filename.includes("PQ-001")
    ? ["Inicio", "F001 Orden Servicio", "F002 Checklist", "F003 Bitacora", "F004 Fotografias", "F005 Reporte Preliminar", "F006 Informe Final"]
    : ["Inicio", "F101 Maestro Documentos", "F107 Retencion", "F201 Perfil Cargo", "F202 Competencia", "F203 Capacitacion", "F204 Desempeno"];

  for (const sheetName of sheetNames) {
    const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 0.8, format: "png" });
    const safe = sheetName.replaceAll(" ", "-");
    await fs.writeFile(path.join(qaDir, `${path.parse(filename).name}-${safe}.png`), new Uint8Array(await preview.arrayBuffer()));
  }
}
