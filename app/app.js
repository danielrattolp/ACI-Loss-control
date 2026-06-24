// ===== CONSTANTS =====
const COUNTRY_PREFIXES = {
  CL: { code: 'ACICH',  label: 'Chile' },
  AR: { code: 'ACIAR',  label: 'Argentina' },
  CO: { code: 'ACICO',  label: 'Colombia' },
  EC: { code: 'ACIEC',  label: 'Ecuador' },
  PE: { code: 'ACIPE',  label: 'Perú' },
  CB: { code: 'ACICA',  label: 'Caribe' },
  US: { code: 'ACIUSA', label: 'Estados Unidos' },
};

// Tipos de operación activos (nuevos)
const OP_TYPES = {
  'vef-arribo': {
    label: 'Buque con VEF al Arribo',
    icon: '🛢️',
    desc: 'Medición al arribo con VEF. Concilia origen vs destino con comparativa de VEF.',
    modules: ['datos-origen', 'key-meeting', 'ullage-arribo', 'vef-comparativo', 'discharge-record', 'termometros', 'checklist', 'reporte-evolutivo'],
  },
  'completa': {
    label: 'Operación Completa',
    icon: '⚓',
    desc: 'Desde origen hasta destino: BL → descarga → alijes → alijadores a tierra.',
    modules: ['datos-origen', 'key-meeting', 'ullage-ini-madre', 'ullage-fin-madre', 'ullage-ini-alijador', 'ullage-fin-alijador', 'vef-comparativo', 'discharge-record', 'termometros', 'checklist', 'reporte-evolutivo'],
  },
  // Legacy — compatibilidad con operaciones existentes
  'vef':      { label: 'Buque con VEF (legacy)', icon: '🛢️', desc: '', modules: ['origen','key-meeting','ullage-inicial','vef','time-log','checklist-inspeccion','summary'] },
  'alije':    { label: 'Alije STS (legacy)',      icon: '⚓', desc: '', modules: ['origen','key-meeting','ullage-inicial','ullage-final','time-log','vef','discharge-record','slops','checklist-madre','checklist-alijador','summary'] },
  'terminal': { label: 'Terminal (legacy)',        icon: '🏭', desc: '', modules: ['origen','key-meeting','ullage-inicial','ullage-final','time-log','vef','discharge-record','slops','checklist-buque','checklist-terminal','summary'] },
};

const MODULE_META = {
  // Nuevos módulos
  'datos-origen':        { label: 'Datos de Origen',      icon: '📦' },
  'ullage-arribo':       { label: 'Ullage Arribo',        icon: '📐' },
  'vef-comparativo':     { label: 'VEF al Arribo',         icon: '⚖️' },
  'discharge-record':    { label: 'Discharge Record',     icon: '📋' },
  'termometros':         { label: 'Termómetros',          icon: '🌡️' },
  'reporte-evolutivo':   { label: 'Reporte Evolutivo',    icon: '📊' },
  // Legacy
  'origen':               { label: 'Datos Origen',        icon: '📦' },
  'key-meeting':          { label: 'Key Meeting',         icon: '🤝' },
  'ullage-inicial':       { label: 'Ullage Inicial',      icon: '📐' },
  'ullage-final':         { label: 'Ullage Final',        icon: '📏' },
  'vef':                  { label: 'VEF',                 icon: '⚖️' },
  'time-log':             { label: 'Time Log',            icon: '⏱️' },
  'slops':                { label: 'Slops',               icon: '🪣' },
  'checklist-inspeccion': { label: 'Checklist Inspector', icon: '✅' },
  'checklist-madre':      { label: 'Checklist B. Madre',  icon: '✅' },
  'checklist-alijador':   { label: 'Checklist Alijador',  icon: '✅' },
  'checklist-buque':      { label: 'Checklist Buque',     icon: '✅' },
  'checklist-terminal':   { label: 'Checklist Terminal',  icon: '✅' },
  'summary':              { label: 'Summary',             icon: '📊' },
};

// Biblioteca de módulos disponibles para el builder modular
const MODULE_LIBRARY = [
  { type: 'origen',           label: 'Datos de Origen',    icon: '📦', multi: false, desc: 'B/L, GOV, GSV, API en puerto de carga' },
  { type: 'ullage-inicial',   label: 'Ullage Inicial',     icon: '📐', multi: true,  desc: 'Medición antes de la transferencia (Before)' },
  { type: 'ullage-final',     label: 'Ullage Final',       icon: '📏', multi: true,  desc: 'Medición post-transferencia — calcula Δ entregado/recibido' },
  { type: 'vef',              label: 'VEF',                icon: '⚖️', multi: false, desc: 'Vessel Experience Factor (MPMS 17.9)' },
  { type: 'key-meeting',      label: 'Key Meeting',        icon: '🤝', multi: false, desc: 'Acta de reunión pre-inspección' },
  { type: 'time-log',         label: 'Time Log / SOF',     icon: '⏱️', multi: false, desc: 'Cronograma y Statement of Facts' },
  { type: 'discharge-record', label: 'Discharge Record',   icon: '📋', multi: false, desc: 'Registro de descarga / carga' },
  { type: 'slops',            label: 'Slops',              icon: '🪣', multi: false, desc: 'Control de slops' },
  { type: 'checklist',        label: 'Checklist',          icon: '✅', multi: true,  desc: 'Lista de verificación de auditoría' },
  { type: 'summary',          label: 'Summary',            icon: '📊', multi: false, desc: 'Resumen y balances de la operación' },
];

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
// Full audit checklist — API MPMS Loss Control Inspector Evaluation
// Format: { section, norm, intro, items: [{q, pq}] }
const CHECKLIST_VESSEL = [
  { section:'1 — Pre-embarco y Documentación Previa', norm:'API MPMS Cap. 17.1 / 17.2',
    intro:'Antes de subir al buque, el inspector debe reunir y revisar toda la documentación de calibración y antecedentes del cargamento. Esta etapa define la calidad de toda la medición posterior.',
    items:[
      {q:'¿Verificó y revisó las tablas de calibración del buque (ullage/innage tables) antes de iniciar mediciones?', pq:'Las tablas de capacidad del buque son la base de todo cálculo de volumen a bordo. Si el inspector usa tablas desactualizadas o incorrectas, cada volumen calculado será erróneo. Cap. 2.8A exige tablas emitidas por organismo reconocido y vigentes. Un error en la tabla es un <b>ERROR SISTEMÁTICO</b>: sesga la ship\'s figure en la misma dirección en todos los tanques.'},
      {q:'¿Solicitó el ullage report del viaje anterior para controlar el historial VEF del buque?', pq:'El VEF (Cap. 17.09) se construye con ≥6 viajes. Revisar el historial permite anticipar si el buque tiene <b>sesgo sistemático documentado</b> y si debe aplicarse VEF para corregirlo. Sin este contexto, el inspector no puede evaluar si la diferencia actual es normal o anómala.'},
      {q:'¿Confirmó la identidad y certificación del Ship\'s Officer responsable de las mediciones?', pq:'Cap. 17.1 exige que las mediciones sean realizadas o supervisadas por personal competente. Una firma de persona no autorizada puede invalidar el documento legalmente en una disputa arbitral.'},
      {q:'¿Verificó la vigencia y calibración de los instrumentos de medición del buque (cintas, termómetros)?', pq:'Instrumentos no calibrados son fuente de <b>ERROR SISTEMÁTICO</b>. Una cinta con desgaste en el gancho introduce un error constante en cada lectura de ullage. API MPMS Cap. 3.1 exige que las cintas cumplan estándares de precisión verificables.'},
      {q:'¿Portaba sus propios instrumentos calibrados y vigentes (cinta, termómetro, densímetro, pasta detectora)?', pq:'El inspector independiente debe realizar mediciones propias para comparar. Si solo acepta las lecturas del buque sin verificación independiente, su función pierde valor. La diferencia entre la cinta del buque y la del inspector es la primera alerta de error sistemático instrumental.'},
      {q:'¿Registró las condiciones ambientales al inicio (viento, estado del mar, lista del buque)?', pq:'Condiciones de mal tiempo y oleaje generan <b>ERRORES NO SISTEMÁTICOS (aleatorios)</b>: la superficie del líquido oscila dificultando lecturas estables. Si las condiciones superan límites de Cap. 3.1, las mediciones son menos confiables y deben documentarse.'},
    ]},
  { section:'2 — Seguridad y Acceso a Bordo', norm:'API MPMS Cap. 17.1 / ISGOTT 6ª Ed.',
    intro:'La seguridad no es solo un requisito regulatorio: un incidente a bordo puede interrumpir la operación, crear responsabilidades legales y afectar la validez de la documentación.',
    items:[
      {q:'¿Utilizó EPP completo al embarcar y durante toda la operación (casco, chaleco, zapatos, guantes, lentes)?', pq:'ISGOTT y las políticas de terminal exigen EPP específico. El incumplimiento puede resultar en retiro del buque, interrumpiendo la operación.'},
      {q:'¿Firmó el registro de ingreso al buque siguiendo el procedimiento ISPS/SMS?', pq:'El código ISPS exige registro de toda persona que ingresa. Este registro también protege al inspector: documenta su presencia y el período exacto de servicio.'},
      {q:'¿Verificó condiciones gas-free antes de abrir manholes o hatches de medición?', pq:'La apertura de tanques puede liberar vapores inflamables o tóxicos (H₂S en crudos amargos). ISGOTT Cap. 7 y API RP 500 exigen verificación con detector de gases antes de abrir.'},
      {q:'¿Usó detector de gases personal al acceder a cubierta de carga durante la operación?', pq:'Un detector personal (4-gas: O₂, LEL, CO, H₂S) es equipo mínimo. Sin él, el inspector no puede detectar atmósfera peligrosa.'},
      {q:'¿Coordinó con el oficial de guardia cada acceso a cubierta de carga y tanques?', pq:'El oficial controla válvulas, purgas y movimiento de carga. Un inspector que actúa sin coordinación puede interferir con maniobras activas.'},
    ]},
  { section:'3 — Medición Ullage Antes de Descarga (OBQ)', norm:'API MPMS Cap. 3.1 / 3.2 / 17.6',
    intro:'La medición inicial establece el volumen On Board Quantity. Es la base del cálculo de cantidad descargada. Errores aquí se propagan directamente a la ship\'s figure final.',
    items:[
      {q:'¿Midió todos los tanques del plan de descarga sin excepción, incluyendo los declarados vacíos?', pq:'Omitir un tanque deja su contenido sin contabilizar. Cap. 17.6 exige medición completa de todos los tanques, incluyendo los declarados vacíos, para confirmar OBQ residual.'},
      {q:'¿Aplicó corrección por trim y escora a cada tanque usando las tablas de corrección del buque?', pq:'<b>ERROR SISTEMÁTICO CLÁSICO</b>: si no se aplica trim correction, tanques de popa quedan sobreestimados y los de proa subestimados, sesgando el total en una dirección consistente. Cap. 3.2 detalla el procedimiento obligatorio.'},
      {q:'¿Realizó mínimo 2 mediciones por tanque, reconciliando diferencias > 3 mm?', pq:'Una sola medición puede estar afectada por oleaje o parallax (<b>ERROR NO SISTEMÁTICO</b>). La repetición reduce incertidumbre aleatoria. Cap. 3.1 recomienda dos lecturas coincidentes dentro de 3 mm.'},
      {q:'¿Verificó que la cinta se posicionó en el datum plate o punto de referencia correcto para cada tanque?', pq:'Medir desde un punto diferente al datum introduce un <b>ERROR SISTEMÁTICO</b> por diferencia de altura. El inspector debe confirmar que usa el mismo punto que figura en las tablas de calibración del tanque.'},
      {q:'¿Midió agua libre con pasta detectora en cada tanque (free water measurement)?', pq:'El agua libre no es parte del producto entregado. Cap. 10.4 exige su medición y sustracción del GOV.'},
      {q:'¿Obtuvo la firma del Ship\'s Officer en cada lectura de ullage al momento de la medición?', pq:'La firma simultánea tiene valor legal diferente a una firma posterior. Cap. 17.1 establece que las mediciones deben ser witnessed por todas las partes.'},
      {q:'¿Verificó que trim y escora del buque se encontraban dentro de los límites de las tablas de corrección?', pq:'Las tablas de corrección tienen rangos de validez. Si el buque está fuera del rango, las correcciones pierden precisión.'},
    ]},
  { section:'4 — Toma de Muestras', norm:'API MPMS Cap. 8.1 / 8.2 / 8.3',
    intro:'La muestra determina la calidad que define el valor del cargamento. Una muestra no representativa puede llevar a disputas de millones de dólares.',
    items:[
      {q:'¿Seleccionó y aplicó el método de muestreo correcto según el tipo de producto y operación?', pq:'Cap. 8.1 establece métodos distintos: running sample para crudos en movimiento, spot para tanques estáticos. Usar el método incorrecto genera muestra sesgada — <b>ERROR SISTEMÁTICO en la calidad</b>.'},
      {q:'¿Tomó la muestra del nivel o zona correcta (superior, media, inferior o all-levels según el producto)?', pq:'Los crudos tienen estratificación: el API puede variar 2–3 grados entre el fondo y la superficie.'},
      {q:'¿Usó frascos limpios, secos, etiquetados correctamente antes de la toma?', pq:'Contaminación del envase o etiqueta errónea puede hacer que la muestra de un buque sea analizada como la de otro.'},
      {q:'¿Documentó número de muestra, tanque, hora, método y responsable en el formulario oficial?', pq:'La trazabilidad es la cadena de custodia de la muestra. Sin documentación completa, la muestra no puede defenderse como representativa ante un arbitraje.'},
      {q:'¿Selló y custodió correctamente las muestras hasta su entrega al laboratorio?', pq:'Una muestra sin sello puede haber sido adulterada. Temperatura de almacenamiento incorrecta puede alterar la composición.'},
      {q:'¿Retuvo una muestra dirimente (referee sample) identificada y sellada por todas las partes?', pq:'La muestra dirimente es el árbitro en caso de resultado disputado. Cap. 8.1 exige retenerla por el tiempo mínimo contractual (usualmente 90 días).'},
    ]},
  { section:'5 — Temperatura y Gravedad API', norm:'API MPMS Cap. 7.1 / 9.1',
    intro:'Temperatura y API determinan el VCF. Un error de 1°F o 0.1 en API puede cambiar el VCF en 0.0001–0.0003, equivalente a cientos de barriles en un cargamento grande.',
    items:[
      {q:'¿Midió temperatura en cada tanque con termómetro calibrado en tres zonas (superior, media, inferior)?', pq:'Cap. 7.1 exige medición por zonas para temperatura representativa. Tomar solo la temperatura superficial sobrestima el promedio en crudos recién cargados — <b>ERROR SISTEMÁTICO</b>.'},
      {q:'¿Registró la temperatura observada en las unidades correctas (°F o °C según el formato del ullage report)?', pq:'La confusión de unidades entre °F y °C produce un VCF completamente erróneo.'},
      {q:'¿Determinó la gravedad API a 60°F con densímetro calibrado sobre muestra representativa?', pq:'Un API incorrecto de solo 0.5 grados puede cambiar el VCF en 0.0005, equivalente a ~100 Bbl en un cargamento de 200,000 Bbl.'},
      {q:'¿Aplicó corrección de temperatura al densímetro según ASTM Tables 1 y 3?', pq:'Si el densímetro se sumerge en muestra a 80°F, la lectura debe corregirse a 60°F. No aplicar esta corrección introduce un <b>ERROR SISTEMÁTICO</b>.'},
      {q:'¿Verificó coherencia entre el API determinado en campo y el certificado de calidad del cargamento cargado?', pq:'Si el API difiere más de 0.3 grados del certificado de origen, debe investigarse antes de usar los valores.'},
    ]},
  { section:'6 — Cálculo VCF / CTL', norm:'API MPMS Cap. 11.1 — Tablas 6A/6B/6C/6D',
    intro:'El VCF convierte el GOV al GSV estándar a 60°F. Es el cálculo más crítico: un VCF erróneo afecta directamente el volumen facturado en todo el cargamento.',
    items:[
      {q:'¿Seleccionó la tabla CTL correcta según el producto (6A crudo, 6B refinados, 6C MTBE, 6D lubricantes)?', pq:'Cada tabla usa una función de expansión térmica diferente. Usar 6B para un crudo puede generar diferencias de VCF de 0.0005–0.001 — <b>ERROR SISTEMÁTICO</b> que afecta todo el cargamento.'},
      {q:'¿Ingresó correctamente el API@60°F y la temperatura observada como entradas a la tabla?', pq:'El VCF es función de dos variables: API y temperatura. Cualquier error en las entradas produce VCF incorrecto.'},
      {q:'¿Verificó el VCF calculado contra el valor del Ship\'s Officer, documentando diferencias > 0.0001?', pq:'Diferencia de 0.0001 en VCF sobre 200,000 GOV Bbl = 20 Bbl. Si supera 0.0002, debe identificarse la causa.'},
      {q:'¿Registró GOV, VCF y GSV correctamente en el ullage report (GOV × VCF = GSV)?', pq:'Errores de transcripción son errores sistemáticos evitables. El auditor debe poder verificar cada GSV independientemente.'},
      {q:'¿Recalculó al menos un tanque completo de forma independiente antes de firmar el ullage report?', pq:'El Ship\'s Officer puede usar software con tablas mal programadas. El inspector debe tener su propio cálculo para detectar discrepancias.'},
    ]},
  { section:'7 — Sellado de Líneas y Válvulas', norm:'API MPMS Cap. 17.6 / 17.1',
    intro:'El sellado garantiza la integridad del cargamento entre medición inicial y final. Válvulas no selladas permiten transferencias no autorizadas.',
    items:[
      {q:'¿Selló válvulas de interconexión entre tanques y líneas no activas antes del inicio de la descarga?', pq:'Las válvulas de interconexión permiten transferir producto entre tanques sin que el inspector lo detecte. Los sellos son la barrera física que previene esta manipulación.'},
      {q:'¿Registró los números de cada sello colocado y verificó el estado de sellos preexistentes?', pq:'El registro de números crea un rastro auditable. Si un sello aparece roto al finalizar, hay evidencia de apertura no autorizada.'},
      {q:'¿Verificó que slop tanks y tanques no declarados estuvieran sellados o aislados?', pq:'Los slop tanks contienen residuos de lavado. Si quedan conectados al sistema de descarga, pueden mezclar slops con el producto.'},
      {q:'¿Inspeccionó el estado de la línea de carga y manifold antes de conectar el brazo de descarga?', pq:'El volumen en la línea de carga entre los tanques y el manifold (line fill) debe cuantificarse.'},
      {q:'¿Cuantificó y documentó correctamente el volumen de line displacement o drenaje de línea?', pq:'El line displacement es la cantidad de producto en las líneas del buque. Sin documentación aparece como diferencia inexplicable.'},
    ]},
  { section:'8 — Monitoreo Durante la Descarga', norm:'API MPMS Cap. 17.6 / Cap. 5',
    intro:'La presencia continua del inspector garantiza que la operación transcurrió conforme al plan. Ausencias no documentadas debilitan la validez de todo el ullage report.',
    items:[
      {q:'¿Permaneció a bordo o en zona de muelle durante toda la operación sin abandonar sin relevo?', pq:'Si el inspector se ausenta sin documentarlo, no puede certificar lo ocurrido en ese período. Cap. 17.1 es explícito: el inspector debe estar presente durante la operación.'},
      {q:'¿Registró hora exacta de inicio, todas las pausas y hora de término de la descarga?', pq:'En disputas de demurrage, el tiempo de descarga documentado tiene valor económico directo.'},
      {q:'¿Monitoreó periódicamente los niveles en los tanques activos para detectar cambios inesperados?', pq:'Una caída repentina de ullage en un tanque no activo indica transferencia no declarada. El monitoreo periódico (cada 30–60 min) es la herramienta para detectar anomalías.'},
      {q:'¿Registró presión en manifold y tasa de flujo durante la operación si había instrumentos disponibles?', pq:'La presión y flujo en el manifold permiten calcular el volumen transferido de forma independiente.'},
      {q:'¿Verificó que no se bombearon slops, agua de lastre o residuos hacia el sistema durante la descarga?', pq:'En operaciones fraudulentas se ha documentado la inyección de agua o slops a la línea de carga para inflar el volumen aparentemente entregado.'},
      {q:'¿Confirmó que solo se descargaron los tanques incluidos en el plan de descarga acordado?', pq:'Descargar tanques adicionales puede incluir producto de otro consignatario o slops.'},
    ]},
  { section:'9 — Medición Ullage Después de Descarga (ROB)', norm:'API MPMS Cap. 3.1 / 3.2 / 17.6',
    intro:'La medición final determina el Remain On Board y por diferencia con la medición inicial la cantidad descargada. Debe ejecutarse con igual rigurosidad.',
    items:[
      {q:'¿Midió todos los tanques después de la descarga, incluyendo los declarados como vacíos?', pq:'Los tanques "vacíos" pueden contener residuos (ROB) que deben documentarse.'},
      {q:'¿Aplicó la misma metodología (mismo punto de referencia, corrección de trim) que en la medición inicial?', pq:'La consistencia metodológica es fundamental: los errores sistemáticos se cancelan al calcular la diferencia SOLO SI ambas mediciones usan el mismo método.'},
      {q:'¿Midió el agua libre final con pasta detectora y la comparó con la medición inicial?', pq:'El agua libre final menos la inicial da la variación durante la descarga. Un aumento significativo puede indicar que se descargó agua junto con el producto.'},
      {q:'¿Aplicó corrección de trim y escora final, verificando que esté dentro del rango de tablas?', pq:'El trim cambia significativamente durante la descarga (de cargado a en lastre). Ignorar este cambio es un <b>ERROR SISTEMÁTICO</b> clásico.'},
      {q:'¿Obtuvo la firma del Ship\'s Officer en el ullage report final antes de desembarcar?', pq:'Sin la firma del Ship\'s Officer, el documento no tiene validez bilateral.'},
      {q:'¿Calculó la ship\'s figure y la comparó con la shore figure antes de firmar?', pq:'La comparación debe hacerse mientras el inspector está a bordo. Una vez que el buque zarpa, la posibilidad de investigación se cierra.'},
    ]},
  { section:'10 — Análisis de Diferencia y Tolerancia', norm:'API MPMS Cap. 17.9 (VEF) / Cap. 12.1 / Cap. 13',
    intro:'El análisis de diferencia es la conclusión técnica de toda la operación. Determina si la discrepancia entre shore y ship es dentro de lo esperable, o si indica un problema real.',
    items:[
      {q:'¿Calculó la diferencia porcentual correctamente: (Shore − Ship) / Ship × 100?', pq:'La fórmula puede variar según el contrato (shore o ship como base). Una inversión del denominador cambia el signo y magnitud.'},
      {q:'¿Aplicó el VEF documentado del buque si estaba disponible y era estadísticamente válido (≥ 6 viajes)?', pq:'El VEF corrige el <b>ERROR SISTEMÁTICO</b> del buque. Cap. 17.09 exige mínimo 6 viajes para que sea estadísticamente representativo.'},
      {q:'¿Verificó si la diferencia cae dentro del rango de tolerancia aplicable a la operación?', pq:'Tolerancias: Shore-Ship en terminal ≤ 0.20% (con VEF) o ≤ 0.50% (sin VEF); STS ≤ 0.30%.'},
      {q:'¿Documentó la metodología completa para llegar a la figura acordada (VEF, tablas, ajustes aplicados)?', pq:'En arbitrajes bajo FOSFA, GAFTA o ICSID, la ausencia de metodología documentada es usualmente fatal.'},
      {q:'¿Identificó y documentó posibles causas técnicas si la diferencia supera la tolerancia aceptable?', pq:'Una diferencia excesiva puede tener causas legítimas o indicar manipulación. El inspector debe documentar su análisis causal.'},
    ]},
  { section:'11 — Errores: Sistemáticos vs. No Sistemáticos', norm:'API MPMS Cap. 13.1 / 13.2',
    intro:'API MPMS Cap. 13 es el marco estadístico de toda la medición de petróleo. Distinguir entre error sistemático y aleatorio es fundamental para saber si una diferencia es real o variación normal.',
    items:[
      {q:'¿Analizó si las diferencias históricas del buque muestran patrón consistente en la misma dirección (error sistemático)?', pq:'<b>ERROR SISTEMÁTICO (Bias)</b>: ocurre siempre en la misma dirección y magnitud similar. El VEF es el mecanismo para cuantificar y corregir este sesgo. <b>Un error sistemático no desaparece promediando más mediciones.</b>'},
      {q:'¿Identificó fuentes de error aleatorio (no sistemático) que pudieron influir en esta operación?', pq:'<b>ERROR NO SISTEMÁTICO (Aleatorio)</b>: varía aleatoriamente alrededor de cero, sin dirección fija. Causas: oleaje, parallax, variación en posición del termómetro. <b>A diferencia del sistemático, el error aleatorio SE REDUCE promediando múltiples mediciones.</b>'},
      {q:'¿Verificó precisión vs. exactitud del instrumental, distinguiendo sesgo (exactitud) de imprecisión (repetibilidad)?', pq:'<b>PRECISIÓN</b> = consistencia de mediciones repetidas (error aleatorio). <b>EXACTITUD</b> = qué tan cerca está el promedio del valor verdadero (error sistemático). Ambos tipos deben evaluarse.'},
      {q:'¿Evaluó si las tablas de calibración del buque son fuente de error sistemático (edad, deformaciones)?', pq:'Con el tiempo, los tanques se deforman por presión y corrosión. Sin recalibración, toda medición acumula un ERROR SISTEMÁTICO. Buques con más de 10–15 años sin recalibración son sospechosos.'},
      {q:'¿Documentó si la diferencia observada es consistente con la incertidumbre de medición esperada?', pq:'Cap. 12.2 y 13.2: <b>Incertidumbre total = √(sesgo² + aleatoria²)</b>. En condiciones normales, la incertidumbre de medición de buque es ±0.15–0.30%.'},
      {q:'¿Distinguió si la diferencia tiene características de error aleatorio (varía sin dirección fija) o sistemático (constante)?', pq:'Si es ALEATORIA → mejorar condiciones, repetir, promediar. Si es SISTEMÁTICA → investigar causa raíz y aplicar VEF o solicitar recalibración.'},
    ]},
  { section:'12 — Documentación y Certificados', norm:'API MPMS Cap. 17.1 / 17.2',
    intro:'Los documentos que emite el inspector son el producto final de su trabajo. Su calidad, completitud y oportunidad determinan si la operación quedó bien documentada para cualquier reclamación futura.',
    items:[
      {q:'¿Emitió el Certificate of Quantity (COQ) con todos los datos requeridos (GOV, VCF, GSV, método, fecha, firmas)?', pq:'El COQ es el documento primario de custody transfer. Campos vacíos o ilegibles invalidan el documento como evidencia.'},
      {q:'¿Emitió el Certificate of Quality (CQL) con resultados de laboratorio o referencia al certificado de origen?', pq:'En la mayoría de los contratos el precio se ajusta por calidad. Sin CQL no hay base documentada para reclamar desvíos.'},
      {q:'¿El ullage report final fue firmado por todas las partes presentes?', pq:'Un ullage report con una sola firma tiene valor unilateral. La firma multilateral convierte el documento en un acuerdo sobre los hechos medidos.'},
      {q:'¿Emitió Letter of Protest cuando correspondía (diferencia excesiva, negativa a firmar, irregularidades)?', pq:'El LoP reserva el derecho a reclamar. Si el inspector omite emitirlo cuando corresponde, puede interpretarse como aceptación.'},
      {q:'¿Entregó copia de todos los documentos al Ship\'s Officer y representantes antes de desembarcar?', pq:'La entrega in-situ crea un registro reconocido por todas las partes.'},
      {q:'¿Reportó a Loss Control/cliente dentro del plazo establecido con informe completo y preciso?', pq:'Muchos contratos tienen plazos de reclamación de 30–60 días. Un reporte tardío puede hacer que el cliente pierda el derecho contractual.'},
      {q:'¿Archivó correctamente toda la documentación original con número de operación?', pq:'Los documentos de custody transfer deben conservarse por el tiempo contractual (usualmente 3–5 años).'},
    ]},
  { section:'13 — Conducta Profesional', norm:'API Código de Ética / Política ACI LATAM',
    intro:'La imparcialidad del inspector es el fundamento de su valor. Un inspector percibido como parcial invalida toda su documentación.',
    items:[
      {q:'¿Actuó con imparcialidad e independencia frente a las presiones del buque y de la terminal?', pq:'Un inspector que reporta solo lo favorable al cliente pierde credibilidad ante la contraparte. La objetividad incluye reportar hechos adversos al cliente.'},
      {q:'¿Comunicó en tiempo real a Loss Control cualquier irregularidad o hallazgo adverso?', pq:'Algunas situaciones requieren decisión inmediata del cliente. Un reporte solo al finalizar puede llegar demasiado tarde.'},
      {q:'¿Registró todas las acciones relevantes en el diario de operaciones con hora exacta?', pq:'El log de campo es la memoria objetiva. Entradas vagas, sin hora o incompletas no sirven como evidencia.'},
      {q:'¿Se negó a aceptar instrucciones del buque o terminal que contravenían los procedimientos API MPMS?', pq:'La negativa a proceder incorrectamente debe documentarse indicando quién solicitó la desviación.'},
      {q:'¿El informe final es internamente coherente (valores del cuerpo del informe coinciden con los certificados emitidos)?', pq:'Inconsistencias internas sugieren errores de transcripción o, en casos graves, alteración de documentos.'},
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
  try { localStorage.setItem('aci_ops', JSON.stringify(ops)); } catch(e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) alert('Almacenamiento local lleno. Las fotos se guardan en el servidor pero pueden perderse al recargar. Elimina imágenes antiguas o exporta la operación.');
  }
  fetch('/api/ops', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ops) }).catch(() => {});
}
function loadCounters() {
  try { return JSON.parse(localStorage.getItem('aci_counters') || '{}'); } catch { return {}; }
}
function saveCounters(c) {
  localStorage.setItem('aci_counters', JSON.stringify(c));
  fetch('/api/counters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) }).catch(() => {});
}

// Al iniciar: carga desde servidor y sincroniza localStorage
async function syncFromServer() {
  try {
    const [opsRes, cntRes] = await Promise.all([fetch('/api/ops'), fetch('/api/counters')]);
    if (opsRes.ok) {
      const ops = await opsRes.json();
      if (Array.isArray(ops) && ops.length > 0) {
        localStorage.setItem('aci_ops', JSON.stringify(ops));
      }
    }
    if (cntRes.ok) {
      const cnt = await cntRes.json();
      if (cnt && Object.keys(cnt).length > 0) {
        localStorage.setItem('aci_counters', JSON.stringify(cnt));
      }
    }
  } catch (_) {}
}
function nextCode(countryKey) {
  const yy = String(new Date().getFullYear()).slice(-2);
  const counters = loadCounters();
  const prefix = COUNTRY_PREFIXES[countryKey].code;
  // Global sequential (never resets)
  counters[countryKey] = (counters[countryKey] || 0) + 1;
  // Per-year counter (for stats)
  const yearKey = `${countryKey}_${yy}`;
  counters[yearKey] = (counters[yearKey] || 0) + 1;
  saveCounters(counters);
  return `${prefix}-${yy}-${String(counters[countryKey]).padStart(3, '0')}`;
}
function getOp(id) { return loadOps().find(o => o.id === id); }
function saveOp(op) {
  const ops = loadOps();
  const idx = ops.findIndex(o => o.id === op.id);
  if (idx >= 0) ops[idx] = op; else ops.unshift(op);
  saveOps(ops);
}
function newOpId() { return 'op_' + Date.now() + '_' + Math.random().toString(36).slice(2,7); }

// ===== MODULAR BUILDER HELPERS =====

// Extrae el tipo base de una clave de módulo: 'ullage-0' → 'ullage', 'origen' → 'origen'
function moduleType(key) { return key.replace(/-\d+$/, ''); }

// Label visible de un módulo (custom o default)
function moduleLabel(op, key) {
  const customLabel = (op.modules || {})[key]?._label;
  if (customLabel) return customLabel;
  // Claves legacy
  if (MODULE_META[key]) return MODULE_META[key].label;
  // Nuevas claves tipo 'ullage-0', 'checklist-0', etc.
  const t = moduleType(key);
  const lib = MODULE_LIBRARY.find(m => m.type === t);
  const n = parseInt(key.split('-').pop(), 10);
  if (lib?.multi) return `${lib.label} ${n + 1}`;
  return lib?.label || key;
}

// Devuelve el moduleOrder efectivo (nuevo o derivado de la operación legacy)
function resolveModuleOrder(op) {
  if (op.moduleOrder && op.moduleOrder.length) return op.moduleOrder;
  // Compatibilidad: derivar desde OP_TYPES
  if (op.type && OP_TYPES[op.type]) return OP_TYPES[op.type].modules;
  return ['summary'];
}

// Siguiente clave disponible para un tipo multi: 'ullage' → 'ullage-0', 'ullage-1', ...
function nextModuleKey(op, type) {
  const order = resolveModuleOrder(op);
  const existing = order.filter(k => moduleType(k) === type).map(k => parseInt(k.split('-').pop(), 10) || 0);
  let n = 0;
  while (existing.includes(n)) n++;
  return `${type}-${n}`;
}

// Data inicial para una instancia nueva de módulo
function initModuleInstance(type) {
  const tanks = TANK_NAMES.map(n => ({ name: n, ullage: '', tcf: '', tov: '', temp: '', api: '', bsw: '', fw: '', gov: '', gsv: '' }));
  const ullTanks = () => TANK_NAMES.map(n => ({ name: n, refHeight: '', measured: '', api: '', temp: '', vcf: '', gsv: '', tcv: '' }));
  const emptyQty = () => ({ gsv:'', tcv:'', fw:'', api:'', bsw:'', densityAt15:'', densityAt60:'', m3At15:'', longTons:'', metricTons:'' });

  if (type === 'datos-origen') return {
    blNumber:'', blDate:'', loadPort:'', loadTerminal:'', loadBerth:'',
    bl: emptyQty(),
    vefOrigen: { voyages: [], notes: '' },
    ullageOrigen: { tanks: ullTanks(), notes:'' },
    notes:'',
  };
  if (type === 'ullage-arribo') return {
    tanks: ullTanks(), trim:'', list:'', date:'', time:'',
    totals: emptyQty(),
    docs: { vessel:[], surveyor:[], aci:[] },
    media: [],
    notes:'',
  };
  if (type === 'vef-comparativo') return {
    voyages: [], notes: '',
  };
  if (type === 'discharge-record') return {
    enabled: true,
    startDate:'', startTime:'',
    records: [],   // [{ time:'', volPumped:'', pressure:'', observations:'' }]
    notes:'',
  };
  if (type === 'termometros') return {
    enabled: true,
    date:'', startTime:'', endTime:'',
    vessel:   { id:'', calibDate:'', tempF:'' },
    surveyor: { id:'', calibDate:'', tempF:'' },
    aci:      { id:'', calibDate:'', tempF:'' },
    generalRemarks:'', sigInspector:'', sigVesselRep:'',
    photos:[],
  };
  if (type === 'reporte-evolutivo') return { notes:'' };
  if (type === 'key-meeting')      return { date:'', time:'', location:'', attendees:[], answers:{}, acta:'', notes:'' };
  if (type === 'time-log')         return { events:[], notes:'' };
  if (type === 'ullage' || type === 'ullage-inicial')
    return { tanks: JSON.parse(JSON.stringify(tanks)), trim:'', list:'', notes:'', avgTemp:'', avgApi:'', avgBsw:'', vcfTabla:'6A', tempUnit:'C' };
  if (type === 'ullage-final')
    return { tanks: JSON.parse(JSON.stringify(tanks)), trim:'', list:'', notes:'', avgTemp:'', avgApi:'', avgBsw:'', vcfTabla:'6A', pairedWith:'', tempUnit:'C' };
  if (type === 'vef')              return { shoreGSV:'', vesselGSV:'', vef:'', notes:'', voyages:[] };
  if (type === 'slops')            return { before:{ tanks:[] }, after:{ tanks:[] }, notes:'' };
  if (type === 'checklist')        return { items: makeChecklistData(CHECKLIST_VESSEL), inspector:'', date:'', signature:'' };
  if (type === 'summary')          return { notes:'' };
  return {};
}

// Agrega un módulo al op y retorna el nuevo op
function addModuleToOp(op, type) {
  const lib = MODULE_LIBRARY.find(m => m.type === type);
  if (!lib) return op;
  const order = [...resolveModuleOrder(op)];
  // Singleton: no duplicar
  if (!lib.multi && order.some(k => moduleType(k) === type)) return op;
  const key = lib.multi ? nextModuleKey(op, type) : type;
  // Insertar antes de 'summary' si existe
  const summaryIdx = order.lastIndexOf('summary');
  if (summaryIdx >= 0) order.splice(summaryIdx, 0, key);
  else order.push(key);
  const modules = { ...(op.modules || {}), [key]: initModuleInstance(type) };
  return { ...op, moduleOrder: order, modules };
}

// Elimina un módulo del op
function removeModuleFromOp(op, key) {
  const order = resolveModuleOrder(op).filter(k => k !== key);
  const modules = { ...(op.modules || {}) };
  delete modules[key];
  return { ...op, moduleOrder: order, modules };
}

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
    'ullage-inicial': { tanks: JSON.parse(JSON.stringify(tanks)), trim: '', list: '', notes: '', avgTemp:'', avgApi:'', avgBsw:'', vcfTabla:'6A' },
    'ullage-final':   { tanks: JSON.parse(JSON.stringify(tanks)), trim: '', list: '', notes: '', avgTemp:'', avgApi:'', avgBsw:'', vcfTabla:'6A' },
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
    norm: sec.norm || '',
    intro: sec.intro || '',
    items: sec.items.map(item => {
      const isObj = typeof item === 'object';
      return { text: isObj ? item.q : item, pq: isObj ? item.pq : '', val: '', comment: '' };
    }),
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

// ─── API MPMS Chapter 11.1 (2004) — VCF ────────────────────────────────────
// Temperatura de entrada en °F; referencia siempre 60 °F.
// Tablas: 6A crudos, 6B productos refinados, 6C MTBE, 6D lubricantes.

const _REF_F   = 60.0068749;       // temperatura de referencia (MPMS 11.1)
const _DELTA   = 0.01374979547;    // constante corrección cuadrática
const _WATER60 = 999.016;          // densidad agua a 60 °F kg/m³

// Corrección de temperatura de equilibrio (polinomio Horner grado 9)
function _equilF(tF) {
  const tC = (tF - 32) / 1.8;
  const x  = tC / 630;
  const b  = ((-0.148759 + (-0.267408 + (1.08076 + (1.269056 + (-4.089591 +
              (-1.871251 + (7.438081 + (-3.536296*x)*x)*x)*x)*x)*x)*x)*x)*x);
  return (tC - b) * 1.8 + 32;
}

// Densidad a 60 °F (kg/m³) desde API gravity
function _rho60(api) { return 141.5 / (api + 131.5) * _WATER60; }

// Núcleo de cálculo
function _vcfCore(api, tObsF, alpha60, alphaFn, denomFactor) {
  const rho0 = _rho60(api);
  const fpm  = (_DELTA / 2) * alpha60;
  const rhoT = rho0 * (1 + (Math.exp(fpm*(1+0.8*fpm))-1) /
                           (1 + fpm*(1+1.6*fpm)*denomFactor));
  const aT   = alphaFn(rhoT);
  const dT   = _equilF(tObsF) - _REF_F;
  return Math.round(Math.exp(-aT * dT * (1 + 0.8*aT*(dT+_DELTA))) * 1e5) / 1e5;
}

// Tabla 6A — Crudos generalizados
function vcfTable6A(api, tempF) {
  const r = _rho60(api);
  return _vcfCore(api, tempF, 341.0957/(r*r), r2 => 341.0957/(r2*r2), 2);
}

// Tabla 6B — Productos refinados (sub-rangos por densidad)
function vcfTable6B(api, tempF) {
  const rho = _rho60(api);
  let K0, K1, K2, den;
  if      (rho >= 838.3127)                 { K0=103.872;  K1=0.2701;   K2=0; }
  else if (rho >= 787.5195)                 { K0=330.301;  K1=0;        K2=0; }
  else if (rho >= 770.352)                  { K0=1489.067; K1=0;        K2=-0.0018684; }
  else if (rho >= 610.6)                    { K0=192.4571; K1=0.2438;   K2=0; }
  else return null;
  const aFn = r => K0/(r*r) + K1/r + K2;
  den = (2*K0 + K1*rho) / (K0 + (K1 + K2*rho)*rho);
  return _vcfCore(api, tempF, aFn(rho), aFn, den);
}

// Tabla 6C — MTBE (factor térmico fijo 0.000789)
function vcfTable6C(api, tempF) {
  return _vcfCore(api, tempF, 0.000789, () => 0.000789, 1);
}

// Tabla 6D — Lubricantes
function vcfTable6D(api, tempF) {
  const r = _rho60(api);
  return _vcfCore(api, tempF, 0.34878/r, r2 => 0.34878/r2, 1);
}

// vcfCalc(api, tempF, tabla) — tabla: '6A'|'6B'|'6C'|'6D' (default 6A)
// Temperature is rounded to 1 decimal per MPMS 11.1 (precision of field measurements)
function vcfCalc(api, tempF, tabla = '6A') {
  if (!api || tempF == null) return null;
  const t = Math.round(tempF * 10) / 10;  // ROUND(T, 1) per MPMS convention
  switch (tabla) {
    case '6B': return vcfTable6B(api, t);
    case '6C': return vcfTable6C(api, t);
    case '6D': return vcfTable6D(api, t);
    default:   return vcfTable6A(api, t);
  }
}

// Density at 15°C from API gravity (kg/m³)
function apiToDensity15(api) {
  if (!api) return 0;
  return 141.5 / (api + 131.5) * 999.016;
}

// Full quantity summary from GOV, avg temp (°F), API, BS&W
function calcAllQuantities(govM3, avgTempF, api60, bswPct, tabla = '6A') {
  if (!govM3 || govM3 <= 0 || !api60 || avgTempF == null) return null;

  const vcf60F  = vcfCalc(api60, avgTempF, tabla);        // to 60°F (tabla seleccionada)
  // Para 15°C y 20°C: mismo algoritmo con referencia ajustada en °F
  const _vcfRef = (refF) => {
    const r   = _rho60(api60);
    const a60 = 341.0957 / (r*r);
    const fpm = (_DELTA/2)*a60;
    const rT  = r*(1+(Math.exp(fpm*(1+0.8*fpm))-1)/(1+fpm*(1+1.6*fpm)*2));
    const aT  = 341.0957/(rT*rT);
    const dT  = _equilF(avgTempF) - refF;
    return Math.round(Math.exp(-aT*dT*(1+0.8*aT*(dT+_DELTA)))*1e5)/1e5;
  };
  const vcf15C  = _vcfRef(59.0);   // 15°C ≈ 59°F
  const vcf20C  = _vcfRef(68.0);   // 20°C = 68°F

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

function calcGSV(tov, api, tempF, bsw) {
  if (!tov || !api || !tempF) return '';
  const vcf = vcfCalc(parseFloat(api), parseFloat(tempF));
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
          Requiere <code>ANTHROPIC_API_KEY</code> configurada en el servidor.
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
    const res = await fetch('/api/consultar', {
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
    state.chatHistory.push({ role: 'assistant', content: '⚠️ No se pudo conectar con el servidor (localhost:3030). Asegúrate de que esté corriendo.' });
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
      <button class="btn" style="background:var(--paper);border:1px solid var(--line);color:var(--muted);font-size:12px;padding:6px 12px" data-action="export-ops" title="Exportar todas las operaciones a JSON">⬇ Exportar</button>
      <label style="background:var(--paper);border:1px solid var(--line);color:var(--muted);font-size:12px;padding:6px 12px;border-radius:var(--r);cursor:pointer" title="Importar operaciones desde JSON">
        ⬆ Importar <input type="file" accept=".json" style="display:none" data-action="import-ops">
      </label>
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
        <span class="op-type-badge ${op.type === 'vef' ? 'type-vef' : op.type === 'alije' ? 'type-alije' : op.type === 'terminal' ? 'type-terminal' : 'type-custom'}">${t?.label || (op.type ? op.type : 'Personalizada')}</span>
        <span class="op-card-date">${date}</span>
      </div>
    </div>`;
}

// ===== MODALS =====
function buildModal() {
  if (state.modal === 'new-op-1') return buildModalNewOp1();
  if (state.modal === 'new-op-2') return buildModalNewOp2();
  if (state.modal === 'module-picker') return buildModulePicker();
  return '';
}

function buildModulePicker() {
  const opId = state.modalData?.pickerOpId;
  const op = getOp(opId);
  if (!op) return '';
  const order = resolveModuleOrder(op);
  return `
    <div class="overlay" data-action="close-modal-bg">
      <div class="modal" data-stop-propagation="true" style="max-width:520px">
        <div class="modal-header">
          <div>
            <div class="modal-title">Agregar Módulo</div>
            <div class="modal-subtitle">Selecciona el bloque que quieres agregar a esta operación</div>
          </div>
          <button class="modal-close" data-action="close-modal">×</button>
        </div>
        <div class="modal-body" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px">
          ${MODULE_LIBRARY.map(lib => {
            const alreadyHas = !lib.multi && order.some(k => moduleType(k) === lib.type);
            return `
              <div class="module-picker-card ${alreadyHas ? 'disabled' : ''}"
                   data-action="${alreadyHas ? '' : 'add-module-type'}"
                   data-opid="${opId}" data-type="${lib.type}"
                   style="border:1.5px solid var(--line2);border-radius:10px;padding:14px 16px;cursor:${alreadyHas?'default':'pointer'};opacity:${alreadyHas?'0.45':'1'};transition:border-color .15s,box-shadow .15s"
                   ${alreadyHas?'':'onmouseover="this.style.borderColor=\'var(--gold)\';this.style.boxShadow=\'0 0 0 2px rgba(204,157,61,.18)\'" onmouseout="this.style.borderColor=\'var(--line2)\';this.style.boxShadow=\'none\'"'}>
                <div style="font-size:22px;margin-bottom:6px">${lib.icon}</div>
                <div style="font-weight:700;font-size:13px;color:var(--fg)">${lib.label}</div>
                <div style="font-size:11.5px;color:var(--muted);margin-top:4px">${lib.desc}</div>
                ${alreadyHas ? '<div style="font-size:10.5px;color:var(--gold);margin-top:6px">Ya agregado</div>' : ''}
                ${lib.multi ? '<div style="font-size:10.5px;color:var(--accent);margin-top:4px">Se pueden agregar varios</div>' : ''}
              </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
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
      <div class="modal modal-lg" data-stop-propagation="true">
        <div class="modal-header">
          <div>
            <div class="modal-step">Paso 2 de 2</div>
            <div class="modal-title">Estructura de la Operación</div>
            <div class="modal-subtitle">${d.code} — ${d.vesselName}</div>
          </div>
          <button class="modal-close" data-action="close-modal">×</button>
        </div>
        <div class="modal-body">
          <div class="progress-steps">
            <div class="progress-step done">1. Datos generales</div>
            <div class="progress-step active">2. Estructura</div>
          </div>
          <p style="font-size:13px;color:var(--muted);margin-bottom:20px">Elige un inicio rápido o arma tu operación desde cero con los módulos que necesites.</p>

          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Tipo de operación</div>
          <div class="type-cards">
            ${['vef-arribo','completa'].map(k => { const t = OP_TYPES[k]; return `
              <div class="type-card ${d.opType===k?'selected':''}" data-action="select-type" data-type="${k}">
                <div class="type-card-icon">${t.icon}</div>
                <div class="type-card-title">${t.label}</div>
                <div class="type-card-desc">${t.desc}</div>
                <div class="type-card-modules">
                  ${t.modules.map(m => `<span class="type-card-module">${MODULE_META[m]?.label || m}</span>`).join('')}
                </div>
              </div>`; }).join('')}
          </div>

          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin:20px 0 6px">Módulos opcionales</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:12px">Se incluyen por defecto. Desactiva los que el cliente no requiera.</div>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            ${[['discharge-record','📋 Discharge Record'],['termometros','🌡️ Termómetros (API 7.1)']].map(([k,label]) => `
              <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;padding:8px 14px;border:1px solid var(--line);border-radius:8px;background:var(--paper)">
                <input type="checkbox" id="opt-${k}" ${d['opt_'+k]===false?'':'checked'} onchange="state.modalData['opt_${k}']=this.checked">
                ${label}
              </label>`).join('')}
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
  const moduleOrder = resolveModuleOrder(op);
  const isCustom = !!op.moduleOrder; // true = nueva arquitectura modular
  const clients = (op.clients || []).map(c => `<span class="badge badge-client">${c.name}</span>`).join('');
  const mod = state.currentModule || moduleOrder[0];
  const typeLabel = op.type ? (OP_TYPES[op.type]?.label || op.type) : 'Personalizada';
  const typeCls = op.type === 'vef' ? 'type-vef' : op.type === 'alije' ? 'type-alije' : 'type-terminal';

  let content = '';
  if (op.type === 'alije' && !op.moduleOrder && ['ullage-inicial','ullage-final','time-log','vef','discharge-record','slops','checklist-madre','checklist-alijador'].includes(mod)) {
    content = buildAlijeWrapper(op, mod);
  } else {
    content = buildModuleContent(op, mod, null);
  }

  const tabs = moduleOrder.map(m => {
    const icon = MODULE_META[m]?.icon || MODULE_LIBRARY.find(l=>l.type===moduleType(m))?.icon || '📄';
    const label = moduleLabel(op, m);
    const canRemove = isCustom && moduleOrder.length > 1;
    return `
      <div class="module-tab ${mod===m?'active':''}" data-action="switch-module" data-module="${m}" style="display:flex;align-items:center;gap:4px;padding-right:${canRemove?'6px':''}">
        <span>${icon} ${label}</span>
        ${canRemove ? `<span class="module-tab-remove" data-action="remove-module" data-mod="${m}" data-opid="${op.id}" title="Eliminar módulo">×</span>` : ''}
      </div>`;
  }).join('');

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
              <span class="op-type-badge ${typeCls}">${typeLabel}</span>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary btn-sm" data-action="edit-op" data-id="${op.id}">Editar</button>
            <button class="btn btn-danger btn-sm" data-action="delete-op" data-id="${op.id}">Eliminar</button>
          </div>
        </div>
      </div>
      <div class="module-tabs">
        ${tabs}
        <div class="module-tab module-tab-add" data-action="open-module-picker" data-opid="${op.id}" title="Agregar módulo">＋ Módulo</div>
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
  const mtype = moduleType(mod);
  const NO_IA_PANEL = new Set(['reporte-evolutivo','summary']);

  let html = '';
  // Nuevos módulos
  if (mod === 'datos-origen')                                             html = buildDatosOrigen(data, ctxStr);
  else if (mod === 'ullage-arribo' || mtype === 'ullage-ini' || mtype === 'ullage-fin') html = buildUllageArribo(data, mod, ctxStr);
  else if (mod === 'vef-comparativo')                                     html = buildVEFComparativo(data, ctxStr);
  else if (mod === 'reporte-evolutivo') { const op2 = getOp(ctx.opId); return op2 ? buildReporteEvolutivo(op2, ctxStr) : ''; }
  else if (mod === 'termometros')                                         html = buildTermometros(data, ctxStr);
  // Legacy
  else if (mod === 'origen')                                              html = buildOrigen(data, ctxStr);
  else if (mod === 'key-meeting')                                         html = buildKeyMeeting(data, ctxStr);
  else if (mod === 'ullage-inicial' || mod === 'ullage-final' || mtype === 'ullage' || mtype === 'ullage-inicial' || mtype === 'ullage-final') html = buildUllage(data, mod, ctxStr);
  else if (mod === 'vef')                                                 html = buildVEF(data, ctxStr);
  else if (mod === 'time-log')                                            html = buildTimeLog(data, ctxStr);
  else if (mod === 'discharge-record')                                    html = buildDischargeRecord(data, ctxStr);
  else if (mod === 'slops')                                               html = buildSlops(data, ctxStr);
  else if (mod.startsWith('checklist') || mtype === 'checklist')         html = buildChecklist(data, mod, ctxStr);
  else if (mod === 'summary') {
    const op = getOp(ctx.opId);
    return op ? buildSummary(op, ctxStr) : '<div class="text-muted">Operación no encontrada.</div>';
  } else {
    html = `<div class="module-title">${meta.label}</div><div class="text-muted">Módulo en desarrollo.</div>`;
  }

  if (!NO_IA_PANEL.has(mod)) html += buildModuleIAPanel(data, mod, ctx, ctxStr);
  return html;
}

// ===== PANEL IA POR MÓDULO =====
function buildModuleIAPanel(data, mod, ctx, ctxStr) {
  const meta = MODULE_META[mod] || {};
  const label = meta.label || mod;
  const analysis = data.iaAnalysis || '';
  const iaDate   = data.iaDate   || '';
  const analyzing = data._iaLoading;
  // iaIncludeInReport: true by default (undefined = true), false = excluded
  const included = data.iaIncludeInReport !== false;

  const includeToggle = analysis ? `
    <div style="display:flex;align-items:center;gap:8px;margin-top:10px;padding:8px 12px;background:${included?'#f0f7f0':'#fff8f0'};border-radius:6px;border:1px solid ${included?'#6aaa6a':'#e8a030'}">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex:1;margin:0">
        <input type="checkbox" ${included?'checked':''} data-action="mod-ia-toggle-report" data-ctx="${ctxStr}" data-mod="${mod}"
          style="width:15px;height:15px;accent-color:#1a2f5a;cursor:pointer">
        <span style="font-size:12px;font-weight:600;color:${included?'#2a6a2a':'#b06000'}">
          ${included ? '📊 Incluido en Reporte Evolutivo' : '⬜ No incluido en Reporte Evolutivo'}
        </span>
      </label>
      <span style="font-size:10px;color:var(--muted)">Opcional</span>
    </div>` : '';

  return `
  <div class="card mod-ia-panel" style="margin-top:20px;border-top:2px solid var(--amber);background:linear-gradient(135deg,#fffef8 0%,#f8faff 100%)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${analysis?'10px':'0'}">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:18px">🤖</span>
        <div>
          <div style="font-weight:700;font-size:13px;color:var(--ink)">Consultor IA — ${label}</div>
          ${iaDate ? `<div style="font-size:10px;color:var(--muted)">Último análisis: ${new Date(iaDate).toLocaleString('es-CL',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>` : ''}
        </div>
      </div>
      <button class="btn btn-primary btn-sm" data-action="mod-ia-analyze" data-ctx="${ctxStr}" data-mod="${mod}"
        ${analyzing?'disabled':''} style="gap:6px">
        ${analyzing ? '⏳ Analizando…' : analysis ? '🔄 Re-Analizar' : '🤖 Analizar Módulo'}
      </button>
    </div>
    ${analysis
      ? `<div class="ia-response" style="margin-top:8px;white-space:pre-wrap;font-size:12px;line-height:1.65;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:6px;padding:12px 14px">${analysis}</div>${includeToggle}`
      : `<div style="font-size:12px;color:var(--muted);padding-top:6px">Haga clic en "Analizar Módulo" para obtener comentarios técnicos del inspector IA basados en los datos ingresados.</div>`}
  </div>`;
}

function encodeCtx(ctx) { return encodeURIComponent(JSON.stringify(ctx)); }
function decodeCtx(s) { try { return JSON.parse(decodeURIComponent(s)); } catch { return {}; } }

// ===== MODULE: ORIGEN =====
function buildOrigen(d, ctx) {
  const bl = d.bl || {};
  const shore = d.shore || {};
  const ship = d.shipFigureOrigin || {};
  const tempUnit = d.tempUnit || 'C'; // 'C' or 'F'
  const tempLabel = tempUnit === 'F' ? 'Temperatura (°F)' : 'Temperatura (°C)';
  const tempPlaceholder = tempUnit === 'F' ? '°F' : '°C';
  const tempToggle = (colData, objKey) => `
    <tr>
      <td style="font-weight:600;color:var(--ink);font-size:12px">${tempLabel}</td>
      <td><input class="tbl-input" type="number" step="0.01" value="${colData['temp']||''}"
          data-action="save-nested" data-ctx="${ctx}" data-obj="${objKey}" data-field="temp" placeholder="—"></td>
      <td style="color:var(--muted);font-size:11px">${tempPlaceholder}</td>
      <td>
        <span style="display:inline-flex;gap:2px">
          <button style="padding:1px 5px;font-size:10px;font-weight:700;border-radius:3px;border:1px solid var(--line);cursor:pointer;background:${tempUnit==='C'?'var(--accent)':'var(--white)'};color:${tempUnit==='C'?'#fff':'var(--muted)'}"
            data-action="set-temp-unit" data-ctx="${ctx}" data-unit="C">°C</button>
          <button style="padding:1px 5px;font-size:10px;font-weight:700;border-radius:3px;border:1px solid var(--line);cursor:pointer;background:${tempUnit==='F'?'var(--accent)':'var(--white)'};color:${tempUnit==='F'?'#fff':'var(--muted)'}"
            data-action="set-temp-unit" data-ctx="${ctx}" data-unit="F">°F</button>
        </span>
      </td>
    </tr>`;

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
          <label class="field-label">Temperatura observada (${tempPlaceholder})</label>
          <input class="field-input" type="number" step="0.01" value="${d.originTemp||''}" placeholder="${tempPlaceholder}"
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
              ${tempToggle(bl,'bl')}
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
              ${tempToggle(shore,'shore')}
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
              ${tempToggle(ship,'shipFigureOrigin')}
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

// ===== VEF TABLE HELPERS =====
const VEF_CATS = {
  'TERMINAL':            { label:'Terminal (Shore)',              k:'Shore', autoReject:false },
  'BUQUE_CON_VEF':      { label:'Buque con VEF (Ship)',          k:'Ship',  autoReject:true  },
  'MODIFICACION_TABLA': { label:'Modificación Tabla Capacidad',  k:'Shore', autoReject:true  },
  'ENTRADA_DIQUE':      { label:'Entrada a Dique (Dry Dock)',     k:'Shore', autoReject:true  },
  'SIN_REGISTRO_FISICO':{ label:'Sin Registro Físico',           k:'Shore', autoReject:true  },
};

function emptyVEFVoyage() {
  return { voyageNum:'', product:'', terminal:'', date:'', vesselTCV:'', obq:'0', shoreTCV:'', category:'TERMINAL', comment:'', manualReject:false };
}

function computeVEFStats(voyages) {
  const GROSS_ERR = 0.02, BAND = 0.003;
  const rows = voyages.map(v => {
    const vessel = parseFloat(v.vesselTCV) || 0;
    const obq    = parseFloat(v.obq) || 0;
    const shore  = parseFloat(v.shoreTCV) || 0;
    const discharged = vessel - obq;
    const ratio = shore > 0 ? discharged / shore : null;
    const cat = VEF_CATS[v.category] || VEF_CATS['TERMINAL'];
    const grossErr = ratio !== null && Math.abs(ratio - 1) > GROSS_ERR;
    const isRejected = v.manualReject || cat.autoReject || grossErr;
    return { ...v, discharged, ratio, grossErr, cat, isRejected, qualifying: false };
  });
  const nonRej = rows.filter(r => !r.isRejected && r.ratio !== null);
  const sumNRV = nonRej.reduce((s,r) => s + r.discharged, 0);
  const sumNRS = nonRej.reduce((s,r) => s + (parseFloat(r.shoreTCV)||0), 0);
  const meanRatio = sumNRS > 0 ? sumNRV / sumNRS : null;
  const lo = meanRatio !== null ? meanRatio - BAND : null;
  const hi = meanRatio !== null ? meanRatio + BAND : null;
  const rows2 = rows.map(r => ({
    ...r,
    qualifying: !r.isRejected && r.ratio !== null && lo !== null && r.ratio >= lo && r.ratio <= hi && r.cat.k !== 'Ship'
  }));
  const qualRows = rows2.filter(r => r.qualifying);
  const sumQV = qualRows.reduce((s,r) => s + r.discharged, 0);
  const sumQS = qualRows.reduce((s,r) => s + (parseFloat(r.shoreTCV)||0), 0);
  const vef = qualRows.length >= 5 && sumQS > 0 ? sumQV / sumQS : (qualRows.length > 0 && sumQS > 0 ? sumQV / sumQS : 1);
  return { rows: rows2, meanRatio, lo, hi, qualCount: qualRows.length, sumQV, sumQS, vef, sumNRV, sumNRS };
}

function buildVEFTableSection(vefData, ctx, sub) {
  const voyages = vefData.voyages || [];
  const stats = computeVEFStats(voyages);
  const ds = sub ? `data-sub="${sub}"` : '';
  const fmtR = v => v !== null ? v.toFixed(5) : '—';
  const fmtN = v => v ? Math.round(v).toLocaleString('en-US') : '—';
  const vefColor = Math.abs(stats.vef - 1) < 0.003 ? 'var(--ink)' : (stats.vef < 1 ? '#c62828' : '#1565c0');

  // Ordinal for non-rejected rows
  let ord = 0;
  const ordinals = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th',
    '11th','12th','13th','14th','15th','16th','17th','18th','19th','20th'];

  const voyageRows = voyages.map((v, i) => {
    const r = stats.rows[i];
    const rejClass = r.isRejected ? 'color:var(--muted);text-decoration:line-through' : '';
    const seq = r.isRejected ? '' : (ordinals[ord++] || `${ord}th`);
    const ratioColor = r.ratio === null ? '' : (Math.abs(r.ratio - 1) > 0.02 ? 'color:#c62828;font-weight:700' : '');
    const qualBadge = r.qualifying
      ? '<span style="background:#e8f5e9;color:#2e7d32;padding:1px 6px;border-radius:10px;font-size:10px;font-weight:700">Y</span>'
      : '<span style="background:var(--line2);color:var(--muted);padding:1px 6px;border-radius:10px;font-size:10px">N</span>';
    const rejBadge = r.isRejected
      ? `<span style="background:#ffebee;color:#c62828;padding:1px 6px;border-radius:10px;font-size:10px;font-weight:700">YES${r.cat.autoReject||r.grossErr?'*':''}</span>`
      : '<span style="background:#e8f5e9;color:#2e7d32;padding:1px 6px;border-radius:10px;font-size:10px">No</span>';
    const catOpts = Object.entries(VEF_CATS).map(([k,c]) =>
      `<option value="${k}"${v.category===k?' selected':''}>${c.label}</option>`).join('');
    return `
      <tr>
        <td style="font-weight:600;font-size:11px;color:var(--muted);text-align:center;min-width:40px">${seq}</td>
        <td style="min-width:95px"><input class="tbl-input" type="date" value="${v.date||''}"
          data-action="vef-save-voyage" ${ds} data-ctx="${ctx}" data-idx="${i}" data-field="date"></td>
        <td style="min-width:70px"><input class="tbl-input" value="${v.voyageNum||''}" placeholder="N° viaje"
          data-action="vef-save-voyage" ${ds} data-ctx="${ctx}" data-idx="${i}" data-field="voyageNum"></td>
        <td style="min-width:130px"><input class="tbl-input" value="${v.terminal||''}" placeholder="Puerto/Terminal"
          data-action="vef-save-voyage" ${ds} data-ctx="${ctx}" data-idx="${i}" data-field="terminal"></td>
        <td style="min-width:110px"><input class="tbl-input" value="${v.product||''}" placeholder="Cargo"
          data-action="vef-save-voyage" ${ds} data-ctx="${ctx}" data-idx="${i}" data-field="product"></td>
        <td style="min-width:100px"><input class="tbl-input" type="number" step="1" value="${v.vesselTCV||''}" placeholder="0"
          data-action="vef-save-voyage" ${ds} data-ctx="${ctx}" data-idx="${i}" data-field="vesselTCV"></td>
        <td style="min-width:80px"><input class="tbl-input" type="number" step="1" value="${v.obq||'0'}" placeholder="0"
          data-action="vef-save-voyage" ${ds} data-ctx="${ctx}" data-idx="${i}" data-field="obq"></td>
        <td style="min-width:90px;font-size:12px;color:var(--ink);${rejClass}">${fmtN(r.discharged)}</td>
        <td style="min-width:100px"><input class="tbl-input" type="number" step="1" value="${v.shoreTCV||''}" placeholder="0 (B/L)"
          data-action="vef-save-voyage" ${ds} data-ctx="${ctx}" data-idx="${i}" data-field="shoreTCV"></td>
        <td style="min-width:160px">
          <select class="tbl-input" data-action="vef-save-voyage" ${ds} data-ctx="${ctx}" data-idx="${i}" data-field="category" style="font-size:11px">
            ${catOpts}
          </select>
        </td>
        <td style="min-width:70px;font-size:12px;${ratioColor}">${fmtR(r.ratio)}</td>
        <td style="text-align:center">${r.grossErr ? '<span style="color:#c62828;font-weight:700;font-size:11px">Y</span>' : '<span style="color:var(--muted);font-size:11px">N</span>'}</td>
        <td style="text-align:center">${qualBadge}</td>
        <td style="text-align:center">${rejBadge}</td>
        <td style="min-width:130px"><input class="tbl-input" value="${v.comment||''}" placeholder="Obs."
          data-action="vef-save-voyage" ${ds} data-ctx="${ctx}" data-idx="${i}" data-field="comment"></td>
        <td><button class="btn btn-ghost btn-sm" style="color:var(--danger);padding:2px 6px"
          data-action="vef-del-voyage" ${ds} data-ctx="${ctx}" data-idx="${i}">×</button></td>
      </tr>`;
  }).join('');

  const vefDisplay = stats.qualCount >= 5
    ? `<span style="font-size:28px;font-weight:800;color:${vefColor}">${stats.vef.toFixed(4)}</span>`
    : `<span style="font-size:28px;font-weight:800;color:var(--muted)">1.0000</span><span style="font-size:11px;color:var(--muted);margin-left:8px">(< 5 viajes calificantes → VEF=1)</span>`;

  return `
    <div style="overflow-x:auto;margin-bottom:0">
      <table class="data-table" style="min-width:1100px;font-size:12px">
        <thead>
          <tr style="background:var(--line2)">
            <th style="min-width:40px">#</th>
            <th>Fecha</th>
            <th>Viaje</th>
            <th>Puerto / Terminal</th>
            <th>Cargo</th>
            <th>TCV Nave<br><span style="font-weight:400;font-size:10px">Arribo (BBL)</span></th>
            <th>OBQ/ROB<br><span style="font-weight:400;font-size:10px">(BBL)</span></th>
            <th>TCV Descarg.<br><span style="font-weight:400;font-size:10px">(BBL)</span></th>
            <th>TCV Shore<br><span style="font-weight:400;font-size:10px">B/L (BBL)</span></th>
            <th>Categoría</th>
            <th>Ratio V/S</th>
            <th>Gross<br>Err</th>
            <th>Qual.</th>
            <th>Rechaz.</th>
            <th>Comentario</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${voyageRows || `<tr><td colspan="16" style="text-align:center;color:var(--muted);padding:20px;font-size:12px">Sin viajes registrados. Use "＋ Agregar Viaje" para iniciar el historial.</td></tr>`}
        </tbody>
      </table>
    </div>
    <div style="padding:10px 0 4px">
      <button class="btn btn-secondary btn-sm" data-action="vef-add-voyage" ${ds} data-ctx="${ctx}">＋ Agregar Viaje</button>
      <span style="font-size:11px;color:var(--muted);margin-left:10px">Registros rechazados (*) son automáticos por categoría o Gross Error &gt;2%. El ratio se calcula: TCV Descargado / TCV Shore.</span>
    </div>

    ${voyages.length > 0 ? `
    <div style="margin-top:16px;background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:16px">
      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">Resultados VEF</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:14px">
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--muted)">Viajes no rechazados</div>
          <div style="font-size:18px;font-weight:700">${stats.rows.filter(r=>!r.isRejected).length}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--muted)">Ratio Medio V/S</div>
          <div style="font-size:18px;font-weight:700">${fmtR(stats.meanRatio)}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--muted)">Banda ±0.30%</div>
          <div style="font-size:14px;font-weight:600">${fmtR(stats.lo)} – ${fmtR(stats.hi)}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--muted)">Viajes calificantes</div>
          <div style="font-size:18px;font-weight:700;color:${stats.qualCount>=5?'#2e7d32':'#c62828'}">${stats.qualCount}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--muted)">ΣVessel calificantes</div>
          <div style="font-size:14px;font-weight:600">${fmtN(stats.sumQV)} BBL</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--muted)">ΣShore calificantes</div>
          <div style="font-size:14px;font-weight:600">${fmtN(stats.sumQS)} BBL</div>
        </div>
      </div>
      <div style="text-align:center;padding:12px;border-top:1px solid var(--line);margin-top:4px">
        <div style="font-size:10px;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">VESSEL EXPERIENCE FACTOR</div>
        ${vefDisplay}
      </div>
    </div>` : ''}

    <div style="margin-top:12px">
      <label class="field-label">Observaciones VEF</label>
      <textarea class="field-input" style="height:60px" placeholder="Notas del VEF, fuente del historial, observaciones…"
        data-action="${sub ? 'vef-save-notes' : 'save-field'}" ${ds} data-ctx="${ctx}" data-field="notes">${vefData.notes||''}</textarea>
    </div>`;
}

// ===== MODULE: DATOS DE ORIGEN =====
function buildDatosOrigen(d, ctx) {
  const bl = d.bl || {};
  const vef = d.vefOrigen || {};
  const ull = d.ullageOrigen || {};
  const ullTanks = ull.tanks || TANK_NAMES.map(n => ({ name:n, refHeight:'', measured:'', api:'', temp:'', vcf:'', gsv:'', tcv:'' }));

  const fmtVal = (v, dec=2) => v !== '' && v !== undefined && v !== null && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(dec) : '';
  const row = (label, field, step='0.001', unit='', dec=2) => `
    <tr>
      <td style="font-weight:600;font-size:12px;color:var(--ink);white-space:nowrap">${label}</td>
      <td><input class="tbl-input" type="text" inputmode="decimal" value="${fmtVal(bl[field], dec)}"
          data-action="save-nested" data-ctx="${ctx}" data-obj="bl" data-field="${field}" placeholder="—"
          onblur="this.value=this.value&&!isNaN(parseFloat(this.value))?parseFloat(this.value).toFixed(${dec}):this.value"></td>
      <td style="color:var(--muted);font-size:11px">${unit}</td>
    </tr>`;

  const blTcvCalc = (parseFloat(bl.gsv)||0) + (parseFloat(bl.fw)||0);
  const blTcvDisplay = blTcvCalc > 0 ? blTcvCalc.toFixed(2) : (bl.tcv || '—');
  const blNsvCalc = (parseFloat(bl.gsv)||0) * (1 - (parseFloat(bl.bsw)||0) / 100);
  const blNsvDisplay = blNsvCalc > 0 ? blNsvCalc.toFixed(2) : (bl.nsv || '—');

  const ullRow = (t, i) => `
    <tr>
      <td style="font-weight:600;font-size:12px;text-align:center">${t.name}</td>
      <td><input class="tbl-input" type="number" step="0.001" value="${t.refHeight||''}"
          data-action="save-ull-origen" data-ctx="${ctx}" data-idx="${i}" data-field="refHeight" placeholder="—"></td>
      <td><input class="tbl-input" type="number" step="0.001" value="${t.measured||''}"
          data-action="save-ull-origen" data-ctx="${ctx}" data-idx="${i}" data-field="measured" placeholder="—"></td>
      <td><input class="tbl-input" type="number" step="0.1" value="${t.api||''}"
          data-action="save-ull-origen" data-ctx="${ctx}" data-idx="${i}" data-field="api" placeholder="—"></td>
      <td><input class="tbl-input" type="number" step="0.1" value="${t.temp||''}"
          data-action="save-ull-origen" data-ctx="${ctx}" data-idx="${i}" data-field="temp" placeholder="—"></td>
      <td><input class="tbl-input" type="number" step="0.00001" value="${t.vcf||''}"
          data-action="save-ull-origen" data-ctx="${ctx}" data-idx="${i}" data-field="vcf" placeholder="—"></td>
      <td><input class="tbl-input" type="number" step="0.001" value="${t.gsv||''}"
          data-action="save-ull-origen" data-ctx="${ctx}" data-idx="${i}" data-field="gsv" placeholder="—"></td>
      <td><input class="tbl-input" type="number" step="0.001" value="${t.tcv||''}"
          data-action="save-ull-origen" data-ctx="${ctx}" data-idx="${i}" data-field="tcv" placeholder="—"></td>
    </tr>`;

  return `
    <div class="module-title">📦 Datos de Origen</div>
    <div class="module-subtitle">Bill of Lading · Ullage de Origen · VEF</div>

    <div class="card">
      <div class="card-title">Bill of Lading</div>
      <div class="form-row form-row-3" style="margin-bottom:12px">
        <div class="field">
          <label class="field-label">N° BL</label>
          <input class="field-input" value="${d.blNumber||''}" placeholder="Número de BL"
            data-action="save-field" data-ctx="${ctx}" data-field="blNumber">
        </div>
        <div class="field">
          <label class="field-label">Fecha BL</label>
          <input class="field-input" type="date" value="${d.blDate||''}"
            data-action="save-field" data-ctx="${ctx}" data-field="blDate">
        </div>
        <div class="field">
          <label class="field-label">Puerto de carga</label>
          <input class="field-input" value="${d.loadPort||''}" placeholder="Puerto"
            data-action="save-field" data-ctx="${ctx}" data-field="loadPort">
        </div>
      </div>
      <div class="form-row form-row-2" style="margin-bottom:0">
        <div class="field">
          <label class="field-label">Terminal</label>
          <input class="field-input" value="${d.loadTerminal||''}" placeholder="Terminal"
            data-action="save-field" data-ctx="${ctx}" data-field="loadTerminal">
        </div>
        <div class="field">
          <label class="field-label">Berth / Muelle</label>
          <input class="field-input" value="${d.loadBerth||''}" placeholder="Berth"
            data-action="save-field" data-ctx="${ctx}" data-field="loadBerth">
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Cantidades BL</div>
      <table class="data-table" style="width:100%">
        <thead><tr>
          <th style="width:180px">Parámetro</th><th>Valor</th><th style="width:80px">Unidad</th>
        </tr></thead>
        <tbody>
          ${row('GSV @60°F','gsv','0.001','BBL')}
          <tr>
            <td style="font-weight:600;font-size:12px;color:var(--ink);white-space:nowrap">TCV (GSV+FW)</td>
            <td><span class="tbl-input" data-auto="tcv" data-ctx="${ctx}" data-obj="bl" style="display:block;background:var(--bg2);color:var(--muted);font-size:12px;padding:4px 8px;border-radius:4px;border:1px solid var(--line2)">${blTcvDisplay}</span></td>
            <td style="color:var(--muted);font-size:11px">BBL <span style="font-size:10px;color:var(--sea)">auto</span></td>
          </tr>
          ${row('Free Water','fw','0.001','BBL')}
          ${row('API Gravity @60°F','api','0.1','°API',1)}
          ${row('BS&W','bsw','0.01','%',3)}
          <tr>
            <td style="font-weight:600;font-size:12px;color:var(--ink);white-space:nowrap">NSV @60°F</td>
            <td><span class="tbl-input" data-auto="nsv" data-ctx="${ctx}" data-obj="bl" style="display:block;background:var(--bg2);color:var(--muted);font-size:12px;padding:4px 8px;border-radius:4px;border:1px solid var(--line2)">${blNsvDisplay}</span></td>
            <td style="color:var(--muted);font-size:11px">BBL <span style="font-size:10px;color:var(--sea)">auto</span></td>
          </tr>
          ${row('Densidad @15°C','densityAt15','0.0001','kg/m³')}
          ${row('Densidad @60°F','densityAt60','0.0001','kg/m³')}
          ${row('GSV m³ @15°C','m3At15','0.001','m³')}
          ${row('Toneladas largas','longTons','0.001','LT')}
          ${row('Toneladas métricas','metricTons','0.001','MT')}
        </tbody>
      </table>
    </div>

    <div class="card">
      <div class="card-title">VEF de Origen — Historial de Viajes</div>
      <div class="info-box" style="margin-bottom:12px">Registra el historial de viajes del buque para calcular el VEF según API MPMS 17.9. Mínimo 5 viajes calificantes para un VEF distinto de 1.0000. Los viajes con Buque con VEF, Gross Error &gt;2%, dique o modificación de tabla se rechazan automáticamente.</div>
      ${buildVEFTableSection(d.vefOrigen || {voyages:[],notes:''}, ctx, 'vefOrigen')}
    </div>

    <div class="card">
      <div class="card-title">Ullage de Origen — por tanque</div>
      <div style="overflow-x:auto">
        <table class="data-table" style="min-width:700px">
          <thead><tr>
            <th>Tanque</th>
            <th>Alt. Ref. (m)</th>
            <th>Alt. Medida (m)</th>
            <th>API @60°F</th>
            <th>Temp (°C)</th>
            <th>VCF</th>
            <th>GSV (BBL)</th>
            <th>TCV (BBL)</th>
          </tr></thead>
          <tbody>${ullTanks.map((t,i) => ullRow(t,i)).join('')}</tbody>
        </table>
      </div>
      <textarea class="field-input" style="margin-top:12px;height:60px" placeholder="Notas ullage de origen…"
        data-action="save-nested" data-ctx="${ctx}" data-obj="ullageOrigen" data-field="notes">${ull.notes||''}</textarea>
    </div>

    <div class="card">
      <label class="field-label">Observaciones generales</label>
      <textarea class="field-input" style="height:70px" placeholder="Notas adicionales…"
        data-action="save-field" data-ctx="${ctx}" data-field="notes">${d.notes||''}</textarea>
    </div>`;
}

// ===== MODULE: ULLAGE ARRIBO =====
function buildUllageArribo(d, mod, ctx) {
  const label = d._label || 'Ullage Arribo';
  const totals = d.totals || {};
  const tanks = d.tanks || TANK_NAMES.map(n => ({ name:n, refHeight:'', measured:'', api:'', temp:'', vcf:'' }));

  const tankRow = (t, i) => `
    <tr>
      <td style="font-weight:600;font-size:12px;text-align:center">${t.name}</td>
      <td><input class="tbl-input" type="number" step="0.001" value="${t.refHeight||''}"
          data-action="save-ull-arribo" data-ctx="${ctx}" data-idx="${i}" data-field="refHeight" placeholder="—"></td>
      <td><input class="tbl-input" type="number" step="0.001" value="${t.measured||''}"
          data-action="save-ull-arribo" data-ctx="${ctx}" data-idx="${i}" data-field="measured" placeholder="—"></td>
      <td><input class="tbl-input" type="number" step="0.1" value="${t.api||''}"
          data-action="save-ull-arribo" data-ctx="${ctx}" data-idx="${i}" data-field="api" placeholder="—"></td>
      <td><input class="tbl-input" type="number" step="0.01" value="${t.temp||''}"
          data-action="save-ull-arribo" data-ctx="${ctx}" data-idx="${i}" data-field="temp" placeholder="—"></td>
      <td><input class="tbl-input" type="number" step="0.00001" value="${t.vcf||''}"
          data-action="save-ull-arribo" data-ctx="${ctx}" data-idx="${i}" data-field="vcf" placeholder="—"></td>
    </tr>`;

  const fmtTotVal = (v, dec=2) => v !== '' && v !== undefined && v !== null && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(dec) : '';
  const totRow = (label, field, unit, dec=2) => `
    <tr>
      <td style="font-weight:600;font-size:12px;color:var(--ink)">${label}</td>
      <td><input class="tbl-input" type="text" inputmode="decimal" value="${fmtTotVal(totals[field], dec)}"
          data-action="save-nested" data-ctx="${ctx}" data-obj="totals" data-field="${field}" placeholder="—"
          onblur="this.value=this.value&&!isNaN(parseFloat(this.value))?parseFloat(this.value).toFixed(${dec}):this.value"></td>
      <td style="color:var(--muted);font-size:11px">${unit}</td>
    </tr>`;

  const tcvCalc = (parseFloat(totals.gsv)||0) + (parseFloat(totals.fw)||0);
  const tcvDisplay = tcvCalc > 0 ? tcvCalc.toFixed(2) : (totals.tcv || '—');
  const nsvCalc = (parseFloat(totals.gsv)||0) * (1 - (parseFloat(totals.bsw)||0) / 100);
  const nsvDisplay = nsvCalc > 0 ? nsvCalc.toFixed(2) : (totals.nsv || '—');

  return `
    <div class="module-title">📐 ${label}</div>
    <div class="module-subtitle">Medición de arribo · API MPMS 17</div>

    ${d._vesselName !== undefined ? `
    <div class="card" style="padding:10px 14px;display:flex;align-items:center;gap:10px">
      <span style="font-size:12px;font-weight:600;color:var(--muted);white-space:nowrap">🚢 Buque</span>
      <input class="field-input" style="flex:1;margin:0" value="${d._vesselName||''}" placeholder="Nombre del buque…"
        data-action="save-field" data-ctx="${ctx}" data-field="_vesselName">
    </div>` : ''}

    <div class="card">
      <div class="card-title">Condiciones del Buque</div>
      <div class="form-row form-row-4">
        <div class="field"><label class="field-label">Fecha</label>
          <input class="field-input" type="date" value="${d.date||''}" data-action="save-field" data-ctx="${ctx}" data-field="date"></div>
        <div class="field"><label class="field-label">Hora</label>
          <input class="field-input" type="time" value="${d.time||''}" data-action="save-field" data-ctx="${ctx}" data-field="time"></div>
        <div class="field"><label class="field-label">Trim (m)</label>
          <input class="field-input" type="number" step="0.01" value="${d.trim||''}" placeholder="0.00" data-action="save-field" data-ctx="${ctx}" data-field="trim"></div>
        <div class="field"><label class="field-label">Lista (°)</label>
          <input class="field-input" type="number" step="0.1" value="${d.list||''}" placeholder="0.0" data-action="save-field" data-ctx="${ctx}" data-field="list"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Medición por Tanque</div>
      <div style="overflow-x:auto">
        <table class="data-table" style="min-width:600px">
          <thead><tr>
            <th>Tanque</th>
            <th>Alt. Ref. (m)</th>
            <th>Alt. Medida (m)</th>
            <th>API @60°F</th>
            <th>Temp (°C)</th>
            <th>VCF</th>
          </tr></thead>
          <tbody>${tanks.map((t,i) => tankRow(t,i)).join('')}</tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Totales Calculados <span style="font-size:11px;font-weight:400;color:var(--muted)">(ingresar desde Excel)</span></div>
      <table class="data-table" style="width:100%">
        <thead><tr><th style="width:180px">Cantidad</th><th>Valor</th><th style="width:80px">Unidad</th></tr></thead>
        <tbody>
          ${totRow('GSV @60°F','gsv','BBL')}
          <tr>
            <td style="font-weight:600;font-size:12px;color:var(--ink)">TCV (GSV+FW)</td>
            <td><span class="tbl-input" data-auto="tcv" data-ctx="${ctx}" data-obj="totals" style="display:block;background:var(--bg2);color:var(--muted);font-size:12px;padding:4px 8px;border-radius:4px;border:1px solid var(--line2)">${tcvDisplay}</span></td>
            <td style="color:var(--muted);font-size:11px">BBL <span style="font-size:10px;color:var(--sea)">auto</span></td>
          </tr>
          ${totRow('Free Water','fw','BBL')}
          ${totRow('API Gravity @60°F','api','°API',1)}
          ${totRow('BS&W','bsw','%',3)}
          <tr>
            <td style="font-weight:600;font-size:12px;color:var(--ink)">NSV @60°F</td>
            <td><span class="tbl-input" data-auto="nsv" data-ctx="${ctx}" data-obj="totals" style="display:block;background:var(--bg2);color:var(--muted);font-size:12px;padding:4px 8px;border-radius:4px;border:1px solid var(--line2)">${nsvDisplay}</span></td>
            <td style="color:var(--muted);font-size:11px">BBL <span style="font-size:10px;color:var(--sea)">auto</span></td>
          </tr>
          ${totRow('Densidad @15°C','densityAt15','kg/m³')}
          ${totRow('GSV m³ @15°C','m3At15','m³')}
          ${totRow('Toneladas largas','longTons','LT')}
          ${totRow('Toneladas métricas','metricTons','MT')}
        </tbody>
      </table>
    </div>

    <div class="card">
      <div class="card-title">Documentos Adjuntos</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
        ${[['vessel','📄 Documentos Nave'],['surveyor','📄 Documentos Surveyor'],['aci','📊 Excel ACI (Calculado)']].map(([k,lbl]) => {
          const files = d.docs?.[k] || [];
          return `
          <div style="border:1px dashed var(--line);border-radius:8px;padding:12px">
            <div style="font-size:12px;font-weight:600;color:var(--ink);margin-bottom:8px">${lbl}</div>
            ${files.map((f,i) => `
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;background:var(--bg2);border-radius:4px;padding:4px 8px">
                <a href="${f.data}" download="${f.name}" style="flex:1;font-size:11px;color:var(--sea);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${f.name}">📎 ${f.name}</a>
                <button style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;line-height:1;padding:0"
                  data-action="doc-remove" data-ctx="${ctx}" data-slot="${k}" data-idx="${i}">✕</button>
              </div>`).join('')}
            <label style="display:block;margin-top:6px;cursor:pointer">
              <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--sea);font-weight:600;border:1px solid var(--sea);border-radius:4px;padding:3px 8px">
                + Adjuntar archivo
              </span>
              <input type="file" multiple style="display:none"
                data-action="doc-upload" data-ctx="${ctx}" data-slot="${k}">
            </label>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="card">
      <label class="field-label">Observaciones</label>
      <textarea class="field-input" style="height:70px" placeholder="Notas…"
        data-action="save-field" data-ctx="${ctx}" data-field="notes">${d.notes||''}</textarea>
    </div>

    <div class="card">
      <div class="card-title">📷 Evidencia Fotográfica / Video</div>
      <div class="info-box" style="margin-bottom:12px">Sube fotos de la medición (cinta, gabazo, nivel, termómetros, documentos). El Consultor IA las analiza junto con los datos numéricos. Videos: captura pantallazos y súbelos como imágenes.</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px" id="media-preview-${ctx}">
        ${(d.media||[]).map((m,i) => `
          <div style="position:relative;display:inline-block">
            <img src="${m.data}" alt="${m.name||'img'}" style="width:90px;height:90px;object-fit:cover;border-radius:8px;border:2px solid var(--line);cursor:pointer"
              onclick="this.parentElement.querySelector('.media-caption').style.display='block'" title="${m.name||''}">
            <div class="media-caption" style="display:none;position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.7);color:#fff;font-size:9px;padding:2px 4px;border-radius:0 0 6px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.caption||m.name||''}</div>
            <button style="position:absolute;top:-6px;right:-6px;background:var(--danger);color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer;padding:0;line-height:18px;text-align:center"
              data-action="media-remove" data-ctx="${ctx}" data-idx="${i}">×</button>
          </div>`).join('')}
        ${!(d.media||[]).length ? `<div style="color:var(--muted2);font-size:12px;padding:12px 0">Sin imágenes cargadas</div>` : ''}
      </div>
      <label class="btn btn-secondary btn-sm" style="cursor:pointer;display:inline-block">
        ＋ Agregar Fotos
        <input type="file" accept="image/*" multiple style="display:none" data-action="media-upload" data-ctx="${ctx}">
      </label>
      <span style="font-size:11px;color:var(--muted);margin-left:10px">JPG, PNG, HEIC — máx. 5 MB por imagen</span>
    </div>

    <div class="card" style="background:linear-gradient(135deg,var(--paper),var(--line2))">
      <div class="card-title">🤖 Análisis Comparativo IA — Origen vs Arribo</div>
      <div class="info-box" style="margin-bottom:12px">El Consultor IA analiza los datos del BL de origen versus arribo <strong>y las fotos de evidencia</strong>. Evalúa desvíos volumétricos, validez de la medición y posibles causas según API MPMS.</div>
      ${(d.media||[]).length ? `<div style="font-size:12px;color:var(--accent);margin-bottom:10px">📷 ${d.media.length} imagen(es) incluida(s) en el análisis</div>` : '<div style="font-size:12px;color:var(--muted);margin-bottom:10px">Sin imágenes — el análisis usará solo los datos numéricos</div>'}
      ${d.iaAnalysis ? `
        <div style="background:var(--white);border:1px solid var(--line);border-radius:8px;padding:16px;font-size:13px;white-space:pre-wrap;line-height:1.7;margin-bottom:12px;max-height:400px;overflow-y:auto">${d.iaAnalysis}</div>
        ${d.iaDate ? `<div style="font-size:11px;color:var(--muted);margin-bottom:8px">Generado: ${new Date(d.iaDate).toLocaleString('es-CL')}</div>` : ''}
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" style="flex:1" data-action="ia-analizar-arribo" data-ctx="${ctx}">🔄 Re-analizar</button>
          <button class="btn btn-ghost btn-sm" data-action="ia-clear-arribo" data-ctx="${ctx}">✕ Limpiar</button>
        </div>
      ` : `<button class="btn btn-primary" style="width:100%" data-action="ia-analizar-arribo" data-ctx="${ctx}">🔍 Analizar con Consultor IA</button>`}
    </div>`;
}

// ===== MODULE: VEF COMPARATIVO =====
function buildVEFComparativo(d, ctx) {
  // Get VEF from datos-origen for comparison
  const opId = decodeCtx(ctx)?.opId;
  const op = opId ? getOp(opId) : null;
  const origenVEF = op?.modules?.['datos-origen']?.vefOrigen;
  const origenStats = origenVEF?.voyages?.length ? computeVEFStats(origenVEF.voyages) : null;
  const arriboStats = (d.voyages||[]).length ? computeVEFStats(d.voyages) : null;
  const vefO = origenStats?.vef;
  const vefA = arriboStats?.vef;
  const diff = (vefO && vefA) ? (vefA - vefO) : null;

  return `
    <div class="module-title">⚖️ VEF al Arribo</div>
    <div class="module-subtitle">Vessel Experience Factor · Historial al Arribo · API MPMS 17.9</div>

    ${(vefO || vefA) ? `
    <div class="card">
      <div class="card-title">Comparativa VEF Origen vs VEF Arribo</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
        <div style="text-align:center;padding:16px;background:var(--paper);border-radius:8px;border:1px solid var(--line)">
          <div style="font-size:10px;color:var(--muted);margin-bottom:4px;text-transform:uppercase">VEF Origen</div>
          <div style="font-size:24px;font-weight:800;color:var(--ink)">${vefO ? vefO.toFixed(4) : '—'}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px">${origenStats?.qualCount||0} viajes cal.</div>
        </div>
        <div style="text-align:center;padding:16px;background:var(--paper);border-radius:8px;border:1px solid var(--line)">
          <div style="font-size:10px;color:var(--muted);margin-bottom:4px;text-transform:uppercase">VEF Arribo</div>
          <div style="font-size:24px;font-weight:800;color:var(--ink)">${vefA ? vefA.toFixed(4) : '—'}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px">${arriboStats?.qualCount||0} viajes cal.</div>
        </div>
        ${diff !== null ? `
        <div style="text-align:center;padding:16px;border-radius:8px;border:1px solid ${diff<0?'#e57373':'#66bb6a'};background:${diff<0?'#fff5f5':'#f5fff5'}">
          <div style="font-size:10px;color:var(--muted);margin-bottom:4px;text-transform:uppercase">Δ VEF</div>
          <div style="font-size:24px;font-weight:800;color:${diff<0?'#c62828':'#2e7d32'}">${diff>0?'+':''}${diff.toFixed(5)}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px">${diff>0?'+':''}${((diff/vefO)*100).toFixed(3)}%</div>
        </div>` : '<div></div>'}
      </div>
    </div>` : ''}

    <div class="card">
      <div class="card-title">VEF al Arribo — Historial de Viajes</div>
      <div class="info-box" style="margin-bottom:12px">Registra el historial de viajes al arribo para calcular el VEF actual del buque según API MPMS 17.9. Puede ser diferente al VEF de origen si el buque realizó viajes adicionales en tránsito.</div>
      ${buildVEFTableSection(d, ctx, null)}
    </div>`;
}

// ===== MODULE: TERMÓMETROS =====
function buildTermometros(d, ctx) {
  const tV = parseFloat(d.vessel?.tempF) || null;
  const tS = parseFloat(d.surveyor?.tempF) || null;
  const tA = parseFloat(d.aci?.tempF) || null;
  const diffVS = (tV !== null && tS !== null) ? Math.abs(tV - tS).toFixed(2) : null;
  const limitF = 0.5, limitC = 0.25;
  const vsOK = diffVS !== null ? parseFloat(diffVS) <= limitF : null;

  const eqBlock = (key, label, ed) => `
    <div style="border:1px solid var(--line);border-radius:10px;padding:14px">
      <div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:10px">${label}</div>
      <div class="form-row form-row-2">
        <div class="field"><label class="field-label">ID / Serie</label>
          <input class="field-input" value="${ed?.id||''}" placeholder="Nº equipo"
            data-action="save-nested" data-ctx="${ctx}" data-obj="${key}" data-field="id"></div>
        <div class="field"><label class="field-label">Fecha calibración</label>
          <input class="field-input" type="date" value="${ed?.calibDate||''}"
            data-action="save-nested" data-ctx="${ctx}" data-obj="${key}" data-field="calibDate"></div>
      </div>
      <div class="field" style="margin-top:8px"><label class="field-label">Temperatura (°F)</label>
        <input class="field-input" type="number" step="0.1" value="${ed?.tempF||''}" placeholder="—"
          data-action="save-nested" data-ctx="${ctx}" data-obj="${key}" data-field="tempF"></div>
    </div>`;

  return `
    <div class="module-title">🌡️ Comparativo de Termómetros</div>
    <div class="module-subtitle">API MPMS Cap. 7.1 §8.2.1 · Verificación de equipos</div>

    <div class="card">
      <div class="card-title">Datos de la Verificación</div>
      <div class="form-row form-row-3">
        <div class="field"><label class="field-label">Fecha</label>
          <input class="field-input" type="date" value="${d.date||''}"
            data-action="save-field" data-ctx="${ctx}" data-field="date"></div>
        <div class="field"><label class="field-label">Hora inicio</label>
          <input class="field-input" type="time" value="${d.startTime||''}"
            data-action="save-field" data-ctx="${ctx}" data-field="startTime"></div>
        <div class="field"><label class="field-label">Hora fin</label>
          <input class="field-input" type="time" value="${d.endTime||''}"
            data-action="save-field" data-ctx="${ctx}" data-field="endTime"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Equipos Comparados</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
        ${eqBlock('vessel',   '🚢 Buque (UTI/MMC)',   d.vessel)}
        ${eqBlock('surveyor', '🔬 Surveyor',          d.surveyor)}
        ${eqBlock('aci',      '🏢 ACI Loss Control',  d.aci)}
      </div>
    </div>

    ${diffVS !== null ? `
    <div class="card" style="border-color:${vsOK?'#66bb6a':'#e57373'}">
      <div class="card-title">Resultado API MPMS 7.1</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="text-align:center;padding:16px;border-radius:8px;background:${vsOK?'#f5fff5':'#fff5f5'}">
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px">Diferencia Buque vs Surveyor</div>
          <div style="font-size:28px;font-weight:700;color:${vsOK?'#2e7d32':'#c62828'}">${diffVS}°F</div>
          <div style="font-size:12px;margin-top:6px;color:${vsOK?'#2e7d32':'#c62828'};font-weight:600">
            ${vsOK ? '✓ Dentro de tolerancia (≤ 0.5°F)' : '⚠ EXCEDE tolerancia (> 0.5°F / 0.25°C)'}
          </div>
        </div>
        <div style="padding:12px;background:var(--paper);border-radius:8px;font-size:12px">
          <div style="font-weight:600;margin-bottom:8px">Tolerancias API MPMS 7.1 §8.2.1</div>
          <div>• Máximo: <strong>0.5°F</strong> ó <strong>0.25°C</strong></div>
          <div style="margin-top:6px;color:var(--muted)">Si excede: probar equipo de respaldo. Si diferencias son aceptables, usar equipo respaldo. Si no, notificar supervisor inmediatamente.</div>
        </div>
      </div>
    </div>` : ''}

    <div class="card">
      <label class="field-label">Observaciones generales</label>
      <textarea class="field-input" style="height:70px" placeholder="Observaciones…"
        data-action="save-field" data-ctx="${ctx}" data-field="generalRemarks">${d.generalRemarks||''}</textarea>
    </div>

    <div class="card">
      <div class="card-title">Firmantes</div>
      <div class="form-row form-row-2">
        <div class="field"><label class="field-label">Inspector / Surveyor</label>
          <input class="field-input" value="${d.sigInspector||''}" placeholder="Nombre"
            data-action="save-field" data-ctx="${ctx}" data-field="sigInspector"></div>
        <div class="field"><label class="field-label">Representante del Buque</label>
          <input class="field-input" value="${d.sigVesselRep||''}" placeholder="Nombre"
            data-action="save-field" data-ctx="${ctx}" data-field="sigVesselRep"></div>
      </div>
    </div>`;
}

// ===== MODULE: REPORTE EVOLUTIVO =====
function buildReporteEvolutivo(op, ctx) {
  const mods = op.modules || {};
  const re = mods['reporte-evolutivo'] || {};
  const origen = mods['datos-origen'] || {};
  const bl = origen.bl || {};
  const origenVEFStats = origen.vefOrigen?.voyages?.length ? computeVEFStats(origen.vefOrigen.voyages) : null;
  const vefO = origenVEFStats?.vef || null;
  const arriboVEFStats = mods['vef-comparativo']?.voyages?.length ? computeVEFStats(mods['vef-comparativo'].voyages) : null;
  const vefA = arriboVEFStats?.vef || null;

  // Collect arrival ullage modules
  const arriboKeys = (op.moduleOrder||[]).filter(k => k === 'ullage-arribo' || k.startsWith('ullage-ini') || k.startsWith('ullage-fin'));
  const firstArribo = arriboKeys.map(k => mods[k]).find(m => m?.totals?.gsv);
  const tot = firstArribo?.totals || {};

  // Volume comparison rows
  const fmtN = v => v ? parseFloat(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) : '—';
  const diffRow = (label, blVal, arrVal, unit) => {
    const b = parseFloat(blVal)||null, a = parseFloat(arrVal)||null;
    const d = (b&&a) ? a-b : null;
    const p = (b&&d) ? ((d/b)*100).toFixed(3) : null;
    const color = d===null?'':d<0?'color:#c62828':'color:#2e7d32';
    return `<tr>
      <td style="font-weight:600;font-size:12px">${label}</td>
      <td style="text-align:right">${fmtN(blVal)}</td>
      <td style="text-align:right">${fmtN(arrVal)}</td>
      <td style="text-align:right;font-weight:700;${color}">${d!==null?(d>0?'+':'')+fmtN(d):'—'}</td>
      <td style="text-align:right;${color};font-size:11px">${p!==null?(parseFloat(p)>0?'+':'')+p+'%':'—'}</td>
      <td style="color:var(--muted);font-size:11px">${unit}</td>
    </tr>`;
  };

  // Collect all IA analyses flagged for inclusion in the report
  const analyses = (op.moduleOrder||[]).map(k => {
    const m = mods[k];
    if (!m) return null;
    const mmeta = MODULE_META[k] || {};
    // Key Meeting acta always included (has its own include logic)
    if (k === 'key-meeting' && m.acta) return { key: k, label: '🤝 Key Meeting — Acta Formal', date: m.date, content: m.acta };
    // Module IA — only if flagged for report (default: included)
    if (m.iaAnalysis && m.iaIncludeInReport !== false)
      return { key: k, label: `${mmeta.icon||''}${mmeta.label||k} — Análisis IA`, date: m.iaDate, content: m.iaAnalysis };
    return null;
  }).filter(Boolean);

  // Build text for email/PDF
  const now = new Date().toLocaleDateString('es-CL');
  const vesselName = op.vessel?.name || '';
  const opCode = op.code || '';
  const product = op.product?.crudeName || op.product?.type || '';

  const opId = op.id;

  return `
    <div class="module-title">📊 Reporte Evolutivo</div>
    <div class="module-subtitle">${opCode} · ${vesselName} · ${product} · Generado: ${now}</div>

    <div class="card">
      <div class="card-title">Balance de Cantidades — Origen vs Arribo</div>
      ${(bl.gsv || tot.gsv) ? (() => {
        const _blNsv  = (parseFloat(bl.gsv)||0)  > 0 ? ((parseFloat(bl.gsv)||0)  * (1 - (parseFloat(bl.bsw)||0)  / 100)).toFixed(2) : '';
        const _totNsv = (parseFloat(tot.gsv)||0) > 0 ? ((parseFloat(tot.gsv)||0) * (1 - (parseFloat(tot.bsw)||0) / 100)).toFixed(2) : '';
        return `
      <div style="overflow-x:auto">
        <table class="data-table" style="width:100%">
          <thead><tr>
            <th>Parámetro</th>
            <th style="text-align:right">Origen (BL)</th>
            <th style="text-align:right">Arribo</th>
            <th style="text-align:right">Δ Diferencia</th>
            <th style="text-align:right">Δ %</th>
            <th>Unidad</th>
          </tr></thead>
          <tbody>
            ${diffRow('GSV @60°F',    bl.gsv,        tot.gsv,        'BBL')}
            ${diffRow('NSV @60°F',    _blNsv,        _totNsv,        'BBL')}
            ${diffRow('TCV (GSV+FW)', bl.tcv,        tot.tcv,        'BBL')}
            ${diffRow('Free Water',   bl.fw,         tot.fw,         'BBL')}
            ${diffRow('API @60°F',    bl.api,        tot.api,        '°API')}
            ${diffRow('BS&W',         bl.bsw,        tot.bsw,        '%')}
            ${diffRow('Densidad @15°C',bl.densityAt15,tot.densityAt15,'kg/m³')}
            ${diffRow('GSV m³ @15°C', bl.m3At15,     tot.m3At15,     'm³')}
            ${diffRow('Ton. métricas',bl.metricTons,  tot.metricTons, 'MT')}
          </tbody>
        </table>
      </div>`;
      })() : `<div class="info-box">Completa Datos de Origen y Ullage Arribo para ver el balance.</div>`}
    </div>

    ${(vefO || vefA) ? `
    <div class="card">
      <div class="card-title">VEF Comparativo</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
        <div style="text-align:center;padding:12px;border-radius:8px;background:var(--paper)">
          <div style="font-size:11px;color:var(--muted)">VEF Origen</div>
          <div style="font-size:22px;font-weight:700">${vefO?.toFixed(4)||'—'}</div>
        </div>
        <div style="text-align:center;padding:12px;border-radius:8px;background:var(--paper)">
          <div style="font-size:11px;color:var(--muted)">VEF Arribo</div>
          <div style="font-size:22px;font-weight:700">${vefA?.toFixed(4)||'—'}</div>
        </div>
        <div style="text-align:center;padding:12px;border-radius:8px;background:${(vefO&&vefA&&vefA-vefO<0)?'#fff5f5':'#f5fff5'}">
          <div style="font-size:11px;color:var(--muted)">Δ VEF</div>
          <div style="font-size:22px;font-weight:700;color:${(vefO&&vefA)?(vefA-vefO<0?'#c62828':'#2e7d32'):'var(--ink)'}">
            ${(vefO&&vefA)?((vefA-vefO>0?'+':'')+(vefA-vefO).toFixed(5)):'—'}
          </div>
        </div>
      </div>
    </div>` : ''}

    ${analyses.length ? `
    <div class="card">
      <div class="card-title">Análisis IA — Registro Cronológico</div>
      ${analyses.map(a => `
        <div style="border-left:3px solid var(--accent);padding:12px 16px;margin-bottom:16px;background:var(--paper);border-radius:0 8px 8px 0">
          <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:4px">${a.label}</div>
          ${a.date ? `<div style="font-size:11px;color:var(--muted);margin-bottom:8px">${new Date(a.date).toLocaleString('es-CL')}</div>` : ''}
          <div style="font-size:13px;white-space:pre-wrap;line-height:1.65;max-height:300px;overflow-y:auto">${a.content}</div>
        </div>`).join('')}
    </div>` : `
    <div class="card">
      <div class="card-title">Análisis IA — Registro Cronológico</div>
      <div class="info-box">Los análisis del Consultor IA aparecerán aquí a medida que se completen los módulos (Key Meeting, Ullage Arribo, etc.).</div>
    </div>`}

    <div class="card">
      <div class="card-title">Conclusión Final del Inspector</div>
      <textarea class="field-input" style="height:150px" placeholder="Análisis final, explicación de desvíos, causas identificadas, recomendaciones al cliente…"
        data-action="save-field" data-ctx="${ctx}" data-field="notes">${re.notes||''}</textarea>
    </div>

    <div class="card" style="background:var(--line2)">
      <div class="card-title">Exportar Reporte</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn btn-primary" style="flex:1;min-width:160px" data-action="print-full-report" data-opid="${opId}">
          📄 Descargar PDF Completo
        </button>
        <button class="btn btn-secondary" style="flex:1;min-width:160px" data-action="re-send-email" data-ctx="${ctx}" data-opid="${opId}">
          ✉️ Enviar por Correo
        </button>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:8px">El PDF incluye balance de cantidades, todos los análisis IA y la conclusión final. El correo abre tu cliente de email con el reporte completo.</div>
    </div>`;
}

// ===== PDF MODULE SELECTOR =====
function showPDFSelector(opId) {
  const op = getOp(opId);
  if (!op) return;
  const mods = op.modules || {};
  const order = op.moduleOrder || Object.keys(mods);

  // Labels for all known modules
  const modLabels = {
    'datos-origen': '1. Datos de Origen — Bill of Lading',
    'key-meeting': '2. Key Meeting',
    'ullage-arribo': '3. Ullage al Arribo',
    'vef-comparativo': '4. VEF al Arribo',
    'discharge-record': '5. Discharge Record',
    'time-log': '6. Time Log / SOF',
    'termometros': '7. Verificación de Termómetros',
    'checklist-inspeccion': '8. Checklist de Inspección',
    'reporte-evolutivo': '9. Reporte Evolutivo — Conclusión',
  };

  // Modules the user can toggle — reporte-evolutivo is always included and fixed
  const toggleable = order.filter(k => k !== 'reporte-evolutivo' && (modLabels[k] || MODULE_META[k]));

  const rows = toggleable.map(k => {
    const label = modLabels[k] || (MODULE_META[k]?.icon||'') + ' ' + (MODULE_META[k]?.label||k);
    return `<label style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #eee;cursor:pointer">
      <input type="checkbox" value="${k}" checked style="width:16px;height:16px;accent-color:#1a2f5a">
      <span style="font-size:13px">${label}</span>
    </label>`;
  }).join('');

  const overlay = document.createElement('div');
  overlay.id = 'pdf-selector-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:28px 32px;max-width:480px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.3)">
      <div style="font-size:18px;font-weight:800;color:#1a2f5a;margin-bottom:4px">📄 Configurar PDF</div>
      <div style="font-size:12px;color:#888;margin-bottom:16px">Selecciona los módulos a incluir. El Reporte Evolutivo siempre se agrega al final.</div>
      <div style="margin-bottom:12px">${rows}</div>
      <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:#f0f4ff;border-radius:8px;margin-bottom:20px">
        <span style="font-size:16px">📊</span>
        <span style="font-size:13px;font-weight:600;color:#1a2f5a">Reporte Evolutivo — siempre incluido al final</span>
        <span style="margin-left:auto;font-size:18px;color:#1a2f5a">✓</span>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button class="btn btn-ghost" data-action="pdf-cancel" style="padding:8px 20px">Cancelar</button>
        <button class="btn btn-primary" data-action="pdf-confirm-modules" data-opid="${opId}" style="padding:8px 24px">
          📄 Generar PDF
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

// ===== PDF FULL REPORT =====
function printFullReport(opId, selectedMods) {
  const op = getOp(opId);
  if (!op) return;
  const mods = op.modules || {};
  const incl = selectedMods ? new Set(selectedMods) : null; // null = include all
  const has = (k) => !incl || incl.has(k);
  const now = new Date().toLocaleDateString('es-CL', {day:'2-digit',month:'long',year:'numeric'});
  const fmtN = (v,d=2) => v ? parseFloat(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}) : '—';
  const fmtD = v => v ? new Date(v+'T12:00:00').toLocaleDateString('es-CL') : '—';
  const sec = (title, content) => `<div class="section"><h2>${title}</h2>${content}</div>`;
  const tbl = (headers, rows) => `<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
  const kv = (label, val) => `<tr><td class="label">${label}</td><td>${val||'—'}</td></tr>`;
  const iaBlock = (text) => text ? `<h3>Análisis — Consultor IA</h3><div class="ia-block">${text.replace(/\n/g,'<br>')}</div>` : '';

  // ── COVER ──────────────────────────────────────────────────────────────
  const cover = `
    <div class="cover">
      <div class="cover-logo">ACI <span>Loss Control</span></div>
      <div class="cover-title">REPORTE OPERACIONAL</div>
      <div class="cover-code">${op.code||''}</div>
      <table class="cover-tbl">
        <tr><td>Buque</td><td><strong>${op.vessel?.name||'—'}</strong></td></tr>
        <tr><td>IMO</td><td>${op.vessel?.imo||'—'}</td></tr>
        <tr><td>Viaje</td><td>${op.vessel?.voyage||'—'}</td></tr>
        <tr><td>Producto</td><td>${op.product?.crudeName||op.product?.type||'—'}</td></tr>
        <tr><td>Puerto</td><td>${op.port||'—'}</td></tr>
        <tr><td>Cliente</td><td>${op.client||'—'}</td></tr>
        <tr><td>Tipo de Operación</td><td>${OP_TYPES[op.type]?.label||op.type||'—'}</td></tr>
        <tr><td>Fecha del Reporte</td><td>${now}</td></tr>
      </table>
      <div class="cover-footer">Documento confidencial — Uso exclusivo del cliente · ACI Loss Control SpA</div>
    </div>
    <div class="page-break"></div>`;

  // ── DATOS DE ORIGEN ────────────────────────────────────────────────────
  const origen = mods['datos-origen'] || {};
  const bl = origen.bl || {};
  const vefOStats = origen.vefOrigen?.voyages?.length ? computeVEFStats(origen.vefOrigen.voyages) : null;
  const ullO = origen.ullageOrigen || {};

  const origenSec = sec('1. Datos de Origen — Bill of Lading', `
    <table class="kv">
      ${kv('N° Bill of Lading', origen.blNumber)}
      ${kv('Fecha BL', fmtD(origen.blDate))}
      ${kv('Puerto de Carga', origen.loadPort)}
      ${kv('Terminal', origen.loadTerminal)}
      ${kv('Berth / Muelle', origen.loadBerth)}
    </table>
    <h3>Cantidades BL</h3>
    <table>
      <thead><tr><th>Parámetro</th><th>Valor</th><th>Unidad</th></tr></thead>
      <tbody>
        <tr><td>GSV @60°F</td><td>${fmtN(bl.gsv)}</td><td>BBL</td></tr>
        <tr><td>TCV (GSV+FW)</td><td>${fmtN(bl.tcv)}</td><td>BBL</td></tr>
        <tr><td>Free Water</td><td>${fmtN(bl.fw)}</td><td>BBL</td></tr>
        <tr><td>API Gravity @60°F</td><td>${fmtN(bl.api,1)}</td><td>°API</td></tr>
        <tr><td>BS&W</td><td>${fmtN(bl.bsw,3)}</td><td>%</td></tr>
        <tr><td>Densidad @15°C</td><td>${fmtN(bl.densityAt15,1)}</td><td>kg/m³</td></tr>
        <tr><td>GSV m³ @15°C</td><td>${fmtN(bl.m3At15)}</td><td>m³</td></tr>
        <tr><td>Toneladas Largas</td><td>${fmtN(bl.longTons)}</td><td>LT</td></tr>
        <tr><td>Toneladas Métricas</td><td>${fmtN(bl.metricTons)}</td><td>MT</td></tr>
      </tbody>
    </table>
    ${vefOStats ? `<h3>VEF de Origen — Resultado</h3>
    <table class="kv">
      ${kv('VEF Calculado', '<strong>'+vefOStats.vef.toFixed(4)+'</strong>')}
      ${kv('Viajes Calificantes', vefOStats.qualCount + (vefOStats.qualCount<5?' (< 5 mínimos requeridos)':''))}
      ${kv('Ratio Medio V/S', vefOStats.meanRatio?.toFixed(5)||'—')}
      ${kv('Banda ±0.30%', vefOStats.lo?.toFixed(5)+' – '+vefOStats.hi?.toFixed(5))}
    </table>
    <h3>Historial de Viajes VEF Origen</h3>
    ${tbl(['#','Viaje','Producto','Puerto/Terminal','Fecha','TCV Nave','TCV Shore','Ratio','Rechaz.'],
      (origen.vefOrigen?.voyages||[]).map((v,i)=>{
        const r = vefOStats.rows[i];
        return `<tr${r.isRejected?' class="rejected"':r.qualifying?' class="qualifying"':''}>
          <td>${i+1}</td><td>${v.voyageNum}</td><td>${v.product}</td><td>${v.terminal}</td>
          <td>${fmtD(v.date)}</td><td>${fmtN(v.vesselTCV,0)}</td><td>${fmtN(v.shoreTCV,0)}</td>
          <td>${r.ratio?r.ratio.toFixed(5):'—'}</td>
          <td>${r.isRejected?'SÍ*':'No'}</td>
        </tr>`;
      }).join('')
    )}
    <p style="font-size:9px;color:#666">* Rechazado automáticamente (BUQUE_CON_VEF / Gross Error / Dique / Modif. Tabla)</p>` : ''}
    ${(ullO.tanks||[]).some(t=>t.measured) ? `<h3>Ullage de Origen — por Tanque</h3>
    ${tbl(['Tanque','Alt.Ref.(m)','Alt.Med.(m)','API @60°F','Temp(°C)','VCF','GSV(BBL)','TCV(BBL)'],
      ullO.tanks.filter(t=>t.measured).map(t=>`<tr>
        <td>${t.name}</td><td>${t.refHeight||'—'}</td><td>${t.measured}</td>
        <td>${t.api||'—'}</td><td>${t.temp||'—'}</td><td>${t.vcf||'—'}</td>
        <td>${fmtN(t.gsv)}</td><td>${fmtN(t.tcv)}</td>
      </tr>`).join('')
    )}
    <p class="note">${ullO.notes||''}</p>` : ''}
    ${origen.notes ? `<p class="note">${origen.notes}</p>` : ''}
  `);

  // ── KEY MEETING ─────────────────────────────────────────────────────────
  const km = mods['key-meeting'] || {};
  const kmAnswers = km.answers || {};
  const kmSec = sec('2. Key Meeting', `
    <table class="kv">
      ${kv('Fecha', fmtD(km.date))}
      ${kv('Hora', km.time||'—')}
      ${kv('Lugar', km.location||'—')}
      ${kv('Asistentes', (km.attendees||[]).join(' · ')||'—')}
    </table>
    ${Object.keys(kmAnswers).length ? `
    <h3>Cuestionario API MPMS 17.1 — Respuestas</h3>
    ${(typeof KM_BLOCKS !== 'undefined' ? KM_BLOCKS : []).map(block=>{
      const kmDis = km.kmDisabled || {};
      const activeQs = block.questions.filter(q => !kmDis[q.id]);
      if (!activeQs.length) return '';
      return `
      <h4>Bloque ${block.id}: ${block.title}</h4>
      <table>
        <thead><tr><th style="width:30px">#</th><th>Pregunta</th><th>Respuesta</th></tr></thead>
        <tbody>${activeQs.map(q=>`<tr>
          <td>${q.id.replace('q','')}</td>
          <td>${q.text}</td>
          <td>${kmAnswers[q.id]||'—'}</td>
        </tr>`).join('')}</tbody>
      </table>`;
    }).join('')}` : '<p class="note">Cuestionario no completado.</p>'}
    ${km.acta ? `<h3>Acta Formal — Consultor IA</h3><div class="ia-block">${km.acta.replace(/\n/g,'<br>')}</div>` : ''}
    ${km.notes ? `<p class="note">${km.notes}</p>` : ''}
  `);

  // ── ULLAGE ARRIBO ────────────────────────────────────────────────────────
  const arribo = mods['ullage-arribo'] || {};
  const tot = arribo.totals || {};
  const gsv_bl = parseFloat(bl.gsv)||0;
  const gsv_arr = parseFloat(tot.gsv)||0;
  const dGSV = gsv_bl && gsv_arr ? gsv_arr - gsv_bl : null;
  const pGSV = gsv_bl && dGSV !== null ? (dGSV/gsv_bl*100).toFixed(3) : null;

  const arriboSec = sec('3. Ullage al Arribo', `
    <table class="kv">
      ${kv('Fecha', fmtD(arribo.date))}
      ${kv('Hora', arribo.time||'—')}
      ${kv('Trim', arribo.trim ? arribo.trim+' m' : '—')}
      ${kv('Lista', arribo.list !== undefined ? arribo.list+'°' : '—')}
    </table>
    ${(arribo.tanks||[]).some(t=>t.measured) ? `
    <h3>Medición por Tanque</h3>
    ${tbl(['Tanque','Alt.Ref.(m)','Alt.Med.(m)','API @60°F','Temp(°C)','VCF'],
      (arribo.tanks||[]).filter(t=>t.measured).map(t=>`<tr>
        <td>${t.name}</td><td>${t.refHeight||'—'}</td><td>${t.measured}</td>
        <td>${t.api||'—'}</td><td>${t.temp||'—'}</td><td>${t.vcf||'—'}</td>
      </tr>`).join('')
    )}` : ''}
    <h3>Totales Calculados</h3>
    <table>
      <thead><tr><th>Parámetro</th><th>Origen (BL)</th><th>Arribo</th><th>Δ</th><th>%</th><th>Unidad</th></tr></thead>
      <tbody>
        ${[['GSV @60°F','gsv','BBL',3],['TCV','tcv','BBL',3],['Free Water','fw','BBL',3],
           ['API @60°F','api','°API',1],['BS&W','bsw','%',3],
           ['GSV m³ @15°C','m3At15','m³',3],['Ton. Métricas','metricTons','MT',3]
        ].map(([lbl,fld,unit,dec])=>{
          const bv=parseFloat(bl[fld])||null, av=parseFloat(tot[fld])||null;
          const dv=bv&&av?av-bv:null, pv=bv&&dv?(dv/bv*100).toFixed(3):null;
          return `<tr${dv&&Math.abs(dv/bv)>0.005?' class="warning"':''}>
            <td>${lbl}</td><td>${fmtN(bl[fld],dec)}</td><td>${fmtN(tot[fld],dec)}</td>
            <td>${dv!==null?(dv>0?'+':'')+fmtN(dv,dec):'—'}</td>
            <td>${pv!==null?(parseFloat(pv)>0?'+':'')+pv+'%':'—'}</td>
            <td>${unit}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    ${arribo.notes ? `<p class="note">${arribo.notes}</p>` : ''}
    ${arribo.iaAnalysis ? `<h3>Análisis Comparativo — Consultor IA</h3><div class="ia-block">${arribo.iaAnalysis.replace(/\n/g,'<br>')}</div>` : ''}
  `);

  // ── VEF AL ARRIBO ──────────────────────────────────────────────────────
  const vefComp = mods['vef-comparativo'] || {};
  const vefAStats = vefComp.voyages?.length ? computeVEFStats(vefComp.voyages) : null;
  const vefSec = vefAStats ? sec('4. VEF al Arribo', `
    <table class="kv">
      ${kv('VEF al Arribo', '<strong>'+vefAStats.vef.toFixed(4)+'</strong>')}
      ${kv('VEF de Origen', vefOStats ? vefOStats.vef.toFixed(4) : '—')}
      ${vefOStats && vefAStats ? kv('Δ VEF', (vefAStats.vef-vefOStats.vef>0?'+':'')+(vefAStats.vef-vefOStats.vef).toFixed(5)) : ''}
      ${kv('Viajes Calificantes', vefAStats.qualCount)}
      ${kv('Ratio Medio V/S', vefAStats.meanRatio?.toFixed(5)||'—')}
      ${kv('Banda ±0.30%', vefAStats.lo?.toFixed(5)+' – '+vefAStats.hi?.toFixed(5))}
    </table>
    <h3>Historial de Viajes VEF al Arribo</h3>
    ${tbl(['#','Viaje','Producto','Puerto/Terminal','Fecha','TCV Nave','TCV Shore','Ratio','Qual.','Rechaz.'],
      (vefComp.voyages||[]).map((v,i)=>{
        const r=vefAStats.rows[i];
        return `<tr${r.isRejected?' class="rejected"':r.qualifying?' class="qualifying"':''}>
          <td>${i+1}</td><td>${v.voyageNum}</td><td>${v.product}</td><td>${v.terminal}</td>
          <td>${fmtD(v.date)}</td><td>${fmtN(v.vesselTCV,0)}</td><td>${fmtN(v.shoreTCV,0)}</td>
          <td>${r.ratio?r.ratio.toFixed(5):'—'}</td>
          <td>${r.qualifying?'SÍ':'No'}</td><td>${r.isRejected?'SÍ*':'No'}</td>
        </tr>`;
      }).join('')
    )}
    ${vefComp.notes?`<p class="note">${vefComp.notes}</p>`:''}
  `) : '';

  // ── DISCHARGE RECORD ──────────────────────────────────────────────────
  const dr = mods['discharge-record'] || {};
  const drSec = has('discharge-record') && dr.enabled && (dr.records||[]).length ? sec('5. Discharge Record — Registro Horario', `
    <table class="kv">
      ${kv('Fecha de inicio', fmtD(dr.startDate))}
      ${kv('Hora de inicio', dr.startTime||'—')}
    </table>
    ${tbl(['Hora','Vol. Bombeado (BBL)','Presión (psi)','Observaciones'],
      dr.records.map(r=>`<tr>
        <td>${r.time}</td>
        <td>${r.volPumped?parseFloat(r.volPumped).toLocaleString('en-US'):'—'}</td>
        <td>${r.pressure||'—'}</td>
        <td>${r.observations||''}</td>
      </tr>`).join('')
    )}
    ${dr.notes?`<p class="note">${dr.notes}</p>`:''}
    ${iaBlock(dr.iaAnalysis)}
  `) : '';

  // ── TIME LOG / SOF ────────────────────────────────────────────────────
  const tl = mods['time-log'] || {};
  const tlEvents = (tl.events || []).filter(e => e.initial !== undefined ? (e.date||e.initial||e.event) : (e.datetime||e.desc));
  const tlSec = has('time-log') && tlEvents.length ? sec('6. Time Log / Statement of Facts', `
    ${tbl(['Fecha','Hora Ini','Hora Fin','Evento','Comentarios ACI Loss Control'],
      tlEvents.map(e => {
        if (e.initial !== undefined) {
          return `<tr>
            <td>${e.date ? new Date(e.date+'T12:00:00').toLocaleDateString('es-CL') : '—'}</td>
            <td style="font-family:monospace;text-align:center;font-weight:600">${e.initial||'—'}</td>
            <td style="font-family:monospace;text-align:center;font-weight:600">${e.final||'—'}</td>
            <td>${e.event||''}</td>
            <td style="color:#1a2f5a;font-style:italic">${e.comment||''}</td>
          </tr>`;
        } else {
          // legacy format
          const dt = e.datetime ? new Date(e.datetime) : null;
          return `<tr>
            <td>${dt ? dt.toLocaleDateString('es-CL') : '—'}</td>
            <td style="font-family:monospace;text-align:center;font-weight:600">${dt ? String(dt.getHours()).padStart(2,'0')+String(dt.getMinutes()).padStart(2,'0') : '—'}</td>
            <td style="font-family:monospace;text-align:center">—</td>
            <td>${e.desc||''}</td>
            <td style="color:#1a2f5a;font-style:italic">${e.rate ? 'Caudal: '+e.rate+' m³/h' : ''}</td>
          </tr>`;
        }
      }).join('')
    )}
    ${tl.notes ? `<p class="note">${tl.notes}</p>` : ''}
    ${iaBlock(tl.iaAnalysis)}
  `) : '';

  // ── TERMÓMETROS ────────────────────────────────────────────────────────
  const term = mods['termometros'] || {};
  const tV=parseFloat(term.vessel?.tempF)||null, tS=parseFloat(term.surveyor?.tempF)||null, tA=parseFloat(term.aci?.tempF)||null;
  const termSec = term.enabled !== false ? sec('6. Verificación de Termómetros — API MPMS 7.1 §8.2.1', `
    <table>
      <thead><tr><th>Termómetro</th><th>ID / Serie</th><th>Fecha Calibración</th><th>Lectura (°F)</th><th>Lectura (°C)</th></tr></thead>
      <tbody>
        <tr><td>Buque</td><td>${term.vessel?.id||'—'}</td><td>${fmtD(term.vessel?.calibDate)}</td>
          <td>${tV?.toFixed(1)||'—'}</td><td>${tV?((tV-32)*5/9).toFixed(1):'—'}</td></tr>
        <tr><td>Surveyor</td><td>${term.surveyor?.id||'—'}</td><td>${fmtD(term.surveyor?.calibDate)}</td>
          <td>${tS?.toFixed(1)||'—'}</td><td>${tS?((tS-32)*5/9).toFixed(1):'—'}</td></tr>
        <tr><td>ACI Loss Control</td><td>${term.aci?.id||'—'}</td><td>${fmtD(term.aci?.calibDate)}</td>
          <td>${tA?.toFixed(1)||'—'}</td><td>${tA?((tA-32)*5/9).toFixed(1):'—'}</td></tr>
      </tbody>
    </table>
    ${tV&&tS?`<table class="kv">
      ${kv('Diferencia Buque vs Surveyor', Math.abs(tV-tS).toFixed(2)+'°F / '+((Math.abs(tV-tS))*5/9).toFixed(2)+'°C')}
      ${kv('Tolerancia API MPMS 7.1', '±0.5°F / ±0.25°C')}
      ${kv('Resultado', Math.abs(tV-tS)<=0.5?'✓ DENTRO DE TOLERANCIA':'✗ FUERA DE TOLERANCIA')}
    </table>`:''}
    ${term.generalRemarks?`<p class="note">${term.generalRemarks}</p>`:''}
  `) : '';

  // ── CHECKLIST ─────────────────────────────────────────────────────────
  const chkKey = (op.moduleOrder||[]).find(k=>k.startsWith('checklist'));
  const chk = chkKey ? (mods[chkKey]||{}) : {};
  const chkTemplate = CHECKLIST_VESSEL;
  const chkSections = (chk.items && chk.items.length) ? chk.items : makeChecklistData(chkTemplate);
  let totPts=0,totMax=0,cCt=0,pCt=0,nCt=0,naCt=0;
  chkSections.forEach(s=>s.items.forEach(it=>{
    if(it.val==='c'){totPts+=2;totMax+=2;cCt++;}
    else if(it.val==='p'){totPts+=1;totMax+=2;pCt++;}
    else if(it.val==='n'){totMax+=2;nCt++;}
    else if(it.val==='na'){naCt++;}
  }));
  const pct=totMax>0?Math.round(totPts/totMax*100):null;
  const verdict=pct===null?'Sin Evaluar':pct>=80?'SATISFACTORIO':pct>=60?'REGULAR':'DEFICIENTE';
  const chkSec = has('checklist-inspeccion') || has(chkKey) ? sec('7. Checklist de Inspección', `
    <table class="kv">
      ${kv('Inspector Auditado', chk.inspector||'—')}
      ${kv('Auditor Loss Control', chk.auditor||'—')}
      ${kv('Fecha', fmtD(chk.date))}
      ${kv('Resultado Global', (pct!==null?pct+'% — ':'')+'<strong>'+verdict+'</strong>')}
      ${kv('Puntuación', totPts+'/'+totMax+' pts  (C='+cCt+'  P='+pCt+'  N='+nCt+'  NA='+naCt+')')}
    </table>
    ${chkSections.map(sec2=>`
      <h4>${sec2.title||sec2.name}</h4>
      ${sec2.intro?`<p class="note">${sec2.intro}</p>`:''}
      <table>
        <thead><tr><th style="width:60%">Item</th><th>Ref.</th><th>Estado</th><th>Observación</th></tr></thead>
        <tbody>${sec2.items.map(it=>`<tr${it.val==='n'?' class="warning"':it.val==='c'?' class="ok"':''}>
          <td>${it.text}</td><td style="font-size:9px">${it.norm||''}</td>
          <td style="text-align:center;font-weight:700">${it.val==='c'?'C':it.val==='p'?'P':it.val==='n'?'N':it.val==='na'?'NA':'—'}</td>
          <td style="font-size:10px">${it.comment||''}</td>
        </tr>`).join('')}</tbody>
      </table>`).join('')}
    ${iaBlock(chk.iaAnalysis)}
  `) : '';

  // ── REPORTE EVOLUTIVO / CONCLUSIÓN ─────────────────────────────────────
  const re = mods['reporte-evolutivo'] || {};
  const allAnalyses = (op.moduleOrder||[]).map(k=>{
    const m=mods[k]; if(!m) return null;
    const modMeta = MODULE_META[k] || {};
    if(k==='key-meeting'&&m.acta) return {label:'Key Meeting — Acta Formal',content:m.acta,date:m.date};
    // Only include module IA analyses flagged for the report (default true if not set)
    if(m.iaAnalysis && m.iaIncludeInReport !== false)
      return {label:(modMeta.icon||'')+(modMeta.label||k)+' — Análisis IA',content:m.iaAnalysis,date:m.iaDate};
    return null;
  }).filter(Boolean);

  const reSec = sec('8. Reporte Evolutivo — Balance y Conclusión', `
    <h3>Balance de Cantidades — Origen vs Arribo</h3>
    <table>
      <thead><tr><th>Parámetro</th><th>Origen (BL)</th><th>Arribo</th><th>Δ</th><th>%</th><th>Unidad</th></tr></thead>
      <tbody>
        ${[['GSV @60°F','gsv','BBL',3],['TCV','tcv','BBL',3],['Free Water','fw','BBL',3],
           ['API @60°F','api','°API',1],['BS&W','bsw','%',3],
           ['GSV m³ @15°C','m3At15','m³',3],['Ton. Métricas','metricTons','MT',3]
        ].map(([lbl,fld,unit,dec])=>{
          const bv=parseFloat(bl[fld])||null,av=parseFloat(tot[fld])||null;
          const dv=bv&&av?av-bv:null,pv=bv&&dv?(dv/bv*100).toFixed(3):null;
          return `<tr${dv&&Math.abs(dv/bv)>0.005?' class="warning"':''}>
            <td>${lbl}</td><td>${fmtN(bl[fld],dec)}</td><td>${fmtN(tot[fld],dec)}</td>
            <td>${dv!==null?(dv>0?'+':'')+fmtN(dv,dec):'—'}</td>
            <td>${pv!==null?(parseFloat(pv)>0?'+':'')+pv+'%':'—'}</td>
            <td>${unit}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    ${vefOStats||vefAStats?`<table class="kv">
      ${kv('VEF Origen', vefOStats?vefOStats.vef.toFixed(4):'—')}
      ${kv('VEF Arribo', vefAStats?vefAStats.vef.toFixed(4):'—')}
      ${vefOStats&&vefAStats?kv('Δ VEF',(vefAStats.vef-vefOStats.vef>0?'+':'')+(vefAStats.vef-vefOStats.vef).toFixed(5)):''}
    </table>`:''}
    ${allAnalyses.length?`<div class="page-break"></div><h3>Análisis del Consultor IA</h3>${allAnalyses.map(a=>`
      <h4>${a.label}${a.date?' — '+fmtD(a.date):''}</h4>
      <div class="ia-block">${a.content.replace(/\n/g,'<br>')}</div>`).join('')}`:''}
    ${re.notes?`<div class="page-break"></div><h3>Conclusión Final del Inspector</h3><div class="conclusion">${re.notes.replace(/\n/g,'<br>')}</div>`:''}
    <div class="signatures">
      <div class="sig-box"><div class="sig-line"></div><div>Inspector ACI Loss Control</div></div>
      <div class="sig-box"><div class="sig-line"></div><div>Representante del Buque</div></div>
      <div class="sig-box"><div class="sig-line"></div><div>Representante del Cliente</div></div>
    </div>
  `);

  // ── CSS + ASSEMBLE ──────────────────────────────────────────────────────
  const css = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:11px;color:#111;background:#fff;line-height:1.4}
    .cover{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;border:3px solid #1a2f5a;margin:20px}
    .cover-logo{font-size:36px;font-weight:900;color:#1a2f5a;letter-spacing:2px;margin-bottom:8px}
    .cover-logo span{color:#c8a415}
    .cover-title{font-size:18px;font-weight:700;color:#444;margin:20px 0 4px;text-transform:uppercase;letter-spacing:3px}
    .cover-code{font-size:32px;font-weight:900;color:#1a2f5a;margin:8px 0 32px}
    .cover-tbl{margin:0 auto;border-collapse:collapse;min-width:400px}
    .cover-tbl td{padding:6px 16px;border-bottom:1px solid #ddd;text-align:left}
    .cover-tbl td:first-child{font-weight:700;color:#555;width:160px}
    .cover-footer{margin-top:40px;font-size:9px;color:#888;border-top:1px solid #ddd;padding-top:12px}
    .page-break{page-break-after:always;height:0}
    .section{padding:16px 24px;border-bottom:2px solid #e8e8e8;margin-bottom:8px}
    h2{font-size:14px;font-weight:700;color:#1a2f5a;border-bottom:2px solid #1a2f5a;padding-bottom:4px;margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px}
    h3{font-size:12px;font-weight:700;color:#333;margin:14px 0 6px;border-left:3px solid #c8a415;padding-left:8px}
    h4{font-size:11px;font-weight:700;color:#555;margin:10px 0 4px}
    table{width:100%;border-collapse:collapse;margin-bottom:10px;font-size:10px}
    th{background:#1a2f5a;color:#fff;padding:5px 8px;text-align:left;font-weight:600;font-size:9px}
    td{padding:4px 8px;border-bottom:1px solid #eee;vertical-align:top}
    tr:nth-child(even) td{background:#f9f9f9}
    tr.rejected td{color:#999;text-decoration:line-through}
    tr.qualifying td{background:#f0fff0}
    tr.warning td{background:#fff8e8}
    tr.ok td{background:#f0fff0}
    table.kv td{border:none;padding:3px 8px}
    table.kv td.label{font-weight:700;color:#555;width:200px}
    .ia-block{background:#f8f9ff;border-left:3px solid #1a2f5a;padding:10px 14px;font-size:10px;line-height:1.6;white-space:pre-wrap;margin-bottom:10px}
    .conclusion{background:#fffbf0;border:1px solid #c8a415;padding:12px 16px;font-size:11px;line-height:1.7;border-radius:4px}
    .note{font-size:9px;color:#666;font-style:italic;margin:4px 0 8px;padding:4px 8px;background:#f5f5f5;border-radius:2px}
    .signatures{display:flex;gap:40px;margin-top:40px;padding-top:20px;border-top:1px solid #ddd}
    .sig-box{flex:1;text-align:center;font-size:10px;color:#555}
    .sig-line{border-top:1px solid #333;margin:0 20px 6px}
    @media print{
      body{font-size:10px}
      .page-break{page-break-after:always}
      .section{page-break-inside:avoid}
      table{page-break-inside:auto}
      tr{page-break-inside:avoid}
    }
  `;

  const html = `<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8">
    <title>${op.code} — Reporte Operacional — ACI Loss Control</title>
    <style>${css}</style>
  </head><body>
    ${cover}
    ${has('datos-origen') ? origenSec+'<div class="page-break"></div>' : ''}
    ${has('key-meeting') ? kmSec+'<div class="page-break"></div>' : ''}
    ${has('ullage-arribo') ? arriboSec : ''}
    ${has('vef-comparativo') ? vefSec+'<div class="page-break"></div>' : ''}
    ${drSec}
    ${tlSec}
    ${has('termometros') ? termSec+'<div class="page-break"></div>' : ''}
    ${chkSec}
    ${has('reporte-evolutivo') ? '<div class="page-break"></div>'+reSec : ''}
  </body></html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Permite ventanas emergentes para este sitio para generar el PDF.'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 800);
}

// ===== KEY MEETING QUESTION BLOCKS (API MPMS 17.1 / 17.11) =====
const KM_BLOCKS = [
  { id:'A', title:'Identificación del Buque', questions:[
    { id:'q1',  text:'Nombre del buque, bandera, número IMO y año de construcción', type:'text' },
    { id:'q2',  text:'DWT, LOA y calado máximo', type:'text' },
    { id:'q3',  text:'Master (Capitán) y Chief Officer responsable del cargo', type:'text' },
    { id:'q4',  text:'Certificados vigentes (IOPP, Class, P&I) y fechas de vencimiento', type:'textarea' },
    { id:'q5',  text:'Nombre del armador (Shipowner) y operador comercial (Charterer)', type:'text' },
    { id:'q6',  text:'Número de tanques de cargo y capacidad total (m³ / BBL)', type:'text' },
    { id:'q7',  text:'¿El buque opera con sistema de gas inerte (IGS)? ¿Está operativo?', type:'text' },
    { id:'q8',  text:'¿El buque tiene sistema de Crude Oil Washing (COW)? ¿Se va a usar?', type:'text' },
  ]},
  { id:'B', title:'Identificación de la Operación y el Cargo', questions:[
    { id:'q9',  text:'Tipo de operación', type:'check', options:['Carga','Descarga','STS'] },
    { id:'q10', text:'Nombre y grado del cargo (ej. Vasconia Blend, Brent, Fuel Oil 380)', type:'text' },
    { id:'q11', text:'Densidad / API gravity esperada del cargo', type:'text' },
    { id:'q12', text:'Cantidad nominada a transferir (BBL / MT / m³)', type:'text' },
    { id:'q13', text:'Tolerancia contractual (option) en % si aplica', type:'text' },
    { id:'q14', text:'Temperatura esperada o target del cargo durante la transferencia', type:'text' },
    { id:'q15', text:'¿El cargo tiene presión de vapor elevada (RVP > 0.18 kg/cm²)? Si SÍ — ¿Se usarán exclusivamente equipos cerrados (Cap. 17.11)?', type:'textarea' },
    { id:'q16', text:'Contenido previsto de S&W y si se realizará BSW antes del B/L', type:'text' },
    { id:'q17', text:'¿El cargo fue calentado (heated)? ¿A qué temperatura llegó al puerto?', type:'text' },
    { id:'q18', text:'¿Hay carga en tránsito (transit cargo) que NO forma parte de esta operación?', type:'text' },
  ]},
  { id:'C', title:'Método de Medición Acordado', questions:[
    { id:'q19', text:'Método de medición primario para el buque', type:'check', options:['Ullage manual','ATG','Draft Survey','Metering'] },
    { id:'q20', text:'¿Quién realiza la medición primaria del buque?', type:'check', options:['Inspector independiente','Jefe de Cargo','Conjunta'] },
    { id:'q21', text:'¿Se tomará medición de shore tanks? ¿Cuántos tanques y cuáles destinos/origen?', type:'textarea' },
    { id:'q22', text:'¿Hay medidor de flujo (flow meter/LACT) en la terminal? Fecha del último meter proving y meter factor vigente', type:'textarea' },
    { id:'q23', text:'¿Se aplicará Vessel Experience Factor (VEF)? Número de viajes del VEF y fecha de última actualización', type:'textarea' },
    { id:'q24', text:'¿Las tablas de aforo (capacity tables) del buque están certificadas y disponibles? Fecha y entidad que las elaboró', type:'textarea' },
    { id:'q25', text:'¿Se verificarán las alturas de referencia (reference gauge heights) antes de comenzar las mediciones?', type:'yesno' },
    { id:'q26', text:'Método de medición de agua libre (Free Water)', type:'text' },
  ]},
  { id:'D', title:'Condición del Buque (Trim, Lista, Rolling)', questions:[
    { id:'q27', text:'Calado a proa (forward draft) actual en metros', type:'number' },
    { id:'q28', text:'Calado a popa (aft draft) actual en metros', type:'number' },
    { id:'q29', text:'Trim actual (diferencia F/A en metros) y si está dentro del rango de las tablas de corrección del buque', type:'text' },
    { id:'q30', text:'¿Hay escora (list) actualmente? Grados y dirección (port / starboard)', type:'text' },
    { id:'q31', text:'¿Hay rolling activo? ¿Es estable para tomar lecturas? Si rolling > 2° — procedimiento acordado', type:'check', options:['Esperar','Promediar lecturas','ATG con damping'] },
    { id:'q32', text:'¿Se aplicarán correcciones de trim y list por tanque individualmente?', type:'yesno' },
  ]},
  { id:'E', title:'OBQ / ROB', questions:[
    { id:'q33', text:'¿Hay material a bordo antes de comenzar (OBQ / ROB)?', type:'yesno' },
    { id:'q34', text:'Tanques con OBQ/ROB, tipo de material en cada uno', type:'check', options:['Agua libre','Oil residue','Slops','Emulsión','Sólido'] },
    { id:'q35', text:'¿Se aplicará fórmula de cuña (wedge formula) para OBQ en tanques parcialmente llenos? (Cap. 17.4)', type:'yesno' },
    { id:'q36', text:'¿Se tomará muestra del OBQ/ROB? ¿Se analizará en laboratorio?', type:'textarea' },
    { id:'q37', text:'¿Cómo se contabilizará el OBQ en el cálculo final de TCV?', type:'textarea' },
    { id:'q38', text:'¿Hay material en líneas del buque (vessel lines)? ¿Cómo se manejará?', type:'textarea' },
  ]},
  { id:'F', title:'Muestreo', questions:[
    { id:'q39', text:'Método de muestreo acordado para el buque', type:'check', options:['Manual (thief/beaker)','Continuous (running)','Automático (in-line sampler)','UTI integrado'] },
    { id:'q40', text:'Punto de muestreo acordado', type:'check', options:['Manifold del buque','Línea de shore','Tanque individual'] },
    { id:'q41', text:'Custodio de muestras primarias y de arbitraje (referee)', type:'text' },
    { id:'q42', text:'Número de sets de muestras a tomar (ej. primary + ship retain + shore retain + arbitraje)', type:'text' },
    { id:'q43', text:'Procedimiento de etiquetado, sellado y almacenamiento de muestras', type:'textarea' },
    { id:'q44', text:'Período de retención de muestras acordado', type:'text' },
    { id:'q45', text:'¿Se tomará muestra de "first foot" al inicio de la carga?', type:'yesno' },
    { id:'q46', text:'¿Se tomará muestra de línea (line sample) al inicio de la descarga?', type:'yesno' },
    { id:'q47', text:'[STS / Cap. 17.11] ¿Todos los equipos de muestreo son cerrados/restringidos? ¿Están calibrados y con certificado vigente?', type:'textarea' },
  ]},
  { id:'G', title:'Temperatura', questions:[
    { id:'q48', text:'Equipo con que se medirá la temperatura en tanques del buque', type:'check', options:['Termómetro portátil','UTI con termómetro','ATG con sensor'] },
    { id:'q49', text:'¿Se medirá temperatura en cada tanque individualmente? (Obligatorio per §17.1.9.11 — no se acepta temperatura promedio global)', type:'yesno' },
    { id:'q50', text:'Niveles de toma de temperatura por tanque', type:'check', options:['Upper/Middle/Lower','Perfil completo'] },
    { id:'q51', text:'Temperatura del agua de mar (sea water temperature) en °C', type:'number' },
    { id:'q52', text:'Temperatura ambiente (air temperature) en °C', type:'number' },
    { id:'q53', text:'¿El cargo tiene heating coils activos? ¿A qué temperatura se mantiene?', type:'text' },
    { id:'q54', text:'¿Se registrará temperatura al inicio Y al final de la operación?', type:'yesno' },
  ]},
  { id:'H', title:'Líneas y Válvulas', questions:[
    { id:'q55', text:'Diámetro y longitud estimada de la línea entre buque y terminal', type:'text' },
    { id:'q56', text:'¿Las líneas están llenas (line full) o vacías antes de comenzar? Método de verificación (Cap. 17.6)', type:'textarea' },
    { id:'q57', text:'Número de manifolds a usar y ubicación (Puerto / Estribor)', type:'text' },
    { id:'q58', text:'¿Las válvulas de mar (sea valves) y overboard están cerradas y precintadas? Responsable de verificación y firma del precinto', type:'textarea' },
    { id:'q59', text:'¿Las válvulas de lastre están cerradas y segregadas del cargo?', type:'yesno' },
    { id:'q60', text:'¿Se verificarán los strainers (filtros) de la línea antes de la operación?', type:'yesno' },
    { id:'q61', text:'[Si metering] ¿El prover está disponible y en condiciones? ¿El meter factor fue verificado dentro del período válido?', type:'textarea' },
  ]},
  { id:'I', title:'Lastre, Slops y Bunkers', questions:[
    { id:'q62', text:'¿Hay agua de lastre en tanques? ¿En cuáles? Cantidad aproximada', type:'textarea' },
    { id:'q63', text:'¿Hay slops a bordo? ¿En cuáles tanques? Tipo y cantidad', type:'textarea' },
    { id:'q64', text:'Bunkers a bordo (HFO / MDO / MGO) en cantidad por tanque — deben medirse y registrarse para excluirlos del cargo (§17.1.9.10)', type:'textarea' },
    { id:'q65', text:'¿Hay void spaces o cofferdams con líquido? Detalle', type:'textarea' },
  ]},
  { id:'J', title:'Comunicaciones y Coordinación Operativa', questions:[
    { id:'q66', text:'Canal VHF principal buque-terminal y canal de respaldo', type:'text' },
    { id:'q67', text:'Señal acordada para START / STOP / EMERGENCIA', type:'text' },
    { id:'q68', text:'Tasa de transferencia inicial (initial transfer rate) y cuándo se autoriza tasa máxima (full rate)', type:'textarea' },
    { id:'q69', text:'Presión máxima permitida en la línea (bar / psi / kg/cm²)', type:'text' },
    { id:'q70', text:'Stop gauge acordado (nivel de tanque para inicio de reducción / parada)', type:'text' },
    { id:'q71', text:'Responsable de dar la orden de parada final', type:'text' },
    { id:'q72', text:'Procedimiento en caso de derrame (spill response)', type:'textarea' },
    { id:'q73', text:'¿Se ha completado el Ship-Shore Safety Checklist (ISGOTT)?', type:'yesno' },
  ]},
  { id:'K', title:'Documentación y Distribución', questions:[
    { id:'q74', text:'Partes que firman el informe del inspector independiente', type:'text' },
    { id:'q75', text:'Número de copias del reporte y lista de destinatarios', type:'textarea' },
    { id:'q76', text:'¿Quién emite el Bill of Lading (B/L) y en base a qué figuras?', type:'check', options:['Shore figures','Vessel figures','NOR figures'] },
    { id:'q77', text:'Formato de Time Log acordado y responsable de llevarlo', type:'text' },
    { id:'q78', text:'¿Existe Letter of Protest (LOP) por alguna condición preexistente? Motivo y emisor', type:'textarea' },
    { id:'q79', text:'Plazo máximo para emisión y distribución del informe final', type:'text' },
    { id:'q80', text:'¿Se requiere Voyage Analysis Report (Cap. 17.5)?', type:'yesno' },
  ]},
  { id:'L', title:'Adicionales STS (Cap. 17.11 / EI HM 52)', stsOnly: true, questions:[
    { id:'q81', text:'Nombre y rol del buque contraparte (Mother / Daughter vessel)', type:'text' },
    { id:'q82', text:'¿Ambos buques tienen equipos de medición cerrados/restringidos disponibles? Certificados de calibración vigentes de UTI / ATG', type:'textarea' },
    { id:'q83', text:'Estado del IGS en ambos buques y procedimiento coordinado de apertura de ports bajo presión de gas inerte', type:'textarea' },
    { id:'q84', text:'Tipo, número y estado de los fenders instalados', type:'textarea' },
    { id:'q85', text:'¿El STS Plan ha sido elaborado y firmado por ambos Masters?', type:'yesno' },
    { id:'q86', text:'Diferencia de calado entre ambos buques (trim compatibility)', type:'text' },
    { id:'q87', text:'¿Hay in-transit difference a registrar antes de la transferencia?', type:'text' },
    { id:'q88', text:'Protocolo acordado ante cargo no homogéneo donde la muestra representativa no es garantizable (§17.11)', type:'textarea' },
    { id:'q89', text:'Estado de manifolds y hoses de interconexión — certificación para la presión de operación', type:'textarea' },
    { id:'q90', text:'¿Cuál buque es el "control vessel" para la tasa de transferencia?', type:'text' },
  ]},
];

// ===== MODULE: KEY MEETING =====
function buildKeyMeeting(d, ctx) {
  const att = d.attendees || [];
  const topics = d.topics || [];
  return `
    <div class="module-title">🤝 Key Meeting / Pre-Transfer Conference</div>
    <div class="module-subtitle">API MPMS Cap. 17.1 (7ª Ed. 2022) · Cap. 17.11 / EI HM 52 · ${d.date||''} ${d.time||''}</div>

    <div class="card">
      <div class="card-title">Datos de la Reunión</div>
      <div class="form-row form-row-3" style="margin-bottom:12px">
        <div class="field"><label class="field-label">Fecha</label>
          <input class="field-input" type="date" value="${d.date||''}" data-action="save-field" data-ctx="${ctx}" data-field="date"></div>
        <div class="field"><label class="field-label">Hora</label>
          <input class="field-input" type="time" value="${d.time||''}" data-action="save-field" data-ctx="${ctx}" data-field="time"></div>
        <div class="field"><label class="field-label">Lugar</label>
          <input class="field-input" value="${d.location||''}" placeholder="Ej: Chart Room" data-action="save-field" data-ctx="${ctx}" data-field="location"></div>
      </div>
      <div class="card-title" style="margin-top:8px">Asistentes</div>
      <div id="km-att-list" style="margin-bottom:10px">
        ${att.map((a,i) => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line2);font-size:13px">
            <span><strong>${a.name}</strong>${a.company?' — '+a.company:''} ${a.role?'<span style="color:var(--muted)">('+a.role+')</span>':''}</span>
            <button class="btn btn-ghost btn-sm" data-action="km-rm-att" data-ctx="${ctx}" data-idx="${i}">✕</button>
          </div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;align-items:end">
        <div class="field"><label class="field-label">Nombre</label><input class="field-input" id="km-att-name" placeholder="Nombre completo"></div>
        <div class="field"><label class="field-label">Empresa</label><input class="field-input" id="km-att-company" placeholder="Empresa"></div>
        <div class="field"><label class="field-label">Cargo / Rol</label><input class="field-input" id="km-att-role" placeholder="Cargo"></div>
        <button class="btn btn-secondary" data-action="km-add-att" data-ctx="${ctx}" style="margin-bottom:0">＋</button>
      </div>
    </div>

    ${KM_BLOCKS.map(block => {
      const ans = d.answers || {};
      const dis = d.kmDisabled || {};
      const questions = block.questions.map(q => {
        const val = ans[q.id] || '';
        const isNA = !!dis[q.id];
        let input = '';
        if (q.type === 'text' || q.type === 'number') {
          input = `<input class="field-input" type="${q.type==='number'?'number':'text'}" step="any" value="${val}"
            data-action="save-km-answer" data-ctx="${ctx}" data-qid="${q.id}" placeholder="—" style="margin:0"
            ${isNA?'disabled':''}">`;
        } else if (q.type === 'textarea') {
          input = `<textarea class="field-input" rows="2" style="resize:vertical"
            data-action="save-km-answer" data-ctx="${ctx}" data-qid="${q.id}" placeholder="—"
            ${isNA?'disabled':''}>${val}</textarea>`;
        } else if (q.type === 'yesno') {
          input = `<div style="display:flex;gap:8px">
            ${['Sí','No','N/A'].map(opt => `
              <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;${isNA?'opacity:.4;pointer-events:none':''}">
                <input type="radio" name="km-${q.id}-${ctx}" value="${opt}" ${val===opt?'checked':''}
                  data-action="save-km-answer" data-ctx="${ctx}" data-qid="${q.id}" ${isNA?'disabled':''}> ${opt}
              </label>`).join('')}
          </div>`;
        } else if (q.type === 'check') {
          const selected = val ? val.split('||') : [];
          input = `<div style="display:flex;flex-wrap:wrap;gap:8px">
            ${(q.options||[]).map(opt => `
              <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;${isNA?'opacity:.4;pointer-events:none':''}">
                <input type="checkbox" value="${opt}" ${selected.includes(opt)?'checked':''}
                  data-action="save-km-check" data-ctx="${ctx}" data-qid="${q.id}" ${isNA?'disabled':''}> ${opt}
              </label>`).join('')}
          </div>`;
        }
        return `
          <div style="padding:10px 0;border-bottom:1px solid var(--line2);${isNA?'opacity:.45;background:var(--line2);margin:0 -16px;padding:10px 16px;':''}">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px">
              <div style="font-size:12px;font-weight:600;color:${isNA?'var(--muted)':'var(--ink)'};flex:1">
                <span style="color:${isNA?'var(--muted)':'var(--accent)'};margin-right:6px">${q.id.replace('q','')}</span>
                ${isNA?`<s>${q.text}</s>`:q.text}
              </div>
              <button class="btn-na-toggle ${isNA?'active':''}"
                data-action="km-toggle-na" data-ctx="${ctx}" data-qid="${q.id}"
                title="${isNA?'Habilitar pregunta':'Marcar como No Aplica'}"
                style="flex-shrink:0;font-size:10px;padding:2px 8px;border-radius:10px;border:1px solid ${isNA?'#c0392b':'var(--line)'};background:${isNA?'#fdecea':'var(--white)'};color:${isNA?'#c0392b':'var(--muted)'};cursor:pointer;white-space:nowrap">
                ${isNA?'✕ No Aplica':'N/A'}
              </button>
            </div>
            ${isNA ? '<div style="font-size:11px;color:var(--muted);font-style:italic">Pregunta deshabilitada — no se considerará en la reunión ni en el reporte</div>' : input}
          </div>`;
      }).join('');
      const naCount = block.questions.filter(q => dis[q.id]).length;
      return `
        <div class="card">
          <div class="card-title" style="display:flex;align-items:center;gap:8px">
            <span style="background:var(--accent);color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px">Bloque ${block.id}</span>
            ${block.title}
            ${block.stsOnly ? '<span style="font-size:10px;color:var(--muted);font-style:italic">(solo STS)</span>' : ''}
            ${naCount ? `<span style="margin-left:auto;font-size:10px;color:var(--muted)">${naCount} no aplica${naCount>1?'n':''}</span>` : ''}
          </div>
          ${questions}
        </div>`;
    }).join('')}

    <div class="card" style="background:linear-gradient(135deg,var(--paper),var(--line2))">
      <div class="card-title">🤖 Generar Acta Formal</div>
      <div class="info-box" style="margin-bottom:12px">El Consultor IA analizará todas las respuestas, redactará el acta formal, identificará incumplimientos normativos y señalará si se requiere Letter of Protest (LOP).</div>
      ${d.acta ? `
        <div style="background:var(--white);border:1px solid var(--line);border-radius:8px;padding:16px;font-size:13px;white-space:pre-wrap;line-height:1.7;margin-bottom:12px;max-height:500px;overflow-y:auto">${d.acta}</div>
        <button class="btn btn-secondary" data-action="km-gen-acta" data-ctx="${ctx}" style="width:100%">🔄 Regenerar Acta</button>
      ` : `
        <button class="btn btn-primary" data-action="km-gen-acta" data-ctx="${ctx}" style="width:100%">✍️ Generar Acta con Consultor IA</button>
      `}
    </div>

    <div class="card">
      <label class="field-label">Notas adicionales</label>
      <textarea class="field-input" style="height:70px" placeholder="Observaciones…"
        data-action="save-field" data-ctx="${ctx}" data-field="notes">${d.notes||''}</textarea>
    </div>`;
}

// ===== MODULE: ULLAGE =====
function buildUllage(d, mod, ctx) {
  const tanks = d.tanks || TANK_NAMES.map(n => ({ name: n }));
  const isIni = mod.includes('inicial');
  const isFin = mod.includes('final');
  const roleIcon = isFin ? '📏' : '📐';
  const defaultTitle = isIni ? 'Ullage Inicial (Before)' : isFin ? 'Ullage Final (After)' : `Ullage ${parseInt(mod.split('-').pop()||'0',10)+1}`;
  const title = d._label || defaultTitle;
  const vcfTabla  = d.vcfTabla  || '6A';
  const tempUnit  = d.tempUnit  || 'F';   // 'C' = Celsius input, 'F' = Fahrenheit input
  const toF = tObs => tempUnit === 'C' ? tObs * 1.8 + 32 : tObs;
  const totalTOV = ullageTotal(tanks, 'tov');
  const totalGOV = ullageTotal(tanks, 'gov');
  const totalGSV = ullageTotal(tanks, 'gsv');
  const totalFW  = ullageTotal(tanks, 'fw');

  // Weighted averages for summary calculations (temps converted to °F internally)
  const govTanks = tanks.filter(t => parseFloat(t.gov) > 0);
  const wAvgTemp = govTanks.length
    ? govTanks.reduce((s,t) => s + toF(parseFloat(t.temp)||0)*(parseFloat(t.gov)||0), 0) / totalGOV
    : 0;
  const wAvgApi = govTanks.length
    ? govTanks.reduce((s,t) => s + (parseFloat(t.api)||0)*(parseFloat(t.gov)||0), 0) / totalGOV
    : 0;
  const wAvgBsw = govTanks.length
    ? govTanks.reduce((s,t) => s + (parseFloat(t.bsw)||0)*(parseFloat(t.gov)||0), 0) / totalGOV
    : 0;

  // Override with manual inputs if provided (avgTemp stored in selected unit → convert to °F)
  const avgTempF = d.avgTemp !== '' && d.avgTemp != null ? toF(parseFloat(d.avgTemp)) : wAvgTemp;
  const avgApi  = parseFloat(d.avgApi)  || wAvgApi;
  const avgBsw  = parseFloat(d.avgBsw)  !== undefined && d.avgBsw !== '' ? parseFloat(d.avgBsw) : wAvgBsw;

  const q = calcAllQuantities(totalGOV, avgTempF, avgApi, avgBsw, vcfTabla);

  const vesselNameField = d._vesselName !== undefined ? `
    <div class="card" style="padding:10px 14px;display:flex;align-items:center;gap:10px">
      <span style="font-size:12px;font-weight:600;color:var(--muted);white-space:nowrap">🚢 Buque</span>
      <input class="field-input" style="flex:1;margin:0" value="${d._vesselName||''}" placeholder="Nombre del buque…"
        data-action="save-field" data-ctx="${ctx}" data-field="_vesselName">
    </div>` : '';

  return `
    <div class="module-title">${roleIcon} ${title}</div>
    <div class="module-subtitle">Medición de tanques — API MPMS 12.1.1 &nbsp;|&nbsp; 14 tanques</div>
    ${vesselNameField}

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

    <div class="card" style="padding:10px 14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Tabla VCF MPMS 11.1</span>
      ${['6A','6B','6C','6D'].map(t => {
        const labels = {'6A':'6A — Crudos','6B':'6B — Refinados','6C':'6C — MTBE','6D':'6D — Lubricantes'};
        const active = vcfTabla === t;
        return `<button class="btn${active?' btn-primary':''}" style="font-size:12px;padding:4px 12px;${active?'':'background:var(--paper);color:var(--text);border:1px solid var(--line)'}"
          data-action="set-vcf-tabla" data-ctx="${ctx}" data-tabla="${t}">${labels[t]}</button>`;
      }).join('')}
      <span style="width:1px;height:20px;background:var(--line);margin:0 4px"></span>
      <span style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Temp.</span>
      ${['C','F'].map(u => {
        const active = tempUnit === u;
        return `<button class="btn${active?' btn-primary':''}" style="font-size:12px;padding:4px 12px;${active?'':'background:var(--paper);color:var(--text);border:1px solid var(--line)'}"
          data-action="set-temp-unit" data-ctx="${ctx}" data-unit="${u}">°${u}</button>`;
      }).join('')}
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:44px;font-size:11px">Tq.</th>
              <th style="font-size:11px">Ullage<br><span style="font-weight:400;color:var(--muted)">(m)</span></th>
              <th style="font-size:11px">TOV<br><span style="font-weight:400;color:var(--muted)">(m³)</span></th>
              <th style="font-size:11px">FW<br><span style="font-weight:400;color:var(--muted)">(m)</span></th>
              <th style="font-size:11px">FW<br><span style="font-weight:400;color:var(--muted)">(m³)</span></th>
              <th style="font-size:11px;background:#e8f4f8">GOV<br><span style="font-weight:400;color:var(--muted)">(m³)</span></th>
              <th style="font-size:11px;background:#d4ecf7">GOV<br><span style="font-weight:400;color:var(--muted)">(BBL)</span></th>
              <th style="font-size:11px">Temp<br><span style="font-weight:400;color:var(--muted)">(°${tempUnit})</span></th>
              <th style="font-size:11px">API<br><span style="font-weight:400;color:var(--muted)">@60°F</span></th>
              <th style="font-size:11px">BS&W<br><span style="font-weight:400;color:var(--muted)">(%)</span></th>
              <th style="font-size:11px;background:#e8f4ea">VCF<br><span style="font-weight:400;color:var(--muted)">Tabla ${vcfTabla}</span></th>
              <th style="font-size:11px;background:#e8f4ea">GSV<br><span style="font-weight:400;color:var(--muted)">(m³)</span></th>
              <th style="font-size:11px;background:#d4edd4">GSV<br><span style="font-weight:400;color:var(--muted)">(BBL)</span></th>
            </tr>
          </thead>
          <tbody>
            ${tanks.map((t, i) => {
              const tov = parseFloat(t.tov) || 0;
              const fw  = parseFloat(t.fw)  || 0;
              const gov = tov > 0 ? Math.max(0, tov - fw) : 0;
              const govBbl = gov * 6.289812;
              const tempRaw = parseFloat(t.temp);
              const tempF = isNaN(tempRaw) ? NaN : toF(tempRaw);
              const vcf = (t.api && !isNaN(tempF)) ? vcfCalc(parseFloat(t.api), tempF, vcfTabla) : null;
              const gsv = vcf && gov > 0 ? gov * vcf : 0;
              const gsvBbl = gsv * 6.289812;
              const fmtC = (v, d=3) => v > 0 ? v.toFixed(d) : (v===0&&tov>0?'0.000':'—');
              return `
              <tr>
                <td style="font-weight:700;font-size:12px">${t.name || TANK_NAMES[i]}</td>
                <td><input class="tbl-input" type="number" step="0.001" value="${t.ullage||''}" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="ullage"></td>
                <td><input class="tbl-input" type="number" step="0.001" value="${t.tov||''}" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="tov"></td>
                <td><input class="tbl-input" type="number" step="0.001" value="${t.fwM||''}" placeholder="0.000" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="fwM"></td>
                <td><input class="tbl-input" type="number" step="0.001" value="${t.fw||''}" placeholder="0.000" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="fw"></td>
                <td style="background:#e8f4f8"><span id="gov-${i}" class="calc-cell" style="display:block;min-width:72px;text-align:right;padding:3px 6px;font-size:12px;font-family:monospace">${gov>0?gov.toFixed(3):'—'}</span></td>
                <td style="background:#d4ecf7"><span id="govbbl-${i}" class="calc-cell" style="display:block;min-width:80px;text-align:right;padding:3px 6px;font-size:12px;font-family:monospace;font-weight:700;color:var(--sea)">${gov>0?govBbl.toFixed(2):'—'}</span></td>
                <td><input class="tbl-input" type="number" step="0.1" value="${t.temp||''}" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="temp"></td>
                <td><input class="tbl-input" type="number" step="0.1" value="${t.api||''}" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="api"></td>
                <td><input class="tbl-input" type="number" step="0.01" value="${t.bsw||''}" placeholder="0.00" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="bsw"></td>
                <td style="background:#e8f4ea"><span id="vcf-${i}" class="calc-cell" style="display:block;min-width:78px;text-align:right;padding:3px 6px;font-size:11px;font-family:monospace;color:var(--green)">${vcf?vcf.toFixed(6):'—'}</span></td>
                <td style="background:#e8f4ea"><span id="gsv-${i}" class="calc-cell" style="display:block;min-width:72px;text-align:right;padding:3px 6px;font-size:12px;font-family:monospace">${gsv>0?gsv.toFixed(3):'—'}</span></td>
                <td style="background:#d4edd4"><span id="gsvbbl-${i}" class="calc-cell" style="display:block;min-width:80px;text-align:right;padding:3px 6px;font-size:12px;font-family:monospace;font-weight:700;color:var(--green)">${gsv>0?gsvBbl.toFixed(2):'—'}</span></td>
              </tr>`;}).join('')}
            <tr class="total-row">
              <td>TOTAL</td>
              <td></td><td></td>
              <td><span id="total-tov">${fmt(totalTOV)}</span></td>
              <td></td>
              <td><span id="total-fw">${fmt(totalFW)}</span></td>
              <td style="background:#e8f4f8"><span id="total-gov">${fmt(totalGOV)}</span></td>
              <td style="background:#d4ecf7;font-weight:700;color:var(--sea)"><span id="total-govbbl">${totalGOV>0?fmt(totalGOV*6.289812):''}</span></td>
              <td></td><td></td><td></td>
              <td style="background:#e8f4ea"></td>
              <td style="background:#e8f4ea"><span id="total-gsv">${fmt(totalGSV)}</span></td>
              <td style="background:#d4edd4;font-weight:700;color:var(--green)"><span id="total-gsvbbl">${totalGSV>0?fmt(totalGSV*6.289812):''}</span></td>
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
          <label class="field-label">Temp. promedio observada (°${tempUnit})</label>
          <input class="field-input" type="number" step="0.01"
            value="${d.avgTemp !== undefined && d.avgTemp !== '' ? d.avgTemp : (tempUnit==='C'?(wAvgTemp-32)/1.8:wAvgTemp).toFixed(2)}"
            placeholder="${(tempUnit==='C'?(wAvgTemp-32)/1.8:wAvgTemp).toFixed(2)}"
            data-action="save-field" data-ctx="${ctx}" data-field="avgTemp">
          <span class="field-hint">Prom. ponderado: ${(tempUnit==='C'?(wAvgTemp-32)/1.8:wAvgTemp).toFixed(3)} °${tempUnit} → ${wAvgTemp.toFixed(2)} °F</span>
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
      ${!q ? `<div class="warn-box" style="margin:12px 16px">Ingrese API, temperatura y BS&W (en los tanques o en "Propiedades para Conversión") para calcular todas las cantidades.</div>` : ''}
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th style="text-align:left;min-width:260px">Cantidad</th>
              <th style="min-width:110px">Valor</th>
              <th style="min-width:70px">Unidad</th>
              <th style="text-align:left;font-size:10px;color:var(--muted)">Norma / Fórmula</th>
            </tr>
          </thead>
          <tbody>
            <!-- Bloque GOV -->
            <tr style="background:#f0f2f4">
              <td colspan="4" style="font-size:10px;font-weight:700;color:var(--muted);padding:5px 10px;text-transform:uppercase;letter-spacing:.06em">Volumen Observado — API MPMS 12.1</td>
            </tr>
            <tr>
              <td style="font-weight:700;color:var(--ink)">TOV — Total Observed Volume</td>
              <td class="calc-cell">${fmt(totalTOV)}</td>
              <td style="color:var(--muted);font-size:11px">m³</td>
              <td style="color:var(--muted);font-size:11px">Suma directa de tanques</td>
            </tr>
            <tr>
              <td style="font-weight:700;color:var(--ink)">Free Water (FW)</td>
              <td class="calc-cell">${fmt(totalFW)}</td>
              <td style="color:var(--muted);font-size:11px">m³</td>
              <td style="color:var(--muted);font-size:11px">Agua libre total en fondos</td>
            </tr>
            <tr>
              <td style="font-weight:700;color:var(--ink)">GOV — Gross Observed Volume</td>
              <td class="calc-cell">${fmt(totalGOV)}</td>
              <td style="color:var(--muted);font-size:11px">m³</td>
              <td style="color:var(--muted);font-size:11px">TOV − FW</td>
            </tr>

            <!-- Factores de conversión -->
            <tr style="background:#f0f2f4">
              <td colspan="4" style="font-size:10px;font-weight:700;color:var(--muted);padding:5px 10px;text-transform:uppercase;letter-spacing:.06em">Factores de Corrección — API MPMS 11.1 (Tabla 6A Crudo)</td>
            </tr>
            <tr style="background:#eaf4f8">
              <td style="font-weight:700;color:var(--sea)">Densidad @15°C (ρ₁₅)</td>
              <td class="calc-cell" style="color:var(--sea)">${q ? fmt(q.rho15, 4) : '—'}</td>
              <td style="color:var(--muted);font-size:11px">kg/m³</td>
              <td style="color:var(--muted);font-size:11px">141.5 / (API + 131.5) × 999.016</td>
            </tr>
            <tr style="background:#eaf4f8">
              <td style="font-weight:700;color:var(--sea)">CTL Tabla 11 / VCF @60°F (15.556°C)</td>
              <td class="calc-cell" style="color:var(--sea);font-family:monospace">${q ? q.vcf60F.toFixed(7) : '—'}</td>
              <td style="color:var(--muted);font-size:11px">—</td>
              <td style="color:var(--muted);font-size:11px">API MPMS 11.1 Tabla 6A — ref. 60°F</td>
            </tr>
            <tr style="background:#eaf4f8">
              <td style="font-weight:700;color:var(--sea)">CTL Tabla 13 / VCF @15°C</td>
              <td class="calc-cell" style="color:var(--sea);font-family:monospace">${q ? q.vcf15C.toFixed(7) : '—'}</td>
              <td style="color:var(--muted);font-size:11px">—</td>
              <td style="color:var(--muted);font-size:11px">API MPMS 11.1 Tabla 6A — ref. 15°C</td>
            </tr>
            <tr style="background:#eaf4f8">
              <td style="font-weight:700;color:var(--sea)">VCF @20°C</td>
              <td class="calc-cell" style="color:var(--sea);font-family:monospace">${q ? q.vcf20C.toFixed(7) : '—'}</td>
              <td style="color:var(--muted);font-size:11px">—</td>
              <td style="color:var(--muted);font-size:11px">API MPMS 11.1 Tabla 6A — ref. 20°C</td>
            </tr>

            <!-- GSV -->
            <tr style="background:#f0f2f4">
              <td colspan="4" style="font-size:10px;font-weight:700;color:var(--muted);padding:5px 10px;text-transform:uppercase;letter-spacing:.06em">Volumen Estándar (GSV / NSV)</td>
            </tr>
            <tr>
              <td style="font-weight:700;color:var(--sea)">GSV @60°F — Gross Standard Volume</td>
              <td class="calc-cell" style="color:var(--sea)">${q ? fmt(q.gsv60F) : '—'}</td>
              <td style="color:var(--muted);font-size:11px">m³</td>
              <td style="color:var(--muted);font-size:11px">GOV × CTL(T11)</td>
            </tr>
            <tr>
              <td style="font-weight:700;color:var(--sea)">GSV @60°F en Barriles</td>
              <td class="calc-cell" style="color:var(--sea)">${q ? fmt(q.bbl60F) : '—'}</td>
              <td style="color:var(--muted);font-size:11px">BBL</td>
              <td style="color:var(--muted);font-size:11px">GSV(m³) × 6.289811</td>
            </tr>
            <tr>
              <td style="font-weight:700;color:var(--sea)">m³ @15°C — GSV Tabla 13</td>
              <td class="calc-cell" style="color:var(--sea)">${q ? fmt(q.gsv15C) : '—'}</td>
              <td style="color:var(--muted);font-size:11px">m³</td>
              <td style="color:var(--muted);font-size:11px">GOV × CTL(T13)</td>
            </tr>
            <tr>
              <td style="font-weight:700;color:var(--sea)">m³ @20°C</td>
              <td class="calc-cell" style="color:var(--sea)">${q ? fmt(q.gsv20C) : '—'}</td>
              <td style="color:var(--muted);font-size:11px">m³</td>
              <td style="color:var(--muted);font-size:11px">GOV × VCF(20°C)</td>
            </tr>
            <tr>
              <td style="font-weight:600;color:var(--ink)">NSV @60°F — Net Standard Volume</td>
              <td class="calc-cell">${q ? fmt(q.nsv60F) : '—'}</td>
              <td style="color:var(--muted);font-size:11px">m³</td>
              <td style="color:var(--muted);font-size:11px">GSV@60°F × (1 − BS&W%)</td>
            </tr>
            <tr>
              <td style="font-weight:600;color:var(--ink)">NSV @15°C</td>
              <td class="calc-cell">${q ? fmt(q.nsv15C) : '—'}</td>
              <td style="color:var(--muted);font-size:11px">m³</td>
              <td style="color:var(--muted);font-size:11px">GSV@15°C × (1 − BS&W%)</td>
            </tr>

            <!-- Masa -->
            <tr style="background:#f0f2f4">
              <td colspan="4" style="font-size:10px;font-weight:700;color:var(--muted);padding:5px 10px;text-transform:uppercase;letter-spacing:.06em">Masa — API MPMS 11.1 / ASTM D1250</td>
            </tr>
            <tr style="background:var(--panel)">
              <td style="color:var(--amber);font-weight:700">TM Vacío — Metric Tons (vacuum)</td>
              <td class="calc-cell" style="color:var(--amber)">${q ? fmt(q.tmVac) : '—'}</td>
              <td style="color:var(--muted);font-size:11px">MT</td>
              <td style="color:var(--muted);font-size:11px">NSV@15°C × ρ₁₅ / 1000</td>
            </tr>
            <tr style="background:var(--panel)">
              <td style="color:var(--amber);font-weight:700">TM Aire — Metric Tons (air)</td>
              <td class="calc-cell" style="color:var(--amber)">${q ? fmt(q.tmAir) : '—'}</td>
              <td style="color:var(--muted);font-size:11px">MT</td>
              <td style="color:var(--muted);font-size:11px">TM Vac − 0.0011 × NSV@15°C</td>
            </tr>
            <tr style="background:var(--panel)">
              <td style="color:#a0b4c0;font-weight:700">Long Tons</td>
              <td class="calc-cell" style="color:#a0b4c0">${q ? fmt(q.longTons) : '—'}</td>
              <td style="color:var(--muted);font-size:11px">LT</td>
              <td style="color:var(--muted);font-size:11px">TM Aire ÷ 1.016047</td>
            </tr>
            <tr style="background:var(--panel)">
              <td style="color:#a0b4c0;font-weight:700">Short Tons</td>
              <td class="calc-cell" style="color:#a0b4c0">${q ? fmt(q.shortTons) : '—'}</td>
              <td style="color:var(--muted);font-size:11px">ST</td>
              <td style="color:var(--muted);font-size:11px">TM Aire ÷ 0.90718474</td>
            </tr>
            <tr style="background:var(--panel)">
              <td style="color:#a0b4c0;font-weight:700">US Gallons @60°F</td>
              <td class="calc-cell" style="color:#a0b4c0">${q ? fmt(q.gallons, 0) : '—'}</td>
              <td style="color:var(--muted);font-size:11px">US gal</td>
              <td style="color:var(--muted);font-size:11px">BBL × 42</td>
            </tr>
            <tr style="background:var(--panel)">
              <td style="color:#a0b4c0;font-weight:700">Factor BBL / TM Aire</td>
              <td class="calc-cell" style="color:#a0b4c0;font-family:monospace">${q && q.tmAir ? fmt(q.bbl60F / q.tmAir, 6) : '—'}</td>
              <td style="color:var(--muted);font-size:11px">BBL/MT</td>
              <td style="color:var(--muted);font-size:11px">Factor de conversión operacional</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Notas</div>
      <textarea class="field-textarea" style="width:100%;min-height:80px" placeholder="Observaciones de medición..." data-action="save-field" data-ctx="${ctx}" data-field="notes">${d.notes||''}</textarea>
    </div>
    ${isFin ? buildUllageDelta(d, mod, ctx, tanks, vcfTabla) : ''}`;
}

function buildUllageDelta(d, mod, ctx, finTanks, vcfTabla) {
  const ctxObj = JSON.parse(decodeURIComponent(ctx));
  const op = getOp(ctxObj.opId);
  if (!op) return '';
  const order = resolveModuleOrder(op);
  const inicialKeys = order.filter(k => k === 'ullage-inicial' || moduleType(k) === 'ullage-inicial');
  if (!inicialKeys.length) return `
    <div class="card" style="background:rgba(255,193,7,.07);border:1px dashed rgba(255,193,7,.3);padding:14px 18px;color:var(--muted);font-size:13px">
      ℹ️ Agrega un módulo <strong>Ullage Inicial</strong> a esta operación para calcular el Δ transferido.
    </div>`;

  const pairedKey = d.pairedWith || '';
  const mods = op.modules || {};
  const iniD = pairedKey
    ? (mods[pairedKey] || (op.type ? (initModuleData(op.type)[pairedKey] || null) : null))
    : null;

  // Helper: compute totals from a set of tanks + module data
  function ullageQuantities(tankList, modData) {
    const tanks = tankList || [];
    const totalTOV = ullageTotal(tanks, 'tov');
    const totalFW  = ullageTotal(tanks, 'fw');
    const totalGOV = Math.max(0, totalTOV - totalFW);
    const govTanks = tanks.filter(t => parseFloat(t.gov || (parseFloat(t.tov||0) - parseFloat(t.fw||0))) > 0 || parseFloat(t.tov||0) > 0);
    const govForAvg = govTanks.reduce((s,t) => s + Math.max(0, (parseFloat(t.tov)||0)-(parseFloat(t.fw)||0)), 0) || 1;
    const tUnit = modData?.tempUnit || 'F';
    const toFu = v => tUnit === 'C' ? v * 1.8 + 32 : v;
    const wAvgTemp = govTanks.reduce((s,t) => s + toFu(parseFloat(t.temp)||0)*Math.max(0,(parseFloat(t.tov)||0)-(parseFloat(t.fw)||0)), 0) / govForAvg;
    const wAvgApi  = govTanks.reduce((s,t) => s + (parseFloat(t.api)||0)*Math.max(0,(parseFloat(t.tov)||0)-(parseFloat(t.fw)||0)), 0) / govForAvg;
    const wAvgBsw  = govTanks.reduce((s,t) => s + (parseFloat(t.bsw)||0)*Math.max(0,(parseFloat(t.tov)||0)-(parseFloat(t.fw)||0)), 0) / govForAvg;
    const avgTempF = modData?.avgTemp != null && modData?.avgTemp !== '' ? toFu(parseFloat(modData.avgTemp)) : wAvgTemp;
    const avgApi   = parseFloat(modData?.avgApi)  || wAvgApi;
    const avgBsw   = (modData?.avgBsw !== '' && modData?.avgBsw != null) ? parseFloat(modData.avgBsw) : wAvgBsw;
    const tabla    = modData?.vcfTabla || vcfTabla || '6A';
    const q = calcAllQuantities(totalGOV, avgTempF, avgApi, avgBsw, tabla);
    return { totalTOV, totalFW, totalGOV, avgApi, avgTempF, avgBsw, q };
  }

  const ini = iniD ? ullageQuantities(iniD.tanks, iniD) : null;
  const fin = ullageQuantities(finTanks, d);

  const sel = `
    <div class="card" style="padding:12px 16px">
      <div class="card-title" style="margin-bottom:10px">🔗 Comparar con Ullage Inicial</div>
      <select data-action="save-field" data-ctx="${ctx}" data-field="pairedWith"
        style="width:300px;padding:7px 10px;border:1px solid var(--line);border-radius:var(--r);background:var(--bg);color:var(--fg);font-size:13px">
        <option value="">— Seleccionar ullage inicial —</option>
        ${inicialKeys.map(k => {
          const lbl = MODULE_META[k]?.label || moduleLabel(op, k);
          return `<option value="${k}" ${pairedKey===k?'selected':''}>${lbl}</option>`;
        }).join('')}
      </select>
    </div>`;

  if (!pairedKey || !iniD) return sel;

  // Direction: delivery = buque madre entrega (Ini − Fin), reception = receptor recibe (Fin − Ini)
  const isReception = d._direction === 'reception';
  const sign = isReception ? -1 : 1;
  const dGOV   = sign * (ini.totalGOV - fin.totalGOV);
  const dGSV60 = ini.q && fin.q ? sign * (ini.q.gsv60F - fin.q.gsv60F) : null;
  const dBBL   = ini.q && fin.q ? sign * (ini.q.bbl60F - fin.q.bbl60F) : null;
  const dNSV   = ini.q && fin.q ? sign * (ini.q.nsv60F - fin.q.nsv60F) : null;
  const dTM    = ini.q && fin.q ? sign * (ini.q.tmAir  - fin.q.tmAir)  : null;

  const fv = (v, dec=3) => v != null ? (v >= 0 ? v.toFixed(dec) : `(${Math.abs(v).toFixed(dec)})`) : '—';
  const fc = (v, dec=3) => v != null && v > 0 ? `<strong style="color:var(--green)">${v.toFixed(dec)}</strong>` : fv(v, dec);
  const hdr = (txt, sub='') => `<th style="font-size:11px;text-align:right;padding:8px 12px">${txt}${sub?`<br><span style="font-weight:400;color:var(--muted);font-size:10px">${sub}</span>`:''}`;
  const row = (label, ini_v, fin_v, delta, dec=3, highlight=false) => `
    <tr${highlight?' style="background:rgba(76,175,61,.07)"':''}>
      <td style="font-weight:600;color:var(--ink);font-size:12px;padding:6px 12px">${label}</td>
      <td style="text-align:right;font-family:monospace;font-size:12px;padding:6px 12px">${fv(ini_v,dec)}</td>
      <td style="text-align:right;font-family:monospace;font-size:12px;padding:6px 12px">${fv(fin_v,dec)}</td>
      <td style="text-align:right;font-family:monospace;font-size:12px;padding:6px 12px;${highlight?'font-weight:700;font-size:13px':''}">${fc(delta,dec)}</td>
    </tr>`;

  const iniLbl = MODULE_META[pairedKey]?.label || moduleLabel(op, pairedKey);
  const deltaIcon  = isReception ? '⇧' : '⇩';
  const deltaTitle = isReception ? 'Recibido por buque receptor' : 'Entregado por buque madre';
  const deltaFormula = isReception ? 'Fin − Ini' : 'Ini − Fin';

  return sel + `
    <div class="card" style="padding:0;overflow:hidden">
      <div style="background:${isReception?'#0d1e2e':'#0d2e1a'};color:${isReception?'#4c9faf':'#4caf7d'};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.08)">
        ${deltaIcon} Δ ${deltaTitle} — ${iniLbl} → ${d._label || 'Ullage Final'}
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:var(--panel)">
            <th style="text-align:left;font-size:11px;padding:8px 12px;min-width:220px">Cantidad</th>
            ${hdr(iniLbl,'Antes')}</th>
            ${hdr('Ullage Final','Después')}</th>
            ${hdr('Δ ' + (isReception ? 'Recibido' : 'Entregado'), deltaFormula)}</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background:#f5f5f5"><td colspan="4" style="font-size:10px;font-weight:700;color:var(--muted);padding:4px 12px;text-transform:uppercase;letter-spacing:.06em">Volumen Observado</td></tr>
          ${row('GOV (m³ observado)', ini.totalGOV||0, fin.totalGOV||0, dGOV)}
          <tr style="background:#f5f5f5"><td colspan="4" style="font-size:10px;font-weight:700;color:var(--muted);padding:4px 12px;text-transform:uppercase;letter-spacing:.06em">Volumen Estándar — GSV</td></tr>
          ${row('GSV @60°F (m³)', ini.q?.gsv60F, fin.q?.gsv60F, dGSV60, 3, true)}
          ${row('GSV @60°F (BBL)', ini.q?.bbl60F, fin.q?.bbl60F, dBBL, 2, true)}
          <tr style="background:#f5f5f5"><td colspan="4" style="font-size:10px;font-weight:700;color:var(--muted);padding:4px 12px;text-transform:uppercase;letter-spacing:.06em">Net Standard Volume — NSV @60°F</td></tr>
          ${row('NSV @60°F (m³) — neto BS&W', ini.q?.nsv60F, fin.q?.nsv60F, dNSV, 3, true)}
          <tr style="background:#f5f5f5"><td colspan="4" style="font-size:10px;font-weight:700;color:var(--muted);padding:4px 12px;text-transform:uppercase;letter-spacing:.06em">Masa</td></tr>
          ${row('TM Aire (MT)', ini.q?.tmAir, fin.q?.tmAir, dTM, 3)}
        </tbody>
      </table>
      ${(!ini.q || !fin.q) ? `<div class="warn-box" style="margin:10px 14px">Ingrese API y temperatura en ambos ullages para calcular GSV.</div>` : ''}
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
function emptyTLEvent() {
  return { date:'', initial:'', final:'', event:'', comment:'' };
}

function buildTimeLog(d, ctx) {
  // Migrate legacy events (datetime/type/desc/rate) to new format on first render
  const rawEvents = d.events || [];
  const events = rawEvents.map(e => {
    if (e.initial !== undefined) return e; // already new format
    // legacy: {datetime, type, desc, rate}
    const dt = e.datetime ? new Date(e.datetime) : null;
    const dateStr = dt ? dt.toISOString().slice(0,10) : '';
    const hhmm = dt ? String(dt.getHours()).padStart(2,'0') + String(dt.getMinutes()).padStart(2,'0') : '';
    const typeMap = { start:'Inicio Bombeo', stop:'Parada de bombeo', resume:'Reanuda bombeo', complete:'Completado', note:'Nota' };
    return { date: dateStr, initial: hhmm, final: '', event: typeMap[e.type] || e.desc || '', comment: e.rate ? `Caudal: ${e.rate} m³/h` : '' };
  });

  const rowHTML = events.map((e, i) => `
    <tr>
      <td style="width:110px">
        <input class="tl-cell" type="date" value="${e.date||''}"
          data-action="tl-save-row" data-ctx="${ctx}" data-idx="${i}" data-field="date">
      </td>
      <td style="width:80px">
        <input class="tl-cell tl-time" type="text" maxlength="4" value="${e.initial||''}" placeholder="HHMM"
          data-action="tl-save-row" data-ctx="${ctx}" data-idx="${i}" data-field="initial">
      </td>
      <td style="width:80px">
        <input class="tl-cell tl-time" type="text" maxlength="4" value="${e.final||''}" placeholder="HHMM"
          data-action="tl-save-row" data-ctx="${ctx}" data-idx="${i}" data-field="final">
      </td>
      <td>
        <input class="tl-cell" type="text" value="${(e.event||'').replace(/"/g,'&quot;')}" placeholder="Descripción del evento..."
          data-action="tl-save-row" data-ctx="${ctx}" data-idx="${i}" data-field="event">
      </td>
      <td style="background:rgba(46,90,130,0.08)">
        <input class="tl-cell tl-comment" type="text" value="${(e.comment||'').replace(/"/g,'&quot;')}" placeholder="Comentario Loss Control..."
          data-action="tl-save-row" data-ctx="${ctx}" data-idx="${i}" data-field="comment">
      </td>
      <td style="width:32px;text-align:center">
        <button class="btn-icon-sm" data-action="tl-del-row" data-ctx="${ctx}" data-idx="${i}" title="Eliminar fila">✕</button>
      </td>
    </tr>`).join('');

  return `
    <div class="module-title">⏱️ Time Log / Statement of Facts</div>
    <div class="module-subtitle">Cronograma de eventos — SOF con comentarios ACI Loss Control</div>
    <div class="card" style="padding:0;overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px">
        <div class="card-title" style="margin:0">Registro de Eventos</div>
        <button class="btn btn-primary btn-sm" data-action="tl-add-row" data-ctx="${ctx}">＋ Agregar Fila</button>
      </div>
      <div style="overflow-x:auto">
        <table class="tl-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora Ini</th>
              <th>Hora Fin</th>
              <th>Evento</th>
              <th style="background:rgba(46,90,130,0.15)">Comentarios ACI Loss Control</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="tl-body-${ctx}">
            ${rowHTML || `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px;font-size:13px">
              Sin eventos. Haga clic en "＋ Agregar Fila" para comenzar.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="card-title">Observaciones Generales</div>
      <textarea class="field-textarea" style="width:100%;min-height:80px" placeholder="Notas adicionales del inspector ACI Loss Control..."
        data-action="save-field" data-ctx="${ctx}" data-field="notes">${d.notes||''}</textarea>
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
  // Migrate old format (plain text items, 5 sections) to new rich format (13 sections with pq)
  const isOldFormat = d.items && d.items.length && (!d.items[0].norm && !d.items[0].intro);
  const sections = (d.items && d.items.length && !isOldFormat) ? d.items : makeChecklistData(template);

  // Scoring: C=2, P=1, N=0, na=excluded
  let totPts = 0, totMax = 0, cCount = 0, pCount = 0, nCount = 0, naCount = 0;
  sections.forEach(sec => sec.items.forEach(item => {
    if (item.val === 'c')  { totPts += 2; totMax += 2; cCount++; }
    else if (item.val === 'p') { totPts += 1; totMax += 2; pCount++; }
    else if (item.val === 'n') { totMax += 2; nCount++; }
    else if (item.val === 'na') { naCount++; }
  }));
  const pct = totMax > 0 ? Math.round(totPts / totMax * 100) : null;
  const verdict = pct === null ? 'Sin evaluar' : pct >= 80 ? 'SATISFACTORIO' : pct >= 60 ? 'REGULAR' : 'DEFICIENTE';
  const verdictColor = pct === null ? 'var(--muted)' : pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red)';
  const luzR = pct !== null && pct < 60  ? '#ef4444' : '#333';
  const luzA = pct !== null && pct >= 60 && pct < 80 ? '#fbbf24' : '#333';
  const luzV = pct !== null && pct >= 80 ? '#4ade80' : '#333';

  return `
    <div class="module-title">✅ ${MODULE_META[mod]?.label || 'Checklist'} — Auditoría Inspector</div>

    <!-- CABECERA CON SEMÁFORO -->
    <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:24px;padding:16px 20px">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;flex:1">
        <div class="field">
          <label class="field-label">Inspector auditado</label>
          <input class="field-input" value="${d.inspector||''}" placeholder="Nombre del inspector" data-action="save-field" data-ctx="${ctx}" data-field="inspector">
        </div>
        <div class="field">
          <label class="field-label">Auditor Loss Control</label>
          <input class="field-input" value="${d.auditor||''}" placeholder="Nombre del auditor" data-action="save-field" data-ctx="${ctx}" data-field="auditor">
        </div>
        <div class="field">
          <label class="field-label">Fecha de auditoría</label>
          <input class="field-input" type="date" value="${d.date||''}" data-action="save-field" data-ctx="${ctx}" data-field="date">
        </div>
        <div class="field">
          <label class="field-label">Producto</label>
          <input class="field-input" value="${d.producto||''}" placeholder="Crudo / producto refinado" data-action="save-field" data-ctx="${ctx}" data-field="producto">
        </div>
      </div>
      <!-- Semáforo de calificación -->
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;min-width:110px">
        <div style="display:flex;gap:8px;margin-bottom:4px">
          <div style="width:18px;height:18px;border-radius:50%;background:${luzR};box-shadow:${luzR!=='#333'?'0 0 8px '+luzR:'none'}"></div>
          <div style="width:18px;height:18px;border-radius:50%;background:${luzA};box-shadow:${luzA!=='#333'?'0 0 8px '+luzA:'none'}"></div>
          <div style="width:18px;height:18px;border-radius:50%;background:${luzV};box-shadow:${luzV!=='#333'?'0 0 8px '+luzV:'none'}"></div>
        </div>
        <div style="font-size:26px;font-weight:700;color:${verdictColor};font-family:monospace">${pct !== null ? pct+'%' : '—'}</div>
        <div style="font-size:11px;font-weight:700;color:${verdictColor};letter-spacing:.05em">${verdict}</div>
        <div style="font-size:10px;color:var(--muted)">${totPts}/${totMax} pts</div>
      </div>
    </div>

    <!-- LEYENDA -->
    <div style="display:flex;gap:16px;align-items:center;padding:8px 4px;margin-bottom:8px;font-size:12px;flex-wrap:wrap">
      <span style="display:flex;align-items:center;gap:6px"><span style="width:22px;height:22px;border-radius:50%;background:var(--green);display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:10px">C</span> <b>Cumple</b> (2 pts)</span>
      <span style="display:flex;align-items:center;gap:6px"><span style="width:22px;height:22px;border-radius:50%;background:var(--amber);display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:10px">P</span> <b>Parcial</b> (1 pt)</span>
      <span style="display:flex;align-items:center;gap:6px"><span style="width:22px;height:22px;border-radius:50%;background:var(--red);display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:10px">N</span> <b>No cumple</b> (0 pts)</span>
      <span style="display:flex;align-items:center;gap:6px"><span style="width:22px;height:22px;border-radius:50%;background:#ccc;border:2px solid #aaa;display:inline-flex;align-items:center;justify-content:center;color:#666;font-weight:700;font-size:9px">N/A</span> No aplica</span>
      <span style="color:var(--muted);font-size:11px">| ${cCount} C · ${pCount} P · ${nCount} N · ${naCount} N/A | ▶ Clic en la pregunta para ver explicación</span>
    </div>

    <!-- SECCIONES -->
    ${sections.map((sec, si) => {
      let sPts = 0, sMax = 0;
      sec.items.forEach(it => {
        if (it.val === 'c')  { sPts += 2; sMax += 2; }
        else if (it.val === 'p') { sPts += 1; sMax += 2; }
        else if (it.val === 'n') { sMax += 2; }
      });
      const sPct = sMax > 0 ? Math.round(sPts / sMax * 100) : null;
      const sBg = sPct === null ? 'var(--steel)' : sPct >= 80 ? 'var(--green)' : sPct >= 60 ? 'var(--amber)' : 'var(--red)';
      return `
      <div class="card" style="padding:0;overflow:hidden;margin-bottom:16px">
        <div style="background:var(--panel2);padding:12px 16px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
          <div>
            <div style="font-size:13px;font-weight:700;color:var(--white);margin-bottom:4px">${sec.section}</div>
            ${sec.intro ? `<div style="font-size:11px;color:rgba(255,255,255,.55);line-height:1.5;max-width:700px">${sec.intro}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0">
            <span style="background:${sBg};color:#fff;font-size:10px;font-weight:700;padding:2px 10px;border-radius:20px;white-space:nowrap">${sec.norm || ''}</span>
            ${sPct !== null ? `<span style="color:rgba(255,255,255,.6);font-size:10px">${sPts}/${sMax} pts (${sPct}%)</span>` : ''}
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#f0f2f4">
            <th style="width:32px;text-align:center;padding:7px 8px;color:var(--muted);font-size:10px">#</th>
            <th style="text-align:left;padding:7px 8px;color:var(--muted);font-size:10px">Pregunta de Auditoría — clic para ver explicación ▼</th>
            <th style="width:40px;text-align:center;padding:7px 4px;color:var(--green);font-size:10px">C</th>
            <th style="width:40px;text-align:center;padding:7px 4px;color:var(--amber);font-size:10px">P</th>
            <th style="width:40px;text-align:center;padding:7px 4px;color:var(--red);font-size:10px">N</th>
            <th style="width:40px;text-align:center;padding:7px 4px;color:var(--muted);font-size:10px">—</th>
            <th style="text-align:left;padding:7px 8px;color:var(--muted);font-size:10px;min-width:160px">Hallazgo / evidencia</th>
          </tr></thead>
          <tbody>
            ${sec.items.map((item, ii) => {
              const rowBg = item.val === 'c' ? '#f0faf1' : item.val === 'n' ? '#fdf2f2' : item.val === 'p' ? '#fffcf0' : '';
              const circleBtn = (val, color, label) => {
                const sel = item.val === val;
                return `<td style="text-align:center;padding:8px 4px;background:${rowBg}">
                  <button style="width:28px;height:28px;border-radius:50%;border:2px solid ${sel?color:'#ddd'};background:${sel?color:'transparent'};color:${sel?'#fff':color};font-weight:700;font-size:10px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:all .13s"
                    data-action="chk-set" data-ctx="${ctx}" data-si="${si}" data-ii="${ii}" data-val="${val}">${label}</button>
                </td>`;
              };
              return `<tr style="border-bottom:1px solid var(--line2)">
                <td style="text-align:center;color:var(--muted);font-size:11px;padding:10px 8px;background:${rowBg};vertical-align:top">${ii+1}</td>
                <td style="padding:10px 8px;background:${rowBg};vertical-align:top">
                  <div style="color:var(--ink);cursor:pointer;line-height:1.5" data-action="chk-toggle-pq" data-si="${si}" data-ii="${ii}">»&nbsp;${item.text}</div>
                  ${item.pq ? `<div id="pq-${si}-${ii}" style="display:none;margin-top:8px;padding:10px 12px;background:#fff9ee;border-left:3px solid var(--amber);border-radius:0 var(--r) var(--r) 0;font-size:11px;color:var(--ink);line-height:1.65">${item.pq}</div>` : ''}
                </td>
                ${circleBtn('c', 'var(--green)', 'C')}
                ${circleBtn('p', 'var(--amber)', 'P')}
                ${circleBtn('n', 'var(--red)',   'N')}
                ${circleBtn('na','#9ca3af',      '—')}
                <td style="padding:8px;background:${rowBg};vertical-align:top">
                  <input style="width:100%;border:1px solid var(--line);border-radius:4px;padding:4px 6px;font-size:11px;background:#fff" placeholder="…" value="${escHtml(item.comment||'')}" data-action="chk-comment" data-ctx="${ctx}" data-si="${si}" data-ii="${ii}">
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
    }).join('')}

    <!-- RESUMEN POR SECCIÓN -->
    <div class="card" style="padding:0;overflow:hidden">
      <div style="background:var(--panel);color:var(--amber);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:12px 16px">Resumen por Categoría</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="background:var(--panel2)">
          <th style="text-align:left;padding:8px 12px;color:var(--muted);font-size:10px;text-transform:uppercase">Categoría</th>
          <th style="padding:8px 12px;color:var(--muted);font-size:10px;text-transform:uppercase">Evaluados</th>
          <th style="padding:8px 12px;color:var(--muted);font-size:10px;text-transform:uppercase">Puntos</th>
          <th style="padding:8px 12px;color:var(--muted);font-size:10px;text-transform:uppercase">%</th>
          <th style="padding:8px 12px;color:var(--muted);font-size:10px;text-transform:uppercase">Estado</th>
        </tr></thead>
        <tbody>
          ${sections.map(sec => {
            let sp = 0, sm = 0, se = 0;
            sec.items.forEach(it => {
              if (it.val === 'c')  { sp += 2; sm += 2; se++; }
              else if (it.val === 'p') { sp += 1; sm += 2; se++; }
              else if (it.val === 'n') { sm += 2; se++; }
            });
            const rp = sm > 0 ? Math.round(sp / sm * 100) : null;
            const est = rp === null ? '—' : rp >= 80 ? '🟢 OK' : rp >= 60 ? '🟡 Regular' : '🔴 Deficiente';
            return `<tr style="border-bottom:1px solid var(--line2)">
              <td style="padding:9px 12px;font-size:12px">${sec.section.replace(/^\d+ — /,'')}</td>
              <td style="padding:9px 12px;text-align:center;color:var(--muted)">${se}</td>
              <td style="padding:9px 12px;text-align:center;font-family:monospace">${sp}/${sm}</td>
              <td style="padding:9px 12px;text-align:center;font-weight:700;color:${rp===null?'var(--muted)':rp>=80?'var(--green)':rp>=60?'var(--amber)':'var(--red)'}">${rp !== null ? rp+'%' : '—'}</td>
              <td style="padding:9px 12px">${est}</td>
            </tr>`;
          }).join('')}
          <tr style="background:var(--panel);font-weight:700">
            <td style="padding:10px 12px;color:var(--amber)">TOTAL</td>
            <td style="padding:10px 12px;text-align:center;color:var(--amber)">—</td>
            <td style="padding:10px 12px;text-align:center;color:var(--amber);font-family:monospace">${totPts}/${totMax}</td>
            <td style="padding:10px 12px;text-align:center;color:${verdictColor};font-size:15px">${pct !== null ? pct+'%' : '—'}</td>
            <td style="padding:10px 12px;color:${verdictColor}">${verdict}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <div class="card-title">Observaciones Generales</div>
      <textarea class="field-textarea" style="width:100%;min-height:80px" placeholder="Hallazgos, incumplimientos relevantes, acciones correctivas recomendadas…" data-action="save-field" data-ctx="${ctx}" data-field="notes">${d.notes||''}</textarea>
    </div>`;
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
  if (!ref.data.tanks) ref.data.tanks = TANK_NAMES.map(n => ({ name: n }));
  ref.data.tanks[tankIdx][field] = value;

  // Auto-calculate derived per-tank values
  const t = ref.data.tanks[tankIdx];
  const tov = parseFloat(t.tov) || 0;
  const fw  = parseFloat(t.fw)  || 0;
  const gov = tov > 0 ? Math.max(0, tov - fw) : 0;
  const govBbl = gov * 6.289812;
  const vcf = (t.api && t.temp) ? vcfCalc(parseFloat(t.api), parseFloat(t.temp), ref.data.vcfTabla || '6A') : null;
  const gsv = (vcf && gov > 0) ? gov * vcf : 0;
  const gsvBbl = gsv * 6.289812;
  t.gov = gov > 0 ? gov.toFixed(6) : '';
  t.gsv = gsv > 0 ? gsv.toFixed(6) : '';

  // Update DOM cells for this tank
  const setTxt = (id, val, dec) => { const el = document.getElementById(id); if (el) el.textContent = val > 0 ? val.toFixed(dec) : '—'; };
  setTxt(`gov-${tankIdx}`, gov, 3);
  setTxt(`govbbl-${tankIdx}`, govBbl, 2);
  if (vcf) setTxt(`vcf-${tankIdx}`, vcf, 6); else { const el = document.getElementById(`vcf-${tankIdx}`); if(el) el.textContent = '—'; }
  setTxt(`gsv-${tankIdx}`, gsv, 3);
  setTxt(`gsvbbl-${tankIdx}`, gsvBbl, 2);

  // Recalculate all-tank totals
  const tanks = ref.data.tanks;
  const totalTOV = ullageTotal(tanks, 'tov');
  const totalFW  = ullageTotal(tanks, 'fw');
  const totalGOV = tanks.reduce((s, t) => { const g = parseFloat(t.gov)||0; return s+g; }, 0);
  const totalGSV = tanks.reduce((s, t) => { const g = parseFloat(t.gsv)||0; return s+g; }, 0);
  const setTotal = (id, val, dec=3) => { const el = document.getElementById(id); if(el) el.textContent = val > 0 ? val.toFixed(dec) : ''; };
  setTotal('total-tov', totalTOV);
  setTotal('total-fw', totalFW);
  setTotal('total-gov', totalGOV);
  setTotal('total-govbbl', totalGOV * 6.289812, 2);
  setTotal('total-gsv', totalGSV);
  setTotal('total-gsvbbl', totalGSV * 6.289812, 2);

  ref.save();
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
  // Auto-recalculate TCV = GSV + FW, NSV = GSV × (1 - BSW/100), update DOM spans live
  if (obj === 'totals' || obj === 'bl') {
    const gsv = parseFloat(ref.data[obj].gsv) || 0;
    const fw  = parseFloat(ref.data[obj].fw)  || 0;
    const bsw = parseFloat(ref.data[obj].bsw) || 0;
    if (gsv > 0) {
      let newTcv = null, newNsv = null;
      if (field === 'gsv' || field === 'fw')  { newTcv = (gsv + fw).toFixed(2); ref.data[obj].tcv = newTcv; }
      if (field === 'gsv' || field === 'bsw') { newNsv = (gsv * (1 - bsw / 100)).toFixed(2); ref.data[obj].nsv = newNsv; }
      // Update DOM spans immediately without full re-render
      document.querySelectorAll(`[data-auto][data-obj="${obj}"]`).forEach(span => {
        const autoType = span.dataset.auto;
        if (autoType === 'tcv' && newTcv !== null) span.textContent = newTcv;
        if (autoType === 'nsv' && newNsv !== null) span.textContent = newNsv;
      });
    }
  }
  ref.save();
}

// Save a tank field inside a module (used by ullage-arribo and ullage-origen)
// subObj: 'ullageOrigen' for datos-origen tanks, null for direct module.tanks
function saveUllTank(ctxStr, subObj, idx, field, value) {
  const ctx = decodeCtx(ctxStr);
  const ref = getModuleRef(ctx);
  if (!ref) return;
  const target = subObj ? (ref.data[subObj] || (ref.data[subObj] = {})) : ref.data;
  if (!target.tanks) target.tanks = TANK_NAMES.map(n => ({ name: n }));
  if (!target.tanks[idx]) target.tanks[idx] = {};
  target.tanks[idx][field] = value;
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
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  // Only close modal when clicking the overlay itself, not elements inside the modal panel
  if (a === 'close-modal-bg' && e.target.closest('[data-stop-propagation]')) return;

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
  else if (a === 'open-module-picker') {
    state.modal = 'module-picker';
    state.modalData = { pickerOpId: el.dataset.opid };
    render();
  }
  else if (a === 'add-module-type') {
    e.stopPropagation();
    const op = getOp(el.dataset.opid);
    if (op) {
      const updated = addModuleToOp(op, el.dataset.type);
      // Actualizar moduleOrder en op y guardar
      const ops = loadOps().map(o => o.id === op.id ? updated : o);
      saveOps(ops);
      state.modal = null;
      state.currentModule = updated.moduleOrder[updated.moduleOrder.length - 2] || updated.moduleOrder[0];
      render();
    }
  }
  else if (a === 'remove-module') {
    e.stopPropagation();
    const op = getOp(el.dataset.opid);
    const modKey = el.dataset.mod;
    if (op && modKey) {
      const updated = removeModuleFromOp(op, modKey);
      const ops = loadOps().map(o => o.id === op.id ? updated : o);
      saveOps(ops);
      if (state.currentModule === modKey) state.currentModule = null;
      render();
    }
  }
  else if (a === 'km-add-att') kmAddAtt(el.dataset.ctx);
  else if (a === 'km-rm-att') kmRmAtt(el.dataset.ctx, parseInt(el.dataset.idx));
  else if (a === 'km-add-topic') kmAddTopic(el.dataset.ctx);
  else if (a === 'km-rm-topic') kmRmTopic(el.dataset.ctx, parseInt(el.dataset.idx));
  else if (a === 'km-toggle-na') {
    const c = decodeCtx(el.dataset.ctx); const ref = getModuleRef(c);
    if (!ref) return;
    if (!ref.data.kmDisabled) ref.data.kmDisabled = {};
    const qid = el.dataset.qid;
    ref.data.kmDisabled[qid] = !ref.data.kmDisabled[qid];
    if (!ref.data.kmDisabled[qid]) delete ref.data.kmDisabled[qid];
    ref.save(); render();
  }
  else if (a === 'tl-add-event' || a === 'tl-add-row') tlAddRow(el.dataset.ctx);
  else if (a === 'tl-rm-event' || a === 'tl-del-row') tlDelRow(el.dataset.ctx, parseInt(el.dataset.idx));
  else if (a === 'doc-remove') {
    const c = decodeCtx(el.dataset.ctx); const ref = getModuleRef(c);
    if (!ref) return;
    const slot = el.dataset.slot; const idx = parseInt(el.dataset.idx);
    if (ref.data.docs?.[slot]) { ref.data.docs[slot].splice(idx, 1); ref.save(); render(); }
  }
  else if (a === 'vef-add-voyage') {
    const _c = decodeCtx(el.dataset.ctx); const _ref = getModuleRef(_c);
    if (!_ref) return;
    const _sub = el.dataset.sub;
    const _tgt = _sub ? (_ref.data[_sub] || (_ref.data[_sub] = {voyages:[],notes:''})) : _ref.data;
    if (!_tgt.voyages) _tgt.voyages = [];
    _tgt.voyages.push(emptyVEFVoyage());
    _ref.save(); render();
  }
  else if (a === 'vef-del-voyage') {
    const _c = decodeCtx(el.dataset.ctx); const _ref = getModuleRef(_c);
    if (!_ref) return;
    const _sub = el.dataset.sub;
    const _tgt = _sub ? _ref.data[_sub] : _ref.data;
    if (!_tgt?.voyages) return;
    _tgt.voyages.splice(parseInt(el.dataset.idx), 1);
    _ref.save(); render();
  }
  else if (a === 'vef-rm-voyage') {
    const _c = decodeCtx(el.dataset.ctx); const _ref = getModuleRef(_c);
    if (!_ref) return;
    const _sub = el.dataset.sub;
    const _tgt = _sub ? _ref.data[_sub] : _ref.data;
    if (!_tgt?.voyages) return;
    _tgt.voyages.splice(parseInt(el.dataset.idx), 1);
    _ref.save(); render();
  }
  else if (a === 'dr-add-row') drAddRow(el.dataset.ctx);
  else if (a === 'dr-rm-row') drRmRow(el.dataset.ctx, parseInt(el.dataset.idx));
  else if (a === 'chk-set') chkSet(el.dataset.ctx, parseInt(el.dataset.si), parseInt(el.dataset.ii), el.dataset.val);
  else if (a === 'chk-toggle-pq') {
    const pqEl = document.getElementById(`pq-${el.dataset.si}-${el.dataset.ii}`);
    if (pqEl) pqEl.style.display = pqEl.style.display === 'none' ? 'block' : 'none';
  }
  else if (a === 'delete-op') deleteOp(el.dataset.id);
  else if (a === 'edit-op') editOp(el.dataset.id);
  else if (a === 'export-ops') {
    const ops = loadOps();
    const blob = new Blob([JSON.stringify(ops, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a2 = document.createElement('a');
    a2.href = url; a2.download = `aci-ops-${new Date().toISOString().slice(0,10)}.json`;
    a2.click(); URL.revokeObjectURL(url);
  }
  else if (a === 'save-alijo-vessel-name' || a === 'save-alijo-vessel-imo') {/* handled by input */}
  else if (a === 'set-temp-unit') {
    const c = decodeCtx(el.dataset.ctx);
    const op = getOp(c.opId);
    if (op) {
      if (!op.modules[c.mod]) op.modules[c.mod] = {};
      op.modules[c.mod].tempUnit = el.dataset.unit;
      saveOp(op);
      render();
    }
  }
  else if (a === 'set-vcf-tabla') {
    const c = decodeCtx(el.dataset.ctx);
    const op = getOp(c.opId);
    if (op) {
      if (!op.modules[c.mod]) op.modules[c.mod] = {};
      op.modules[c.mod].vcfTabla = el.dataset.tabla;
      saveOp(op);
      render();
    }
  }
  else if (a === 'set-temp-unit') {
    const c = decodeCtx(el.dataset.ctx);
    const op = getOp(c.opId);
    if (op) {
      if (!op.modules[c.mod]) op.modules[c.mod] = {};
      op.modules[c.mod].tempUnit = el.dataset.unit;
      saveOp(op);
      render();
    }
  }
  else if (a === 'km-gen-acta') {
    const c = decodeCtx(el.dataset.ctx);
    const op = getOp(c.opId);
    if (!op) return;
    const d = op.modules[c.mod] || {};
    const ans = d.answers || {};
    const dis = d.kmDisabled || {};
    // Build filled questionnaire text — skip disabled (N/A) questions
    let filled = `Actúa como inspector independiente de cargo (QPIC) certificado con dominio completo de API MPMS Capítulo 17.1 (7ª Edición 2022) y Capítulo 17.11 / EI HM 52.\n\nA continuación las respuestas al cuestionario de Key Meeting / Pre-Transfer Conference:\n\nOperación: ${op.code} — ${op.vessel?.name||''}\nFecha: ${d.date||'—'} Hora: ${d.time||'—'} Lugar: ${d.location||'—'}\n\n`;
    KM_BLOCKS.forEach(block => {
      const activeQs = block.questions.filter(q => !dis[q.id]);
      if (!activeQs.length) return;
      filled += `BLOQUE ${block.id} — ${block.title}\n`;
      activeQs.forEach(q => {
        const v = ans[q.id] || '(Sin respuesta)';
        filled += `${q.id.replace('q','')}. ${q.text}: ${v}\n`;
      });
      filled += '\n';
    });
    filled += `Con base en todas las respuestas anteriores:\n1. Redacta el acta formal de Key Meeting con encabezado, fecha, hora, lugar, partes presentes y todos los acuerdos alcanzados.\n2. Genera una tabla de resumen de parámetros de medición acordados.\n3. Señala en negrita cualquier punto donde detectes incumplimiento de API MPMS Cap. 17.1 o 17.11, condición que requiere LOP, o riesgo de error de medición.\n4. Lista los documentos que deben estar disponibles antes de iniciar la operación.`;
    el.disabled = true; el.textContent = '⏳ Generando acta…';
    fetch('/api/consultar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: filled }] }),
    }).then(r => r.json()).then(res => {
      if (res.reply) {
        op.modules[c.mod].acta = res.reply;
        saveOp(op); render();
      } else { el.disabled=false; el.textContent='✍️ Generar Acta con Consultor IA'; alert(res.error||'Error al generar acta.'); }
    }).catch(() => { el.disabled=false; el.textContent='✍️ Generar Acta con Consultor IA'; alert('No se pudo conectar con el servidor.'); });
  }
  else if (a === 'ia-analizar-arribo') {
    const c = decodeCtx(el.dataset.ctx);
    const op = getOp(c.opId);
    if (!op) return;
    const origen = op.modules?.['datos-origen'] || {};
    const bl = origen.bl || {};
    const arribo = op.modules?.[c.mod] || {};
    const tot = arribo.totals || {};
    const _ovStats = origen.vefOrigen?.voyages?.length ? computeVEFStats(origen.vefOrigen.voyages) : null;
    const vefO = _ovStats ? _ovStats.vef.toFixed(4) : '—';
    const vefA = (op.modules?.['vef-comparativo']||{}).vefArribo || '—';
    const fmt = (v,u) => v ? `${parseFloat(v).toLocaleString('en-US',{minimumFractionDigits:3})} ${u}` : '—';
    const dGSV = (bl.gsv && tot.gsv) ? ((parseFloat(tot.gsv)-parseFloat(bl.gsv)).toFixed(3)) : null;
    const pGSV = (bl.gsv && tot.gsv && parseFloat(bl.gsv)) ? (((parseFloat(tot.gsv)-parseFloat(bl.gsv))/parseFloat(bl.gsv))*100).toFixed(4) : null;
    const hasPhotos = (arribo.media || []).length > 0;
    const photoNote = hasPhotos ? `\n\nEVIDENCIA FOTOGRÁFICA: Se adjuntan ${arribo.media.length} imagen(es) de la operación de medición. Analiza cada imagen: verifica que la cinta esté correctamente posicionada, que la lectura sea legible y consistente con los valores numéricos declarados, que las condiciones del tanque sean apropiadas, y que el procedimiento sea conforme a API MPMS Cap. 17.` : '';
    const prompt = `Actúa como QPIC certificado con dominio de API MPMS Cap. 17 y 11.1.\n\nRealiza un análisis comparativo exhaustivo de las cantidades de origen (BL) versus arribo para la operación ${op.code} — ${op.vessel?.name||''}, producto: ${op.product?.crudeName||op.product?.type||'—'}.${photoNote}\n\nDATOS DE ORIGEN (Bill of Lading):\n- GSV @60°F: ${fmt(bl.gsv,'BBL')}\n- TCV: ${fmt(bl.tcv,'BBL')}\n- Free Water: ${fmt(bl.fw,'BBL')}\n- API @60°F: ${bl.api||'—'} °API\n- BS&W: ${bl.bsw||'—'} %\n- Densidad @15°C: ${bl.densityAt15||'—'} kg/m³\n- VEF de origen: ${vefO}\n- Puerto de carga: ${origen.loadPort||'—'}\n- B/L N°: ${origen.blNumber||'—'}\n\nDATOS DE ARRIBO (Ullage Medición):\n- GSV @60°F: ${fmt(tot.gsv,'BBL')}\n- TCV: ${fmt(tot.tcv,'BBL')}\n- Free Water: ${fmt(tot.fw,'BBL')}\n- API @60°F: ${tot.api||'—'} °API\n- BS&W: ${tot.bsw||'—'} %\n- Densidad @15°C: ${tot.densityAt15||'—'} kg/m³\n- VEF de arribo: ${vefA}\n- Trim: ${arribo.trim||'—'} m  |  Lista: ${arribo.list||'—'}°\n\nDIFERENCIA:\n- ΔGSV: ${dGSV !== null ? dGSV+' BBL ('+pGSV+'%)' : '—'}\n\nNotas ullage arribo: ${arribo.notes||'—'}\n\nPor favor, estructura tu respuesta así:\n\n1. VALIDACIÓN FOTOGRÁFICA (solo si hay imágenes): Describe lo que observas en cada foto — posición de la cinta, lectura, condición del tanque, conformidad con API MPMS.\n2. ANÁLISIS DEL DESVÍO VOLUMÉTRICO: Evalúa si la diferencia está dentro de los rangos normales (±0.5% según API MPMS 17.11). Desglosa posibles causas.\n3. ANÁLISIS DEL VEF: Compara VEF origen vs arribo y su impacto en el volumen.\n4. CALIDAD DEL CARGO: Variaciones de API, BS&W, temperatura entre origen y arribo.\n5. ACCIONES RECOMENDADAS: Letter of Protest, OBQ/ROB, nota al cliente, observaciones para el reporte final.\n6. CONCLUSIÓN TÉCNICA: Dictamen final sobre la operación.`;
    // Build multimodal content: images first, then the text prompt
    const media = arribo.media || [];
    let msgContent;
    if (media.length) {
      const imgBlocks = media.map(m => ({
        type: 'image',
        source: { type: 'base64', media_type: m.mediaType || 'image/jpeg', data: m.base64 }
      }));
      msgContent = [...imgBlocks, { type: 'text', text: prompt }];
    } else {
      msgContent = prompt;
    }
    const btnLabel = media.length ? `🔍 Analizar con IA (${media.length} foto${media.length>1?'s':''})` : '🔍 Analizar con Consultor IA';
    el.disabled = true; el.textContent = `⏳ Analizando${media.length ? ' imágenes y datos' : ''}…`;
    fetch('/api/consultar', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ messages:[{role:'user',content:msgContent}] }) })
      .then(r=>r.json()).then(res=>{
        if (res.reply) { op.modules[c.mod].iaAnalysis = res.reply; op.modules[c.mod].iaDate = new Date().toISOString(); saveOp(op); render(); }
        else { el.disabled=false; el.textContent=btnLabel; alert(res.error||'Error.'); }
      }).catch(()=>{ el.disabled=false; el.textContent=btnLabel; alert('Sin conexión al servidor.'); });
  }
  else if (a === 'mod-ia-analyze') {
    const c = decodeCtx(el.dataset.ctx);
    const op = getOp(c.opId);
    if (!op) return;
    const modKey = el.dataset.mod || c.mod;
    const modData = op.modules[modKey] || {};
    const meta = MODULE_META[modKey] || {};
    const btnLabel = el.textContent.trim();
    el.disabled = true; el.textContent = '⏳ Analizando…';

    // Build context-aware prompt for this module
    const opCtx = `Operación: ${op.code||'—'} | Buque: ${op.vessel?.name||'—'} (IMO ${op.vessel?.imo||'—'}) | Producto: ${op.product?.crudeName||op.product?.type||'—'} | Puerto: ${op.port||'—'} | Cliente: ${op.client||'—'}`;
    const modSummary = JSON.stringify(modData, null, 2).slice(0, 6000);
    const prompt = `Eres un Inspector Senior de Loss Control de hidrocarburos con expertise en API MPMS, ASTM y normativas MARPOL. Analiza los datos del módulo "${meta.label||modKey}" de la siguiente operación de control de pérdidas y proporciona comentarios técnicos detallados.\n\n${opCtx}\n\nDatos del módulo:\n${modSummary}\n\nProporciona:\n1. Evaluación técnica de los datos ingresados\n2. Puntos de atención o alertas según normas API/ASTM\n3. Observaciones sobre completitud de la información\n4. Recomendaciones específicas para el Loss Control\n\nSé conciso pero técnico. Usa terminología de la industria petrolera.`;

    fetch('/api/consultar', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ messages: [{ role:'user', content: prompt }] }) })
      .then(r=>r.json()).then(res=>{
        if (res.reply) {
          if (!op.modules[modKey]) op.modules[modKey] = {};
          op.modules[modKey].iaAnalysis = res.reply;
          op.modules[modKey].iaDate = new Date().toISOString();
          saveOp(op); render();
        } else { el.disabled=false; el.textContent=btnLabel; alert(res.error||'Error del servidor.'); }
      }).catch(()=>{ el.disabled=false; el.textContent=btnLabel; alert('Sin conexión al servidor.'); });
  }
  else if (a === 'print-full-report') {
    showPDFSelector(el.dataset.opid);
  }
  else if (a === 'pdf-confirm-modules') {
    const opId3 = el.dataset.opid;
    const overlay = document.getElementById('pdf-selector-overlay');
    let checked = overlay ? [...overlay.querySelectorAll('input[type=checkbox]:checked')].map(cb=>cb.value) : null;
    if (overlay) overlay.remove();
    // reporte-evolutivo always last, always included
    if (checked && !checked.includes('reporte-evolutivo')) checked.push('reporte-evolutivo');
    printFullReport(opId3, checked);
  }
  else if (a === 'pdf-cancel') {
    const overlay = document.getElementById('pdf-selector-overlay');
    if (overlay) overlay.remove();
  }
  else if (a === 're-send-email') {
    const opId2 = el.dataset.opid;
    const op2 = getOp(opId2);
    if (!op2) return;
    const mods2 = op2.modules || {};
    const re2 = mods2['reporte-evolutivo'] || {};
    const origen2 = mods2['datos-origen'] || {};
    const bl2 = origen2.bl || {};
    const arriboKeys2 = (op2.moduleOrder||[]).filter(k => k==='ullage-arribo'||k.startsWith('ullage-ini')||k.startsWith('ullage-fin'));
    const firstA2 = arriboKeys2.map(k=>mods2[k]).find(m=>m?.totals?.gsv);
    const tot2 = firstA2?.totals || {};
    const fmtN2 = v => v ? parseFloat(v).toLocaleString('en-US',{minimumFractionDigits:3,maximumFractionDigits:3}) : '—';
    const _ov2Stats = origen2.vefOrigen?.voyages?.length ? computeVEFStats(origen2.vefOrigen.voyages) : null;
    const vefO2 = _ov2Stats?.vef || null;
    const _av2Stats = mods2['vef-comparativo']?.voyages?.length ? computeVEFStats(mods2['vef-comparativo'].voyages) : null;
    const vefA2 = _av2Stats?.vef || null;
    const analyses2 = (op2.moduleOrder||[]).map(k=>{
      const m=mods2[k]; if(!m) return null;
      const mm2 = MODULE_META[k]||{};
      if(k==='key-meeting'&&m.acta) return {label:'KEY MEETING — Acta Formal',content:m.acta};
      if(m.iaAnalysis && m.iaIncludeInReport !== false) return {label:(mm2.label||k)+' — Análisis IA',content:m.iaAnalysis};
      return null;
    }).filter(Boolean);
    const ln = s => `${s}\n`;
    let body = ln(`REPORTE EVOLUTIVO — ${op2.code||''}`);
    body += ln(`${op2.vessel?.name||''} | ${op2.product?.crudeName||op2.product?.type||''}`);
    body += ln(new Date().toLocaleDateString('es-CL')) + '\n';
    body += ln('BALANCE DE CANTIDADES');
    body += ln('─'.repeat(55));
    [['GSV @60°F',bl2.gsv,tot2.gsv,'BBL'],['TCV',bl2.tcv,tot2.tcv,'BBL'],
     ['Free Water',bl2.fw,tot2.fw,'BBL'],['API @60°F',bl2.api,tot2.api,'°API'],['BS&W',bl2.bsw,tot2.bsw,'%'],
     ['GSV m³ @15°C',bl2.m3At15,tot2.m3At15,'m³'],['Ton. Métricas',bl2.metricTons,tot2.metricTons,'MT']
    ].forEach(([l,b,a,u])=>{
      const bv=parseFloat(b)||null, av=parseFloat(a)||null;
      const dv=(bv&&av)?av-bv:null;
      body += ln(`${l.padEnd(16)} ${fmtN2(b).padEnd(14)} ${fmtN2(a).padEnd(14)} ${dv!==null?(dv>0?'+':'')+fmtN2(dv)+' '+u:'—'}`);
    });
    if (vefO2||vefA2) { body += ln(''); body += ln(`VEF Origen: ${vefO2?.toFixed(4)||'—'}  |  VEF Arribo: ${vefA2?.toFixed(4)||'—'}${(vefO2&&vefA2)?' | Δ VEF: '+(vefA2-vefO2>0?'+':'')+(vefA2-vefO2).toFixed(5):''}`);}
    analyses2.forEach(a2=>{ body += '\n' + ln('═'.repeat(55)) + ln(a2.label) + ln('─'.repeat(55)) + ln(a2.content); });
    if (re2.notes) { body += '\n' + ln('═'.repeat(55)) + ln('CONCLUSIÓN FINAL') + ln('─'.repeat(55)) + ln(re2.notes); }
    const subject = encodeURIComponent(`${op2.code||''} — Reporte Evolutivo — ${op2.vessel?.name||''}`);
    const bodyEnc = encodeURIComponent(body);
    window.location.href = `mailto:?subject=${subject}&body=${bodyEnc}`;
  }
  else if (a === 'ia-clear-arribo') {
    const c = decodeCtx(el.dataset.ctx); const op = getOp(c.opId);
    if (op) { delete op.modules[c.mod].iaAnalysis; delete op.modules[c.mod].iaDate; saveOp(op); render(); }
  }
  else if (a === 'media-remove') {
    const c = decodeCtx(el.dataset.ctx); const ref = getModuleRef(c);
    if (!ref) return;
    const idx = parseInt(el.dataset.idx);
    if (ref.data.media && ref.data.media[idx] !== undefined) {
      ref.data.media.splice(idx, 1); ref.save(); render();
    }
  }
  else if (a === 'add-vef-voyage') {
    const c = decodeCtx(el.dataset.ctx);
    const op = getOp(c.opId);
    const inp = document.getElementById('vef-voyage-input');
    const val = inp?.value.trim();
    if (op && val) {
      if (!op.modules[c.mod]) op.modules[c.mod] = {};
      if (!op.modules[c.mod].govVoyages) op.modules[c.mod].govVoyages = [];
      op.modules[c.mod].govVoyages.push(val);
      saveOp(op); render();
    }
  }
  else if (a === 'rm-vef-voyage') {
    const c = decodeCtx(el.dataset.ctx);
    const op = getOp(c.opId);
    if (op) {
      op.modules[c.mod].govVoyages.splice(parseInt(el.dataset.idx), 1);
      saveOp(op); render();
    }
  }
}

function handleChange(e) {
  const el = e.target;
  const a = el.dataset.action;
  if (!a) return;
  if (a === 'save-field') saveField(el.dataset.ctx, el.dataset.field, el.value);
  else if (a === 'save-tank') saveTank(el.dataset.ctx, parseInt(el.dataset.tank), el.dataset.field, el.value);
  else if (a === 'save-slop') saveSlop(el.dataset.ctx, el.dataset.phase, parseInt(el.dataset.idx), el.dataset.field, el.value);
  else if (a === 'save-nested') saveNested(el.dataset.ctx, el.dataset.obj, el.dataset.field, el.value);
  else if (a === 'save-ull-origen') saveUllTank(el.dataset.ctx, 'ullageOrigen', parseInt(el.dataset.idx), el.dataset.field, el.value);
  else if (a === 'save-ull-arribo') saveUllTank(el.dataset.ctx, null, parseInt(el.dataset.idx), el.dataset.field, el.value);
  else if (a === 'save-km-answer') {
    const ctx2 = decodeCtx(el.dataset.ctx); const ref = getModuleRef(ctx2);
    if (ref) { if (!ref.data.answers) ref.data.answers = {}; ref.data.answers[el.dataset.qid] = el.value; ref.save(); }
  }
  else if (a === 'save-km-check') {
    const ctx2 = decodeCtx(el.dataset.ctx); const ref = getModuleRef(ctx2);
    if (ref) {
      if (!ref.data.answers) ref.data.answers = {};
      const qid = el.dataset.qid;
      const cur = ref.data.answers[qid] ? ref.data.answers[qid].split('||') : [];
      if (el.checked) { if (!cur.includes(el.value)) cur.push(el.value); }
      else { const i = cur.indexOf(el.value); if (i >= 0) cur.splice(i,1); }
      ref.data.answers[qid] = cur.join('||');
      ref.save();
    }
  }
  else if (a === 'doc-upload') {
    const c = decodeCtx(el.dataset.ctx); const ref = getModuleRef(c);
    if (!ref) return;
    const slot = el.dataset.slot;
    if (!ref.data.docs) ref.data.docs = {};
    if (!ref.data.docs[slot]) ref.data.docs[slot] = [];
    const files = Array.from(el.files);
    let pending = files.length;
    if (!pending) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        ref.data.docs[slot].push({ name: file.name, data: ev.target.result, size: file.size, date: new Date().toISOString() });
        pending--;
        if (pending === 0) { ref.save(); render(); }
      };
      reader.readAsDataURL(file);
    });
  }
  else if (a === 'vef-save-voyage') {
    const c = decodeCtx(el.dataset.ctx); const ref = getModuleRef(c);
    if (!ref) return;
    const sub = el.dataset.sub;
    const target = sub ? (ref.data[sub] || (ref.data[sub] = {voyages:[],notes:''})) : ref.data;
    if (!target.voyages) target.voyages = [];
    const idx = parseInt(el.dataset.idx);
    if (!target.voyages[idx]) target.voyages[idx] = emptyVEFVoyage();
    target.voyages[idx][el.dataset.field] = el.type === 'checkbox' ? el.checked : el.value;
    ref.save();
    // Re-render just the results section without full render for performance
    // (full render would reset focus — defer to next tick if field not date/select)
    if (el.type === 'date' || el.tagName === 'SELECT') render();
    else {
      // update just the stats display
      const opData = getOp(c.opId);
      if (opData) saveOp(opData);
    }
  }
  else if (a === 'vef-save-notes') {
    const c = decodeCtx(el.dataset.ctx); const ref = getModuleRef(c);
    if (!ref) return;
    const sub = el.dataset.sub;
    const target = sub ? (ref.data[sub] || (ref.data[sub] = {voyages:[],notes:''})) : ref.data;
    target.notes = el.value;
    ref.save();
  }
  else if (a === 'mod-ia-toggle-report') {
    const c = decodeCtx(el.dataset.ctx); const ref = getModuleRef(c);
    if (!ref) return;
    ref.data.iaIncludeInReport = el.checked;
    ref.save(); render();
  }
  else if (a === 'tl-save-row') {
    const c = decodeCtx(el.dataset.ctx); const ref = getModuleRef(c);
    if (!ref) return;
    if (!ref.data.events) ref.data.events = [];
    const idx = parseInt(el.dataset.idx);
    if (!ref.data.events[idx]) ref.data.events[idx] = emptyTLEvent();
    ref.data.events[idx][el.dataset.field] = el.value;
    ref.save();
  }
  else if (a === 'chk-comment') chkComment(el.dataset.ctx, parseInt(el.dataset.si), parseInt(el.dataset.ii), el.value);
  else if (a === 'import-ops') {
    const file = el.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) { alert('Archivo inválido — debe ser un array de operaciones.'); return; }
        const existing = loadOps();
        const existingIds = new Set(existing.map(o => o.id));
        let added = 0;
        imported.forEach(op => { if (!existingIds.has(op.id)) { existing.push(op); added++; } });
        saveOps(existing);
        render();
        if (added > 0) alert(`✅ ${added} operación(es) importada(s) correctamente.`);
        else alert('ℹ️ Todas las operaciones ya existían (IDs duplicados).');
      } catch { alert('Error al leer el archivo JSON.'); }
    };
    reader.readAsText(file);
  }
  else if (a === 'media-upload') {
    const files = Array.from(el.files);
    if (!files.length) return;
    const ctx2 = decodeCtx(el.dataset.ctx);
    const ref = getModuleRef(ctx2);
    if (!ref) return;
    if (!ref.data.media) ref.data.media = [];
    const MAX = 20 * 1024 * 1024;
    let loaded = 0;
    const total = files.filter(f => f.size <= MAX).length;
    if (!total) { alert('Las imágenes seleccionadas superan 20 MB cada una.'); el.value=''; return; }
    files.forEach(file => {
      if (file.size > MAX) { alert(`"${file.name}" supera 20 MB, se omite.`); return; }
      const reader2 = new FileReader();
      reader2.onload = (ev2) => {
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1600;
          let w = img.width, h = img.height;
          if (w > MAX_DIM || h > MAX_DIM) {
            const ratio = Math.min(MAX_DIM/w, MAX_DIM/h);
            w = Math.round(w*ratio); h = Math.round(h*ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          const b64 = compressed.split(',')[1];
          ref.data.media.push({ name: file.name, data: compressed, base64: b64, mediaType: 'image/jpeg', ts: Date.now() });
          loaded++;
          if (loaded === total) { ref.save(); render(); }
        };
        img.src = ev2.target.result;
      };
      reader2.readAsDataURL(file);
    });
    el.value = '';
  }
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

function buildPresetModules(opType) {
  const mk = (type, extra={}) => ({ ...initModuleInstance(type), ...extra });

  if (opType === 'vef-arribo') {
    return {
      moduleOrder: ['datos-origen','key-meeting','ullage-arribo','vef-comparativo','discharge-record','termometros','checklist-inspeccion','reporte-evolutivo'],
      modules: {
        'datos-origen':        mk('datos-origen'),
        'key-meeting':         mk('key-meeting'),
        'ullage-arribo':       mk('ullage-arribo', { _label: 'Ullage Arribo' }),
        'vef-comparativo':     mk('vef-comparativo'),
        'discharge-record':    mk('discharge-record'),
        'termometros':         mk('termometros'),
        'checklist-inspeccion':mk('checklist'),
        'reporte-evolutivo':   mk('reporte-evolutivo'),
      },
      alijos: [],
    };
  }

  if (opType === 'completa') {
    return {
      moduleOrder: ['datos-origen','key-meeting','ullage-ini-madre','ullage-fin-madre','ullage-ini-alijador','ullage-fin-alijador','vef-comparativo','discharge-record','termometros','checklist-inspeccion','reporte-evolutivo'],
      modules: {
        'datos-origen':          mk('datos-origen'),
        'key-meeting':           mk('key-meeting'),
        'ullage-ini-madre':      mk('ullage-arribo', { _label: 'Ullage Ini Madre',    _vesselName:'' }),
        'ullage-fin-madre':      mk('ullage-arribo', { _label: 'Ullage Fin Madre',    _vesselName:'', _direction:'delivery',  pairedWith:'ullage-ini-madre' }),
        'ullage-ini-alijador':   mk('ullage-arribo', { _label: 'Ullage Ini Alijador', _vesselName:'' }),
        'ullage-fin-alijador':   mk('ullage-arribo', { _label: 'Ullage Fin Alijador', _vesselName:'', _direction:'reception', pairedWith:'ullage-ini-alijador' }),
        'vef-comparativo':       mk('vef-comparativo'),
        'discharge-record':      mk('discharge-record'),
        'termometros':           mk('termometros'),
        'checklist-inspeccion':  mk('checklist'),
        'reporte-evolutivo':     mk('reporte-evolutivo'),
      },
      alijos: [],
    };
  }

  if (opType === 'alije') {
    return {
      moduleOrder: ['origen', 'key-meeting', 'ullage-inicial-0', 'ullage-final-0', 'ullage-inicial-1', 'ullage-final-1', 'vef', 'time-log', 'discharge-record', 'slops', 'checklist-madre', 'checklist-alijador', 'summary'],
      modules: {
        'origen':            mk('origen'),
        'key-meeting':       mk('key-meeting'),
        'ullage-inicial-0':  mk('ullage-inicial', { _label: 'Ullage Ini Madre',    _vesselName: '' }),
        'ullage-final-0':    mk('ullage-final',   { _label: 'Ullage Fin Madre',    _direction: 'delivery',  pairedWith: 'ullage-inicial-0', _vesselName: '' }),
        'ullage-inicial-1':  mk('ullage-inicial', { _label: 'Ullage Ini Receptor', _vesselName: '' }),
        'ullage-final-1':    mk('ullage-final',   { _label: 'Ullage Fin Receptor', _direction: 'reception', pairedWith: 'ullage-inicial-1', _vesselName: '' }),
        'vef':               mk('vef'),
        'time-log':          mk('time-log'),
        'discharge-record':  mk('discharge-record'),
        'slops':             mk('slops'),
        'checklist-madre':   mk('checklist'),
        'checklist-alijador':mk('checklist'),
        'summary':           { notes: '' },
      },
      alijos: [],
    };
  }
  if (opType === 'vef') {
    return {
      moduleOrder: ['origen', 'key-meeting', 'ullage-inicial-0', 'vef', 'time-log', 'checklist-inspeccion', 'summary'],
      modules: {
        'origen':               mk('origen'),
        'key-meeting':          mk('key-meeting'),
        'ullage-inicial-0':     mk('ullage-inicial', { _label: 'Ullage Inicial' }),
        'vef':                  mk('vef'),
        'time-log':             mk('time-log'),
        'checklist-inspeccion': mk('checklist'),
        'summary':              { notes: '' },
      },
      alijos: [],
    };
  }
  if (opType === 'terminal') {
    return {
      moduleOrder: ['origen', 'key-meeting', 'ullage-inicial-0', 'ullage-final-0', 'vef', 'time-log', 'discharge-record', 'slops', 'checklist-buque', 'checklist-terminal', 'summary'],
      modules: {
        'origen':              mk('origen'),
        'key-meeting':         mk('key-meeting'),
        'ullage-inicial-0':    mk('ullage-inicial', { _label: 'Ullage Ini Buque' }),
        'ullage-final-0':      mk('ullage-final',   { _label: 'Ullage Fin Buque', _direction: 'delivery', pairedWith: 'ullage-inicial-0' }),
        'vef':                 mk('vef'),
        'time-log':            mk('time-log'),
        'discharge-record':    mk('discharge-record'),
        'slops':               mk('slops'),
        'checklist-buque':     mk('checklist'),
        'checklist-terminal':  mk('checklist'),
        'summary':             { notes: '' },
      },
      alijos: [],
    };
  }
  // Fallback for unknown types
  return { modules: initModuleData(opType), alijos: [] };
}

function handleModalCreate() {
  const d = state.modalData;
  if (!d.opType) { alert('Seleccione el tipo de operación o "Armar desde cero".'); return; }

  let op;
  if (d.opType === 'custom') {
    // Operación modular personalizada: empieza con Origen + Summary
    op = {
      id: newOpId(),
      code: d.code,
      country: d.country,
      vessel: { name: d.vesselName, voyage: d.voyage, imo: d.imo },
      product: { type: d.product, crudeName: d.crudeName || '' },
      clients: d.clients,
      port: d.port,
      terminal: d.terminal || '',
      inspectionCompany: d.inspectionCompany || '',
      createdAt: Date.now(),
      moduleOrder: ['origen', 'summary'],
      modules: {
        'origen': initModuleInstance('origen') || initModuleData('vef')['origen'],
        'summary': { notes: '' },
      },
      alijos: [],
    };
  } else {
    const presetModules = buildPresetModules(d.opType);
    // Remove optional modules if unchecked
    const optionals = ['discharge-record', 'termometros'];
    optionals.forEach(k => {
      if (d['opt_' + k] === false) {
        presetModules.moduleOrder = presetModules.moduleOrder.filter(m => m !== k);
        delete presetModules.modules[k];
      }
    });
    op = {
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
      ...presetModules,
    };
  }

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
function tlAddRow(ctx) {
  const c = decodeCtx(ctx);
  const ref = getModuleRef(c);
  if (!ref) return;
  if (!ref.data.events) ref.data.events = [];
  ref.data.events.push(emptyTLEvent());
  ref.save(); render();
}
function tlDelRow(ctx, idx) {
  const c = decodeCtx(ctx);
  const ref = getModuleRef(c);
  if (!ref) return;
  ref.data.events.splice(idx, 1);
  ref.save(); render();
}
function tlAddEvent(ctx) { tlAddRow(ctx); } // legacy alias
function tlRmEvent(ctx, idx) { tlDelRow(ctx, idx); } // legacy alias

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
function chkTemplate(mod) {
  return mod?.includes('terminal') ? CHECKLIST_TERMINAL
       : mod?.includes('alijador') ? CHECKLIST_LIGHTER
       : CHECKLIST_VESSEL;
}
function chkMigrateIfNeeded(ref, mod) {
  // Migrate old 5-section format to new rich 13-section format
  const isOld = ref.data.items && ref.data.items.length &&
                !ref.data.items[0].norm && !ref.data.items[0].intro;
  if (isOld || !ref.data.items || !ref.data.items.length) {
    ref.data.items = makeChecklistData(chkTemplate(mod));
  }
}
function chkSet(ctx, si, ii, val) {
  const c = decodeCtx(ctx);
  const ref = getModuleRef(c);
  if (!ref) return;
  chkMigrateIfNeeded(ref, c.mod);
  if (!ref.data.items?.[si]?.items?.[ii]) return;
  const current = ref.data.items[si].items[ii].val;
  ref.data.items[si].items[ii].val = current === val ? '' : val;
  ref.save();
  // Re-render only the module-content in place to avoid scroll reset
  const mc = document.getElementById('module-content');
  if (mc) {
    const scrollY = mc.scrollTop;
    const op = getOp(c.opId);
    if (op) {
      const modData = c.alijoIdx !== undefined
        ? op.alijos[c.alijoIdx].modules[c.mod]
        : op.modules[c.mod];
      mc.innerHTML = buildModuleContentInner(modData, c.mod, c);
    }
    mc.scrollTop = scrollY;
  } else {
    render();
  }
}
function chkComment(ctx, si, ii, val) {
  const c = decodeCtx(ctx);
  const ref = getModuleRef(c);
  if (!ref) return;
  chkMigrateIfNeeded(ref, c.mod);
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
syncFromServer().then(() => { render(); initEvents(); });
