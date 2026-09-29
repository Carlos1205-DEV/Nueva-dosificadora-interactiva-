/* CASSETTE DE CUCHILLAS DE MOLDEO (14) · SISTEMA DE CORTE (17) · REPARTIDOR DE CUAJADA (26)
 * Referencia: imágenes 52 (cassette), 67-68 (corte), 59-66 (repartidor) del Excel. */
(function () {
  'use strict';
  window.MODEL_BUILDERS.push(function (K) {
    const { THREE, PI, TAU, el, comps, box, rbox, cyl, torus, sphere, lathe, extrude, merge, tr, put, bolts, nuts, washers, line, grid, pipe, hose, clamp, inst, mat, mesh, explode, spin, geo, anim, extra } = K;
    const L = K.L, S = K.parts, V = K.V3;

    // tronco de pirámide rectangular (y ± h/2)
    K.frustum = function (wt, dt, wb, db, h, m, o) {
      const pos = [], idx = [];
      const T = [[-wt / 2, h / 2, -dt / 2], [wt / 2, h / 2, -dt / 2], [wt / 2, h / 2, dt / 2], [-wt / 2, h / 2, dt / 2]];
      const B = [[-wb / 2, -h / 2, -db / 2], [wb / 2, -h / 2, -db / 2], [wb / 2, -h / 2, db / 2], [-wb / 2, -h / 2, db / 2]];
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4, b = pos.length / 3; [T[i], T[j], B[j], B[i]].forEach(v => pos.push(v[0], v[1], v[2])); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      return mesh(g, m, Object.assign({ mat: { side: THREE.DoubleSide } }, o));
    };
    // placa con ranuras rectangulares (x0,z0,ancho,largo por ranura, en coordenadas locales) y orificios redondos
    function slotted(w, d, t, slots, holes, m, o) {
      const s = new THREE.Shape(); s.moveTo(-w / 2, -d / 2); s.lineTo(w / 2, -d / 2); s.lineTo(w / 2, d / 2); s.lineTo(-w / 2, d / 2); s.closePath();
      (slots || []).forEach(q => { const p = new THREE.Path(); p.moveTo(q[0] - q[2] / 2, q[1] - q[3] / 2); p.lineTo(q[0] - q[2] / 2, q[1] + q[3] / 2); p.lineTo(q[0] + q[2] / 2, q[1] + q[3] / 2); p.lineTo(q[0] + q[2] / 2, q[1] - q[3] / 2); p.closePath(); s.holes.push(p); });
      (holes || []).forEach(q => { const p = new THREE.Path(); p.absarc(q[0], q[1], q[2], 0, TAU, true); s.holes.push(p); });
      const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 40 });
      g.rotateX(PI / 2); g.translate(0, t / 2, 0);   // el plano queda horizontal (XZ), grosor hacia -Y
      return mesh(g, m, o);
    }
    K.slotted = slotted;

    /* =========================================================
     *  CASSETTE DE CUCHILLAS DE MOLDEO (14) — imagen 52
     *  Tanque con bolas de lavado + placa "portatubos" de 5 orificios + patines y guías + fijaciones
     * ========================================================= */
    {
      const C = 'cassette', tk = L.tank, W = tk.x1 - tk.x0, D = tk.z1 - tk.z0, H = tk.y1 - tk.y0, cx = (tk.x0 + tk.x1) / 2, cz = (tk.z0 + tk.z1) / 2, y0 = tk.y0;
      const g = {}; for (let i = 1; i <= 14; i++) g[i] = el(C, i);
      // ---------- tanque (carcasa) ----------
      const body = extra(C, 'tanque');
      body.add(rbox(W, H, 0.008, 0.002, 'steel', { pos: [cx, y0 + H / 2, tk.z1], shell: true }));
      body.add(rbox(W, H, 0.008, 0.002, 'steel', { pos: [cx, y0 + H / 2, tk.z0], shell: true }));
      [tk.x0, tk.x1].forEach(x => body.add(rbox(0.008, H, D, 0.002, 'steel', { pos: [x, y0 + H / 2, cz], shell: true })));
      // embudos interiores (láminas inclinadas en los extremos) y reborde superior
      [-1, 1].forEach(s => { const f = rbox(0.008, H * 0.8, D * 0.92, 0.002, 'steelDark', { pos: [cx + s * (W / 2 - 0.11), y0 + H * 0.62, cz], shell: true }); f.rotation.z = s * 0.4; body.add(f); });
      [tk.z0, tk.z1].forEach(z => body.add(rbox(W + 0.06, 0.03, 0.05, 0.004, 'steel', { pos: [cx, tk.y1, z] })));
      [tk.x0, tk.x1].forEach(x => body.add(rbox(0.05, 0.03, D + 0.06, 0.004, 'steel', { pos: [x, tk.y1, cz] })));
      // brida inferior
      body.add(slotted(W + 0.08, D + 0.08, 0.012, [[0, 0, W - 0.03, D - 0.03]], null, 'steel', { pos: [cx, y0 - 0.0, cz] }));
      // nervaduras verticales (efecto "reja" de las fotos)
      const ribs = []; for (let i = 0; i < 24; i++) ribs.push({ p: [tk.x0 + 0.1 + i * (W - 0.2) / 23, y0 + H / 2, tk.z1 + 0.006] }, { p: [tk.x0 + 0.1 + i * (W - 0.2) / 23, y0 + H / 2, tk.z0 - 0.006] });
      body.add(inst(geo('rib', () => new THREE.BoxGeometry(0.012, H * 0.96, 0.006)), 'steelDark', ribs));
      // tubos de lavado sobre la cara frontal + bolas (2) + válvulas (1) + codos con tapón esférico
      const zp = tk.z1 + 0.07, pys = [y0 + 0.14, y0 + 0.34], ballPos = [];
      pys.forEach(y => {
        g[2].add(pipe([[tk.x0 + 0.02, y, zp], [tk.x1 - 0.02, y, zp]], 0.016, 'steel', { radial: 24 }));
        for (let i = 0; i < 11; i++) {
          const x = tk.x0 + 0.13 + i * (W - 0.26) / 10;
          g[2].add(pipe([[x, y - 0.01, zp], [x, y - 0.045, zp - 0.035], [x, y - 0.06, tk.z1 - 0.03]], 0.006, 'steel', { radial: 10, bend: 0.03 }));
          ballPos.push({ p: [x, y - 0.078, tk.z1 - 0.045], r: [PI, 0, 0] });
        }
      });
      g[2].add(inst(K.sprayBall28, 'steel', ballPos));
      // elevador izquierdo: dos ramales con válvula de mariposa OD51 T1 y racords
      [0, 1].forEach(k => {
        const y = pys[k], x = tk.x0 - 0.2;
        g[1].add(pipe([[tk.x0 + 0.02, y, zp], [tk.x0 - 0.07, y, zp]], 0.016, 'steel', { radial: 24 }));
        const v = S.butterfly(51, 'T1'); v.position.set(x + 0.02, y, zp); g[1].add(v);
        g[1].add(clamp(x + 0.02 - 0.08, y, zp, 'x', 0.0255)); g[1].add(clamp(x + 0.02 + 0.08, y, zp, 'x', 0.0255));
        g[1].add(pipe([[x + 0.0 - 0.09, y, zp], [x - 0.3, y, zp], [x - 0.3, y - 0.45 - k * 0.12, zp]], 0.016, 'steel', { radial: 24, bend: 0.06 }));
      });
      // codos con tapón esférico (extremo derecho)
      pys.forEach((y, k) => { const e = extra(C, 'codo' + k); e.add(pipe([[tk.x1 - 0.02, y, zp], [tk.x1 + 0.1, y, zp], [tk.x1 + 0.1, y + 0.22 + k * 0.05, zp]], 0.016, 'steel', { radial: 24, bend: 0.07 })); e.add(sphere(0.034, 'steel', { pos: [tk.x1 + 0.1, y + 0.24 + k * 0.05, zp] })); e.add(cyl(0.024, 0.024, 0.02, 'steelDark', { pos: [tk.x1 + 0.1, y + 0.22 + k * 0.05, zp], seg: 32 })); });

      // ---------- (3) junta del cassette (marco de EPDM entre tanque y placa) ----------
      const j = K.frameGasket(W - 0.02, D - 0.02, 0.016, 0.008, 'epdm', { pos: [cx, y0 - 0.006, cz] }); j.rotation.x = -PI / 2; g[3].add(j);
      // ---------- (9) portatubos: placa azul con 5 orificios ----------
      const holes = []; for (let i = 0; i < 5; i++) holes.push([-0.92 + i * 0.46, 0, 0.16]);
      g[9].add(slotted(W - 0.02, D - 0.02, 0.055, null, holes, 'blueLight', { pos: [cx, y0 - 0.014, cz], mat: { metalness: 0.15, roughness: 0.45 } }));
      // aros roscados de los orificios
      holes.forEach(h => g[9].add(torus(0.16, 0.006, 'blue', { axis: 'y', pos: [cx + h[0], y0 - 0.012, cz + h[1]], seg: 40 })));
      // ---------- fijaciones: (4) muelles disco ×41, (5) arandelas DIN125 ×41, (10) tirafondos ×41 ----------
      const fp = [];
      for (let i = 0; i < 15; i++) { const x = tk.x0 + 0.05 + i * (W - 0.1) / 14; fp.push([x, tk.z1 - 0.022], [x, tk.z0 + 0.022]); }
      [-1, 1].forEach(s => [0, 1, 2].forEach(k => fp.push([cx + s * (W / 2 - 0.022), tk.z0 + 0.12 + k * 0.16])));
      for (let i = 0; i < 5; i++) fp.push([cx - 0.69 + i * 0.46 + 0.23 * 0, cz]);
      const fp41 = fp.slice(0, 41), yb = y0 - 0.075;
      g[4].add(inst(geo('discSp', () => merge([0, 1, 2].map(i => { const q = new THREE.CylinderGeometry(0.008, 0.016, 0.006, 20, 1, true); q.translate(0, i * 0.0075, 0); return q; }))), 'iglidur', fp41.map(p => ({ p: [p[0], yb - 0.02, p[1]] })), { mat: { side: THREE.DoubleSide } }));
      g[5].add(inst(K.washerGeo(0.005), 'steel', fp41.map(p => ({ p: [p[0], yb - 0.0, p[1]] }))));
      g[10].add(inst(K.boltGeo(0.005, 0.06), 'steelDark', fp41.map(p => ({ p: [p[0], yb - 0.045, p[1]], r: [PI, 0, 0] }))));
      // ---------- (8) tornillos ST8x38 ×74 en la brida del tanque; (7) DIN 7972 ×24 en los patines ----------
      const p8 = []; for (let i = 0; i < 37; i++) { p8.push([tk.x0 + 0.03 + i * (W - 0.06) / 36, y0 + 0.02, tk.z1 + 0.033], [tk.x0 + 0.03 + i * (W - 0.06) / 36, y0 + 0.02, tk.z0 - 0.033]); }
      g[8].add(bolts(p8.map(p => [p[0], p[1], p[2] + (p[2] > cz ? 0.005 : -0.005)]), 0.008, 0.038, p8[0] ? 'z' : 'z', { mat: 'steel' }));
      // ---------- (6)(11) patines traseros (barras azules dentadas), (12) guías laterales, (14) guías centrales, (13) arandelas ----------
      const yb2 = y0 - 0.1, serr = (len) => geo('serr' + len, () => { const teeth = []; for (let i = 0; i < 14; i++) teeth.push(tr(new THREE.BoxGeometry(0.012, 0.022, 0.014), (i - 6.5) * len / 14, -0.026, 0)); return merge(teeth.concat([new THREE.BoxGeometry(len, 0.016, 0.03)])); });
      g[6].add(mesh(serr(0.5), 'blueLight', { pos: [tk.x0 + 0.13, yb2, cz], rot: [0, PI / 2, 0] }));
      g[11].add(mesh(serr(0.5), 'blueLight', { pos: [tk.x1 - 0.13, yb2, cz], rot: [0, PI / 2, 0] }));
      [-1, 1].forEach(s => g[12].add(mesh(serr(1.1), 'blue', { pos: [cx + s * 0.45 * 0, yb2 - 0.01, cz + s * (D / 2 - 0.05)] })));
      [-0.68, -0.23, 0.23, 0.68].forEach(x => g[14].add(rbox(0.035, 0.016, D - 0.1, 0.003, 'blue', { pos: [cx + x, yb2 - 0.02, cz] })));
      const p13 = []; [-1, 1].forEach(s => [0, 1, 2].forEach(k => [-1, 1].forEach(z => p13.push([cx + s * (W / 2 - 0.16) + (k - 1) * 0.02, yb2 + 0.012, cz + z * 0.19 * (k + 1) / 3 * 2]))));
      g[13].add(washers(p13.slice(0, 12), 0.01, 'y'));
      g[7].add(bolts(Array.from({ length: 24 }, (_, i) => [cx - 0.68 + (i % 4) * 0.45, yb2 - 0.014, cz + (Math.floor(i / 4) - 2.5) * 0.08]), 0.0055, 0.019, 'y', { mat: 'steel' }));
      // marco inferior rectangular (no listado)
      const fm = extra(C, 'marco'); fm.add(slotted(W + 0.2, D + 0.18, 0.02, [[0, 0, W + 0.1, D + 0.08]], null, 'steelDark', { pos: [cx, y0 - 0.17, cz] }));
      [-0.6, 0.6].forEach(x => fm.add(rbox(0.05, 0.05, D + 0.36, 0.006, 'steelDark', { pos: [cx + x, y0 - 0.19, cz] })));
      explode(body, 0, 0.5, 0); explode(g[9], 0, -0.25, 0); explode(g[6], 0, -0.4, 0); explode(g[11], 0, -0.4, 0); explode(g[14], 0, -0.4, 0); explode(g[12], 0, -0.4, 0); explode(fm, 0, -0.6, 0);
    }

    /* =========================================================
     *  SISTEMA DE CORTE (17) — imágenes 67-68
     *  Dos placas ranuradas (cuchilla delantera y superior) que se deslizan bajo las columnas,
     *  con cremalleras, piñones, eje y cilindro. Viga larga frontal.
     * ========================================================= */
    {
      const C = 'corte', tk = L.tank, W = tk.x1 - tk.x0, cx = (tk.x0 + tk.x1) / 2, yb = L.deckY - 0.075, z0 = -0.34;
      const g = {}; for (let i = 1; i <= 17; i++) g[i] = el(C, i);
      // 5 cuchilla delantera (mitad izquierda) y 7 cuchilla superior (mitad derecha): placas ranuradas
      const slotsA = [[-0.4, 0, 0.012, 0.6], [-0.2, 0, 0.012, 0.6], [0, 0, 0.012, 0.6], [0.2, 0, 0.012, 0.6], [0.4, 0, 0.012, 0.6]];
      const pA = new THREE.Group(), pB = new THREE.Group(); pA.position.set(cx - W / 4, yb, z0); pB.position.set(cx + W / 4, yb, z0); g[5].add(pA); g[7].add(pB);
      pA.add(slotted(W / 2 - 0.02, 0.85, 0.006, slotsA.map(s => [s[0], s[1], s[2] * 2, s[3]]), null, 'steel', { mat: { roughness: 0.14 } }));
      pB.add(slotted(W / 2 - 0.02, 0.85, 0.006, slotsA.map(s => [s[0] + 0.0, s[1], s[2] * 2, s[3]]), null, 'steel', { mat: { roughness: 0.14 } }));
      [pA, pB].forEach((p, k) => { p.add(rbox(W / 2 - 0.02, 0.05, 0.05, 0.004, 'steelDark', { pos: [0, 0.025, -0.4] })); p.add(rbox(0.04, 0.05, 0.85, 0.004, 'steelDark', { pos: [k ? 0.55 : -0.55, 0.025, 0] })); });
      K.cutPlates = [pA, pB];
      // 6 patines de la cuchilla delantera ×2 (azules)
      [-1, 1].forEach(s => g[6].add(rbox(0.06, 0.03, 0.05, 0.005, 'blueLight', { pos: [cx - W / 2 + 0.05, yb + 0.02, z0 + s * 0.4] })));
      // viga larga frontal (perfil C) con soportes y cilindro
      const vg = extra(C, 'viga');
      vg.add(rbox(W + 0.4, 0.14, 0.06, 0.006, 'panel', { pos: [cx + 0.1, yb + 0.06, 0.22] })); vg.add(rbox(W + 0.4, 0.02, 0.14, 0.004, 'panel', { pos: [cx + 0.1, yb + 0.13, 0.26] })); vg.add(rbox(W + 0.4, 0.02, 0.14, 0.004, 'panel', { pos: [cx + 0.1, yb - 0.01, 0.26] }));
      const hb = []; for (let i = 0; i < 28; i++) hb.push([cx - 1.1 + i * 0.085, yb + 0.06, 0.255]); vg.add(bolts(hb, 0.005, 0.014, 'z', { mat: 'steel' }));
      // 11 eje de piñones (largo) + 12 piñones ×2 + 13 soportes UCFL-204 ×2 + 14 tapas cerradas ×2
      const sy = yb + 0.14, sz = 0.2;
      g[11].add(cyl(0.01, 0.01, W + 0.35, 'steel', { axis: 'x', pos: [cx, sy, sz], seg: 24, mat: { roughness: 0.15 } }));
      [-1, 1].forEach(s => {
        const p = S.sprocket(0.035, 14, 0.04, 'steelDark'); p.rotation.y = PI / 2; p.position.set(cx + s * (W / 2 + 0.04), sy, sz); g[12].add(p);
        const b = S.ucfl(20); b.rotation.y = PI / 2 * s; b.position.set(cx + s * (W / 2 + 0.13), sy, sz); g[13].add(b);
        g[14].add(cyl(0.026, 0.026, 0.04, 'steel', { axis: 'x', pos: [cx + s * (W / 2 + 0.19), sy, sz], seg: 24 }));
      });
      // 3 cremalleras ×4 (dientes instanciados) sobre los bordes de las placas + 17 patines guía ×4
      const tooth = geo('rackTooth2', () => new THREE.BoxGeometry(0.03, 0.02, 0.0045));
      const rackX = [cx - W / 2 - 0.02, cx - W / 2 + 0.02, cx + W / 2 - 0.02, cx + W / 2 + 0.02];
      rackX.forEach((x, k) => {
        const rk = new THREE.Group(); rk.position.set(x, yb + 0.03, z0); g[3].add(rk); rk.add(rbox(0.03, 0.03, 0.7, 0.003, 'steelDark', {}));
        const tl = []; for (let i = 0; i < 60; i++) tl.push({ p: [0, 0.024, -0.34 + i * 0.0115] }); rk.add(inst(tooth, 'steel', tl));
        g[17].add(rbox(0.04, 0.03, 0.09, 0.003, 'uhmw', { pos: [x, yb - 0.015, z0 + (k % 2 ? 0.2 : -0.2)] }));
        // 9 dollas con espárrago + 2 pasadores + 10 pasadores de aletas
        g[9].add(cyl(0.007, 0.007, 0.05, 'steelDark', { pos: [x, yb + 0.07, z0 + 0.3], seg: 12 })); g[2].add(cyl(0.009, 0.009, 0.04, 'steel', { axis: 'z', pos: [x, yb + 0.03, z0 + 0.36], seg: 20 })); g[10].add(torus(0.006, 0.0012, 'steelDark', { pos: [x, yb + 0.03, z0 + 0.385], seg: 12 }));
      });
      // 1 tuercas autoblocantes M8 ×8, 8 arandelas Ø12 ×12, 15 tornillos ST6.3x25 ×16, 16 arandelas Ø6 ×16 en la viga y placas
      const nP = []; rackX.forEach(x => { nP.push([x, yb + 0.1, z0 + 0.3], [x, yb + 0.055, z0 + 0.3]); });
      g[1].add(nuts(nP, 0.0078, 'y')); g[8].add(washers(nP.concat(nP.slice(0, 4)).map(p => [p[0], p[1] + 0.008, p[2]]), 0.012, 'y'));
      const fx = Array.from({ length: 16 }, (_, i) => [cx - 0.7 + (i % 8) * 0.2, yb + 0.02, z0 - 0.42 + (i < 8 ? 0 : 0.84)]);
      g[15].add(bolts(fx, 0.0063, 0.025, 'y', { mat: 'steel' })); g[16].add(washers(fx.map(p => [p[0], p[1] + 0.001, p[2]]), 0.0063, 'y'));
      // 4 cilindro CRDNG Ø100 c.165 en el extremo de la viga
      const cy = S.pneuCyl(100, 0.165); cy.rotation.y = PI / 2; cy.position.set(cx + W / 2 + 0.36, yb + 0.06, 0.18); g[4].add(cy);
      g[4].add(rbox(0.2, 0.13, 0.16, 0.008, 'steelDark', { pos: [cx + W / 2 + 0.22, yb + 0.06, 0.2] }));
      explode(g[5], 0, 0.0, 0.7); explode(g[7], 0, 0.0, -0.7); explode(vg, 0, 0, 0.6);
    }

    /* =========================================================
     *  REPARTIDOR DE CUAJADA (26) — imágenes 59-66
     *  Torre de protección + carro con tolva inclinada que corre sobre el cilindro sin vástago DGO-40
     *  + dos mangueras azules en U + mallas de protección y puerta corredera.
     * ========================================================= */
    {
      const C = 'repartidor', R = L.rail, tk = L.tank, roofY = L.roofY, dk = L.deckY;
      const g = {}; for (let i = 1; i <= 26; i++) g[i] = el(C, i);
      const tz0 = -0.72, tz1 = 0.2;   // profundidad de la torre
      // ---------- torre: postes, techo y barras ----------
      const tw = extra(C, 'torre');
      [-1.45, 1.45].forEach(x => [tz0, tz1].forEach(z => tw.add(rbox(0.06, roofY - dk, 0.06, 0.006, 'brushed', { pos: [x, (roofY + dk) / 2, z] }))));
      [-1.45, 1.45].forEach(x => { tw.add(rbox(0.06, 0.06, tz1 - tz0 + 0.06, 0.006, 'brushed', { pos: [x, roofY - 0.05, (tz0 + tz1) / 2] })); tw.add(rbox(0.06, 0.06, tz1 - tz0, 0.006, 'brushed', { pos: [x, dk + 0.28, (tz0 + tz1) / 2] })); });
      tw.add(rbox(2.98, 0.02, 1.02, 0.004, 'panelDark', { pos: [0, roofY + 0.03, (tz0 + tz1) / 2 + 0.05], mat: { metalness: 0.7 } }));
      [[-1.3], [1.3]].forEach(([x]) => tw.add(rbox(0.06, 0.05, 0.06, 0.004, 'blueLight', { pos: [x, roofY + 0.0, tz0 + 0.02] })));
      [tz0, tz1].forEach(z => tw.add(rbox(2.9, 0.05, 0.05, 0.006, 'brushed', { pos: [0, roofY - 0.05, z] })));
      // mallas de protección: laterales y frontal (puerta corredera)
      const meshL = new THREE.Mesh(new THREE.PlaneGeometry(tz1 - tz0 - 0.06, roofY - dk - 0.5), K.meshPanel(tz1 - tz0, roofY - dk - 0.5, 0.05)); meshL.rotation.y = PI / 2;
      [-1.45, 1.45].forEach((x, i) => { const m = meshL.clone(); m.position.set(x + (i ? -0.003 : 0.003), (roofY + dk) / 2 + 0.15, (tz0 + tz1) / 2); tw.add(m); });
      const bmesh = new THREE.Mesh(new THREE.PlaneGeometry(2.86, 0.55), K.meshPanel(2.86, 0.55, 0.05)); bmesh.position.set(0, dk + 0.55, tz0 + 0.003); tw.add(bmesh);
      // puerta corredera (malla frontal) con marco, barra superior y 8 patines
      const dr = extra(C, 'puerta'); K.frontDoor = dr;
      dr.add(rbox(2.9, 0.035, 0.035, 0.005, 'steelDark', { pos: [0, 3.36, tz1 + 0.01] })); dr.add(rbox(2.9, 0.035, 0.035, 0.005, 'steelDark', { pos: [0, 2.04, tz1 + 0.01] }));
      [-1.44, 1.44].forEach(x => dr.add(rbox(0.035, 1.35, 0.035, 0.005, 'steelDark', { pos: [x, 2.7, tz1 + 0.01] })));
      const fmesh = new THREE.Mesh(new THREE.PlaneGeometry(2.86, 1.3), K.meshPanel(2.86, 1.3, 0.05)); fmesh.position.set(0, 2.7, tz1 + 0.012); dr.add(fmesh);
      dr.add(cyl(0.012, 0.012, 2.6, 'steel', { axis: 'x', pos: [0, 3.24, tz1 + 0.06], seg: 16 }));
      [-1.4, 1.4].forEach(x => dr.add(rbox(0.02, 0.05, 0.05, 0.003, 'steelDark', { pos: [x, 3.24, tz1 + 0.035] })));
      // 8 guías superiores de la tapa deslizante ×2; 9, 10 patines de la puerta; 11 posicionador de presión GN722
      [0, 1].forEach(k => g[8].add(rbox(3.0, 0.045, 0.045, 0.005, 'brushed', { pos: [0, 3.42 - k * 0.0, tz1 - 0.055 + k * 0.17] })));
      [-1.35, -0.45, 0.45, 1.35].forEach(x => { g[9].add(rbox(0.07, 0.03, 0.04, 0.005, 'blueLight', { pos: [x, 3.39, tz1 + 0.012] })); g[10].add(rbox(0.07, 0.03, 0.04, 0.005, 'blueLight', { pos: [x, 2.01, tz1 + 0.012] })); });
      g[11].add(cyl(0.012, 0.012, 0.05, 'steel', { pos: [1.44, 2.75, tz1 + 0.05], seg: 20 })); g[11].add(sphere(0.014, 'yellow', { pos: [1.44, 2.785, tz1 + 0.05] })); g[11].add(rbox(0.05, 0.08, 0.02, 0.004, 'yellow', { pos: [1.47, 2.75, tz1 + 0.03] }));

      // ---------- guías del carro: cilindro sin vástago DGO-40 (7) y viga de apoyo ----------
      const zr = R.z - 0.3, zc = R.z + 0.3, len = R.x1 - R.x0 + 0.5, cxr = (R.x0 + R.x1) / 2;
      g[7].add(cyl(0.03, 0.03, len, 'steel', { axis: 'x', pos: [cxr, R.y, zr], seg: 40, mat: { roughness: 0.12 } }));
      g[7].add(rbox(0.012, 0.018, len, 0.002, 'steelDark', { pos: [cxr, R.y + 0.03, zr], rot: [0, PI / 2, 0] }));
      [-1, 1].forEach(s => g[7].add(rbox(0.08, 0.09, 0.09, 0.008, 'anodized', { pos: [cxr + s * (len / 2 + 0.03), R.y, zr] })));
      const beam = extra(C, 'viga'); beam.add(rbox(len, 0.06, 0.08, 0.005, 'panel', { pos: [cxr, R.y - 0.14, zc] })); beam.add(rbox(len, 0.012, 0.09, 0.003, 'panel', { pos: [cxr, R.y - 0.11, zc] }));
      [-1, 1].forEach(s => { beam.add(rbox(0.04, 0.5, 0.05, 0.005, 'brushed', { pos: [cxr + s * (len / 2 - 0.02), R.y - 0.32, zc] })); beam.add(rbox(0.04, 0.2, 0.05, 0.005, 'brushed', { pos: [cxr + s * (len / 2 - 0.02), R.y - 0.05, zr] })); });

      // ---------- carro (todo lo que se mueve): posición local respecto al origen (0, R.y, R.z) ----------
      const car = []; const cE = i => { const q = g[i]; car.push(q); return q; };
      const ox = 0, oy = R.y, oz = R.z;
      // (15) ruedas de poliuretano ×4, (14) rodamientos 6204 ×8, (16) distanciadores ×4
      [[-0.22, zr], [0.22, zr], [-0.22, zc], [0.22, zc]].forEach(([x, z]) => {
        const rz = z === zr ? oy - 0.0 : oy - 0.11, ry = z === zr ? 0.0 : 0.0;
        cE(15).add(cyl(0.04, 0.04, 0.034, 'orange', { axis: 'z', pos: [x, rz - 0.0, z + (z === zr ? 0 : 0)], seg: 40, mat: { roughness: 0.5, metalness: 0.05 } }));
        cE(16).add(cyl(0.012, 0.012, 0.05, 'steel', { axis: 'z', pos: [x, rz, z], seg: 20 }));
        [-1, 1].forEach(k => { const b = S.bearing(0.0235, 0.01, 0.014, 'blue'); b.position.set(x, rz, z + k * 0.02); cE(14).add(b); });
      });
      // base del carro: placas laterales y travesaños
      const base = extra(C, 'carro'); car.push(base);
      [-0.27, 0.27].forEach(x => base.add(rbox(0.025, 0.3, 0.66, 0.004, 'steelDark', { pos: [x, oy - 0.03, (zr + zc) / 2] })));
      base.add(rbox(0.56, 0.02, 0.66, 0.004, 'steelDark', { pos: [0, oy + 0.12, (zr + zc) / 2] })); base.add(rbox(0.56, 0.03, 0.03, 0.004, 'steelDark', { pos: [0, oy - 0.16, zc - 0.03] }));
      [[-0.27, zr], [0.27, zr]].forEach(([x, z]) => base.add(rbox(0.05, 0.05, 0.05, 0.005, 'blueLight', { pos: [x, oy + 0.0, z] })));
      // tolva inclinada: caja con reja, campana gris con asa, boca difusora abajo
      const hp = new THREE.Group(); hp.position.set(0, oy - 0.12, (zr + zc) / 2); hp.rotation.x = -0.52; base.add(hp); K.hopperTilt = hp;
      hp.add(rbox(0.5, 0.42, 0.012, 0.003, 'steelDark', { pos: [0, 0.1, -0.24] })); [-1, 1].forEach(s => hp.add(rbox(0.012, 0.42, 0.48, 0.003, 'steelDark', { pos: [s * 0.25, 0.1, 0.0] })));
      hp.add(rbox(0.5, 0.03, 0.5, 0.004, 'steelDark', { pos: [0, -0.1, 0] }));
      // reja del frente de la tolva (rectángulos)
      for (let i = 0; i < 7; i++) hp.add(box(0.007, 0.36, 0.006, 'steel', { pos: [-0.21 + i * 0.07, 0.11, 0.24] })); for (let i = 0; i < 5; i++) hp.add(box(0.46, 0.006, 0.006, 'steel', { pos: [0, -0.05 + i * 0.08, 0.24] }));
      // campana (tapa) gris con asa
      const hood = extra(C, 'campana'); car.push(hood); const hh = new THREE.Group(); hh.position.set(0, 0.1, 0.02); hh.rotation.x = 0.0; hp.add(hh); hood.add(hh);
      hh.add(rbox(0.54, 0.34, 0.02, 0.006, 'panel', { pos: [0, 0.12, 0.27] })); hh.add(rbox(0.54, 0.02, 0.5, 0.006, 'panel', { pos: [0, 0.29, 0.03] })); [-1, 1].forEach(s => hh.add(rbox(0.02, 0.34, 0.5, 0.006, 'panel', { pos: [s * 0.27, 0.12, 0.03] })));
      hh.add(torus(0.05, 0.007, 'steel', { pos: [0.0, 0.33, 0.05], arc: PI, seg: 20 }));
      // (26) malla de filtraje verde dentro de la boca
      cE(26).add(slotted(0.46, 0.44, 0.008, Array.from({ length: 10 }, (_, i) => [-0.2 + i * 0.044, 0, 0.03, 0.4]), null, 'green', { pos: [0, oy - 0.4, (zr + zc) / 2 + 0.05], rot: [-0.52, 0, 0] }));
      // (18) junta entre difusor y boca repartidora; (22) patines de deslizamiento; (17) junta racord SMS 3"
      const jd = K.frameGasket(0.5, 0.46, 0.02, 0.008, 'epdm', { pos: [0, oy - 0.38, (zr + zc) / 2 + 0.03] }); jd.rotation.x = -PI / 2; cE(18).add(jd);
      [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([x, z]) => cE(22).add(rbox(0.06, 0.03, 0.05, 0.005, 'blueLight', { pos: [x, oy - 0.44, (zr + zc) / 2 + z] })));
      // difusor (boca inferior)
      const dif = extra(C, 'difusor'); car.push(dif); dif.add(K.frustum(0.5, 0.46, 0.46, 0.09, 0.14, 'steel', { pos: [0, oy - 0.34, (zr + zc) / 2 + 0.06] })); dif.add(rbox(0.52, 0.03, 0.12, 0.004, 'steel', { pos: [0, oy - 0.42, (zr + zc) / 2 + 0.06] }));
      // válvula OD76 con maneta multiposición (6) + acoplamiento (5) + soporte (4) + actuador Diteico (3), codo y racord 3" (17)
      const vp = [0.0, oy + 0.02, zr + 0.04];
      const vv = S.butterfly(76, 'multi'); vv.rotation.y = PI / 2; vv.position.set(vp[0] - 0.24, vp[1] - 0.0, vp[2] + 0.05); cE(6).add(vv);
      cE(17).add(clamp(vp[0] - 0.24, vp[1], vp[2] + 0.05 + 0.095, 'z', 0.038)); cE(17).add(clamp(vp[0] - 0.24, vp[1], vp[2] + 0.05 - 0.095, 'z', 0.038));
      cE(17).add(K.geo && torus(0.05, 0.007, 'steelDark', { axis: 'z', pos: [vp[0] - 0.24, vp[1], vp[2] + 0.05 + 0.12], seg: 40 }));
      cE(4).add(rbox(0.14, 0.02, 0.09, 0.004, 'steelDark', { pos: [vp[0] - 0.24, vp[1] + 0.13, vp[2] + 0.05] })); [-1, 1].forEach(s => cE(4).add(box(0.014, 0.1, 0.09, 'steelDark', { pos: [vp[0] - 0.24 + s * 0.055, vp[1] + 0.08, vp[2] + 0.05] })));
      cE(5).add(cyl(0.02, 0.02, 0.05, 'steel', { pos: [vp[0] - 0.24, vp[1] + 0.09, vp[2] + 0.05], seg: 24 })); cE(5).add(cyl(0.028, 0.028, 0.012, 'steelDark', { pos: [vp[0] - 0.24, vp[1] + 0.09, vp[2] + 0.05], seg: 6 }));
      const act = cE(3); act.add(rbox(0.16, 0.15, 0.15, 0.02, 'red', { pos: [vp[0] - 0.24, vp[1] + 0.22, vp[2] + 0.05], mat: { metalness: 0.2, roughness: 0.4 } })); act.add(cyl(0.05, 0.05, 0.03, 'black', { pos: [vp[0] - 0.24, vp[1] + 0.315, vp[2] + 0.05], seg: 40 }));
      act.add(cyl(0.03, 0.03, 0.03, 'black', { axis: 'x', pos: [vp[0] - 0.14, vp[1] + 0.22, vp[2] + 0.05], seg: 24 }));
      // codo del carro hacia la tolva
      const el0 = extra(C, 'codo'); car.push(el0); el0.add(pipe([[vp[0] - 0.24, vp[1] - 0.095, vp[2] + 0.05], [vp[0] - 0.24, vp[1] - 0.2, vp[2] + 0.05], [vp[0] - 0.1, vp[1] - 0.26, vp[2] + 0.2]], 0.038, 'steel', { radial: 32, bend: 0.06 }));
      // (12) tornillos M8x25 ×2, (13) arandelas ×4, (23) arandelas Ø8 ×48, (24) M8x70 ×8, (25) M8x20 ×8, (19) bridas de apriete ×4
      const pts = (n, f) => Array.from({ length: n }, (_, i) => f(i));
      cE(24).add(bolts(pts(8, i => [-0.21 + (i % 4) * 0.14, oy + 0.135, zr + 0.06 + Math.floor(i / 4) * 0.5]), 0.008, 0.07, 'y', { mat: 'steel' }));
      cE(25).add(bolts(pts(8, i => [-0.26 + (i % 4) * 0.17, oy + 0.135, zr + 0.16 + Math.floor(i / 4) * 0.3]), 0.008, 0.02, 'y', { mat: 'steel' }));
      cE(12).add(bolts([[-0.23, oy + 0.0, zc - 0.01], [0.23, oy + 0.0, zc - 0.01]], 0.008, 0.025, 'x', { mat: 'steel' }));
      cE(13).add(washers([[-0.25, oy, zc - 0.01], [0.25, oy, zc - 0.01], [-0.28, oy, zc - 0.01], [0.28, oy, zc - 0.01]], 0.008, 'x'));
      cE(23).add(washers(pts(48, i => [-0.27 + (i % 12) * 0.05 + 0.0, oy + 0.132 - Math.floor(i / 12) * 0.0, zr + 0.06 + (Math.floor(i / 12) % 2) * 0.5 + (Math.floor(i / 24)) * 0.0]).map((p, i) => [p[0], p[1], zr + 0.04 + (i % 24 < 12 ? 0 : 0.56)]), 0.008, 'y'));
      [[-0.25, 0.28], [0.25, 0.28], [-0.25, -0.05], [0.25, -0.05]].forEach(([x, z]) => { const b = new THREE.Group(); b.position.set(x, oy + 0.12, zr + z + 0.22); cE(19).add(b); b.add(rbox(0.05, 0.02, 0.03, 0.004, 'steel', {})); b.add(rbox(0.014, 0.05, 0.02, 0.003, 'black', { pos: [0, 0.03, 0] })); b.add(cyl(0.005, 0.005, 0.05, 'steel', { axis: 'z', pos: [0, 0.056, 0], seg: 10 })); });
      // (21) bola de lavado CD-17C dentro de la tolva y (20) manguera NW25 azul con racords
      const bl = new THREE.Mesh(K.sprayBall28, mat('steel')); bl.position.set(0.12, oy + 0.12, zr + 0.36); bl.rotation.x = PI; cE(21).add(bl);
      cE(20).add(hose([[0.12, oy + 0.15, zr + 0.36], [0.22, oy + 0.32, zr + 0.28], [0.3, oy + 0.35, zr + 0.1], [0.34, oy + 0.28, zr - 0.02]], 0.0125, 'cableBlue', { radial: 18 }));
      cE(20).add(lathe([[0.0, 0], [0.022, 0], [0.024, 0.01], [0.02, 0.026], [0.0, 0.026]], 'steel', { seg: 6, pos: [0.12, oy + 0.15, zr + 0.36] }));

      // ---------- mangueras azules (1)(2): del tubo fijo, en U, hasta el carro (se recalculan con el carro) ----------
      // el extremo fijo está junto al intercambiador (+X); la manguera corre hacia -X, da la vuelta en U y regresa al carro
      const x0h = 1.6, hs = [
        { el: g[1], y: L.rail.y - 0.9, z: -0.64, r: 0.45, mat: 'curd' },
        { el: g[2], y: L.rail.y - 1.2, z: -0.56, r: 0.6, mat: 'curd' }
      ];
      hs.forEach(h => {
        h.pts = xc => {
          const xu = (xc - 2.3) / 2, e = xc, y0 = h.y, ty = y0 + 2 * h.r, r = h.r;
          return [[x0h, y0, h.z], [x0h - 0.5, y0, h.z], [xu + 0.3, y0, h.z], [xu, y0, h.z], [xu - r * 0.75, y0 + r * 0.25, h.z], [xu - r, y0 + r, h.z], [xu - r * 0.75, y0 + r * 1.75, h.z], [xu, ty, h.z], [xu + 0.3, ty, h.z], [(xu + e) / 2, ty, h.z], [e - 0.05, ty - 0.02, h.z], [e + 0.06, ty - 0.03, h.z + 0.02]];
        };
        h.build = xc => { const c = new THREE.CatmullRomCurve3(h.pts(xc).map(p => new THREE.Vector3(p[0], p[1], p[2])), false, 'catmullrom', 0.4); return new THREE.TubeGeometry(c, Math.round(c.getLength() * 90 * K.detail), 0.034, K.sg(20), false); };
        h.mesh = mesh(h.build(0.45), h.mat, { mat: { metalness: 0.15, roughness: 0.4 } }); h.el.add(h.mesh);
        h.el.add(cyl(0.045, 0.045, 0.14, 'steelDark', { axis: 'x', pos: [x0h + 0.05, h.y, h.z], seg: 40 })); h.el.add(torus(0.045, 0.006, 'steel', { axis: 'x', pos: [x0h + 0.12, h.y, h.z], seg: 40 }));
        for (let i = 0; i < 4; i++) h.el.add(torus(0.037, 0.004, 'steel', { axis: 'x', pos: [x0h - 0.1 - i * 0.03, h.y, h.z], seg: 32 }));
      });
      K.hoses = hs;
      // ---------- animación del carro ----------
      const cgroups = car;
      let xcLast = -9;
      const setCar = xc => { cgroups.forEach(q => { q.position.x = xc; }); if (Math.abs(xc - xcLast) > 0.003) { xcLast = xc; hs.forEach(h => { const old = h.mesh.geometry; h.mesh.geometry = h.build(xc); old.dispose(); }); } };
      K.carState = { xc: 0.45 }; setCar(0.45);
      anim.push(function (dt, st) {
        const run = st.running && !st.estop; if (!run && !K.carState.pending) return;
        const tgt = run ? 0.45 + 0.45 * Math.sin(st.t * 0.7) : K.carState.xc; K.carState.xc += (tgt - K.carState.xc) * Math.min(1, dt * 4); setCar(K.carState.xc);
        if (K.hopperTilt) K.hopperTilt.rotation.x = -0.52 + (run ? 0.06 * Math.sin(st.t * 3) : 0);
      });
      explode(tw, 0, 0.9, 0); explode(dr, 0, 0, 0.9); explode(beam, 0, -0.3, 0); explode(g[7], 0, 0.3, -0.2);
    }
  });
})();
