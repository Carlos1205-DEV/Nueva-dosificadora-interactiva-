/* Motor de despiece (vista explosionada) para el modelo de la dosificadora.
 *  · Sección "en sitio": cada elemento de la sección se separa radialmente de su centro.
 *  · Sección "por separado": un ejemplar de cada elemento se acomoda en un tablero (catálogo) con el resto oculto.
 *  · Elemento: las piezas de cada ejemplar (mallas e instancias) se separan del centro de ese ejemplar. */
(function () {
  'use strict';
  window.createDespiece = function (model) {
    const THREE = window.THREE, V = (x, y, z) => new THREE.Vector3(x, y, z);
    const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const DUR = 0.85, EPS = 0.035;

    // dirección sobre una esfera (sesgada hacia arriba) para piezas que comparten centro
    function golden(i, n) {
      const y = 1 - (i + 0.5) / Math.max(1, n) * 1.5, r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.399963;
      return V(Math.cos(a) * r, y, Math.sin(a) * r).normalize();
    }

    /* ---------- piezas (mallas e instancias) con su caja mundial ---------- */
    function partsOf(meshes) {
      const parts = [], tb = new THREE.Box3(), tm = new THREE.Matrix4();
      meshes.forEach(m => {
        m.updateWorldMatrix(true, false); const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox();
        if (m.isInstancedMesh) {
          for (let i = 0; i < m.count; i++) {
            m.getMatrixAt(i, tm); const b = g.boundingBox.clone().applyMatrix4(tm).applyMatrix4(m.matrixWorld);
            parts.push({ type: 'inst', mesh: m, i, base: tm.clone(), box: b, c: b.getCenter(V()), size: b.getSize(V()) });
          }
        } else {
          const b = g.boundingBox.clone().applyMatrix4(m.matrixWorld);
          parts.push({ type: 'mesh', mesh: m, base: m.position.clone(), box: b, c: b.getCenter(V()), size: b.getSize(V()) });
        }
      });
      return parts;
    }
    // agrupa por cercanía espacial (unión-búsqueda): los ejemplares repetidos de un elemento quedan en grupos distintos
    function clusters(parts) {
      const n = parts.length, par = Array.from({ length: n }, (_, i) => i);
      const find = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
      const boxes = parts.map(p => p.box.clone().expandByScalar(EPS / 2));
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (boxes[i].intersectsBox(boxes[j])) { const a = find(i), b = find(j); if (a !== b) par[b] = a; }
      const map = new Map(); parts.forEach((p, i) => { const r = find(i); if (!map.has(r)) map.set(r, []); map.get(r).push(p); });
      return Array.from(map.values()).map(list => { const box = new THREE.Box3(); list.forEach(p => box.union(p.box)); return { parts: list, box }; });
    }
    const meshesUnder = obj => { const out = []; obj.traverse(o => { if ((o.isMesh || o.isInstancedMesh) && !o.userData.floor) out.push(o); }); return out; };

    /* ---------- capa de unidades (envoltorios de la sección) ---------- */
    function compLayer(compId, mode) {
      const list = model.units[compId], items = [], cBox = new THREE.Box3();
      const hidden = [];   // para restaurar en el modo tablero
      list.forEach(u => {
        let box = model.objBox(u.obj); if (box.isEmpty()) return;
        let rep = null;
        if (mode === 'sheet' && u.key) {
          // ejemplar representativo: el grupo espacial con más piezas; el resto se oculta
          const cl = clusters(partsOf(meshesUnder(u.obj)));
          if (cl.length > 1) {
            cl.sort((a, b) => b.parts.length - a.parts.length);
            rep = cl[0]; box = rep.box.clone();
            const keep = new Set(rep.parts);
            cl.slice(1).forEach(c => c.parts.forEach(p => {
              if (p.type === 'mesh') { if (p.mesh.visible) { p.mesh.visible = false; hidden.push(() => { p.mesh.visible = true; }); } }
              else { const z = new THREE.Matrix4().makeScale(1e-6, 1e-6, 1e-6); p.mesh.setMatrixAt(p.i, z); p.mesh.instanceMatrix.needsUpdate = true; hidden.push(() => { p.mesh.setMatrixAt(p.i, p.base); p.mesh.instanceMatrix.needsUpdate = true; }); }
            }));
          }
        }
        const size = box.getSize(V()); if (size.x + size.y + size.z < 1e-4) return;
        items.push({ u, box, c: box.getCenter(V()), size, key: u.key, multi: !!rep }); cBox.union(box);
      });
      if (items.length < 2) { hidden.forEach(f => f()); return null; }
      const cc = cBox.getCenter(V()), csz = cBox.getSize(V()), R = Math.max(csz.x, csz.y, csz.z) / 2;
      const L = { kind: 'comp', mode, id: compId, items, t: 0, target: 1, k: 1, center: cc, R };
      if (mode === 'radial') {
        items.forEach((it, idx) => {
          const d = it.c.clone().sub(cc), l = d.length();
          const dir = l < R * 0.06 ? golden(idx, items.length) : d.multiplyScalar(1 / l);
          if (dir.y < 0) dir.y *= 0.35; dir.normalize();
          it.dir = dir; it.mag = R * 0.4 + l * 1.0;
        });
        L.apply = t => items.forEach(it => it.u.obj.position.copy(it.dir).multiplyScalar(it.mag * L.k * t));
        L.centerAt = (it, t) => it.c.clone().addScaledVector(it.dir, it.mag * L.k * t);
        L.bounds = () => { const b = new THREE.Box3(); items.forEach(it => b.union(it.box.clone().translate(it.dir.clone().multiplyScalar(it.mag * L.k)))); return b; };
      } else {
        // tablero: empaquetado por filas; las piezas muy pequeñas se agrandan y las muy grandes se reducen (no a escala)
        const g = Math.max(0.12, R * 0.05);
        items.forEach(it => {
          const md = Math.max(it.size.x, it.size.y, it.size.z, 1e-3);
          it.s = md < 0.3 ? Math.min(0.3 / md, 14) : (md > 2.4 ? 2.4 / md : 1);
          it.w = it.size.x * it.s; it.h = it.size.y * it.s;
        });
        items.sort((a, b) => b.h - a.h);
        const maxW = Math.max(...items.map(i => i.w)), area = items.reduce((a, i) => a + (i.w + g) * (i.h + g), 0);
        const Wmax = Math.max(maxW + g, Math.sqrt(area * 1.8) * 1.05), rows = [];
        let row = null;
        items.forEach(it => {
          if (!row || row.w + it.w + g > Wmax) { row = { items: [], w: 0, h: 0 }; rows.push(row); }
          row.items.push(it); row.w += it.w + g; row.h = Math.max(row.h, it.h);
        });
        const H = rows.reduce((a, r) => a + r.h + g, 0), baseY = 0.6, cx = -0.35, cz = 0, Wsheet = Math.max(...rows.map(r => r.w));
        let y = baseY + H;
        rows.forEach(r => {
          let x = cx - r.w / 2 + g / 2; y -= r.h + g;
          r.items.forEach(it => {
            const T = V(x + it.w / 2, y + g / 2 + r.h / 2, cz);
            it.pos1 = T.clone().sub(it.c.clone().multiplyScalar(it.s)); x += it.w + g;
          });
        });
        L.sheetBox = new THREE.Box3(V(cx - Wsheet / 2, baseY, cz - 0.4), V(cx + Wsheet / 2, baseY + H, cz + 0.4));
        L.apply = t => items.forEach(it => { it.u.obj.position.copy(it.pos1).multiplyScalar(t); it.u.obj.scale.setScalar(1 + (it.s - 1) * t); });
        L.centerAt = (it, t) => it.pos1.clone().multiplyScalar(t).add(it.c.clone().multiplyScalar(1 + (it.s - 1) * t));
        L.bounds = () => L.sheetBox.clone();
      }
      L.reset = () => { items.forEach(it => { it.u.obj.position.set(0, 0, 0); it.u.obj.scale.set(1, 1, 1); }); hidden.forEach(f => f()); hidden.length = 0; };
      return L;
    }

    /* ---------- capa de piezas de un elemento ---------- */
    function elemLayer(key) {
      const e = model.elems[key]; if (!e) return null;
      const meshes = e.meshes.slice(); (e.extra || []).forEach(g => meshesUnder(g).forEach(o => { if (meshes.indexOf(o) < 0) meshes.push(o); }));
      const parts = partsOf(meshes); if (parts.length < 2) return null;
      const cls = clusters(parts).filter(c => c.parts.length >= 2);
      if (!cls.length) return null;
      const inv = new Map(), L = { kind: 'elem', id: key, parts: [], t: 0, target: 1, k: 1, clusters: cls };
      cls.forEach(cl => {
        const cc = cl.box.getCenter(V()), sz = cl.box.getSize(V()), R = Math.max(sz.x, sz.y, sz.z, 0.02) / 2;
        cl.parts.forEach((p, idx) => {
          const d = p.c.clone().sub(cc), l = d.length();
          let dir = l < R * 0.08 ? golden(idx, cl.parts.length) : d.multiplyScalar(1 / l);
          if (dir.y < 0) dir.y *= 0.4; dir.normalize();
          const frame = p.type === 'inst' ? p.mesh : p.mesh.parent, fs = frame.matrixWorld.getMaxScaleOnAxis() || 1;
          p.mag = (R * 0.6 + l * 1.0) / fs;
          if (!inv.has(frame)) inv.set(frame, new THREE.Matrix4().copy(frame.matrixWorld).invert());
          p.dir = dir; p.dirL = dir.clone().transformDirection(inv.get(frame)); p.fs = fs; L.parts.push(p);
        });
      });
      const tm = new THREE.Matrix4(), T = new THREE.Matrix4();
      L.apply = t => {
        const touched = new Set();
        L.parts.forEach(p => {
          const o = p.dirL.clone().multiplyScalar(p.mag * L.k * t);
          if (p.type === 'mesh') p.mesh.position.copy(p.base).add(o);
          else { T.makeTranslation(o.x, o.y, o.z); p.mesh.setMatrixAt(p.i, tm.copy(p.base).premultiply(T)); touched.add(p.mesh); }
        });
        touched.forEach(m => { m.instanceMatrix.needsUpdate = true; });
      };
      // encuadre: el primer ejemplar (el de más piezas) con su despiece completo
      L.bounds = () => {
        const cl = cls.slice().sort((a, b) => b.parts.length - a.parts.length)[0], b = cl.box.clone();
        cl.parts.forEach(p => b.expandByPoint(p.c.clone().addScaledVector(p.dir, p.mag * p.fs * L.k)));
        return b;
      };
      L.reset = () => L.apply(0);
      return L;
    }

    /* ---------- estado ---------- */
    const E = { comp: null, elem: null, only: null };
    function stepLayer(L, dt) {
      if (!L) return false;
      const dir = L.target > L.t ? 1 : -1, before = L.t;
      L.t = Math.max(0, Math.min(1, L.t + dir * dt / DUR));
      if ((dir > 0 && L.t >= L.target) || (dir < 0 && L.t <= L.target)) L.t = L.target;
      if (L.t !== before || L.dirty) { L.apply(ease(L.t)); L.dirty = false; }
      return L.t === L.target && L.target === 0;
    }
    function endComp() { const L = E.comp; if (L) L.reset(); E.comp = null; if (E.only) { model.setOnly(null); E.only = null; } }
    const api = {
      get comp() { return E.comp; }, get elem() { return E.elem; },
      active() { return !!(E.comp || E.elem); },
      startComp(compId, mode) {
        endComp();
        const L = compLayer(compId, mode); if (!L) return null;
        E.comp = L;
        if (mode === 'sheet') { model.setOnly(compId); E.only = compId; }
        return L;
      },
      startElem(key) { this.stopElem(true); const L = elemLayer(key); if (!L) return null; E.elem = L; return L; },
      stopComp(immediate) { const L = E.comp; if (!L) return; if (immediate || L.mode === 'sheet') endComp(); else L.target = 0; },
      stopElem(immediate) { const L = E.elem; if (!L) return; if (immediate) { L.reset(); E.elem = null; } else L.target = 0; },
      stopAll(immediate) { this.stopElem(immediate); this.stopComp(immediate); },
      setK(k) { [E.comp, E.elem].forEach(L => { if (L && (L.kind === 'elem' || L.mode === 'radial')) { L.k = k; L.dirty = true; } }); },
      update(dt) {
        if (stepLayer(E.elem, dt)) { E.elem.reset(); E.elem = null; }
        if (stepLayer(E.comp, dt)) endComp();
      },
      // números de elemento para el tablero/despiece (posición mundial actual)
      pins() {
        const L = E.comp; if (!L) return [];
        const t = ease(L.t), out = [];
        L.items.forEach(it => {
          const c = L.centerAt(it, t), sc = L.mode === 'sheet' ? 1 + (it.s - 1) * t : 1;
          out.push({ key: it.key, name: it.u.name, multi: it.multi, pos: V(c.x, c.y + it.size.y * sc / 2 + 0.04, c.z) });
        });
        return out;
      },
      bounds() { const L = E.elem || E.comp; return L ? L.bounds() : null; },
      // centro y tamaño actuales (con el despiece aplicado) de un elemento de la capa de sección
      itemInfo(key) {
        const L = E.comp; if (!L) return null; const it = L.items.find(i => i.key === key); if (!it) return null;
        const sc = L.mode === 'sheet' ? it.s : 1;
        return { center: L.centerAt(it, ease(L.t)), size: it.size.clone().multiplyScalar(sc) };
      }
    };
    return api;
  };
})();
