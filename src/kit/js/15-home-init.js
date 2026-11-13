function agregarPendienteHome(){
  var input = $('home-pend-nueva'); if(!input) return;
  var texto = (input.value||'').trim(); if(!texto) return;
  var arr = getPendientes();
  arr.push({id:Date.now(), texto:texto, hecho:false});
  setPendientes(arr);
  initHome();
}

var _demoModalMostrado = false;
function initHome(){
  var hora = new Date().getHours();
  var saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  var greetHtml = saludo + ', ' + esc(AGENTE.nombre || 'Agente');
  if(AGENTE.esDemo) greetHtml += ' <button class="demo-badge" onclick="abrirModalDemo()">⚠️ Cuenta Demo <span style="opacity:0.75;">ⓘ</span></button>';
  $('home-greeting').innerHTML = greetHtml;
  if(AGENTE.esDemo && !_demoModalMostrado){
    _demoModalMostrado = true;
    setTimeout(abrirModalDemo, 500);
  }
  var pcs = $('home-plan-cta-section');
  if(pcs){
    pcs.innerHTML = !AGENTE.esDemo ? '' : (
      '<div class="plan-cta-row" style="margin-bottom:20px;">'
      + '<button class="plan-cta" onclick="abrirPlanModal(\'Esencial\')"><div class="plan-cta-lbl">Ver y pagar</div><div class="plan-cta-name">Plan Esencial <span class="plan-cta-price">· USD 80</span></div></button>'
      + '<button class="plan-cta" onclick="abrirPlanModal(\'Profesional\')"><div class="plan-cta-lbl">Ver y pagar</div><div class="plan-cta-name">Plan Profesional <span class="plan-cta-price">· USD 120</span></div></button>'
      + '</div>'
    );
  }
  var ciudad = AGENTE.ciudad || '';
  var pendientes = JSON.parse(localStorage.getItem('mk_pendientes') || '[]');
  var sinResolver = pendientes.filter(function(p){ return !p.hecho; });
  var metaParts = [];
  if(ciudad) metaParts.push(ciudad);
  if(sinResolver.length > 0) metaParts.push('<span class="home-pending">● ' + sinResolver.length + ' pendiente' + (sinResolver.length > 1 ? 's' : '') + ' para hoy</span>');
  $('home-meta').innerHTML = metaParts.join('<span class="dot">·</span>');
  var foto = localStorage.getItem('mk_foto');
  if(foto) $('home-avatar').innerHTML = '<img src="' + foto + '" alt="foto"/>';
  var ps = $('home-pend-section');
  if(ps){
    var allPend = getPendientes();
    var addRow = '<div class="home-pend-add"><input id="home-pend-nueva" type="text" placeholder="Agregar tarea..." onkeydown="if(event.key===\'Enter\')agregarPendienteHome()"/><button onclick="agregarPendienteHome()">+ Agregar</button></div>';
    if(allPend.length === 0){
      ps.innerHTML = '<div class="home-pend-title">Pendientes de hoy</div>'+addRow+'<div style="font-size:0.82rem;color:var(--text-muted);padding:6px 0;">Sin tareas por ahora.</div>';
    } else {
      var rows = allPend.map(function(p){
        var chk = '<input type="checkbox"'+(p.hecho?' checked':'')+' onchange="togglePendiente('+p.id+');initHome();" style="width:15px;height:15px;accent-color:var(--navy);flex-shrink:0;cursor:pointer;">';
        var txt = '<span style="flex:1;'+(p.hecho?'text-decoration:line-through;color:var(--text-muted);':'')+'">'+esc(p.texto)+'</span>';
        var del = '<button class="home-pend-trash" onclick="eliminarPendiente('+p.id+');initHome();" title="Eliminar">🗑️</button>';
        return '<div class="home-pend-item">'+chk+txt+del+'</div>';
      }).join('');
      ps.innerHTML = '<div class="home-pend-title">Pendientes de hoy</div>'+addRow+rows;
    }
  }
  var ss = $('home-seg-section');
  if(ss){
    var todosSeg = getSeguimientos();
    var alerta = todosSeg.filter(function(s){ return _diasEntre(s.proximoContacto) <= 0; })
      .sort(function(a,b){ return a.proximoContacto.localeCompare(b.proximoContacto); });
    if(alerta.length === 0){
      ss.innerHTML = '';
    } else {
      var filasSeg = alerta.slice(0,4).map(function(s){
        var diff = _diasEntre(s.proximoContacto);
        var txt = diff < 0 ? 'atrasado hace '+Math.abs(diff)+' día'+(Math.abs(diff)>1?'s':'') : 'te toca hoy';
        return '<div class="home-seg-item"><span class="home-seg-dot"></span><span style="flex:1;">'+esc(s.nombre)+(s.propiedad?' — '+esc(s.propiedad):'')+' <span style="color:var(--text-muted);">('+txt+')</span></span></div>';
      }).join('');
      var verMasSeg = alerta.length > 4 ? '<div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;">+'+(alerta.length-4)+' más</div>' : '';
      ss.innerHTML = '<div class="home-seg-title"><svg class="home-seg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><polyline points="12 7.5 12 12 15.5 14"/></svg>'+alerta.length+' seguimiento'+(alerta.length>1?'s':'')+' que requiere'+(alerta.length>1?'n':'')+' atención</div>'
        + filasSeg + verMasSeg
        + '<button class="home-pend-ver" onclick="verSeguimientos()">Ver seguimientos →</button>';
    }
  }
  var frases = [
    'El seguimiento consistente es lo que separa a los agentes top del promedio.',
    'Cada “no” que recibes te acerca más al próximo “sí”.',
    'Tu red de referidos es tu activo más valioso — inviértele tiempo hoy.',
    'Un agente organizado cierra más que un agente ocupado.',
    'La confianza se gana antes de mostrar la primera propiedad.',
    'El mercado boliviano tiene oportunidades para quienes las buscan activamente.',
    'Un seguimiento más puede ser la diferencia entre cerrar o perder la operación.',
    'Los clientes no compran propiedades, compran soluciones para sus vidas.',
    'Conocer el precio correcto desde el inicio te ahorra semanas de trabajo.',
    'La mejor captación es la que viene recomendada por un cliente satisfecho.',
    'Prepárate antes de cada visita — los detalles cierran operaciones.',
    'El agente que escucha más que habla es el que entiende qué vender.',
    'Una buena ficha de propiedad trabaja por ti las 24 horas.',
    'No vendas m², vende el proyecto de vida que hay detrás.',
    'El éxito en inmobiliaria es 20% conocimiento y 80% consistencia.'
  ];
  var doy = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0)) / 86400000);
  $('home-phrase').textContent = '“' + frases[doy % frases.length] + '”';
  // buscador
  var hs = $('home-search');
  if(hs){
    hs.innerHTML = '<div class="home-search-wrap">'
      +'<input type="search" id="home-search-input" class="home-search-input" placeholder="🔍 Buscar herramienta..." oninput="onSearchInput(this.value)">'
      +'<div id="home-search-results" hidden></div>'
      +'</div>';
  }

  // navegacion
  var ql = $('home-ql');
  if(ql){
    var tipoCards = TIPOS.map(function(t,i){
      return '<button class="home-ql-card" onclick="showTipo('+i+')">'
        +'<span class="home-ql-icon">'+t.icon+'</span>'
        +'<span class="home-ql-count">'+t.tools.length+'</span>'
        +'<span class="home-ql-name">'+t.nombre+'</span>'
        +'</button>';
    }).join('');
    var etapaCards = FASES.filter(function(f){ return f.id!=='transversal'; }).map(function(f){
      var fi = FASES.indexOf(f);
      return '<button class="home-ql-card" onclick="showPhase('+fi+')">'
        +'<span class="home-ql-count" style="font-size:1rem;">'+f.num+'</span>'
        +'<span class="home-ql-name" style="font-weight:600;color:var(--text);">'+f.nombre+'</span>'
        +'<span class="home-ql-name">'+f.tools.length+' herr.</span>'
        +'</button>';
    }).join('');
    ql.innerHTML =
      '<p class="home-ql-title">¿Cómo quieres ver las herramientas?</p>'
      +'<div class="home-acc">'
      +'<button class="home-acc-hdr" onclick="homeAccToggle(\'acc-tipo\')">'
      +'<span>🔧 Por tipo de herramienta</span>'
      +'<span id="acc-tipo-arr" class="home-acc-arr">▼</span>'
      +'</button>'
      +'<div id="acc-tipo" class="home-acc-body-wrap"><div class="home-acc-body"><div class="home-acc-body-inner">'
      +'<div class="home-ql-grid">'+tipoCards+'</div>'
      +'</div></div></div></div>'
      +'<div class="home-acc" style="margin-top:10px;">'
      +'<button class="home-acc-hdr" onclick="homeAccToggle(\'acc-etapa\')">'
      +'<span>🗂️ Por etapa de venta</span>'
      +'<span id="acc-etapa-arr" class="home-acc-arr">▼</span>'
      +'</button>'
      +'<div id="acc-etapa" class="home-acc-body-wrap"><div class="home-acc-body"><div class="home-acc-body-inner">'
      +'<div class="home-ql-grid">'+etapaCards+'</div>'
      +'</div></div></div></div>'
      +'<button class="home-acc-hdr" style="margin-top:10px;" onclick="showBiblioteca()">'
      +'<span>📚 Biblioteca — 33 libros en PDF</span>'
      +'</button>';
  }

  // regalos por pronto pago — no pertenecen a ninguna FASE/TIPO
  var rg = $('home-regalos-section');
  if(rg){
    var nReg = AGENTE.regalosProntoPago || 0;
    if(nReg <= 0){
      rg.innerHTML = '';
    } else {
      var regCards = '';
      if(nReg >= 1) regCards += '<button class="home-ql-card" onclick="showRegalo(1)"><span class="home-ql-icon">🛡️</span><span class="home-ql-name" style="font-weight:600;color:var(--text);">Defiende tu comisión</span></button>';
      if(nReg >= 2) regCards += '<button class="home-ql-card" onclick="showRegalo(2)"><span class="home-ql-icon">📈</span><span class="home-ql-name" style="font-weight:600;color:var(--text);">¿Cuánto voy a ganar este mes?</span></button>';
      rg.innerHTML = '<p class="home-ql-title">🎁 Tus regalos por pronto pago</p><div class="home-ql-grid">'+regCards+'</div>';
    }
  }
}

function verSeguimientos(){
  var idx = FASES.findIndex(function(f){ return f.id==='seguimiento'; });
  showPhase(idx);
}

initHome();




var _dp=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();_dp=e;});window.addEventListener('appinstalled',function(){_dp=null;});function instalarApp(){if(_dp){_dp.prompt();_dp.userChoice.then(function(){_dp=null;});}else{var t=document.createElement('div');t.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0a1628;color:#fff;padding:16px 20px;border-radius:10px;font-size:13px;z-index:9999;text-align:center;max-width:300px;border:1px solid var(--gold);line-height:1.6;';t.innerHTML='<b>iPhone / Safari:</b><br>Toca el icono compartir y luego<br><i>Agregar a pantalla de inicio</i><br><br><b>Android (otro navegador):</b><br>Menu 3 puntos > Instalar app';document.body.appendChild(t);setTimeout(function(){t.remove();},6000);}}



if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js');}

