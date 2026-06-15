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
              <th style="width:44px;font-size:11px">Tq.</th>
              <th style="font-size:11px">Ullage<br><span style="font-weight:400;color:var(--muted)">(m)</span></th>
              <th style="font-size:11px">TCF</th>
              <th style="font-size:11px">TOV<br><span style="font-weight:400;color:var(--muted)">(m³)</span></th>
              <th style="font-size:11px">FW<br><span style="font-weight:400;color:var(--muted)">(m)</span></th>
              <th style="font-size:11px">FW<br><span style="font-weight:400;color:var(--muted)">(m³)</span></th>
              <th style="font-size:11px;background:#e8f4f8">GOV<br><span style="font-weight:400;color:var(--muted)">(m³)</span></th>
              <th style="font-size:11px;background:#d4ecf7">GOV<br><span style="font-weight:400;color:var(--muted)">(BBL)</span></th>
              <th style="font-size:11px">Temp<br><span style="font-weight:400;color:var(--muted)">(°C)</span></th>
              <th style="font-size:11px">API<br><span style="font-weight:400;color:var(--muted)">@60°F</span></th>
              <th style="font-size:11px">BS&W<br><span style="font-weight:400;color:var(--muted)">(%)</span></th>
              <th style="font-size:11px;background:#e8f4ea">VCF<br><span style="font-weight:400;color:var(--muted)">@60°F</span></th>
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
              const vcf = (t.api && t.temp) ? vcfCalc(parseFloat(t.api), parseFloat(t.temp), 15.556) : null;
              const gsv = vcf && gov > 0 ? gov * vcf : 0;
              const gsvBbl = gsv * 6.289812;
              const fmtC = (v, d=3) => v > 0 ? v.toFixed(d) : (v===0&&tov>0?'0.000':'—');
              return `
              <tr>
                <td style="font-weight:700;font-size:12px">${t.name || TANK_NAMES[i]}</td>
                <td><input class="tbl-input" type="number" step="0.001" value="${t.ullage||''}" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="ullage"></td>
                <td><input class="tbl-input" type="number" step="0.0001" value="${t.tcf||''}" placeholder="1.0000" data-action="save-tank" data-ctx="${ctx}" data-tank="${i}" data-field="tcf"></td>
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
  const vcf = (t.api && t.temp) ? vcfCalc(parseFloat(t.api), parseFloat(t.temp), 15.556) : null;
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
render();
initEvents();
