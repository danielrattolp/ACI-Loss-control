// ACI LATAM – Bill of Tonnage Online Calculator
// API MPMS 11.1 Table 6A CTL algorithm

const ACCESS_KEY  = "aci-ops-access";
const ACCESS_HASH = "3fc610e920558f58acb852a5050f349ec1af447db03d78fbd0dd0086604d8dcd";
const STORAGE_KEY = "aci-bt-v1";

// ─── Physical constants ───────────────────────────────────────────────────
const BBL_TO_M3          = 0.158987294928;
const M3_TO_BBL          = 6.28981077043;
const BBL_TO_GAL         = 42;
const M3_15C_PER_BBL     = 0.158919995504; // MPMS 11.5
const WATER_RHO_60F      = 999.016;        // kg/m³
const AIR_FACTOR         = 0.998751564;    // MT Air / MT Vac (certified)
const MT_TO_LT           = 1.016032647;    // 1 LT = 1.0160... MT
const MT_TO_ST           = 0.907184740;
const DELTA_60           = 0.01374979547;  // API MPMS constant
const DENSITY_DISP_FACT  = 1.0004474084477923;
const DENSITY_MASS_FACT  = 1.0004284708;

const DEFAULT_TANKS = [
  "1 Port","1 Stbd","2 Port","2 Stbd",
  "3 Port","3 Stbd","4 Port","4 Stbd",
  "5 Port","5 Stbd","6 Port","6 Stbd",
  "SL Port","SL Stbd"
];

// ─── CTL Algorithm ───────────────────────────────────────────────────────
function calcVCF(api, tempF, table = "6A") {
  if (!api || !tempF || isNaN(api) || isNaN(tempF)) return null;
  const rho60 = 141.5 / (api + 131.5) * WATER_RHO_60F;
  const dT    = Number(tempF) - 60;   // MPMS 11.1 T-2004, ref 60°F ITS-90
  let alpha60;

  if (table === "6C") {
    alpha60 = 0.000789;
  } else {
    let K0, n;
    if (table === "6A") { K0 = 341.0957; n = 2; }
    else if (table === "6D") { K0 = 0.34878; n = 1; }
    else { K0 = 341.0957; n = 2; } // 6B default crude-like
    const a      = (DELTA_60 / 2) * (K0 / rho60 / rho60);
    const rhoStar = rho60 * (1 + (Math.exp(a * (1 + 0.8*a)) - 1) / (1 + a*(1 + 1.6*a)*n));
    alpha60 = K0 / (rhoStar * rhoStar);
  }
  const vcf = Math.exp(-alpha60 * dT * (1 + 0.8*alpha60*(dT + DELTA_60)));
  return Math.round(vcf * 1e5) / 1e5;
}

function thermalExp(api, table = "6A") {
  const rho60 = 141.5 / (api + 131.5) * WATER_RHO_60F;
  if (table === "6C") return 0.000789;
  const K0 = (table === "6D") ? 0.34878 : 341.0957;
  const n  = (table === "6D") ? 1 : 2;
  const a  = (DELTA_60 / 2) * (K0 / rho60 / rho60);
  const rhoStar = rho60 * (1 + (Math.exp(a*(1+0.8*a)) - 1) / (1+a*(1+1.6*a)*n));
  return K0 / (rhoStar * rhoStar);
}

function density15Display(api) {
  return (141.5 / (api+131.5)) * WATER_RHO_60F * DENSITY_DISP_FACT / 1000;
}

function density15Mass(api) {
  return (141.5 / (api+131.5)) * WATER_RHO_60F * DENSITY_MASS_FACT / 1000;
}

// ─── Number helpers ──────────────────────────────────────────────────────
const fmt = (v, d=3, blank=true) => {
  if (v === null || v === undefined || v === "" || (blank && isNaN(v))) return "";
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
};
const fmtN = (v, d=3) => fmt(v, d, false);
const p = v => (v === "" || v === null || v === undefined) ? null : Number(v);

// ─── State ───────────────────────────────────────────────────────────────
function blankTanks() {
  return DEFAULT_TANKS.map(name => ({
    name, ullage:"", ullageCorr:"", tov:"",
    fwInnage:"", fwVol:"", gov:"", govAuto:true,
    api:"", temp:"", vcfOverride:""
  }));
}

function blankShore() {
  const blankMeas = () => ({gauge:"",date:"",time:"",tov:"",fwDip:"",fwVol:"",roofCorr:"",api:"",temp:"",vcfOverride:""});
  return {
    densityLab:"", bswPct:"", apiComp:"", tapeId:"", thermId:"", calTape:"", calTherm:"",
    tanks: ["5102","5110","5103","5101","5104","5106"].map(name => ({
      name, open: blankMeas(), close: blankMeas()
    }))
  };
}

function defaultState() {
  return {
    ref:"", customer:"", vessel:"", port:"", product:"Crude Oil",
    table:"6A", voyage:"", dateFrom:"", dateTo:"",
    inspector:"", vesselRep:"", terminalRep:"",
    before: {
      vef:1.0000, draftFwd:"", draftAft:"", draftTrim:"", draftList:"",
      sealPort:"-", sealStbd:"-", sealObP:"-", sealObS:"-",
      tanks: blankTanks()
    },
    after: {
      vef:1.0000, draftFwd:"", draftAft:"", draftTrim:"", draftList:"",
      sealPort:"-", sealStbd:"-", sealObP:"-", sealObS:"-",
      tanks: blankTanks()
    },
    shore: blankShore()
  };
}

let state = (() => {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const loaded = JSON.parse(s);
      return { ...defaultState(), ...loaded,
               shore: { ...blankShore(), ...(loaded.shore || {}) } };
    }
  } catch {}
  return defaultState();
})();

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Active section tracking ──────────────────────────────────────────────
let activeSection = "before"; // "before" | "after"

function sectionData() { return state[activeSection]; }

// ─── Compute row values ───────────────────────────────────────────────────
function computeRow(tank) {
  const tov      = p(tank.tov);
  const fwVol    = p(tank.fwVol) ?? 0;
  const govM3    = tov !== null ? tov - fwVol : null;
  const govAuto  = govM3 !== null ? govM3 * M3_TO_BBL : null;
  const gov      = (tank.govAuto === false && tank.gov !== "")
                   ? p(tank.gov)
                   : govAuto;
  const api      = p(tank.api);
  const temp     = p(tank.temp);
  const vcf      = (tank.vcfOverride !== "")
                   ? p(tank.vcfOverride)
                   : calcVCF(api, temp, state.table);
  const gsv      = (gov !== null && vcf !== null) ? gov * vcf : null;
  const thExp    = api ? thermalExp(api, state.table) : null;
  return { tov, fwVol, govM3, gov, api, temp, vcf, gsv, thExp };
}

function computeTotals(section) {
  let sumTOV=0, sumFW=0, sumGOV=0, sumGSV=0, nAPI=0, sumAPI=0, nTemp=0, sumTemp=0;
  let allOK = true;
  for (const t of section.tanks) {
    const r = computeRow(t);
    if (r.tov !== null)  sumTOV += r.tov;
    sumFW  += r.fwVol ?? 0;
    if (r.gov !== null)  sumGOV += r.gov;
    if (r.gsv !== null)  sumGSV += r.gsv;
    else allOK = false;
    if (r.api !== null)  { sumAPI += r.api; nAPI++; }
    if (r.temp !== null) { sumTemp += r.temp; nTemp++; }
  }
  const avgAPI  = nAPI  ? sumAPI/nAPI  : null;
  const avgTemp = nTemp ? sumTemp/nTemp : null;
  const rho15d  = avgAPI ? density15Display(avgAPI) : null;
  const rho15m  = avgAPI ? density15Mass(avgAPI)    : null;
  const m3at15  = sumGSV * M3_15C_PER_BBL;
  const m3at60  = sumGSV * BBL_TO_M3;
  const mtVac   = m3at15 * (rho15d ?? 0);          // rho15d in t/m³, result in MT
  const mtAir   = mtVac  * AIR_FACTOR;
  const lt      = mtAir  / MT_TO_LT;
  const gallons = sumGSV * BBL_TO_GAL;
  const vef     = p(section.vef) ?? 1;
  const gsvVEF  = vef !== 0 ? sumGSV / vef : sumGSV; // API MPMS: ShoreEstimate = ShipGSV / VEF
  return {
    sumTOV, sumFW, sumGOV, sumGSV, avgAPI, avgTemp,
    rho15d, rho15m, m3at15, m3at60, mtVac, mtAir, lt, gallons, gsvVEF, allOK
  };
}

// ─── Shore computation ────────────────────────────────────────────────────
function computeShoreRow(meas) {
  const tov   = p(meas.tov);
  const fwVol = p(meas.fwVol) ?? 0;
  const roof  = p(meas.roofCorr) ?? 0;
  const gov   = tov !== null ? tov - fwVol + roof : null;
  const api   = p(meas.api);
  const temp  = p(meas.temp);
  const vcf   = meas.vcfOverride !== "" ? p(meas.vcfOverride) : calcVCF(api, temp, state.table);
  const gsv   = (gov !== null && vcf !== null) ? gov * vcf : null;
  const thExp = api ? thermalExp(api, state.table) : null;
  return { tov, fwVol, roof, gov, api, temp, vcf, gsv, thExp };
}

function computeShoreTotals() {
  let sumGSV=0, sumGOV=0, sumTOV=0, allOK=true;
  for (const tank of state.shore.tanks) {
    const o = computeShoreRow(tank.open);
    const c = computeShoreRow(tank.close);
    if (o.gsv !== null && c.gsv !== null) sumGSV += (c.gsv - o.gsv);
    else allOK = false;
    if (o.gov !== null && c.gov !== null) sumGOV += (c.gov - o.gov);
    if (o.tov !== null && c.tov !== null) sumTOV += (c.tov - o.tov);
  }
  const densityLab = p(state.shore.densityLab) ?? 0;
  const bswPct     = p(state.shore.bswPct) ?? 0;
  const bswVol     = sumGSV * bswPct / 100;
  const nsv        = sumGSV - bswVol;
  const mtGross    = sumGSV * densityLab;
  const mtNet      = nsv   * densityLab;
  const ltGross    = mtGross / MT_TO_LT;
  const ltNet      = mtNet   / MT_TO_LT;
  return { sumGSV, sumGOV, sumTOV, bswVol, nsv, mtGross, mtNet, ltGross, ltNet, allOK };
}

// ─── Render ───────────────────────────────────────────────────────────────
function renderHeader() {
  const f = id => document.getElementById(id);
  const s = state;
  ["ref","customer","vessel","port","product","table","voyage",
   "dateFrom","dateTo","inspector","vesselRep","terminalRep"].forEach(k => {
    const el = f("hdr_"+k);
    if (el) el.value = s[k] ?? "";
  });
}

function renderSection(sectionKey) {
  const section = state[sectionKey];
  const prefix  = sectionKey === "before" ? "b" : "a";
  const tbody   = document.getElementById(prefix+"_tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  section.tanks.forEach((tank, i) => {
    const r  = computeRow(tank);
    const tr = document.createElement("tr");
    tr.dataset.i = i;
    tr.dataset.section = sectionKey;

    const govDisplay  = r.gov  !== null ? fmtN(r.gov, 2) : "";
    const gsvDisplay  = r.gsv  !== null ? fmtN(r.gsv, 2) : "";
    const vcfDisplay  = r.vcf  !== null ? fmtN(r.vcf, 5) : "";
    const thExpDisplay = r.thExp !== null ? fmtN(r.thExp, 7) : "";

    tr.innerHTML = `
      <td class="td-name"><input class="cell-input name-input" value="${tank.name}" data-field="name" /></td>
      <td><input class="cell-input num-input" type="number" step="0.001" value="${tank.ullage}"    data-field="ullage"    /></td>
      <td><input class="cell-input num-input" type="number" step="0.001" value="${tank.ullageCorr}"data-field="ullageCorr"/></td>
      <td><input class="cell-input num-input" type="number" step="0.001" value="${tank.tov}"       data-field="tov"       /></td>
      <td><input class="cell-input num-input" type="number" step="0.001" value="${tank.fwInnage}"  data-field="fwInnage"  /></td>
      <td><input class="cell-input num-input" type="number" step="0.001" value="${tank.fwVol}"     data-field="fwVol"     /></td>
      <td class="td-calc">
        <input class="cell-input num-input gov-input" type="number" step="0.01"
          value="${tank.govAuto === false ? tank.gov : (r.gov !== null ? r.gov.toFixed(2) : "")}"
          data-field="gov" title="Auto desde TOV-FW. Editar para sobreescribir." />
        <button class="gov-lock ${tank.govAuto === false ? "locked" : ""}" data-i="${i}" data-section="${sectionKey}" title="Bloquear valor manual">
          ${tank.govAuto === false ? "✎" : "⟳"}
        </button>
      </td>
      <td><input class="cell-input num-input" type="number" step="0.1"   value="${tank.api}"       data-field="api"       /></td>
      <td><input class="cell-input num-input" type="number" step="0.1"   value="${tank.temp}"      data-field="temp"      /></td>
      <td class="td-readonly">${thExpDisplay}</td>
      <td class="td-readonly vcf-cell">
        <span>${vcfDisplay}</span>
        <input class="cell-input vcf-override" type="number" step="0.00001"
          value="${tank.vcfOverride}" placeholder="sobreesc."
          data-field="vcfOverride" title="Dejar vacío para VCF automático"/>
      </td>
      <td class="td-readonly gsv-cell">${gsvDisplay}</td>
    `;
    tbody.appendChild(tr);
  });

  // Totals row
  const tot = computeTotals(section);
  const ttr = document.createElement("tr");
  ttr.className = "totals-row";
  ttr.innerHTML = `
    <td class="td-name"><strong>TOTALES</strong></td>
    <td></td><td></td>
    <td><strong>${fmtN(tot.sumTOV, 3)}</strong></td>
    <td></td>
    <td><strong>${fmtN(tot.sumFW, 3)}</strong></td>
    <td><strong>${fmtN(tot.sumGOV, 2)}</strong></td>
    <td>${tot.avgAPI ? fmtN(tot.avgAPI, 1) : ""}</td>
    <td>${tot.avgTemp ? fmtN(tot.avgTemp, 1) : ""}</td>
    <td></td>
    <td></td>
    <td><strong>${fmtN(tot.sumGSV, 2)}</strong></td>
  `;
  tbody.appendChild(ttr);

  renderSummary(sectionKey, tot, section);
  attachRowListeners(tbody, sectionKey);
  attachGovLocks(sectionKey);
}

function renderSummary(sectionKey, tot, section) {
  const prefix = sectionKey === "before" ? "b" : "a";
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set(prefix+"_sumTOV",    fmtN(tot.sumTOV, 3));
  set(prefix+"_sumFW",     fmtN(tot.sumFW, 3));
  set(prefix+"_sumGOV",    fmtN(tot.sumGOV, 2));
  set(prefix+"_sumGSV",    fmtN(tot.sumGSV, 2));
  set(prefix+"_density15", tot.rho15d ? fmtN(tot.rho15d, 5) : "—");
  set(prefix+"_api",       tot.avgAPI  ? fmtN(tot.avgAPI, 1) : "—");
  set(prefix+"_mtVac",     fmtN(tot.mtVac, 3));
  set(prefix+"_lt",        fmtN(tot.lt, 3));
  set(prefix+"_bbl",       fmtN(tot.sumGSV, 2));
  set(prefix+"_gallons",   fmtN(tot.gallons, 0));
  set(prefix+"_mtAir",     fmtN(tot.mtAir, 3));
  set(prefix+"_m3at15",    fmtN(tot.m3at15, 3));
  set(prefix+"_m3at60",    fmtN(tot.m3at60, 3));
  set(prefix+"_gsvVEF",    fmtN(tot.gsvVEF, 2));

  // VEF input
  const vefEl = document.getElementById(prefix+"_vef");
  if (vefEl && document.activeElement !== vefEl) vefEl.value = section.vef ?? 1.0;

  // Draft + seals
  ["draftFwd","draftAft","draftTrim","draftList",
   "sealPort","sealStbd","sealObP","sealObS"].forEach(k => {
    const el = document.getElementById(prefix+"_"+k);
    if (el && document.activeElement !== el) el.value = section[k] ?? "";
  });
}

function shMeasHTML(label, meas, r) {
  const govD = r.gov  !== null ? fmtN(r.gov,  3) : "";
  const vcfD = r.vcf  !== null ? fmtN(r.vcf,  5) : "";
  const gsvD = r.gsv  !== null ? fmtN(r.gsv,  3) : "";
  const thD  = r.thExp !== null ? fmtN(r.thExp, 7) : "";
  return `
    <td class="type-cell">${label}</td>
    <td><input class="cell-input num-input" type="number" step="0.001" value="${meas.gauge}"    data-field="gauge"/></td>
    <td><input class="cell-input" type="text" value="${meas.date}"    data-field="date"    style="width:82px"/></td>
    <td><input class="cell-input" type="text" value="${meas.time}"    data-field="time"    style="width:46px"/></td>
    <td><input class="cell-input num-input" type="number" step="0.001" value="${meas.tov}"     data-field="tov"/></td>
    <td><input class="cell-input num-input" type="number" step="0.001" value="${meas.fwDip}"   data-field="fwDip"/></td>
    <td><input class="cell-input num-input" type="number" step="0.001" value="${meas.fwVol}"   data-field="fwVol"/></td>
    <td><input class="cell-input num-input" type="number" step="0.001" value="${meas.roofCorr}" data-field="roofCorr"/></td>
    <td class="td-readonly">${govD}</td>
    <td><input class="cell-input num-input" type="number" step="0.1"   value="${meas.temp}"    data-field="temp"/></td>
    <td><input class="cell-input num-input" type="number" step="0.1"   value="${meas.api}"     data-field="api"/></td>
    <td class="td-readonly">${thD}</td>
    <td class="td-readonly">${vcfD}</td>
    <td class="td-readonly gsv-cell">${gsvD}</td>`;
}

function renderShore() {
  const shore = state.shore;
  const tbody = document.getElementById("sh_tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  shore.tanks.forEach((tank, i) => {
    const oR = computeShoreRow(tank.open);
    const cR = computeShoreRow(tank.close);
    const dTov  = (oR.tov !== null && cR.tov !== null) ? cR.tov - oR.tov : null;
    const dFwVol = cR.fwVol - oR.fwVol;
    const dGov  = (oR.gov !== null && cR.gov !== null) ? cR.gov - oR.gov : null;
    const dGsv  = (oR.gsv !== null && cR.gsv !== null) ? cR.gsv - oR.gsv : null;

    // OPEN row
    const openTr = document.createElement("tr");
    openTr.className = "shore-open";
    openTr.dataset.i = i; openTr.dataset.meas = "open";
    openTr.innerHTML = shMeasHTML("OPEN", tank.open, oR);
    const nameTd = document.createElement("td");
    nameTd.className = "td-name"; nameTd.rowSpan = 3;
    nameTd.innerHTML = `<input class="cell-input name-input" value="${tank.name}" data-field="name" data-i="${i}"/>`;
    openTr.insertBefore(nameTd, openTr.firstChild);
    tbody.appendChild(openTr);

    // CLOSE row
    const closeTr = document.createElement("tr");
    closeTr.className = "shore-close";
    closeTr.dataset.i = i; closeTr.dataset.meas = "close";
    closeTr.innerHTML = shMeasHTML("CLOSE", tank.close, cR);
    tbody.appendChild(closeTr);

    // DELTA row
    const deltaTr = document.createElement("tr");
    deltaTr.className = "shore-delta";
    deltaTr.innerHTML = `
      <td class="type-cell">Δ</td>
      <td></td><td></td><td></td>
      <td class="td-readonly">${dTov !== null ? fmtN(dTov, 3) : ""}</td>
      <td></td>
      <td class="td-readonly">${fmtN(dFwVol, 3)}</td>
      <td></td>
      <td class="td-readonly">${dGov !== null ? fmtN(dGov, 3) : ""}</td>
      <td></td><td></td><td></td><td></td>
      <td class="td-readonly gsv-cell">${dGsv !== null ? fmtN(dGsv, 3) : ""}`;
    tbody.appendChild(deltaTr);

    // Separator between tanks
    if (i < shore.tanks.length - 1) {
      const sep = document.createElement("tr");
      sep.className = "shore-sep";
      sep.innerHTML = `<td colspan="15"></td>`;
      tbody.appendChild(sep);
    }
  });

  // Totals row
  const tot = computeShoreTotals();
  const ttr = document.createElement("tr");
  ttr.className = "totals-row";
  ttr.innerHTML = `
    <td colspan="2" class="td-name"><strong>TOTALES</strong></td>
    <td></td><td></td><td></td>
    <td><strong>${fmtN(tot.sumTOV, 3)}</strong></td>
    <td></td><td></td><td></td>
    <td><strong>${fmtN(tot.sumGOV, 3)}</strong></td>
    <td></td><td></td><td></td><td></td>
    <td><strong>${fmtN(tot.sumGSV, 3)}</strong></td>`;
  tbody.appendChild(ttr);

  renderShoreSummary(tot);
  attachShoreListeners(tbody);

  const si = (id, v) => { const el=document.getElementById(id); if(el && document.activeElement!==el) el.value=v??""};
  si("sh_apiComp", shore.apiComp); si("sh_densityLab", shore.densityLab);
  si("sh_bswPct", shore.bswPct);   si("sh_tapeId", shore.tapeId);
  si("sh_thermId", shore.thermId); si("sh_calTape", shore.calTape);
  si("sh_calTherm", shore.calTherm);
}

function renderShoreSummary(tot) {
  const sh = state.shore;
  const set = (id, v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  set("sh_gsv",           fmtN(tot.sumGSV, 3));
  set("sh_bswVol",        fmtN(tot.bswVol, 3));
  set("sh_nsv",           fmtN(tot.nsv, 3));
  set("sh_apiDisplay",    sh.apiComp     ? fmtN(p(sh.apiComp), 1)     : "—");
  set("sh_densityDisplay",sh.densityLab  ? fmtN(p(sh.densityLab), 5)  : "—");
  set("sh_bswPctDisplay", sh.bswPct      ? fmtN(p(sh.bswPct), 3)      : "—");
  set("sh_mtGross",       fmtN(tot.mtGross, 3));
  set("sh_mtNet",         fmtN(tot.mtNet,   3));
  set("sh_ltGross",       fmtN(tot.ltGross, 3));
  set("sh_ltNet",         fmtN(tot.ltNet,   3));
}

function attachShoreListeners(tbody) {
  tbody.querySelectorAll("input[data-field]").forEach(inp => {
    inp.addEventListener("change", e => {
      const field = e.target.dataset.field;
      const tr    = e.target.closest("tr");
      const i     = parseInt(tr?.dataset.i ?? e.target.dataset.i, 10);
      if (isNaN(i)) return;
      if (field === "name") {
        state.shore.tanks[i].name = e.target.value;
        save(); return;
      }
      const meas = tr?.dataset.meas;
      if (!meas) return;
      state.shore.tanks[i][meas][field] = e.target.value;
      save();
      renderShore();
    });
  });
}

function renderAll() {
  renderHeader();
  renderSection("before");
  renderSection("after");
  renderShore();
  highlightActive();
}

function highlightActive() {
  document.querySelectorAll(".section-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.section === activeSection);
  });
}

// ─── Event listeners ──────────────────────────────────────────────────────
function attachRowListeners(tbody, sectionKey) {
  tbody.querySelectorAll("input[data-field]").forEach(input => {
    input.addEventListener("change", e => {
      const tr    = e.target.closest("tr");
      const i     = parseInt(tr.dataset.i, 10);
      const field = e.target.dataset.field;
      if (isNaN(i)) return;
      state[sectionKey].tanks[i][field] = e.target.value;
      save();
      renderSection(sectionKey);
    });
  });
}

function attachGovLocks(sectionKey) {
  const prefix = sectionKey === "before" ? "b" : "a";
  document.querySelectorAll(`.gov-lock[data-section="${sectionKey}"]`).forEach(btn => {
    btn.addEventListener("click", e => {
      const i = parseInt(btn.dataset.i, 10);
      const tank = state[sectionKey].tanks[i];
      tank.govAuto = !tank.govAuto;
      if (tank.govAuto) tank.gov = ""; // clear manual value
      save();
      renderSection(sectionKey);
    });
  });
}

// Header fields
document.querySelectorAll("[id^='hdr_']").forEach(el => {
  el.addEventListener("change", e => {
    const key = el.id.replace("hdr_", "");
    state[key] = el.value;
    if (key === "table") { save(); renderAll(); return; }
    save();
  });
});

// Section tabs
document.querySelectorAll(".section-tab").forEach(btn => {
  btn.addEventListener("click", e => {
    activeSection = btn.dataset.section;
    highlightActive();
  });
});

// Add tank row
document.querySelectorAll(".btn-add-tank").forEach(btn => {
  btn.addEventListener("click", e => {
    const sectionKey = btn.dataset.section;
    const n = state[sectionKey].tanks.length + 1;
    state[sectionKey].tanks.push({
      name:`Tank ${n}`, ullage:"", ullageCorr:"", tov:"",
      fwInnage:"", fwVol:"", gov:"", govAuto:true, api:"", temp:"", vcfOverride:""
    });
    save();
    renderSection(sectionKey);
  });
});

// Remove last tank row
document.querySelectorAll(".btn-remove-tank").forEach(btn => {
  btn.addEventListener("click", e => {
    const sectionKey = btn.dataset.section;
    if (state[sectionKey].tanks.length > 1) {
      state[sectionKey].tanks.pop();
      save();
      renderSection(sectionKey);
    }
  });
});

// VEF input change
document.querySelectorAll("[id$='_vef']").forEach(el => {
  el.addEventListener("change", e => {
    const sKey = el.id.startsWith("b_") ? "before" : "after";
    state[sKey].vef = parseFloat(el.value) || 1.0;
    save();
    renderSection(sKey);
  });
});

// Draft + seals
["draftFwd","draftAft","draftTrim","draftList",
 "sealPort","sealStbd","sealObP","sealObS"].forEach(field => {
  ["b_","a_"].forEach(prefix => {
    const el = document.getElementById(prefix+field);
    if (!el) return;
    el.addEventListener("change", e => {
      const sKey = prefix === "b_" ? "before" : "after";
      state[sKey][field] = el.value;
      save();
    });
  });
});

// Reset
document.getElementById("btnReset")?.addEventListener("click", () => {
  if (!confirm("Borrar todos los datos de esta operación?")) return;
  state = defaultState();
  save();
  renderAll();
});

// Export JSON
document.getElementById("btnExport")?.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `BT_${state.ref || "operacion"}_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
});

// Import JSON
document.getElementById("btnImport")?.addEventListener("click", () => {
  document.getElementById("fileImport").click();
});
document.getElementById("fileImport")?.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      state = { ...defaultState(), ...JSON.parse(ev.target.result) };
      save();
      renderAll();
    } catch { alert("Archivo JSON inválido."); }
  };
  reader.readAsText(file);
  e.target.value = "";
});

// Print
document.getElementById("btnPrint")?.addEventListener("click", () => window.print());

// Fill API/Temp to all tanks in section (bulk fill)
document.querySelectorAll(".btn-fill-api").forEach(btn => {
  btn.addEventListener("click", e => {
    const sKey   = btn.dataset.section;
    const prefix = sKey === "before" ? "b" : "a";
    const api  = parseFloat(document.getElementById(prefix+"_bulk_api")?.value);
    const temp = parseFloat(document.getElementById(prefix+"_bulk_temp")?.value);
    if (!isNaN(api))  state[sKey].tanks.forEach(t => t.api  = api.toString());
    if (!isNaN(temp)) state[sKey].tanks.forEach(t => t.temp = temp.toString());
    save();
    renderSection(sKey);
  });
});

// ─── Shore config listeners ───────────────────────────────────────────────
["sh_apiComp","sh_densityLab","sh_bswPct","sh_tapeId","sh_thermId","sh_calTape","sh_calTherm"].forEach(id => {
  const key = id.replace("sh_","");
  document.getElementById(id)?.addEventListener("change", e => {
    state.shore[key] = e.target.value;
    save(); renderShore();
  });
});
document.getElementById("btnAddShoreTank")?.addEventListener("click", () => {
  const n = state.shore.tanks.length + 1;
  const bm = () => ({gauge:"",date:"",time:"",tov:"",fwDip:"",fwVol:"",roofCorr:"",api:"",temp:"",vcfOverride:""});
  state.shore.tanks.push({ name:`Tank ${n}`, open:bm(), close:bm() });
  save(); renderShore();
});
document.getElementById("btnRemShoreTank")?.addEventListener("click", () => {
  if (state.shore.tanks.length > 1) { state.shore.tanks.pop(); save(); renderShore(); }
});

// ─── Access gate ─────────────────────────────────────────────────────────
async function sha256(val) {
  const data = new TextEncoder().encode(val);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,"0")).join("");
}
function unlock() {
  sessionStorage.setItem(ACCESS_KEY, "ok");
  document.body.classList.remove("locked");
}
document.querySelector("#accessForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const inp = document.querySelector("#accessPassword");
  const err = document.querySelector("#accessError");
  const h   = await sha256(inp.value);
  if (h === ACCESS_HASH) { unlock(); inp.value = ""; if(err) err.textContent=""; return; }
  if (err) err.textContent = "Clave incorrecta.";
  inp.select();
});
if (sessionStorage.getItem(ACCESS_KEY) === "ok") unlock();

// ─── Init ─────────────────────────────────────────────────────────────────
renderAll();
