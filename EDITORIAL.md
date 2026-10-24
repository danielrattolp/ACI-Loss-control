# Editor temporal del sitio público

El editor se abre en `/editor`. No se han creado cuentas, enviado invitaciones ni publicado cambios con esta implementación.

## Permisos y activación

Configurar una cuenta **propia** de administración con estas variables del servidor:

- `CMS_ADMIN_EMAIL`: administrador configurado por defecto: `danieratto@acilatam.cl`. Esta variable permite reemplazarlo explícitamente. Debe ser distinto del correo de Francisco. El correo por sí solo no habilita el acceso: se requiere la contraseña administrativa.
- `CMS_ADMIN_PASSWORD_HASH`: hash scrypt generado con `python tools/hash_editor_password.py`. La herramienta solicita la contraseña sin mostrarla. Guardar el hash completo como valor protegido en la configuración del servidor; nunca incluir contraseña ni hash en Git.
- En Vercel: `KV_REST_API_URL` y `KV_REST_API_TOKEN`, bindings del Redis/Upstash existente. El servicio necesita GET y EVAL/SET. Usa la clave independiente `aci:editorial:v1`, nunca las claves operacionales. Si falta el almacenamiento o falla, las escrituras devuelven 503 y no se confirman.

Tras desplegar y comprobar el almacenamiento, el administrador inicia sesión, define una contraseña editorial exclusiva y pulsa **Activar por 30 días**. La cuenta se limita a `francisco.montenegro@acilatam.cl`. Comunicar la contraseña por un canal privado; no hay envío automático de correo ni invitación. No reutilizar claves de operaciones ni de hosting.

Los 30 días exactos comienzan al activar, no al desplegar ni al primer ingreso. El servidor verifica vencimiento y revocación en **cada solicitud**, incluidas sesiones existentes. El administrador puede revocar sin esperar al vencimiento. Reactivar reinicia los 30 días y elimina la validez de las sesiones editoriales anteriores. Las sesiones duran como máximo ocho horas. Cambiar el correo o el hash del administrador invalida sus sesiones anteriores.

## Flujo de revisión

1. Francisco selecciona una versión, corrige textos (incluidos los detalles de servicios), escoge la imagen principal de la biblioteca existente y ajusta su encuadre horizontal. La vista previa no publica nada.
2. Guarda un borrador. Las versiones guardadas permanecen inmutables.
3. El administrador carga una versión y ve las diferencias con la publicación vigente.
4. El administrador pulsa **Publicar versión seleccionada**. Solo se publica esa versión guardada, nunca los cambios sin guardar.
5. Para restaurar, selecciona una versión anterior —o **Contenido original**— y publícala.

El permiso no concede acceso a operaciones, GitHub, Vercel, dominio, usuarios ni credenciales. Las sesiones editoriales son independientes. Esta incorporación no es una auditoría de los controles operacionales existentes.

No se admite HTML, JavaScript, CSS libre ni subida de archivos. Los textos se aplican con `textContent`; imágenes y encuadre se validan contra campos y biblioteca permitidos. Si se necesitan imágenes nuevas, el equipo propietario debe incorporarlas a `assets/` y actualizar `editorial/images.json`. No hay cambio libre de estructura de la página: los ajustes de diseño adicionales requieren revisión de código. Los enlaces, destinatarios del formulario y rutas de acceso no son editables.

## Entorno local

Se mantienen la raíz Flask operacional y su base de datos existentes. La página pública se puede revisar en `/public-preview`, y el editor en `/editor`. En producción Vercel conserva la página pública en `/` y añade las rutas nuevas. El endpoint de producción es `api/editorial.py`; Flask usa un adaptador para desarrollo.

Flask guarda el estado editorial en `.editorial-local.sqlite3` (ignorado en Git), o en la ruta `CMS_LOCAL_DB`. Vercel utiliza exclusivamente KV; no cae silenciosamente a archivos efímeros. No subir la base de datos local: contiene hashes, sesiones y borradores.

Ejemplo en PowerShell, desde la carpeta del repositorio y con las dependencias de `requirements.txt` instaladas en `.venv`:

```powershell
$env:CMS_ADMIN_EMAIL = 'danieratto@acilatam.cl'
$env:CMS_ADMIN_PASSWORD_HASH = & .\.venv\Scripts\python.exe tools\hash_editor_password.py
.\.venv\Scripts\python.exe app.py
```

En otra terminal:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
node --check editor.js
node --check public-content.js
node --check site.js
```

La suite incluye un servidor HTTP real, SQLite temporal, autenticación, separación de roles, borrador/publicación/restauración, revocación, expiración de permisos con sesión reciente, rotación de credenciales, conflictos de escritura y fallos de almacenamiento. Las pruebas usan identidades y claves efímeras, nunca credenciales reales.

## Antes de activar en producción

El propietario debe configurar el hash de su contraseña administrativa y verificar el binding KV del despliegue. Desplegar código no activa a Francisco. Verificar en una vista previa Vercel con almacenamiento aislado: inicio de sesión, borrador sin cambios públicos, publicación administrativa, restauración y revocación. La prueba local no verifica la conectividad del KV de producción ni el empaquetado del despliegue remoto.

El almacenamiento usa compare-and-set atómico para rechazar sobrescrituras simultáneas; ante un 409, recargar y revisar antes de volver a guardar. El contenido publicado se consulta al abrir la página; una sesión ya abierta requiere recargar para ver nuevas publicaciones. Ante un fallo de lectura, la página muestra su contenido estático original. Conservar respaldos del KV según la política de ACI; el historial está dentro del mismo almacenamiento y no sustituye un respaldo independiente.
