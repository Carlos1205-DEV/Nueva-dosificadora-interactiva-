/* Núcleo geométrico del modelo 3D — DOSIFICADORA / MOLDEADORA MULTIFORMATO
 * Unidades: metros.  X = longitud de la máquina (salida de moldes en -X, intercambiador en +X)
 * Y = altura.  Z = profundidad (lado del operador / plataforma en +Z).
 * Todo es procedural (sin archivos externos) y con alta resolución de malla. */
(function () {
  'use strict';
  const PI = Math.PI, TAU = PI * 2;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

  const TEMPLATES = {
    steel:      { color: 0xd3d9de, metalness: 0.95, roughness: 0.22 },
    steelDark:  { color: 0xa4adb4, metalness: 0.92, roughness: 0.38 },
    brushed:    { color: 0xb9c0c7, metalness: 0.92, roughness: 0.46 },
    panel:      { color: 0x8a939b, metalness: 0.85, roughness: 0.42 },   // chapa inox de cubiertas (gris CAD)
    panelDark:  { color: 0x5e666e, metalness: 0.8,  roughness: 0.5 },
    black:      { color: 0x1a1d21, metalness: 0.35, roughness: 0.5 },
    rubber:     { color: 0x121417, metalness: 0.0,  roughness: 0.92 },
    epdm:       { color: 0x1d2024, metalness: 0.0,  roughness: 0.85 },
    green:      { color: 0x2b7a4e, metalness: 0.3,  roughness: 0.5 },
    blue:       { color: 0x1f4fa3, metalness: 0.35, roughness: 0.42 },
    blueLight:  { color: 0x3a8ae8, metalness: 0.25, roughness: 0.4 },
    curd:       { color: 0x2453d6, metalness: 0.55, roughness: 0.3 },   // tubería de cuajada (azul CAD)
    anodized:   { color: 0x8093ad, metalness: 0.75, roughness: 0.4 },
    red:        { color: 0xc32b2b, metalness: 0.2,  roughness: 0.38 },
    yellow:     { color: 0xe8b923, metalness: 0.2,  roughness: 0.45 },
    orange:     { color: 0xd9822b, metalness: 0.35, roughness: 0.45 },   // rodillos transportadores (naranja CAD)
    white:      { color: 0xeceff1, metalness: 0.05, roughness: 0.6 },
    gray:       { color: 0x8b9198, metalness: 0.4,  roughness: 0.5 },
    lightGray:  { color: 0xc9cdd1, metalness: 0.25, roughness: 0.55 },
    cabinet:    { color: 0xb4bcc4, metalness: 0.55, roughness: 0.45 },
    brass:      { color: 0xb59a4a, metalness: 0.85, roughness: 0.35 },
    uhmw:       { color: 0xf1f1ec, metalness: 0.0,  roughness: 0.7 },
    pp:         { color: 0xe9ecef, metalness: 0.0,  roughness: 0.5 },
    poly:       { color: 0xd8c27a, metalness: 0.0,  roughness: 0.55 },   // poliuretano / iglidur
    iglidur:    { color: 0xc99a2e, metalness: 0.05, roughness: 0.6 },
    glass:      { color: 0x99b6c9, metalness: 0.1,  roughness: 0.05, transparent: true, opacity: 0.35 },
    weg:        { color: 0x2e6dbf, metalness: 0.35, roughness: 0.42 },
    sew:        { color: 0x3c4a5a, metalness: 0.4,  roughness: 0.5 },
    cable:      { color: 0x2a2d31, metalness: 0.1,  roughness: 0.7 },
    cableGray:  { color: 0x5b6168, metalness: 0.05, roughness: 0.75 },
    cableBlue:  { color: 0x2d62c8, metalness: 0.1,  roughness: 0.65 },
    ab:         { color: 0x3b4148, metalness: 0.3,  roughness: 0.55 },   // Allen-Bradley gris oscuro
    abLight:    { color: 0xd7d9dc, metalness: 0.15, roughness: 0.55 }
  };

  function makeKit() {
    const root = new THREE.Group();
    const context = new THREE.Group(); context.name = 'contexto'; context.userData.context = true; root.add(context);
    const comps = {};        // id -> Group (componente)
    const elems = {};        // "comp:i" -> {key, comp, i, group}
    const shells = [];       // carcasas (rayos X / corte)
    const spinners = [];     // {obj, axis, k}
    const flows = [];        // partículas
    const expl = [];         // {obj, base, vec}
    const matCache = {}, geoCache = {};
    const state = { running: false, estop: false, speed: 0, t: 0, doors: { small: 0, tall: 0 }, doorT: { small: 0, tall: 0 } };
    const anim = [];         // callbacks(dt, state)

    /* ---------- materiales / geometrías con caché ---------- */
    function mat(name, extra) {
      const key = name + (extra ? JSON.stringify(extra) : '');
      if (!matCache[key]) matCache[key] = new THREE.MeshStandardMaterial(Object.assign({}, TEMPLATES[name] || TEMPLATES.gray, extra || {}));
      return matCache[key];
    }
    function geo(key, fn) { return geoCache[key] || (geoCache[key] = fn()); }
    function mesh(g, m, o) {
      o = o || {};
      const me = new THREE.Mesh(g, typeof m === 'string' ? mat(m, o.mat) : m);
      me.castShadow = o.cast !== false; me.receiveShadow = o.recv !== false;
      if (o.pos) me.position.set(o.pos[0], o.pos[1], o.pos[2]);
      if (o.rot) me.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
      if (o.scl) me.scale.set(o.scl[0], o.scl[1], o.scl[2]);
      if (o.shell) { me.userData.shell = true; shells.push(me); }
      return me;
    }
    const rnd = v => Math.round(v * 10000) / 10000;
    const box = (w, h, d, m, o) => mesh(geo('b' + rnd(w) + '_' + rnd(h) + '_' + rnd(d), () => new THREE.BoxGeometry(w, h, d)), m, o);
    // caja con aristas redondeadas (biselada)
    function rbox(w, h, d, r, m, o) {
      r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
      const g = geo('rb' + rnd(w) + '_' + rnd(h) + '_' + rnd(d) + '_' + rnd(r), () => {
        const s = new THREE.Shape(), a = w / 2 - r, b = h / 2 - r;
        s.moveTo(-a, -b); s.lineTo(a, -b); s.lineTo(a, b); s.lineTo(-a, b); s.closePath();
        const e = new THREE.ExtrudeGeometry(s, { depth: Math.max(d - 2 * r, 1e-4), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 4 });
        e.translate(0, 0, -(d - 2 * r) / 2); return e;
      });
      return mesh(g, m, o);
    }
    function cyl(rT, rB, h, m, o) {
      o = o || {};
      const g = geo('c' + rnd(rT) + '_' + rnd(rB) + '_' + rnd(h) + '_' + (o.seg || 48) + (o.open ? 'o' : ''), () => new THREE.CylinderGeometry(rT, rB, h, o.seg || 48, 1, !!o.open));
      const me = mesh(g, m, o);
      if (o.axis === 'x') me.rotation.z = PI / 2; else if (o.axis === 'z') me.rotation.x = PI / 2;
      return me;
    }
    function torus(R, r, m, o) {
      o = o || {};
      const g = geo('t' + rnd(R) + '_' + rnd(r) + '_' + (o.seg || 48) + '_' + (o.arc || 0), () => new THREE.TorusGeometry(R, r, 12, o.seg || 48, o.arc || TAU));
      const me = mesh(g, m, o);
      if (o.axis === 'x') me.rotation.y = PI / 2; else if (o.axis === 'y') me.rotation.x = PI / 2;
      return me;
    }
    function sphere(r, m, o) { return mesh(geo('s' + rnd(r), () => new THREE.SphereGeometry(r, 32, 20)), m, o); }
    function lathe(pts, m, o) { // pts: [[r,y],...]
      o = o || {};
      const g = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), o.seg || 48);
      const me = mesh(g, m, o);
      if (o.axis === 'x') me.rotation.z = -PI / 2; else if (o.axis === 'z') me.rotation.x = PI / 2;
      return me;
    }
    function extrude(shape, depth, m, o) {
      o = o || {};
      const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: !!o.bevel, bevelSize: o.bevel || 0, bevelThickness: o.bevel || 0, bevelSegments: 2, curveSegments: o.seg || 24 });
      g.translate(0, 0, -depth / 2);
      return mesh(g, m, o);
    }
    function ringShape(rO, rI, seg) {
      const s = new THREE.Shape(); s.absarc(0, 0, rO, 0, TAU, false);
      const h = new THREE.Path(); h.absarc(0, 0, rI, 0, TAU, true); s.holes.push(h); return s;
    }
    function rectShape(w, h, holes) {
      const s = new THREE.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.closePath();
      (holes || []).forEach(q => { const p = new THREE.Path(); p.absarc(q[0], q[1], q[2], 0, TAU, true); s.holes.push(p); });
      return s;
    }
    function put(parent) { for (let i = 1; i < arguments.length; i++) parent.add(arguments[i]); return parent; }

    /* ---------- fusión de geometrías (para piezas pequeñas repetidas) ---------- */
    function merge(list) {
      const P = [], N = [], U = [];
      list.forEach(g0 => {
        const g = g0.index ? g0.toNonIndexed() : g0;
        P.push(g.attributes.position.array); N.push(g.attributes.normal ? g.attributes.normal.array : new Float32Array(g.attributes.position.array.length));
        U.push(g.attributes.uv ? g.attributes.uv.array : new Float32Array(g.attributes.position.count * 2));
      });
      const cat = (arrs) => { let n = 0; arrs.forEach(a => n += a.length); const out = new Float32Array(n); let o = 0; arrs.forEach(a => { out.set(a, o); o += a.length; }); return out; };
      const out = new THREE.BufferGeometry();
      out.setAttribute('position', new THREE.BufferAttribute(cat(P), 3));
      out.setAttribute('normal', new THREE.BufferAttribute(cat(N), 3));
      out.setAttribute('uv', new THREE.BufferAttribute(cat(U), 2));
      return out;
    }
    const tr = (g, x, y, z) => { const c = g.clone(); c.translate(x || 0, y || 0, z || 0); return c; };
    // perno hexagonal: cabeza en +Y (y 0..h), vástago hacia -Y
    function boltGeo(d, len) {
      return geo('bolt' + rnd(d) + '_' + rnd(len), () => merge([
        tr(new THREE.CylinderGeometry(d * 0.92, d * 0.92, d * 0.66, 6), 0, d * 0.33, 0),
        tr(new THREE.CylinderGeometry(d * 0.5, d * 0.5, len, 14), 0, -len / 2, 0)
      ]));
    }
    function nutGeo(d) { return geo('nut' + rnd(d), () => tr(new THREE.CylinderGeometry(d * 0.92, d * 0.92, d * 0.8, 6), 0, 0, 0)); }
    function washerGeo(d) { return geo('wsh' + rnd(d), () => new THREE.CylinderGeometry(d * 1.05, d * 1.05, d * 0.14, 24)); }

    /* ---------- instanciado ---------- */
    // list: [{p:[x,y,z], r:[rx,ry,rz], s:[sx,sy,sz]|number}]
    function inst(g, m, list, o) {
      o = o || {};
      const im = new THREE.InstancedMesh(g, typeof m === 'string' ? mat(m, o.mat) : m, list.length);
      const d = new THREE.Object3D();
      list.forEach((t, i) => {
        d.position.set(t.p[0], t.p[1], t.p[2]);
        d.rotation.set(t.r ? t.r[0] : 0, t.r ? t.r[1] : 0, t.r ? t.r[2] : 0);
        const s = t.s === undefined ? 1 : t.s; if (typeof s === 'number') d.scale.set(s, s, s); else d.scale.set(s[0], s[1], s[2]);
        d.updateMatrix(); im.setMatrixAt(i, d.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
      im.castShadow = o.cast !== false; im.receiveShadow = true;
      im.frustumCulled = false;
      if (o.shell) { im.userData.shell = true; shells.push(im); }
      return im;
    }
    // rotaciones para orientar el eje Y de un elemento a un eje
    const ROT = { y: [0, 0, 0], x: [0, 0, -PI / 2], z: [PI / 2, 0, 0], nx: [0, 0, PI / 2], nz: [-PI / 2, 0, 0], ny: [PI, 0, 0] };
    function bolts(list, d, len, axis, o) { // list: [[x,y,z],..]
      o = o || {}; const r = ROT[axis || 'y'];
      return inst(boltGeo(d, len), o.mat || 'steelDark', list.map(p => ({ p, r })), o);
    }
    function nuts(list, d, axis, o) { o = o || {}; const r = ROT[axis || 'y']; return inst(nutGeo(d), o.mat || 'steelDark', list.map(p => ({ p, r })), o); }
    function washers(list, d, axis, o) { o = o || {}; const r = ROT[axis || 'y']; return inst(washerGeo(d), o.mat || 'steel', list.map(p => ({ p, r })), o); }
    function line(p0, p1, n) { const a = []; for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); a.push([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, p0[2] + (p1[2] - p0[2]) * t]); } return a; }
    function grid(cx, cy, cz, nx, ny, sx, sy, plane) {
      const a = [];
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const u = (i - (nx - 1) / 2) * sx, v = (j - (ny - 1) / 2) * sy;
        a.push(plane === 'xz' ? [cx + u, cy, cz + v] : plane === 'zy' ? [cx, cy + v, cz + u] : [cx + u, cy + v, cz]);
      }
      return a;
    }

    /* ---------- tubos ---------- */
    // tubería con codos suavizados: puntos [[x,y,z]..], radio, radio de curvatura del codo
    function pipe(points, r, m, o) {
      o = o || {};
      const pts = points.map(a => V3(a[0], a[1], a[2]));
      const bend = o.bend === undefined ? Math.max(r * 2.2, 0.03) : o.bend;
      const path = new THREE.CurvePath();
      let prev = pts[0].clone();
      for (let i = 1; i < pts.length - 1; i++) {
        const a = pts[i - 1], b = pts[i], c = pts[i + 1];
        const d1 = b.clone().sub(a), d2 = c.clone().sub(b);
        const l1 = d1.length(), l2 = d2.length();
        const k = Math.min(bend, l1 / 2 - 1e-4, l2 / 2 - 1e-4);
        if (k <= 1e-4) continue;
        const p1 = b.clone().addScaledVector(d1.normalize(), -k), p2 = b.clone().addScaledVector(d2.normalize(), k);
        if (prev.distanceTo(p1) > 1e-5) path.add(new THREE.LineCurve3(prev.clone(), p1));
        path.add(new THREE.QuadraticBezierCurve3(p1, b.clone(), p2));
        prev = p2;
      }
      const last = pts[pts.length - 1];
      if (prev.distanceTo(last) > 1e-5) path.add(new THREE.LineCurve3(prev.clone(), last.clone()));
      const segs = Math.max(8, Math.round(path.getLength() * (o.res || 90)));
      const g = new THREE.TubeGeometry(path, segs, r, o.radial || 20, false);
      return mesh(g, m, o);
    }
    // manguera / cable flexible (curva Catmull-Rom)
    function hose(points, r, m, o) {
      o = o || {};
      const c = new THREE.CatmullRomCurve3(points.map(a => V3(a[0], a[1], a[2])), false, 'catmullrom', o.tension === undefined ? 0.5 : o.tension);
      const segs = Math.max(12, Math.round(c.getLength() * (o.res || 70)));
      const g = new THREE.TubeGeometry(c, segs, r, o.radial || 14, false);
      return mesh(g, m, o);
    }
    // férula sanitaria + abrazadera + empaque (orientada en axis)
    function clamp(x, y, z, axis, r, m) {
      const g = new THREE.Group(); g.position.set(x, y, z);
      g.add(cyl(r * 1.55, r * 1.55, 0.012, m || 'steel', { axis, seg: 40 }));
      g.add(cyl(r * 1.3, r * 1.3, 0.017, 'epdm', { axis, seg: 40 }));
      g.add(cyl(r * 1.75, r * 1.75, 0.02, 'steelDark', { axis, seg: 40, open: false }));
      g.add(torus(r * 1.65, r * 0.16, 'steel', { axis: axis === 'x' ? 'x' : axis === 'y' ? 'y' : 'z', seg: 40 }));
      g.add(cyl(r * 0.25, r * 0.25, r * 0.7, 'steelDark', { pos: axis === 'y' ? [r * 1.9, 0, 0] : [0, r * 1.9, 0], rot: axis === 'y' ? [0, 0, PI / 2] : [0, 0, 0], seg: 12 }));
      return g;
    }

    /* ---------- texturas ---------- */
    function canvasTex(w, h, draw) {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.encoding = THREE.sRGBEncoding; return t;
    }
    function label(txt, w, h, o) { // placa rotulada (plano) mirando +Z
      o = o || {};
      const t = canvasTex(256, Math.round(256 * h / w), (c, W, H) => {
        c.fillStyle = o.bg || '#1a3f8c'; c.fillRect(0, 0, W, H);
        c.fillStyle = o.fg || '#fff'; c.font = 'bold ' + (o.fs || 30) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        const ls = String(txt).split('\n'); ls.forEach((l, i) => c.fillText(l, W / 2, H / 2 + (i - (ls.length - 1) / 2) * (o.fs || 30) * 1.15));
      });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t }));
      if (o.pos) p.position.set(o.pos[0], o.pos[1], o.pos[2]);
      if (o.rot) p.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
      return p;
    }

    /* ---------- registro: componentes y elementos ---------- */
    function comp(id, name, sysId) {
      const g = new THREE.Group(); g.name = id; g.userData.comp = id; g.userData.sys = sysId;
      comps[id] = g; root.add(g); return g;
    }
    // Crea el grupo de un elemento de la taxonomía: comp:i (i = orden dentro del componente)
    function el(compId, i, parent) {
      const key = compId + ':' + i;
      if (elems[key]) return elems[key].group;
      const g = new THREE.Group(); g.name = key; g.userData.elem = key;
      elems[key] = { key, comp: compId, i, group: g };
      (parent || comps[compId]).add(g);
      return g;
    }
    // grupo etiquetado como parte del elemento comp:i pero colgado de otro padre (p. ej. una puerta articulada)
    function attach(compId, i, parent) {
      const key = compId + ':' + i; el(compId, i);
      const g = new THREE.Group(); g.userData.elem = key; g.name = key + '#';
      (elems[key].extra = elems[key].extra || []).push(g); parent.add(g); return g;
    }
    function explode(obj, x, y, z) { expl.push({ obj, base: obj.position.clone(), vec: V3(x, y, z) }); }
    function spin(obj, axis, k) { spinners.push({ obj, axis: axis || 'x', k: k === undefined ? 1 : k }); }

    return { THREE, PI, TAU, V3, root, context, comps, elems, shells, spinners, flows, expl, anim, state, mat, geo, mesh, box, rbox, cyl, torus, sphere, lathe, extrude, ringShape, rectShape, put, merge, tr, boltGeo, nutGeo, washerGeo, inst, bolts, nuts, washers, line, grid, pipe, hose, clamp, canvasTex, label, comp, el, attach, explode, spin, ROT };
  }

  window.MODEL_BUILDERS = window.MODEL_BUILDERS || [];
  window.createKit = makeKit;
})();
