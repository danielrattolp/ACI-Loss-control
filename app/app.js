// ===== CONSTANTS =====
const COUNTRY_PREFIXES = {
  CL: { code: 'ACICH',  label: 'Chile' },
  CO: { code: 'ACICO',  label: 'Colombia' },
  EC: { code: 'ACIEC',  label: 'Ecuador' },
  PE: { code: 'ACIPE',  label: 'Perú' },
  CB: { code: 'ACICA',  label: 'Caribe' },
  US: { code: 'ACIUSA', label: 'Estados Unidos' },
};

const OP_TYPES = {
  'vef': {
    label: 'Buque con VEF',
    icon: '🛢️',
    desc: 'Medición a bordo con cálculo de VEF y ullage inicial.',
    modules: ['origen', 'key-meeting', 'ullage-inicial', 'vef', 'time-log', 'checklist-inspeccion', 'summary'],
  },
  'alije': {
    label: 'Alije (STS)',
    icon: '⚓',
    desc: 'Transferencia ship-to-ship con buque madre y alijadores.',
    modules: ['origen', 'key-meeting', 'ullage-inicial', 'ullage-final', 'time-log', 'vef', 'discharge-record', 'slops', 'checklist-madre', 'checklist-alijador', 'summary'],
  },
  'terminal': {
    label: 'Descarga a Terminal',
    icon: '🏭',
    desc: 'Descarga desde buque a instalaciones en tierra.',
    modules: ['origen', 'key-meeting', 'ullage-inicial', 'ullage-final', 'time-log', 'vef', 'discharge-record', 'slops', 'checklist-buque', 'checklist-terminal', 'summary'],
  },
};

const MODULE_META = {
  'origen':               { label: 'Datos Origen',       icon: '📦' },
  'key-meeting':          { label: 'Key Meeting',        icon: '🤝' },
  'ullage-inicial':       { label: 'Ullage Inicial',     icon: '📐' },
  'ullage-final':         { label: 'Ullage Final',       icon: '📏' },
  'vef':                  { label: 'VEF',                icon: '⚖️' },
  'time-log':             { label: 'Time Log',           icon: '⏱️' },
  'discharge-record':     { label: 'Discharge Record',   icon: '📋' },
  'slops':                { label: 'Slops',              icon: '🪣' },
  'checklist-inspeccion': { label: 'Checklist Inspector',icon: '✅' },
  'checklist-madre':      { label: 'Checklist B. Madre', icon: '✅' },
  'checklist-alijador':   { label: 'Checklist Alijador', icon: '✅' },
  'checklist-buque':      { label: 'Checklist Buque',    icon: '✅' },
  'checklist-terminal':   { label: 'Checklist Terminal', icon: '✅' },
  'summary':              { label: 'Summary',            icon: '📊' },
};

const TANK_NAMES = ['1P','1S','2P','2S','3P','3S','4P','4S','5P','5S','SLP','SLS','WBP','WBS'];

const PRODUCTS = [
  { id: 'crude', label: 'Crudo (Crude Oil)', hasCrudeName: true },
  { id: 'fuel-oil', label: 'Fuel Oil' },
  { id: 'diesel', label: 'Diesel / Gas Oil' },
  { id: 'nafta', label: 'Nafta / Gasolina' },
  { id: 'jet', label: 'Jet / Queroseno' },
  { id: 'lpg', label: 'GLP / LPG' },
  { id: 'lubricants', label: 'Lubricantes' },
  { id: 'other', label: 'Otro' },
];

// ===== CHECKLISTS DATA =====
const CHECKLIST_VESSEL = [
  { section: 'Documentación y Certificados', items: [
    'Certificados del buque vigentes (IOPP, Load Line, Safety)',
    'Manual de Calibración de Tanques (ullage tables) a bordo',
    'Certificado de calibración del equipo de medición (cinta/UTI)',
    'Certificados de calibración de termómetros',
    'Procedimientos de medición y muestreo disponibles',
    'Plan de estiba (stowage plan) actualizado',
  ]},
  { section: 'Equipos de Medición', items: [
    'Equipo UTI/cinta ullage en buenas condiciones y calibrado',
    'Termómetros calibrados disponibles para todos los tanques',
    'Detector de gas operativo',
    'Medidor de densidad / hidrómetro disponible',
    'Tubería de muestreo limpia y operativa',
    'Recipientes de muestreo limpios y sellados',
  ]},
  { section: 'Estado de Tanques de Carga', items: [
    'Registros de tanques vacíos o pre-cargados verificados',
    'Free water medida y documentada en todos los tanques',
    'Válvulas de tanques en posición correcta',
    'Tapas de boca de hombre aseguradas (no relevantes a la operación)',
    'Sistema de alarmas de nivel operativo',
    'Trim y escora del buque registrados y aceptables',
  ]},
  { section: 'Manifolds y Sistema de Bombeo', items: [
    'Manifold limpio, sin contaminación residual',
    'Conexión ISGOTT asegurada y sin fugas',
    'Válvulas de manifold en posición operativa verificada',
    'Sistema de bombas de carga verificado',
    'Bomba de stripping operativa',
    'Líneas de vapor disponibles (si aplica)',
  ]},
  { section: 'Seguridad y Comunicaciones', items: [
    'MSDS del producto a bordo',
    'Sistema de detección de gas en manifold operativo',
    'Comunicación canal VHF establecida con terminal/alijador',
    'Carta de acuerdo de operación firmada (ISGOTT checklist)',
    'Personal de guardia en manifold durante la operación',
    'Linea de emergencia de parada (ESD) verificada',
  ]},
];

const CHECKLIST_TERMINAL = [
  { section: 'Documentación de Tierra', items: [
    'Tablas de calibración de tanques de tierra disponibles y vigentes',
    'Certificados de medidores de flujo actualizados',
    'Certificado de calibración de equipos de medición',
    'Procedimiento de recepción de la terminal disponible',
    'Autorización de recepción de producto emitida',
  ]},
  { section: 'Medición de Tanques en Tierra', items: [
    'Medición antes de inicio (opening gauge) documentada',
    'Temperatura del producto en tanques registrada',
    'Free water en tanques de recepción verificada',
    'Nivel de tanques dentro de capacidad de recepción',
    'Calibración de referencia verificada (reference gauge)',
    'Techo flotante en posición correcta (si aplica)',
  ]},
  { section: 'Equipos y Sistemas de Tierra', items: [
    'Brazos de carga / mangueras inspeccionadas sin daños',
    'Medidores de flujo en línea calibrados',
    'Sistema de válvulas de tierra verificado',
    'Bombas de recepción operativas',
    'Sistema anti-mezcla verificado (si aplica)',
    'Drenaje y bunding en área de manifold inspeccionado',
  ]},
  { section: 'Seguridad', items: [
    'Permiso de trabajo en caliente (si aplica)',
    'Puesta a tierra del buque verificada',
    'Extintores disponibles en área de operación',
    'Sistema contra incendio de terminal operativo',
    'Salidas de emergencia despejadas',
    'Canal de comunicación con sala de control establecido',
  ]},
];

const CHECKLIST_LIGHTER = [
  { section: 'Documentación del Alijador', items: [
    'Certificados del buque alijador vigentes',
    'Manual de calibración de tanques del alijador disponible',
    'Equipos de medición calibrados a bordo del alijador',
    'Plan de estiba del alijador actualizado',
    'ISPS Code — acceso controlado verificado',
  ]},
  { section: 'Compatibilidad de Operación STS', items: [
    'Distancia mínima de seguridad entre buques acordada',
    'Fenders (defensas) en número y condición adecuados',
    'Amarras de STS correctamente colocadas',
    'Conexión de manguera STS inspeccionada y sin fugas',
    'Comunicación entre buques establecida (VHF)',
    'Checklists ISGOTT de amarre STS completadas por ambas partes',
  ]},
  { section: 'Tanques del Alijador', items: [
    'Medición de ullage en tanques vacíos antes del inicio',
    'Free water verificada en tanques del alijador',
    'Trim y escora del alijador dentro de parámetros',
    'Capacidad disponible verificada vs. carga a transferir',
  ]},
  { section: 'Seguridad STS', items: [
    'Guardias en ambos manifolds durante la operación',
    'Sistema de parada de emergencia coordinado entre buques',
    'Luces de posición y señales nocturnas verificadas (si noche)',
    'Condiciones meteorológicas evaluadas (viento, swell)',
    'Capitán de guardia en puente del buque madre',
  ]},
];

// ===== STATE =====
let state = {
  view: 'home',
  currentOpId: null,
  currentModule: null,
  currentAlijoIdx: 0,
  modal: null,
  modalStep: 1,
  modalData: {},
};

// ===== STORAGE =====
function loadOps() {
  try { return JSON.parse(localStorage.getItem('aci_ops') || '[]'); } catch { return []; }
}
function saveOps(ops) {
  localStorage.setItem('aci_ops', JSON.stringify(ops));
}
function loadCounters() {
  try { return JSON.parse(localStorage.getItem('aci_counters') || '{}'); } catch { return {}; }
}
function saveCounters(c) {
  localStorage.setItem('aci_counters', JSON.stringify(c));
}
function nextCode(countryKey) {
  const counters = loadCounters();
  const prefix = COUNTRY_PREFIXES[countryKey].code;
  counters[countryKey] = (counters[countryKey] || 0) + 1;
  saveCounters(counters);
  return `${prefix}-${String(counters[countryKey]).padStart(3, '0')}`;
}
function getOp(id) { return loadOps().find(o => o.id === id); }
function saveOp(op) {
  const ops = loadOps();
  const idx = ops.findIndex(o => o.id === op.id);
  if (idx >= 0) ops[idx] = op; else ops.unshift(op);
  saveOps(ops);
}
function newOpId() { return 'op_' + Date.now() + '_' + Math.random().toString(36).slice(2,7); }

function initModuleData(type) {
  const tanks = TANK_NAMES.map(n => ({ name: n, ullage: '', tcf: '', tov: '', temp: '', api: '', bsw: '', fw: '', gov: '', gsv: '' }));
  const emptyQty = () => ({ tov:'', gov:'', gsv60F:'', m3_15:'', m3_20:'', bbl:'', tmVac:'', tmAir:'', longTons:'', shortTons:'', gallons:'', api:'', bsw:'', temp:'', vcf:'' });
  return {
    'origen': {
      loadPort: '', loadTerminal: '', loadBerth: '', loadDate: '',
      blNumber: '', blDate: '', blRef: '',
      bl: emptyQty(),
      shore: { ...emptyQty(), vef: '', tankDetails: '', notes: '' },
      shipFigureOrigin: { ...emptyQty(), vef: '', notes: '' },
      notes: '',
    },
    'key-meeting':    { date: '', time: '', location: '', attendees: [], topics: [], notes: '', decisions: '' },
    'ullage-inicial': { tanks: JSON.parse(JSON.stringify(tanks)), trim: '', list: '', notes: '', avgTemp:'', avgApi:'', avgBsw:'' },
    'ullage-final':   { tanks: JSON.parse(JSON.stringify(tanks)), trim: '', list: '', notes: '', avgTemp:'', avgApi:'', avgBsw:'' },
    'vef':            { shoreGSV: '', vesselGSV: '', vef: '', notes: '', voyages: [] },
    'time-log':       { events: [], pumpRate: '', startTime: '', hoses: 1, notes: '' },
    'discharge-record': { bl: { qty: '', api: '', bsw: '', temp: '' }, pumpLog: [], notes: '' },
    'slops': { before: { tanks: [] }, after: { tanks: [] }, notes: '' },
    'checklist-inspeccion': { items: makeChecklistData(CHECKLIST_VESSEL), inspector: '', date: '', signature: '' },
    'checklist-madre':      { items: makeChecklistData(CHECKLIST_VESSEL), inspector: '', date: '', signature: '' },
    'checklist-alijador':   { items: makeChecklistData(CHECKLIST_LIGHTER), inspector: '', date: '', signature: '' },
    'checklist-buque':      { items: makeChecklistData(CHECKLIST_VESSEL), inspector: '', date: '', signature: '' },
    'checklist-terminal':   { items: makeChecklistData(CHECKLIST_TERMINAL), inspector: '', date: '', signature: '' },
    'summary': { notes: '' },
  };
}

function makeChecklistData(template) {
  return template.map(sec => ({
    section: sec.section,
    items: sec.items.map(text => ({ text, val: '', comment: '' })),
  }));
}

function initAlijo() {
  return {
    id: newOpId(),
    vessel: { name: '', imo: '' },
    modules: initModuleData('alije'),
  };
}

// ===== CALCULATIONS =====

// VCF (API MPMS 11.1 Table 6A — Crude Oil)
// refC: reference temperature in °C (15 = 15°C, 15.556 = 60°F, 20 = 20°C)
function vcfCalc(api, tempC, refC = 15.556) {
  if (!api || !tempC) return 1;
  const rho15 = 141.5 / (api + 131.5) * 999.016;
  const alpha = 613.9723 / (rho15 * rho15);
  const dT = (tempC - refC) * 1.8;  // Δ°C to Δ°F
  return Math.exp(-alpha * dT * (1 + 0.8 * alpha * dT));
}

// Density at 15°C from API gravity (kg/m³)
function apiToDensity15(api) {
  if (!api) return 0;
  return 141.5 / (api + 131.5) * 999.016;
}

// Full quantity summary from GOV, avg temp, API, BS&W
function calcAllQuantities(govM3, avgTempC, api60, bswPct) {
  if (!govM3 || govM3 <= 0 || !api60 || !avgTempC) return null;

  const vcf60F  = vcfCalc(api60, avgTempC, 15.556);  // to 60°F
  const vcf15C  = vcfCalc(api60, avgTempC, 15.0);    // to 15°C
  const vcf20C  = vcfCalc(api60, avgTempC, 20.0);    // to 20°C

  const gsv60F  = govM3 * vcf60F;   // m³ @ 60°F (15.556°C)
  const gsv15C  = govM3 * vcf15C;   // m³ @ 15°C
  const gsv20C  = govM3 * vcf20C;   // m³ @ 20°C

  const bswFrac = (bswPct || 0) / 100;
  const nsv60F  = gsv60F * (1 - bswFrac);
  const nsv15C  = gsv15C * (1 - bswFrac);

  const bbl60F  = gsv60F * 6.289811;  // 1 m³ = 6.289811 BBL
  const gallons = bbl60F * 42;         // 42 gal/bbl

  const rho15   = apiToDensity15(api60);  // kg/m³
  const tmVac   = nsv15C * rho15 / 1000;  // MT vacuum
  const tmAir   = tmVac - 0.0011 * nsv15C;  // buoyancy correction
  const longTons = tmAir / 1.016047;
  const shortTons = tmAir / 0.90718474;

  const vcf60F_val = vcf60F.toFixed(7);
  const ctpl       = vcf60F_val;  // simplified: CPL ≈ 1 for gas-free crude

  return { gsv60F, gsv15C, gsv20C, nsv60F, nsv15C, bbl60F, gallons,
           rho15, tmVac, tmAir, longTons, shortTons,
           vcf60F, vcf15C, vcf20C, ctpl };
}

function calcGSV(tov, api, temp, bsw) {
  if (!tov || !api || !temp) return '';
  const vcf = vcfCalc(parseFloat(api), parseFloat(temp), 15.556);
  const gov = parseFloat(tov) * (1 - parseFloat(bsw || 0) / 100);
  return (gov * vcf).toFixed(3);
}
function calcVEF(shore, vessel) {
  if (!shore || !vessel || parseFloat(vessel) === 0) return '';
  return (parseFloat(shore) / parseFloat(vessel)).toFixed(4);
}
function ullageTotal(tanks, field) {
  return tanks.reduce((s, t) => s + (parseFloat(t[field]) || 0), 0);
}
function fmt(n, dec = 3) { return n != null && !isNaN(n) ? n.toLocaleString('es', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : '—'; }
function fmt6(n) { return fmt(n, 6); }

// ===== RENDER ENGINE =====
function render() {
  const app = document.getElementById('app');
  app.innerHTML = buildLayout();
}

function buildLayout() {
  const ops = loadOps();
  const op = state.currentOpId ? getOp(state.currentOpId) : null;
  return `
    <div class="topbar">
      <span class="topbar-logo" style="cursor:pointer" data-action="go-home">ACI<span> Loss Control</span></span>
      <span class="topbar-tagline">Sistema Operacional</span>
      <div class="topbar-spacer"></div>
      <button class="topbar-btn" data-action="open-new-op">+ Nueva Operación</button>
    </div>
    <div class="layout">
      ${buildSidebar(ops, op)}
      <div class="main">
        ${state.view === 'consultor' ? buildConsultorView() : state.view === 'home' ? buildHome(ops) : op ? buildOpDetail(op) : buildHome(ops)}
      </div>
    </div>
    ${state.modal ? buildModal() : ''}
  `;
}

function buildSidebar(ops, currentOp) {
  return `
    <div class="sidebar">
      <div style="padding:12px 10px 4px">
        <div class="sidebar-item ${state.view==='consultor'?'active':''}" data-action="open-consultor">
          <span class="icon">🤖</span> Consultor IA
        </div>
        <div class="sidebar-item ${state.view==='home'&&!currentOp?'active':''}" data-action="go-home">
          <span class="icon">🏠</span> Operaciones
        </div>
      </div>
      <div class="sidebar-section" style="margin-top:8px">Recientes</div>
      <div class="sidebar-ops">
        ${ops.length === 0 ? '<div style="padding:16px;font-size:12px;color:var(--muted);text-align:center">Sin operaciones</div>' : ''}
        ${ops.map(op => `
          <div class="sidebar-op-item ${currentOp && currentOp.id === op.id ? 'active' : ''}" data-action="open-op" data-id="${op.id}">
            <div class="sidebar-op-code">${op.code}</div>
            <div class="sidebar-op-vessel">${op.vessel.name || '—'}</div>
            <div class="sidebar-op-type">${OP_TYPES[op.type]?.label || ''}</div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

// ===== CONSULTOR IA =====
function buildConsultorView() {
  const msgs = state.chatHistory || [];
  const isLoading = state.chatLoading;
  return `
    <div style="display:flex;flex-direction:column;height:100%;max-height:calc(100vh - 54px)">
      <div style="padding:24px 28px 0;flex-shrink:0">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
          <div style="background:var(--amber);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🤖</div>
          <div>
            <div style="font-size:18px;font-weight:700;color:var(--ink)">Consultor IA — ACI Loss Control</div>
            <div style="font-size:12px;color:var(--muted)">Asistente especializado en control de pérdidas, API MPMS, VEF y operaciones petroleras</div>
          </div>
          <div style="margin-left:auto">
            <button class="btn btn-secondary btn-sm" data-action="chat-clear">Limpiar chat</button>
          </div>
        </div>
        <hr class="divider" style="margin-top:16px;margin-bottom:0">
      </div>

      <div id="chat-messages" style="flex:1;overflow-y:auto;padding:20px 28px;display:flex;flex-direction:column;gap:14px">
        ${msgs.length === 0 ? `
          <div style="margin:auto;text-align:center;max-width:420px;opacity:.7">
            <div style="font-size:40px;margin-bottom:12px">🛢️</div>
            <div style="font-size:14px;font-weight:600;color:var(--ink);margin-bottom:6px">Consultor especializado en operaciones</div>
            <div style="font-size:12px;color:var(--muted);line-height:1.6">
              Haz preguntas sobre control de pérdidas, cálculos de VEF, API MPMS, reconciliación de figuras,
              ullage, operaciones STS, normativas ISGOTT y cualquier aspecto técnico de la industria petrolera.
            </div>
            <div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
              ${[
                '¿Cómo se calcula el VEF?',
                '¿Qué es el ullage y cómo se mide?',
                '¿Criterios de varianza aceptable?',
                '¿Procedimiento operación STS?',
              ].map(q => `<button class="btn btn-secondary btn-sm" data-action="chat-suggest" data-q="${q}">${q}</button>`).join('')}
            </div>
          </div>
        ` : msgs.map(m => buildChatMsg(m)).join('')}
        ${isLoading ? `
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div style="background:var(--amber);width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">🤖</div>
            <div style="background:var(--white);border:1px solid var(--line);border-radius:0 var(--rmd) var(--rmd) var(--rmd);padding:10px 14px">
              <div class="chat-typing"><span></span><span></span><span></span></div>
            </div>
          </div>` : ''}
      </div>

      <div style="padding:14px 28px 20px;flex-shrink:0;border-top:1px solid var(--line2);background:var(--white)">
        <div style="display:flex;gap:10px;align-items:flex-end">
          <textarea id="chat-input" class="field-textarea"
            style="flex:1;min-height:44px;max-height:120px;resize:none;font-size:13px"
            placeholder="Escribe tu consulta sobre operaciones petroleras…"
            ${isLoading ? 'disabled' : ''}></textarea>
          <button class="btn btn-primary" data-action="chat-send" style="height:44px;padding:0 20px" ${isLoading ? 'disabled' : ''}>
            ${isLoading ? '…' : 'Enviar ↵'}
          </button>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:6px">
          Requiere Flask en localhost:5000 con <code>ANTHROPIC_API_KEY</code> configurada.
          &nbsp;·&nbsp; Presiona Enter para enviar, Shift+Enter para nueva línea.
        </div>
      </div>
    </div>`;
}

function buildChatMsg(m) {
  const isUser = m.role === 'user';
  return `
    <div style="display:flex;gap:10px;align-items:flex-start;${isUser?'flex-direction:row-reverse':''}">
      <div style="background:${isUser?'var(--sea)':'var(--amber)'};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;color:white;font-weight:700">
        ${isUser ? '👤' : '🤖'}
      </div>
      <div style="max-width:78%;background:${isUser?'var(--sea)':'var(--white)'};color:${isUser?'white':'var(--ink)'};border:1px solid ${isUser?'var(--sea)':'var(--line)'};border-radius:${isUser?'var(--rmd) 0':'0 var(--rmd)'} var(--rmd) var(--rmd);padding:10px 14px;font-size:13px;line-height:1.6;white-space:pre-wrap">${escHtml(m.content)}</div>
    </div>`;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function serializeOpForAI(op) {
  if (!op) return null;
  const mods = op.modules || {};
  const origen = mods['origen'] || {};
  const ullI   = mods['ullage-inicial'] || {};
  const ullF   = mods['ullage-final']   || {};
  const vefMod = mods['vef'] || {};

  const blGSV    = parseFloat(origen.bl?.gsv60F || 0);
  const shoreGSV = parseFloat(origen.shore?.gsv60F || 0);
  const shipGSV  = parseFloat(origen.shipFigureOrigin?.gsv60F || 0);

  const pct = (a, b) => (a > 0 && b > 0) ? ((a - b) / b * 100).toFixed(4) + '%' : 'N/D';

  return {
    codigo: op.code, tipo: op.type, buque: op.vessel, viaje: op.voyage,
    imo: op.imo, producto: op.product, crudo: op.crudeName,
    puerto: op.port, terminal: op.terminal,
    clientes: (op.clients || []).map(c => c.name).join(', '),
    origen: {
      puertoOrigen: origen.loadPort, terminalOrigen: origen.loadTerminal,
      fechaCarga: origen.loadDate, blNum: origen.blNumber,
      api: origen.originApi, tempC: origen.originTemp, bsw: origen.originBsw,
      bl:    { gsv60F: origen.bl?.gsv60F, tmAire: origen.bl?.tmAir, longTons: origen.bl?.longTons, bbl: origen.bl?.bbl },
      tierra:{ gsv60F: origen.shore?.gsv60F, tmAire: origen.shore?.tmAir, vef: origen.shore?.vef },
      buque: { gsv60F: origen.shipFigureOrigin?.gsv60F, tmAire: origen.shipFigureOrigin?.tmAir, vef: origen.shipFigureOrigin?.vef },
    },
    vefDestino: vefMod.vef || 'N/D',
    diferencias: {
      buqueVsTierra: pct(shipGSV, shoreGSV),
      blVsTierra: pct(shoreGSV, blGSV),
      blVsBuque: pct(shipGSV, blGSV),
    },
    ullageInicial: {
      tanques: (ullI.tanks || []).length,
      gov: ullageTotal(ullI.tanks || [], 'gov'),
      gsv: ullageTotal(ullI.tanks || [], 'gsv'),
    },
    ullajeFinale: ullF.tanks ? {
      tanques: (ullF.tanks || []).length,
      gov: ullageTotal(ullF.tanks || [], 'gov'),
      gsv: ullageTotal(ullF.tanks || [], 'gsv'),
    } : null,
    notas: (mods['summary'] || {}).notes || '',
  };
}

function detectOpCodes(text) {
  return [...text.matchAll(/ACI(?:CH|CO|EC|PE|CA|USA)-\d{3,}/gi)].map(m => m[0].toUpperCase());
}

async function chatSend() {
  const input = document.getElementById('chat-input');
  const text = input?.value?.trim();
  if (!text || state.chatLoading) return;

  if (!state.chatHistory) state.chatHistory = [];

  // Inject operation data when the user mentions an operation code
  const codes = detectOpCodes(text);
  let enrichedText = text;
  if (codes.length > 0) {
    const parts = [];
    for (const code of codes) {
      const op = loadOps().find(o => (o.code || '').toUpperCase() === code);
      if (op) {
        parts.push(`\n\n--- DATOS COMPLETOS OPERACIÓN ${code} ---\n${JSON.stringify(serializeOpForAI(op), null, 2)}\n---`);
      } else {
        parts.push(`\n\n[Nota: La operación ${code} no fue encontrada en el sistema.]`);
      }
    }
    enrichedText = text + parts.join('');
  }

  state.chatHistory.push({ role: 'user', content: enrichedText });
  state.chatLoading = true;
  input.value = '';
  render();
  scrollChatToBottom();

  try {
    const res = await fetch('http://localhost:5000/api/consultar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: state.chatHistory }),
    });
    const data = await res.json();
    if (data.reply) {
      state.chatHistory.push({ role: 'assistant', content: data.reply });
    } else {
      state.chatHistory.push({ role: 'assistant', content: '⚠️ ' + (data.error || 'Error desconocido.') });
    }
  } catch (err) {
    state.chatHistory.push({ role: 'assistant', content: '⚠️ No se pudo conectar con el servidor Flask (localhost:5000). Asegúrate de que esté corriendo.' });
  }

  state.chatLoading = false;
  render();
  scrollChatToBottom();
}

function scrollChatToBottom() {
  setTimeout(() => {
    const el = document.getElementById('chat-messages');
    if (el) el.scrollTop = el.scrollHeight;
  }, 50);
}

// ===== HOME =====
function buildHome(ops) {
  if (ops.length === 0) return `
    <div class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-title">No hay operaciones registradas</div>
      <div class="empty-sub">Inicia una nueva operación para comenzar el seguimiento y control de pérdidas.</div>
      <button class="btn btn-primary" data-action="open-new-op">+ Nueva Operación</button>
    </div>`;
  return `
    <div class="home-header">
      <div class="home-title">Operaciones</div>
      <div class="home-sub">${ops.length} operación${ops.length !== 1 ? 'es' : ''} registrada${ops.length !== 1 ? 's' : ''}</div>
    </div>
    <div class="home-actions">
      <button class="btn btn-primary" data-action="open-new-op">+ Nueva Operación</button>
    </div>
    <div class="ops-grid">
      ${ops.map(op => buildOpCard(op)).join('')}
    </div>`;
}

function buildOpCard(op) {
  const t = OP_TYPES[op.type];
  const clients = (op.clients || []).map(c => c.name).filter(Boolean).join(', ') || '—';
  const date = op.createdAt ? new Date(op.createdAt).toLocaleDateString('es', { day:'2-digit', month:'short', year:'numeric' }) : '';
  return `
    <div class="op-card" data-action="open-op" data-id="${op.id}">
      <div class="op-card-header">
        <span class="op-card-code">${op.code}</span>
        <span class="op-card-status status-active">Activa</span>
      </div>
      <div class="op-card-vessel">${op.vessel.name || 'Buque sin nombre'}</div>
      <div class="op-card-meta">Viaje ${op.vessel.voyage || '—'} &nbsp;·&nbsp; IMO ${op.vessel.imo || '—'}</div>
      <div class="op-card-meta" style="margin-top:4px">${clients}</div>
      <div class="op-card-footer">
        <span class="op-type-badge ${op.type === 'vef' ? 'type-vef' : op.type === 'alije' ? 'type-alije' : 'type-terminal'}">${t?.label || op.type}</span>
        <span class="op-card-date">${date}</span>
      </div>
    </div>`;
}

// ===== MODALS =====
function buildModal() {
  if (state.modal === 'new-op-1') return buildModalNewOp1();
  if (state.modal === 'new-op-2') return buildModalNewOp2();
  return '';
}

function buildModalNewOp1() {
  const d = state.modalData;
  const clients = d.clients || [{ name: '', ref: '' }];
  return `
    <div class="overlay" data-action="close-modal-bg">
      <div class="modal modal-lg" data-stop-propagation="true">
        <div class="modal-header">
          <div>
            <div class="modal-step">Paso 1 de 2</div>
            <div class="modal-title">Nueva Operación</div>
            <div class="modal-subtitle">Ingrese los datos generales de la operación</div>
          </div>
          <button class="modal-close" data-action="close-modal">×</button>
        </div>
        <div class="modal-body">
          <div class="progress-steps">
            <div class="progress-step active">1. Datos generales</div>
            <div class="progress-step">2. Tipo de operación</div>
          </div>

          <div class="form-section">
            <div class="form-section-title">Identificación</div>
            <div class="form-row form-row-3">
              <div class="field">
                <label class="field-label">País <span class="req">*</span></label>
                <select class="field-select" id="f-country">
                  <option value="">— Seleccionar —</option>
                  ${Object.entries(COUNTRY_PREFIXES).map(([k,v]) => `<option value="${k}" ${d.country===k?'selected':''}>${v.label} (${v.code})</option>`).join('')}
                </select>
              </div>
              <div class="field">
                <label class="field-label">Código operación</label>
                <input class="field-input" id="f-opcode" placeholder="Auto-generado" readonly style="background:var(--line2);color:var(--muted)" value="${d.code||''}">
              </div>
              <div class="field">
                <label class="field-label">Empresa de inspección auditada <span class="req">*</span></label>
                <input class="field-input" id="f-inscomp" placeholder="Ej: SGS, Bureau Veritas..." value="${d.inspectionCompany||''}">
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">Buque</div>
            <div class="form-row form-row-3">
              <div class="field">
                <label class="field-label">Nombre del buque <span class="req">*</span></label>
                <input class="field-input" id="f-vessel" placeholder="Nombre del buque" value="${d.vesselName||''}">
              </div>
              <div class="field">
                <label class="field-label">Número de viaje</label>
                <input class="field-input" id="f-voyage" placeholder="Ej: V-001" value="${d.voyage||''}">
              </div>
              <div class="field">
                <label class="field-label">IMO</label>
                <input class="field-input" id="f-imo" placeholder="Ej: 9876543" value="${d.imo||''}">
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">Producto</div>
            <div class="form-row">
              <div class="field">
                <label class="field-label">Tipo de producto <span class="req">*</span></label>
                <select class="field-select" id="f-product" onchange="onProductChange()">
                  <option value="">— Seleccionar —</option>
                  ${PRODUCTS.map(p => `<option value="${p.id}" ${d.product===p.id?'selected':''}>${p.label}</option>`).join('')}
                </select>
              </div>
              <div class="field" id="crude-name-field" style="${d.product==='crude'?'':'display:none'}">
                <label class="field-label">Nombre del crudo</label>
                <input class="field-input" id="f-crude-name" placeholder="Ej: Vasconia Blend, Napo..." value="${d.crudeName||''}">
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">Puerto y Terminal</div>
            <div class="form-row">
              <div class="field">
                <label class="field-label">Puerto <span class="req">*</span></label>
                <input class="field-input" id="f-port" placeholder="Ej: Cartagena, Manta..." value="${d.port||''}">
              </div>
              <div class="field">
                <label class="field-label">Terminal</label>
                <input class="field-input" id="f-terminal" placeholder="Ej: Terminal Pacífico..." value="${d.terminal||''}">
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">Clientes</div>
            <div id="clients-container">
              ${clients.map((c, i) => buildClientBlock(c, i)).join('')}
            </div>
            <button class="add-client-btn" data-action="add-client">＋ Agregar cliente</button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-action="close-modal">Cancelar</button>
          <button class="btn btn-primary" data-action="modal-next">Siguiente →</button>
        </div>
      </div>
    </div>`;
}

function buildClientBlock(c, i) {
  return `
    <div class="client-block" data-client-idx="${i}">
      <div class="client-block-header">
        <span class="client-block-title">Cliente ${i + 1}</span>
        ${i > 0 ? `<button class="btn btn-ghost btn-sm" data-action="remove-client" data-idx="${i}">✕ Eliminar</button>` : ''}
      </div>
      <div class="form-row">
        <div class="field">
          <label class="field-label">Nombre del cliente <span class="req">*</span></label>
          <input class="field-input client-name" data-idx="${i}" placeholder="Nombre de la empresa cliente" value="${c.name||''}">
        </div>
        <div class="field">
          <label class="field-label">Referencia del cliente</label>
          <input class="field-input client-ref" data-idx="${i}" placeholder="N° referencia / contrato" value="${c.ref||''}">
        </div>
      </div>
    </div>`;
}

function buildModalNewOp2() {
  const d = state.modalData;
  return `
    <div class="overlay" data-action="close-modal-bg">
      <div class="modal" data-stop-propagation="true">
        <div class="modal-header">
          <div>
            <div class="modal-step">Paso 2 de 2</div>
            <div class="modal-title">Tipo de Operación</div>
            <div class="modal-subtitle">${d.code} — ${d.vesselName}</div>
          </div>
          <button class="modal-close" data-action="close-modal">×</button>
        </div>
        <div class="modal-body">
          <div class="progress-steps">
            <div class="progress-step done">1. Datos generales</div>
            <div class="progress-step active">2. Tipo de operación</div>
          </div>
          <p style="font-size:13px;color:var(--muted);margin-bottom:20px">Seleccione el tipo de operación. Los módulos de trabajo se habilitarán según la selección.</p>
          <div class="type-cards">
            ${Object.entries(OP_TYPES).map(([k, t]) => `
              <div class="type-card ${d.opType===k?'selected':''}" data-action="select-type" data-type="${k}">
                <div class="type-card-icon">${t.icon}</div>
                <div class="type-card-title">${t.label}</div>
                <div class="type-card-desc">${t.desc}</div>
                <div class="type-card-modules">
                  ${t.modules.map(m => `<span class="type-card-module">${MODULE_META[m]?.label || m}</span>`).join('')}
                </div>
              </div>`).join('')}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-action="modal-back">← Anterior</button>
          <button class="btn btn-primary" data-action="modal-create">Crear Operación</button>
        </div>
      </div>
    </div>`;
}

// ===== OPERATION DETAIL =====
function buildOpDetail(op) {
  const t = OP_TYPES[op.type];
  const clients = (op.clients || []).map(c => `<span class="badge badge-client">${c.name}</span>`).join('');
  const modules = t.modules;
  const mod = state.currentModule || modules[0];

  let content = '';
  if (op.type === 'alije' && ['ullage-inicial','ullage-final','time-log','vef','discharge-record','slops','checklist-madre','checklist-alijador'].includes(mod)) {
    content = buildAlijeWrapper(op, mod);
  } else {
    content = buildModuleContent(op, mod, null);
  }

  return `
    <div class="op-detail">
      <div class="op-detail-header">
        <div class="op-detail-top">
          <div>
            <div class="op-detail-code">${op.code}</div>
            <div class="op-detail-vessel">${op.vessel.name || 'Buque sin nombre'}</div>
            <div class="op-detail-meta">
              Viaje ${op.vessel.voyage || '—'} &nbsp;·&nbsp; IMO ${op.vessel.imo || '—'} &nbsp;·&nbsp;
              ${op.port}${op.terminal ? ' / ' + op.terminal : ''} &nbsp;·&nbsp;
              ${op.product.type ? PRODUCTS.find(p=>p.id===op.product.type)?.label : '—'}
              ${op.product.crudeName ? ` — ${op.product.crudeName}` : ''}
            </div>
            <div class="op-detail-badges" style="margin-top:8px">
              ${clients}
              <span class="badge badge-port">${op.port || '—'}</span>
              <span class="op-type-badge ${op.type==='vef'?'type-vef':op.type==='alije'?'type-alije':'type-terminal'}">${t?.label}</span>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary btn-sm" data-action="edit-op" data-id="${op.id}">Editar</button>
            <button class="btn btn-danger btn-sm" data-action="delete-op" data-id="${op.id}">Eliminar</button>
          </div>
        </div>
      </div>
      <div class="module-tabs">
        ${modules.map(m => `
          <div class="module-tab ${mod===m?'active':''}" data-action="switch-module" data-module="${m}">
            ${MODULE_META[m]?.icon} ${MODULE_META[m]?.label}
          </div>`).join('')}
      </div>
      <div class="module-content" id="module-content">
        ${content}
      </div>
    </div>`;
}

function buildAlijeWrapper(op, mod) {
  const alijos = op.alijos || [];
  const idx = Math.min(state.currentAlijoIdx, alijos.length - 1);
  const isMotherModule = ['checklist-madre'].includes(mod);

  if (mod === 'checklist-madre') {
    return buildModuleContent(op, mod, null);
  }

  return `
    <div class="alije-header">
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Buque Alijador</div>
        <div class="alije-tabs">
          ${alijos.map((a, i) => `
            <div class="alije-tab ${i===idx?'active':''}" data-action="switch-alijo" data-idx="${i}">
              ${a.vessel.name || `Alijador ${i+1}`}
            </div>`).join('')}
          <div class="alije-tab add-alije" data-action="add-alijo">＋ Agregar alijador</div>
        </div>
      </div>
    </div>
    ${alijos.length === 0
      ? `<div class="info-box">Agregue al menos un buque alijador para comenzar.</div>`
      : buildAlijoContent(op, alijos[idx], idx, mod)
    }`;
}

function buildAlijoContent(op, alijo, idx, mod) {
  if (!alijo) return '';
  return `
    <div class="card" style="margin-bottom:16px">
      <div class="card-title">Datos del Alijador ${idx+1}</div>
      <div class="form-row">
        <div class="field">
          <label class="field-label">Nombre del buque alijador</label>
          <input class="field-input" data-action="save-alijo-vessel-name" data-idx="${idx}" value="${alijo.vessel.name||''}" placeholder="Nombre del buque">
        </div>
        <div class="field">
          <label class="field-label">IMO</label>
          <input class="field-input" data-action="save-alijo-vessel-imo" data-idx="${idx}" value="${alijo.vessel.imo||''}" placeholder="IMO">
        </div>
      </div>
    </div>
    ${buildModuleContentInner(alijo.modules[mod] || {}, mod, { opId: op.id, alijoIdx: idx, mod })}`;
}

// ===== MODULE DISPATCHER =====
function buildModuleContent(op, mod, context) {
  const data = (op.modules || {})[mod] || {};
  return buildModuleContentInner(data, mod, { opId: op.id, mod });
}

function buildModuleContentInner(data, mod, ctx) {
  const meta = MODULE_META[mod] || {};
  const ctxStr = encodeCtx(ctx);

  if (mod === 'origen')                                                   return buildOrigen(data, ctxStr);
  if (mod === 'key-meeting')                                              return buildKeyMeeting(data, ctxStr);
  if (mod === 'ullage-inicial' || mod === 'ullage-final')                 return buildUllage(data, mod, ctxStr);
  if (mod === 'vef')                                                      return buildVEF(data, ctxStr);
  if (mod === 'time-log')                                                 return buildTimeLog(data, ctxStr);
  if (mod === 'discharge-record')                                         return buildDischargeRecord(data, ctxStr);
  if (mod === 'slops')                                                    return buildSlops(data, ctxStr);
  if (mod.startsWith('checklist'))                                        return buildChecklist(data, mod, ctxStr);
  if (mod === 'summary') {
    const c = decodeCtx(ctx);
    const op = getOp(c.opId);
    return op ? buildSummary(op, ctxStr) : '<div class="text-muted">Operación no encontrada.</div>';
  }
  return `<div class="module-title">${meta.label}</div><div class="text-muted">Módulo en desarrollo.</div>`;
}

function encodeCtx(ctx) { return encodeURIComponent(JSON.stringify(ctx)); }
function decodeCtx(s) { try { return JSON.parse(decodeURIComponent(s)); } catch { return {}; } }

// ===== MODULE: ORIGEN =====
function buildOrigen(d, ctx) {
  const bl = d.bl || {};
  const shore = d.shore || {};
  const ship = d.shipFigureOrigin || {};

  const qRow = (label, obj, field, unit, hint='') => `
    <tr>
      <td style="font-weight:600;color:var(--ink);font-size:12px">${label}</td>
      <td><input class="tbl-input" type="number" step="0.001" value="${obj[field]||''}"
          data-action="save-origen-qty" data-ctx="${ctx}" data-obj="${field==='vef'?'shore':field.startsWith('bl')?'bl':''}" data-subobj="${field}" placeholder="—"></td>
      <td style="color:var(--muted);font-size:11px">${unit}</td>
      ${hint ? `<td style="color:var(--muted);font-size:10px">${hint}</td>` : '<td></td>'}
    </tr>`;

  const blRow = (label, field, unit, hint='') => `
    <tr>
      <td style="font-weight:600;color:var(--ink);font-size:12px">${label}</td>
      <td><input class="tbl-input" type="number" step="0.001" value="${bl[field]||''}"
          data-action="save-nested" data-ctx="${ctx}" data-obj="bl" data-field="${field}" placeholder="—"></td>
      <td style="color:var(--muted);font-size:11px">${unit}</td>
      <td style="color:var(--muted);font-size:10px">${hint}</td>
    </tr>`;

  const shoreRow = (label, field, unit, hint='') => `
    <tr>
      <td style="font-weight:600;color:var(--ink);font-size:12px">${label}</td>
      <td><input class="tbl-input" type="number" step="0.001" value="${shore[field]||''}"
          data-action="save-nested" data-ctx="${ctx}" data-obj="shore" data-field="${field}" placeholder="—"></td>
      <td style="color:var(--muted);font-size:11px">${unit}</td>
      <td style="color:var(--muted);font-size:10px">${hint}</td>
    </tr>`;

  const shipRow = (label, field, unit, hint='') => `
    <tr>
      <td style="font-weight:600;color:var(--ink);font-size:12px">${label}</td>
      <td><input class="tbl-input" type="number" step="0.001" value="${ship[field]||''}"
          data-action="save-nested" data-ctx="${ctx}" data-obj="shipFigureOrigin" data-field="${field}" placeholder="—"></td>
      <td style="color:var(--muted);font-size:11px">${unit}</td>
      <td style="color:var(--muted);font-size:10px">${hint}</td>
    </tr>`;

  return `
    <div class="module-title">📦 Datos de Origen / Puerto de Carga</div>
    <div class="module-subtitle">Bill of Lading, figura tierra origen, figura buque en carga</div>

    <!-- PUERTO Y TERMINAL ORIGEN -->
    <div class="card">
      <div class="card-title">Puerto y Terminal de Carga</div>
      <div class="form-row form-row-3">
        <div class="field">
          <label class="field-label">Puerto de carga</label>
          <input class="field-input" value="${d.loadPort||''}" placeholder="Ej: Coveñas, Esmeraldas..."
            data-action="save-field" data-ctx="${ctx}" data-field="loadPort">
        </div>
        <div class="field">
          <label class="field-label">Terminal</label>
          <input class="field-input" value="${d.loadTerminal||''}" placeholder="Nombre de la terminal"
            data-action="save-field" data-ctx="${ctx}" data-field="loadTerminal">
        </div>
        <div class="field">
          <label class="field-label">Muelle / Berth</label>
          <input class="field-input" value="${d.loadBerth||''}" placeholder="Ej: Berth 1, Muelle 3..."
            data-action="save-field" data-ctx="${ctx}" data-field="loadBerth">
        </div>
      </div>
      <div class="form-row form-row-3">
        <div class="field">
          <label class="field-label">Fecha inicio carga</label>
          <input class="field-input" type="datetime-local" value="${d.loadDate||''}"
            data-action="save-field" data-ctx="${ctx}" data-field="loadDate">
        </div>
        <div class="field">
          <label class="field-label">N° B/L</label>
          <input class="field-input" value="${d.blNumber||''}" placeholder="Número Bill of Lading"
            data-action="save-field" data-ctx="${ctx}" data-field="blNumber">
        </div>
        <div class="field">
          <label class="field-label">Fecha B/L</label>
          <input class="field-input" type="date" value="${d.blDate||''}"
            data-action="save-field" data-ctx="${ctx}" data-field="blDate">
        </div>
      </div>
    </div>

    <!-- PROPIEDADES GENERALES ORIGEN -->
    <div class="card">
      <div class="card-title">Propiedades del Producto en Origen</div>
      <div class="form-row form-row-3" style="margin-bottom:0">
        <div class="field">
          <label class="field-label">API Gravity @60°F</label>
          <input class="field-input" type="number" step="0.1" value="${d.originApi||''}" placeholder="°API"
            data-action="save-field" data-ctx="${ctx}" data-field="originApi">
        </div>
        <div class="field">
          <label class="field-label">Temperatura observada (°C)</label>
          <input class="field-input" type="number" step="0.01" value="${d.originTemp||''}" placeholder="°C"
            data-action="save-field" data-ctx="${ctx}" data-field="originTemp">
        </div>
        <div class="field">
          <label class="field-label">BS&W (%)</label>
          <input class="field-input" type="number" step="0.001" value="${d.originBsw||''}" placeholder="% vol"
            data-action="save-field" data-ctx="${ctx}" data-field="originBsw">
        </div>
      </div>
    </div>

    <!-- TRES FIGURAS EN PARALELO -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">

      <!-- B/L -->
      <div class="card" style="padding:0;overflow:hidden">
        <div style="background:#1f3a5f;color:#7eb8e8;font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:10px 14px">
          📄 Bill of Lading (B/L)
        </div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th style="text-align:left">Cantidad</th><th>Valor</th><th>Ud.</th><th></th></tr></thead>
            <tbody>
              ${blRow('TOV','tov','m³','Tank gauge')}
              ${blRow('GOV','gov','m³','Gross Observed')}
              ${blRow('GSV @60°F','gsv60F','m³','Std. Volume')}
              ${blRow('m³ @15°C','m3_15','m³','')}
              ${blRow('m³ @20°C','m3_20','m³','')}
              ${blRow('BBL @60°F','bbl','BBL','')}
              ${blRow('TM Vacío','tmVac','MT','')}
              ${blRow('TM Aire','tmAir','MT','')}
              ${blRow('Long Tons','longTons','LT','')}
              ${blRow('Short Tons','shortTons','ST','')}
              ${blRow('US Gallons','gallons','gal','')}
              <tr style="background:var(--line2)"><td style="font-size:11px;color:var(--muted);padding:6px 8px" colspan="4">Propiedades</td></tr>
              ${blRow('API @60°F','api','°API','')}
              ${blRow('Temperatura','temp','°C','')}
              ${blRow('BS&W','bsw','%','')}
              ${blRow('VCF aplicado','vcf','—','')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- SHORE / TIERRA ORIGEN -->
      <div class="card" style="padding:0;overflow:hidden">
        <div style="background:#1a3a2a;color:#7ecc9e;font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:10px 14px">
          🏭 Figura Tierra (Shore) Origen
        </div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th style="text-align:left">Cantidad</th><th>Valor</th><th>Ud.</th><th></th></tr></thead>
            <tbody>
              ${shoreRow('TOV','tov','m³','')}
              ${shoreRow('GOV','gov','m³','')}
              ${shoreRow('GSV @60°F','gsv60F','m³','')}
              ${shoreRow('m³ @15°C','m3_15','m³','')}
              ${shoreRow('m³ @20°C','m3_20','m³','')}
              ${shoreRow('BBL @60°F','bbl','BBL','')}
              ${shoreRow('TM Vacío','tmVac','MT','')}
              ${shoreRow('TM Aire','tmAir','MT','')}
              ${shoreRow('Long Tons','longTons','LT','')}
              ${shoreRow('Short Tons','shortTons','ST','')}
              ${shoreRow('US Gallons','gallons','gal','')}
              <tr style="background:var(--line2)"><td style="font-size:11px;color:var(--muted);padding:6px 8px" colspan="4">Propiedades / VEF</td></tr>
              ${shoreRow('API @60°F','api','°API','')}
              ${shoreRow('Temperatura','temp','°C','')}
              ${shoreRow('BS&W','bsw','%','')}
              ${shoreRow('VEF origen','vef','—','Shore/Ship')}
            </tbody>
          </table>
        </div>
        <div style="padding:10px 12px">
          <label class="field-label" style="font-size:11px">Detalle tanques tierra</label>
          <textarea class="field-textarea" style="width:100%;min-height:60px;font-size:11px"
            placeholder="N° tanques, IDs, mediciones..."
            data-action="save-nested" data-ctx="${ctx}" data-obj="shore" data-field="tankDetails">${shore.tankDetails||''}</textarea>
        </div>
      </div>

      <!-- SHIP FIGURE ORIGEN -->
      <div class="card" style="padding:0;overflow:hidden">
        <div style="background:#3a1f2a;color:#e87eaa;font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:10px 14px">
          🛢️ Figura Buque en Carga
        </div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th style="text-align:left">Cantidad</th><th>Valor</th><th>Ud.</th><th></th></tr></thead>
            <tbody>
              ${shipRow('TOV','tov','m³','')}
              ${shipRow('GOV','gov','m³','')}
              ${shipRow('GSV @60°F','gsv60F','m³','')}
              ${shipRow('m³ @15°C','m3_15','m³','')}
              ${shipRow('m³ @20°C','m3_20','m³','')}
              ${shipRow('BBL @60°F','bbl','BBL','')}
              ${shipRow('TM Vacío','tmVac','MT','')}
              ${shipRow('TM Aire','tmAir','MT','')}
              ${shipRow('Long Tons','longTons','LT','')}
              ${shipRow('Short Tons','shortTons','ST','')}
              ${shipRow('US Gallons','gallons','gal','')}
              <tr style="background:var(--line2)"><td style="font-size:11px;color:var(--muted);padding:6px 8px" colspan="4">Propiedades / VEF</td></tr>
              ${shipRow('API @60°F','api','°API','')}
              ${shipRow('Temperatura','temp','°C','')}
              ${shipRow('BS&W','bsw','%','')}
              ${shipRow('VEF origen','vef','—','Buque')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Notas de Origen</div>
      <textarea class="field-textarea" style="width:100%;min-height:80px"
        placeholder="Observaciones sobre la carga, discrepancias de origen, condiciones especiales..."
        data-action="save-field" data-ctx="${ctx}" data-field="notes">${d.notes||''}</textarea>
    </div>`;
}

// ===== MODULE: SUMMARY =====
function buildSummary(op, ctx) {
  const mods = op.modules || {};
  const origen = mods['origen'] || {};
  const ullI   = mods['ullage-inicial'] || {};
  const ullF   = mods['ullage-final']   || {};
  const vef    = mods['vef'] || {};

  // Aggregate ullage quantities
  const getTankGSV = (ull) => ullageTotal(ull.tanks || [], 'gsv');
  const getTankGOV = (ull) => ullageTotal(ull.tanks || [], 'gov');
  const getTankTOV = (ull) => ullageTotal(ull.tanks || [], 'tov');

  // Key figures (all in m³ GSV @60°F)
  const blGSV     = parseFloat(origen.bl?.gsv60F || 0);
  const shoreGSV  = parseFloat(origen.shore?.gsv60F || 0) ||
                    parseFloat(vef.shoreGSV || 0);
  const shipInit  = parseFloat(origen.shipFigureOrigin?.gsv60F || 0) || getTankGSV(ullI);
  const shipFinal = getTankGSV(ullF);

  // Discharge figure: shipInit - shipFinal (quantity discharged by ship)
  const shipDischarged = shipInit > 0 && shipFinal >= 0 ? shipInit - shipFinal : 0;
  const shoreReceived  = shoreGSV;

  // All B/L figures
  const blTmAir    = parseFloat(origen.bl?.tmAir || 0);
  const shoreTmAir = parseFloat(origen.shore?.tmAir || 0);
  const shipTmAir  = parseFloat(origen.shipFigureOrigin?.tmAir || 0);

  const hasData = blGSV > 0 || shoreGSV > 0 || shipInit > 0;

  // Difference calculations
  const diffShipShore = shoreReceived > 0 && shipDischarged > 0
    ? ((shipDischarged - shoreReceived) / shoreReceived * 100) : null;
  const diffBLShip = blGSV > 0 && shipDischarged > 0
    ? ((shipDischarged - blGSV) / blGSV * 100) : null;
  const diffBLShore = blGSV > 0 && shoreReceived > 0
    ? ((shoreReceived - blGSV) / blGSV * 100) : null;

  const statusBadge = (pct) => {
    if (pct === null) return '<span style="color:var(--muted)">—</span>';
    const abs = Math.abs(pct);
    const color = abs <= 0.2 ? '#3d6b45' : abs <= 0.5 ? '#c88c3a' : '#8b3030';
    const label = abs <= 0.2 ? 'Normal' : abs <= 0.5 ? 'Monitorear' : 'Investigar';
    return `<span style="background:${color}22;color:${color};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700">${pct > 0 ? '+' : ''}${pct.toFixed(4)}% — ${label}</span>`;
  };

  // API MPMS 13 causes analysis
  const causes = analyzeCauses(diffShipShore, diffBLShip, diffBLShore, op);

  const summaryRow = (label, value, unit, style='') =>
    `<tr ${style}>
      <td style="font-weight:600;font-size:12px">${label}</td>
      <td class="calc-cell">${value != null && value !== 0 ? fmt(value) : '—'}</td>
      <td style="color:var(--muted);font-size:11px">${unit}</td>
    </tr>`;

  return `
    <div class="module-title">📊 Summary — Reconciliación Global</div>
    <div class="module-subtitle">Comparación figuras B/L · Tierra · Buque &nbsp;|&nbsp; API MPMS 13 &nbsp;·&nbsp; Referencia: ${op.code}</div>

    ${!hasData ? `<div class="warn-box">Complete los módulos <strong>Datos Origen</strong>, <strong>Ullage Inicial</strong> y <strong>VEF</strong> para ver el resumen automático.</div>` : ''}

    <!-- COMPARATIVA GLOBAL DE FIGURAS -->
    <div class="card" style="padding:0;overflow:hidden;margin-bottom:16px">
      <div style="background:var(--panel);color:var(--amber);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:12px 16px">
        Figuras de Referencia (GSV @60°F — m³)
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-bottom:1px solid var(--line)">
        ${[
          ['B/L', blGSV, '#1f3a5f', '#7eb8e8'],
          ['Tierra Origen', shoreGSV, '#1a3a2a', '#7ecc9e'],
          ['Buque Cargado', shipInit, '#2a1a3a', '#b07ecc'],
          ['Descargado Buque', shipDischarged, '#3a1f12', '#cc9e7e'],
        ].map(([lbl,val,bg,fg]) => `
          <div style="background:${bg};padding:16px 20px;border-right:1px solid rgba(255,255,255,.06)">
            <div style="font-size:10px;color:${fg}88;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">${lbl}</div>
            <div style="font-size:22px;font-weight:700;font-family:monospace;color:${val>0?fg:'rgba(255,255,255,.2)'}">${val>0?fmt(val):'—'}</div>
            <div style="font-size:10px;color:${fg}66;margin-top:2px">m³ GSV @60°F</div>
          </div>`).join('')}
      </div>
    </div>

    <!-- DIFERENCIAS -->
    <div class="card" style="padding:0;overflow:hidden;margin-bottom:16px">
      <div style="background:var(--panel);color:var(--amber);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:12px 16px">
        Diferencias — Criterio API MPMS 13 (tolerancia ±0.2% alerta / ±0.5% significativa)
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="background:var(--panel2)">
          <th style="text-align:left;padding:10px 16px;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.06em">Comparación</th>
          <th style="padding:10px 16px;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.06em">Δ m³</th>
          <th style="padding:10px 16px;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.06em">Δ %</th>
          <th style="padding:10px 16px;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.06em">Estado</th>
        </tr></thead>
        <tbody>
          ${[
            ['Buque descargado vs Tierra recibida', shipDischarged, shoreReceived, diffShipShore],
            ['Buque descargado vs B/L', shipDischarged, blGSV, diffBLShip],
            ['Tierra recibida vs B/L', shoreReceived, blGSV, diffBLShore],
          ].map(([lbl, a, b, pct]) => {
            const delta = a > 0 && b > 0 ? a - b : null;
            return `<tr style="border-bottom:1px solid var(--line2)">
              <td style="padding:12px 16px;font-weight:600;font-size:13px">${lbl}</td>
              <td style="padding:12px 16px;text-align:center;font-family:monospace;color:var(--sea);font-weight:700">${delta !== null ? (delta > 0 ? '+' : '') + fmt(delta) : '—'}</td>
              <td style="padding:12px 16px;text-align:center">${statusBadge(pct)}</td>
              <td style="padding:12px 16px;text-align:center">${pct !== null ? (Math.abs(pct)<=0.2?'✅':Math.abs(pct)<=0.5?'⚠️':'🔴') : '—'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- TABLA COMPLETA DE CANTIDADES POR FIGURA -->
    <div class="card" style="padding:0;overflow:hidden;margin-bottom:16px">
      <div style="background:var(--panel);color:var(--amber);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:12px 16px">
        Resumen Completo de Cantidades por Figura
      </div>
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th style="text-align:left;min-width:180px">Cantidad</th>
              <th>B/L</th>
              <th>Tierra Origen</th>
              <th>Buque Cargado</th>
              <th>Descargado</th>
              <th>Unidad</th>
            </tr>
          </thead>
          <tbody>
            ${[
              ['TOV', 'tov', 'm³'],
              ['GOV', 'gov', 'm³'],
              ['GSV @60°F', 'gsv60F', 'm³'],
              ['m³ @15°C', 'm3_15', 'm³'],
              ['m³ @20°C', 'm3_20', 'm³'],
              ['BBL @60°F', 'bbl', 'BBL'],
              ['TM Vacío', 'tmVac', 'MT'],
              ['TM Aire', 'tmAir', 'MT'],
              ['Long Tons', 'longTons', 'LT'],
              ['Short Tons', 'shortTons', 'ST'],
              ['US Gallons', 'gallons', 'US gal'],
            ].map(([lbl, field, unit]) => {
              const bv  = parseFloat(origen.bl?.[field] || 0);
              const sv  = parseFloat(origen.shore?.[field] || 0);
              const shv = parseFloat(origen.shipFigureOrigin?.[field] || 0);
              return `<tr style="border-bottom:1px solid var(--line2)">
                <td style="font-weight:600;font-size:12px;padding:8px 10px">${lbl}</td>
                <td class="calc-cell" style="color:#7eb8e8">${bv>0?fmt(bv):'—'}</td>
                <td class="calc-cell" style="color:#7ecc9e">${sv>0?fmt(sv):'—'}</td>
                <td class="calc-cell" style="color:#b07ecc">${shv>0?fmt(shv):'—'}</td>
                <td class="calc-cell">${shipDischarged>0?fmt(shipDischarged):'—'}</td>
                <td style="color:var(--muted);font-size:11px">${unit}</td>
              </tr>`;
            }).join('')}
            <tr style="border-bottom:1px solid var(--line2);background:var(--line2)">
              <td style="font-weight:600;font-size:12px;padding:8px 10px">API @60°F</td>
              <td class="calc-cell" style="color:#7eb8e8">${origen.bl?.api||'—'}</td>
              <td class="calc-cell" style="color:#7ecc9e">${origen.shore?.api||'—'}</td>
              <td class="calc-cell" style="color:#b07ecc">${origen.shipFigureOrigin?.api||'—'}</td>
              <td class="calc-cell">—</td>
              <td style="color:var(--muted);font-size:11px">°API</td>
            </tr>
            <tr style="border-bottom:1px solid var(--line2);background:var(--line2)">
              <td style="font-weight:600;font-size:12px;padding:8px 10px">Temperatura</td>
              <td class="calc-cell" style="color:#7eb8e8">${origen.bl?.temp||'—'}</td>
              <td class="calc-cell" style="color:#7ecc9e">${origen.shore?.temp||'—'}</td>
              <td class="calc-cell" style="color:#b07ecc">${origen.shipFigureOrigin?.temp||'—'}</td>
              <td class="calc-cell">—</td>
              <td style="color:var(--muted);font-size:11px">°C</td>
            </tr>
            <tr style="background:var(--line2)">
              <td style="font-weight:600;font-size:12px;padding:8px 10px">VEF</td>
              <td class="calc-cell">—</td>
              <td class="calc-cell" style="color:#7ecc9e">${origen.shore?.vef||'—'}</td>
              <td class="calc-cell" style="color:#b07ecc">${origen.shipFigureOrigin?.vef||'—'}</td>
              <td class="calc-cell" style="color:var(--amber)">${vef.vef||'—'}</td>
              <td style="color:var(--muted);font-size:11px">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ANÁLISIS DE CAUSAS API MPMS 13 -->
    ${causes.length > 0 ? `
    <div class="card" style="border-left:4px solid var(--amber)">
      <div class="card-title">🔍 Análisis de Posibles Causas — API MPMS 13</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${causes.map(c => `
          <div style="display:flex;gap:12px;align-items:flex-start;padding:10px;background:var(--paper);border-radius:var(--r)">
            <div style="font-size:20px;flex-shrink:0">${c.icon}</div>
            <div>
              <div style="font-weight:700;font-size:13px;color:var(--ink);margin-bottom:2px">${c.title}</div>
              <div style="font-size:12px;color:var(--muted);line-height:1.5">${c.desc}</div>
              <div style="font-size:11px;color:var(--steel);margin-top:4px">Referencia: ${c.ref}</div>
            </div>
          </div>`).join('')}
      </div>
      <div class="info-box" style="margin-top:16px;margin-bottom:0">
        Para un análisis exhaustivo con recomendaciones específicas, use el <strong>Consultor IA</strong> mencionando el código <strong>${op.code}</strong>.
      </div>
    </div>` : ''}

    <div class="card">
      <div class="card-title">Notas del Summary</div>
      <textarea class="field-textarea" style="width:100%;min-height:80px"
        placeholder="Conclusiones, acciones a tomar, acuerdos de reclamo..."
        data-action="save-field" data-ctx="${ctx}" data-field="notes"
        >${(mods['summary']||{}).notes||''}</textarea>
    </div>`;
}

function analyzeCauses(diffShipShore, diffBLShip, diffBLShore, op) {
  const causes = [];
  const allDiffs = [diffShipShore, diffBLShip, diffBLShore].filter(d => d !== null);
  if (allDiffs.length === 0) return causes;

  const maxAbs = Math.max(...allDiffs.map(Math.abs));
  if (maxAbs === 0) return causes;

  // Always include measurement uncertainty
  causes.push({
    icon: '📏', title: 'Incertidumbre de Medición (API MPMS 12.1.1)',
    desc: 'El ullage manual tiene una precisión de ±1-2 mm, lo que equivale a una incertidumbre volumétrica de ±0.05-0.15% según el tipo de tanque. En tanques de gran capacidad esta incertidumbre puede ser dominante.',
    ref: 'API MPMS 12.1.1 / ISO 4512',
  });

  if (op.modules?.origen?.bl?.temp && op.modules?.['ullage-inicial']?.avgTemp) {
    const dT = Math.abs(parseFloat(op.modules.origen.bl.temp) - parseFloat(op.modules['ullage-inicial'].avgTemp));
    if (dT > 2) {
      causes.push({
        icon: '🌡️', title: `Diferencia de Temperatura (ΔT ≈ ${dT.toFixed(1)}°C detectada)`,
        desc: 'Un diferencial de temperatura entre la medición en origen y destino produce diferencia volumétrica directa. Para crudos pesados (API 20-30) cada 1°C representa ≈0.04-0.06% de variación en VCF. Un ΔT de 5°C puede explicar una diferencia de 0.2-0.3%.',
        ref: 'API MPMS 11.1 (Tabla 6A/6B) — coeficiente de expansión térmica',
      });
    }
  }

  if (maxAbs > 0.1) {
    causes.push({
      icon: '⚖️', title: 'VEF — Vessel Experience Factor (API MPMS 17.9)',
      desc: 'El VEF corrige la diferencia sistemática entre la figura del buque y la figura de tierra. Un VEF diferente al histórico del buque indica posible cambio en el comportamiento del casco, error en la tabla de estiba, o condiciones anómalas de trim/escora durante la medición.',
      ref: 'API MPMS 17.9 — criterio: VEF histórico ± 0.002 (±0.2%)',
    });
  }

  if (maxAbs > 0.15) {
    causes.push({
      icon: '🚢', title: 'Trim y Escora del Buque',
      desc: 'Desviaciones de trim superiores a 0.5 m o escoras superiores a 0.5° afectan la exactitud de las tablas de calibración. La corrección de trim debe aplicarse según el método de la compañía y las tablas del Lloyd\'s Register.',
      ref: 'API MPMS 2.8A — Trim and List corrections',
    });
  }

  if (maxAbs > 0.2) {
    causes.push({
      icon: '💧', title: 'Agua Libre y Sedimentos (BS&W)',
      desc: 'Una diferencia de 0.1% en BS&W entre origen y destino produce directamente ≈0.1% de diferencia en NSV. Si el muestreo no fue representativo (API MPMS 8.2), la determinación de BS&W puede tener un error sistemático.',
      ref: 'API MPMS 8.2 / ASTM D4007 / IP 372',
    });
    causes.push({
      icon: '🏭', title: 'Calibración de Tanques de Tierra (API MPMS 2.2)',
      desc: 'Los tanques de tierra con tablas de calibración antiguas (>5 años sin revalidación) o con deformaciones estructurales introducen errores sistemáticos. La tabla del techo flotante y la zona muerta del fondo son fuentes críticas de error.',
      ref: 'API MPMS 2.2A/2.2B — Calibración tanques verticales',
    });
  }

  if (maxAbs > 0.35) {
    causes.push({
      icon: '🔧', title: 'Cargo No Entregado / Líneas y Codos de Tubería',
      desc: 'El cargo retenido en líneas, codos y sistemas de stripping puede representar 10-50 m³ dependiendo del diámetro y longitud de la instalación. Considerar también vapores, inertización, y sistema de recuperación de vapores (VRS).',
      ref: 'API MPMS 17.6 — Hoses & Pipelines / API 14.2.1',
    });
    causes.push({
      icon: '📊', title: 'Incertidumbre Combinada Excede Tolerancia',
      desc: `La diferencia de ${maxAbs.toFixed(3)}% supera el límite de alerta del 0.5%. Se recomienda revisión formal de todas las mediciones, verificación de equipos de medición (calibración), y posiblemente una mediación técnica con las partes involucradas.`,
      ref: 'ASTM E177 / API MPMS 13.2 — Statistical analysis of measurement uncertainty',
    });
  }

  return causes;
}

// ===== MODULE: KEY MEETING =====
function buildKeyMeeting(d, ctx) {
  const att = d.attendees || [];
  const topics = d.topics || [];
  return `
    <div class="module-title">🤝 Key Meeting</div>
    <div class="module-subtitle">Reunión de inicio de operación — registro de asistentes y acuerdos</div>
    <div class="card">
      <div class="card-title">Información General</div>
      <div class="form-row form-row-3">
        <div class="field">
          <label class="field-label">Fecha</label>
          <input class="field-input" type="date" value="${d.date||''}" data-action="save-field" data-ctx="${ctx}" data-field="date">
        </div>
        <div class="field">
          <label class="field-label">Hora</label>
          <input class="field-input" type="time" value="${d.time||''}" data-action="save-field" data-ctx="${ctx}" data-field="time">
        </div>
        <div class="field">
          <label class="field-label">Lugar</label>
          <input class="field-input" placeholder="Ej: Sala de Chart Room" value="${d.location||''}" data-action="save-field" data-ctx="${ctx}" data-field="location">
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Asistentes</div>
      <div class="attendee-list" id="km-att-list">
        ${att.map((a,i) => `
          <div class="attendee-item">
            <span>${a.name}${a.company?' — '+a.company:''} ${a.role?'('+a.role+')':''}</span>
            <button class="attendee-rm" data-action="km-rm-att" data-ctx="${ctx}" data-idx="${i}">✕</button>
          </div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;align-items:end">
        <div class="field"><label class="field-label">Nombre</label><input class="field-input" id="km-att-name" placeholder="Nombre completo"></div>
        <div class="field"><label class="field-label">Empresa</label><input class="field-input" id="km-att-company" placeholder="Empresa"></div>
        <div class="field"><label class="field-label">Cargo</label><input class="field-input" id="km-att-role" placeholder="Cargo / Rol"></div>
        <button class="btn btn-secondary" data-action="km-add-att" data-ctx="${ctx}" style="margin-bottom:0">Agregar</button>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Temas Tratados</div>
      <div class="attendee-list" id="km-topics-list">
        ${topics.map((t,i) => `
          <div class="attendee-item">
            <span>${t}</span>
            <button class="attendee-rm" data-action="km-rm-topic" data-ctx="${ctx}" data-idx="${i}">✕</button>
          </div>`).join('')}
      </div>
      <div class="add-row">
        <input class="field-input" id="km-topic-input" placeholder="Agregar tema..." style="flex:1">
        <button class="btn btn-secondary" data-action="km-add-topic" data-ctx="${ctx}">Agregar</button>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Acuerdos y Decisiones</div>
      <textarea class="field-textarea" style="width:100%;min-height:100px" placeholder="Documentar acuerdos alcanzados en la reunión..." data-action="save-field" data-ctx="${ctx}" data-field="decisions">${d.decisions||''}</textarea>
    </div>
    <div class="card">
      <div class="card-title">Notas Adicionales</div>
      <textarea class="field-textarea" style="width:100%;min-height:80px" placeholder="Observaciones generales..." data-action="save-field" data-ctx="${ctx}" data-field="notes">${d.notes||''}</textarea>
    </div>`;
}

// ===== MODULE: ULLAGE =====
function buildUllage(d, mod, ctx) {
  const tanks = d.tanks || TANK_NAMES.map(n => ({ name: n }));
  const title = mod === 'ullage-inicial' ? 'Ullage Inicial (Before)' : 'Ullage Final (After)';
  const totalTOV = ullageTotal(tanks, 'tov');
  const totalGOV = ullageTotal(tanks, 'gov');
  const totalGSV = ullageTotal(tanks, 'gsv');
  const totalFW  = ullageTotal(tanks, 'fw');

  // Weighted averages for summary calculations
  const govTanks = tanks.filter(t => parseFloat(t.gov) > 0);
  const wAvgTemp = govTanks.length
    ? govTanks.reduce((s,t) => s + (parseFloat(t.temp)||0)*(parseFloat(t.gov)||0), 0) / totalGOV
    : 0;
  const wAvgApi = govTanks.length
    ? govTanks.reduce((s,t) => s + (parseFloat(t.api)||0)*(parseFloat(t.gov)||0), 0) / totalGOV
    : 0;
  const wAvgBsw = govTanks.length
    ? govTanks.reduce((s,t) => s + (parseFloat(t.bsw)||0)*(parseFloat(t.gov)||0), 0) / totalGOV
    : 0;

  // Override with manual inputs if provided
  const avgTemp = parseFloat(d.avgTemp) || wAvgTemp;
  const avgApi  = parseFloat(d.avgApi)  || wAvgApi;
  const avgBsw  = parseFloat(d.avgBsw)  !== undefined && d.avgBsw !== '' ? parseFloat(d.avgBsw) : wAvgBsw;

  const q = calcAllQuantities(totalGOV, avgTemp, avgApi, avgBsw);

  return `
    <div class="module-title">📐 ${title}</div>
    <div class="module-subtitle">Medición de tanques — API MPMS 12.1.1 &nbsp;|&nbsp; 14 tanques</div>

    <div class="card" style="padding:12px">
      <div class="form-row form-row-3" style="margin-bottom:0">
        <div class="field">
          <label class="field-label">Trim (m)</label>
          <input class="field-input" type="number" step="0.01" value="${d.trim||''}" placeholder="0.00" data-action="save-field" data-ctx="${ctx}" data-field="trim">
        </div>
        <div class="field">
          <label class="field-label">Escora (°)</label>
          <input class="field-input" type="number" step="0.1" value="${d.list||''}" placeholder="0.0" data-action="save-field" data-ctx="${ctx}" data-field="list">
        </div>
        <div class="field">
          <label class="field-label" style="color:var(--muted)">Fecha / Hora medición</label>
          <input class="field-input" type="datetime-local" value="${d.datetime||''}" data-action="save-field" data-ctx="${ctx}" data-field="datetime">
        </div>
      </div>
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:46px">Tanque</th>
              <th>Ullage (m)</th>
              <th>TCF</th>
              <th>TOV (m³)</th>
              <th>Temp (°C)</th>
              <th>API @60°F</th>
              <th>BS&W (%)</th>
              <th>Free Water (m³)</th>
              <th>GOV (m³)</th>
              <th>GSV @60°F (m³)</th>
            </tr>
          </thead>
          <tbody>
            ${tanks.map((t, i) => `
              <tr>
                <td>${t.name || TANK_NAMES[i]}</td>
                <td><input class="tbl-input" type="number" step="0.001" value="${t.ullage||''}" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="ullage"></td>
                <td><input class="tbl-input" type="number" step="0.0001" value="${t.tcf||''}" placeholder="1.0000" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="tcf"></td>
                <td><input class="tbl-input" type="number" step="0.001" value="${t.tov||''}" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="tov"></td>
                <td><input class="tbl-input" type="number" step="0.1" value="${t.temp||''}" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="temp"></td>
                <td><input class="tbl-input" type="number" step="0.1" value="${t.api||''}" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="api"></td>
                <td><input class="tbl-input" type="number" step="0.01" value="${t.bsw||''}" placeholder="0.00" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="bsw"></td>
                <td><input class="tbl-input" type="number" step="0.001" value="${t.fw||''}" placeholder="0.000" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="fw"></td>
                <td><input class="tbl-input calc-cell" type="number" step="0.001" value="${t.gov||''}" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="gov"></td>
                <td><input class="tbl-input calc-cell" type="number" step="0.001" value="${t.gsv||''}" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="gsv"></td>
              </tr>`).join('')}
            <tr class="total-row">
              <td>TOTAL</td>
              <td></td><td></td>
              <td>${fmt(totalTOV)}</td>
              <td></td><td></td><td></td>
              <td>${fmt(totalFW)}</td>
              <td>${fmt(totalGOV)}</td>
              <td>${fmt(totalGSV)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- PROPIEDADES PARA CONVERSIÓN -->
    <div class="card">
      <div class="card-title">Propiedades para Conversión de Cantidades</div>
      <div class="info-box" style="margin-bottom:12px">
        Los valores API, temperatura y BS&W se calculan automáticamente como promedio ponderado por GOV de los tanques.
        Puede sobreescribirlos manualmente si el laboratorio reporta valores distintos.
      </div>
      <div class="form-row form-row-3">
        <div class="field">
          <label class="field-label">Temp. promedio observada (°C)</label>
          <input class="field-input" type="number" step="0.01"
            value="${d.avgTemp !== undefined && d.avgTemp !== '' ? d.avgTemp : wAvgTemp.toFixed(2)}"
            placeholder="${wAvgTemp.toFixed(2)}"
            data-action="save-field" data-ctx="${ctx}" data-field="avgTemp">
          <span class="field-hint">Prom. ponderado: ${wAvgTemp.toFixed(3)} °C</span>
        </div>
        <div class="field">
          <label class="field-label">API Gravity @60°F</label>
          <input class="field-input" type="number" step="0.1"
            value="${d.avgApi !== undefined && d.avgApi !== '' ? d.avgApi : wAvgApi.toFixed(1)}"
            placeholder="${wAvgApi.toFixed(1)}"
            data-action="save-field" data-ctx="${ctx}" data-field="avgApi">
          <span class="field-hint">Prom. ponderado: ${wAvgApi.toFixed(2)} °API</span>
        </div>
        <div class="field">
          <label class="field-label">BS&W promedio (%)</label>
          <input class="field-input" type="number" step="0.01"
            value="${d.avgBsw !== undefined && d.avgBsw !== '' ? d.avgBsw : wAvgBsw.toFixed(3)}"
            placeholder="${wAvgBsw.toFixed(3)}"
            data-action="save-field" data-ctx="${ctx}" data-field="avgBsw">
          <span class="field-hint">Prom. ponderado: ${wAvgBsw.toFixed(4)} %</span>
        </div>
      </div>
      ${q ? `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:8px">
        <div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--r);padding:10px;text-align:center">
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">VCF @60°F</div>
          <div style="font-size:14px;font-weight:700;font-family:monospace;color:var(--sea)">${q.vcf60F.toFixed(7)}</div>
        </div>
        <div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--r);padding:10px;text-align:center">
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">VCF @15°C</div>
          <div style="font-size:14px;font-weight:700;font-family:monospace;color:var(--sea)">${q.vcf15C.toFixed(7)}</div>
        </div>
        <div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--r);padding:10px;text-align:center">
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">VCF @20°C</div>
          <div style="font-size:14px;font-weight:700;font-family:monospace;color:var(--sea)">${q.vcf20C.toFixed(7)}</div>
        </div>
        <div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--r);padding:10px;text-align:center">
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">Densidad @15°C</div>
          <div style="font-size:14px;font-weight:700;font-family:monospace;color:var(--sea)">${q.rho15.toFixed(4)} kg/m³</div>
        </div>
      </div>` : ''}
    </div>

    <!-- RESUMEN DE CANTIDADES ENTREGADAS -->
    <div class="card" style="padding:0;overflow:hidden">
      <div style="background:var(--panel);color:var(--amber);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.08)">
        📊 Resumen de Cantidades — ${title}
      </div>
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th style="text-align:left;width:260px">Cantidad</th>
              <th>Valor</th>
              <th>Unidad</th>
              <th style="text-align:left;font-size:10px;color:var(--muted)">Descripción</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background:#f8f9fa">
              <td style="font-weight:700;color:var(--ink)">TOV — Total Observed Volume</td>
              <td class="calc-cell">${fmt(totalTOV)}</td>
              <td style="color:var(--muted);font-size:11px">m³</td>
              <td style="color:var(--muted);font-size:11px">Suma directa de tanques</td>
            </tr>
            <tr style="background:#f8f9fa">
              <td style="font-weight:700;color:var(--ink)">Free Water</td>
              <td class="calc-cell">${fmt(totalFW)}</td>
              <td style="color:var(--muted);font-size:11px">m³</td>
              <td style="color:var(--muted);font-size:11px">Agua libre total</td>
            </tr>
            <tr style="background:#f8f9fa">
              <td style="font-weight:700;color:var(--ink)">GOV — Gross Observed Volume</td>
              <td class="calc-cell">${fmt(totalGOV)}</td>
              <td style="color:var(--muted);font-size:11px">m³</td>
              <td style="color:var(--muted);font-size:11px">TOV − Free Water</td>
            </tr>
            <tr><td colspan="4" style="padding:0;height:6px;background:var(--line2)"></td></tr>

            ${q ? `
            <tr>
              <td style="font-weight:700;color:var(--sea)">GSV @60°F — Gross Standard Volume</td>
              <td class="calc-cell" style="color:var(--sea)">${fmt(q.gsv60F)}</td>
              <td style="color:var(--muted);font-size:11px">m³</td>
              <td style="color:var(--muted);font-size:11px">GOV × VCF (ref. 60°F = 15.556°C)</td>
            </tr>
            <tr>
              <td style="font-weight:700;color:var(--sea)">GSV @60°F en Barriles</td>
              <td class="calc-cell" style="color:var(--sea)">${fmt(q.bbl60F)}</td>
              <td style="color:var(--muted);font-size:11px">BBL</td>
              <td style="color:var(--muted);font-size:11px">m³ × 6.289811</td>
            </tr>
            <tr>
              <td style="font-weight:700;color:var(--sea)">m³ @15°C</td>
              <td class="calc-cell" style="color:var(--sea)">${fmt(q.gsv15C)}</td>
              <td style="color:var(--muted);font-size:11px">m³</td>
              <td style="color:var(--muted);font-size:11px">GOV × VCF (ref. 15°C)</td>
            </tr>
            <tr>
              <td style="font-weight:700;color:var(--sea)">m³ @20°C</td>
              <td class="calc-cell" style="color:var(--sea)">${fmt(q.gsv20C)}</td>
              <td style="color:var(--muted);font-size:11px">m³</td>
              <td style="color:var(--muted);font-size:11px">GOV × VCF (ref. 20°C)</td>
            </tr>
            <tr><td colspan="4" style="padding:0;height:6px;background:var(--line2)"></td></tr>

            <tr style="background:#fffcf5">
              <td style="font-weight:700;color:var(--ink)">NSV @60°F — Net Standard Volume</td>
              <td class="calc-cell">${fmt(q.nsv60F)}</td>
              <td style="color:var(--muted);font-size:11px">m³</td>
              <td style="color:var(--muted);font-size:11px">GSV@60°F × (1 − BS&W%)</td>
            </tr>
            <tr style="background:#fffcf5">
              <td style="font-weight:700;color:var(--ink)">NSV @15°C</td>
              <td class="calc-cell">${fmt(q.nsv15C)}</td>
              <td style="color:var(--muted);font-size:11px">m³</td>
              <td style="color:var(--muted);font-size:11px">GSV@15°C × (1 − BS&W%)</td>
            </tr>
            <tr><td colspan="4" style="padding:0;height:6px;background:var(--line2)"></td></tr>

            <tr style="background:var(--panel)">
              <td style="color:var(--amber);font-weight:700">TM Vacío — Metric Tons Vacuum</td>
              <td class="calc-cell" style="color:var(--amber)">${fmt(q.tmVac)}</td>
              <td style="color:var(--muted);font-size:11px">MT</td>
              <td style="color:var(--muted);font-size:11px">NSV@15°C × ρ₁₅ / 1000</td>
            </tr>
            <tr style="background:var(--panel)">
              <td style="color:var(--amber);font-weight:700">TM Aire — Metric Tons Air</td>
              <td class="calc-cell" style="color:var(--amber)">${fmt(q.tmAir)}</td>
              <td style="color:var(--muted);font-size:11px">MT</td>
              <td style="color:var(--muted);font-size:11px">TM Vac − 0.0011 × NSV@15°C</td>
            </tr>
            <tr style="background:var(--panel)">
              <td style="color:#a0b4c0;font-weight:700">Long Tons</td>
              <td class="calc-cell" style="color:#a0b4c0">${fmt(q.longTons)}</td>
              <td style="color:var(--muted);font-size:11px">LT</td>
              <td style="color:var(--muted);font-size:11px">TM Aire ÷ 1.016047</td>
            </tr>
            <tr style="background:var(--panel)">
              <td style="color:#a0b4c0;font-weight:700">Short Tons</td>
              <td class="calc-cell" style="color:#a0b4c0">${fmt(q.shortTons)}</td>
              <td style="color:var(--muted);font-size:11px">ST</td>
              <td style="color:var(--muted);font-size:11px">TM Aire ÷ 0.90718474</td>
            </tr>
            <tr style="background:var(--panel)">
              <td style="color:#a0b4c0;font-weight:700">US Gallons</td>
              <td class="calc-cell" style="color:#a0b4c0">${fmt(q.gallons, 0)}</td>
              <td style="color:var(--muted);font-size:11px">US gal</td>
              <td style="color:var(--muted);font-size:11px">BBL × 42</td>
            </tr>
            <tr style="background:var(--panel)">
              <td style="color:#a0b4c0;font-weight:700">Ratio BBL / TM Aire</td>
              <td class="calc-cell" style="color:#a0b4c0">${fmt(q.bbl60F / q.tmAir, 6)}</td>
              <td style="color:var(--muted);font-size:11px">BBL/MT</td>
              <td style="color:var(--muted);font-size:11px">Factor de conversión</td>
            </tr>
            ` : `
            <tr>
              <td colspan="4" style="text-align:center;padding:20px;color:var(--muted);font-size:12px">
                Complete temperatura, API y BS&W en los tanques o en "Propiedades para Conversión" para calcular las cantidades.
              </td>
            </tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Notas</div>
      <textarea class="field-textarea" style="width:100%;min-height:80px" placeholder="Observaciones de medición..." data-action="save-field" data-ctx="${ctx}" data-field="notes">${d.notes||''}</textarea>
    </div>`;
}

// ===== MODULE: VEF =====
function buildVEF(d, ctx) {
  const vefVal = calcVEF(d.shoreGSV, d.vesselGSV);
  const vefNum = parseFloat(vefVal);
  let criteria = '', criteriaClass = '';
  if (vefVal) {
    if (vefNum >= 0.998 && vefNum <= 1.002) { criteria = '✔ Dentro de criterio MPMS 17.9 (±0.2%)'; criteriaClass = 'ok'; }
    else { criteria = '⚠ Fuera de criterio MPMS 17.9 (±0.2%) — revisar'; criteriaClass = 'warn'; }
  }
  const voyages = d.voyages || [];

  return `
    <div class="module-title">⚖️ VEF — Vessel Experience Factor</div>
    <div class="module-subtitle">MPMS 17.9 — Factor de experiencia del buque para reconciliación de figuras</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div>
        <div class="card">
          <div class="card-title">Figuras del Viaje</div>
          <div class="vef-grid" style="grid-template-columns:1fr 1fr">
            <div class="vef-figure">
              <div class="vef-figure-lbl">GSV Tierra (m³)</div>
              <input class="tbl-input" style="font-size:18px;font-weight:700;text-align:center" type="number" step="0.001" value="${d.shoreGSV||''}" placeholder="0.000" data-action="save-field" data-ctx="${ctx}" data-field="shoreGSV" id="vef-shore">
            </div>
            <div class="vef-figure">
              <div class="vef-figure-lbl">GSV Buque (m³)</div>
              <input class="tbl-input" style="font-size:18px;font-weight:700;text-align:center" type="number" step="0.001" value="${d.vesselGSV||''}" placeholder="0.000" data-action="save-field" data-ctx="${ctx}" data-field="vesselGSV" id="vef-vessel">
            </div>
          </div>
          <div class="vef-summary" style="margin-top:12px">
            <div class="vef-label">VEF Calculado</div>
            <div class="vef-result" id="vef-result">${vefVal || '—'}</div>
            ${criteria ? `<div class="vef-criteria ${criteriaClass}">${criteria}</div>` : ''}
          </div>
        </div>
        <div class="card">
          <div class="card-title">Notas</div>
          <textarea class="field-textarea" style="width:100%;min-height:80px" placeholder="Observaciones VEF..." data-action="save-field" data-ctx="${ctx}" data-field="notes">${d.notes||''}</textarea>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Histórico de Viajes</div>
        <div style="margin-bottom:10px;display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;align-items:end">
          <div class="field"><label class="field-label">Viaje</label><input class="field-input" id="vef-h-voyage" placeholder="Ej: V-001"></div>
          <div class="field"><label class="field-label">GSV Tierra</label><input class="field-input" id="vef-h-shore" type="number" step="0.001"></div>
          <div class="field"><label class="field-label">GSV Buque</label><input class="field-input" id="vef-h-vessel" type="number" step="0.001"></div>
          <button class="btn btn-secondary" data-action="vef-add-voyage" data-ctx="${ctx}">+</button>
        </div>
        <div class="tbl-wrap vef-history">
          <table>
            <thead><tr><th>Viaje</th><th>GSV Tierra</th><th>GSV Buque</th><th>VEF</th><th></th></tr></thead>
            <tbody>
              ${voyages.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:16px">Sin viajes previos</td></tr>' : ''}
              ${voyages.map((v,i) => {
                const vf = calcVEF(v.shore, v.vessel);
                return `<tr>
                  <td>${v.voyage}</td>
                  <td class="calc-cell">${parseFloat(v.shore).toFixed(3)}</td>
                  <td class="calc-cell">${parseFloat(v.vessel).toFixed(3)}</td>
                  <td class="calc-cell">${vf}</td>
                  <td><button class="btn btn-ghost btn-icon" data-action="vef-rm-voyage" data-ctx="${ctx}" data-idx="${i}">✕</button></td>
                </tr>`;
              }).join('')}
              ${voyages.length > 1 ? `<tr class="total-row"><td>PROMEDIO</td><td></td><td></td><td>${(voyages.reduce((s,v)=>s+(parseFloat(calcVEF(v.shore,v.vessel))||0),0)/voyages.length).toFixed(4)}</td><td></td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

// ===== MODULE: TIME LOG =====
function buildTimeLog(d, ctx) {
  const events = d.events || [];
  const typeColors = { start:'#3d6b45', stop:'var(--red)', resume:'#2a6b5a', complete:'var(--sea)', note:'var(--steel)' };
  const typeLabels = { start:'Inicio Bombeo', stop:'Parada', resume:'Reanuda', complete:'Completado', note:'Nota' };

  return `
    <div class="module-title">⏱️ Time Log</div>
    <div class="module-subtitle">Registro cronológico de eventos de la operación</div>
    <div style="display:grid;grid-template-columns:1fr 360px;gap:20px">
      <div>
        <div class="card">
          <div class="card-title">Agregar Evento</div>
          <div class="form-row">
            <div class="field">
              <label class="field-label">Fecha y Hora</label>
              <input class="field-input" type="datetime-local" id="tl-datetime">
            </div>
            <div class="field">
              <label class="field-label">Tipo de evento</label>
              <select class="field-select" id="tl-type">
                ${Object.entries(typeLabels).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label class="field-label">Descripción</label>
              <input class="field-input" id="tl-desc" placeholder="Descripción del evento...">
            </div>
            <div class="field">
              <label class="field-label">Caudal (m³/h)</label>
              <input class="field-input" type="number" id="tl-rate" placeholder="0.0">
            </div>
          </div>
          <button class="btn btn-primary" data-action="tl-add-event" data-ctx="${ctx}">Registrar Evento</button>
        </div>
        <div class="card">
          <div class="card-title">Notas</div>
          <textarea class="field-textarea" style="width:100%;min-height:80px" placeholder="Observaciones generales..." data-action="save-field" data-ctx="${ctx}" data-field="notes">${d.notes||''}</textarea>
        </div>
      </div>
      <div class="card" style="padding-right:12px">
        <div class="card-title">Línea de tiempo</div>
        ${events.length === 0 ? '<div style="color:var(--muted);font-size:12px;text-align:center;padding:20px">Sin eventos registrados</div>' : ''}
        <div class="event-timeline">
          ${events.map((e,i) => `
            <div class="event-item type-${e.type}">
              <div class="event-card">
                <div class="event-header">
                  <span class="event-time">${e.datetime ? new Date(e.datetime).toLocaleString('es',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : ''}</span>
                  <span class="event-type-badge" style="background:${typeColors[e.type]}22;color:${typeColors[e.type]}">${typeLabels[e.type]||e.type}</span>
                  ${e.rate ? `<span class="event-pumping">${e.rate} m³/h</span>` : ''}
                  <button class="event-del" data-action="tl-rm-event" data-ctx="${ctx}" data-idx="${i}">✕</button>
                </div>
                ${e.desc ? `<div class="event-desc">${e.desc}</div>` : ''}
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

// ===== MODULE: DISCHARGE RECORD =====
function buildDischargeRecord(d, ctx) {
  const log = d.pumpLog || [];
  const totalQty = log.reduce((s,r) => s + (parseFloat(r.qty)||0), 0);
  return `
    <div class="module-title">📋 Vessel Discharge Record</div>
    <div class="module-subtitle">Registro de descarga — cantidades y flujo de bombeo</div>
    <div class="card">
      <div class="card-title">Datos B/L (Bill of Lading)</div>
      <div class="form-row form-row-3">
        <div class="field">
          <label class="field-label">Cantidad B/L (m³)</label>
          <input class="field-input" type="number" step="0.001" value="${d.bl?.qty||''}" placeholder="0.000" data-action="save-nested" data-ctx="${ctx}" data-obj="bl" data-field="qty">
        </div>
        <div class="field">
          <label class="field-label">API @60°F</label>
          <input class="field-input" type="number" step="0.1" value="${d.bl?.api||''}" data-action="save-nested" data-ctx="${ctx}" data-obj="bl" data-field="api">
        </div>
        <div class="field">
          <label class="field-label">BS&W (%)</label>
          <input class="field-input" type="number" step="0.01" value="${d.bl?.bsw||''}" placeholder="0.00" data-action="save-nested" data-ctx="${ctx}" data-obj="bl" data-field="bsw">
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Registro de Bombeo</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr auto;gap:8px;align-items:end;margin-bottom:12px">
        <div class="field"><label class="field-label">Hora</label><input class="field-input" type="time" id="dr-time"></div>
        <div class="field"><label class="field-label">Caudal (m³/h)</label><input class="field-input" type="number" id="dr-rate" step="0.1" placeholder="0.0"></div>
        <div class="field"><label class="field-label">Presión (bar)</label><input class="field-input" type="number" id="dr-pressure" step="0.1" placeholder="0.0"></div>
        <div class="field"><label class="field-label">Cantidad acum. (m³)</label><input class="field-input" type="number" id="dr-qty" step="0.001" placeholder="0.000"></div>
        <button class="btn btn-secondary" data-action="dr-add-row" data-ctx="${ctx}">+</button>
      </div>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Hora</th><th>Caudal (m³/h)</th><th>Presión (bar)</th><th>Cant. Acum. (m³)</th><th></th></tr></thead>
          <tbody>
            ${log.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:16px">Sin registros</td></tr>' : ''}
            ${log.map((r,i) => `<tr>
              <td>${r.time}</td>
              <td class="calc-cell">${r.rate}</td>
              <td class="calc-cell">${r.pressure}</td>
              <td class="calc-cell">${r.qty}</td>
              <td><button class="btn btn-ghost btn-icon" data-action="dr-rm-row" data-ctx="${ctx}" data-idx="${i}">✕</button></td>
            </tr>`).join('')}
            ${log.length > 0 ? `<tr class="total-row"><td>TOTAL ACUMULADO</td><td></td><td></td><td>${totalQty.toFixed(3)}</td><td></td></tr>` : ''}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Notas</div>
      <textarea class="field-textarea" style="width:100%;min-height:80px" placeholder="Observaciones de descarga..." data-action="save-field" data-ctx="${ctx}" data-field="notes">${d.notes||''}</textarea>
    </div>`;
}

// ===== MODULE: SLOPS =====
function buildSlops(d, ctx) {
  return `
    <div class="module-title">🪣 Slops</div>
    <div class="module-subtitle">Medición de residuos / slops antes y después de la operación</div>
    <div class="slops-grid">
      ${['before','after'].map(phase => {
        const tanks = (d[phase]?.tanks || [{ name:'Slop P', ullage:'', temp:'', api:'', tov:'' },{ name:'Slop S', ullage:'', temp:'', api:'', tov:'' }]);
        return `
          <div class="card">
            <div class="card-title">${phase === 'before' ? '📥 Antes (Before)' : '📤 Después (After)'}</div>
            <div class="tbl-wrap">
              <table>
                <thead><tr><th>Tanque</th><th>Ullage (m)</th><th>Temp (°C)</th><th>API</th><th>TOV (m³)</th></tr></thead>
                <tbody>
                  ${tanks.map((t,i) => `<tr>
                    <td>${t.name}</td>
                    <td><input class="tbl-input" type="number" step="0.001" value="${t.ullage||''}" data-action="save-slop" data-ctx="${ctx}" data-phase="${phase}" data-idx="${i}" data-field="ullage"></td>
                    <td><input class="tbl-input" type="number" step="0.1" value="${t.temp||''}" data-action="save-slop" data-ctx="${ctx}" data-phase="${phase}" data-idx="${i}" data-field="temp"></td>
                    <td><input class="tbl-input" type="number" step="0.1" value="${t.api||''}" data-action="save-slop" data-ctx="${ctx}" data-phase="${phase}" data-idx="${i}" data-field="api"></td>
                    <td><input class="tbl-input" type="number" step="0.001" value="${t.tov||''}" data-action="save-slop" data-ctx="${ctx}" data-phase="${phase}" data-idx="${i}" data-field="tov"></td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>`;
      }).join('')}
    </div>
    <div class="card" style="margin-top:16px">
      <div class="card-title">Notas</div>
      <textarea class="field-textarea" style="width:100%;min-height:80px" data-action="save-field" data-ctx="${ctx}" data-field="notes">${d.notes||''}</textarea>
    </div>`;
}

// ===== MODULE: CHECKLIST =====
function buildChecklist(d, mod, ctx) {
  const template = mod.includes('terminal') ? CHECKLIST_TERMINAL
                 : mod.includes('alijador') ? CHECKLIST_LIGHTER
                 : CHECKLIST_VESSEL;
  const sections = d.items && d.items.length ? d.items : template.map(s => ({
    section: s.section,
    items: s.items.map(text => ({ text, val: '', comment: '' })),
  }));

  const total = sections.reduce((s, sec) => s + sec.items.length, 0);
  const done  = sections.reduce((s, sec) => s + sec.items.filter(i => i.val).length, 0);
  const pct = total ? Math.round(done / total * 100) : 0;

  return `
    <div class="module-title">✅ ${MODULE_META[mod]?.label || 'Checklist'}</div>
    <div class="module-subtitle">Auditoría de operación — ${done}/${total} ítems completados (${pct}%)</div>
    <div style="background:var(--line2);height:6px;border-radius:3px;margin-bottom:20px">
      <div style="background:var(--amber);height:100%;border-radius:3px;width:${pct}%;transition:width .3s"></div>
    </div>
    <div class="card">
      <div class="form-row">
        <div class="field">
          <label class="field-label">Inspector / Auditor</label>
          <input class="field-input" value="${d.inspector||''}" placeholder="Nombre del inspector" data-action="save-field" data-ctx="${ctx}" data-field="inspector">
        </div>
        <div class="field">
          <label class="field-label">Fecha de auditoría</label>
          <input class="field-input" type="date" value="${d.date||''}" data-action="save-field" data-ctx="${ctx}" data-field="date">
        </div>
      </div>
    </div>
    ${sections.map((sec, si) => `
      <div class="card">
        <div class="checklist-section-title">${sec.section}</div>
        ${sec.items.map((item, ii) => `
          <div class="checklist-item">
            <div class="checklist-item-text">${item.text}</div>
            <div class="checklist-options">
              <button class="chk-opt yes ${item.val==='yes'?'sel':''}" data-action="chk-set" data-ctx="${ctx}" data-si="${si}" data-ii="${ii}" data-val="yes">S</button>
              <button class="chk-opt no ${item.val==='no'?'sel':''}" data-action="chk-set" data-ctx="${ctx}" data-si="${si}" data-ii="${ii}" data-val="no">N</button>
              <button class="chk-opt na ${item.val==='na'?'sel':''}" data-action="chk-set" data-ctx="${ctx}" data-si="${si}" data-ii="${ii}" data-val="na">N/A</button>
            </div>
            ${item.val === 'no' ? `
              <div class="checklist-comment-field" style="width:100%;margin-top:4px">
                <input class="field-input" style="font-size:11px" placeholder="Comentario / corrección..." value="${item.comment||''}" data-action="chk-comment" data-ctx="${ctx}" data-si="${si}" data-ii="${ii}">
              </div>` : ''}
          </div>`).join('')}
      </div>`).join('')}`;
}

// ===== DATA SAVE HELPERS =====
function getModuleRef(ctx) {
  const op = getOp(ctx.opId);
  if (!op) return null;
  if (ctx.alijoIdx !== undefined) {
    const alijo = op.alijos[ctx.alijoIdx];
    return { op, data: alijo.modules[ctx.mod], save: () => saveOp(op) };
  }
  return { op, data: op.modules[ctx.mod], save: () => saveOp(op) };
}

function saveField(ctxStr, field, value) {
  const ctx = decodeCtx(ctxStr);
  const ref = getModuleRef(ctx);
  if (!ref) return;
  ref.data[field] = value;
  ref.save();
}

function saveTank(ctxStr, tankIdx, field, value) {
  const ctx = decodeCtx(ctxStr);
  const ref = getModuleRef(ctx);
  if (!ref) return;
  ref.data.tanks[tankIdx][field] = value;
  ref.save();
  updateUllageTotals(ref.data.tanks);
}

function updateUllageTotals(tanks) {
  const fields = ['tov','gov','gsv','fw'];
  fields.forEach(f => {
    const total = ullageTotal(tanks, f);
    // totals row is the last row, find and update
  });
}

function saveSlop(ctxStr, phase, idx, field, value) {
  const ctx = decodeCtx(ctxStr);
  const ref = getModuleRef(ctx);
  if (!ref) return;
  if (!ref.data[phase]) ref.data[phase] = { tanks: [] };
  if (!ref.data[phase].tanks[idx]) ref.data[phase].tanks[idx] = {};
  ref.data[phase].tanks[idx][field] = value;
  ref.save();
}

function saveNested(ctxStr, obj, field, value) {
  const ctx = decodeCtx(ctxStr);
  const ref = getModuleRef(ctx);
  if (!ref) return;
  if (!ref.data[obj]) ref.data[obj] = {};
  ref.data[obj][field] = value;
  ref.save();
}

// ===== EVENT HANDLERS =====
function initEvents() {
  document.addEventListener('click', handleClick);
  document.addEventListener('change', handleChange);
  document.addEventListener('input', handleInput);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && document.activeElement?.id === 'chat-input') {
      e.preventDefault();
      chatSend();
    }
  });
}

function handleClick(e) {
  // Close modal only if clicking the overlay itself, not the modal panel
  if (e.target.dataset.action === 'close-modal-bg' && e.target.closest('[data-stop-propagation]')) return;
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;

  if (a === 'go-home') { state.view='home'; state.currentOpId=null; render(); }
  else if (a === 'open-consultor') { state.view='consultor'; state.currentOpId=null; render(); }
  else if (a === 'chat-send') { chatSend(); }
  else if (a === 'chat-clear') { state.chatHistory=[]; state.chatLoading=false; render(); }
  else if (a === 'chat-suggest') { const q=el.dataset.q; if(q){ if(!state.chatHistory)state.chatHistory=[]; const inp=document.getElementById('chat-input'); if(inp){inp.value=q;} else {state.chatHistory.push({role:'user',content:q});state.chatLoading=true;render();scrollChatToBottom();chatSend.call({_preset:q});} } }
  else if (a === 'open-new-op') { state.modal='new-op-1'; state.modalData={}; render(); }
  else if (a === 'open-op') { state.view='op'; state.currentOpId=el.dataset.id; state.currentModule=null; state.currentAlijoIdx=0; render(); }
  else if (a === 'close-modal') { state.modal=null; render(); }
  else if (a === 'close-modal-bg') { state.modal=null; render(); }
  else if (a === 'modal-next') handleModalNext();
  else if (a === 'modal-back') { state.modal='new-op-1'; render(); }
  else if (a === 'modal-create') handleModalCreate();
  else if (a === 'select-type') { state.modalData.opType=el.dataset.type; render(); }
  else if (a === 'add-client') addClient();
  else if (a === 'remove-client') removeClient(parseInt(el.dataset.idx));
  else if (a === 'switch-module') { state.currentModule=el.dataset.module; render(); }
  else if (a === 'switch-alijo') { state.currentAlijoIdx=parseInt(el.dataset.idx); render(); }
  else if (a === 'add-alijo') addAlijo();
  else if (a === 'km-add-att') kmAddAtt(el.dataset.ctx);
  else if (a === 'km-rm-att') kmRmAtt(el.dataset.ctx, parseInt(el.dataset.idx));
  else if (a === 'km-add-topic') kmAddTopic(el.dataset.ctx);
  else if (a === 'km-rm-topic') kmRmTopic(el.dataset.ctx, parseInt(el.dataset.idx));
  else if (a === 'tl-add-event') tlAddEvent(el.dataset.ctx);
  else if (a === 'tl-rm-event') tlRmEvent(el.dataset.ctx, parseInt(el.dataset.idx));
  else if (a === 'vef-add-voyage') vefAddVoyage(el.dataset.ctx);
  else if (a === 'vef-rm-voyage') vefRmVoyage(el.dataset.ctx, parseInt(el.dataset.idx));
  else if (a === 'dr-add-row') drAddRow(el.dataset.ctx);
  else if (a === 'dr-rm-row') drRmRow(el.dataset.ctx, parseInt(el.dataset.idx));
  else if (a === 'chk-set') chkSet(el.dataset.ctx, parseInt(el.dataset.si), parseInt(el.dataset.ii), el.dataset.val);
  else if (a === 'delete-op') deleteOp(el.dataset.id);
  else if (a === 'edit-op') editOp(el.dataset.id);
  else if (a === 'save-alijo-vessel-name' || a === 'save-alijo-vessel-imo') {/* handled by input */}
}

function handleChange(e) {
  const el = e.target;
  const a = el.dataset.action;
  if (!a) return;
  if (a === 'save-field') saveField(el.dataset.ctx, el.dataset.field, el.value);
  else if (a === 'save-tank') saveTank(el.dataset.ctx, parseInt(el.dataset.tank), el.dataset.field, el.value);
  else if (a === 'save-slop') saveSlop(el.dataset.ctx, el.dataset.phase, parseInt(el.dataset.idx), el.dataset.field, el.value);
  else if (a === 'save-nested') saveNested(el.dataset.ctx, el.dataset.obj, el.dataset.field, el.value);
  else if (a === 'chk-comment') chkComment(el.dataset.ctx, parseInt(el.dataset.si), parseInt(el.dataset.ii), el.value);
}

function handleInput(e) {
  const el = e.target;
  const a = el.dataset.action;
  if (a === 'save-field') saveField(el.dataset.ctx, el.dataset.field, el.value);
  else if (a === 'save-tank') saveTank(el.dataset.ctx, parseInt(el.dataset.tank), el.dataset.field, el.value);
  else if (a === 'save-slop') saveSlop(el.dataset.ctx, el.dataset.phase, parseInt(el.dataset.idx), el.dataset.field, el.value);
  else if (a === 'save-nested') saveNested(el.dataset.ctx, el.dataset.obj, el.dataset.field, el.value);

  // Live VEF calculation
  if (el.id === 'vef-shore' || el.id === 'vef-vessel') {
    const shore = parseFloat(document.getElementById('vef-shore')?.value || 0);
    const vessel = parseFloat(document.getElementById('vef-vessel')?.value || 0);
    const result = document.getElementById('vef-result');
    if (result) result.textContent = calcVEF(shore, vessel) || '—';
  }

  // Alijo vessel fields
  if (a === 'save-alijo-vessel-name' || a === 'save-alijo-vessel-imo') {
    const idx = parseInt(el.dataset.idx);
    const op = getOp(state.currentOpId);
    if (op && op.alijos[idx]) {
      op.alijos[idx].vessel[a === 'save-alijo-vessel-name' ? 'name' : 'imo'] = el.value;
      saveOp(op);
    }
  }
}

// Country change → auto code preview
document.addEventListener('change', function(e) {
  if (e.target.id === 'f-country') {
    const country = e.target.value;
    const counters = loadCounters();
    const prefix = country ? COUNTRY_PREFIXES[country].code : '';
    const next = country ? (counters[country] || 0) + 1 : '';
    const codeEl = document.getElementById('f-opcode');
    if (codeEl && prefix) codeEl.value = `${prefix}-${String(next).padStart(3,'0')} (preview)`;
  }
});

function onProductChange() {
  const val = document.getElementById('f-product')?.value;
  const field = document.getElementById('crude-name-field');
  if (field) field.style.display = val === 'crude' ? '' : 'none';
}

// ===== MODAL ACTIONS =====
function handleModalNext() {
  const d = state.modalData;
  d.country = document.getElementById('f-country')?.value;
  d.vesselName = document.getElementById('f-vessel')?.value;
  d.voyage = document.getElementById('f-voyage')?.value;
  d.imo = document.getElementById('f-imo')?.value;
  d.product = document.getElementById('f-product')?.value;
  d.crudeName = document.getElementById('f-crude-name')?.value;
  d.port = document.getElementById('f-port')?.value;
  d.terminal = document.getElementById('f-terminal')?.value;
  d.inspectionCompany = document.getElementById('f-inscomp')?.value;

  // Collect clients
  const names = document.querySelectorAll('.client-name');
  const refs = document.querySelectorAll('.client-ref');
  d.clients = Array.from(names).map((n, i) => ({ name: n.value, ref: refs[i]?.value || '' })).filter(c => c.name);

  if (!d.country || !d.vesselName || !d.product || !d.port) {
    alert('Por favor complete los campos obligatorios: País, Buque, Producto y Puerto.');
    return;
  }
  if (!d.clients || d.clients.length === 0) {
    alert('Agregue al menos un cliente.');
    return;
  }

  // Generate code
  d.code = nextCode(d.country);
  state.modal = 'new-op-2';
  render();
}

function handleModalCreate() {
  const d = state.modalData;
  if (!d.opType) { alert('Seleccione el tipo de operación.'); return; }

  const op = {
    id: newOpId(),
    code: d.code,
    country: d.country,
    vessel: { name: d.vesselName, voyage: d.voyage, imo: d.imo },
    product: { type: d.product, crudeName: d.crudeName || '' },
    clients: d.clients,
    port: d.port,
    terminal: d.terminal || '',
    inspectionCompany: d.inspectionCompany || '',
    type: d.opType,
    createdAt: Date.now(),
    modules: initModuleData(d.opType),
    alijos: d.opType === 'alije' ? [initAlijo()] : [],
  };

  saveOp(op);
  state.modal = null;
  state.view = 'op';
  state.currentOpId = op.id;
  state.currentModule = null;
  state.currentAlijoIdx = 0;
  render();
}

function addClient() {
  const container = document.getElementById('clients-container');
  if (!container) return;
  const idx = container.querySelectorAll('.client-block').length;
  const div = document.createElement('div');
  div.innerHTML = buildClientBlock({ name: '', ref: '' }, idx);
  container.appendChild(div.firstElementChild);
}

function removeClient(idx) {
  const blocks = document.querySelectorAll('.client-block');
  if (blocks[idx]) blocks[idx].remove();
  // Re-index
  document.querySelectorAll('.client-block').forEach((b, i) => {
    b.dataset.clientIdx = i;
    b.querySelector('.client-block-title').textContent = `Cliente ${i + 1}`;
    const rmBtn = b.querySelector('[data-action="remove-client"]');
    if (i === 0) { if (rmBtn) rmBtn.remove(); }
    else if (!rmBtn) {
      const hdr = b.querySelector('.client-block-header');
      const btn = document.createElement('button');
      btn.className = 'btn btn-ghost btn-sm';
      btn.dataset.action = 'remove-client';
      btn.dataset.idx = i;
      btn.textContent = '✕ Eliminar';
      hdr.appendChild(btn);
    }
    if (rmBtn) rmBtn.dataset.idx = i;
    b.querySelectorAll('.client-name, .client-ref').forEach(inp => inp.dataset.idx = i);
  });
}

// ===== KM HELPERS =====
function kmAddAtt(ctx) {
  const name = document.getElementById('km-att-name')?.value.trim();
  const company = document.getElementById('km-att-company')?.value.trim();
  const role = document.getElementById('km-att-role')?.value.trim();
  if (!name) return;
  const c = decodeCtx(ctx);
  const ref = getModuleRef(c);
  if (!ref) return;
  if (!ref.data.attendees) ref.data.attendees = [];
  ref.data.attendees.push({ name, company, role });
  ref.save();
  render();
}
function kmRmAtt(ctx, idx) {
  const c = decodeCtx(ctx);
  const ref = getModuleRef(c);
  if (!ref) return;
  ref.data.attendees.splice(idx, 1);
  ref.save(); render();
}
function kmAddTopic(ctx) {
  const val = document.getElementById('km-topic-input')?.value.trim();
  if (!val) return;
  const c = decodeCtx(ctx);
  const ref = getModuleRef(c);
  if (!ref) return;
  if (!ref.data.topics) ref.data.topics = [];
  ref.data.topics.push(val);
  ref.save(); render();
}
function kmRmTopic(ctx, idx) {
  const c = decodeCtx(ctx);
  const ref = getModuleRef(c);
  if (!ref) return;
  ref.data.topics.splice(idx, 1);
  ref.save(); render();
}

// ===== TIME LOG =====
function tlAddEvent(ctx) {
  const dt = document.getElementById('tl-datetime')?.value;
  const type = document.getElementById('tl-type')?.value;
  const desc = document.getElementById('tl-desc')?.value.trim();
  const rate = document.getElementById('tl-rate')?.value;
  const c = decodeCtx(ctx);
  const ref = getModuleRef(c);
  if (!ref) return;
  if (!ref.data.events) ref.data.events = [];
  ref.data.events.push({ datetime: dt, type, desc, rate });
  ref.data.events.sort((a,b) => (a.datetime||'') < (b.datetime||'') ? -1 : 1);
  ref.save(); render();
}
function tlRmEvent(ctx, idx) {
  const c = decodeCtx(ctx);
  const ref = getModuleRef(c);
  if (!ref) return;
  ref.data.events.splice(idx, 1);
  ref.save(); render();
}

// ===== VEF =====
function vefAddVoyage(ctx) {
  const voyage = document.getElementById('vef-h-voyage')?.value.trim();
  const shore  = document.getElementById('vef-h-shore')?.value;
  const vessel = document.getElementById('vef-h-vessel')?.value;
  if (!voyage || !shore || !vessel) return;
  const c = decodeCtx(ctx);
  const ref = getModuleRef(c);
  if (!ref) return;
  if (!ref.data.voyages) ref.data.voyages = [];
  ref.data.voyages.push({ voyage, shore, vessel });
  ref.save(); render();
}
function vefRmVoyage(ctx, idx) {
  const c = decodeCtx(ctx);
  const ref = getModuleRef(c);
  if (!ref) return;
  ref.data.voyages.splice(idx, 1);
  ref.save(); render();
}

// ===== DISCHARGE RECORD =====
function drAddRow(ctx) {
  const time = document.getElementById('dr-time')?.value;
  const rate = document.getElementById('dr-rate')?.value;
  const pressure = document.getElementById('dr-pressure')?.value;
  const qty = document.getElementById('dr-qty')?.value;
  if (!time) return;
  const c = decodeCtx(ctx);
  const ref = getModuleRef(c);
  if (!ref) return;
  if (!ref.data.pumpLog) ref.data.pumpLog = [];
  ref.data.pumpLog.push({ time, rate, pressure, qty });
  ref.data.pumpLog.sort((a,b) => a.time < b.time ? -1 : 1);
  ref.save(); render();
}
function drRmRow(ctx, idx) {
  const c = decodeCtx(ctx);
  const ref = getModuleRef(c);
  if (!ref) return;
  ref.data.pumpLog.splice(idx, 1);
  ref.save(); render();
}

// ===== CHECKLIST =====
function chkSet(ctx, si, ii, val) {
  const c = decodeCtx(ctx);
  const ref = getModuleRef(c);
  if (!ref) return;
  if (!ref.data.items) return;
  const current = ref.data.items[si]?.items[ii]?.val;
  ref.data.items[si].items[ii].val = current === val ? '' : val;
  ref.save(); render();
}
function chkComment(ctx, si, ii, val) {
  const c = decodeCtx(ctx);
  const ref = getModuleRef(c);
  if (!ref) return;
  if (ref.data.items?.[si]?.items?.[ii]) ref.data.items[si].items[ii].comment = val;
  ref.save();
}

// ===== ALIJO =====
function addAlijo() {
  const op = getOp(state.currentOpId);
  if (!op) return;
  if (!op.alijos) op.alijos = [];
  op.alijos.push(initAlijo());
  saveOp(op);
  state.currentAlijoIdx = op.alijos.length - 1;
  render();
}

// ===== OP MANAGEMENT =====
function deleteOp(id) {
  if (!confirm('¿Eliminar esta operación? Esta acción no se puede deshacer.')) return;
  const ops = loadOps().filter(o => o.id !== id);
  saveOps(ops);
  state.view = 'home';
  state.currentOpId = null;
  render();
}

function editOp(id) {
  const op = getOp(id);
  if (!op) return;
  state.modal = 'new-op-1';
  state.modalData = {
    editId: id,
    country: op.country,
    code: op.code,
    vesselName: op.vessel.name,
    voyage: op.vessel.voyage,
    imo: op.vessel.imo,
    product: op.product.type,
    crudeName: op.product.crudeName,
    port: op.port,
    terminal: op.terminal,
    inspectionCompany: op.inspectionCompany,
    clients: op.clients || [],
    opType: op.type,
  };
  render();
}

// ===== INIT =====
render();
initEvents();
