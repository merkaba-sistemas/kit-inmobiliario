// ══════════════════════════════════════════════
// VER PLAN + PAGAR CON QR
// Un solo modal compartido (2 vistas: que incluye <-> pagar), usado desde:
// candado de herramienta bloqueada (03), perfil bloqueado en demo (10),
// home de la cuenta demo (15) y el modal "que es la demo" (body.html).
// ══════════════════════════════════════════════
var PLANES_KIT = {
  'Esencial': {
    precio: 'USD 80',
    lista: [
      'Calculadora de comisión','Calculadora tipo de cambio','Respuesta rápida al lead',
      'Generador de seguimiento','Mensaje post-venta','Checklist de visita','Checklist anticrético',
      'Guía de captación','Guía del proceso legal','Scripts de captación','Ficha de propiedad',
      'Filtro de comprador (antes de la visita)','Mis plantillas','Tablero de pendientes','Seguimientos activos'
    ]
  },
  'Profesional': {
    precio: 'USD 120',
    lista: [
      '__LEAD__Todo lo del plan Esencial, más:',
      'Propuesta al propietario','Acuerdo de trabajo','Manejador de objeciones','Comparador de inmuebles',
      'Diagnóstico del comprador (durante la visita)','Presentación personal','Calculadora de anticrético',
      'Planilla de cartera de propiedades','Planilla de control de seguimientos','Planilla de registro de comisiones'
    ]
  }
};
var QR_SRC_KIT = {
  'Esencial': '/icons/qr-esencial.jpg',
  'Profesional': '/icons/qr-profesional.jpg'
};
var QR_WA_MSG_KIT = {
  'Esencial': 'Hola! Ya pagué el Plan Esencial (USD 80) del kit del agente inmobiliario. Te mando el comprobante.',
  'Profesional': 'Hola! Ya pagué el Plan Profesional (USD 120) del kit del agente inmobiliario. Te mando el comprobante.'
};
var _planActualPago = 'Esencial';

// ══════════════════════════════════════════════
// Historial compartido para TODOS los modales del kit (perfil, "que es la
// demo", plan+pago) - un solo nivel: mientras cualquiera este abierto, la
// flecha atras del celular los cierra en vez de sacar del kit. Coexiste con
// el popstate de 03-navegacion.js (cada uno chequea su propio estado).
// ══════════════════════════════════════════════
var _mkHistoryPushed = false;
function _mkPushHistoryIfNeeded(){
  if(!_mkHistoryPushed){
    history.pushState({mkModal:true}, '', location.href);
    _mkHistoryPushed = true;
  }
}
function _mkPopHistoryIfNeeded(){
  if(_mkHistoryPushed){
    _mkHistoryPushed = false;
    history.back();
  }
}
window.addEventListener('popstate', function(){
  _mkHistoryPushed = false;
  $('perfil-modal').classList.remove('open');
  $('demo-info-modal').classList.remove('open');
  $('plan-modal').classList.remove('open');
  $('zoom-modal').classList.remove('open');
});

function abrirPlanModal(plan){
  _planActualPago = plan;
  var p = PLANES_KIT[plan];
  $('mp-name').textContent = 'Plan ' + plan;
  $('mp-price').innerHTML = p.precio + '<span>mensual</span>';
  $('mp-list').innerHTML = p.lista.map(function(item){
    if(item.indexOf('__LEAD__') === 0) return '<li class="lead">' + esc(item.replace('__LEAD__','')) + '</li>';
    return '<li>' + esc(item) + '</li>';
  }).join('');
  $('view-features').hidden = false;
  $('view-pay').hidden = true;
  $('plan-modal').classList.add('open');
  _mkPushHistoryIfNeeded();
}

function cerrarPlanModal(){
  $('plan-modal').classList.remove('open');
  $('zoom-modal').classList.remove('open');
  _mkPopHistoryIfNeeded();
}

function irAPagarPlan(){
  var plan = _planActualPago;
  $('pay-titulo').textContent = 'Pagá el Plan ' + plan;
  $('qr-monto').textContent = PLANES_KIT[plan].precio;
  $('qr-img').src = QR_SRC_KIT[plan];
  $('qr-img-zoom').src = QR_SRC_KIT[plan];
  var link = $('qr-descarga-link');
  link.href = QR_SRC_KIT[plan];
  link.setAttribute('download', 'qr-plan-' + plan.toLowerCase() + '.jpg');
  $('qr-whatsapp-link').href = 'https://wa.me/'+SOPORTE_WHATSAPP+'?text='+encodeURIComponent(QR_WA_MSG_KIT[plan]);
  $('view-features').hidden = true;
  $('view-pay').hidden = false;
}

function volverAFeaturesPlan(){
  $('view-features').hidden = false;
  $('view-pay').hidden = true;
}

function abrirZoomQR(){ $('zoom-modal').classList.add('open'); }
function cerrarZoomQR(){ $('zoom-modal').classList.remove('open'); }

// Reemplaza el mensaje bloqueado de "Mi perfil" en la cuenta demo (guardar/foto)
// por las 2 opciones de plan, en vez de un solo link generico a WhatsApp.
// Nota: cierra perfil-modal directo (sin pasar por cerrarPerfil(), que ademas
// hace history.back()) para no encimar un history.back() con el pushState que
// abrirPlanModal() hace a continuacion en el mismo click.
function mostrarBloqueoPerfil(texto){
  var msg = $('perfil-msg');
  msg.style.color = '';
  msg.innerHTML = '<p style="margin:0 0 10px;color:var(--text-muted);font-size:0.82rem;">' + esc(texto) + '</p>'
    + '<div class="plan-cta-row">'
    +   '<button class="plan-cta" type="button" onclick="_cerrarPerfilUI();abrirPlanModal(\'Esencial\')"><div class="plan-cta-lbl">Ver y pagar</div><div class="plan-cta-name">Esencial <span class="plan-cta-price">· USD 80</span></div></button>'
    +   '<button class="plan-cta" type="button" onclick="_cerrarPerfilUI();abrirPlanModal(\'Profesional\')"><div class="plan-cta-lbl">Ver y pagar</div><div class="plan-cta-name">Profesional <span class="plan-cta-price">· USD 120</span></div></button>'
    + '</div>';
}
