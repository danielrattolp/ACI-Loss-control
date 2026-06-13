const publicContactForm = document.querySelector("#publicContactForm");

const serviceDetails = {
  "loss-control": {
    title: "Loss control y expediting",
    intro: "Representamos tecnicamente los intereses del cliente durante toda la operacion, con seguimiento continuo y comunicacion temprana de cualquier condicion que pueda afectar cantidad, calidad, tiempo o costo.",
    activities: [
      "Revision previa de instrucciones, nominaciones, ventanas operacionales y documentos disponibles.",
      "Coordinacion con nave, terminal, inspector independiente y representantes involucrados.",
      "Seguimiento de hitos, tiempos, demoras, interrupciones, restricciones y eventos relevantes.",
      "Emision de alertas tempranas y recomendaciones tecnicas durante la operacion.",
    ],
    deliverables: [
      "Actualizaciones operacionales y registro cronologico de eventos.",
      "Identificacion oportuna de desviaciones y riesgos de perdida.",
      "Bitacora consolidada y reporte tecnico de cierre.",
      "Mayor visibilidad para la toma de decisiones del cliente.",
    ],
  },
  reconciliacion: {
    title: "Reconciliacion nave/terminal",
    intro: "Analizamos y comparamos las cifras reportadas por la nave, el terminal y las partes relacionadas para explicar diferencias y determinar en que etapa de la operacion pudieron originarse.",
    activities: [
      "Revision de mediciones iniciales y finales de nave y terminal.",
      "Comparacion de volumenes observados y corregidos, temperaturas, densidades y factores aplicados.",
      "Validacion de documentos, tablas, certificados y secuencia de mediciones.",
      "Analisis de diferencias, tolerancias, remanentes y posibles causas operacionales.",
    ],
    deliverables: [
      "Cuadro de reconciliacion de cantidades nave/terminal/planta.",
      "Explicacion tecnica de diferencias identificadas.",
      "Listado de inconsistencias documentales o de medicion.",
      "Conclusiones respaldadas para cierre o investigacion posterior.",
    ],
  },
  "cantidad-calidad": {
    title: "Control de cantidad y calidad",
    intro: "Supervisamos los puntos de medicion y muestreo que determinan la cantidad y especificacion del producto, verificando que la informacion utilizada sea consistente, trazable y representativa.",
    activities: [
      "Observacion de aforos, lecturas de nivel, temperatura, agua libre y medicion de tanques.",
      "Revision de equipos, certificados de calibracion y condiciones de medicion.",
      "Supervision de muestreo, sellado, identificacion y cadena de custodia.",
      "Revision de certificados de calidad y resultados de laboratorio disponibles.",
    ],
    deliverables: [
      "Registro de mediciones y condiciones observadas.",
      "Trazabilidad de muestras y documentos de calidad.",
      "Reporte de desviaciones o inconsistencias detectadas.",
      "Respaldo tecnico de las cifras utilizadas en la operacion.",
    ],
  },
  "carga-descarga": {
    title: "Asistencia en carga y descarga",
    intro: "Mantenemos presencia tecnica en terreno durante la ejecucion fisica de la transferencia, observando la secuencia operacional y documentando cualquier desviacion respecto del plan acordado.",
    activities: [
      "Asistencia a reuniones previas y revision de la secuencia de transferencia.",
      "Control de inicio, detenciones, reinicios, cambios de tanque y termino de operacion.",
      "Seguimiento de caudales, presiones, stripping, drenajes y remanentes cuando corresponda.",
      "Registro fotografico y documental de condiciones o eventos relevantes.",
    ],
    deliverables: [
      "Bitacora horaria de la carga o descarga.",
      "Registro de demoras, interrupciones y desviaciones operacionales.",
      "Evidencia fotografica organizada y referenciada.",
      "Reporte de operacion con observaciones y hechos verificables.",
    ],
  },
  reclamos: {
    title: "Soporte a reclamos",
    intro: "Ordenamos y analizamos la evidencia tecnica disponible para ayudar al cliente a sustentar una diferencia, responder una controversia o evaluar la viabilidad de un reclamo operacional.",
    activities: [
      "Recopilacion de reportes, certificados, comunicaciones, fotografias y registros de tiempo.",
      "Construccion de una linea de tiempo verificable de la operacion.",
      "Revision de calculos, diferencias, protestas y documentos emitidos por las partes.",
      "Identificacion de vacios documentales, contradicciones y hechos tecnicamente relevantes.",
    ],
    deliverables: [
      "Dossier ordenado de evidencia y documentos criticos.",
      "Cronologia consolidada de hechos y comunicaciones.",
      "Informe tecnico de hallazgos y puntos de sustento.",
      "Base documental para revision comercial, legal o aseguradora.",
    ],
  },
  informes: {
    title: "Informes y trazabilidad",
    intro: "Transformamos la informacion generada en terreno en reportes claros, consistentes y defendibles, manteniendo trazabilidad desde el primer evento hasta las conclusiones finales.",
    activities: [
      "Emision de reportes preliminares y actualizaciones durante la operacion.",
      "Consolidacion de bitacoras, mediciones, documentos, fotografias y comunicaciones.",
      "Revision tecnica y control de consistencia antes de la entrega.",
      "Organizacion del expediente digital con identificacion y versionamiento documental.",
    ],
    deliverables: [
      "Reporte preliminar de eventos y desviaciones relevantes.",
      "Informe final con cronologia, hallazgos y conclusiones.",
      "Anexos documentales y fotograficos trazables.",
      "Expediente operacional preparado para consulta y auditoria.",
    ],
  },
};

const serviceDialog = document.querySelector("#serviceDialog");
const dialogTitle = document.querySelector("#serviceDialogTitle");
const dialogIntro = document.querySelector("#serviceDialogIntro");
const dialogActivities = document.querySelector("#serviceDialogActivities");
const dialogDeliverables = document.querySelector("#serviceDialogDeliverables");
const dialogClose = document.querySelector(".dialog-close");
const dialogContact = document.querySelector(".dialog-contact");
const serviceSelect = document.querySelector('select[name="service"]');
let serviceTrigger = null;
let selectedServiceTitle = "";

const renderList = (element, items) => {
  element.replaceChildren(...items.map((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    return listItem;
  }));
};

document.querySelectorAll(".service-more").forEach((button) => {
  button.addEventListener("click", () => {
    const detail = serviceDetails[button.dataset.service];
    if (!detail || !serviceDialog) return;

    serviceTrigger = button;
    selectedServiceTitle = detail.title;
    dialogTitle.textContent = detail.title;
    dialogIntro.textContent = detail.intro;
    renderList(dialogActivities, detail.activities);
    renderList(dialogDeliverables, detail.deliverables);
    serviceDialog.showModal();
    document.body.classList.add("dialog-open");
  });
});

const closeServiceDialog = () => serviceDialog?.close();

dialogClose?.addEventListener("click", closeServiceDialog);
dialogContact?.addEventListener("click", () => {
  if (serviceSelect && selectedServiceTitle) serviceSelect.value = selectedServiceTitle;
  closeServiceDialog();
});
serviceDialog?.addEventListener("click", (event) => {
  if (event.target === serviceDialog) closeServiceDialog();
});
serviceDialog?.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
  serviceTrigger?.focus();
});

publicContactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(publicContactForm);
  const name = data.get("name") || "";
  const company = data.get("company") || "";
  const email = data.get("email") || "";
  const phone = data.get("phone") || "";
  const country = data.get("country") || "";
  const service = data.get("service") || "";
  const details = data.get("details") || "";
  const subject = encodeURIComponent(`Solicitud ACI LATAM - ${company || name}`);
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
