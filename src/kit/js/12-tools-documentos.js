function toolAcuerdoTrabajo(){
  return `<div class="tool-section" id="tool-acuerdo">
    <div class="tool-header">
      <div class="tool-icon">📝</div>
      <div><div class="tool-title">Acuerdo de trabajo</div>
      <div class="tool-subtitle">Completa los datos y genera un acuerdo en PDF con tu marca. No es un contrato legal vinculante — es un compromiso de palabra puesto en papel.</div></div>
    </div>
    ${badgesHerramienta('acuerdo-trabajo')}
    <div class="form-row cols-2">
      <div class="form-group"><label>Nombre del propietario</label><input id="ac-propietario" type="text" placeholder="Juan Mamani"/></div>
      <div class="form-group"><label>CI del propietario</label><input id="ac-ci" type="text" placeholder="1234567 LP"/></div>
    </div>
    <div class="form-row cols-2">
      <div class="form-group"><label>Telefono / WhatsApp</label><input id="ac-tel" type="text" placeholder="+591 77777777"/></div>
      <div class="form-group"><label>Tipo de operacion</label>
        <select id="ac-tipo"><option>Venta</option><option>Alquiler</option><option>Antictretico</option></select>
      </div>
    </div>
    <div class="form-group"><label>Direccion / descripcion del inmueble</label><input id="ac-direccion" type="text" placeholder="Av. Ballivian 450, Sopocachi — departamento 3B"/></div>
    <div class="form-row cols-3">
      <div class="form-group"><label>Precio acordado (USD)</label><input id="ac-precio" type="text" placeholder="85000"/></div>
      <div class="form-group"><label>Comision del agente (%)</label><input id="ac-com" type="number" placeholder="3" step="0.5"/></div>
      <div class="form-group"><label>Duracion del acuerdo</label><input id="ac-duracion" type="text" placeholder="3 meses"/></div>
    </div>
    <div class="form-group"><label>Observaciones adicionales (opcional)</label>
      <textarea id="ac-obs" rows="2" placeholder="Exclusividad, condiciones especiales, etc."></textarea>
    </div>
    <div class="btn-group">
      <button class="btn btn-gold" onclick="generarPDFAcuerdo()">&#128196; Generar acuerdo PDF</button>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════
// HERRAMIENTA: PRESENTACION PERSONAL
// ══════════════════════════════════════════════
function toolPresentacionPersonal(){
  return `<div class="tool-section" id="tool-presentacion">
    <div class="tool-header">
      <div class="tool-icon">&#128100;</div>
      <div><div class="tool-title">Presentacion personal</div>
      <div class="tool-subtitle">Genera una pagina de presentacion profesional con tus datos del perfil lista para compartir con propietarios y compradores.</div></div>
    </div>
    ${badgesHerramienta('presentacion-personal-word')}
    <div class="form-group"><label>Especialidad principal</label>
      <select id="pres-esp">
        <option>Venta y alquiler de inmuebles residenciales</option>
        <option>Inmuebles comerciales y oficinas</option>
        <option>Terrenos y proyectos</option>
        <option>Antictreticos y alquileres</option>
        <option>Compra, venta y alquiler de todo tipo</option>
      </select>
    </div>
    <div class="form-group"><label>Años de experiencia</label>
      <input id="pres-anos" type="text" placeholder="5 años" />
    </div>
    <div class="form-group"><label>Zona de trabajo principal</label>
      <input id="pres-zona" type="text" placeholder="Sopocachi, Miraflores, San Miguel — La Paz" />
    </div>
    <div class="form-group"><label>Propuesta de valor (en tus palabras)</label>
      <textarea id="pres-valor" rows="2" placeholder="Te ayudo a vender tu propiedad al mejor precio, con acompañamiento desde la captacion hasta la firma."></textarea>
    </div>
    <div class="btn-group">
      <button class="btn btn-gold" onclick="generarPDFPresentacion()">&#128196; Generar presentacion PDF</button>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════
// GENERADORES PDF — NUEVAS HERRAMIENTAS
// ══════════════════════════════════════════════

function buildComisionHTML(precio, pct, comUSD, comBs, neto, tc){
  var rows = [
    ['Precio de venta', '$ '+precio.toLocaleString('es-BO')],
    ['Comision acordada', pct+'%'],
    ['Comision en USD', '<strong style="color:var(--pdf-navy);font-size:1.1rem;">$ '+comUSD.toLocaleString('es-BO',{minimumFractionDigits:0,maximumFractionDigits:0})+'</strong>'],
    ['Comision en Bolivianos', '<strong style="color:var(--pdf-navy);font-size:1.1rem;">Bs. '+comBs.toLocaleString('es-BO',{minimumFractionDigits:0,maximumFractionDigits:0})+'</strong>'],
    ['Neto al propietario', '$ '+neto.toLocaleString('es-BO',{minimumFractionDigits:0,maximumFractionDigits:0})],
    ['Tipo de cambio usado', 'Bs. '+tc+' por USD'],
  ];
  var rowsHtml = rows.map(function(r,i){
    var bg = i%2===0?'#f8f9fc':'#fff';
    return '<tr style="background:'+bg+'"><td style="padding:11px 16px;color:#4a5568;font-size:0.88rem;">'+r[0]+'</td><td style="padding:11px 16px;text-align:right;font-size:0.88rem;color:var(--pdf-navy);">'+r[1]+'</td></tr>';
  }).join('');
  var fecha = new Date().toLocaleDateString('es-BO',{day:'2-digit',month:'long',year:'numeric'});
  return DOC_INICIO
    +_agentHeaderHTML()
    +'<div style="padding:32px 36px;">'
    +'<h1 style="font-family:Georgia,serif;font-size:1.5rem;color:var(--pdf-navy);margin:0 0 4px;font-weight:700;">Propuesta de Honorarios Profesionales</h1>'
    +'<div style="width:48px;height:3px;background:var(--gold);border-radius:2px;margin-bottom:24px;"></div>'
    +'<table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">'
    +'<thead><tr style="background:var(--pdf-navy);color:#fff;"><th style="padding:11px 16px;text-align:left;font-size:0.8rem;font-weight:600;letter-spacing:0.05em;">CONCEPTO</th><th style="padding:11px 16px;text-align:right;font-size:0.8rem;font-weight:600;letter-spacing:0.05em;">VALOR</th></tr></thead>'
    +'<tbody>'+rowsHtml+'</tbody>'
    +'</table>'
    +'<div style="margin-top:24px;background:#f8f9fc;border-left:4px solid var(--gold);border-radius:0 8px 8px 0;padding:16px 20px;">'
    +'<p style="margin:0;font-size:0.85rem;color:#4a5568;line-height:1.6;">La comision se abona unicamente al concretarse la operacion. Incluye publicacion en portales, filtraje de compradores, coordinacion de visitas, acompanamiento en negociacion y asistencia hasta la firma.</p>'
    +'</div>'
    +'<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">'
    +'<div style="font-size:0.75rem;color:#94a3b8;">Documento informativo &middot; '+fecha+'</div>'
    +'<div style="width:80px;height:2px;background:var(--gold);border-radius:1px;"></div>'
    +'</div>'
    +'</div></body></html>';
}

function buildAntictreticoHTML(capital, anos, comPct, tc, alquiler, capBs, comUSD, rendimiento, itPct, itUSD, notariales, capitalNeto){
  var rows = [
    ['Capital del antictretico','$ '+capital.toLocaleString('es-BO')],
    ['En bolivianos (TC Bs. '+tc+')','Bs. '+capBs.toLocaleString('es-BO',{maximumFractionDigits:0})],
    ['Duracion del contrato',anos+' ano'+(anos!=1?'s':'')],
    ['Comision del agente ('+comPct+'%)','<strong style="color:var(--pdf-navy);">$ '+comUSD.toLocaleString('es-BO',{maximumFractionDigits:0})+'</strong>'],
    ['Alquiler mensual equiv.',alquiler?'$ '+alquiler.toLocaleString('es-BO')+'/mes':'No indicado'],
    ['Rendimiento implicito para propietario',rendimiento!=='—'?rendimiento+'% anual':'—'],
    ['IT — Impuesto a la Transferencia ('+itPct+'%)','$ '+itUSD.toLocaleString('es-BO',{maximumFractionDigits:0})],
    ['Gastos notariales estimados','$ '+notariales.toLocaleString('es-BO',{maximumFractionDigits:0})],
    ['Capital neto (IT + notariales descontados)','<strong style="color:var(--pdf-navy);">$ '+capitalNeto.toLocaleString('es-BO',{maximumFractionDigits:0})+'</strong>'],
  ];
  var rowsHtml = rows.map(function(r,i){
    var bg = i%2===0?'#f8f9fc':'#fff';
    return '<tr style="background:'+bg+'"><td style="padding:11px 16px;color:#4a5568;font-size:0.88rem;">'+r[0]+'</td><td style="padding:11px 16px;text-align:right;font-size:0.88rem;color:var(--pdf-navy);">'+r[1]+'</td></tr>';
  }).join('');
  return DOC_INICIO
    +_agentHeaderHTML()
    +'<div style="padding:32px 36px;">'
    +'<h1 style="font-family:Georgia,serif;font-size:1.5rem;color:var(--pdf-navy);margin:0 0 4px;font-weight:700;">Resumen de Operacion de Antictretico</h1>'
    +'<div style="width:48px;height:3px;background:var(--gold);border-radius:2px;margin-bottom:24px;"></div>'
    +'<table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">'
    +'<thead><tr style="background:var(--pdf-navy);color:#fff;"><th style="padding:11px 16px;text-align:left;font-size:0.8rem;font-weight:600;letter-spacing:0.05em;">CONCEPTO</th><th style="padding:11px 16px;text-align:right;font-size:0.8rem;font-weight:600;letter-spacing:0.05em;">DETALLE</th></tr></thead>'
    +'<tbody>'+rowsHtml+'</tbody>'
    +'</table>'
    +'<div style="margin-top:20px;background:var(--gold-pastel-bg);border:1px solid var(--gold);border-radius:8px;padding:16px 20px;">'
    +'<div style="font-weight:700;color:var(--accent-text-muted);margin-bottom:6px;font-size:0.88rem;">&#9888;&#65039; Obligatorio por ley</div>'
    +'<p style="margin:0;font-size:0.83rem;color:var(--accent-text-muted);line-height:1.6;">El contrato de antictretico debe elevarse a escritura publica e inscribirse en Derechos Reales. Sin este registro, el capital del anticretista queda desprotegido ante cualquier reclamo de terceros o remate del inmueble.</p>'
    +'</div>'
    +'<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">'
    +'<div style="font-size:0.75rem;color:#94a3b8;">Documento orientativo &middot; No reemplaza asesoria legal</div>'
    +'<div style="width:80px;height:2px;background:var(--gold);border-radius:1px;"></div>'
    +'</div>'
    +'</div></body></html>';
}

function buildComparadorHTML(props){
  var cols = props.map(function(p){ return '<th style="padding:11px 14px;text-align:center;font-size:0.82rem;">'+esc(p.nombre||'Propiedad')+'</th>'; }).join('');
  var rows = [
    {label:'Precio (USD)', fn:function(p){ return p.precio?'<strong style="color:var(--pdf-navy);">$ '+p.precio.toLocaleString('es-BO')+'</strong>':'—'; }},
    {label:'Zona', fn:function(p){ return p.zona?esc(p.zona):'—'; }},
    {label:'Superficie', fn:function(p){ return p.m2?p.m2+' m&sup2;':'—'; }},
    {label:'Precio por m&sup2;', fn:function(p){ return (p.precio&&p.m2)?'$ '+(p.precio/p.m2).toFixed(0)+'/m&sup2;':'—'; }},
    {label:'Dormitorios', fn:function(p){ return p.dorm||'—'; }},
    {label:'Antig&uuml;edad', fn:function(p){ return p.antiguedad?p.antiguedad+' a&ntilde;os':'—'; }},
    {label:'Parqueo', fn:function(p){ return p.parqueo||'—'; }},
    {label:'Expensas', fn:function(p){ return p.expensas?'$ '+p.expensas+'/mes':'—'; }},
  ];
  // highlight best value per row
  var rowsHtml = rows.map(function(r,i){
    var bg = i%2===0?'#f8f9fc':'#fff';
    var vals = props.map(r.fn);
    return '<tr style="background:'+bg+'"><td style="padding:10px 14px;font-weight:600;color:var(--pdf-navy);font-size:0.85rem;">'+r.label+'</td>'+vals.map(function(v){ return '<td style="padding:10px 14px;text-align:center;font-size:0.85rem;color:#2d3748;">'+v+'</td>'; }).join('')+'</tr>';
  }).join('');
  var recomendacion = _recomendacionComparador(props);
  var recomendacionHtml = recomendacion
    ? '<div style="margin-top:16px;background:var(--gold-pastel-bg);border-left:4px solid var(--gold);border-radius:0 8px 8px 0;padding:14px 18px;"><p style="margin:0;font-size:0.82rem;color:#4a5568;line-height:1.6;">&#128161; '+esc(recomendacion)+'</p></div>'
    : '';
  return DOC_INICIO
    +_agentHeaderHTML()
    +'<div style="padding:32px 36px;">'
    +'<h1 style="font-family:Georgia,serif;font-size:1.5rem;color:var(--pdf-navy);margin:0 0 4px;font-weight:700;">Comparativa de Propiedades</h1>'
    +'<div style="width:48px;height:3px;background:var(--gold);border-radius:2px;margin-bottom:24px;"></div>'
    +'<table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">'
    +'<thead><tr style="background:var(--pdf-navy);color:#fff;"><th style="padding:11px 14px;text-align:left;font-size:0.8rem;font-weight:600;letter-spacing:0.05em;">CARACTERISTICA</th>'+cols+'</tr></thead>'
    +'<tbody>'+rowsHtml+'</tbody>'
    +'</table>'
    +recomendacionHtml
    +'<div style="margin-top:16px;background:#f8f9fc;border-left:4px solid var(--gold);border-radius:0 8px 8px 0;padding:14px 18px;">'
    +'<p style="margin:0;font-size:0.82rem;color:#4a5568;line-height:1.6;">Comparativa preparada especialmente para ti. Cualquier consulta sobre estas propiedades, estoy disponible por WhatsApp.</p>'
    +'</div>'
    +'<div style="margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;">'
    +'<div style="font-size:0.75rem;color:#94a3b8;">Documento generado para uso del cliente</div>'
    +'<div style="width:80px;height:2px;background:var(--gold);border-radius:1px;margin-top:8px;"></div>'
    +'</div>'
    +'</div></body></html>';
}

function buildGuiaLegalHTML(){
  var pasos = [
    {n:1,titulo:'Folio Real (Informacion Rapida de Derechos Reales)',texto:'Verificacion de que el vendedor es el propietario real y que el inmueble no tiene hipotecas, gravamenes ni embargos. Se obtiene en la oficina de Derechos Reales del departamento. Costo aproximado: Bs. 15-30.'},
    {n:2,titulo:'Minuta de compraventa',texto:'Documento preparado por un abogado que establece las condiciones de la venta: precio, forma de pago y plazos. Ambas partes firman ante notario.'},
    {n:3,titulo:'Impuestos de la operacion',texto:'Impuesto a la Transferencia (IT): 3% del valor de venta, lo paga el vendedor. Si el vendedor es empresa, puede aplicar RC-IVA. Consultar con contador ante cualquier duda sobre el regimen.'},
    {n:4,titulo:'Escritura publica ante notario',texto:'La minuta se eleva a escritura publica. El notario verifica identidades y da fe del acto. El costo varia segun el valor del inmueble.'},
    {n:5,titulo:'Registro en Derechos Reales',texto:'La escritura se inscribe en Derechos Reales para que el comprador quede como nuevo propietario en el folio real. Sin este paso, el comprador no queda registrado como nuevo dueño ante la ley.'},
  ];
  var pasosHtml = pasos.map(function(p){
    return '<div style="display:flex;gap:16px;margin-bottom:18px;align-items:flex-start;">'
      +'<div style="min-width:32px;height:32px;border-radius:50%;background:var(--pdf-navy);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;flex-shrink:0;">'+p.n+'</div>'
      +'<div><div style="font-weight:700;color:var(--pdf-navy);font-size:0.92rem;margin-bottom:4px;">'+p.titulo+'</div>'
      +'<div style="font-size:0.84rem;color:#4a5568;line-height:1.6;">'+p.texto+'</div></div>'
      +'</div>';
  }).join('');
  return DOC_INICIO
    +_agentHeaderHTML()
    +'<div style="padding:32px 36px;">'
    +'<h1 style="font-family:Georgia,serif;font-size:1.5rem;color:var(--pdf-navy);margin:0 0 4px;font-weight:700;">Guia del Proceso Legal</h1>'
    +'<div style="font-size:0.85rem;color:#718096;margin-bottom:20px;">Tu operacion inmobiliaria en Bolivia &mdash; paso a paso</div>'
    +'<div style="width:48px;height:3px;background:var(--gold);border-radius:2px;margin-bottom:28px;"></div>'
    +pasosHtml
    +'<div style="margin-top:12px;background:var(--gold-pastel-bg);border:1px solid var(--gold);border-radius:8px;padding:14px 18px;">'
    +'<p style="margin:0;font-size:0.82rem;color:var(--accent-text-muted);line-height:1.6;"><strong>Nota importante:</strong> Esta guia es orientativa. Para tu operacion especifica, te recomendamos trabajar con un abogado o notario de confianza. Tu agente puede orientarte — no reemplaza asesoria legal profesional.</p>'
    +'</div>'
    +'<div style="margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">'
    +'<div style="font-size:0.75rem;color:#94a3b8;">Documento orientativo preparado por tu agente</div>'
    +'<div style="width:80px;height:2px;background:var(--gold);border-radius:1px;"></div>'
    +'</div>'
    +'</div></body></html>';
}

function buildAcuerdoHTML(propietario, ci, tel, tipo, direccion, precio, comPct, duracion, obs){
  var comMonto = precio ? '$ '+(parseFloat(precio)*(parseFloat(comPct||3)/100)).toFixed(0)+' USD aprox.' : 'segun precio acordado';
  var fecha = new Date().toLocaleDateString('es-BO',{day:'2-digit',month:'long',year:'numeric'});
  var partes = [
    ['Agente',esc(AGENTE.nombre||'Agente')+(AGENTE.ciudad?' &mdash; '+esc(AGENTE.ciudad):'')+(AGENTE.whatsapp?' &mdash; '+esc(AGENTE.whatsapp):'')],
    ['Propietario',esc(propietario)+(ci?' &mdash; CI: '+esc(ci):'')+(tel?' &mdash; '+esc(tel):'')],
    ['Inmueble',esc(direccion)],
    ['Tipo de operacion',esc(tipo)],
    ['Precio de salida acordado',precio?'$ '+parseFloat(precio).toLocaleString('es-BO')+' USD':'Por definir'],
    ['Comision del agente',comPct+'% &mdash; '+comMonto],
    ['Duracion del acuerdo',esc(duracion||'A definir')],
    ['Fecha',fecha],
  ];
  if(obs) partes.push(['Observaciones',esc(obs)]);
  var partesHtml = partes.map(function(p,i){
    var bg = i%2===0?'#f8f9fc':'#fff';
    return '<tr style="background:'+bg+'"><td style="padding:10px 16px;font-weight:600;color:var(--pdf-navy);font-size:0.85rem;width:38%;">'+p[0]+'</td><td style="padding:10px 16px;font-size:0.85rem;color:#2d3748;">'+p[1]+'</td></tr>';
  }).join('');
  return DOC_INICIO
    +_agentHeaderHTML()
    +'<div style="padding:32px 36px;">'
    +'<h1 style="font-family:Georgia,serif;font-size:1.5rem;color:var(--pdf-navy);margin:0 0 4px;font-weight:700;">Acuerdo de Trabajo</h1>'
    +'<div style="font-size:0.83rem;color:#718096;margin-bottom:20px;">Compromiso de representacion inmobiliaria &mdash; no es un contrato legal vinculante</div>'
    +'<div style="width:48px;height:3px;background:var(--gold);border-radius:2px;margin-bottom:24px;"></div>'
    +'<table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">'
    +'<tbody>'+partesHtml+'</tbody>'
    +'</table>'
    +'<div style="margin-top:28px;padding:20px 24px;border:1px solid #e2e8f0;border-radius:8px;">'
    +'<p style="margin:0 0 12px;font-size:0.85rem;color:#2d3748;line-height:1.7;">Por medio del presente, las partes acuerdan que el agente prestara servicios de intermediacion inmobiliaria para la operacion detallada arriba, comprometiendose a publicar, gestionar consultas, coordinar visitas y acompañar el proceso hasta la firma. La comision sera abonada unicamente al concretarse la operacion.</p>'
    +'<p style="margin:0;font-size:0.82rem;color:#718096;line-height:1.6;font-style:italic;">Este documento expresa un acuerdo de buena fe entre las partes. No reemplaza una minuta ni instrumento legal formal. Para operaciones que requieran respaldo legal, se recomienda elevar el acuerdo a documento privado con firma de testigos o instrumento publico.</p>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:48px;">'
    +'<div style="border-top:2px solid var(--pdf-navy);padding-top:8px;"><div style="font-size:0.78rem;color:#718096;">Firma del agente</div><div style="font-size:0.82rem;color:var(--pdf-navy);font-weight:600;margin-top:4px;">'+esc(AGENTE.nombre||'Agente')+'</div></div>'
    +'<div style="border-top:2px solid var(--pdf-navy);padding-top:8px;"><div style="font-size:0.78rem;color:#718096;">Firma del propietario</div><div style="font-size:0.82rem;color:var(--pdf-navy);font-weight:600;margin-top:4px;">'+esc(propietario)+'</div></div>'
    +'</div>'
    +'<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-size:0.75rem;color:#94a3b8;">'+fecha+'</div>'
    +'</div></body></html>';
}

function buildPresentacionHTML(especialidad, anos, zona, valor){
  var foto = localStorage.getItem('mk_foto')||'';
  var fotoHtml = foto
    ?'<img src="'+foto+'" style="width:110px;height:110px;border-radius:50%;object-fit:cover;border:4px solid var(--gold);display:block;margin:0 auto 16px;"/>'
    :'<div style="width:110px;height:110px;border-radius:50%;background:#eef1f6;border:4px solid var(--gold);display:flex;align-items:center;justify-content:center;font-size:2.5rem;margin:0 auto 16px;">&#128100;</div>';
  var contacto = [];
  if(AGENTE.ciudad) contacto.push('&#128205; '+esc(AGENTE.ciudad));
  if(AGENTE.whatsapp) contacto.push('&#128242; '+esc(AGENTE.whatsapp));
  if(AGENTE.email) contacto.push('&#9993;&#65039; '+esc(AGENTE.email));
  return DOC_INICIO
    +'<div style="background:linear-gradient(135deg,var(--pdf-navy),var(--pdf-navy-2));min-height:220px;display:flex;align-items:center;justify-content:center;padding:40px 36px;text-align:center;">'
    +fotoHtml
    +'<div>'
    +'<div style="font-family:Georgia,serif;font-size:1.8rem;font-weight:700;color:#fff;letter-spacing:0.5px;margin-bottom:6px;">'+esc(AGENTE.nombre||'Agente Inmobiliario')+'</div>'
    +'<div style="height:3px;width:60px;background:var(--gold);border-radius:2px;margin:0 auto 12px;"></div>'
    +'<div style="font-size:0.9rem;color:rgba(255,255,255,0.8);margin-bottom:10px;">'+esc(especialidad)+'</div>'
    +(anos?'<div style="font-size:0.82rem;color:rgba(255,255,255,0.6);">'+esc(anos)+' de experiencia</div>':'')
    +'</div>'
    +'</div>'
    +'<div style="padding:32px 36px;">'
    +(zona?'<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;padding:12px 16px;background:#f8f9fc;border-radius:8px;font-size:0.85rem;color:#4a5568;">&#128205; Zona de trabajo: <strong style="color:var(--pdf-navy);">'+esc(zona)+'</strong></div>':'')
    +(valor?'<div style="background:#f8f9fc;border-left:4px solid var(--gold);border-radius:0 8px 8px 0;padding:18px 22px;margin-bottom:24px;"><p style="margin:0;font-size:0.9rem;color:#2d3748;line-height:1.7;font-style:italic;">&ldquo;'+esc(valor)+'&rdquo;</p></div>':'')
    +'<h3 style="font-family:Georgia,serif;color:var(--pdf-navy);font-size:1rem;margin:0 0 14px;">Servicios que ofrezco</h3>'
    +'<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px;">'
    +'<span style="background:#eef1f6;color:var(--pdf-navy);padding:6px 14px;border-radius:999px;font-size:0.8rem;font-weight:600;">Venta de inmuebles</span>'
    +'<span style="background:#eef1f6;color:var(--pdf-navy);padding:6px 14px;border-radius:999px;font-size:0.8rem;font-weight:600;">Alquiler</span>'
    +'<span style="background:#eef1f6;color:var(--pdf-navy);padding:6px 14px;border-radius:999px;font-size:0.8rem;font-weight:600;">Antictretico</span>'
    +'<span style="background:#eef1f6;color:var(--pdf-navy);padding:6px 14px;border-radius:999px;font-size:0.8rem;font-weight:600;">Captacion</span>'
    +'<span style="background:#eef1f6;color:var(--pdf-navy);padding:6px 14px;border-radius:999px;font-size:0.8rem;font-weight:600;">Acompanamiento legal</span>'
    +'</div>'
    +(contacto.length?'<div style="background:linear-gradient(135deg,var(--pdf-navy),var(--pdf-navy-2));border-radius:12px;padding:20px 24px;color:#fff;">'
    +'<div style="font-size:0.78rem;color:rgba(255,255,255,0.6);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em;">Contacto</div>'
    +'<div style="display:flex;flex-direction:column;gap:6px;">'+contacto.map(function(c){ return '<div style="font-size:0.88rem;">'+c+'</div>'; }).join('')+'</div>'
    +'</div>':'')
    +'</div></body></html>';
}

// ── Entry points ──

async function generarPDFComision(){
  var precio = parseFloat($('com-precio').value)||0;
  var pct = parseFloat($('com-pct').value)||0;
  var tc = parseFloat($('com-tc').value)||10.5;
  if(!precio||!pct){ toast('Completa el precio y el porcentaje primero'); return; }
  var comUSD = precio*(pct/100);
  var comBs = comUSD*tc;
  var neto = precio-comUSD;
  toast('Preparando PDF...');
  try{ await _loadLibs(); await renderPDF(buildComisionHTML(precio,pct,comUSD,comBs,neto,tc),'Propuesta_Honorarios.pdf'); }
  catch(e){ toast('Error: '+(e.message||'error')); }
}

async function generarPDFAntictretico(){
  var capital = parseFloat($('anti-capital').value)||0;
  var anos = parseFloat($('anti-años').value)||2;
  var com = parseFloat($('anti-com').value)||3;
  var tc = parseFloat($('anti-tc').value)||10.5;
  var alquiler = parseFloat($('anti-alquiler').value)||0;
  var itPct = parseFloat($('anti-it').value)||3;
  var notariales = parseFloat($('anti-notariales').value)||0;
  if(!capital){ toast('Ingresa el capital del antictretico primero'); return; }
  var capBs = capital*tc;
  var comUSD = capital*(com/100);
  var rendimiento = alquiler>0?((alquiler*12)/capital*100).toFixed(1)+'%':'—';
  var itUSD = capital*(itPct/100);
  var capitalNeto = capital - itUSD - notariales;
  toast('Preparando PDF...');
  try{ await _loadLibs(); await renderPDF(buildAntictreticoHTML(capital,anos,com,tc,alquiler,capBs,comUSD,rendimiento,itPct,itUSD,notariales,capitalNeto),'Resumen_Antictretico.pdf'); }
  catch(e){ toast('Error: '+(e.message||'error')); }
}

async function generarPDFComparador(){
  var props = _leerPropiedadesComparador();
  if(props.length<2){ toast('Compara al menos 2 propiedades primero'); return; }
  toast('Preparando PDF...');
  try{ await _loadLibs(); await renderPDF(buildComparadorHTML(props),'Comparativa_Inmuebles.pdf'); }
  catch(e){ toast('Error: '+(e.message||'error')); }
}

async function generarPDFGuiaLegal(){
  toast('Preparando PDF...');
  try{ await _loadLibs(); await renderPDF(buildGuiaLegalHTML(),'Guia_Legal.pdf'); }
  catch(e){ toast('Error: '+(e.message||'error')); }
}

async function generarPDFAcuerdo(){
  var propietario = ($('ac-propietario')||{}).value||'';
  var ci = ($('ac-ci')||{}).value||'';
  var tel = ($('ac-tel')||{}).value||'';
  var tipo = ($('ac-tipo')||{}).value||'Venta';
  var direccion = ($('ac-direccion')||{}).value||'';
  var precio = ($('ac-precio')||{}).value||'';
  var com = ($('ac-com')||{}).value||'3';
  var duracion = ($('ac-duracion')||{}).value||'3 meses';
  var obs = ($('ac-obs')||{}).value||'';
  if(!propietario||!direccion){ toast('Completa el nombre del propietario y la direccion del inmueble'); return; }
  toast('Preparando PDF...');
  try{ await _loadLibs(); await renderPDF(buildAcuerdoHTML(propietario,ci,tel,tipo,direccion,precio,com,duracion,obs),'Acuerdo_Trabajo.pdf'); }
  catch(e){ toast('Error: '+(e.message||'error')); }
}

async function generarPDFPresentacion(){
  var esp = ($('pres-esp')||{}).value||'Agente inmobiliario';
  var anos = ($('pres-anos')||{}).value||'';
  var zona = ($('pres-zona')||{}).value||'';
  var valor = ($('pres-valor')||{}).value||'';
  toast('Preparando PDF...');
  try{ await _loadLibs(); await renderPDF(buildPresentacionHTML(esp,anos,zona,valor),'Presentacion_Personal.pdf'); }
  catch(e){ toast('Error: '+(e.message||'error')); }
}



// ══════════════════════════════════════════════
// HERRAMIENTA: SHEET EXTERNO (Google Sheets)
// ══════════════════════════════════════════════
