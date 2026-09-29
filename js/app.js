/* Dosificadora · Modelo 3D interactivo por secciones (taxonomía) — lógica de la aplicación */
(function () {
  'use strict';
  const TAXO = window.TAXO;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => (s === null || s === undefined) ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---------- catálogo ---------- */
  const COMP = {}, ELEM = {};
  const PALETTE = ['#e0a23a', '#e8756c', '#4aa3df', '#3fbf94', '#9b7be0', '#c9cf55', '#e88bc0', '#5fc7d6', '#f08a4b', '#8fb3ff'];
  TAXO.comps.forEach((c, k) => {
    c.color = PALETTE[k % PALETTE.length]; c.n = c.items.length; c.pieces = c.items.reduce((a, b) => a + b.q, 0);
    COMP[c.id] = c; c.items.forEach(it => { it.key = c.id + ':' + it.i; it.comp = c.id; ELEM[it.key] = it; });
  });
  const TOTAL_EL = Object.keys(ELEM).length;
  const KEEP = /^(DIN|ISO|SMS|PLC|HMI|EPDM|NBR|PP|PE|IP\d+K?|RJ45|LED|USB|VDC|VAC|KW|HP|RPM|BAR|NW\d+|DN\d+|OD\d+|A\.B|A\.BRAN|PT100|FUS|TBK|UCFL|UCF|WAGO|M\d+.*|Ø.*|ø.*)$/;
  const STOP = new Set(['de', 'del', 'con', 'para', 'en', 'y', 'o', 'a', 'la', 'el', 'los', 'las', 'por', 'sin', 'entre', 'un', 'una']);
  function nice(s) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    const letters = s.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, ''); if (!letters.length) return s;
    if (letters.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').length / letters.length < 0.7) return s;
    let first = true;
    return s.split(' ').map(w => {
      const core = w.replace(/[(),;]/g, '');
      if (STOP.has(core.toLowerCase()) && !first) return w.toLowerCase();
      if (/\d/.test(core) || /[\/\-\.]/.test(core) && core.length <= 4 || (core.length <= 3 && /^[A-Z]+$/.test(core)) || KEEP.test(core)) { first = false; return w; }
      const lw = w.toLowerCase(); const out = first ? lw.charAt(0).toUpperCase() + lw.slice(1) : lw; first = false; return out;
    }).join(' ');
  }

  /* ---------- escena ---------- */
  const canvas = $('#gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const SMALL = window.matchMedia('(max-width: 900px)').matches;
  let hd = false;
  function setPixelRatio() { renderer.setPixelRatio(Math.min((window.devicePixelRatio || 1) * (hd ? 1.5 : 1), hd ? 3 : (SMALL ? 1.5 : 2))); resize(); }
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.localClippingEnabled = true;

  const scene = new THREE.Scene(), BG = 0x252c35;
  scene.background = new THREE.Color(BG); scene.fog = new THREE.Fog(BG, 14, 34);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 90);
  camera.position.set(7.4, 4.5, 8.8);
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.09; controls.target.set(-0.35, 1.45, 0.1);
  controls.minDistance = 0.4; controls.maxDistance = 32; controls.maxPolarAngle = Math.PI * 0.497; controls.autoRotate = true; controls.autoRotateSpeed = 0.7; controls.screenSpacePanning = true;

  function makeEnv() {
    const s = new THREE.Scene();
    const room = new THREE.Mesh(new THREE.BoxGeometry(30, 14, 30), new THREE.MeshBasicMaterial({ color: 0x3b4248, side: THREE.BackSide })); room.position.y = 7; s.add(room);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: 0x8b867a })); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.02; s.add(floor);
    const light = c => { const m = new THREE.MeshBasicMaterial(); m.color.setScalar(c); return m; };
    for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.0), light(14)); p.rotation.x = Math.PI / 2; p.position.set(i * 5, 13.9, j * 7); s.add(p); }
    [[-14.9, 0, Math.PI / 2], [14.9, 0, -Math.PI / 2], [0, -14.9, 0], [0, 14.9, Math.PI]].forEach(q => { for (let i = -3; i <= 3; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 7), light(i % 2 ? 4.5 : 1.6)); p.position.set(q[0] ? q[0] : i * 3.6, 4.8, q[1] ? q[1] : i * 3.6); p.rotation.y = q[2]; s.add(p); } });
    const pm = new THREE.PMREMGenerator(renderer); const t = pm.fromScene(s, 0.02).texture; pm.dispose(); return t;
  }
  scene.environment = makeEnv();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6f6a5e, 0.32));
  const sun = new THREE.DirectionalLight(0xffffff, 1.9); sun.position.set(5, 9, 6.5); sun.castShadow = true;
  sun.shadow.mapSize.set(SMALL ? 2048 : 4096, SMALL ? 2048 : 4096);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 5, bottom: -5, near: 1, far: 26 }); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.02; sun.target.position.set(-0.3, 1, 0); scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xdde8ff, 0.5); fill.position.set(-6, 4, -4); scene.add(fill);

  const model = window.createDosificadoraModel();
  scene.add(model.root);
  const cutPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 100);

  /* ---------- materiales: base, resaltado, fantasma, rayos X ---------- */
  const shellMats = new Map(), vars = new Map(), hiMats = [];
  function shellOf(m) { if (!shellMats.has(m)) { const c = m.clone(); c.clippingPlanes = [cutPlane]; c.clipShadows = true; shellMats.set(m, c); } return shellMats.get(m); }
  function variant(m, kind) {
    let v = vars.get(m); if (!v) { v = {}; vars.set(m, v); }
    if (!v[kind]) {
      const c = m.clone();
      if (kind === 'ghost') { c.transparent = true; c.opacity = 0.06; c.depthWrite = false; }
      else if (kind === 'xray') { c.transparent = true; c.opacity = 0.13; c.depthWrite = false; }
      else if (kind === 'shade') { if (c.color) c.color.multiplyScalar(0.6); c.envMapIntensity = 0.55; }
      else if (kind === 'dim') { c.transparent = true; c.opacity = 0.45; c.depthWrite = false; }
      else if (kind === 'hi' || kind === 'hov') { if (c.emissive) { c.emissive = new THREE.Color(0xe0a23a); c.emissiveIntensity = kind === 'hi' ? 0.55 : 0.2; } if (kind === 'hi') hiMats.push(c); }
      v[kind] = c;
    }
    return v[kind];
  }
  model.meshes.forEach(m => { m.userData.base = m.userData.shell ? shellOf(m.material) : m.material; m.material = m.userData.base; });
  const S = { sel: null, hover: null, xray: false, iso: false, labels: false, run: false, exp: 0, cut: 0, autoDoor: { small: false, tall: false }, autoXray: false };

  function selSet() {
    if (!S.sel) return null;
    return new Set(S.sel.kind === 'elem' ? (model.meshesByElem[S.sel.id] || []) : (model.meshesByComp[S.sel.id] || []));
  }
  function refresh() {
    const ss = selSet(), hoverSet = S.hover ? new Set(model.meshesByElem[S.hover] || model.meshesByComp[S.hover] || []) : null;
    const selComp = S.sel ? (S.sel.kind === 'elem' ? ELEM[S.sel.id].comp : S.sel.id) : null;
    model.meshes.forEach(m => {
      let kind = 'base'; const isSel = ss && ss.has(m), basic = m.userData.base.isMeshBasicMaterial;
      if (S.iso && S.sel && !isSel) kind = m.userData.comp === selComp ? 'dim' : 'ghost';
      if (S.xray && m.userData.shell && !isSel) kind = 'xray';
      if (S.sel && !isSel && kind === 'base' && !basic) kind = 'shade';
      if (isSel && !basic) kind = 'hi';
      else if (hoverSet && hoverSet.has(m) && kind === 'base' && !basic) kind = 'hov';
      m.material = kind === 'base' ? m.userData.base : variant(m.userData.base, kind);
      m.userData.op = (kind === 'ghost') ? 0 : (kind === 'xray' ? 0.13 : (kind === 'dim' ? 0.45 : 1));
    });
  }

  /* ---------- cámara ---------- */
  const VIEWS = {
    iso: [[7.4, 4.5, 8.8], [-0.35, 1.45, 0.1]], front: [[-0.35, 2.4, 12.2], [-0.35, 1.6, 0]], back: [[-0.35, 2.6, -12.2], [-0.35, 1.6, 0]],
    left: [[-12.5, 2.4, 1.0], [-0.6, 1.4, 0]], right: [[12.5, 2.6, 1.0], [-0.2, 1.5, 0]], top: [[-0.35, 14, 0.5], [-0.35, 1.0, 0]]
  };
  let tween = null;
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function flyTo(pos, target, ms) { tween = { t0: performance.now(), ms: ms || 950, p0: camera.position.clone(), g0: controls.target.clone(), p1: pos.clone(), g1: target.clone() }; }
  controls.addEventListener('start', () => { tween = null; stopAuto(); });
  function stopAuto() { if (controls.autoRotate) { controls.autoRotate = false; $('#tRot').classList.remove('on'); } $('#hint').style.opacity = 0; }
  function setView(name) { const v = VIEWS[name]; flyTo(new THREE.Vector3(...v[0]), new THREE.Vector3(...v[1])); $$('#views button').forEach(b => b.classList.toggle('on', b.dataset.view === name)); }
  const INSIDE_BACK = new Set(['banda', 'elevacion']);
  function focusBox(info) {
    const c = info.center, sz = info.size, R = Math.max(sz.x, sz.y, sz.z), dist = Math.max(1.0, R * 1.75 + 0.45);
    let d;
    if (INSIDE_BACK.has(info.id)) d = new THREE.Vector3((c.x + 0.25) * 0.12, 0.45, -1.0);
    else if (c.x > 2.0) d = new THREE.Vector3(1, 0.4, 0.75); else if (c.x < -1.75) d = new THREE.Vector3(-1, 0.4, 0.6);
    else if (c.z > 0.5 && c.y < 1.72 && c.x > -1.7) d = new THREE.Vector3((c.x + 0.25) * 0.1, 0.04, 1.0);   // bajo la plataforma: cámara baja
    else d = new THREE.Vector3((c.x + 0.25) * 0.18, 0.5, c.z < -0.35 ? -1.0 : 1.0);
    d.normalize(); flyTo(c.clone().addScaledVector(d, dist), c);
    $$('#views button').forEach(b => b.classList.remove('on'));
  }

  /* ---------- reveladores automáticos (rayos X / puertas) ---------- */
  const INSIDE = new Set(['banda', 'elevacion', 'cassette']);
  const flag = { small: false, tall: false };
  function door(k, open) { flag[k] = open; model.setDoor(k, open); $(k === 'small' ? '#tSm' : '#tTall').classList.toggle('on', open); }
  function setXray(v) { S.xray = v; $('#tXray').classList.toggle('on', v); refresh(); }
  function autoReveal() {
    const sel = S.sel; let need = { xray: false, small: false, tall: false };
    if (sel) {
      const comp = sel.kind === 'elem' ? ELEM[sel.id].comp : sel.id;
      if (INSIDE.has(comp) && comp !== 'cassette') need.xray = true;
      if (sel.kind === 'elem') { const dk = model.elemDoor[sel.id]; if (dk) need[dk] = true; if (comp === 'estructura' && +sel.id.split(':')[1] >= 13 && +sel.id.split(':')[1] <= 17) need.xray = true; }
      else { if (comp === 'cpu') need.small = true; if (['io', 'proteccion', 'variador'].includes(comp)) need.tall = true; }
    }
    if (need.xray && !S.xray) { setXray(true); S.autoXray = true; } else if (!need.xray && S.autoXray) { S.autoXray = false; setXray(false); }
    ['small', 'tall'].forEach(k => { if (need[k] && !flag[k]) { door(k, true); S.autoDoor[k] = true; } else if (!need[k] && S.autoDoor[k]) { S.autoDoor[k] = false; door(k, false); } });
  }

  /* ---------- selección ---------- */
  function select(sel, opts) {
    opts = opts || {}; S.sel = sel;
    autoReveal(); refresh(); renderPanel(); highlightList();
    if (sel && opts.fly !== false) { const info = sel.kind === 'elem' ? model.elems[sel.id] : model.compInfo[sel.id]; focusBox({ center: info.center, size: info.size, id: sel.kind === 'elem' ? ELEM[sel.id].comp : sel.id }); stopAuto(); }
    if (sel && document.body.classList.contains('panel-off')) { document.body.classList.remove('panel-off'); $('#panelToggle').textContent = '◂'; resize(); }
    updateBanner();
  }
  function updateBanner() { const b = $('#banner'); if (S.iso && S.sel) { b.classList.remove('show'); } }

  /* ---------- picking ---------- */
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(ev) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const objs = model.meshes.filter(m => m.visible && m.userData.op > 0.3 && !(S.xray && m.userData.shell));
    const hit = raycaster.intersectObjects(objs, false)[0];
    return hit ? hit.object.userData : null;
  }
  let down = null;
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener('pointerup', e => {
    if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
    if (moved > 6 || dt > 500) return;
    const u = pick(e);
    if (u) select(u.elem ? { kind: 'elem', id: u.elem } : { kind: 'comp', id: u.comp }, { fly: false }); else select(null);
  });
  const tip = $('#tip'); let hoverBusy = false;
  canvas.addEventListener('pointermove', e => {
    if (hoverBusy || e.buttons) { tip.style.opacity = 0; return; } hoverBusy = true;
    requestAnimationFrame(() => {
      hoverBusy = false; const u = pick(e); const key = u ? (u.elem || u.comp) : null;
      if (key !== S.hover) { S.hover = key; refresh(); canvas.style.cursor = key ? 'pointer' : 'grab'; }
      if (u) { tip.textContent = u.elem ? nice(ELEM[u.elem].n).slice(0, 70) + '  ·  ' + COMP[u.comp].name : COMP[u.comp].name; tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px'; tip.style.opacity = 1; } else tip.style.opacity = 0;
    });
  });
  canvas.addEventListener('pointerleave', () => { tip.style.opacity = 0; });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') select(null); });

  /* ---------- panel izquierdo: secciones ---------- */
  const sysList = $('#syslist');
  function buildTree() {
    const groups = { mec: [], ele: [] }; TAXO.comps.forEach(c => groups[c.sys].push(c));
    sysList.innerHTML = ['mec', 'ele'].map(sid => {
      const cs = groups[sid], tot = cs.reduce((a, c) => a + c.n, 0);
      return `<div class="sys open" data-sys="${sid}"><button class="sys-head"><span class="dot" style="background:${sid === 'mec' ? '#e0a23a' : '#4aa3df'}"></span><span class="nm">${esc(TAXO.sistemas[sid])}</span><span class="ct">${cs.length} · ${tot}</span></button>
        <div class="sys-parts">${cs.map(c => `<button data-comp="${c.id}"><i style="background:${c.color}">${TAXO.comps.indexOf(c) + 1}</i>${esc(c.name)}<em>${c.n}</em></button>`).join('')}</div></div>`;
    }).join('');
    $$('.sys-head', sysList).forEach(b => b.addEventListener('click', () => b.parentElement.classList.toggle('open')));
    $$('[data-comp]', sysList).forEach(b => b.addEventListener('click', () => { select({ kind: 'comp', id: b.dataset.comp }); document.body.classList.remove('sys-open'); }));
  }
  function highlightList() {
    const comp = S.sel ? (S.sel.kind === 'elem' ? ELEM[S.sel.id].comp : S.sel.id) : null;
    $$('[data-comp]', sysList).forEach(b => b.classList.toggle('on', b.dataset.comp === comp));
    const on = $('[data-comp].on', sysList); if (on) on.scrollIntoView({ block: 'nearest' });
  }
  $('#sysToggle').addEventListener('click', () => document.body.classList.toggle('sys-open'));

  /* ---------- panel derecho ---------- */
  const panelBody = $('#panelBody');
  function renderPanel() {
    if (!S.sel) { panelBody.innerHTML = overview(); bindOverview(); return; }
    const compId = S.sel.kind === 'elem' ? ELEM[S.sel.id].comp : S.sel.id, c = COMP[compId], selEl = S.sel.kind === 'elem' ? ELEM[S.sel.id] : null;
    const idx = selEl ? c.items.indexOf(selEl) : -1;
    let h = `<div class="p-head"><div class="p-sys" style="color:${c.color}">${esc(TAXO.sistemas[c.sys])}</div><div class="p-title">${esc(c.name)}</div></div>`;
    if (selEl) {
      h += `<div class="p-body"><div class="card" style="border-left:3px solid ${c.color}">
        <div class="p-sys" style="color:${c.color}">Elemento ${idx + 1} de ${c.n} · No. en taxonomía ${selEl.no}</div>
        <b class="t" style="font-size:20px;line-height:1.15;margin:4px 0 8px">${esc(nice(selEl.n))}</b>
        <div class="kv"><span>Cantidad</span><b>${selEl.q} ${selEl.q === 1 ? 'pieza' : 'piezas'}</b></div>
        <div class="kv"><span>No. de parte</span><b>${esc(selEl.p || '—')}</b></div>
        <div class="kv"><span>Material</span><b>${esc(selEl.m || '—')}</b></div>
        <div class="kv"><span>Sección</span><b>${esc(c.name)}</b></div>
        <div class="btns"><button class="btn sm" id="bPrev">◂ Anterior</button><button class="btn sm" id="bNext">Siguiente ▸</button><button class="btn sm pri" id="bComp">Ver sección completa</button></div></div></div>`;
    } else {
      h += `<div class="p-body"><div class="p-desc">${esc(c.desc)}</div>
        <div class="badges"><span class="badge">${c.n} elementos</span><span class="badge">${c.pieces} piezas</span><span class="badge">${esc(TAXO.sistemas[c.sys])}</span></div>
        <div class="btns"><button class="btn sm pri" id="bIso">Aislar sección</button><button class="btn sm" id="bAll">Vista general</button></div></div>`;
    }
    h += `<div class="p-body" style="padding-top:0"><h3 class="sec">Elementos de la sección</h3><div class="tbl">` +
      c.items.map(it => `<button class="trow${selEl === it ? ' on' : ''}" data-el="${it.key}"><span class="no">${it.i}</span><span class="nm">${esc(nice(it.n))}</span><span class="q">×${it.q}</span></button>`).join('') + '</div></div>';
    panelBody.innerHTML = h;
    $$('[data-el]', panelBody).forEach(b => { b.addEventListener('click', () => select({ kind: 'elem', id: b.dataset.el })); b.addEventListener('mouseenter', () => { S.hover = b.dataset.el; refresh(); }); b.addEventListener('mouseleave', () => { S.hover = null; refresh(); }); });
    const on = $('.trow.on', panelBody); if (on) on.scrollIntoView({ block: 'nearest' });
    const bp = $('#bPrev'), bn = $('#bNext'), bc = $('#bComp'), bi = $('#bIso'), ba = $('#bAll');
    if (bp) { bp.onclick = () => select({ kind: 'elem', id: c.items[(idx + c.n - 1) % c.n].key }); bn.onclick = () => select({ kind: 'elem', id: c.items[(idx + 1) % c.n].key }); bc.onclick = () => select({ kind: 'comp', id: compId }); }
    if (bi) { bi.onclick = () => { iso(!S.iso); }; ba.onclick = () => { select(null); setView('iso'); }; }
  }
  function overview() {
    const mec = TAXO.comps.filter(c => c.sys === 'mec'), ele = TAXO.comps.filter(c => c.sys === 'ele');
    const pcs = a => a.reduce((x, c) => x + c.pieces, 0);
    return `<div class="p-head"><div class="p-sys">Vista general</div><div class="p-title">Moldeadora multiformato T-5 10TPL-D</div></div>
      <div class="p-body"><div class="p-desc">Modelo 3D construido a partir de la taxonomía de la máquina: cada uno de los ${TOTAL_EL} elementos de la lista está modelado y agrupado en su sección. Selecciona una sección en la lista de la izquierda o haz clic directamente sobre una pieza.</div>
      <div class="kpis" style="margin:14px 0"><div class="kpi"><b>${TAXO.comps.length}</b><span>secciones</span></div><div class="kpi"><b>${TOTAL_EL}</b><span>elementos</span></div><div class="kpi"><b>${pcs(mec)}</b><span>piezas mecánicas</span></div><div class="kpi"><b>${pcs(ele)}</b><span>piezas eléctricas</span></div></div>
      <h3 class="sec">Secciones</h3><div class="chips">${TAXO.comps.map(c => `<button class="chip" data-c="${c.id}" style="border-left:3px solid ${c.color}">${esc(c.name)}</button>`).join('')}</div>
      <div class="callout" style="margin-top:14px">Usa <b>Rayos X</b> para ver las piezas interiores, <b>Explosión</b> para separar los conjuntos, <b>Corte</b> para seccionar la máquina y <b>▶ Operación</b> para animar cadena, cuchillas, elevación y flujo.</div></div>`;
  }
  function bindOverview() { $$('[data-c]', panelBody).forEach(b => b.addEventListener('click', () => select({ kind: 'comp', id: b.dataset.c }))); }
  $('#panelToggle').addEventListener('click', () => { document.body.classList.toggle('panel-off'); $('#panelToggle').textContent = document.body.classList.contains('panel-off') ? '▸' : '◂'; resize(); });

  /* ---------- búsqueda ---------- */
  const q = $('#q'), qres = $('#qres');
  q.addEventListener('input', () => {
    const t = q.value.trim().toLowerCase(); if (t.length < 2) { qres.classList.remove('open'); return; }
    const out = []; TAXO.comps.forEach(c => { if (c.name.toLowerCase().includes(t)) out.push({ c, comp: true }); c.items.forEach(it => { if ((it.n + ' ' + it.p + ' ' + it.m).toLowerCase().includes(t)) out.push({ c, it }); }); });
    qres.innerHTML = out.slice(0, 40).map((r, i) => r.comp ? `<button data-i="${i}"><b>${esc(r.c.name)}</b><small>Sección · ${r.c.n} elementos</small></button>` : `<button data-i="${i}">${esc(nice(r.it.n))}<small>${esc(r.c.name)} · ${esc(r.it.p)} · ×${r.it.q}</small></button>`).join('') || '<button disabled>Sin resultados</button>';
    qres.classList.add('open');
    $$('button[data-i]', qres).forEach(b => b.addEventListener('click', () => { const r = out[+b.dataset.i]; select(r.comp ? { kind: 'comp', id: r.c.id } : { kind: 'elem', id: r.it.key }); qres.classList.remove('open'); q.value = ''; document.body.classList.remove('sys-open'); }));
  });
  document.addEventListener('click', e => { if (!e.target.closest('.search')) qres.classList.remove('open'); });

  /* ---------- controles del dock ---------- */
  function iso(v) { S.iso = v; $('#tIso').classList.toggle('on', v); refresh(); }
  $$('#views button').forEach(b => b.addEventListener('click', () => { setView(b.dataset.view); stopAuto(); }));
  $('#tRun').addEventListener('click', () => { S.run = !S.run; model.setRunning(S.run); $('#tRun').classList.toggle('on', S.run); $('#tRun').textContent = S.run ? '■ Detener' : '▶ Operación'; });
  $('#tRot').addEventListener('click', () => { controls.autoRotate = !controls.autoRotate; $('#tRot').classList.toggle('on', controls.autoRotate); });
  $('#tXray').addEventListener('click', () => { S.autoXray = false; setXray(!S.xray); });
  $('#tLabels').addEventListener('click', () => { S.labels = !S.labels; $('#tLabels').classList.toggle('on', S.labels); $('#labels').style.display = S.labels ? 'block' : 'none'; });
  $('#tIso').addEventListener('click', () => iso(!S.iso));
  $('#tSm').addEventListener('click', () => { S.autoDoor.small = false; door('small', !flag.small); });
  $('#tTall').addEventListener('click', () => { S.autoDoor.tall = false; door('tall', !flag.tall); });
  $('#tStop').addEventListener('click', () => { S.stop = !S.stop; model.setEstop(S.stop); $('#tStop').classList.toggle('on', S.stop); });
  $('#tHD').addEventListener('click', () => { hd = !hd; $('#tHD').classList.toggle('on', hd); setPixelRatio(); });
  $('#sExp').addEventListener('input', e => { S.exp = e.target.value / 100; model.setExplode(S.exp * 1.0); });
  $('#sCut').addEventListener('input', e => { S.cut = e.target.value / 100; cutPlane.constant = S.cut === 0 ? 100 : 1.7 - S.cut * 2.7; });

  /* ---------- etiquetas de sección ---------- */
  const labelsEl = $('#labels'); labelsEl.style.display = 'none';
  const pins = TAXO.comps.map((c, k) => { const d = document.createElement('div'); d.className = 'lbl'; d.innerHTML = `<i style="background:${c.color}">${k + 1}</i><span>${esc(c.name)}</span>`; d.style.pointerEvents = 'auto'; d.style.cursor = 'pointer'; d.onclick = () => select({ kind: 'comp', id: c.id }); labelsEl.appendChild(d); return { d, c }; });
  const v3 = new THREE.Vector3();
  function updateLabels() {
    if (!S.labels) return; const w = canvas.clientWidth, h = canvas.clientHeight;
    pins.forEach(p => { const ci = model.compInfo[p.c.id]; v3.copy(ci.center); v3.y = ci.box.max.y; v3.project(camera); const vis = v3.z < 1 && Math.abs(v3.x) < 1.1 && Math.abs(v3.y) < 1.1; p.d.style.display = vis ? 'flex' : 'none'; p.d.style.left = ((v3.x + 1) / 2 * w) + 'px'; p.d.style.top = ((1 - v3.y) / 2 * h) + 'px'; });
  }

  /* ---------- ciclo de render ---------- */
  function resize() { const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 1.1 ? 2 * Math.atan(Math.min(0.51 / (w / h), 0.75)) * 180 / Math.PI : 34; camera.updateProjectionMatrix(); applyOffset(); const d = $('#dock'); document.documentElement.style.setProperty('--dockH', d.offsetHeight + 'px'); }
  function applyOffset() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (window.matchMedia('(max-width: 900px)').matches || !w) { camera.clearViewOffset(); return; }
    const R = document.body.classList.contains('panel-off') ? 10 : 410, Lw = 270;
    camera.setViewOffset(w, h, (R - Lw) / 2, 0, w, h);
  }
  window.addEventListener('resize', resize);
  const clock = new THREE.Clock();
  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05), t = performance.now();
    if (tween) { const k = Math.min(1, (t - tween.t0) / tween.ms), e = ease(k); camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.g0, tween.g1, e); if (k >= 1) tween = null; }
    controls.update(); model.update(dt);
    const kk = 0.5 + 0.22 * Math.sin(t / 220); hiMats.forEach(m => { m.emissiveIntensity = kk; });
    const bk = model.kit.beaconState; if (bk && model.kit.beacon) { ['g', 'b', 'r'].forEach(k2 => model.kit.beacon[k2].children.forEach(m => { if (m.material && m.material.emissive) m.material.emissiveIntensity = (k2 === bk ? 1.6 + 0.6 * Math.sin(t / 150) : 0.15); })); }
    updateLabels(); renderer.render(scene, camera);
  }

  /* ---------- arranque ---------- */
  buildTree(); renderPanel(); resize(); setPixelRatio();
  $('#stComp').textContent = TAXO.comps.length + ' secciones'; $('#stEl').textContent = TOTAL_EL + ' elementos';
  if (window.matchMedia('(max-width: 900px)').matches) document.body.classList.add('panel-off');
  requestAnimationFrame(() => { $('#loading').classList.add('done'); loop(); });
  window.__dos = { model, select, setView, scene, camera, renderer, controls, COMP, ELEM, S, refresh, setXray, door };
})();
