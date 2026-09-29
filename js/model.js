/* Ensamblado del modelo 3D de la DOSIFICADORA (moldeadora multiformato) a partir de la taxonomía.
 * Cada componente (19) es un grupo; cada elemento de la taxonomía (295) es un sub-grupo seleccionable.
 * Cada hijo directo de un componente queda dentro de una "unidad" (grupo envoltorio) que el despiece puede desplazar. */
(function () {
  'use strict';
  window.createDosificadoraModel = function (opts) {
    opts = opts || {};
    const K = window.createKit(opts), THREE = K.THREE, TAXO = window.TAXO;
    TAXO.comps.forEach(c => K.comp(c.id, c.name, c.sys));
    window.MODEL_BUILDERS.forEach(b => b(K));

    /* ---------- flujo de partículas (cuajada y vapor) ---------- */
    function flowLine(points, color, n, size, speed) {
      const pts = points.map(a => new THREE.Vector3(a[0], a[1], a[2])), lens = []; let total = 0;
      for (let i = 0; i < pts.length - 1; i++) { const l = pts[i].distanceTo(pts[i + 1]); lens.push(l); total += l; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
      const m = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
      const p = new THREE.Points(geo, m); p.frustumCulled = false; p.visible = false; p.userData.flow = true;
      K.flows.push({ p, pts, lens, total, n, speed, offset: 0 }); K.root.add(p);
    }
    const H = K.L.hx;
    // producto: del intercambiador a la manguera azul y por ella hasta el carro; vapor hacia el intercambiador
    const hp0 = K.hoses ? K.hoses[0].pts(0.45) : [];
    flowLine([[H.x, 0.72, H.z + 0.6], [H.x, 0.72, H.z + 0.02], [H.x, 1.98, H.z], [H.x, 2.15, H.z], [H.x, 2.28, H.z - 0.3], [1.72, 2.28, -0.64]].concat(hp0), 0x7fb2ff, 64, 0.035, 0.6);
    flowLine([[H.x + 0.55, 2.15, H.z], [H.x + 0.55, 1.62, H.z], [H.x + 0.14, 1.62, H.z]], 0xffffff, 18, 0.04, 0.6);

    /* ---------- unidades de despiece: cada hijo directo de un componente va dentro de un envoltorio ---------- */
    const units = {};
    TAXO.comps.forEach(c => {
      const cg = K.comps[c.id]; units[c.id] = [];
      cg.children.slice().forEach(ch => {
        const w = new THREE.Group(); w.name = 'unidad'; w.userData.unit = true;
        cg.add(w); w.add(ch);
        units[c.id].push({ obj: w, child: ch, key: ch.userData.elem || null, name: ch.name || '' });
      });
    });

    /* ---------- cajas envolventes (con soporte de InstancedMesh) ---------- */
    const tmpB = new THREE.Box3(), tmpM = new THREE.Matrix4();
    function instBox(o) {
      const b = new THREE.Box3(), g = o.geometry; if (!g.boundingBox) g.computeBoundingBox();
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, tmpM); tmpB.copy(g.boundingBox).applyMatrix4(tmpM); b.union(tmpB); }
      return b.applyMatrix4(o.matrixWorld);
    }
    function objBox(obj) {
      const b = new THREE.Box3(), t = new THREE.Box3(); obj.updateWorldMatrix(true, true);
      obj.traverse(o => {
        if (o.isInstancedMesh) b.union(instBox(o));
        else if (o.isMesh) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); t.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); b.union(t); }
      });
      return b;
    }
    function boxOfMeshes(list) {
      const b = new THREE.Box3(), t = new THREE.Box3();
      list.forEach(o => { if (o.isInstancedMesh) b.union(instBox(o)); else { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); t.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); b.union(t); } });
      return b;
    }

    /* ---------- registro ---------- */
    const meshes = [], meshesByElem = {}, meshesByComp = {}, ctxMeshes = [];
    K.root.updateMatrixWorld(true);
    function keyOf(o) {
      let elem = null, comp = null;
      for (let n = o; n; n = n.parent) {
        if (!elem && n.userData.elem) elem = n.userData.elem;
        if (!comp && n.userData.comp) comp = n.userData.comp;
        if (elem && comp) break;
      }
      if (elem && !comp) comp = elem.split(':')[0];
      return { elem, comp };
    }
    K.root.traverse(o => {
      if (!(o.isMesh || o.isInstancedMesh) || o.userData.floor) return;
      const k = keyOf(o); o.userData.elem = k.elem; o.userData.comp = k.comp;
      let ctx = false; for (let n = o; n; n = n.parent) if (n === K.context) ctx = true;
      o.userData.context = ctx || !k.comp;
      if (o.userData.context) { if (o.userData.context && !o.userData.floor) ctxMeshes.push(o); return; }
      meshes.push(o);
      (meshesByComp[k.comp] = meshesByComp[k.comp] || []).push(o);
      if (k.elem) (meshesByElem[k.elem] = meshesByElem[k.elem] || []).push(o);
    });
    Object.values(K.elems).forEach(e => {
      const list = meshesByElem[e.key] || [];
      e.meshes = list; e.box = list.length ? boxOfMeshes(list) : new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
      e.center = e.box.getCenter(new THREE.Vector3()); e.size = e.box.getSize(new THREE.Vector3());
    });
    const compInfo = {};
    TAXO.comps.forEach(c => {
      const list = meshesByComp[c.id] || [], b = boxOfMeshes(list);
      compInfo[c.id] = { box: b, center: b.getCenter(new THREE.Vector3()), size: b.getSize(new THREE.Vector3()), meshes: list };
    });
    const missing = [];
    TAXO.comps.forEach(c => c.items.forEach(it => { const e = K.elems[c.id + ':' + it.i]; if (!e || !e.meshes.length) missing.push(c.id + ':' + it.i + ' ' + it.n); }));
    if (missing.length) console.warn('Elementos sin geometría:', missing);

    let triangles = 0;
    meshes.forEach(m => { const g = m.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3; triangles += n * (m.isInstancedMesh ? m.count : 1); });

    /* ---------- API ---------- */
    const state = K.state;
    const api = {
      root: K.root, kit: K, comps: K.comps, elems: K.elems, compInfo, units, meshes, ctxMeshes, meshesByElem, meshesByComp, shells: K.shells, state, missing, triangles,
      detail: K.detail, elemDoor: K.elemDoor, objBox, instBox, boxOfMeshes,
      setExplode(t) { K.expl.forEach(e => e.obj.position.copy(e.base).addScaledVector(e.vec, t)); },
      setRunning(v) { state.running = v; },
      setEstop(v) { state.estop = v; K.drawHmi && K.drawHmi(state.t); },
      setDoor(k, open) { state.doorT[k] = open ? 1 : 0; },
      // muestra solo un componente (vista "por separado"); null restaura todo
      setOnly(compId) {
        Object.keys(K.comps).forEach(id => { K.comps[id].visible = !compId || id === compId; });
        K.context.children.forEach(o => { if (!o.userData.floor) o.visible = !compId; });
        K.flows.forEach(f => { f.hidden = !!compId; });
      },
      dispose() {
        K.root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
        Object.values(K.matCache || {}).forEach(m => m.dispose());
      },
      update(dt) {
        state.t += dt;
        const run = state.running && !state.estop, target = run ? 4.0 : 0;
        state.speed += (target - state.speed) * Math.min(1, dt * 2.5);
        K.spinners.forEach(s => { s.obj.rotation[s.axis] += s.k * state.speed * dt; });
        K.anim.forEach(fn => fn(dt, state));
        if (K.cutPlates) { const p = run ? Math.max(0, Math.sin(state.t * 1.6)) : 0; K.cutPlates.forEach((q, i) => { q.position.z += ((-0.34 + (i ? 1 : -1) * p * 0.0 + p * 0.3 * (i ? 1 : 1)) - q.position.z) * Math.min(1, dt * 6); }); }
        K.flows.forEach(f => {
          f.p.visible = run && !f.hidden; if (!f.p.visible) return;
          f.offset = (f.offset + dt * f.speed / f.total * 0.9) % 1;
          const arr = f.p.geometry.attributes.position.array;
          for (let i = 0; i < f.n; i++) {
            let d = ((i / f.n + f.offset) % 1) * f.total, k = 0;
            while (k < f.lens.length - 1 && d > f.lens[k]) { d -= f.lens[k]; k++; }
            const a = f.pts[k], b = f.pts[k + 1], u = d / f.lens[k];
            arr[i * 3] = a.x + (b.x - a.x) * u; arr[i * 3 + 1] = a.y + (b.y - a.y) * u; arr[i * 3 + 2] = a.z + (b.z - a.z) * u;
          }
          f.p.geometry.attributes.position.needsUpdate = true;
        });
        if (K.pilotTall && K.pilotTall.material.emissive) K.pilotTall.material.emissive.setHex(run ? 0x18c04a : 0x0b3a1a);
      }
    };
    return api;
  };
})();
