/* BANDA TRANSPORTADORA DE MOLDES (18) · MECANISMO DE MANIVELA (16) · ELEVACIÓN DEL PORTA CONFORMADORES (10)
 * Referencia: imágenes 54-58 (banda y manivela) y 71-74 (elevación y columnas) del Excel. */
(function () {
  'use strict';
  window.MODEL_BUILDERS.push(function (K) {
    const { THREE, PI, TAU, el, comps, box, rbox, cyl, torus, sphere, lathe, extrude, merge, tr, put, bolts, nuts, washers, line, grid, pipe, hose, clamp, inst, mat, mesh, explode, spin, geo, anim, state, extra } = K;
    const L = K.L, S = K.parts, slotted = K.slotted;

    /* =========================================================
     *  BANDA TRANSPORTADORA DE MOLDES (18) — imágenes 54-56
     * ========================================================= */
    {
      const C = 'banda', by = L.belt.y, xa = L.belt.x0, xb = L.belt.x1, R = 0.085, gz = 0.0;
      const top = by + R, bot = by - R, straight = xb - xa, perim = 2 * straight + TAU * R;
      function pathAt(s) {
        s = ((s % perim) + perim) % perim;
        if (s < straight) return { x: xa + s, y: top, a: 0 };
        s -= straight;
        if (s < PI * R) { const th = s / R; return { x: xb + R * Math.sin(th), y: by + R * Math.cos(th), a: -th }; }
        s -= PI * R;
        if (s < straight) return { x: xb - s, y: bot, a: PI };
        s -= straight; const th = s / R; return { x: xa - R * Math.sin(th), y: by - R * Math.cos(th), a: PI - th };
      }
      const g = {}; for (let i = 1; i <= 18; i++) g[i] = el(C, i);
      // (8) cadena de rodillos + (5) 150 rodillos AVE
      const pitch = 0.038, nLinks = Math.round(perim / pitch), pit = perim / nLinks;
      const inner = geo('linkI', () => merge([tr(new THREE.BoxGeometry(0.03, 0.012, 0.004), 0, 0, 0.007), tr(new THREE.BoxGeometry(0.03, 0.012, 0.004), 0, 0, -0.007)]));
      const outer = geo('linkO', () => merge([tr(new THREE.BoxGeometry(0.03, 0.012, 0.004), 0, 0, 0.0115), tr(new THREE.BoxGeometry(0.03, 0.012, 0.004), 0, 0, -0.0115), tr(new THREE.CylinderGeometry(0.0035, 0.0035, 0.03, 10), 0.0, 0, 0)]));
      const chainI = new THREE.InstancedMesh(inner, mat('steel'), Math.floor(nLinks / 2)), chainO = new THREE.InstancedMesh(outer, mat('steelDark'), Math.ceil(nLinks / 2));
      const AVE = new THREE.InstancedMesh(geo('ave22', () => new THREE.CylinderGeometry(0.011, 0.011, 0.015, 20).rotateX(PI / 2)), mat('black', { roughness: 0.4 }), 150);
      [chainI, chainO, AVE].forEach(m => { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; });
      g[8].add(chainI, chainO); g[5].add(AVE);
      const dm = new THREE.Object3D();
      function updateChain(off) {
        let ci = 0, co = 0;
        for (let i = 0; i < nLinks; i++) { const p = pathAt(i * pit + off); dm.position.set(p.x, p.y, gz); dm.rotation.set(0, 0, p.a); dm.updateMatrix(); (i % 2 ? chainI.setMatrixAt(ci++, dm.matrix) : chainO.setMatrixAt(co++, dm.matrix)); }
        for (let i = 0; i < 150; i++) { const p = pathAt(i * perim / 150 + off + pit * 0.5); dm.position.set(p.x, p.y, gz); dm.rotation.set(0, 0, p.a); dm.updateMatrix(); AVE.setMatrixAt(i, dm.matrix); }
        chainI.instanceMatrix.needsUpdate = chainO.instanceMatrix.needsUpdate = AVE.instanceMatrix.needsUpdate = true;
      }
      updateChain(0); let chainOff = 0;
      anim.push(function (dt, st) { if (Math.abs(st.speed) > 0.01) { chainOff += st.speed * dt * 0.05; updateChain(chainOff); } });
      // (2) piñón conducido, (15) piñón motriz, (4) eje tensor, (16) eje del cabezal motriz
      const p2 = S.sprocket(R + 0.006, 22, 0.02, 'steelDark'); p2.position.set(xa, by, gz); g[2].add(p2); spin(p2, 'z', -1);
      const p15 = S.sprocket(R + 0.006, 22, 0.02, 'steelDark'); p15.position.set(xb, by, gz); g[15].add(p15); spin(p15, 'z', -1);
      g[4].add(cyl(0.015, 0.015, 0.46, 'steel', { axis: 'z', pos: [xa, by, gz], seg: 32, mat: { roughness: 0.15 } }));
      g[16].add(cyl(0.015, 0.015, 0.7, 'steel', { axis: 'z', pos: [xb, by, gz + 0.12], seg: 32, mat: { roughness: 0.15 } }));
      // (3) rodamiento 6006, (1) anillos elásticos ×2, (17) cojinetes MSM ×4, (14) retenes V, (13) soportes UCFL-206 ×2, (12)(18) tapas
      const b3 = S.bearing(0.0275, 0.015, 0.013, 'red'); b3.position.set(xa, by, gz + 0.045); g[3].add(b3);
      [0.2, -0.2].forEach(z => g[1].add(torus(0.0165, 0.0018, 'steelDark', { axis: 'z', pos: [xb, by, z], seg: 28, arc: PI * 1.8 })));
      [[-0.17, xa], [0.17, xa], [-0.12, xb], [0.12, xb]].forEach(([z, x]) => g[17].add(cyl(0.0185, 0.0185, 0.014, 'iglidur', { axis: 'z', pos: [x, by, z], seg: 32 })));
      [-1, 1].forEach(s => {
        const u = S.ucfl(30); u.position.set(xb, by, s * 0.26); if (s < 0) u.rotation.y = PI; g[13].add(u);
        g[14].add(lathe([[0.016, 0], [0.024, 0.0], [0.028, 0.006], [0.024, 0.01], [0.016, 0.004]], 'rubber', { axis: 'z', pos: [xb, by, s * 0.235], rot: [s > 0 ? PI / 2 : -PI / 2, 0, 0], seg: 40 }));
      });
      g[12].add(cyl(0.036, 0.036, 0.03, 'steel', { axis: 'z', pos: [xb, by, 0.31], seg: 40 })); g[18].add(cyl(0.036, 0.036, 0.03, 'steel', { axis: 'z', pos: [xb, by, -0.31], seg: 40 })); g[18].add(torus(0.03, 0.004, 'steelDark', { axis: 'z', pos: [xb, by, -0.33], seg: 24 }));
      // bastidor del transportador: rieles laterales, tubos guía superiores, soportes y caja del extremo con patas
      const fm = extra(C, 'bastidor');
      [-1, 1].forEach(s => {
        fm.add(rbox(straight + 0.35, 0.09, 0.012, 0.003, 'panel', { pos: [(xa + xb) / 2, by, s * 0.235] })); fm.add(rbox(straight + 0.3, 0.014, 0.05, 0.003, 'steelDark', { pos: [(xa + xb) / 2, top + 0.02, s * 0.26] })); fm.add(rbox(straight + 0.3, 0.014, 0.05, 0.003, 'steelDark', { pos: [(xa + xb) / 2, bot - 0.02, s * 0.26] }));
        fm.add(cyl(0.014, 0.014, straight + 0.5, 'steel', { axis: 'x', pos: [(xa + xb) / 2, top + 0.12, s * 0.3], seg: 20 }));
        for (let i = 0; i < 6; i++) fm.add(rbox(0.03, 0.14, 0.05, 0.004, 'steelDark', { pos: [xa + 0.2 + i * (straight - 0.4) / 5, top + 0.06, s * 0.28] }));
      });
      // caja del extremo izquierdo (tapa) con dos patas y pies
      const box0 = extra(C, 'caja'); box0.add(rbox(0.36, 0.34, 0.6, 0.012, 'panel', { pos: [xa - 0.22, by - 0.02, 0.0], mat: { metalness: 0.7 } })); box0.add(rbox(0.32, 0.3, 0.02, 0.006, 'panelDark', { pos: [xa - 0.22, by - 0.02, 0.31] }));
      // (6) tapas de tubo de pie 40x40 y (7) pies Ø50 (2)
      [-1, 1].forEach(s => { const x = xa - 0.22, z = s * 0.22; g[7].add(K.level(x, 0, z, 0.025, 0.06)); g[6].add(rbox(0.044, 0.014, 0.044, 0.004, 'black', { pos: [x, 0.07, z] })); box0.add(rbox(0.04, by - 0.2, 0.04, 0.004, 'brushed', { pos: [x, 0.08 + (by - 0.2) / 2, z] })); });
      box0.add(rbox(0.04, 0.03, 0.44, 0.004, 'brushed', { pos: [xa - 0.22, 0.4, 0] }));
      // (9) encoder RM3010
      const en = new THREE.Group(); en.position.set(xb, by, -0.62); g[9].add(en);
      en.add(cyl(0.029, 0.029, 0.05, 'anodized', { axis: 'z', seg: 40 })); en.add(cyl(0.03, 0.03, 0.006, 'black', { axis: 'z', pos: [0, 0, -0.028], seg: 40 }));
      en.add(cyl(0.006, 0.006, 0.03, 'steelDark', { axis: 'z', pos: [0, 0, 0.038], seg: 12 })); en.add(cyl(0.008, 0.008, 0.03, 'black', { pos: [0, 0.035, -0.005], seg: 12 }));
      // (10) motorreductor SA47 con cubierta transparente
      const gm = S.gearMotor(); gm.rotation.z = -PI / 2; gm.position.set(xb, by, 0.6); g[10].add(gm);
      g[10].add(rbox(0.32, 0.36, 0.3, 0.008, 'glass', { pos: [xb + 0.04, by - 0.05, 0.62], mat: { transparent: true, opacity: 0.22 } }));
      // (11) guías del elevador de moldes ×4 (bloques azules sobre los rieles + montantes)
      [[-0.32, -0.24], [-0.32, 0.24], [0.32, -0.24], [0.32, 0.24]].forEach(p => { g[11].add(rbox(0.06, 0.09, 0.05, 0.006, 'blue', { pos: [p[0], top + 0.045, p[1] * 1.1] })); g[11].add(rbox(0.03, 0.75, 0.03, 0.004, 'steelDark', { pos: [p[0], top + 0.42, p[1] * 1.1] })); });
      explode(fm, 0, 0, 0.55); explode(g[8], 0, 0, 0.55); explode(g[5], 0, 0, 0.55); explode(g[10], 0.5, 0, 0.5); explode(box0, -0.5, 0, 0);
    }

    /* =========================================================
     *  MECANISMO DE MANIVELA (16) — imagen 58
     *  Bastidores reticulados de arrastre (unidos por ejes) accionados por biela y cilindro neumático
     * ========================================================= */
    {
      const C = 'manivela', by = L.belt.y, xa = -1.3, xb = 1.1, zL = 0.34, cyC = 0.62;
      const g = {}; for (let i = 1; i <= 16; i++) g[i] = el(C, i);
      // bastidores reticulados (no listados): dos vigas con ventanas y tacos superiores
      const fr = extra(C, 'bastidor de arrastre');
      [-1, 1].forEach(s => {
        const shp = new THREE.Shape(); const H = 0.4, Ln = xb - xa; shp.moveTo(0, 0); shp.lineTo(Ln, 0); shp.lineTo(Ln, H); shp.lineTo(0, H); shp.closePath();
        for (let i = 0; i < 6; i++) { const p = new THREE.Path(), cx0 = 0.3 + i * 0.38, tri = i % 2 ? 1 : 0; p.moveTo(cx0, 0.05); p.lineTo(cx0 + 0.3, 0.05); p.lineTo(cx0 + (tri ? 0.3 : 0.0), H - 0.05); p.closePath(); shp.holes.push(p); }
        const gg = new THREE.ExtrudeGeometry(shp, { depth: 0.015, bevelEnabled: false }); gg.translate(xa, by + 0.02, -0.0075);
        const m = mesh(gg, 'panelDark', { pos: [0, 0, s * zL] }); fr.add(m);
        const blocks = []; for (let i = 0; i < 14; i++) blocks.push({ p: [xa + 0.2 + i * (xb - xa - 0.4) / 13, by + 0.44, s * zL] });
        fr.add(inst(geo('dragBlock', () => new THREE.BoxGeometry(0.05, 0.05, 0.05)), 'steelDark', blocks));
        fr.add(cyl(0.016, 0.016, xb - xa, 'steel', { axis: 'x', pos: [(xa + xb) / 2, by + 0.42, s * zL - s * 0.0], seg: 20 }));
      });
      // eje de giro del brazo (3) largo, pivotes (13) ×2, manivelas (4)(12), turillones (10) ×2, biela y distanciadores
      const px = -0.4, py = by - 0.42;
      g[3].add(cyl(0.02, 0.02, 0.84, 'steel', { axis: 'z', pos: [px, py, 0], seg: 36, mat: { roughness: 0.15 } }));
      [-1, 1].forEach(s => g[13].add(cyl(0.014, 0.014, 0.4, 'steel', { axis: 'z', pos: [px + 0.75, py + 0.32, s * 0.0], seg: 24 })));
      const arm = (len, w) => { const s = new THREE.Shape(); s.absarc(0, 0, w / 2, PI / 2, PI * 1.5, false); s.lineTo(len, -w / 3); s.absarc(len, 0, w / 3, -PI / 2, PI / 2, false); s.lineTo(0, w / 2); const h1 = new THREE.Path(); h1.absarc(0, 0, 0.012, 0, TAU, true); s.holes.push(h1); const h2 = new THREE.Path(); h2.absarc(len, 0, 0.008, 0, TAU, true); s.holes.push(h2); return s; };
      [[0.3, g[4]], [-0.3, g[12]]].forEach(([z, q]) => { const m = extrude(arm(0.3, 0.07), 0.016, 'steelDark', { seg: 24, pos: [px, py, z] }); m.rotation.z = 0.9; q.add(m); });
      [0.3, -0.3].forEach(z => { g[10].add(cyl(0.011, 0.011, 0.07, 'steel', { axis: 'z', pos: [px + 0.19, py + 0.24, z], seg: 20 })); g[10].add(cyl(0.017, 0.017, 0.008, 'steelDark', { axis: 'z', pos: [px + 0.19, py + 0.24, z + Math.sign(z) * 0.036], seg: 24 })); });
      // ruedas guía ×4 (9): sobre los rieles del bastidor
      [[xa + 0.2, zL], [xa + 0.2, -zL], [xb - 0.2, zL], [xb - 0.2, -zL]].forEach(([x, z]) => { const w = new THREE.Group(); w.position.set(x, by + 0.0, z + Math.sign(z) * 0.03); g[9].add(w); w.add(cyl(0.028, 0.028, 0.018, 'black', { axis: 'z', seg: 36 })); w.add(cyl(0.012, 0.012, 0.03, 'steel', { axis: 'z', pos: [0, 0, -0.012], seg: 16 })); w.add(torus(0.028, 0.004, 'steelDark', { axis: 'z', seg: 36 })); });
      // cojinetes: (15) EFOM 25 de brida ×6, (16) arandelas ×6, (11) XFM ×3, (5) retén V
      [[px, py, 0.16], [px, py, -0.16], [px, py, 0.34], [px, py, -0.34], [px, py, 0.06], [px, py, -0.06]].forEach(p => {
        const f = new THREE.Group(); f.position.set(p[0], p[1], p[2]); g[15].add(f);
        f.add(cyl(0.032, 0.032, 0.006, 'steelDark', { axis: 'z', seg: 40 })); f.add(cyl(0.022, 0.022, 0.016, 'iglidur', { axis: 'z', seg: 32 }));
        g[16].add(cyl(0.0305, 0.0305, 0.003, 'steel', { axis: 'z', pos: [p[0], p[1], p[2] + Math.sign(p[2]) * 0.01], seg: 32 }));
      });
      [[px + 0.19, py + 0.24, 0.16], [px, py, 0.03], [px, py, -0.03]].forEach(p => g[11].add(cyl(0.0155, 0.0155, 0.018, 'iglidur', { axis: 'z', pos: p, seg: 28 })));
      g[5].add(lathe([[0.02, 0], [0.032, 0.0], [0.036, 0.008], [0.03, 0.012], [0.02, 0.005]], 'rubber', { axis: 'z', pos: [px, py, 0.365], rot: [PI / 2, 0, 0], seg: 40 }));
      // biela (barras + distanciadores 2, 6, 14)
      const bar = extra(C, 'biela'); [[0.16], [-0.16]].forEach(([z]) => bar.add(rbox(0.024, 0.5, 0.016, 0.003, 'steelDark', { pos: [px + 0.35, py + 0.22, z + Math.sign(z) * 0.07], rot: [0, 0, -0.35] })));
      g[2].add(cyl(0.014, 0.014, 0.03, 'steel', { axis: 'z', pos: [px + 0.19, py + 0.24, 0.2], seg: 20 })); g[6].add(cyl(0.014, 0.014, 0.03, 'steel', { axis: 'z', pos: [px + 0.19, py + 0.24, -0.2], seg: 20 }));
      [0.12, -0.12, 0.05, -0.05].forEach(z => g[14].add(cyl(0.013, 0.013, 0.024, 'steel', { axis: 'z', pos: [px + 0.35, py + 0.36, z], seg: 20 })));
      // (7) cilindro neumático CRDSNU-63-130 vertical bajo el eje, (8) horquilla y (1) cabeza de rótula
      const cy = S.pneuCyl(63, 0.13); cy.rotation.z = PI / 2; cy.position.set(px + 0.35, py - 0.22, 0); g[7].add(cy);
      g[8].add(rbox(0.05, 0.05, 0.04, 0.006, 'steel', { pos: [px + 0.35, py + 0.02, 0] })); g[8].add(cyl(0.011, 0.011, 0.06, 'steelDark', { axis: 'z', pos: [px + 0.35, py + 0.04, 0], seg: 20 }));
      g[1].add(cyl(0.02, 0.02, 0.03, 'steel', { pos: [px + 0.35, py - 0.42, 0], seg: 24 })); g[1].add(sphere(0.026, 'steelDark', { pos: [px + 0.35, py - 0.46, 0] }));
      explode(fr, 0, 0.5, 0); explode(g[7], 0, -0.3, 0); explode(bar, 0.3, 0.2, 0);
    }

    /* =========================================================
     *  ELEVACIÓN DEL PORTA CONFORMADORES (10) — imágenes 71-74
     *  Marco con 4 actuadores eléctricos accionados por servoreductor y cajas de reenvío.
     *  Incluye (no listadas) las columnas de pre-prensado y el porta-conformadores.
     * ========================================================= */
    {
      const C = 'elevacion', tk = L.tank, cxk = (tk.x0 + tk.x1) / 2, gy = 1.02, X = 1.15, zA = -0.59, zB = -0.09, zm = (zA + zB) / 2; comps[C].position.x = cxk;   // el conjunto se centra bajo el cassette
      const g = {}; for (let i = 1; i <= 10; i++) g[i] = el(C, i);
      const A = [[-X, zA], [X, zA], [-X, zB], [X, zB]];
      // marco: dos largueros y la charola central
      const fr = extra(C, 'marco'); [zA, zB].forEach(z => fr.add(rbox(2 * X + 0.2, 0.06, 0.05, 0.005, 'steelDark', { pos: [0, gy - 0.05, z] })));
      [-X, X].forEach(x => fr.add(rbox(0.05, 0.06, zB - zA, 0.005, 'steelDark', { pos: [x, gy - 0.05, zm] })));
      fr.add(slotted(0.8, 0.4, 0.014, null, null, 'steelDark', { pos: [0, gy - 0.02, zm], rot: [0, 0, 0] })); [-1, 1].forEach(s => fr.add(box(0.8, 0.05, 0.012, 'steelDark', { pos: [0, gy + 0.005, zm + s * 0.2] })));
      // servomotor (7) + servoreductor (6) al centro
      const sv = new THREE.Group(); sv.position.set(0, gy + 0.07, zm); g[6].add(sv);
      sv.add(rbox(0.13, 0.13, 0.13, 0.014, 'anodized', {})); sv.add(cyl(0.055, 0.055, 0.03, 'steelDark', { pos: [0, 0.075, 0], seg: 40 })); [1, -1].forEach(s => sv.add(cyl(0.03, 0.03, 0.02, 'steelDark', { axis: 'x', pos: [s * 0.075, 0, 0], seg: 32 })));
      const mo = new THREE.Group(); mo.position.set(0, gy + 0.23, zm); g[7].add(mo);
      mo.add(rbox(0.09, 0.13, 0.09, 0.012, 'ab', { pos: [0, 0.05, 0] })); mo.add(cyl(0.048, 0.048, 0.04, 'abLight', { pos: [0, 0.135, 0], seg: 40 })); [0.06, -0.06].forEach(z => mo.add(cyl(0.011, 0.011, 0.03, 'steelDark', { axis: 'z', pos: [0, 0.12, z], seg: 16 })));
      // cajas de reenvío en las 4 esquinas: 2 tipo C2 (8) y 2 tipo C5 (9) + actuadores FUS (3) + bridas azules (1)(10)
      A.forEach((p, i) => {
        const gb = S.angular(0.11, i >= 2); gb.position.set(p[0], gy, p[1]); (i < 2 ? g[8] : g[9]).add(gb);
        const ac = new THREE.Group(); ac.position.set(p[0], gy + 0.055, p[1]); g[3].add(ac);
        ac.add(cyl(0.05, 0.05, 0.04, 'steelDark', { pos: [0, 0.02, 0], seg: 40 })); ac.add(rbox(0.075, 0.5, 0.075, 0.008, 'anodized', { pos: [0, 0.29, 0] }));
        [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(k => ac.add(cyl(0.005, 0.005, 0.48, 'steel', { pos: [k[0] * 0.028, 0.29, k[1] * 0.028], seg: 8, cast: false })));
        ac.add(cyl(0.032, 0.032, 0.03, 'steelDark', { pos: [0, 0.54, 0], seg: 40 })); ac.add(cyl(0.022, 0.022, 0.22, 'steel', { pos: [0, 0.66, 0], seg: 32, mat: { roughness: 0.1 } }));
        (i % 2 ? g[10] : g[1]).add(lathe([[0.02, 0], [0.078, 0], [0.078, 0.022], [0.02, 0.022]], 'blueLight', { pos: [p[0], gy + 0.055 + 0.0, p[1]], seg: 48 }));
      });
      // ejes: (4) servoreductor→reenvío ×2 (X), (2) entre reenvíos ×2 (Z), (5) acoplamientos ×8
      [-1, 1].forEach(s => {
        g[4].add(cyl(0.011, 0.011, X - 0.075 - 0.055, 'steel', { axis: 'x', pos: [s * (X + 0.075) / 2, gy, zm], seg: 24, mat: { roughness: 0.15 } }));
        const c1 = S.coupling(0.026, 0.06); c1.position.set(s * (0.075 + 0.05), gy, zm); g[5].add(c1); const c2 = S.coupling(0.026, 0.06); c2.position.set(s * (X - 0.055 - 0.04), gy, zm); g[5].add(c2);
        g[2].add(cyl(0.011, 0.011, zB - zA - 0.11, 'steel', { axis: 'z', pos: [s * X, gy, zm], seg: 24, mat: { roughness: 0.15 } }));
        const c3 = S.coupling(0.026, 0.06); c3.rotation.y = PI / 2; c3.position.set(s * X, gy, zA + 0.09); g[5].add(c3); const c4 = S.coupling(0.026, 0.06); c4.rotation.y = PI / 2; c4.position.set(s * X, gy, zB - 0.09); g[5].add(c4);
      });
      // porta-conformadores (carro que sube y baja) con los conformadores azules y 5 columnas de pre-prensado
      const car = extra(C, 'porta-conformadores'); K.carrier = car; car.position.y = 0;
      const cy0 = L.cols.y0 - 0.16;
      car.add(slotted(2 * X + 0.25, 0.55, 0.03, null, Array.from({ length: 5 }, (_, i) => [-0.92 + i * 0.46, 0, 0.13]), 'steelDark', { pos: [0, cy0, zm] }));
      [-1, 1].forEach(s => car.add(rbox(2 * X + 0.25, 0.05, 0.03, 0.005, 'steel', { pos: [0, cy0 + 0.03, zm + s * 0.28] })));
      for (let i = 0; i < 5; i++) { const x = -0.92 + i * 0.46; car.add(lathe([[0.13, 0], [0.17, 0.0], [0.17, 0.03], [0.14, 0.05], [0.13, 0.05]], 'blueLight', { pos: [x, cy0 + 0.015, zm], seg: 64 })); }
      const cols = extra(C, 'columnas');
      for (let i = 0; i < 5; i++) {
        const x = -0.92 + i * 0.46, z = (tk.z0 + tk.z1) / 2;
        cols.add(cyl(0.148, 0.148, L.cols.y1 - L.cols.y0 - 0.1, 'steel', { pos: [x, (L.cols.y0 + 0.1 + L.cols.y1) / 2, z], seg: 56, open: true, mat: { side: THREE.DoubleSide, roughness: 0.2 } }));
        cols.add(lathe([[0.15, 0], [0.24, 0.05], [0.24, 0.06], [0.15, 0.0]], 'steel', { pos: [x, L.cols.y1 - 0.06, z], seg: 56 })); cols.add(torus(0.24, 0.006, 'steel', { axis: 'y', pos: [x, L.cols.y1 - 0.005, z], seg: 56 }));
        for (let k = 0; k < 6; k++) cols.add(cyl(0.004, 0.004, 0.1, 'steel', { pos: [x + Math.cos(k * TAU / 6) * 0.2, L.cols.y1 - 0.02, z + Math.sin(k * TAU / 6) * 0.2], seg: 8, rot: [0.0, 0, 0] }));
        cols.add(lathe([[0.15, 0], [0.2, 0.0], [0.2, 0.03], [0.15, 0.03]], 'steelDark', { pos: [x, L.cols.y0 + 0.1, z], seg: 56 }));
      }
      // desplazamiento
      anim.push(function (dt, st) { const run = st.running && !st.estop; if (run) { st.liftT = (st.liftT || 0) + dt; K.carrier.position.y = (0.5 - 0.5 * Math.cos(st.liftT * 1.2)) * 0.12; } else K.carrier.position.y += (0 - K.carrier.position.y) * Math.min(1, dt * 3); });
      explode(car, 0, -0.4, 0); explode(cols, 0, 0.4, 0); explode(g[3], 0, 0.3, 0); explode(fr, 0, -0.3, 0);
    }
  });
})();
