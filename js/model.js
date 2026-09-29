/* Ensamblado del modelo 3D de la DOSIFICADORA (moldeadora multiformato) a partir de la taxonomía.
 * Cada componente (19) es un grupo; cada elemento de la taxonomía (295) es un sub-grupo seleccionable. */
(function () {
  'use strict';
  window.createDosificadoraModel = function () {
    const K = window.createKit(), THREE = K.THREE, TAXO = window.TAXO;
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
    flowLine([[H.x, 0.72, H.z + 0.6], [H.x, 0.72, H.z + 0.02], [H.x, 1.98, H.z], [H.x, 2.6, H.z], [2.15, 2.6, H.z], [2.15, 2.6, 0.17], [1.5, 2.6, 0.17], [1.5, 3.02, 0.17]], 0x7fb2ff, 48, 0.035, 0.5);
    flowLine([[H.x + 0.55, 2.15, H.z], [H.x + 0.55, 1.62, H.z], [H.x + 0.14, 1.62, H.z]], 0xffffff, 18, 0.04, 0.6);

    /* ---------- registro y cajas envolventes ---------- */
    const meshes = [], meshesByElem = {}, meshesByComp = {};
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
      if (o.userData.context) return;
      meshes.push(o);
      (meshesByComp[k.comp] = meshesByComp[k.comp] || []).push(o);
      if (k.elem) (meshesByElem[k.elem] = meshesByElem[k.elem] || []).push(o);
    });
    const tmp = new THREE.Box3();
    function boxOf(list) {
      const b = new THREE.Box3();
      list.forEach(o => { if (o.isInstancedMesh) { o.computeBoundingBox && o.computeBoundingBox(); tmp.copy(o.boundingBox || new THREE.Box3().setFromObject(o)).applyMatrix4(o.matrixWorld); } else tmp.setFromObject(o); b.union(tmp); });
      return b;
    }
    // InstancedMesh.computeBoundingBox no existe en r14x: calcular a mano
    function instBox(o) {
      const b = new THREE.Box3(), m = new THREE.Matrix4(), g = o.geometry; if (!g.boundingBox) g.computeBoundingBox();
      const gb = g.boundingBox; const t = new THREE.Box3();
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); t.copy(gb).applyMatrix4(m); b.union(t); }
      return b.applyMatrix4(o.matrixWorld);
    }
    function boxOfMeshes(list) {
      const b = new THREE.Box3();
      list.forEach(o => { b.union(o.isInstancedMesh ? instBox(o) : tmp.setFromObject(o).clone()); });
      return b;
    }
    Object.values(K.elems).forEach(e => {
      const list = meshesByElem[e.key] || [];
      e.meshes = list; e.box = list.length ? boxOfMeshes(list) : new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
      e.center = e.box.getCenter(new THREE.Vector3()); e.size = e.box.getSize(new THREE.Vector3());
    });
    const compInfo = {};
    TAXO.comps.forEach(c => {
      const list = meshesByComp[c.id] || [];
      const b = boxOfMeshes(list);
      compInfo[c.id] = { box: b, center: b.getCenter(new THREE.Vector3()), size: b.getSize(new THREE.Vector3()), meshes: list };
    });

    // verificación de cobertura de la taxonomía
    const missing = [];
    TAXO.comps.forEach(c => c.items.forEach(it => { const e = K.elems[c.id + ':' + it.i]; if (!e || !e.meshes.length) missing.push(c.id + ':' + it.i + ' ' + it.n); }));
    if (missing.length) console.warn('Elementos sin geometría:', missing);

    /* ---------- API ---------- */
    const state = K.state;
    const api = {
      root: K.root, kit: K, comps: K.comps, elems: K.elems, compInfo, meshes, meshesByElem, meshesByComp, shells: K.shells, state, missing,
      elemDoor: K.elemDoor,
      setExplode(t) { K.expl.forEach(e => e.obj.position.copy(e.base).addScaledVector(e.vec, t)); },
      setRunning(v) { state.running = v; },
      setEstop(v) { state.estop = v; K.drawHmi && K.drawHmi(state.t); },
      setDoor(k, open) { state.doorT[k] = open ? 1 : 0; },
      update(dt) {
        state.t += dt;
        const run = state.running && !state.estop, target = run ? 4.0 : 0;
        state.speed += (target - state.speed) * Math.min(1, dt * 2.5);
        K.spinners.forEach(s => { s.obj.rotation[s.axis] += s.k * state.speed * dt; });
        K.anim.forEach(fn => fn(dt, state));
        // ciclo de las cuchillas
        if (K.corteSup) { const p = run ? Math.max(0, Math.sin(state.t * 1.6)) : 0; K.corteSup.position.z += ((-0.31 + p * 0.26) - K.corteSup.position.z) * Math.min(1, dt * 6); }
        if (K.corteDel) { const p = run ? 0.5 - 0.5 * Math.cos(state.t * 1.2) : 0; K.corteDel.position.y += ((2.34 - p * 0.14) - K.corteDel.position.y) * Math.min(1, dt * 6); }
        if (K.repDoor) { const p = run ? 0.5 - 0.5 * Math.cos(state.t * 0.9) : 0; K.repDoor.position.x += (((K.L.hopper.x0 + K.L.hopper.x1) / 2 - p * 0.7) - K.repDoor.position.x) * Math.min(1, dt * 5); }
        K.flows.forEach(f => {
          f.p.visible = run; if (!run) return;
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
        if (K.pilotTall) K.pilotTall.material.emissive && (K.pilotTall.material.emissive.setHex(run ? 0x18c04a : 0x0b3a1a));
      }
    };
    return api;
  };
})();
