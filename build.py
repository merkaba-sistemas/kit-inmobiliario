"""
build.py - Construye worker.js desde los archivos fuente.
El kit se ensambla desde los partials en src/kit/ (head, styles, body,
modulos JS en orden alfabetico, tail).
Uso: python build.py
"""
import base64, glob, os

ROOT = os.path.dirname(os.path.abspath(__file__))

def read_text(path):
    with open(os.path.join(ROOT, path), 'r', encoding='utf-8') as f:
        return f.read()

def encode_bin(path):
    with open(os.path.join(ROOT, path), 'rb') as f:
        return base64.b64encode(f.read()).decode('ascii')

def b64(text):
    return base64.b64encode(text.encode('utf-8')).decode('ascii')

def assemble_kit():
    js_files = sorted(glob.glob(os.path.join(ROOT, 'src', 'kit', 'js', '*.js')))
    parts = [read_text('src/kit/head.html'), '<style>\n', read_text('src/kit/styles.css'),
             '</style>\n', read_text('src/kit/body.html'), '<script>\n']
    for path in js_files:
        with open(path, 'r', encoding='utf-8') as f:
            parts.append(f.read())
    parts += ['</script>\n', read_text('src/kit/tail.html')]
    return ''.join(parts)

kit_html = assemble_kit()

# copia navegable del kit ensamblado (no se commitea)
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
with open(os.path.join(ROOT, 'dist', 'kit-inmobiliario.html'), 'w', encoding='utf-8') as f:
    f.write(kit_html)

login_b64   = b64(read_text('src/login.html'))
kit_b64     = b64(kit_html)
admin_b64   = b64(read_text('src/admin.html'))
icon192_b64 = encode_bin('icons/logo-192.png')
icon512_b64 = encode_bin('icons/logo-512.png')
qr_esencial_b64 = encode_bin('icons/qr-esencial.jpg')
qr_profesional_b64 = encode_bin('icons/qr-profesional.jpg')

manifest = '{"name":"Kit Inmobiliario Bolivia","short_name":"Merkaba Kit","start_url":"/kit-inmobiliario","display":"standalone","background_color":"#0a1628","theme_color":"#0a1628","icons":[{"src":"/icons/logo-192.png","sizes":"192x192","type":"image/png"},{"src":"/icons/logo-512.png","sizes":"512x512","type":"image/png"}]}'

# Service worker - usar backticks para evitar conflicto con comillas simples internas
sw = "self.addEventListener('install',function(e){e.waitUntil(self.skipWaiting());});self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim());});self.addEventListener('fetch',function(e){e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request);}));});"

# API — reemplazo de las RPCs de Supabase, misma tabla clientes ahora en D1 (env.DB)
API_JS = r'''
function jr(obj, status){ return new Response(JSON.stringify(obj), {status: status||200, headers:{"Content-Type":"application/json"}}); }
async function readBody(request){ try{ return await request.json(); }catch(e){ return {}; } }
function pj(s){ try{ return JSON.parse(s==null?"[]":s); }catch(e){ return []; } }

async function apiVerifyPassword(env, body){
  const row = await env.DB.prepare("SELECT * FROM clientes WHERE password=? AND activo=1 LIMIT 1").bind(body.pwd||"").first();
  if(!row) return jr({ok:false});
  return jr({ ok:true, id:row.id, nombre:row.nombre, ciudad:row.ciudad, whatsapp:row.whatsapp, email:row.email,
    plantillas:pj(row.plantillas), pendientes:pj(row.pendientes), foto:row.foto, seguimientos:pj(row.seguimientos),
    plan:row.plan, tema:row.tema, regalos_pronto_pago:row.regalos_pronto_pago });
}
async function apiSessionValida(env, body){
  const row = await env.DB.prepare("SELECT 1 FROM clientes WHERE id=? AND password=? AND activo=1").bind(body.p_id||"", body.p_password||"").first();
  return jr(!!row);
}
async function apiSavePlantillas(env, body){
  const res = await env.DB.prepare("UPDATE clientes SET plantillas=? WHERE id=? AND activo=1").bind(JSON.stringify(body.p_plantillas||[]), body.p_id).run();
  return jr({ok: res.meta.changes>0});
}
async function apiSavePendientes(env, body){
  const res = await env.DB.prepare("UPDATE clientes SET pendientes=? WHERE id=? AND activo=1").bind(JSON.stringify(body.p_pendientes||[]), body.p_id).run();
  return jr({ok: res.meta.changes>0});
}
async function apiSaveSeguimientos(env, body){
  const row = await env.DB.prepare("SELECT plan FROM clientes WHERE id=? AND activo=1").bind(body.p_id).first();
  if(!row) return jr({ok:false});
  const limite = row.plan==="completo" ? 50 : 20;
  const arr = body.p_seguimientos||[];
  if(arr.length > limite) return jr({ok:false, error:"limite", limite:limite});
  await env.DB.prepare("UPDATE clientes SET seguimientos=? WHERE id=? AND activo=1").bind(JSON.stringify(arr), body.p_id).run();
  return jr({ok:true});
}
async function apiClientUpdateProfile(env, body){
  const row = await env.DB.prepare("SELECT nombre, foto, tema FROM clientes WHERE id=? AND activo=1").bind(body.p_id).first();
  if(!row) return jr({ok:false});
  const nombre = (body.p_nombre && body.p_nombre.trim()!=="") ? body.p_nombre : row.nombre;
  const foto = (body.p_foto!=null) ? body.p_foto : row.foto;
  const tema = (body.p_tema!=null) ? body.p_tema : row.tema;
  await env.DB.prepare("UPDATE clientes SET nombre=?,ciudad=?,whatsapp=?,email=?,foto=?,tema=? WHERE id=? AND activo=1")
    .bind(nombre, body.p_ciudad||"", body.p_whatsapp||"", body.p_email||"", foto, tema, body.p_id).run();
  return jr({ok:true});
}
function checkAdmin(env, body){ return body.admin_pwd===env.ADMIN_PWD; }
async function apiAdminList(env, body){
  if(!checkAdmin(env,body)) return jr({error:"Unauthorized"},401);
  const {results} = await env.DB.prepare("SELECT id,nombre,password,ciudad,whatsapp,email,activo,plan,created_at,foto,regalos_pronto_pago FROM clientes ORDER BY created_at DESC").all();
  return jr(results.map(function(r){ r.activo=!!r.activo; return r; }));
}
async function apiAdminAdd(env, body){
  if(!checkAdmin(env,body)) return jr({error:"Unauthorized"},401);
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO clientes (id,nombre,password,ciudad,whatsapp,email,plan,activo,plantillas,pendientes,seguimientos,regalos_pronto_pago,tema,created_at) VALUES (?,?,?,?,?,?,?,1,'[]','[]','[]',0,'dorado',?)")
    .bind(id, body.p_nombre, body.p_password, body.p_ciudad||"", body.p_whatsapp||"", body.p_email||"", body.p_plan||"basico", new Date().toISOString()).run();
  return jr({ok:true, id:id});
}
async function apiAdminUpdate(env, body){
  if(!checkAdmin(env,body)) return jr({error:"Unauthorized"},401);
  await env.DB.prepare("UPDATE clientes SET nombre=?,password=?,ciudad=?,whatsapp=?,email=? WHERE id=?")
    .bind(body.p_nombre, body.p_password, body.p_ciudad||"", body.p_whatsapp||"", body.p_email||"", body.p_id).run();
  return jr({ok:true});
}
async function apiAdminSetPlan(env, body){
  if(!checkAdmin(env,body)) return jr({error:"Unauthorized"},401);
  await env.DB.prepare("UPDATE clientes SET plan=? WHERE id=?").bind(body.p_plan, body.p_id).run();
  return jr({ok:true, plan:body.p_plan});
}
async function apiAdminSetRegalos(env, body){
  if(!checkAdmin(env,body)) return jr({error:"Unauthorized"},401);
  if([0,1,2].indexOf(body.p_cantidad)===-1) return jr({error:"Cantidad invalida"},400);
  await env.DB.prepare("UPDATE clientes SET regalos_pronto_pago=? WHERE id=?").bind(body.p_cantidad, body.p_id).run();
  return jr({ok:true, regalos_pronto_pago:body.p_cantidad});
}
async function apiAdminToggleActivo(env, body){
  if(!checkAdmin(env,body)) return jr({error:"Unauthorized"},401);
  const row = await env.DB.prepare("SELECT activo FROM clientes WHERE id=?").bind(body.p_id).first();
  if(!row) return jr({error:"not found"},404);
  const nuevo = row.activo ? 0 : 1;
  await env.DB.prepare("UPDATE clientes SET activo=? WHERE id=?").bind(nuevo, body.p_id).run();
  return jr({ok:true, activo:!!nuevo});
}
async function apiAdminDelete(env, body){
  if(!checkAdmin(env,body)) return jr({error:"Unauthorized"},401);
  await env.DB.prepare("DELETE FROM clientes WHERE id=?").bind(body.p_id).run();
  return jr({ok:true});
}
async function handleApi(path, request, env){
  const body = await readBody(request);
  if(path==="/api/verify-password") return apiVerifyPassword(env, body);
  if(path==="/api/session-valida") return apiSessionValida(env, body);
  if(path==="/api/save-plantillas") return apiSavePlantillas(env, body);
  if(path==="/api/save-pendientes") return apiSavePendientes(env, body);
  if(path==="/api/save-seguimientos") return apiSaveSeguimientos(env, body);
  if(path==="/api/client-update-profile") return apiClientUpdateProfile(env, body);
  if(path==="/api/admin/list") return apiAdminList(env, body);
  if(path==="/api/admin/add") return apiAdminAdd(env, body);
  if(path==="/api/admin/update") return apiAdminUpdate(env, body);
  if(path==="/api/admin/set-plan") return apiAdminSetPlan(env, body);
  if(path==="/api/admin/set-regalos") return apiAdminSetRegalos(env, body);
  if(path==="/api/admin/toggle-activo") return apiAdminToggleActivo(env, body);
  if(path==="/api/admin/delete") return apiAdminDelete(env, body);
  return jr({error:"not found"},404);
}
'''

worker = '\n'.join([
    'const LOGIN="'   + login_b64   + '";',
    'const KIT="'     + kit_b64     + '";',
    'const ADMIN="'   + admin_b64   + '";',
    'const ICON192="' + icon192_b64 + '";',
    'const ICON512="' + icon512_b64 + '";',
    'const QRESENCIAL="' + qr_esencial_b64 + '";',
    'const QRPROFESIONAL="' + qr_profesional_b64 + '";',
    'const MANIFEST="' + manifest.replace('"', '\\"') + '";',
    'const SW=`'      + sw          + '`;',
    '',
    'function b64ToBytes(b64){const bin=atob(b64);const len=bin.length;const bytes=new Uint8Array(len);for(let i=0;i<len;i++){bytes[i]=bin.charCodeAt(i);}return bytes;}',
    'function serve(b64){const html=new TextDecoder("utf-8").decode(b64ToBytes(b64));return new Response(html,{headers:{"Content-Type":"text/html; charset=UTF-8"}});}',
    'function serveIcon(b64){return new Response(b64ToBytes(b64),{headers:{"Content-Type":"image/png","Cache-Control":"public, max-age=86400"}});}',
    'function serveJpeg(b64){return new Response(b64ToBytes(b64),{headers:{"Content-Type":"image/jpeg","Cache-Control":"public, max-age=86400"}});}',
    '',
    API_JS,
    '',
    'export default {',
    '  async fetch(request, env) {',
    '    const path=new URL(request.url).pathname.replace(/[/]$/,"")||"/";',
    '    if(request.method==="POST" && path.startsWith("/api/")) return handleApi(path, request, env);',
    '    if(path==="/"||path==="/login") return serve(LOGIN);',
    '    if(path==="/kit-inmobiliario") return serve(KIT);',
    '    if(path==="/admin") return serve(ADMIN);',
    '    if(path==="/manifest.json") return new Response(MANIFEST,{headers:{"Content-Type":"application/manifest+json"}});',
    '    if(path==="/sw.js") return new Response(SW,{headers:{"Content-Type":"application/javascript"}});',
    '    if(path==="/icons/logo-192.png") return serveIcon(ICON192);',
    '    if(path==="/icons/logo-512.png") return serveIcon(ICON512);',
    '    if(path==="/icons/qr-esencial.jpg") return serveJpeg(QRESENCIAL);',
    '    if(path==="/icons/qr-profesional.jpg") return serveJpeg(QRPROFESIONAL);',
    '    return new Response("Not found",{status:404});',
    '  }',
    '}',
])

out = os.path.join(ROOT, 'worker.js')
with open(out, 'w', encoding='utf-8') as f:
    f.write(worker)

print(f'worker.js built ({len(worker)} chars)')
