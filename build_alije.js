const xlsx = require('./node_modules/xlsx');
const XLSX = xlsx;

// ── DATA ──────────────────────────────────────────────────────────────────────
const OP = {
  ref:         '427-26-00332-A',
  clientRef:   'P-038/2026 & 260413-HLAURA-125859',
  product:     'MERO CRUDE OIL',
  port:        'CONCEPCION BAY, CHILE',
  customer:    'ENAP REFINERIAS S.A. & TOTSA',
  dateStart:   'APRIL 29, 2026',
  dateEnd:     'APRIL 30, 2026',
  inspector:   'AMSPEC CHILE S.A.',
  surveyorCS:  'LUIS VENEGAS M.',
  surveyorCT:  'REINALDO MONTECINOS P.',
};

const CS = { // COPPER SPIRIT (mother / discharging)
  name: 'M/T COPPER SPIRIT', voyage: 76,
  // Before discharge at Talcahuano
  govBefore:  1012903.628,  // Bbls
  gsvBefore:  1001133.24,   // Bbls GSV @60°F
  gsvBeforeVEF: 1001934.79, // Bbls with VEF
  tcvBefore:  1013401.68,   // Bbls (TOV)
  fwBefore:   498.052,      // Bbls free water
  draftFwdBefore: 16.2, draftAftBefore: 16.2,
  apiB: 29.5, tempFB: 86.1, densB: 0.87841,
  // After discharge at Talcahuano
  govAfter:   701581.732,   // Bbls
  gsvAfter:   693732.54,    // Bbls GSV @60°F
  tcvAfter:   701581.732,
  fwAfter:    0,
  draftFwdAfter: 12.6, draftAftAfter: 12.6,
  apiA: 29.5, tempFA: 85.2, densA: 0.87840,
  // Delivered
  gsvDelivered:    307400.70,    // Bbls WITHOUT VEF (OTI)
  gsvDeliveredVEF: 307646.817,   // Bbls WITH VEF (AmSpec)
  nsvDelivered:    306386.278,   // Bbls WITHOUT VEF
  nsvDeliveredVEF: 306631.593,   // Bbls WITH VEF (AmSpec)
  tcvDelivered:    307898.75,    // Bbls TCV
  mtGrossNoVEF:  42857.805,
  mtGrossVEF:    42892.119,
  mtNetNoVEF:    42716.374,
  mtNetVEF:      42750.575,
  m3GsvNoVEF:    48872.796,
  m3GsvVEF:      48911.926,
  m3NsvNoVEF:    48733.024,
  m3NsvVEF:      48750.516,
  apiDelivered: 29.5, bswDelivered: 0.26,
  apiVEF: 29.3, bswVEF: 0.33,
  vefFactor: 0.9992,
  fwDelivered: 498.05, // Bbls FW delivered
};

const CT = { // CABO TAMAR (lighter / receiving)
  name: 'M/T CABO TAMAR', voyage: 87,
  // OBQ before loading
  gsvOBQ: 26116.78,       // Bbls GSV @60°F (previous cargo MEDANITO)
  m3OBQ:  4152.235,
  apiOBQ: 39.4,
  // After loading
  govAfter:  311594.46,    // Bbls
  gsvAfter:  308076.30,    // Bbls GSV @60°F LOADED
  nsvAfter:  306563.88,    // Bbls NSV loaded
  tcvAfter:  311594.46,
  fwAfter:   0,
  draftFwdAfter: 10.0, draftAftAfter: 10.0,
  apiA: 29.5, tempFA: 85.4, densA: 0.87841,
  // Received
  gsvReceived: 308076.30,  // Bbls GSV loaded
  nsvReceived: 306563.88,  // Bbls NSV loaded
  tcvReceived: 311594.46,
  mtGross: 42951.998, mtNet: 42741.136,
  ltGross: 42274.23,  ltNet: 42066.696,
  m3Gsv:   48980.208, m3Nsv: 48739.752,
  gsvGal:  12939204.6, nsvGal: 12875682.96,
  apiReceived: 29.5, bswReceived: 0.33,
  vefFactor: 1.0,
};

// ── DIFFERENCES ───────────────────────────────────────────────────────────────
const diff = {
  gsvNoVEF:    CT.gsvReceived - CS.gsvDelivered,
  gsvVEF:      CT.gsvReceived - CS.gsvDeliveredVEF,
  nsvNoVEF:    CT.nsvReceived - CS.nsvDelivered,
  nsvVEF:      CT.nsvReceived - CS.nsvDeliveredVEF,
  tcv:         CT.tcvReceived - CS.tcvDelivered,
  mtGrossNoVEF: CT.mtGross - CS.mtGrossNoVEF,
  mtGrossVEF:  CT.mtGross - CS.mtGrossVEF,
  mtNetNoVEF:  CT.mtNet - CS.mtNetNoVEF,
  mtNetVEF:    CT.mtNet - CS.mtNetVEF,
  m3GsvNoVEF:  CT.m3Gsv - CS.m3GsvNoVEF,
  m3GsvVEF:    CT.m3Gsv - CS.m3GsvVEF,
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function pct(diff, base) { return base ? diff / base * 100 : 0; }

function makeWS(rows) {
  return XLSX.utils.aoa_to_sheet(rows);
}

function setColWidths(ws, widths) {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}

// ── SHEET 1: RESUMEN / ALIJE ──────────────────────────────────────────────────
function buildResumen() {
  const N = '';
  const rows = [
    ['AMSPEC CHILE S.A. - INFORME DE OPERACIÓN DE ALIJE (STS)'],
    [],
    ['NÚMERO DE REFERENCIA', OP.ref,          '', 'FECHA INICIO', OP.dateStart],
    ['REF. CLIENTE',         OP.clientRef,    '', 'FECHA TÉRMINO', OP.dateEnd],
    ['PRODUCTO',             OP.product,      '', 'PUERTO', OP.port],
    ['CLIENTE',              OP.customer],
    [],
    // ── Vessel row ──
    ['', `BUQUE MADRE (DESCARGA)`, '', '', '', `BUQUE ALIJE (CARGA)`, '', '', ''],
    ['', CS.name, '', '', '', CT.name, '', '', ''],
    ['', `VIAJE N° ${CS.voyage}`, '', '', '', `VIAJE N° ${CT.voyage}`, '', '', ''],
    [],
    // ── GSV comparison ──
    ['COMPARACIÓN DE CANTIDADES - OPERACIÓN STS TALCAHUANO'],
    [],
    ['',          CS.name,          '',                CT.name,       'DIFERENCIA',    '%'],
    ['BARRILES',  'SIN V.E.F.',     'CON V.E.F.',      'CON V.E.F.',  'CON V.E.F.',    'CON V.E.F.'],
    ['G.S.V. @60°F',
      CS.gsvDelivered.toFixed(3),
      CS.gsvDeliveredVEF.toFixed(3),
      CT.gsvReceived.toFixed(3),
      diff.gsvVEF.toFixed(3),
      pct(diff.gsvVEF, CS.gsvDeliveredVEF).toFixed(4) + '%'],
    ['N.S.V. @60°F',
      CS.nsvDelivered.toFixed(3),
      CS.nsvDeliveredVEF.toFixed(3),
      CT.nsvReceived.toFixed(3),
      diff.nsvVEF.toFixed(3),
      pct(diff.nsvVEF, CS.nsvDeliveredVEF).toFixed(4) + '%'],
    ['T.C.V. @60°F',
      CS.tcvDelivered.toFixed(3),
      '',
      CT.tcvReceived.toFixed(3),
      diff.tcv.toFixed(3),
      pct(diff.tcv, CS.tcvDelivered).toFixed(4) + '%'],
    [],
    ['METROS CÚBICOS @60°F', 'SIN V.E.F.', 'CON V.E.F.', 'CON V.E.F.', 'DIFERENCIA', '%'],
    ['G.S.V.',
      CS.m3GsvNoVEF.toFixed(3),
      CS.m3GsvVEF.toFixed(3),
      CT.m3Gsv.toFixed(3),
      diff.m3GsvVEF.toFixed(3),
      pct(diff.m3GsvVEF, CS.m3GsvVEF).toFixed(4) + '%'],
    ['N.S.V.',
      CS.m3NsvNoVEF.toFixed(3),
      CS.m3NsvVEF.toFixed(3),
      CT.m3Nsv.toFixed(3),
      (CT.m3Nsv - CS.m3NsvVEF).toFixed(3),
      pct(CT.m3Nsv - CS.m3NsvVEF, CS.m3NsvVEF).toFixed(4) + '%'],
    [],
    ['TONELADAS MÉTRICAS (AIRE)', 'SIN V.E.F.', 'CON V.E.F.', 'CON V.E.F.', 'DIFERENCIA', '%'],
    ['T.M. BRUTA',
      CS.mtGrossNoVEF.toFixed(3),
      CS.mtGrossVEF.toFixed(3),
      CT.mtGross.toFixed(3),
      diff.mtGrossVEF.toFixed(3),
      pct(diff.mtGrossVEF, CS.mtGrossVEF).toFixed(4) + '%'],
    ['T.M. NETA',
      CS.mtNetNoVEF.toFixed(3),
      CS.mtNetVEF.toFixed(3),
      CT.mtNet.toFixed(3),
      diff.mtNetVEF.toFixed(3),
      pct(diff.mtNetVEF, CS.mtNetVEF).toFixed(4) + '%'],
    [],
    ['CALIDAD',          CS.name,        CT.name],
    ['API @60°F',        CS.apiVEF,      CT.apiReceived],
    ['BSW (%)',          CS.bswVEF,      CT.bswReceived],
    ['DENSIDAD @15°C',  CS.densB,       CT.densA],
    [],
    ['DATOS OPERACIONALES'],
    ['V.E.F. BUQUE MADRE (API 17.9)', CS.vefFactor, '',  'V.E.F. BUQUE ALIJE', CT.vefFactor],
    ['AGUA LIBRE ENTREGADA (Bbls)',    CS.fwDelivered, '', 'AGUA LIBRE RECIBIDA', 0],
    ['FECHA INICIO DESCARGA', OP.dateStart + ' 16:06', '', 'FECHA FIN DESCARGA', OP.dateEnd + ' 00:24'],
    [],
    ['OBSERVACIÓN: Conforme a procedimiento aduanero chileno, el API y BSW utilizado para el buque alije'],
    ['(MT CABO TAMAR) corresponde al análisis del buque madre (COPPER SPIRIT) a su llegada a puerto.'],
    [],
    ['FIRMADO POR'],
    [OP.surveyorCS + ' - AMSPEC CHILE', '', '', OP.surveyorCT + ' - AMSPEC CHILE'],
    ['(Copper Spirit)',                 '', '', '(Cabo Tamar)'],
  ];
  const ws = makeWS(rows);
  setColWidths(ws, [32, 18, 18, 18, 14, 12]);
  return ws;
}

// ── SHEET 2: BUQUE MADRE - COPPER SPIRIT ─────────────────────────────────────
function buildCSSheet() {
  const rows = [
    ['INFORME DE ULLAJE - BUQUE MADRE (DESCARGA)'],
    [],
    ['BUQUE',    CS.name,          '', 'VIAJE',        CS.voyage],
    ['TERMINAL', CT.name,          '', 'FECHA',        OP.dateEnd],
    ['PUERTO',   OP.port,          '', 'REF. CLIENTE', OP.clientRef],
    ['PRODUCTO', OP.product,       '', 'REF. AMSPEC',  OP.ref],
    [],
    ['ULLAJE ANTES DE DESCARGA (Talcahuano)'],
    ['',                     'CANTIDAD',       'UNIDAD'],
    ['Vol. Total Observada',  CS.tcvBefore,    'Bbls'],
    ['Agua Libre',            CS.fwBefore,     'Bbls'],
    ['Vol. Obs. Bruta (GOV)', CS.govBefore,    'Bbls'],
    ['G.S.V. @60°F',         CS.gsvBefore,    'Bbls'],
    ['G.S.V. @60°F con V.E.F.', CS.gsvBeforeVEF, 'Bbls'],
    ['M³ @15°C',             159100.09,        'm³'],
    ['M³ @60°F',             159167.435,       'm³'],
    ['Densidad @15°C',       CS.densB,         'kg/m³ (aire)'],
    ['API @60°F',            CS.apiB,          '°API'],
    ['V.E.F. (API 17.9)',    CS.vefFactor,     ''],
    ['Calado Proa/Popa',     `${CS.draftFwdBefore}m / ${CS.draftAftBefore}m`, ''],
    [],
    ['ULLAJE DESPUÉS DE DESCARGA (Talcahuano)'],
    ['',                     'CANTIDAD',       'UNIDAD'],
    ['Vol. Total Observada',  CS.tcvAfter,     'Bbls'],
    ['Agua Libre',            CS.fwAfter,      'Bbls'],
    ['Vol. Obs. Bruta (GOV)', CS.govAfter,     'Bbls'],
    ['G.S.V. @60°F',         CS.gsvAfter,     'Bbls'],
    ['M³ @60°F',             110247.975,       'm³'],
    ['Calado Proa/Popa',     `${CS.draftFwdAfter}m / ${CS.draftAftAfter}m`, ''],
    [],
    ['CANTIDADES DESCARGADAS EN TALCAHUANO'],
    ['',                         'SIN V.E.F.',              'CON V.E.F. (AmSpec)'],
    ['G.S.V. @60°F (Bbls)',      CS.gsvDelivered.toFixed(3),  CS.gsvDeliveredVEF.toFixed(3)],
    ['N.S.V. @60°F (Bbls)',      CS.nsvDelivered.toFixed(3),  CS.nsvDeliveredVEF.toFixed(3)],
    ['G.S.V. @60°F (m³)',        CS.m3GsvNoVEF.toFixed(3),    CS.m3GsvVEF.toFixed(3)],
    ['N.S.V. @60°F (m³)',        CS.m3NsvNoVEF.toFixed(3),    CS.m3NsvVEF.toFixed(3)],
    ['T.M. Bruta (aire)',         CS.mtGrossNoVEF.toFixed(3),  CS.mtGrossVEF.toFixed(3)],
    ['T.M. Neta (aire)',          CS.mtNetNoVEF.toFixed(3),    CS.mtNetVEF.toFixed(3)],
    ['API @60°F',                CS.apiDelivered,             CS.apiVEF],
    ['BSW (%)',                  CS.bswDelivered,             CS.bswVEF],
    [],
    ['REGISTRO DE DESCARGA'],
    ['Inició descarga', OP.dateStart + ' 16:06'],
    ['Terminó descarga', OP.dateEnd + ' 00:24'],
    ['Volumen operacional descargado', '~49,571 m³ (dato de nave)'],
    [],
    [OP.surveyorCS],
    ['AMSPEC CHILE S.A.'],
    ['INSPECTOR (Copper Spirit)'],
  ];
  const ws = makeWS(rows);
  setColWidths(ws, [32, 22, 22]);
  return ws;
}

// ── SHEET 3: BUQUE ALIJE - CABO TAMAR ────────────────────────────────────────
function buildCTSheet() {
  const rows = [
    ['INFORME DE ULLAJE - BUQUE ALIJE (CARGA)'],
    [],
    ['BUQUE',    CT.name,          '', 'VIAJE',        CT.voyage],
    ['TERMINAL', CS.name,          '', 'FECHA',        OP.dateEnd],
    ['PUERTO',   OP.port,          '', 'REF. CLIENTE', OP.clientRef],
    ['PRODUCTO', OP.product,       '', 'REF. AMSPEC',  OP.ref],
    [],
    ['OBQ - CANTIDAD EN BORDO ANTES DE CARGA (solo referencia)'],
    ['',                      'CANTIDAD',     'UNIDAD'],
    ['G.S.V. @60°F',          CT.gsvOBQ,     'Bbls'],
    ['G.S.V. @60°F',          CT.m3OBQ,      'm³'],
    ['Producto anterior',      'MEDANITO CRUDE OIL', ''],
    ['API @60°F (carga ant.)', CT.apiOBQ,    '°API'],
    [],
    ['ULLAJE DESPUÉS DE CARGA'],
    ['',                      'CANTIDAD',     'UNIDAD'],
    ['Vol. Total Observada',   CT.tcvAfter,   'Bbls'],
    ['Agua Libre',             CT.fwAfter,    'Bbls'],
    ['G.O.V.',                 CT.govAfter,   'Bbls'],
    ['G.S.V. @60°F',          CT.gsvAfter,   'Bbls'],
    ['Calado Proa/Popa',      `${CT.draftFwdAfter}m / ${CT.draftAftAfter}m`, ''],
    [],
    ['CANTIDADES RECIBIDAS (CERTIFICADO BT CABO TAMAR)'],
    ['',                      'CANTIDAD',     'UNIDAD'],
    ['G.S.V. @60°F',          CT.gsvReceived.toFixed(3), 'Bbls'],
    ['N.S.V. @60°F',          CT.nsvReceived.toFixed(3), 'Bbls'],
    ['G.S.V. @60°F',          CT.m3Gsv.toFixed(3),       'm³'],
    ['N.S.V. @60°F',          CT.m3Nsv.toFixed(3),       'm³'],
    ['G.S.V. (US Galones)',   CT.gsvGal.toFixed(1),      'US Gal'],
    ['N.S.V. (US Galones)',   CT.nsvGal.toFixed(2),      'US Gal'],
    ['T.M. Bruta (aire)',      CT.mtGross.toFixed(3),     'MT'],
    ['T.M. Neta (aire)',       CT.mtNet.toFixed(3),       'MT'],
    ['T. Largas Bruta',        CT.ltGross.toFixed(2),     'LT'],
    ['T. Largas Neta',         CT.ltNet.toFixed(3),       'LT'],
    ['API @60°F',              CT.apiReceived,            '°API'],
    ['BSW (%)',                CT.bswReceived,            '%'],
    ['Densidad @15°C',         CT.densA,                  'kg/m³ (aire)'],
    ['V.E.F. (API 17.9)',      CT.vefFactor,              ''],
    [],
    ['TANQUES CARGADOS: 1P, 1S, 2P, 2S, 4P, 4S, 5P, 5S'],
    ['NOTA: Los tanques 3P, 3S, 6P, 6S quedaron vacíos.'],
    [],
    [OP.surveyorCT],
    ['AMSPEC CHILE S.A.'],
    ['INSPECTOR (Cabo Tamar)'],
  ];
  const ws = makeWS(rows);
  setColWidths(ws, [32, 22, 22]);
  return ws;
}

// ── SHEET 4: VARIACIÓN EN TRÁNSITO ───────────────────────────────────────────
function buildTransitSheet() {
  const rows = [
    ['VARIACIÓN EN TRÁNSITO - M/T COPPER SPIRIT (Carga completa)'],
    [],
    ['AmSpec Ref.',   OP.ref,                '', 'Puerto Carga', 'Santos Basin, Brazil'],
    ['Ref. Cliente',  'P-038/2026',          '', 'Primer Puerto', 'Talcahuano, Chile'],
    ['Producto',      OP.product,            '', 'Zarpó',        '46129 (2026-03-30)'],
    ['Buque',         'MT COPPER SPIRIT',    '', 'Llegó Talcahuano', '46141 (2026-04-11)'],
    [],
    ['COMPARACIÓN CON CONOCIMIENTO DE EMBARQUE (B/L)'],
    ['',                     'BARRILES',       'UNIDAD'],
    ['G.S.V. B/L',            1002453,         'Bbls'],
    ['N.S.V. B/L',            999445.64,       'Bbls'],
    ['T.M. Bruta B/L',        139505.515,      'MT'],
    ['T.M. Neta B/L',         139086.998,      'MT'],
    [],
    ['COMPARACIÓN BUQUE ZARPE vs LLEGADA TALCAHUANO'],
    ['',                     'ZARPE',          'LLEGADA TALCAHUANO', 'DIFERENCIA', '%'],
    ['G.S.V. @60°F (Bbls)',  1001250.06,       1001133.24,
      (1001133.24-1001250.06).toFixed(2), pct(1001133.24-1001250.06, 1001250.06).toFixed(4)+'%'],
    ['N.S.V. @60°F (Bbls)',  998246.31,        997829.50,
      (997829.50-998246.31).toFixed(2), pct(997829.50-998246.31, 998246.31).toFixed(4)+'%'],
    ['T.C.V. (Bbls)',         1001250.06,       1001631.29,
      (1001631.29-1001250.06).toFixed(2), pct(1001631.29-1001250.06, 1001250.06).toFixed(4)+'%'],
    ['T.M. Bruta',            139338.108,       139577.996,
      (139577.996-139338.108).toFixed(3), pct(139577.996-139338.108, 139338.108).toFixed(4)+'%'],
    [],
    ['API B/L', 29.8, '', 'BSW B/L', '0.30%'],
    ['API Llegada', 29.5, '', 'BSW Llegada', '0.33%'],
    ['V.E.F. (API 17.9)', 0.9992],
    ['Agua Libre en bordo (llegada)', '498.05 Bbls'],
    [],
    ['DISTRIBUCIÓN POR PUERTO'],
    ['',              'SIN V.E.F.',       'CON V.E.F.',     'RECIBIDO',      'DIF. CON VEF',  '%'],
    ['TALCAHUANO (MT CABO TAMAR)'],
    ['G.S.V. (Bbls)', CS.gsvDelivered.toFixed(2), CS.gsvDeliveredVEF.toFixed(3), CT.gsvReceived.toFixed(2), diff.gsvVEF.toFixed(3), pct(diff.gsvVEF, CS.gsvDeliveredVEF).toFixed(4)+'%'],
    ['N.S.V. (Bbls)', CS.nsvDelivered.toFixed(3), CS.nsvDeliveredVEF.toFixed(3), CT.nsvReceived.toFixed(2), diff.nsvVEF.toFixed(3), pct(diff.nsvVEF, CS.nsvDeliveredVEF).toFixed(4)+'%'],
    ['T.M. Bruta',    CS.mtGrossNoVEF.toFixed(3), CS.mtGrossVEF.toFixed(3), CT.mtGross.toFixed(3), diff.mtGrossVEF.toFixed(3), pct(diff.mtGrossVEF, CS.mtGrossVEF).toFixed(4)+'%'],
    [],
    ['QUINTERO (tanques tierra)'],
    ['G.S.V. (Bbls)', 693992.18, '', '', '', ''],
    ['G.S.V. (m³)',   110335.918, '', '', '', ''],
    ['T.M. Bruta',    96579.236, '', '', '', ''],
  ];
  const ws = makeWS(rows);
  setColWidths(ws, [32, 18, 18, 18, 14, 12]);
  return ws;
}

// ── ASSEMBLE WORKBOOK ─────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, buildResumen(),     'ALIJE - RESUMEN');
XLSX.utils.book_append_sheet(wb, buildCSSheet(),     'COPPER SPIRIT (Descarga)');
XLSX.utils.book_append_sheet(wb, buildCTSheet(),     'CABO TAMAR (Carga)');
XLSX.utils.book_append_sheet(wb, buildTransitSheet(),'VARIACIÓN EN TRÁNSITO');

const out = process.argv[2] || 'C:\\Users\\usuario\\Downloads\\427-26-00332 Enap_Totsa_Copper Spirit\\427-26-00332 Enap_Totsa_Copper Spirit\\a) Talcahuano (Tamar)\\BT Alije STS - 427-26-00332-A Copper Spirit x Cabo Tamar.xlsx';
XLSX.writeFile(wb, out);
console.log('Created:', out);
