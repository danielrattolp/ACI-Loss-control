/**
 * ACI LATAM — Quantity Control wizard scripts
 * Implementa calculo en tiempo real conforme API MPMS 11.1 (Tabla 6B) en el cliente.
 */

"use strict";

// ─── Constantes ────────────────────────────────────────────────────────────
const BBL_TO_M3 = 0.158987294928;
const KG_M3_WATER = 999.016;

// ─── Algoritmos VCF — API MPMS Chapter 11, Section 1 (2004) ──────────────
// Validados contra F.C.V._A-B-C-D_desbloqueado.xlsx

function densityFromApi(api) {
  return (141.5 / (api + 131.5)) * KG_M3_WATER;
}

function correctedTempF(tf) {
  const tc = (tf - 32) / 1.8;
  const x = tc / 630;
  let p = 7.438081 + (-3.536296 * x) * x;
  p = -1.871251 + p * x;
  p = -4.089591 + p * x;
  p =  1.269056 + p * x;
  p =  1.08076  + p * x;
  p = -0.267408 + p * x;
  p = -0.148759 + p * x;
  return (((tc - p * x) * 1.8) + 32);
}

function vcfFromLambda(lambda, tf) {
  const ct = correctedTempF(tf);
  const d  = ct - 60.0068749;
  return Math.exp(-lambda * d * (1 + 0.8 * lambda * (d + 0.01374979547)));
}

function rhoStar(rho60, a, b) {
  const num = Math.exp(a * (1 + 0.8 * a)) - 1;
  const den = 1 + a * (1 + 1.6 * a) * b;
  return rho60 * (1 + num / den);
}

/**
 * Tabla 6B — 4 grupos según densidad.
 * K0, K1, K2 y rangos exactos de F.C.V._A-B-C-D_desbloqueado.xlsx.
 * K2 Transición = -0.0018684 (valor preciso API MPMS 11.1).
 */
function getVcf6BGroup(rho60) {
  if (rho60 >= 838.3127)      return { k0: 103.872,  k1: 0.2701,  k2: 0,          name: "Grupo IV – Fuel Oil" };
  if (rho60 >= 787.5195)      return { k0: 330.301,  k1: 0,       k2: 0,          name: "Grupo III – Jet Fuel" };
  if (rho60 >= 770.352)       return { k0: 1489.067, k1: 0,       k2: -0.0018684, name: "Transición" };
  if (rho60 >= 610.6)         return { k0: 192.4571, k1: 0.2438,  k2: 0,          name: "Grupo I – Gasolina/Nafta" };
  return null; // fuera de rango
}

function calculateVCF6B(api, tf) {
  const rho60 = densityFromApi(api);
  const g = getVcf6BGroup(rho60);
  if (!g) return null;
  const d60 = 0.01374979547;
  const a   = (d60 / 2) * ((g.k0 / rho60 + g.k1) / rho60 + g.k2);
  const b   = (2 * g.k0 + g.k1 * rho60) / (g.k0 + (g.k1 + g.k2 * rho60) * rho60);
  const rs  = rhoStar(rho60, a, b);
  const lam = g.k0 / rs / rs + g.k1 / rs + g.k2;
  return { vcf: vcfFromLambda(lam, tf), group: g.name };
}

/** Tabla 6A — Crudo / Condensado. λ = 341.0957 / ρ*² */
function calculateVCF6A(api, tf) {
  const rho60  = densityFromApi(api);
  const d60    = 0.01374979547;
  const lam60  = 341.0957 / (rho60 * rho60);
  const a      = (d60 / 2) * lam60;
  const rs     = rhoStar(rho60, a, 2);
  const lam    = 341.0957 / (rs * rs);
  return { vcf: vcfFromLambda(lam, tf), group: "6A – Crudo / Condensado" };
}

/** Tabla 6C — MTBE / Mezclas especiales. λ = 0.000789 (constante). */
function calculateVCF6C(api, tf) {
  return { vcf: vcfFromLambda(0.000789, tf), group: "6C – MTBE / Mezclas especiales" };
}

/** Tabla 6D — Aceites lubricantes. λ = 0.34878 / ρ* */
function calculateVCF6D(api, tf) {
  const rho60 = densityFromApi(api);
  const d60   = 0.01374979547;
  const a     = (d60 / 2) * (0.34878 / rho60);
  const rs    = rhoStar(rho60, a, 1);
  return { vcf: vcfFromLambda(0.34878 / rs, tf), group: "6D – Aceites lubricantes" };
}

/** Calcula VCF para la tabla seleccionada. Devuelve {vcf, group}. */
function calculateVCF(api, tf, table) {
  if (table === "6A") return calculateVCF6A(api, tf);
  if (table === "6C") return calculateVCF6C(api, tf);
  if (table === "6D") return calculateVCF6D(api, tf);
  return calculateVCF6B(api, tf); // default 6B
}

function calcQuantity(gov, api, tf, bsw, vef, applyVef, table = "6B") {
  if (gov <= 0) return null;
  const result = calculateVCF(api, tf, table);
  if (!result) return null;
  const { vcf, group } = result;
  let gsv = gov * vcf;
  if (applyVef && vef > 0) gsv /= vef;
  const nsv      = gsv * (1 - bsw / 100);
  const densKgm3 = densityFromApi(api);
  const nsvM3    = nsv * BBL_TO_M3;
  const mtVac    = nsvM3 * densKgm3 / 1000;
  const mtAir    = mtVac * (1 - 1.1 / densKgm3);
  return { vcf, group, gsv, nsv, gsvM3: gsv * BBL_TO_M3, nsvM3, mtAir, mtVac, densKgm3 };
}

// ─── Formateadores ─────────────────────────────────────────────────────────

function fmt(n, d = 3) {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("es-CL", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtSmall(n, d = 5) { return n != null ? n.toFixed(d) : "—"; }

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ─── Step 2: Preview de cantidades de origen ───────────────────────────────

function initOriginPreview() {
  const form = document.getElementById("originForm");
  if (!form) return;

  function getTable() {
    return (document.querySelector('select[name="vcf_table"]')?.value || "6B").toUpperCase();
  }

  function updateComparison(api, tf) {
    if (api <= 0) return;
    const tables = { "6A": calculateVCF6A, "6B": calculateVCF6B, "6C": calculateVCF6C, "6D": calculateVCF6D };
    for (const [tbl, fn] of Object.entries(tables)) {
      const res = fn(api, tf);
      const el  = document.getElementById(`cmp-${tbl}`);
      if (el) el.textContent = res ? fmtSmall(res.vcf, 5) : "fuera de rango";
    }
    // Etiqueta dinámica para 6B con el grupo
    const g6b = calculateVCF6B(api, tf);
    const lbl = document.getElementById("cmp-6B-label");
    if (lbl && g6b) lbl.textContent = `Tabla 6B (${g6b.group})`;
    const note = document.getElementById("cmpNote");
    if (note) {
      const active = getTable();
      note.textContent = `Tabla activa: ${active}`;
    }
  }

  function updatePreview() {
    const table = getTable();
    const api  = parseFloat(form.querySelector('[name="origin_api"]')?.value) || 0;
    const tf   = parseFloat(form.querySelector('[name="origin_temperature_f"]')?.value) || 60;
    const bsw  = parseFloat(form.querySelector('[name="origin_bsw_pct"]')?.value) || 0;
    const vef  = parseFloat(form.querySelector('[name="origin_vessel_vef"]')?.value) || 1;
    const sGov = parseFloat(form.querySelector('[name="origin_shore_gov_bbl"]')?.value) || 0;
    const vGov = parseFloat(form.querySelector('[name="origin_vessel_gov_bbl"]')?.value) || 0;

    const shore  = calcQuantity(sGov, api, tf, bsw, 1,   false, table);
    const vessel = calcQuantity(vGov, api, tf, bsw, vef, true,  table);

    // Grupo de producto y densidad
    if (api > 0) {
      setText("liveDens", fmt(densityFromApi(api), 2) + " kg/m³");
      const vcfRes = calculateVCF(api, tf, table);
      if (vcfRes) {
        setText("liveGroupLabel", vcfRes.group);
        setText("liveTableLabel", table);
      }
      updateComparison(api, tf);
    }

    // Shore
    setText("shore-vcf", shore ? fmtSmall(shore.vcf, 5) : "—");
    setText("shore-gsv", shore ? fmt(shore.gsv)   + " bbl" : "—");
    setText("shore-nsv", shore ? fmt(shore.nsv)   + " bbl" : "—");
    setText("shore-m3",  shore ? fmt(shore.nsvM3) + " m³"  : "—");
    setText("shore-mt",  shore ? fmt(shore.mtAir) + " MT"  : "—");
    setText("shore-mtv", shore ? fmt(shore.mtVac) + " MT"  : "—");

    // Vessel
    setText("vessel-vcf", vessel ? fmtSmall(vessel.vcf, 5) : "—");
    setText("vessel-gsv", vessel ? fmt(vessel.gsv)   + " bbl" : "—");
    setText("vessel-nsv", vessel ? fmt(vessel.nsv)   + " bbl" : "—");
    setText("vessel-m3",  vessel ? fmt(vessel.nsvM3) + " m³"  : "—");
    setText("vessel-mt",  vessel ? fmt(vessel.mtAir) + " MT"  : "—");
    setText("vessel-mtv", vessel ? fmt(vessel.mtVac) + " MT"  : "—");
  }

  form.querySelectorAll("input, select").forEach(el => el.addEventListener("input", updatePreview));
  updatePreview();
}

// ─── Step 3: Totales de ullage en tiempo real ──────────────────────────────

function sumColumn(tbody, selector) {
  let total = 0;
  tbody.querySelectorAll(selector).forEach(input => {
    const v = parseFloat(input.value);
    if (!isNaN(v)) total += v;
  });
  return total;
}

function updateUllageTotals(tableId, footerId) {
  const table = document.getElementById(tableId);
  const footer = document.getElementById(footerId);
  if (!table || !footer) return;

  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  let totTov = 0, totFw = 0, totGsv = 0, totNsv = 0, totM3 = 0, totMtAir = 0, totMtVac = 0;
  let weightedApi = 0, weightedApiGsv = 0;

  rows.forEach(row => {
    const isInitial = footerId === "initialTotals";
    const prefix = isInitial ? "initial" : "final";
    // TOV y FW se ingresan en m³ naturales; convertir a bbl para el cálculo
    const M3_TO_BBL = 1 / BBL_TO_M3;
    const tovM3 = parseFloat(row.querySelector(`[name="${prefix}_tov_m3[]"]`)?.value) || 0;
    const fwM3  = parseFloat(row.querySelector(`[name="${prefix}_free_water_m3[]"]`)?.value) || 0;
    const tov   = tovM3 * M3_TO_BBL;
    const fw    = fwM3  * M3_TO_BBL;
    const api  = parseFloat(row.querySelector(`[name="${prefix}_api[]"]`)?.value) || 35;
    const tf   = parseFloat(row.querySelector(`[name="${prefix}_temperature_f[]"]`)?.value) || 60;
    const bsw  = parseFloat(row.querySelector(`[name="${prefix}_bsw_pct[]"]`)?.value) || 0;
    const vefEl   = document.querySelector('[name="arrival_vef"]');
    const vef     = parseFloat(vefEl?.value) || 1;
    const tableEl = document.querySelector('select[name="vcf_table"]');
    const table   = tableEl?.value || "6B";

    if (tov <= 0) return;
    const gov = Math.max(tov - fw, 0);
    const q = calcQuantity(gov, api, tf, bsw, vef, true, table);
    if (!q) return;

    totTov    += tov;
    totFw     += fw;
    totGsv    += q.gsv;
    totNsv    += q.nsv;
    totM3     += q.nsvM3;
    totMtAir  += q.mtAir;
    totMtVac  += q.mtVac;
    weightedApi    += api * q.gsv;
    weightedApiGsv += q.gsv;
  });

  const govTotal = Math.max(totTov - totFw, 0);
  const avgApi   = weightedApiGsv > 0 ? weightedApi / weightedApiGsv : 0;

  const set = (cls, val) => { const el = footer.querySelector(cls); if (el) el.textContent = val; };
  set(".ft-tov", fmt(totTov));   // bbl (converted from m³)
  set(".ft-fw",  fmt(totFw));
  set(".ft-gov", fmt(govTotal));
  set(".ft-gsv", fmt(totGsv));
  set(".ft-nsv", fmt(totNsv));
  set(".ft-m3",  fmt(totM3));
  set(".ft-mt",  fmt(totMtAir));
  set(".ft-mtv", fmt(totMtVac));
  set(".ft-api", fmt(avgApi, 2));
}

function initUllageTotals() {
  const arrivalForm = document.getElementById("arrivalForm");
  if (!arrivalForm) return;

  function refresh() {
    updateUllageTotals("initialUllageTable", "initialTotals");
    updateUllageTotals("finalUllageTable", "finalTotals");
  }

  arrivalForm.addEventListener("input", refresh);
  refresh();
}

// ─── Step 3: Sincronizar modo de operacion ─────────────────────────────────

function initArrivalMode() {
  const arrivalForm = document.getElementById("arrivalForm");
  if (!arrivalForm) return;

  const sync = () => {
    const mode = arrivalForm.querySelector('input[name="operation_mode"]:checked')?.value;
    arrivalForm.querySelectorAll(".delivered-only").forEach(el => { el.hidden = mode === "arrival_vef"; });
    arrivalForm.querySelectorAll(".multi-only").forEach(el => { el.hidden = mode !== "arrival_multi"; });
  };

  arrivalForm.querySelectorAll('input[name="operation_mode"]').forEach(r => r.addEventListener("change", sync));
  sync();
}

// ─── Step 4: Destinos ──────────────────────────────────────────────────────

function syncDestination(card) {
  const type = card.querySelector(".receiver-type")?.value;
  card.querySelectorAll(".vef-field").forEach(f => { f.hidden = type !== "vessel"; });
  card.querySelectorAll(".shore-field").forEach(f => { f.hidden = type !== "shore"; });
}

function bindDestination(card) {
  card.querySelector(".receiver-type")?.addEventListener("change", () => syncDestination(card));
  card.querySelector(".remove-destination")?.addEventListener("click", () => {
    const list = document.querySelector("#destinationList");
    if (list && list.querySelectorAll(".destination-card").length > 1) card.remove();
  });
  syncDestination(card);
}

function initDestinations() {
  const list = document.querySelector("#destinationList");
  const template = document.querySelector("#destinationTemplate");
  if (!list) return;

  list.querySelectorAll(".destination-card").forEach(bindDestination);

  document.querySelector("#addDestination")?.addEventListener("click", () => {
    const card = template.content.firstElementChild.cloneNode(true);
    list.append(card);
    bindDestination(card);
  });
}

// ─── Teclado: Tab en grilla de ullage ──────────────────────────────────────

function initUllageKeyboard() {
  document.querySelectorAll(".ullage-grid").forEach(grid => {
    grid.addEventListener("keydown", e => {
      if (e.key !== "Enter" && e.key !== "Tab") return;
      if (e.key === "Enter") {
        e.preventDefault();
        const inputs = Array.from(grid.querySelectorAll("input"));
        const idx = inputs.indexOf(document.activeElement);
        if (idx >= 0 && idx < inputs.length - 1) inputs[idx + 1].focus();
      }
    });
  });
}

// ─── Advertencia al salir sin guardar ──────────────────────────────────────

function initDirtyGuard() {
  let dirty = false;
  document.querySelectorAll("form.content-panel input, form.content-panel select, form.content-panel textarea").forEach(el => {
    el.addEventListener("change", () => { dirty = true; });
  });
  document.querySelectorAll("form.content-panel button[type=submit], form.content-panel .btn-primary").forEach(btn => {
    btn.addEventListener("click", () => { dirty = false; });
  });
  window.addEventListener("beforeunload", e => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}

// ─── Inicializacion ────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  initOriginPreview();
  initArrivalMode();
  initUllageTotals();
  initDestinations();
  initUllageKeyboard();
  initDirtyGuard();
});
