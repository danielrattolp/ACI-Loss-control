const STORAGE_KEY = "aci-ops-console-v2";
const ACCESS_KEY = "aci-ops-access";
const ACCESS_HASH = "3fc610e920558f58acb852a5050f349ec1af447db03d78fbd0dd0086604d8dcd";
const BBL_TO_M3 = 0.158987294928;

const form = document.querySelector("#operationForm");
const requestForm = document.querySelector("#requestForm");
const eventList = document.querySelector("#eventList");
const sampleList = document.querySelector("#sampleList");
const stoppageList = document.querySelector("#stoppageList");
const hourlyEntryList = document.querySelector("#hourlyEntryList");
const eventTemplate = document.querySelector("#eventTemplate");
const sampleTemplate = document.querySelector("#sampleTemplate");
const stoppageTemplate = document.querySelector("#stoppageTemplate");
const hourlyEntryTemplate = document.querySelector("#hourlyEntryTemplate");
const shoreTankTemplate = document.querySelector("#shoreTankTemplate");
const lighterTemplate = document.querySelector("#lighterTemplate");
const lighterList = document.querySelector("#lighterList");
let latestUllageDischarge = null;
let latestShoreReceipt = null;
let latestLighterPlan = null;

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function unlockConsole() {
  sessionStorage.setItem(ACCESS_KEY, "ok");
  document.body.classList.remove("locked");
}

document.querySelector("#accessForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.querySelector("#accessPassword");
  const error = document.querySelector("#accessError");
  const hash = await sha256(input.value);
  if (hash === ACCESS_HASH) {
    unlockConsole();
    input.value = "";
    if (error) error.textContent = "";
    return;
  }
  if (error) error.textContent = "Clave incorrecta.";
  input.select();
});

if (sessionStorage.getItem(ACCESS_KEY) === "ok") {
  document.body.classList.remove("locked");
}

const fields = [
  "reportNo",
  "client",
  "vessel",
  "terminal",
  "product",
  "operationType",
  "inspector",
  "date",
  "includeBl",
  "blGsvBbl",
  "blApi",
  "blBsw",
  "includeOriginShore",
  "originShoreGsvBbl",
  "originShoreApi",
  "originShoreBsw",
  "originAdjustmentBbl",
  "originVef",
  "includeSailingNoVef",
  "sailingGsvBbl",
  "sailingApi",
  "sailingBsw",
  "includeSailingVef",
  "destinationVef",
  "includeArrivalNoVef",
  "arrivalGsvBbl",
  "arrivalApi",
  "arrivalBsw",
  "includeArrivalVef",
  "receiptBasis",
  "includeLighterReceipt",
  "lighterReceiptGsvBbl",
  "lighterReceiptApi",
  "lighterReceiptBsw",
  "includeLighterToTerminal",
  "lighterToTerminalGsvBbl",
  "lighterToTerminalApi",
  "lighterToTerminalBsw",
  "lineDisplacementBbl",
  "robBbl",
  "tolerancePct",
  "demurrageDay",
  "keyMeetingRateBph",
  "norTendered",
  "dischargeStart",
  "disconnectionComplete",
  "lighterAnchorage",
  "motherVessel",
  "lighterTerminalOperator",
];

const defaults = {
  reportNo: "ACI-OPS-0001",
  client: "Principal / Trader",
  vessel: "M/T Pacific Trader",
  terminal: "Terminal Quintero",
  product: "ULSD",
  operationType: "Descarga",
  inspector: "ACI Surveyor",
  date: new Date().toISOString().slice(0, 10),
  includeBl: true,
  blGsvBbl: 249450,
  blApi: 38.2,
  blBsw: 0.08,
  includeOriginShore: true,
  originShoreGsvBbl: 249600,
  originShoreApi: 38.1,
  originShoreBsw: 0.09,
  originAdjustmentBbl: 0,
  originVef: 1.00056,
  includeSailingNoVef: true,
  sailingGsvBbl: 249200,
  sailingApi: 38.2,
  sailingBsw: 0.09,
  includeSailingVef: true,
  destinationVef: 1.00068,
  includeArrivalNoVef: true,
  arrivalGsvBbl: 248960,
  arrivalApi: 38.1,
  arrivalBsw: 0.08,
  includeArrivalVef: true,
  receiptBasis: "Buque",
  includeLighterReceipt: true,
  lighterReceiptGsvBbl: 248900,
  lighterReceiptApi: 38.1,
  lighterReceiptBsw: 0.08,
  includeLighterToTerminal: true,
  lighterToTerminalGsvBbl: 248720,
  lighterToTerminalApi: 38.0,
  lighterToTerminalBsw: 0.08,
  lineDisplacementBbl: 28,
  robBbl: 42,
  tolerancePct: 0.25,
  demurrageDay: 28000,
  keyMeetingRateBph: 10500,
  norTendered: "",
  dischargeStart: "",
  disconnectionComplete: "",
  lighterAnchorage: "Bahia de Talcahuano",
  motherVessel: "M/T Pacific Trader",
  lighterTerminalOperator: "ENAP Chile",
  lighters: [
    {
      name: "M/T Alijador 1",
      destination: "San Vicente",
      transferActive: true,
      deliveryActive: true,
      motherNsv: 0,
      receiverNsv: 0,
      motherRob: 0,
      ullageNsv: 0,
      shoreNsv: 0,
      lineAdjustment: 0,
    },
  ],
  events: [
    {
      time: "",
      title: "NOR tendered, pendiente aceptacion terminal",
      impact: "Informativo",
    },
    {
      time: "",
      title: "Diferencia inicial detectada entre B/L y shore figures",
      impact: "Riesgo cantidad",
    },
    {
      time: "",
      title: "Muestreo compuesto tomado bajo custodia ACI",
      impact: "Riesgo calidad",
    },
  ],
  samples: [
    { id: "ACI-ULSD-01", source: "Manifold vessel", status: "Retenida ACI" },
    { id: "ACI-ULSD-02", source: "Shore tank", status: "Enviada laboratorio" },
    { id: "ACI-ULSD-03", source: "Composite final", status: "CrÃ­tica" },
  ],
  stoppages: [
    {
      start: "",
      end: "",
      accountable: "discount",
      reason: "Cambio de tanque / espera operacional",
    },
  ],
  hourlyEntries: [],
};

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function number(value, digits = 3) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

function plainNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hoursBetween(start, end) {
  if (!start || !end || end <= start) return 0;
  return (end - start) / 36e5;
}

function overlapHours(startA, endA, startB, endB) {
  if (!startA || !endA || !startB || !endB) return 0;
  const start = Math.max(startA.getTime(), startB.getTime());
  const end = Math.min(endA.getTime(), endB.getTime());
  return end > start ? (end - start) / 36e5 : 0;
}

function formatHourLabel(date) {
  if (!date) return "-";
  return date.toLocaleString("es-CL", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getState() {
  const state = {
    events: collectEvents(),
    samples: collectSamples(),
    stoppages: collectStoppages(),
    hourlyEntries: collectHourlyEntries(),
    lighters: collectLighters(),
  };
  for (const name of fields) {
    const input = document.querySelector(`[name="${name}"]`);
    if (input?.type === "checkbox") {
      state[name] = input.checked;
    } else {
      state[name] = input?.value ?? defaults[name] ?? "";
    }
  }
  return state;
}

function setState(state) {
  for (const name of fields) {
    const input = document.querySelector(`[name="${name}"]`);
    if (!input) continue;
    if (input.type === "checkbox") {
      input.checked = Boolean(state[name] ?? defaults[name]);
    } else {
      input.value = state[name] ?? defaults[name] ?? "";
    }
  }
  eventList.innerHTML = "";
  sampleList.innerHTML = "";
  stoppageList.innerHTML = "";
  hourlyEntryList.innerHTML = "";
  if (lighterList) lighterList.innerHTML = "";
  (state.events?.length ? state.events : defaults.events).forEach(addEventRow);
  (state.samples?.length ? state.samples : defaults.samples).forEach(addSampleRow);
  (state.stoppages?.length ? state.stoppages : defaults.stoppages).forEach(addStoppageRow);
  (state.hourlyEntries ?? defaults.hourlyEntries).forEach(addHourlyEntryRow);
  (state.lighters?.length ? state.lighters : defaults.lighters).forEach(addLighterRow);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getState()));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return { ...defaults };
  try {
    return { ...defaults, ...JSON.parse(saved) };
  } catch {
    return { ...defaults };
  }
}

function addEventRow(event = {}) {
  const node = eventTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector(".event-time").value = event.time || "";
  node.querySelector(".event-title").value = event.title || "";
  node.querySelector(".event-impact").value = event.impact || "Informativo";
  node.querySelector(".remove-row").addEventListener("click", () => {
    node.remove();
    update();
  });
  node.addEventListener("input", update);
  eventList.append(node);
}

function addSampleRow(sample = {}) {
  const node = sampleTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector(".sample-id").value = sample.id || "";
  node.querySelector(".sample-source").value = sample.source || "";
  node.querySelector(".sample-status").value = sample.status || "Retenida ACI";
  node.querySelector(".remove-row").addEventListener("click", () => {
    node.remove();
    update();
  });
  node.addEventListener("input", update);
  sampleList.append(node);
}

function addStoppageRow(stoppage = {}) {
  const node = stoppageTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector(".stop-start").value = stoppage.start || "";
  node.querySelector(".stop-end").value = stoppage.end || "";
  node.querySelector(".stop-accountable").value = stoppage.accountable || "discount";
  node.querySelector(".stop-reason").value = stoppage.reason || "";
  node.querySelector(".remove-row").addEventListener("click", () => {
    node.remove();
    update();
  });
  node.addEventListener("input", update);
  stoppageList.append(node);
}

function addHourlyEntryRow(entry = {}) {
  const node = hourlyEntryTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector(".hour-start").value = entry.start || "";
  node.querySelector(".hour-end").value = entry.end || "";
  node.querySelector(".hour-volume").value = entry.volume ?? "";
  node.querySelector(".hour-pressure").value = entry.pressure ?? "";
  node.querySelector(".hour-pressure-unit").value = entry.pressureUnit || "PSI";
  node.querySelector(".hour-status").value = entry.status || "Descargando";
  node.querySelector(".hour-comment").value = entry.comment || "";
  node.querySelector(".remove-row").addEventListener("click", () => {
    node.remove();
    update();
  });
  node.addEventListener("input", update);
  hourlyEntryList.append(node);
}

function addLighterRow(lighter = {}) {
  if (!lighterTemplate || !lighterList) return;
  const node = lighterTemplate.content.firstElementChild.cloneNode(true);
  const count = lighterList.children.length + 1;
  node.querySelector(".lighter-name").value = lighter.name || `M/T Alijador ${count}`;
  node.querySelector(".lighter-destination").value = lighter.destination || "San Vicente";
  node.querySelector(".lighter-transfer-active").checked = lighter.transferActive ?? true;
  node.querySelector(".lighter-delivery-active").checked = lighter.deliveryActive ?? true;
  node.querySelector(".lighter-mother-nsv").value = lighter.motherNsv ?? 0;
  node.querySelector(".lighter-receiver-nsv").value = lighter.receiverNsv ?? 0;
  node.querySelector(".lighter-mother-rob").value = lighter.motherRob ?? 0;
  node.querySelector(".lighter-ullage-nsv").value = lighter.ullageNsv ?? 0;
  node.querySelector(".lighter-shore-nsv").value = lighter.shoreNsv ?? 0;
  node.querySelector(".lighter-line-adjustment").value = lighter.lineAdjustment ?? 0;
  node.querySelector(".remove-lighter").addEventListener("click", () => {
    node.remove();
    update();
  });
  node.addEventListener("input", update);
  node.addEventListener("change", update);
  lighterList.append(node);
}

function collectEvents() {
  return [...eventList.querySelectorAll(".editable-row")]
    .map((row) => ({
      time: row.querySelector(".event-time").value,
      title: row.querySelector(".event-title").value.trim(),
      impact: row.querySelector(".event-impact").value,
    }))
    .filter((event) => event.title);
}

function collectSamples() {
  return [...sampleList.querySelectorAll(".editable-row")]
    .map((row) => ({
      id: row.querySelector(".sample-id").value.trim(),
      source: row.querySelector(".sample-source").value.trim(),
      status: row.querySelector(".sample-status").value,
    }))
    .filter((sample) => sample.id || sample.source);
}

function collectStoppages() {
  return [...stoppageList.querySelectorAll(".stoppage-row")]
    .map((row) => ({
      start: row.querySelector(".stop-start").value,
      end: row.querySelector(".stop-end").value,
      accountable: row.querySelector(".stop-accountable").value,
      reason: row.querySelector(".stop-reason").value.trim(),
    }))
    .filter((stoppage) => stoppage.start || stoppage.end || stoppage.reason);
}

function collectLighters() {
  if (!lighterList) return [];
  return [...lighterList.querySelectorAll(".lighter-card")].map((row) => ({
    name: row.querySelector(".lighter-name").value.trim(),
    destination: row.querySelector(".lighter-destination").value,
    transferActive: row.querySelector(".lighter-transfer-active").checked,
    deliveryActive: row.querySelector(".lighter-delivery-active").checked,
    motherNsv: plainNumber(row.querySelector(".lighter-mother-nsv").value),
    receiverNsv: plainNumber(row.querySelector(".lighter-receiver-nsv").value),
    motherRob: plainNumber(row.querySelector(".lighter-mother-rob").value),
    ullageNsv: plainNumber(row.querySelector(".lighter-ullage-nsv").value),
    shoreNsv: plainNumber(row.querySelector(".lighter-shore-nsv").value),
    lineAdjustment: plainNumber(row.querySelector(".lighter-line-adjustment").value),
  }));
}

function collectHourlyEntries() {
  return [...hourlyEntryList.querySelectorAll(".hourly-entry-row")]
    .map((row) => ({
      start: row.querySelector(".hour-start").value,
      end: row.querySelector(".hour-end").value,
      volume: row.querySelector(".hour-volume").value,
      pressure: row.querySelector(".hour-pressure").value,
      pressureUnit: row.querySelector(".hour-pressure-unit").value,
      status: row.querySelector(".hour-status").value,
      comment: row.querySelector(".hour-comment").value.trim(),
    }))
    .filter((entry) => entry.start || entry.end || entry.volume || entry.pressure || entry.comment);
}

function cube(gsvField, apiField, bswField, state, options = {}) {
  const gsv = plainNumber(state[gsvField]);
  const api = plainNumber(state[apiField]);
  const bsw = plainNumber(state[bswField]);
  const vef = options.vef ?? 1;
  const adjustment = options.adjustment ?? 0;
  const nsvBeforeVef = gsv * (1 - bsw / 100);
  const value = nsvBeforeVef * vef + adjustment;
  return {
    gsv,
    api,
    bsw,
    vef,
    adjustment,
    nsvBeforeVef,
    value,
  };
}

function checkpoint(key, include, label, cubeData, note) {
  return {
    key,
    include,
    label,
    value: cubeData.value,
    cube: cubeData,
    note,
  };
}

function buildCheckpoints(state) {
  const originVef = plainNumber(state.originVef) || 1;
  const destinationVef = plainNumber(state.destinationVef) || 1;
  const receiptVef = state.receiptBasis === "Buque" ? destinationVef : 1;
  const bl = cube("blGsvBbl", "blApi", "blBsw", state);
  const origin = cube("originShoreGsvBbl", "originShoreApi", "originShoreBsw", state, {
    adjustment: plainNumber(state.originAdjustmentBbl),
  });
  const sailingNoVef = cube("sailingGsvBbl", "sailingApi", "sailingBsw", state);
  const sailingVef = cube("sailingGsvBbl", "sailingApi", "sailingBsw", state, { vef: originVef });
  const arrivalNoVef = cube("arrivalGsvBbl", "arrivalApi", "arrivalBsw", state);
  const arrivalVef = cube("arrivalGsvBbl", "arrivalApi", "arrivalBsw", state, { vef: destinationVef });
  const receipt = cube("lighterReceiptGsvBbl", "lighterReceiptApi", "lighterReceiptBsw", state, {
    vef: receiptVef,
    adjustment: -plainNumber(state.robBbl),
  });
  const terminal = cube("lighterToTerminalGsvBbl", "lighterToTerminalApi", "lighterToTerminalBsw", state, {
    adjustment: plainNumber(state.lineDisplacementBbl),
  });

  const raw = [
    checkpoint("bl", state.includeBl, "Bill of Lading", bl, "NSV calculado desde GSV, API y BSW documental"),
    checkpoint("origin", state.includeOriginShore, "Tierra origen", origin, `Incluye ajuste origen ${number(origin.adjustment)} bbl`),
    checkpoint("sailingNoVef", state.includeSailingNoVef, "Zarpe sin VEF", sailingNoVef, "Cantidad buque sin VEF de origen"),
    checkpoint("sailingVef", state.includeSailingVef, "Zarpe con VEF origen", sailingVef, `VEF origen aplicado: ${number(originVef, 5)}`),
    checkpoint("arrivalNoVef", state.includeArrivalNoVef, "Arribo sin VEF", arrivalNoVef, "Cantidad buque sin VEF de destino"),
    checkpoint("arrivalVef", state.includeArrivalVef, "Arribo con VEF destino", arrivalVef, `VEF destino aplicado: ${number(destinationVef, 5)}`),
    checkpoint("lighterReceipt", state.includeLighterReceipt, `Recepcion alije (${state.receiptBasis})`, receipt, `VEF ${state.receiptBasis === "Buque" ? "destino aplicado" : "no aplicado"}; ROB/remanente ${number(plainNumber(state.robBbl))} bbl`),
    checkpoint("lighterTerminal", state.includeLighterToTerminal, "Descarga alijadores a terminal", terminal, `Entrega terminal mas line displacement/drenaje ${number(plainNumber(state.lineDisplacementBbl))} bbl`),
  ];

  return raw.filter((checkpoint) => checkpoint.include);
}

function calculate(state) {
  const checkpoints = buildCheckpoints(state);
  const legs = checkpoints.slice(1).map((checkpoint, index) => {
    const previous = checkpoints[index];
    const diffBbl = checkpoint.value - previous.value;
    const diffPct = previous.value ? (diffBbl / previous.value) * 100 : 0;
    return {
      from: previous.label,
      to: checkpoint.label,
      diffBbl,
      diffPct,
      apiDiff: checkpoint.cube.api - previous.cube.api,
      bswDiff: checkpoint.cube.bsw - previous.cube.bsw,
    };
  });

  const first = checkpoints[0] ?? { value: 0, label: "Sin punto inicial" };
  const last = checkpoints[checkpoints.length - 1] ?? { value: 0, label: "Sin entrega final" };
  const diffBbl = last.value - first.value;
  const diffM3 = diffBbl * BBL_TO_M3;
  const lossPct = first.value ? (diffBbl / first.value) * 100 : 0;
  const tolerance = Math.abs(plainNumber(state.tolerancePct));
  const worstLeg = legs.reduce(
    (worst, leg) => (Math.abs(leg.diffPct) > Math.abs(worst.diffPct) ? leg : worst),
    { from: "-", to: "-", diffBbl: 0, diffPct: 0, apiDiff: 0, bswDiff: 0 }
  );
  const qualityShift = legs.some((leg) => Math.abs(leg.apiDiff) >= 0.3 || Math.abs(leg.bswDiff) >= 0.05);
  const criticalSamples = state.samples.filter((sample) => sample.status === "CrÃ­tica").length;
  const riskyEvents = state.events.filter((event) =>
    ["Riesgo cantidad", "Riesgo calidad", "Demora", "Discrepancia"].includes(event.impact)
  ).length;
  const nor = parseDateTime(state.norTendered);
  const dischargeStart = parseDateTime(state.dischargeStart) || nor;
  const disconnection = parseDateTime(state.disconnectionComplete);
  const grossHours = hoursBetween(dischargeStart, disconnection);
  const norToDisconnectHours = hoursBetween(nor, disconnection);
  const stoppageSummary = state.stoppages.reduce(
    (summary, stoppage) => {
      const start = parseDateTime(stoppage.start);
      const end = parseDateTime(stoppage.end);
      const hours = overlapHours(dischargeStart, disconnection, start, end);
      if (stoppage.accountable === "discount") summary.discountHours += hours;
      if (stoppage.accountable === "accountable") summary.accountableHours += hours;
      summary.totalHours += hours;
      return summary;
    },
    { totalHours: 0, discountHours: 0, accountableHours: 0 }
  );
  const netOperatingHours = Math.max(grossHours - stoppageSummary.discountHours, 0);
  const keyMeetingRate = plainNumber(state.keyMeetingRateBph);
  const committedHours = keyMeetingRate > 0 ? Math.abs(last.value) / keyMeetingRate : 0;
  const delayHours = Math.max(netOperatingHours - committedHours, 0) + stoppageSummary.accountableHours;
  const delayCost = (delayHours / 24) * plainNumber(state.demurrageDay);

  let risk = "low";
  if (
    Math.abs(lossPct) > tolerance ||
    Math.abs(worstLeg.diffPct) > tolerance ||
    criticalSamples > 0 ||
    riskyEvents >= 3 ||
    checkpoints.length < 3 ||
    qualityShift
  ) {
    risk = "medium";
  }
  if (
    Math.abs(lossPct) > tolerance * 1.8 ||
    Math.abs(worstLeg.diffPct) > tolerance * 1.8 ||
    state.events.some((event) => event.impact === "Discrepancia")
  ) {
    risk = "high";
  }

  return {
    checkpoints,
    legs,
    first,
    last,
    adjustedNsv: last.value,
    diffBbl,
    diffM3,
    lossPct,
    tolerance,
    worstLeg,
    qualityShift,
    criticalSamples,
    riskyEvents,
    delayHours,
    delayCost,
    grossHours,
    norToDisconnectHours,
    netOperatingHours,
    committedHours,
    keyMeetingRate,
    stoppageSummary,
    risk,
  };
}

function buildAlerts(state, calc) {
  const alerts = [];
  if (Math.abs(calc.lossPct) > calc.tolerance) {
    alerts.push({
      level: "high",
      text: `Diferencia ${number(calc.lossPct, 3)}% supera tolerancia ${number(calc.tolerance, 3)}%. Emitir NOAD/LOP si no se reconcilia.`,
    });
  } else {
    alerts.push({
      level: "low",
      text: `Diferencia ${number(calc.lossPct, 3)}% dentro de tolerancia operacional.`,
    });
  }
  if (Math.abs(calc.worstLeg.diffPct) > calc.tolerance) {
    alerts.push({
      level: "medium",
      text: `Tramo critico: ${calc.worstLeg.from} -> ${calc.worstLeg.to}, ${number(calc.worstLeg.diffBbl)} bbl (${number(calc.worstLeg.diffPct, 3)}%).`,
    });
  }
  const qualityLeg = calc.legs.find((leg) => Math.abs(leg.apiDiff) >= 0.3 || Math.abs(leg.bswDiff) >= 0.05);
  if (qualityLeg) {
    alerts.push({
      level: "medium",
      text: `Cambio de calidad en ${qualityLeg.from} -> ${qualityLeg.to}: API ${number(qualityLeg.apiDiff, 2)}, BSW ${number(qualityLeg.bswDiff, 3)}%.`,
    });
  }
  if (calc.checkpoints.length < 3) {
    alerts.push({
      level: "medium",
      text: "Hay menos de 3 checkpoints activos. La conciliacion se puede emitir, pero pierde trazabilidad round trip.",
    });
  }
  if (calc.criticalSamples) {
    alerts.push({
      level: "medium",
      text: `${calc.criticalSamples} muestra(s) marcada(s) como critica(s). Priorizar custodia y laboratorio.`,
    });
  }
  if (calc.delayHours > 0) {
    alerts.push({
      level: calc.delayHours > 24 ? "medium" : "low",
      text: `Demora operacional estimada: ${number(calc.delayHours, 1)} h contra Key Meeting. Costo estimado ${money(calc.delayCost)}.`,
    });
  }
  if (state.events.some((event) => event.impact === "Discrepancia")) {
    alerts.push({
      level: "high",
      text: "Existe evento de discrepancia. Congelar evidencia, fotos, sounding sheets y comunicaciones.",
    });
  }
  return alerts;
}

function textForRisk(risk) {
  if (risk === "high") {
    return {
      label: "Riesgo critico",
      reason: "La operacion requiere accion formal y evidencia reforzada.",
      decision: "Escalar a cliente y preparar discrepancia",
      next: "Emitir alerta operacional, solicitar reconfirmacion de cifras y bloquear cierre hasta reconciliar.",
    };
  }
  if (risk === "medium") {
    return {
      label: "Riesgo en observacion",
      reason: "Hay variables sensibles que requieren seguimiento.",
      decision: "Mantener vigilancia reforzada",
      next: "Validar mediciones, custodia de muestras y tiempos antes del reporte final.",
    };
  }
  return {
    label: "Riesgo controlado",
    reason: "Sin diferencias criticas.",
    decision: "Continuar monitoreo",
    next: "Completar datos de medicion y eventos para emitir resumen.",
  };
}

function buildEffectsCommentary(state, calc) {
  const comments = [];
  const omitted = [
    ["B/L", state.includeBl],
    ["tierra origen", state.includeOriginShore],
    ["zarpe sin VEF", state.includeSailingNoVef],
    ["zarpe con VEF origen", state.includeSailingVef],
    ["arribo sin VEF", state.includeArrivalNoVef],
    ["arribo con VEF destino", state.includeArrivalVef],
    ["recepcion alije", state.includeLighterReceipt],
    ["descarga alijadores a terminal", state.includeLighterToTerminal],
  ]
    .filter(([, included]) => !included)
    .map(([label]) => label);

  if (omitted.length) {
    comments.push(`La conciliacion excluye ${omitted.join(", ")}, por lo que el resultado debe leerse como trazabilidad parcial y no como round trip documental completo.`);
  }

  if (state.includeSailingVef) {
    const originVef = plainNumber(state.originVef) || 1;
    const effect = cube("sailingGsvBbl", "sailingApi", "sailingBsw", state, { vef: originVef }).value -
      cube("sailingGsvBbl", "sailingApi", "sailingBsw", state).value;
    comments.push(`El VEF de origen (${number(originVef, 5)}) afecta la cantidad de zarpe en ${number(effect)} bbl respecto de la medicion sin VEF.`);
  }

  if (state.includeArrivalVef) {
    const destinationVef = plainNumber(state.destinationVef) || 1;
    const effect = cube("arrivalGsvBbl", "arrivalApi", "arrivalBsw", state, { vef: destinationVef }).value -
      cube("arrivalGsvBbl", "arrivalApi", "arrivalBsw", state).value;
    comments.push(`El VEF de destino (${number(destinationVef, 5)}) afecta la cantidad de arribo en ${number(effect)} bbl respecto de la medicion sin VEF.`);
  }

  const qualityLegs = calc.legs.filter((leg) => Math.abs(leg.apiDiff) >= 0.3 || Math.abs(leg.bswDiff) >= 0.05);
  if (qualityLegs.length) {
    const leg = qualityLegs[0];
    comments.push(`Se observa variacion de calidad en el tramo ${leg.from} -> ${leg.to}: API ${number(leg.apiDiff, 2)} y BSW ${number(leg.bswDiff, 3)}%; esto puede indicar diferencia de muestra, estratificacion, agua libre/emulsionada o cambio de base de medicion.`);
  }

  if (Math.abs(plainNumber(state.robBbl)) > 0 && state.includeLighterReceipt) {
    comments.push(`El ROB/remanente informado (${number(plainNumber(state.robBbl))} bbl) reduce la cantidad neta recepcionada en alije y puede explicar parte de la diferencia entre arribo y recepcion.`);
  }

  if (Math.abs(plainNumber(state.lineDisplacementBbl)) > 0 && state.includeLighterToTerminal) {
    comments.push(`El line displacement/drenaje (${number(plainNumber(state.lineDisplacementBbl))} bbl) incrementa la entrega final considerada a terminal y debe estar soportado con registros de linea.`);
  }

  if (calc.worstLeg && calc.worstLeg.from !== "-") {
    comments.push(`El tramo con mayor impacto cuantitativo es ${calc.worstLeg.from} -> ${calc.worstLeg.to}, con ${number(calc.worstLeg.diffBbl)} bbl (${number(calc.worstLeg.diffPct, 3)}%).`);
  }

  if (calc.netOperatingHours > 0 && calc.committedHours > 0) {
    const variance = calc.netOperatingHours - calc.committedHours;
    comments.push(`En tiempo operativo, la descarga neta fue ${number(calc.netOperatingHours, 1)} h contra ${number(calc.committedHours, 1)} h comprometidas por Key Meeting, con variacion de ${number(variance, 1)} h.`);
  }

  if (calc.stoppageSummary.totalHours > 0) {
    comments.push(`Las detenciones registradas suman ${number(calc.stoppageSummary.totalHours, 1)} h: ${number(calc.stoppageSummary.discountHours, 1)} h descontables y ${number(calc.stoppageSummary.accountableHours, 1)} h que afectan la operacion.`);
  }

  if (state.receiptBasis === "Buque") {
    comments.push("La recepcion de alije fue tomada sobre base buque, por lo que el sistema aplica VEF destino a esa medicion.");
  } else {
    comments.push("La recepcion de alije fue tomada sobre base terminal, por lo que no se aplica VEF a esa etapa.");
  }

  if (!comments.length) {
    return "No se observan efectos operacionales relevantes con la informacion cargada. La diferencia se mantiene dentro de tolerancia y sin cambios significativos de calidad.";
  }
  return comments.join(" ");
}

function buildHourlyAnalysis(state, calc) {
  const enteredRows = state.hourlyEntries
    .map((entry, index) => ({
      hour: index + 1,
      start: parseDateTime(entry.start),
      end: parseDateTime(entry.end),
      volume: plainNumber(entry.volume),
      pressure: entry.pressure,
      pressureUnit: entry.pressureUnit || "PSI",
      status: entry.status || "Descargando",
      comment: entry.comment || "",
    }))
    .filter((entry) => entry.start || entry.end || entry.volume || entry.comment);

  if (enteredRows.length) {
    let actual = 0;
    let elapsed = 0;
    return enteredRows.map((entry) => {
      const segmentHours = hoursBetween(entry.start, entry.end) || 1;
      elapsed += segmentHours;
      actual += entry.volume;
      const planned = Math.min(calc.keyMeetingRate * elapsed, Math.max(calc.adjustedNsv, actual));
      return {
        hour: entry.hour,
        from: formatHourLabel(entry.start),
        to: formatHourLabel(entry.end),
        status: entry.status,
        planned,
        actual,
        variance: actual - planned,
        comment: entry.comment,
        pressure: entry.pressure,
        pressureUnit: entry.pressureUnit,
        source: "entered",
      };
    });
  }

  const start = parseDateTime(state.dischargeStart) || parseDateTime(state.norTendered);
  const end = parseDateTime(state.disconnectionComplete);
  if (!start || !end || end <= start || calc.netOperatingHours <= 0) return [];

  const rows = [];
  const maxRows = 72;
  const finalVolume = Math.max(calc.adjustedNsv, 0);
  let activeElapsed = 0;
  let grossElapsed = 0;
  let cursor = new Date(start);

  for (let hour = 1; cursor < end && rows.length < maxRows; hour += 1) {
    const next = new Date(Math.min(cursor.getTime() + 36e5, end.getTime()));
    const grossSegment = hoursBetween(cursor, next);
    const discountStop = state.stoppages.reduce((sum, stoppage) => {
      if (stoppage.accountable !== "discount") return sum;
      return sum + overlapHours(cursor, next, parseDateTime(stoppage.start), parseDateTime(stoppage.end));
    }, 0);
    const accountableStop = state.stoppages.reduce((sum, stoppage) => {
      if (stoppage.accountable !== "accountable") return sum;
      return sum + overlapHours(cursor, next, parseDateTime(stoppage.start), parseDateTime(stoppage.end));
    }, 0);
    const activeSegment = Math.max(grossSegment - discountStop, 0);
    activeElapsed += activeSegment;
    grossElapsed += grossSegment;
    const planned = Math.min(calc.keyMeetingRate * grossElapsed, finalVolume);
    const actual = finalVolume * Math.min(activeElapsed / calc.netOperatingHours, 1);
    const status = discountStop > 0 ? "Detencion descontable" : accountableStop > 0 ? "Detencion afecta operacion" : "Descargando";
    rows.push({
      hour,
      from: formatHourLabel(cursor),
      to: formatHourLabel(next),
      status,
      planned,
      actual,
      variance: actual - planned,
      comment: "",
      pressure: "",
      pressureUnit: "",
      source: "estimated",
    });
    cursor = next;
  }
  return rows;
}

function render(state, calc) {
  document.querySelectorAll(".toggle-row").forEach((row) => {
    const checkbox = row.querySelector('input[type="checkbox"]');
    row.classList.toggle("excluded", checkbox && !checkbox.checked);
  });

  const riskText = textForRisk(calc.risk);
  const riskPanel = document.querySelector("#riskPanel");
  riskPanel.className = `hero-status ${calc.risk}`;
  document.querySelector("#riskLabel").textContent = riskText.label;
  document.querySelector("#riskReason").textContent = riskText.reason;
  document.querySelector("#kpiDiffBbl").textContent = `${number(calc.diffBbl)} bbl`;
  document.querySelector("#kpiDiffM3").textContent = `${number(calc.diffM3)} m3`;
  document.querySelector("#kpiLoss").textContent = `${number(calc.lossPct, 3)}%`;
  document.querySelector("#kpiLossStatus").textContent =
    Math.abs(calc.lossPct) > calc.tolerance ? "Fuera de tolerancia" : "Dentro de tolerancia";
  document.querySelector("#kpiDelay").textContent = `${number(calc.delayHours, 1)} h`;
  document.querySelector("#kpiDelayCost").textContent = `${money(calc.delayCost)} estimado`;
  document.querySelector("#kpiSamples").textContent = `${calc.checkpoints.length}/8`;
  document.querySelector("#kpiSampleStatus").textContent =
    calc.checkpoints.length >= 6 ? "Round trip robusto" : "Trazabilidad parcial";
  document.querySelector("#adjustedNsv").textContent = `${number(calc.adjustedNsv)} bbl`;
  document.querySelector("#nsvDifference").textContent = `${number(calc.diffBbl)} bbl`;
  document.querySelector("#metricVolume").textContent = `${number(calc.worstLeg.diffBbl)} bbl`;
  document.querySelector("#decisionText").textContent = riskText.decision;
  document.querySelector("#nextAction").textContent = riskText.next;

  const alerts = buildAlerts(state, calc);
  const alertList = document.querySelector("#alertsList");
  alertList.innerHTML = alerts.map((alert) => `<li class="${alert.level}">${alert.text}</li>`).join("");

  document.querySelector("#reportTitle").textContent = state.reportNo;
  document.querySelector("#signatureInspector").textContent = state.inspector;
  document.querySelector("#reportMeta").innerHTML = [
    ["Cliente", state.client],
    ["Nave", state.vessel],
    ["Terminal", state.terminal],
    ["Producto", state.product],
    ["Operacion", state.operationType],
    ["Fecha", state.date],
    ["Inspector", state.inspector],
    ["Riesgo", riskText.label],
  ]
    .map(([label, value]) => `<div><small>${label}</small><strong>${value || "-"}</strong></div>`)
    .join("");

  document.querySelector("#executiveSummary").textContent =
    `Durante la ${state.operationType.toLowerCase()} de ${state.product}, ACI reconstruyo el round trip desde ${calc.first.label.toLowerCase()} hasta ${calc.last.label.toLowerCase()}. ` +
    `La diferencia acumulada es ${number(calc.diffBbl)} bbl (${number(calc.lossPct, 3)}%) y el tramo mas sensible es ${calc.worstLeg.from} -> ${calc.worstLeg.to}. ` +
    `El estado operativo queda clasificado como ${riskText.label.toLowerCase()}. ${riskText.next}`;

  const checkpointRows = calc.checkpoints.map((checkpoint) => `
    <tr>
      <td>${checkpoint.label}</td>
      <td>${number(checkpoint.cube.gsv)}</td>
      <td>${number(checkpoint.cube.api, 2)}</td>
      <td>${number(checkpoint.cube.bsw, 3)}%</td>
      <td>${number(checkpoint.cube.vef, 5)}</td>
      <td>${number(checkpoint.value)}</td>
      <td>${checkpoint.note}</td>
    </tr>
  `);
  const legRows = calc.legs.map((leg) => `
    <tr class="leg-row">
      <td>${leg.from} -> ${leg.to}</td>
      <td colspan="4">Diferencia tramo</td>
      <td>${number(leg.diffBbl)}</td>
      <td>${number(leg.diffPct, 3)}% | API ${number(leg.apiDiff, 2)} | BSW ${number(leg.bswDiff, 3)}%</td>
    </tr>
  `);
  document.querySelector("#quantityTable").innerHTML = [
    "<tr><th>Etapa</th><th>GSV bbl</th><th>API</th><th>BSW</th><th>VEF</th><th>NSV bbl</th><th>Observacion</th></tr>",
    ...checkpointRows,
    `<tr class="summary-row"><td>Diferencia round trip</td><td colspan="4">${number(calc.diffM3)} m3</td><td>${number(calc.diffBbl)}</td><td>${number(calc.lossPct, 3)}% acumulado</td></tr>`,
    `<tr class="summary-row"><td>Demora estimada</td><td colspan="5">${number(calc.delayHours, 1)} h</td><td>${money(calc.delayCost)}</td></tr>`,
    ...legRows,
  ]
    .join("");

  document.querySelector("#effectsCommentary").textContent = buildEffectsCommentary(state, calc);

  document.querySelector("#timeTable").innerHTML = [
    "<tr><th>Concepto</th><th>Resultado</th></tr>",
    `<tr><td>NOR a desconexion</td><td>${number(calc.norToDisconnectHours, 1)} h</td></tr>`,
    `<tr><td>Tiempo bruto descarga</td><td>${number(calc.grossHours, 1)} h</td></tr>`,
    `<tr><td>Detenciones descontables</td><td>${number(calc.stoppageSummary.discountHours, 1)} h</td></tr>`,
    `<tr><td>Detenciones que afectan operacion</td><td>${number(calc.stoppageSummary.accountableHours, 1)} h</td></tr>`,
    `<tr><td>Tiempo neto operativo</td><td>${number(calc.netOperatingHours, 1)} h</td></tr>`,
    `<tr><td>Compromiso Key Meeting</td><td>${number(calc.keyMeetingRate, 1)} bbl/h | ${number(calc.committedHours, 1)} h estimadas</td></tr>`,
    `<tr><td>Demora estimada</td><td>${number(calc.delayHours, 1)} h | ${money(calc.delayCost)}</td></tr>`,
  ].join("");

  const hourlyRows = buildHourlyAnalysis(state, calc);
  const hasEnteredHourly = hourlyRows.some((row) => row.source === "entered");
  document.querySelector("#hourlyMethod").textContent = hasEnteredHourly
    ? `Metodo: el plan acumulado se calcula con el compromiso de Key Meeting (${number(calc.keyMeetingRate, 1)} bbl/h). El real acumulado usa los volumenes horarios cargados manualmente en el modulo Hora a hora editable.`
    : `Metodo: el plan acumulado se calcula con el compromiso de Key Meeting (${number(calc.keyMeetingRate, 1)} bbl/h) hasta el volumen final considerado (${number(calc.adjustedNsv)} bbl). El real estimado acumulado reparte ese volumen final sobre el tiempo neto operativo (${number(calc.netOperatingHours, 1)} h), descontando solo detenciones marcadas como descontables. No corresponde a medicion real por hora salvo que se carguen ratas/volumenes horarios.`;
  document.querySelector("#hourlyTable").innerHTML = [
    `<tr><th>Hora</th><th>Ventana</th><th>Estado</th><th>Presion</th><th>Unidad</th><th>Plan acum. bbl</th><th>${hasEnteredHourly ? "Real cargado acum. bbl" : "Real estimado acum. bbl"}</th><th>${hasEnteredHourly ? "Variacion real" : "Variacion estimada"}</th><th>Comentario</th></tr>`,
    ...(hourlyRows.length
      ? hourlyRows.map((row) => `<tr><td>${row.hour}</td><td>${row.from} - ${row.to}</td><td>${row.status}</td><td>${row.pressure || "-"}</td><td>${row.pressureUnit || "-"}</td><td>${number(row.planned)}</td><td>${number(row.actual)}</td><td>${number(row.variance)}</td><td>${row.comment || "-"}</td></tr>`)
      : ["<tr><td colspan=\"9\">Ingrese inicio de descarga y termino de desconexion para generar el analisis hora a hora, o cargue filas manuales en Hora a hora editable.</td></tr>"]),
  ].join("");

  document.querySelector("#reportEvents").innerHTML =
    state.events.map((event) => `<li>${event.time ? `${event.time} - ` : ""}${event.title} (${event.impact})</li>`).join("") ||
    "<li>Sin eventos registrados.</li>";

  document.querySelector("#reportSamples").innerHTML =
    state.samples.map((sample) => `<li>${sample.id || "Muestra"} - ${sample.source || "Origen pendiente"} (${sample.status})</li>`).join("") ||
    "<li>Sin muestras registradas.</li>";
}

function findCheckpoint(calc, ...keys) {
  return calc.checkpoints.find((checkpoint) => keys.includes(checkpoint.key));
}

function flowValue(value, decimals = 2) {
  return Number.isFinite(value) ? `${number(value, decimals)} bbl` : "Pendiente";
}

function flowPct(diff, base) {
  return base ? `${number((diff / base) * 100, 3)}%` : "sin base";
}

function setFlowCard(id, value, meta) {
  const strong = document.querySelector(`#${id}`);
  const detail = document.querySelector(`#${id}Meta`);
  if (strong) strong.textContent = value;
  if (detail) detail.textContent = meta;
}

function renderLighterPlan(state) {
  const lighters = state.lighters || [];
  const totals = {
    count: lighters.length,
    transferMother: 0,
    transferReceiver: 0,
    transferDiff: 0,
    deliveryUllage: 0,
    deliveryShore: 0,
    deliveryDiff: 0,
    sanVicente: 0,
    quintero: 0,
    details: [],
  };

  document.querySelectorAll(".lighter-card").forEach((card, index) => {
    const lighter = lighters[index];
    if (!lighter) return;
    const transferMother = lighter.transferActive ? lighter.motherNsv - lighter.motherRob : 0;
    const transferReceiver = lighter.transferActive ? lighter.receiverNsv : 0;
    const transferDiff = transferReceiver - transferMother;
    const deliveryUllage = lighter.deliveryActive ? lighter.ullageNsv : 0;
    const deliveryShore = lighter.deliveryActive ? lighter.shoreNsv + lighter.lineAdjustment : 0;
    const deliveryDiff = deliveryShore - deliveryUllage;

    totals.transferMother += transferMother;
    totals.transferReceiver += transferReceiver;
    totals.transferDiff += transferDiff;
    totals.deliveryUllage += deliveryUllage;
    totals.deliveryShore += deliveryShore;
    totals.deliveryDiff += deliveryDiff;
    if (lighter.destination === "San Vicente") totals.sanVicente += deliveryShore;
    if (lighter.destination === "Quintero") totals.quintero += deliveryShore;
    totals.details.push({
      name: lighter.name || `Alijador ${index + 1}`,
      destination: lighter.destination,
      transferActive: lighter.transferActive,
      deliveryActive: lighter.deliveryActive,
      transferMother,
      transferReceiver,
      transferDiff,
      deliveryUllage,
      deliveryShore,
      deliveryDiff,
      lineAdjustment: lighter.lineAdjustment,
      motherRob: lighter.motherRob,
    });

    card.querySelector(".lighter-result-table tbody").innerHTML = [
      "<tr><th>Balance</th><th>Base A</th><th>Base B</th><th>Diferencia</th><th>Lectura</th></tr>",
      `<tr><td>Alije STS</td><td>${number(transferMother)} bbl emisor</td><td>${number(transferReceiver)} bbl receptor</td><td>${number(transferDiff)} bbl</td><td>Madre/emisor vs alijador receptor</td></tr>`,
      `<tr><td>Entrega ${lighter.destination}</td><td>${number(deliveryUllage)} bbl ullage</td><td>${number(deliveryShore)} bbl tierra</td><td>${number(deliveryDiff)} bbl</td><td>Alijador vs terminal</td></tr>`,
    ].join("");
  });

  latestLighterPlan = totals;
  const body = document.querySelector("#lighterSummaryRows");
  if (body) {
    body.innerHTML = [
      "<tr><th>Concepto</th><th>Resultado</th><th>Concepto</th><th>Resultado</th></tr>",
      `<tr><td>Alijadores activos</td><td>${totals.count}</td><td>Fondeadero</td><td>${state.lighterAnchorage || "-"}</td></tr>`,
      `<tr><td>Total emitido madre</td><td>${number(totals.transferMother)} bbl</td><td>Total recibido alijadores</td><td>${number(totals.transferReceiver)} bbl</td></tr>`,
      `<tr><td>Diferencia STS</td><td>${number(totals.transferDiff)} bbl</td><td>Terminal operador</td><td>${state.lighterTerminalOperator || "-"}</td></tr>`,
      `<tr><td>Ullage total alijadores</td><td>${number(totals.deliveryUllage)} bbl</td><td>Tierra total terminales</td><td>${number(totals.deliveryShore)} bbl</td></tr>`,
      `<tr><td>Diferencia entrega</td><td>${number(totals.deliveryDiff)} bbl</td><td>San Vicente / Quintero</td><td>${number(totals.sanVicente)} / ${number(totals.quintero)} bbl</td></tr>`,
    ].join("");
  }
  return totals;
}

function renderOperationalFlow(state, calc) {
  if (!document.querySelector("#flowBl")) return;
  const bl = findCheckpoint(calc, "bl");
  const origin = findCheckpoint(calc, "origin");
  const arrival = findCheckpoint(calc, "arrivalVef", "arrivalNoVef");
  const terminal = findCheckpoint(calc, "lighterTerminal");
  const originReference = origin || bl;
  const shipDischarge = latestUllageDischarge && latestUllageDischarge.active ? latestUllageDischarge.nsv : NaN;
  const lighterShoreReceipt = latestLighterPlan && latestLighterPlan.deliveryShore ? latestLighterPlan.deliveryShore : NaN;
  const shoreReceipt = latestShoreReceipt && latestShoreReceipt.active ? latestShoreReceipt.nsv : lighterShoreReceipt;
  const originBalance = arrival && originReference ? arrival.value - originReference.value : NaN;
  const dischargeBalance = Number.isFinite(shipDischarge) && Number.isFinite(shoreReceipt) ? shoreReceipt - shipDischarge : NaN;
  const deliveryReference = terminal || (Number.isFinite(shoreReceipt) ? { value: shoreReceipt, label: "Tierra destino calculada" } : null) || calc.last;
  const deliveryBalance = bl && deliveryReference ? deliveryReference.value - bl.value : calc.diffBbl;

  setFlowCard("flowBl", flowValue(bl?.value), bl ? `NSV documental | API ${number(bl.cube.api, 2)} | BSW ${number(bl.cube.bsw, 3)}%` : "Base documental no considerada");
  setFlowCard("flowOrigin", flowValue(origin?.value), origin ? "Medicion tierra origen ajustada" : "Sin tierra origen; se usa B/L como referencia");
  setFlowCard("flowArrival", flowValue(arrival?.value), arrival ? arrival.label : "Arribo no considerado");
  setFlowCard("flowShipDischarge", flowValue(shipDischarge), Number.isFinite(shipDischarge) ? `Ullage ${latestUllageDischarge.active} tanques | GSV ${number(latestUllageDischarge.gsv)} bbl` : "Completar ullage before/after");
  setFlowCard(
    "flowShoreReceipt",
    flowValue(shoreReceipt),
    Number.isFinite(shoreReceipt)
      ? latestShoreReceipt && latestShoreReceipt.active
        ? `Tierra destino ${latestShoreReceipt.active} tanque(s) | GSV ${number(latestShoreReceipt.gsv)} bbl`
        : `Entregas alijadores ENAP | San Vicente ${number(latestLighterPlan.sanVicente)} / Quintero ${number(latestLighterPlan.quintero)} bbl`
      : "Completar tanques tierra destino"
  );

  setFlowCard(
    "flowOriginBalance",
    flowValue(originBalance),
    Number.isFinite(originBalance) && originReference ? `${arrival.label} - ${originReference.label || "B/L"} | ${flowPct(originBalance, originReference.value)}` : "Falta referencia origen o arribo"
  );
  setFlowCard(
    "flowDischargeBalance",
    flowValue(dischargeBalance),
    Number.isFinite(dischargeBalance) ? `Tierra destino - buque descargado | ${flowPct(dischargeBalance, shipDischarge)}` : "Requiere ullage de descarga y tierra destino"
  );
  setFlowCard(
    "flowDeliveryBalance",
    flowValue(deliveryBalance),
    bl ? `${deliveryReference.label || "Entrega final"} - B/L | ${flowPct(deliveryBalance, bl.value)}` : "Sin B/L activo"
  );

  const status = document.querySelector("#flowStatus");
  const ready = bl && arrival && Number.isFinite(shipDischarge) && Number.isFinite(shoreReceipt);
  if (status) {
    status.textContent = ready ? "Round trip completo con descarga y tierra destino" : "Trazabilidad parcial: completar mediciones tecnicas";
  }
}

function balanceRow(stage, basis, compared, diff, type, note = "") {
  return {
    stage,
    basis,
    compared,
    diff,
    pct: basis ? (diff / basis) * 100 : 0,
    type,
    note,
  };
}

function rowCause(row, state) {
  const absPct = Math.abs(row.pct);
  if (row.type === "origin") {
    return `Revisar B/L, tierra origen y buque al zarpe. Posibles efectos: diferencia de medicion origen, ajuste de linea, VEF origen ${number(plainNumber(state.originVef) || 1, 5)}, temperatura/VCF, API o BSW.`;
  }
  if (row.type === "voyage") {
    return `Revisar buque madre al arribo contra origen. Posibles efectos: VEF destino ${number(plainNumber(state.destinationVef) || 1, 5)}, ROB/consumo, cambio de trim/list, temperatura de tanques, agua libre o diferencia API/BSW.`;
  }
  if (row.type === "sts") {
    return "Revisar actas STS madre-receptor. Posibles efectos: ullage del receptor, remanente/ROB del emisor, medicion simultanea, temperatura, correccion VCF y comunicaciones de cantidad transferida.";
  }
  if (row.type === "terminal") {
    return "Revisar descarga alijador-terminal. Posibles efectos: medicion de tierra, ajuste de linea, drenaje/desplazamiento, temperatura de terminal, free water/BSW, CTSh/VCF y cierre de valvulas.";
  }
  if (row.type === "shipshore") {
    return "Revisar conciliacion buque descargado vs tierra destino. Posibles efectos: ullage before/after, tanques shore, line fill, temperatura diferencial, VCF, agua libre y secuencia de descarga.";
  }
  if (absPct > 0.25) return "Desvio material: priorizar respaldo de medicion, temperaturas, samples y comunicaciones operativas.";
  return "Desvio menor: mantener trazabilidad documental y verificar que las bases de cantidad sean comparables.";
}

function renderMasterBalance(state, calc) {
  const body = document.querySelector("#masterBalanceRows");
  if (!body) return;
  const bl = findCheckpoint(calc, "bl");
  const origin = findCheckpoint(calc, "origin");
  const sailing = findCheckpoint(calc, "sailingVef", "sailingNoVef");
  const arrival = findCheckpoint(calc, "arrivalVef", "arrivalNoVef");
  const shipDischarge = latestUllageDischarge && latestUllageDischarge.active ? latestUllageDischarge.nsv : NaN;
  const shoreFromTanks = latestShoreReceipt && latestShoreReceipt.active ? latestShoreReceipt.nsv : NaN;
  const shoreFromLighters = latestLighterPlan && latestLighterPlan.deliveryShore ? latestLighterPlan.deliveryShore : NaN;
  const shoreReceipt = Number.isFinite(shoreFromTanks) ? shoreFromTanks : shoreFromLighters;
  const rows = [];

  if (bl && origin) rows.push(balanceRow("Origen: B/L vs tierra origen", bl.value, origin.value, origin.value - bl.value, "origin", "Base documental contra shore origen"));
  if (origin && sailing) rows.push(balanceRow("Origen: tierra origen vs buque origen", origin.value, sailing.value, sailing.value - origin.value, "origin", sailing.label));
  if ((sailing || origin || bl) && arrival) {
    const base = sailing || origin || bl;
    rows.push(balanceRow("Travesia: referencia origen vs madre arribo", base.value, arrival.value, arrival.value - base.value, "voyage", arrival.label));
  }
  (latestLighterPlan?.details || []).forEach((lighter) => {
    if (lighter.transferActive) rows.push(balanceRow(`Alije STS: ${lighter.name}`, lighter.transferMother, lighter.transferReceiver, lighter.transferDiff, "sts", `Destino previsto ${lighter.destination}; ROB madre ${number(lighter.motherRob)} bbl`));
    if (lighter.deliveryActive) rows.push(balanceRow(`Entrega terminal: ${lighter.name} -> ${lighter.destination}`, lighter.deliveryUllage, lighter.deliveryShore, lighter.deliveryDiff, "terminal", `Incluye ajuste linea ${number(lighter.lineAdjustment)} bbl`));
  });
  if (Number.isFinite(shipDischarge) && Number.isFinite(shoreReceipt)) {
    rows.push(balanceRow("Descarga total: buque(s) vs tierra destino", shipDischarge, shoreReceipt, shoreReceipt - shipDischarge, "shipshore", Number.isFinite(shoreFromTanks) ? "Base tierra por tanques destino" : "Base tierra consolidada por alijadores"));
  }
  if (bl && Number.isFinite(shoreReceipt)) {
    rows.push(balanceRow("Round trip total: B/L vs tierra destino", bl.value, shoreReceipt, shoreReceipt - bl.value, "terminal", "Cierre global"));
  }

  body.innerHTML = [
    "<tr><th>Tramo</th><th>Base A NSV</th><th>Base B NSV</th><th>Diferencia</th><th>%</th><th>Lectura</th></tr>",
    ...(rows.length
      ? rows.map((row) => `<tr><td>${row.stage}</td><td>${number(row.basis)}</td><td>${number(row.compared)}</td><td>${number(row.diff)}</td><td>${number(row.pct, 3)}%</td><td>${row.note}</td></tr>`)
      : ["<tr><td colspan=\"6\">Complete B/L, origen, arribo, alijes o tierra destino para construir el compendio.</td></tr>"]),
  ].join("");

  const meaningful = rows.filter((row) => Number.isFinite(row.diff));
  const worst = meaningful.reduce((selected, row) => (Math.abs(row.diff) > Math.abs(selected.diff) ? row : selected), { diff: 0, stage: "pendiente", pct: 0, type: "" });
  const worstLabel = document.querySelector("#masterWorstDeviation");
  if (worstLabel) worstLabel.textContent = meaningful.length ? `Mayor desvio: ${worst.stage} (${number(worst.diff)} bbl)` : "Mayor desvio: pendiente";

  const analysis = document.querySelector("#aiDeviationAnalysis");
  if (!analysis) return;
  if (!meaningful.length) {
    analysis.textContent = "Complete mediciones para generar el analisis.";
    return;
  }
  const ranked = [...meaningful].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 3);
  const tolerance = Math.abs(plainNumber(state.tolerancePct));
  const toleranceText = Math.abs(worst.pct) > tolerance ? `supera la tolerancia configurada de ${number(tolerance, 3)}%` : `se mantiene dentro de la tolerancia configurada de ${number(tolerance, 3)}%`;
  analysis.textContent = `El mayor desvio se observa en ${worst.stage}: ${number(worst.diff)} bbl (${number(worst.pct, 3)}%), ${toleranceText}. ${rowCause(worst, state)} Tramos siguientes por impacto: ${ranked.map((row) => `${row.stage} ${number(row.diff)} bbl`).join("; ")}.`;
}

function update() {
  const state = getState();
  const calc = calculate(state);
  render(state, calc);
  renderLighterPlan(state);
  renderApi1211();
  renderOperationalFlow(state, calc);
  renderMasterBalance(state, calc);
  saveState();
}

function apiInput(name) {
  return document.querySelector(`[name="${name}"]`);
}

const tankNames = ["1P", "1S", "2P", "2S", "3P", "3S", "4P", "4S", "5P", "5S", "6P", "6S", "7P", "7S"];

function correctedTempF(tempF) {
  const x = ((plainNumber(tempF) - 32) / 1.8) / 630;
  let p = 7.438081 + (-3.536296 * x) * x;
  p = -1.871251 + p * x;
  p = -4.089591 + p * x;
  p = 1.269056 + p * x;
  p = 1.08076 + p * x;
  p = -0.267408 + p * x;
  p = -0.148759 + p * x;
  const dt = p * x;
  return (((plainNumber(tempF) - 32) / 1.8 - dt) * 1.8) + 32;
}

function rho60FromApi(apiGravity) {
  return (141.5 / (plainNumber(apiGravity) + 131.5)) * 999.016;
}

function rhoStar(rho60, a, b) {
  return rho60 * (1 + (Math.exp(a * (1 + 0.8 * a)) - 1) / (1 + a * (1 + 1.6 * a) * b));
}

function vcfFromLambda(lambda, tempF) {
  const t = correctedTempF(tempF);
  return Math.round(Math.exp(-lambda * (t - 60.0068749) * (1 + 0.8 * lambda * (t - 60.0068749 + 0.01374979547))) * 100000) / 100000;
}

function productConstants6B(rho60) {
  if (rho60 <= 1163.5 && rho60 >= 838.3127) return { k0: 103.872, k1: 0.2701, k2: 0, name: "Fuel Oil" };
  if (rho60 <= 838.3127 && rho60 >= 787.5195) return { k0: 330.301, k1: 0, k2: 0, name: "Jet Fuel" };
  if (rho60 <= 787.5195 && rho60 >= 770.352) return { k0: 1489.067, k1: 0, k2: -0.0018684, name: "Transition" };
  if (rho60 <= 770.352 && rho60 >= 610.6) return { k0: 192.4571, k1: 0.2438, k2: 0, name: "Gasoline" };
  return null;
}

function vcfFromTable(apiGravity, tempF, table) {
  const rho60 = rho60FromApi(apiGravity);
  const delta60 = 0.01374979547;
  if (table === "6A") {
    const a = (delta60 / 2) * (341.0957 / rho60 ** 2);
    const star = rhoStar(rho60, a, 2);
    return vcfFromLambda(341.0957 / star ** 2, tempF);
  }
  if (table === "6B") {
    const constants = productConstants6B(rho60);
    if (!constants) return NaN;
    const a = (delta60 / 2) * (((constants.k0 / rho60 + constants.k1) / rho60) + constants.k2);
    const b = ((2 * constants.k0) + constants.k1 * rho60) / (constants.k0 + (constants.k1 + constants.k2 * rho60) * rho60);
    const star = rhoStar(rho60, a, b);
    const lambda = constants.k0 / star ** 2 + constants.k1 / star + constants.k2;
    return vcfFromLambda(lambda, tempF);
  }
  if (table === "6C") {
    return vcfFromLambda(0.000789, tempF);
  }
  if (table === "6D") {
    const a = (delta60 / 2) * (0.34878 / rho60);
    const star = rhoStar(rho60, a, 1);
    return vcfFromLambda(0.34878 / star, tempF);
  }
  return NaN;
}

function tankNameCell(tank, index, mode) {
  const editable = mode === "before" && index >= 12;
  if (editable) return `<input class="tank-name-input" value="${tank}" />`;
  if (mode === "after") return `<input class="tank-name-input after-name" value="${tank}" readonly />`;
  return `<strong>${tank}</strong>`;
}

function makeUllageRows(body, mode) {
  body.innerHTML = tankNames
    .map((tank, index) => {
      const sampleTov = mode === "before" && index < 8 ? 18000 + index * 120 : mode === "after" && index < 8 ? 600 + index * 20 : 0;
      return `
        <tr class="ullage-row ${mode}-row" data-tank-index="${index}">
          <td><input class="tank-use" type="checkbox" ${index < 8 ? "checked" : ""} /></td>
          <td>${tankNameCell(tank, index, mode)}</td>
          <td><input class="tank-ullage" type="number" step="0.001" placeholder="m/ft" /></td>
          <td><input class="tank-ref-height" type="number" step="0.001" placeholder="m/ft" ${mode === "after" ? "readonly" : ""} /></td>
          <td><input class="tank-tov" type="number" step="0.001" value="${sampleTov || ""}" /></td>
          <td><input class="tank-fw" type="number" step="0.001" value="0" /></td>
          <td><input class="tank-temp" type="number" step="0.1" value="75" /></td>
          <td><input class="tank-api" type="number" step="0.01" value="38.2" /></td>
          <td><input class="tank-bsw" type="number" step="0.001" value="0.08" /></td>
          <td class="tank-vcf-auto">1.000000</td>
          <td><input class="tank-vcf-override" type="number" step="0.000001" placeholder="auto" /></td>
          <td class="tank-gov">0</td>
          <td class="tank-gsv">0</td>
          <td class="tank-nsv">0</td>
        </tr>
      `;
    })
    .join("");
}

function ensureUllageRows() {
  const beforeBody = document.querySelector("#ullageBeforeRows");
  const afterBody = document.querySelector("#ullageAfterRows");
  if (!beforeBody || !afterBody) return;
  if (!beforeBody.children.length) {
    makeUllageRows(beforeBody, "before");
    beforeBody.addEventListener("input", renderApi1211);
  }
  if (!afterBody.children.length) {
    makeUllageRows(afterBody, "after");
    afterBody.addEventListener("input", renderApi1211);
  }
}

function syncAfterTankIdentity() {
  document.querySelectorAll(".before-row").forEach((beforeRow) => {
    const index = beforeRow.dataset.tankIndex;
    const afterRow = document.querySelector(`.after-row[data-tank-index="${index}"]`);
    if (!afterRow) return;
    const beforeNameInput = beforeRow.querySelector(".tank-name-input");
    const beforeName = beforeNameInput ? beforeNameInput.value : beforeRow.children[1].textContent.trim();
    afterRow.querySelector(".tank-name-input").value = beforeName;
    afterRow.querySelector(".tank-ref-height").value = beforeRow.querySelector(".tank-ref-height").value;
  });
}

function calculateUllageSet(selector, productClass, ctsh, vef) {
  const totals = { gov: 0, gsv: 0, nsv: 0, tov: 0, fw: 0, active: 0, weightedApi: 0, density15: 0 };
  document.querySelectorAll(selector).forEach((row) => {
    const use = row.querySelector(".tank-use").checked;
    const tov = plainNumber(row.querySelector(".tank-tov").value);
    const fw = plainNumber(row.querySelector(".tank-fw").value);
    const temp = plainNumber(row.querySelector(".tank-temp").value);
    const api = plainNumber(row.querySelector(".tank-api").value);
    const bsw = plainNumber(row.querySelector(".tank-bsw").value);
    const autoVcf = vcfFromTable(api, temp, productClass);
    const override = plainNumber(row.querySelector(".tank-vcf-override").value);
    const vcf = override || (Number.isFinite(autoVcf) ? autoVcf : 0);
    const gov = use ? Math.max(tov - fw, 0) : 0;
    const gsv = gov * vcf * ctsh * vef;
    const nsv = gsv * (1 - bsw / 100);
    row.querySelector(".tank-vcf-auto").textContent = Number.isFinite(autoVcf) ? number(autoVcf, 6) : "fuera rango";
    row.querySelector(".tank-gov").textContent = number(gov);
    row.querySelector(".tank-gsv").textContent = number(gsv);
    row.querySelector(".tank-nsv").textContent = number(nsv);
    row.classList.toggle("excluded", !use);
    if (use) {
      totals.active += 1;
      totals.tov += tov;
      totals.fw += fw;
      totals.gov += gov;
      totals.gsv += gsv;
      totals.nsv += nsv;
      totals.weightedApi += api * Math.max(gsv, 0);
      totals.density15 += (rho60FromApi(api) / 999.016) * Math.max(gsv, 0);
    }
  });
  totals.api = totals.gsv ? totals.weightedApi / totals.gsv : 0;
  totals.density15 = totals.gsv ? totals.density15 / totals.gsv : 0;
  return totals;
}

function renderApi1211() {
  ensureUllageRows();
  syncAfterTankIdentity();
  const productClass = apiInput("apiProductClass")?.value || "6A";
  const ctsh = plainNumber(apiInput("apiGlobalCtsh")?.value) || 1;
  const vef = plainNumber(apiInput("apiGlobalVef")?.value) || 1;
  const before = calculateUllageSet(".before-row", productClass, ctsh, vef);
  const after = calculateUllageSet(".after-row", productClass, ctsh, vef);
  const discharged = {
    tov: before.tov - after.tov,
    fw: before.fw - after.fw,
    gov: before.gov - after.gov,
    gsv: before.gsv - after.gsv,
    nsv: before.nsv - after.nsv,
    api: before.api || after.api,
    density15: before.density15 || after.density15,
    active: Math.min(before.active, after.active),
  };
  latestUllageDischarge = discharged;

  document.querySelector("#apiGovResult").textContent = `${number(discharged.gov)} bbl`;
  document.querySelector("#apiGsvResult").textContent = `${number(discharged.gsv)} bbl`;
  document.querySelector("#apiNsvResult").textContent = `${number(discharged.nsv)} bbl`;
  document.querySelector("#apiMethodResult").textContent = `${before.active}/${after.active}`;
  renderUllageSummary(discharged, vef);
  const state = getState();
  const calc = calculate(state);
  renderOperationalFlow(state, calc);
  renderMasterBalance(state, calc);
}

function renderUllageSummary(discharged, vef) {
  const bblToM3 = 0.158987294928;
  const usGal = discharged.gsv * 42;
  const metricTons = discharged.nsv * bblToM3 * discharged.density15;
  const longTons = metricTons / 1.0160469088;
  const rows = [
    ["Total Observed Volume", discharged.tov, "bbl", "Density @ 15°C", discharged.density15, ""],
    ["Less Free Water", discharged.fw, "bbl", "API Gravity @60°F", discharged.api, ""],
    ["Gross Observed Volume", discharged.gov, "bbl", "Metric Tons in Vacuum", metricTons, "MT"],
    ["Gross Standard Volume @60°F", discharged.gsv, "bbl", "Long Tons", longTons, "LT"],
    ["Before, Barrels @60°F", discharged.nsv, "bbl", "US Barrels @60°F", discharged.gsv, "bbl"],
    ["Cubic Meters @15.0 C Disch.", discharged.gsv * bblToM3, "m3", "US Gallons @60°F", usGal, "gal"],
    ["VEF API 17.9", vef, "", "Metric Tons", metricTons, "MT"],
    ["G.S.V. @60°F with VEF Disch.", discharged.gsv, "bbl", "Cubic Meters @60.0°F", discharged.gsv * bblToM3, "m3"],
  ];
  document.querySelector("#ullageSummaryRows").innerHTML = [
    "<tr><th>Summary</th><th>Quantity</th><th>Unit</th><th>Summary</th><th>Quantity</th><th>Unit</th></tr>",
    ...rows.map(([a, b, c, d, e, f]) => `<tr><td>${a}</td><td>${number(b, typeof b === "number" && Math.abs(b) < 10 ? 4 : 2)}</td><td>${c}</td><td>${d}</td><td>${number(e, typeof e === "number" && Math.abs(e) < 10 ? 4 : 2)}</td><td>${f}</td></tr>`),
  ].join("");
}

function shoreInput(name) {
  return document.querySelector(`[name="${name}"]`);
}

function ensureShoreTanks() {
  const list = document.querySelector("#shoreTankList");
  if (!list || list.children.length) return;
  addShoreTank({ name: "TK-001", initialTov: 0, finalTov: 0 }, false);
  renderShore();
}

function readShoreMeasure(tank, prefix, productClass, ctsh) {
  const tov = plainNumber(tank.querySelector(`.shore-${prefix}-tov`).value);
  const fw = plainNumber(tank.querySelector(`.shore-${prefix}-fw`).value);
  const temp = plainNumber(tank.querySelector(`.shore-${prefix}-temp`).value);
  const api = plainNumber(tank.querySelector(`.shore-${prefix}-api`).value);
  const bsw = plainNumber(tank.querySelector(`.shore-${prefix}-bsw`).value);
  const override = plainNumber(tank.querySelector(`.shore-${prefix}-vcf-override`).value);
  const autoVcf = vcfFromTable(api, temp, productClass);
  const vcf = override || (Number.isFinite(autoVcf) ? autoVcf : 0);
  const gov = Math.max(tov - fw, 0);
  const gsv = gov * vcf * ctsh;
  const nsv = gsv * (1 - bsw / 100);
  return { tov, fw, temp, api, bsw, autoVcf, vcf, gov, gsv, nsv };
}

function renderShore() {
  const list = document.querySelector("#shoreTankList");
  if (!list || !list.children.length) return;
  const productClass = shoreInput("shoreProductClass")?.value || "6A";
  const ctsh = plainNumber(shoreInput("shoreGlobalCtsh")?.value) || 1;
  const lineAdjustment = plainNumber(shoreInput("shoreLineAdjustmentBbl")?.value);
  const total = { tov: 0, fw: 0, gov: 0, gsv: 0, nsv: 0, weightedApi: 0, density15: 0, active: 0 };

  document.querySelectorAll(".shore-tank").forEach((tank) => {
    const initial = readShoreMeasure(tank, "initial", productClass, ctsh);
    const final = readShoreMeasure(tank, "final", productClass, ctsh);
    const diff = {
      tov: final.tov - initial.tov,
      fw: final.fw - initial.fw,
      gov: final.gov - initial.gov,
      gsv: final.gsv - initial.gsv,
      nsv: final.nsv - initial.nsv,
      api: final.gsv ? final.api : initial.api,
    };
    total.tov += diff.tov;
    total.fw += diff.fw;
    total.gov += diff.gov;
    total.gsv += diff.gsv;
    total.nsv += diff.nsv;
    if (Math.abs(diff.tov) || Math.abs(diff.gov) || Math.abs(diff.gsv) || Math.abs(diff.nsv)) total.active += 1;
    total.weightedApi += diff.api * Math.abs(diff.gsv);
    total.density15 += (rho60FromApi(diff.api) / 999.016) * Math.abs(diff.gsv);
    tank.querySelector(".shore-tank-result tbody").innerHTML = [
      "<tr><th></th><th>TOV</th><th>GOV</th><th>GSV</th><th>NSV</th><th>VCF Inicial</th><th>VCF Final</th></tr>",
      `<tr><td>Inicial</td><td>${number(initial.tov)}</td><td>${number(initial.gov)}</td><td>${number(initial.gsv)}</td><td>${number(initial.nsv)}</td><td>${Number.isFinite(initial.autoVcf) ? number(initial.autoVcf, 6) : "fuera rango"}</td><td></td></tr>`,
      `<tr><td>Final</td><td>${number(final.tov)}</td><td>${number(final.gov)}</td><td>${number(final.gsv)}</td><td>${number(final.nsv)}</td><td></td><td>${Number.isFinite(final.autoVcf) ? number(final.autoVcf, 6) : "fuera rango"}</td></tr>`,
      `<tr><td>Diferencia</td><td>${number(diff.tov)}</td><td>${number(diff.gov)}</td><td>${number(diff.gsv)}</td><td>${number(diff.nsv)}</td><td colspan="2">Final - Inicial</td></tr>`,
    ].join("");
  });

  total.gsv += lineAdjustment;
  total.nsv += lineAdjustment;
  const api = total.gsv ? total.weightedApi / Math.abs(total.gsv) : 0;
  const density15 = total.gsv ? total.density15 / Math.abs(total.gsv) : 0;
  latestShoreReceipt = { ...total, api, density15, lineAdjustment };
  renderShoreSummary(total, api, density15, lineAdjustment);
  const state = getState();
  const calc = calculate(state);
  renderOperationalFlow(state, calc);
  renderMasterBalance(state, calc);
}

function renderShoreSummary(total, api, density15, lineAdjustment) {
  const bblToM3 = 0.158987294928;
  const rows = [
    ["Terminal", shoreInput("shoreTerminal")?.value || "-", "Puerto", shoreInput("shorePort")?.value || "-"],
    ["Total TOV", `${number(total.tov)} bbl`, "Ajuste de linea", `${number(lineAdjustment)} bbl`],
    ["Total GOV", `${number(total.gov)} bbl`, "API conciliado", number(api, 2)],
    ["Total GSV @60°F", `${number(total.gsv)} bbl`, "Densidad @15°C", number(density15, 4)],
    ["Total NSV @60°F", `${number(total.nsv)} bbl`, "M3 @60°F", number(total.gsv * bblToM3)],
    ["M3 @15°C", number(total.nsv * bblToM3), "US Gallons @60°F", number(total.gsv * 42)],
  ];
  document.querySelector("#shoreSummaryRows").innerHTML = [
    "<tr><th>Concepto</th><th>Resultado</th><th>Concepto</th><th>Resultado</th></tr>",
    ...rows.map(([a, b, c, d]) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td><td>${d}</td></tr>`),
  ].join("");
}

function addShoreTank(data = {}, shouldRender = true) {
  const list = document.querySelector("#shoreTankList");
  const node = shoreTankTemplate.content.firstElementChild.cloneNode(true);
  const count = list.children.length + 1;
  node.querySelector(".shore-tank-name").value = data.name || `TK-${String(count).padStart(3, "0")}`;
  if (data.initialTov != null) node.querySelector(".shore-initial-tov").value = data.initialTov;
  if (data.finalTov != null) node.querySelector(".shore-final-tov").value = data.finalTov;
  if (data.initialDate) node.querySelector(".shore-initial-date").value = data.initialDate;
  if (data.finalDate) node.querySelector(".shore-final-date").value = data.finalDate;
  if (data.initialTime) node.querySelector(".shore-initial-time").value = data.initialTime;
  if (data.finalTime) node.querySelector(".shore-final-time").value = data.finalTime;
  if (data.initialFw != null) node.querySelector(".shore-initial-fw").value = data.initialFw;
  if (data.finalFw != null) node.querySelector(".shore-final-fw").value = data.finalFw;
  if (data.initialTemp != null) node.querySelector(".shore-initial-temp").value = data.initialTemp;
  if (data.finalTemp != null) node.querySelector(".shore-final-temp").value = data.finalTemp;
  if (data.initialApi != null) node.querySelector(".shore-initial-api").value = data.initialApi;
  if (data.finalApi != null) node.querySelector(".shore-final-api").value = data.finalApi;
  if (data.initialBsw != null) node.querySelector(".shore-initial-bsw").value = data.initialBsw;
  if (data.finalBsw != null) node.querySelector(".shore-final-bsw").value = data.finalBsw;
  node.querySelector(".remove-shore-tank").addEventListener("click", () => {
    node.remove();
    renderShore();
  });
  node.addEventListener("input", renderShore);
  list.append(node);
  if (shouldRender) renderShore();
}

document.querySelector("#addEvent").addEventListener("click", () => {
  addEventRow({ title: "Nuevo evento", impact: "Informativo" });
  update();
});

document.querySelector("#addSample").addEventListener("click", () => {
  addSampleRow({ id: "ACI-", source: "", status: "Retenida ACI" });
  update();
});

document.querySelector("#addStoppage").addEventListener("click", () => {
  addStoppageRow({ start: "", end: "", accountable: "discount", reason: "Nueva detencion" });
  update();
});

document.querySelector("#addHourly").addEventListener("click", () => {
  addHourlyEntryRow({ start: "", end: "", volume: "", pressure: "", pressureUnit: "PSI", status: "Descargando", comment: "" });
  update();
});

document.querySelector("#addLighter")?.addEventListener("click", () => {
  addLighterRow();
  update();
});

document.querySelector("#apiLoadFromSummary").addEventListener("click", () => {
  const state = getState();
  ensureUllageRows();
  const first = document.querySelector(".before-row");
  first.querySelector(".tank-tov").value = state.blGsvBbl || "";
  first.querySelector(".tank-api").value = state.blApi || "";
  first.querySelector(".tank-bsw").value = state.blBsw || "";
  renderApi1211();
});

document.querySelector("#addShoreTank").addEventListener("click", () => {
  addShoreTank();
});

document.querySelector("#resetDemo").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  setState({ ...defaults });
  update();
});

document.querySelector("#loadScenario").addEventListener("click", () => {
  setState({
    ...getState(),
    blGsvBbl: 249450,
    blApi: 38.2,
    blBsw: 0.08,
    originShoreGsvBbl: 249620,
    originShoreApi: 38.2,
    originShoreBsw: 0.084,
    originVef: 1.00056,
    sailingGsvBbl: 249180,
    sailingApi: 38.15,
    sailingBsw: 0.09,
    destinationVef: 1.00068,
    arrivalGsvBbl: 248760,
    arrivalApi: 37.78,
    arrivalBsw: 0.145,
    receiptBasis: "Terminal",
    lighterReceiptGsvBbl: 248390,
    lighterReceiptApi: 37.8,
    lighterReceiptBsw: 0.14,
    lighterToTerminalGsvBbl: 247980,
    lighterToTerminalApi: 37.76,
    lighterToTerminalBsw: 0.15,
    lineDisplacementBbl: 18,
    robBbl: 64,
    tolerancePct: 0.25,
    keyMeetingRateBph: 10500,
    norTendered: "2026-06-06T06:00",
    dischargeStart: "2026-06-06T08:00",
    disconnectionComplete: "2026-06-07T07:42",
    events: [
      { time: "", title: "Terminal informa restriccion de linea por cambio de tanque", impact: "Demora" },
      { time: "", title: "Inspector ACI solicita reconfirmacion de shore figures", impact: "Riesgo cantidad" },
      { time: "", title: "Diferencia no reconciliada al cierre de descarga", impact: "Discrepancia" },
    ],
    samples: [
      { id: "ACI-COMP-01", source: "Composite vessel", status: "CrÃ­tica" },
      { id: "ACI-SHORE-01", source: "Shore tank 201", status: "Enviada laboratorio" },
    ],
    stoppages: [
      {
        start: "2026-06-06T14:20",
        end: "2026-06-06T16:10",
        accountable: "discount",
        reason: "Cambio de tanque / espera de alineacion",
      },
      {
        start: "2026-06-06T23:30",
        end: "2026-06-07T00:25",
        accountable: "accountable",
        reason: "Reduccion de rata por restriccion operacional",
      },
    ],
    hourlyEntries: [
      { start: "2026-06-06T08:00", end: "2026-06-06T09:00", volume: 9800, pressure: 78, pressureUnit: "PSI", status: "Descargando", comment: "Inicio estable" },
      { start: "2026-06-06T09:00", end: "2026-06-06T10:00", volume: 10450, pressure: 82, pressureUnit: "PSI", status: "Descargando", comment: "" },
      { start: "2026-06-06T10:00", end: "2026-06-06T11:00", volume: 10220, pressure: 5.4, pressureUnit: "Bar", status: "Descargando", comment: "" },
      { start: "2026-06-06T14:00", end: "2026-06-06T15:00", volume: 3600, pressure: 31, pressureUnit: "PSI", status: "Detencion descontable", comment: "Cambio de tanque" },
    ],
  });
  update();
});

document.querySelector("#printReport").addEventListener("click", () => window.print());

document.addEventListener("input", (event) => {
  if (event.target.closest("#requestForm")) return;
  if (event.target.closest("#api1211")) {
    renderApi1211();
    return;
  }
  if (event.target.closest("#shore")) {
    renderShore();
    return;
  }
  if (event.target.matches("input, select")) update();
});

requestForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(requestForm);
  const name = data.get("requestName") || "";
  const company = data.get("requestCompany") || "";
  const email = data.get("requestEmail") || "";
  const phone = data.get("requestPhone") || "";
  const country = data.get("requestCountry") || "";
  const service = data.get("requestService") || "";
  const details = data.get("requestDetails") || "";
  const subject = encodeURIComponent(`Solicitud ACI - ${company || name}`);
  const body = encodeURIComponent(
    [
      "Solicitud recibida desde acilatam.cl",
      "",
      `Nombre: ${name}`,
      `Empresa: ${company}`,
      `Email: ${email}`,
      `Telefono: ${phone}`,
      `Pais: ${country}`,
      `Servicio requerido: ${service}`,
      "",
      "Detalle de la operacion:",
      details,
    ].join("\n")
  );

  window.location.href = `mailto:contacto@acilatam.cl?subject=${subject}&body=${body}`;
});

setState(loadState());
update();
ensureShoreTanks();
renderShore();
