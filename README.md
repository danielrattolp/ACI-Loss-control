# ACI LATAM

Sitio publico y consola operacional interna para ACI LATAM / ACI Loss Control Experts.

## Rutas

- `/`: sitio corporativo publico.
- `/operaciones`: consola interna de reconciliacion operativa.

## Contacto

Las solicitudes comerciales de la web publica se envian por `mailto` a:

```txt
contacto@acilatam.cl
```

## Acceso operaciones

La consola `/operaciones` usa una barrera de acceso inicial con clave del lado cliente.

Clave temporal:

```txt
ACI2026!
```

Para seguridad fuerte se recomienda implementar autenticacion real con proveedor de identidad o proteccion de acceso a nivel hosting.

## Estructura

- `index.html`: sitio publico.
- `site.css`: estilos del sitio publico.
- `site.js`: formulario publico.
- `operaciones/`: consola operacional restringida.
- `assets/`: logos, favicon e imagen hero.
- `docs/`: identidad, documentos comerciales y manuales.

## Modulos operacionales

- Round trip operacional: origen, zarpe, arribo, alije, entrega final y reporte.
- Figura operacional: tablero de lectura que separa B/L, tierra origen, buque al arribo, buque descargado, tierra destino y sus balances.
- Plan de alijes: buque madre en bahia, alijadores dinamicos, destinos San Vicente/Quintero y balances separados STS y terminal.
- Compendio maestro: matriz unica BL/origen/arribo/alijes/tierra con mayor desvio y analisis inteligente de causas probables.
- API 12.1.1: ullage Before/After de 14 tanques con VCF Tablas 6A/6B/6C/6D y summary de descarga.
- Tierra / shore tanks: terminal, puerto, instrumentos de medicion, tanques dinamicos con medicion vertical OPEN/CLOSE basada en `Tierra.xlsx`, calculo por tanque, ajuste de linea y totales TOV/GOV/GSV/NSV, m3, densidad y API ponderado.

## Aplicacion Flask

La nueva aplicacion persistente se ejecuta con:

```powershell
python -m pip install -r requirements.txt
python app.py
```

Luego abra `http://127.0.0.1:5000/`.

Incluye wizard de datos generales, origen, arribo, destinos multiples, resumen,
analisis de desvios, SQLite y exportacion PDF. El algoritmo VCF implementado
replica las tablas operativas 6A/6B/6C/6D disponibles en el proyecto. Los
resultados contractuales deben validarse con la edicion licenciada aplicable de
API MPMS 11.1 y 12.1.1.

El paso de arribo incorpora ullage Before/After de 14 tanques. Para cada tanque
registra altura de referencia, ullage, TOV proveniente de la tabla de calibracion,
free water, temperatura, API y BS&W. El sistema consolida TOV, GOV, GSV, NSV,
metros cubicos a 15 C y toneladas metricas aire, aplicando VCF y VEF.
