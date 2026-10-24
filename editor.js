const $ = id => document.getElementById(id);
let state, content = {};
const date = t => new Date(t * 1000).toLocaleString('es-CL');
const notice = text => { $('message').textContent = text; };
async function api(action, data = {}) {
  const response = await fetch('/api/editorial', action === 'state' ? {headers:{'X-CMS-State':'1'},cache:'no-store'} : {
    method:'POST', headers:{'Content-Type':'application/json','X-CMS-Request':'1'},body:JSON.stringify({action,version:state?.version,...data})
  });
  const result = await response.json();
  if (!response.ok) throw Error((result.error || 'No se pudo completar la acción.') + (result.code ? ` [${result.code}]` : ''));
  return result;
}
function preview() { $('preview').contentWindow.postMessage({type:'cms-preview',content},location.origin); }
$('preview').addEventListener('load', preview);
function renderFields() {
  $('fields').replaceChildren();
  for (const [key, field] of Object.entries(state.fields)) {
    const label = document.createElement('label'); label.textContent = field.label;
    let input;
    if (field.kind === 'image') {
      input = document.createElement('select');
      for (const url of state.images) { const option = new Option(url.split('/').pop(),url); input.add(option); }
    } else {
      input = document.createElement(field.kind === 'position' ? 'input' : 'textarea');
      if (field.kind === 'position') { input.type='number';input.min=0;input.max=100; } else input.maxLength=4000;
    }
    input.value = content[key]; input.required=true;
    input.addEventListener('input',()=>{content[key]=input.value;preview();});
    label.append(input); $('fields').append(label);
  }
  preview();
}
function loadSelected() {
  const selected = state.revisions.find(r=>r.id === $('versions').value);
  content = selected ? {...selected.content} : Object.fromEntries(Object.entries(state.fields).map(([key,f])=>[key,f.value]));
  renderFields();
  const published = state.revisions.find(r=>r.id===state.published)?.content || Object.fromEntries(Object.entries(state.fields).map(([key,f])=>[key,f.value]));
  $('changes').replaceChildren();
  for (const [key,value] of Object.entries(content)) if (value !== published[key]) {
    const p=document.createElement('p'),before=document.createElement('del'),after=document.createElement('ins');
    before.textContent=published[key];after.textContent=value;p.append(state.fields[key].label+': ',before,' → ',after);$('changes').append(p);
  }
}
async function refresh() {
  state=await api('state');
  $('login').hidden=true; $('workspace').hidden=false;
  $('identity').textContent=`${state.email} · ${state.role==='admin'?'Administrador':'Editor'}`;
  $('admin').hidden=$('publish').hidden=$('history').hidden=state.role!=='admin';
  $('access').textContent=state.editor ? `${state.editor.email}: ${state.editor.revoked?'revocado':'vence el '+date(state.editor.expires)}`:'Sin acceso activado.';
  $('versions').replaceChildren(new Option('Contenido original','original'));
  for (const r of [...state.revisions].reverse()) $('versions').add(new Option(`${date(r.at)} · ${r.author}${r.id===state.published?' · PUBLICADA':''}`,r.id));
  if(state.revisions.length) $('versions').value=state.revisions.at(-1).id;
  $('audit').replaceChildren(...state.audit.map(a=>{const li=document.createElement('li');li.textContent=`${date(a.at)} · ${a.actor} · ${a.event}`;return li;}));
  loadSelected();
}
function handle(fn) { return async event => {event?.preventDefault(); try { await fn(event); } catch(error){notice(error.message);} }; }
$('login').addEventListener('submit',handle(async()=>{await api('login',Object.fromEntries(new FormData($('login'))));$('login').reset();await refresh();notice('Sesión iniciada.');}));
$('draft').addEventListener('submit',handle(async()=>{await api('draft',{content});await refresh();notice('Borrador guardado. La página pública no cambió.');}));
$('load').onclick=handle(async()=>{if(confirm('¿Cargar esta versión y descartar los cambios sin guardar?'))loadSelected();});
$('publish').onclick=handle(async()=>{const revision=$('versions').value;if(!revision)throw Error('Selecciona un borrador guardado.');if(confirm('¿Publicar la versión seleccionada? Los cambios sin guardar no se publicarán.')){await api('publish',{revision});await refresh();notice('Publicación actualizada.');}});
$('activation').onsubmit=handle(async()=>{if(!confirm('¿Activar a Francisco por 30 días desde ahora?'))return;await api('activate',Object.fromEntries(new FormData($('activation'))));$('activation').reset();await refresh();notice('Acceso activado por 30 días.');});
$('revoke').onclick=handle(async()=>{if(confirm('¿Revocar inmediatamente el acceso de Francisco?')){await api('revoke');await refresh();notice('Acceso revocado.');}});
$('logout').onclick=handle(async()=>{await api('logout');location.reload();});
refresh().catch(()=>{});
