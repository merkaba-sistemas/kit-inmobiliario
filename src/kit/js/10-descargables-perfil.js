
// ══════════════════════════════════════════════
// PERFIL DEL AGENTE
// (API_URL vive en 01-config.js)

var _temaSeleccionado = null;
var _temaOriginal = null;

function abrirPerfil(){
  $('perfil-nombre').value = AGENTE.nombre;
  $('perfil-ciudad').value = AGENTE.ciudad;
  $('perfil-whatsapp').value = AGENTE.whatsapp;
  $('perfil-email').value = AGENTE.email;
  const foto = localStorage.getItem('mk_foto');
  const ring = $('photo-ring-preview');
  if(foto){ ring.innerHTML = '<img src="'+foto+'" alt="foto"/>'; } else { ring.innerHTML = '&#128100;'; }
  $('perfil-msg').textContent = '';
  _temaSeleccionado = AGENTE.tema;
  _temaOriginal = AGENTE.tema;
  buildTemaPicker();
  $('perfil-modal').classList.add('open');
  _mkPushHistoryIfNeeded();
}

function buildTemaPicker(){
  var cont = $('perfil-tema-picker');
  if(!cont) return;
  cont.innerHTML = '';
  Object.keys(TEMAS).forEach(function(id){
    var t = TEMAS[id];
    var sw = document.createElement('button');
    sw.type = 'button';
    sw.title = t.nombre;
    var activo = id === _temaSeleccionado;
    sw.style.cssText = 'width:34px;height:34px;border-radius:50%;cursor:pointer;padding:0;flex-shrink:0;'
      + 'background:linear-gradient(135deg,'+t.primary+' 50%,'+t.accent+' 50%);'
      + 'border:2px solid '+(activo ? t.accent : 'var(--border)')+';'
      + 'box-shadow:'+(activo ? '0 0 0 2px '+t.accent+'33' : 'none')+';';
    sw.onclick = function(){ _temaSeleccionado = id; buildTemaPicker(); aplicarTema(id); };
    cont.appendChild(sw);
  });
}

// Solo la parte visual (sin tocar el historial) - la usa mostrarBloqueoPerfil()
// para pasar directo al modal de plan sin encimar un history.back() con el
// pushState que hace abrirPlanModal() en el mismo click.
function _cerrarPerfilUI(){
  // Si cancela sin guardar, restaura el tema que estaba activo antes de abrir el modal.
  if(_temaOriginal){ aplicarTema(_temaOriginal); }
  $('perfil-modal').classList.remove('open');
}

function cerrarPerfil(){
  _cerrarPerfilUI();
  _mkPopHistoryIfNeeded();
}

function abrirModalDemo(){
  $('demo-info-modal').classList.add('open');
  _mkPushHistoryIfNeeded();
}
function cerrarModalDemo(){
  $('demo-info-modal').classList.remove('open');
  _mkPopHistoryIfNeeded();
}

// Comprime la foto a 320x320 y la recorta en circulo directamente sobre
// los pixeles. Antes se guardaba la foto tal cual la subia el celular
// (varios MB en base64), y localStorage tiene un limite de ~5-6MB por
// dominio: el setItem fallaba en silencio (sin try/catch) y la foto
// nunca llegaba a guardarse ni en el navegador ni en Supabase.
function _normalizeAvatarPhoto(dataUrl, callback){
  var img = new Image();
  img.onload = function(){
    var size = 320;
    var side = Math.min(img.width, img.height);
    var sx = (img.width - side) / 2;
    var sy = (img.height - side) / 2;
    var cv = document.createElement('canvas');
    cv.width = size; cv.height = size;
    var ctx = cv.getContext('2d');
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    callback(cv.toDataURL('image/png'));
  };
  img.src = dataUrl;
}

function cargarFoto(input){
  const file = input.files[0];
  if(!file) return;
  if(AGENTE.esDemo){
    mostrarBloqueoPerfil('Para guardar una foto de perfil necesitas un plan pago. Elige uno para ver qué incluye y pagar:');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e){
    _normalizeAvatarPhoto(e.target.result, async function(fotoCircular){
      try{
        localStorage.setItem('mk_foto', fotoCircular);
      } catch(err){
        toast('La foto es muy pesada, prueba con otra.');
        return;
      }
      $('photo-ring-preview').innerHTML = '<img src="'+fotoCircular+'" alt="foto"/>';
      const id = localStorage.getItem('mk_id'); if(!id) return;
      try{ await fetch(API_URL+'/api/client-update-profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({p_id:id,p_nombre:localStorage.getItem('mk_nombre')||''  ,p_ciudad:localStorage.getItem('mk_ciudad')||''  ,p_whatsapp:localStorage.getItem('mk_whatsapp')||''  ,p_email:localStorage.getItem('mk_email')||''  ,p_foto:fotoCircular})}); }catch(e){}
    });
  };
  reader.readAsDataURL(file);
}

async function guardarPerfil(){
  const msg = $('perfil-msg');
  if(AGENTE.esDemo){
    mostrarBloqueoPerfil('Para guardar cambios de perfil necesitas un plan pago. Elige uno para ver qué incluye y pagar:');
    return;
  }
  const nombre = $('perfil-nombre').value.trim();
  const ciudad = $('perfil-ciudad').value.trim();
  const whatsapp = $('perfil-whatsapp').value.trim();
  const email = $('perfil-email').value.trim();
  if(!nombre){ msg.style.color='#c0392b'; msg.textContent='El nombre no puede estar vacio.'; return; }
  const id = localStorage.getItem('mk_id');
  const tema = _temaSeleccionado || AGENTE.tema;
  if(!AGENTE.esDemo){
    try {
      await fetch(API_URL+'/api/client-update-profile', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({p_id:id, p_nombre:nombre, p_ciudad:ciudad, p_whatsapp:whatsapp, p_email:email, p_foto:localStorage.getItem('mk_foto')||null, p_tema:tema})
      });
    } catch(e){ console.warn('Backend update skipped'); }
  }
  localStorage.setItem('mk_nombre', nombre);
  localStorage.setItem('mk_ciudad', ciudad);
  localStorage.setItem('mk_whatsapp', whatsapp);
  localStorage.setItem('mk_email', email);
  localStorage.setItem('mk_tema', tema);
  AGENTE.nombre = nombre;
  AGENTE.ciudad = ciudad;
  AGENTE.whatsapp = whatsapp;
  AGENTE.email = email;
  AGENTE.tema = tema;
  _temaOriginal = tema;
  aplicarTema(tema);
  $('agent-badge').textContent = nombre;
  msg.style.color = '#2F9E6E';
  msg.textContent = 'Perfil actualizado.';
  setTimeout(cerrarPerfil, 1200);
}

function logoutKit(){
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = '/login';
}

function toggleMobileMenu(){
  $('mobile-overlay').classList.toggle('open');
  $('mobile-sidebar').classList.toggle('open');
}

function buildMobileSidebar(){
  var container = $('mobile-sidebar-phases');
  if(!container) return;
  container.innerHTML = '';
  var tabsEl = document.createElement('div');
  tabsEl.style.cssText = 'display:flex;border-bottom:1px solid var(--border);';
  tabsEl.innerHTML = '<button id="mob-tab-etapas" style="flex:1;padding:10px 4px;background:none;border:none;border-bottom:2px solid var(--navy);cursor:pointer;font-size:0.75rem;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:0.04em;" onclick="buildMobileContent(\'etapas\',this)">Por etapa</button>'
    + '<button id="mob-tab-tipos" style="flex:1;padding:10px 4px;background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;" onclick="buildMobileContent(\'tipos\',this)">Por tipo</button>';
  container.appendChild(tabsEl);
  var listEl = document.createElement('div');
  listEl.id = 'mob-list';
  container.appendChild(listEl);
  buildMobileContent('etapas', $('mob-tab-etapas'));
}

function buildMobileContent(tab, btnEl){
  var listEl = $('mob-list'); if(!listEl) return;
  listEl.innerHTML = '';
  [$('mob-tab-etapas'),$('mob-tab-tipos')].forEach(function(b){
    if(b){ b.style.borderBottomColor='transparent'; b.style.color='var(--text-muted)'; }
  });
  if(btnEl){ btnEl.style.borderBottomColor='var(--navy)'; btnEl.style.color='var(--navy)'; }
  var items = tab==='etapas' ? FASES : TIPOS;
  items.forEach(function(item,i){
    var btn = document.createElement('button');
    btn.style.cssText = 'width:100%;text-align:left;padding:10px 20px;background:none;border:none;cursor:pointer;font-family:Inter,sans-serif;font-size:0.85rem;font-weight:600;color:var(--navy);border-bottom:1px solid var(--border);';
    // item.icon de TIPOS es markup SVG: para 'tipos' hay que insertarlo como HTML
    // (con textContent se veria el codigo <svg> literal). Para 'etapas' es texto plano.
    if(tab==='etapas'){
      btn.textContent = (item.num?'Etapa '+item.num+' — ':'') + item.nombre;
    } else {
      btn.innerHTML = '<span class="tipo-ico" style="margin-right:8px;">'+item.icon+'</span>'+esc(item.nombre);
    }
    btn.onclick = function(){ setSidebarTab(tab); if(tab==='etapas') showPhase(i); else showTipo(i); toggleMobileMenu(); };
    listEl.appendChild(btn);
  });
  // Biblioteca no pertenece a ninguna FASE ni TIPO — fila aparte, separada con
  // un divisor, al final de las dos pestanas (Por etapa y Por tipo).
  var bibBtn = document.createElement('button');
  bibBtn.style.cssText = 'width:100%;text-align:left;padding:10px 20px;background:none;border:none;border-top:1px solid var(--border);cursor:pointer;font-family:Inter,sans-serif;font-size:0.85rem;font-weight:600;color:var(--gold);';
  bibBtn.innerHTML = '📚 Biblioteca';
  bibBtn.onclick = function(){ showBiblioteca(); toggleMobileMenu(); };
  listEl.appendChild(bibBtn);
}



// ══════════════════════════════════════════════
// FOTOS DE PROPIEDAD
// ══════════════════════════════════════════════
var _fotosPropiedad = [];

function _normalizePhoto(dataUrl, callback){
  var img = new Image();
  img.onload = function(){
    var tw = 480, th = 320;
    var scale = Math.min(tw / img.width, th / img.height);
    var dw = Math.round(img.width * scale);
    var dh = Math.round(img.height * scale);
    var dx = Math.round((tw - dw) / 2);
    var dy = Math.round((th - dh) / 2);
    var cv = document.createElement('canvas');
    cv.width = tw; cv.height = th;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tw, th);
    ctx.drawImage(img, dx, dy, dw, dh);
    callback(cv.toDataURL('image/jpeg', 0.88));
  };
  img.src = dataUrl;
}

function cargarFotosPropiedad(input){
  var files = Array.from(input.files).slice(0, 6);
  _fotosPropiedad = new Array(files.length);
  var preview = $('ficha-fotos-preview');
  if(preview) preview.innerHTML = '';
  files.forEach(function(file, i){
    var reader = new FileReader();
    reader.onload = function(e){
      _normalizePhoto(e.target.result, function(croppedUrl){
        _fotosPropiedad[i] = croppedUrl;
        if(preview){
          var img = document.createElement('img');
          img.src = croppedUrl;
          img.style.cssText = 'width:72px;height:54px;object-fit:fill;border-radius:6px;border:2px solid var(--gold);';
          preview.appendChild(img);
        }
      });
    };
    reader.readAsDataURL(file);
  });
}

// ═══════════════════════
