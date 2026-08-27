

// ══════════════════════════════════════════════
// BACKEND — Cloudflare Worker + D1 (antes Supabase, migrado ago-2026)
// ══════════════════════════════════════════════
const API_URL = '';

  // Chequeo de acceso — mk_auth vive en sessionStorage (no localStorage): se
  // borra al cerrar la pestana/navegador, para que el link SIEMPRE pida
  // contrasena de nuevo en una visita nueva, en vez de quedar adentro para
  // siempre como pasaba antes.
  if(sessionStorage.getItem("mk_auth")!=="1"){
    window.location.href = "/login";
  } else {
    // Revalida contra Supabase en cada carga: si cambio la contrasena o se
    // desactivo la cuenta desde que este dispositivo inicio sesion, saca al
    // toque. Sin esto, localStorage guardaba la sesion para siempre y cambiar
    // la contrasena de alguien (ej. la cuenta demo) no le sacaba el acceso.
    (function(){
      var _id = localStorage.getItem('mk_id');
      var _pwd = localStorage.getItem('mk_pwd');
      var _valido = true;
      try{
        var _xhr = new XMLHttpRequest();
        _xhr.open('POST', API_URL+'/api/session-valida', false);
        _xhr.setRequestHeader('Content-Type','application/json');
        _xhr.send(JSON.stringify({p_id:_id, p_password:_pwd}));
        if(_xhr.status===200){ _valido = JSON.parse(_xhr.responseText)===true; }
      }catch(e){ /* sin conexion: no expulsar por un problema de red */ }
      if(!_valido){
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
        throw new Error('sesion invalida');
      }
    })();
    // Ademas del chequeo al cargar, revisa cada 60s mientras el kit sigue
    // abierto: si alguien cambia esta contrasena mientras otro ya esta
    // adentro (ej. rotar la contrasena de la cuenta demo), lo saca sin que
    // tenga que recargar el navegador el mismo.
    setInterval(function(){
      var _id2 = localStorage.getItem('mk_id');
      var _pwd2 = localStorage.getItem('mk_pwd');
      if(!_id2) return;
      fetch(API_URL+'/api/session-valida', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({p_id:_id2, p_password:_pwd2})
      }).then(function(r){ return r.json(); }).then(function(ok){
        if(ok!==true){
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/login';
        }
      }).catch(function(){ /* sin conexion: no expulsar por un corte de red */ });
    }, 60000);
  }
// ══════════════════════════════════════════════
// CUENTA DEMO — no persiste guardados a Supabase
// ══════════════════════════════════════════════
const DEMO_CLIENTE_ID = '033a71aa-b53c-450f-b0e7-332c7ec25b01';

// ══════════════════════════════════════════════
// TEMAS — paletas de color a elección del agente
// ══════════════════════════════════════════════
// Cada tema define PRIMARY (color de marca — texto/headings sobre el fondo
// oscuro del kit, y fondo de botones con texto blanco) y ACCENT (highlight —
// bordes/detalles sobre fondo oscuro, y fondo de chips/botones con texto
// oscuro encima). primaryDark/primaryDark2 son variantes bien oscuras del
// primary, usadas solo en los PDF (fondo blanco: header con degradado y
// texto de encabezados). accentTextMuted/accentPastelBg son variantes del
// accent pensadas para texto secundario y cajas de aviso muy claras sin
// perder contraste en ningún caso.
const TEMAS = {
  dorado:   { nombre:'Dorado',            primary:'#4A90D9', primaryDark:'#1B335E', primaryDark2:'#243f72', accent:'#EFAE3C', accentLight:'#f5c842', textOnAccent:'#1a1306', accentTextMuted:'#7A5200', accentPastelBg:'#fff8e1' },
  azul:     { nombre:'Azul profesional',  primary:'#3E7BC4', primaryDark:'#123156', primaryDark2:'#1B4A82', accent:'#5FD0E8', accentLight:'#8FE2F2', textOnAccent:'#04303a', accentTextMuted:'#0E6478', accentPastelBg:'#e8fafd' },
  esmeralda:{ nombre:'Verde esmeralda',   primary:'#35B37E', primaryDark:'#0C4A31', primaryDark2:'#116B47', accent:'#7FE0A8', accentLight:'#A9EEC4', textOnAccent:'#08301f', accentTextMuted:'#1F7A4C', accentPastelBg:'#e9faf0' },
  vino:     { nombre:'Bordo elegante',    primary:'#C4547A', primaryDark:'#5C1830', primaryDark2:'#7C2440', accent:'#E8A0B8', accentLight:'#F2C2D2', textOnAccent:'#4a0f22', accentTextMuted:'#9C3457', accentPastelBg:'#fceef3' },
  grafito:  { nombre:'Plata / Grafito',   primary:'#8B95A8', primaryDark:'#262B36', primaryDark2:'#3A4356', accent:'#A9B4C4', accentLight:'#C6CEDA', textOnAccent:'#20242c', accentTextMuted:'#525C6E', accentPastelBg:'#f0f2f5' },
  cobre:    { nombre:'Terracota / Cobre', primary:'#D97B4F', primaryDark:'#5C260F', primaryDark2:'#7A3418', accent:'#F2B88A', accentLight:'#F7D2AE', textOnAccent:'#4a2410', accentTextMuted:'#9C4A22', accentPastelBg:'#fdf1e7' },
  ejecutivo:{ nombre:'Negro ejecutivo',   primary:'#8A8580', primaryDark:'#0F0F11', primaryDark2:'#17171A', accent:'#D4AF6A', accentLight:'#E4CB94', textOnAccent:'#241a05', accentTextMuted:'#8A6A2E', accentPastelBg:'#f7f1e3' }
};

function _hexToRgbStr(hex){
  var h = hex.replace('#','');
  var r = parseInt(h.substring(0,2),16), g = parseInt(h.substring(2,4),16), b = parseInt(h.substring(4,6),16);
  return r+','+g+','+b;
}
function _mixHex(hex, targetHex, amt){
  var a = _hexToRgbStr(hex).split(',').map(Number);
  var b = _hexToRgbStr(targetHex).split(',').map(Number);
  var r = Math.round(a[0]+(b[0]-a[0])*amt);
  var g = Math.round(a[1]+(b[1]-a[1])*amt);
  var bl = Math.round(a[2]+(b[2]-a[2])*amt);
  return 'rgb('+r+','+g+','+bl+')';
}
function aplicarTema(id){
  var t = TEMAS[id] || TEMAS.dorado;
  var root = document.documentElement.style;
  root.setProperty('--navy', t.primary);
  root.setProperty('--navy-dark', _mixHex(t.primary, '#000000', 0.35));
  root.setProperty('--navy-soft', 'rgba('+_hexToRgbStr(t.primary)+',0.12)');
  root.setProperty('--gold', t.accent);
  root.setProperty('--gold-soft', 'rgba('+_hexToRgbStr(t.accent)+',0.15)');
  root.setProperty('--gold-rgb', _hexToRgbStr(t.accent));
  root.setProperty('--gold-light', t.accentLight);
  root.setProperty('--text-on-gold', t.textOnAccent);
  root.setProperty('--accent-text-muted', t.accentTextMuted);
  root.setProperty('--gold-pastel-bg', t.accentPastelBg);
  root.setProperty('--pdf-navy', t.primaryDark);
  root.setProperty('--pdf-navy-2', t.primaryDark2);
  root.setProperty('--pdf-navy-soft', 'rgba('+_hexToRgbStr(t.primaryDark)+',0.1)');
}

// ══════════════════════════════════════════════
// DATOS DEL AGENTE (viene del perfil en Supabase)
// ══════════════════════════════════════════════
const AGENTE = {
  id: localStorage.getItem('mk_id') || '',
  nombre: localStorage.getItem('mk_nombre') || 'Agente',
  ciudad: localStorage.getItem('mk_ciudad') || 'Bolivia',
  whatsapp: localStorage.getItem('mk_whatsapp') || '',
  email: localStorage.getItem('mk_email') || '',
  plan: localStorage.getItem('mk_plan') || 'basico',
  tema: localStorage.getItem('mk_tema') || 'dorado',
  regalosProntoPago: parseInt(localStorage.getItem('mk_regalos') || '0', 10),
  esDemo: localStorage.getItem('mk_id') === DEMO_CLIENTE_ID
};
document.getElementById('agent-badge').textContent = AGENTE.nombre;
aplicarTema(AGENTE.tema);
const LIMITE_SEGUIMIENTOS = AGENTE.plan === 'completo' ? 50 : 20;

// ══════════════════════════════════════════════
// TIERS — herramientas exclusivas del plan Profesional
// ══════════════════════════════════════════════
const HERRAMIENTAS_TIER2 = [
  'propuesta-propietario','acuerdo-trabajo',
  'cartera-propiedades-excel',
  'diagnostico-comprador',
  'control-seguimientos-excel',
  'manejador-objeciones','comparador-inmuebles',
  'calc-antictretico',
  'registro-comisiones-excel','presentacion-personal-word'
];
const SOPORTE_WHATSAPP = '59169638816';

// ══════════════════════════════════════════════
// FASES Y HERRAMIENTAS
// ══════════════════════════════════════════════
const FASES = [
  { id:'captacion', num:1, nombre:'Captación', desc:'Reunión con el propietario, precio de salida, acuerdo de trabajo', tools:['guia-captacion','propuesta-propietario','calc-comision','acuerdo-trabajo'] },
  { id:'publicacion', num:2, nombre:'Publicación y marketing', desc:'Ficha de propiedad, canales, portales', tools:['ficha-propiedad','cartera-propiedades-excel'] },
  { id:'interesados', num:3, nombre:'Atención de interesados', desc:'Primera respuesta, filtrar interesados, separar curiosos de compradores con intención real', tools:['respuesta-rapida','filtro-comprador'] },
  { id:'visita', num:4, nombre:'La visita', desc:'Checklist antes de mostrar, leer señales de cierre', tools:['checklist-visita','diagnostico-comprador'] },
  { id:'seguimiento', num:5, nombre:'Seguimiento post-visita', desc:'La mayoría de ventas se cierra después de 5 contactos o más. Aquí están las herramientas para no perder el hilo', tools:['generador-seguimiento','tablero-seguimientos','control-seguimientos-excel'] },
  { id:'negociacion', num:6, nombre:'Negociación y cierre', desc:'Objeciones, doble tipo de cambio, comparar inmuebles', tools:['manejador-objeciones','calc-tipo-cambio','comparador-inmuebles'] },
  { id:'legal', num:7, nombre:'Proceso legal', desc:'Folio real, minuta, anticrético, documentos', tools:['guia-legal','checklist-antictretico','calc-antictretico'] },
  { id:'postventa', num:8, nombre:'Post-venta y referidos', desc:'La etapa que la mayoría ignora. Un cliente satisfecho puede traerte 3 más', tools:['mensaje-postventa'] },
  { id:'transversal', num:0, nombre:'Recursos transversales', desc:'Comisiones, presentación, scripts de captación', tools:['registro-comisiones-excel','presentacion-personal-word','banco-scripts','mis-plantillas','tablero-pendientes'] },
];

// Iconos de linea propios (24x24, trazo 1.6, currentColor) — reemplazan los emoji
// de TIPOS. Usan el color del tema del kit (--navy), no un color propio por categoria.
const SVG_ICON_CALC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><rect x="7" y="5" width="10" height="4" rx="1"/><circle cx="7.5" cy="13" r="0.9" fill="currentColor" stroke="none"/><circle cx="12" cy="13" r="0.9" fill="currentColor" stroke="none"/><circle cx="16.5" cy="13" r="0.9" fill="currentColor" stroke="none"/><circle cx="7.5" cy="17" r="0.9" fill="currentColor" stroke="none"/><circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none"/><circle cx="16.5" cy="17" r="0.9" fill="currentColor" stroke="none"/></svg>';
const SVG_ICON_GEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const SVG_ICON_GUIA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5Z"/></svg>';
const SVG_ICON_FORM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v4h4"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="16.5" x2="13" y2="16.5"/></svg>';
const SVG_ICON_EXCEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="17" height="16" rx="1.5"/><line x1="3.5" y1="9.5" x2="20.5" y2="9.5"/><line x1="3.5" y1="14.5" x2="20.5" y2="14.5"/><line x1="10" y1="4" x2="10" y2="20"/></svg>';
const SVG_ICON_ORG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="5" height="16" rx="1.3"/><rect x="9.7" y="4" width="5" height="10" rx="1.3"/><rect x="15.9" y="4" width="5" height="13" rx="1.3"/></svg>';

const TIPOS = [
  { id:'comisiones', icon:SVG_ICON_CALC, nombre:'Calculadoras', tools:['calc-comision','calc-tipo-cambio','calc-antictretico'] },
  { id:'mensajes', icon:SVG_ICON_GEN, nombre:'Mensajes listos para enviar', tools:['respuesta-rapida','generador-seguimiento','mensaje-postventa','manejador-objeciones','banco-scripts'] },
  { id:'documentos', icon:SVG_ICON_FORM, nombre:'Documentos listos para compartir', tools:['ficha-propiedad','comparador-inmuebles','propuesta-propietario','acuerdo-trabajo','presentacion-personal-word'] },
  { id:'guias', icon:SVG_ICON_GUIA, nombre:'Guías y evaluaciones rápidas', tools:['checklist-visita','checklist-antictretico','guia-captacion','guia-legal','filtro-comprador','diagnostico-comprador'] },
  { id:'excel', icon:SVG_ICON_EXCEL, nombre:'Planillas de Excel', tools:['cartera-propiedades-excel','control-seguimientos-excel','registro-comisiones-excel'] },
  { id:'organizadores', icon:SVG_ICON_ORG, nombre:'Agendas y recordatorios', tools:['mis-plantillas','tablero-pendientes','tablero-seguimientos'] },
];

// ══════════════════════════════════════════════
// BADGES POR HERRAMIENTA — tipo + etapa (reemplaza los badges Hace/Guía/Ordena/Google Sheets)
// ══════════════════════════════════════════════
function _tipoDeHerramienta(id){
  return TIPOS.find(function(t){ return t.tools.indexOf(id) !== -1; });
}
function _faseDeHerramienta(id){
  return FASES.find(function(f){ return f.tools.indexOf(id) !== -1; });
}
function badgesHerramienta(id){
  var tipo = _tipoDeHerramienta(id);
  var fase = _faseDeHerramienta(id);
  if(!tipo && !fase) return '';
  var html = '<div class="tool-badges">';
  if(tipo) html += '<span class="tool-badge badge-tipo">'+tipo.nombre+'</span>';
  if(fase) html += '<span class="tool-badge badge-etapa">'+(fase.num?'Etapa '+fase.num+' &middot; ':'')+fase.nombre+'</span>';
  html += '</div>';
  return html;
}

// ══════════════════════════════════════════════
// UTILIDADES
// ══════════════════════════════════════════════
