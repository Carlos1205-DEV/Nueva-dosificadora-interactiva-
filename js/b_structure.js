/* Layout general + ESTRUCTURA PRINCIPAL (22 elementos + bastidor, plataforma y escalera) + RODILLOS TRANSPORTADORES (9)
 * Referencia: dibujos del Excel (estructura: imagen 49; rodillos: imagen 70; vista general: imágenes 53, 69, 72). */
(function () {
  'use strict';
  window.MODEL_BUILDERS.push(function (K) {
    const { THREE, PI, TAU, el, comps, box, rbox, cyl, torus, sphere, lathe, extrude, put, bolts, nuts, washers, line, grid, pipe, hose, clamp, inst, mat, mesh, explode, spin, context } = K;

    /* ---------- LAYOUT (metros). X = largo, Y = altura, Z = profundidad (+Z lado del operador) ---------- */
    const L = K.L = {
      bx0: -1.8, bx1: 1.8, bz0: -0.75, bz1: 0.75, by0: 0.3, by1: 1.75,     // bastidor principal
      deckY: 1.75,                                                          // plataforma de trabajo
      roofY: 3.55,                                                          // techo de la torre del repartidor
      belt: { y: 0.86, z: 0.0, x0: -1.95, x1: 1.25 },                        // banda de moldes
      small: { x: -1.2, y: 2.72, z: 0.27, w: 0.5, h: 0.45, d: 0.22 },        // armario 500x450x220 (HMI)
      tall: { x: -1.35, y: 0.86, z: 0.98, w: 0.7, h: 1.7, d: 0.3 },          // armario 700x1700x300
      tank: { x0: -1.15, x1: 1.2, z0: -0.62, z1: -0.06, y0: 2.4, y1: 2.85 },// cassette (tanque)
      cols: { y0: 1.85, y1: 2.4 },                                           // columnas / conformadores
      rail: { y: 3.18, z: -0.34, x0: -1.1, x1: 1.25 },                        // guía del carro repartidor
      hx: { x: 2.65, z: 0.05 }                                                // intercambiador
    };
    const bx = 'brushed';
    function extra(C, name) { const g = new THREE.Group(); g.name = C + ':' + name; g.userData.comp = C; comps[C].add(g); return g; }
    K.extra = extra;

    /* ---------- helpers ---------- */
    function frameGasket(w, h, t, th, m, o) { // marco rectangular plano en XY (grosor z = th)
      const s = new THREE.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.closePath();
      const p = new THREE.Path(); p.moveTo(-w / 2 + t, -h / 2 + t); p.lineTo(-w / 2 + t, h / 2 - t); p.lineTo(w / 2 - t, h / 2 - t); p.lineTo(w / 2 - t, -h / 2 + t); p.closePath(); s.holes.push(p);
      return extrude(s, th, m || 'epdm', o);
    }
    K.frameGasket = frameGasket;
    function level(x, y, z, r, mainY) { // pie de nivelación Martin (base + vástago roscado + tuercas)
      const g = new THREE.Group(); g.position.set(x, y || 0, z);
      g.add(lathe([[0.0, 0.0], [r, 0.0], [r * 1.02, 0.012], [r * 0.9, 0.022], [r * 0.34, 0.03], [r * 0.22, 0.045]], 'black', { seg: 40 }));
      g.add(cyl(r * 0.1, r * 0.1, mainY - 0.05, 'steel', { pos: [0, 0.045 + (mainY - 0.05) / 2, 0], seg: 20 }));
      g.add(cyl(r * 0.2, r * 0.2, 0.014, 'steelDark', { pos: [0, 0.075, 0], seg: 6 }));
      g.add(cyl(r * 0.2, r * 0.2, 0.014, 'steelDark', { pos: [0, mainY - 0.03, 0], seg: 6 }));
      return g;
    }
    K.level = level;
    function meshPanel(w, h, cell, col) { // malla de protección (textura con alfa)
      const t = K.canvasTex(256, 256, (c, W, H) => {
        c.clearRect(0, 0, W, H); c.strokeStyle = col || '#8f98a0'; c.lineWidth = 5;
        const n = 8; for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * W / n, 0); c.lineTo(i * W / n, H); c.stroke(); c.beginPath(); c.moveTo(0, i * H / n); c.lineTo(W, i * H / n); c.stroke(); }
      });
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / cell, h / cell);
      return new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, metalness: 0.7, roughness: 0.5, color: 0xffffff });
    }
    K.meshPanel = meshPanel;
    const treadTex = K.canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#7d858c'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        [[0, 0, 1], [32, 32, -1]].forEach(([ox, oy, sgn]) => {
          const cx = i * 64 + ox + 16, cy = j * 64 + oy + 16;
          g.save(); g.translate(cx, cy); g.rotate(sgn * PI / 4 + (i + j) % 2 * PI / 2);
          g.fillStyle = '#5b6268'; g.beginPath(); g.ellipse(1.5, 1.5, 15, 5.5, 0, 0, TAU); g.fill();
          g.fillStyle = '#c3cad0'; g.beginPath(); g.ellipse(0, 0, 14, 5, 0, 0, TAU); g.fill();
          g.fillStyle = '#e4e9ed'; g.beginPath(); g.ellipse(-1.5, -1, 8, 1.8, 0, 0, TAU); g.fill();
          g.restore();
        });
      }
    });
    const treadMat = (w, d) => { const t = treadTex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 0.16, d / 0.16); return new THREE.MeshStandardMaterial({ map: t, metalness: 0.8, roughness: 0.42 }); };
    K.treadMat = treadMat;

    /* =========================================================
     *  CONTEXTO (no seleccionable): solo el piso
     * ========================================================= */
    {
      const fl = K.canvasTex(512, 512, (g, w, h) => {
        g.fillStyle = '#20262d'; g.fillRect(0, 0, w, h);
        const n = 4, s = w / n;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = 60 + ((i * 7 + j * 13) % 5) * 4; g.fillStyle = `rgb(${v},${v + 5},${v + 11})`; g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6); }
      });
      fl.wrapS = fl.wrapT = THREE.RepeatWrapping; fl.repeat.set(14, 14);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: fl, roughness: 0.8, metalness: 0, envMapIntensity: 0.25 }));
      floor.rotation.x = -PI / 2; floor.receiveShadow = true; floor.userData.floor = true; context.add(floor);
    }

    /* =========================================================
     *  ESTRUCTURA PRINCIPAL  (22 elementos + bastidor, plataforma y escalera)
     * ========================================================= */
    {
      const C = 'estructura', bz0 = L.bz0, by0 = L.by0, by1 = L.by1, dk = L.deckY;
      // ---------- bastidor: patas, largueros, marco tubular del canal de moldes ----------
      const fr = extra(C, 'bastidor');
      const LX = [-1.8, -0.9, 0.9, 1.8];
      LX.forEach(x => [L.bz0, L.bz1].forEach(z => fr.add(rbox(0.07, by1 - 0.06, 0.07, 0.008, bx, { pos: [x, (by1 + 0.06) / 2, z] }))));
      [by0, 1.05, by1 - 0.035].forEach(y => {
        [L.bz0, L.bz1].forEach(z => fr.add(rbox(3.66, 0.06, 0.05, 0.006, bx, { pos: [0, y, z] })));
        LX.forEach(x => fr.add(rbox(0.05, 0.06, L.bz1 - L.bz0, 0.006, bx, { pos: [x, y, 0] })));
      });
      fr.add(rbox(3.3, 0.04, 0.04, 0.004, 'steelDark', { pos: [0, 0.55, 0.48] })); fr.add(rbox(3.3, 0.04, 0.04, 0.004, 'steelDark', { pos: [0, 0.55, -0.48] }));
      [-1.65, -0.55, 0.55, 1.65].forEach(x => fr.add(rbox(0.04, 0.04, 0.96, 0.004, 'steelDark', { pos: [x, 0.55, 0] })));
      fr.add(rbox(3.4, 0.1, 0.12, 0.006, 'steelDark', { pos: [0, by1 - 0.12, 0.66] })); fr.add(rbox(3.4, 0.012, 0.16, 0.003, 'steel', { pos: [0, by1 - 0.175, 0.66] }));
      explode(fr, 0, -0.3, 0);

      // ---------- cubiertas (carcasas: rayos X / corte) ----------
      const gShell = extra(C, 'cubiertas');
      gShell.add(rbox(3.52, by1 - by0 - 0.16, 0.02, 0.004, 'panel', { pos: [0, (by0 + by1) / 2 - 0.03, bz0 - 0.005], shell: true }));
      [-1.15, 0, 1.15].forEach(x => gShell.add(rbox(0.5, 0.45, 0.012, 0.003, 'panelDark', { pos: [x, (by0 + by1) / 2 + 0.08, bz0 - 0.022], shell: true })));
      [-1, 1].forEach(s => {
        gShell.add(box(0.014, by1 - by0 - 0.24, 0.5, 'panel', { pos: [s * 1.82, 0.9, -0.5], shell: true }));
        gShell.add(box(0.014, by1 - by0 - 0.24, 0.5, 'panel', { pos: [s * 1.82, 0.9, 0.5], shell: true }));
        gShell.add(box(0.014, 0.3, 1.0, 'panel', { pos: [s * 1.82, by0 + 0.28, 0.0], shell: true }));
      });
      gShell.add(rbox(3.5, 0.2, 0.016, 0.003, 'panel', { pos: [0, by0 + 0.15, L.bz1 + 0.005], shell: true }));
      gShell.add(rbox(3.4, 0.02, 0.05, 0.003, 'steelDark', { pos: [0, by0 + 0.26, L.bz1 + 0.022] }));
      const scr = [];
      for (let i = 0; i < 34; i++) { const x = -1.72 + i * 3.44 / 33; scr.push([x, by1 - 0.2, bz0 - 0.016], [x, by0 + 0.1, bz0 - 0.016]); }
      for (let j = 0; j < 8; j++) { const y = by0 + 0.15 + j * (by1 - by0 - 0.3) / 7; scr.push([-1.775, y, bz0 - 0.016], [1.775, y, bz0 - 0.016]); }
      gShell.add(bolts(scr, 0.005, 0.012, 'nz', { mat: 'steel' }));
      explode(gShell, 0, 0, -0.35);

      // ---------- plataforma de trabajo ----------
      const pl = extra(C, 'plataforma');
      [[3.44, 1.33, 0, 0.785], [0.55, 0.78, -1.445, -0.27], [0.5, 0.78, 1.47, -0.27], [3.44, 0.09, 0, -0.705]].forEach(([w, d, x, z]) => {
        pl.add(rbox(w, 0.05, d, 0.005, 'steelDark', { pos: [x, dk - 0.025, z] }));
        const t = new THREE.Mesh(new THREE.PlaneGeometry(w, d), treadMat(w, d)); t.rotation.x = -PI / 2; t.position.set(x, dk + 0.0008, z); t.receiveShadow = true; pl.add(t);
      });
      pl.add(box(3.44, 0.03, 0.05, bx, { pos: [0, dk - 0.07, 1.42] }));
      [-1.7, 0, 1.7].forEach(x => pl.add(rbox(0.06, dk - 0.05, 0.06, 0.006, bx, { pos: [x, (dk - 0.05) / 2, 1.42] })));
      [-1.7, 1.7].forEach(x => pl.add(rbox(0.05, 0.05, 1.3, 0.006, bx, { pos: [x, dk - 0.08, 0.78] })));
      for (let i = 0; i <= 7; i++) { pl.add(cyl(0.017, 0.017, 1.0, bx, { pos: [-1.7 + i * 3.4 / 7, dk + 0.5, 1.42], seg: 16 })); pl.add(sphere(0.019, bx, { pos: [-1.7 + i * 3.4 / 7, dk + 1.0, 1.42] })); }
      [0.55, 1.0].forEach(h => pl.add(cyl(0.016, 0.016, 3.4, bx, { axis: 'x', pos: [0, dk + h, 1.42], seg: 16 })));
      [0.55, 1.0].forEach(h => pl.add(cyl(0.016, 0.016, 1.0, bx, { axis: 'z', pos: [1.7, dk + h, 0.92], seg: 16 })));
      [0.42, 1.42].forEach(z => pl.add(cyl(0.017, 0.017, 1.0, bx, { pos: [1.7, dk + 0.5, z], seg: 16 })));
      pl.add(rbox(3.4, 0.1, 0.012, 0.003, bx, { pos: [0, dk + 0.05, 1.445] }));
      [0.55, 1.0].forEach(h => [-1.7, 1.7].forEach(x => pl.add(sphere(0.02, bx, { pos: [x, dk + h, 1.42] }))));
      for (let i = 0; i <= 6; i++) pl.add(cyl(0.015, 0.015, 0.9, bx, { pos: [-1.55 + i * 0.55, dk + 0.45, -0.75], seg: 12 }));
      [0.45, 0.9].forEach(h => pl.add(cyl(0.014, 0.014, 3.3, bx, { axis: 'x', pos: [0, dk + h, -0.75], seg: 12 })));
      explode(pl, 0, 0.5, 0.2);

      // ---------- escalera (lado -X) ----------
      const st = extra(C, 'escalera');
      const run = 2.6, n = 10, rise = dk / n, stepD = run / n, sl0 = Math.hypot(run, dk), sa0 = Math.atan2(dk, run);
      [1.36, 0.66].forEach(z => { const m = rbox(sl0 + 0.1, 0.16, 0.04, 0.008, bx, { pos: [-1.7 - run / 2, dk / 2 - 0.05, z] }); m.rotation.z = sa0; st.add(m); });
      for (let i = 0; i < n; i++) {
        const cxS = -1.7 - run + (i + 0.5) * stepD, cyS = rise * (i + 1) - 0.01;
        st.add(box(stepD - 0.02, 0.03, 0.66, 'steelDark', { pos: [cxS, cyS, 1.0] }));
        const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.66, stepD - 0.03), treadMat(0.66, stepD - 0.03)); tp.rotation.x = -PI / 2; tp.rotation.z = PI / 2; tp.position.set(cxS, cyS + 0.0156, 1.0); st.add(tp);
      }
      [1.4, 0.62].forEach(z => {
        [0.6, 1.0].forEach(h => { const r = cyl(0.016, 0.016, sl0, bx, { seg: 16 }); r.rotation.z = PI / 2 + sa0; r.position.set(-1.7 - run / 2, dk / 2 + h, z); st.add(r); });
        for (let i = 0; i <= 3; i++) st.add(cyl(0.016, 0.016, 1.0, bx, { pos: [-1.7 - run * i / 3, dk * (1 - i / 3) + 0.5, z], seg: 16 }));
      });
      explode(st, -0.6, 0, 0.3);

      // ---------- elementos de la taxonomía ----------
      // (1) TUERCA DIN 11851 NW25 y (2) JUNTA RACORD: boquilla sanitaria de drenaje en el costado izquierdo
      const g1 = el(C, 1), g2 = el(C, 2), dx = -1.86, dy = 1.42, dz = -0.2;
      g1.add(pipe([[dx + 0.05, dy, dz], [dx - 0.1, dy, dz]], 0.0125, 'steel'));
      g1.add(lathe([[0.024, -0.02], [0.03, -0.014], [0.031, 0.02], [0.026, 0.026], [0.018, 0.026], [0.018, -0.02]], 'steel', { axis: 'x', pos: [dx - 0.1, dy, dz], seg: 6 }));
      g2.add(cyl(0.034, 0.034, 0.008, 'epdm', { axis: 'x', pos: [dx - 0.13, dy, dz], seg: 48 }));
      g2.add(cyl(0.028, 0.028, 0.02, 'steel', { axis: 'x', pos: [dx - 0.145, dy, dz], seg: 48 }));
      // (3)(4)(19) juntas de las tapas traseras; (5)(18) juntas de la puerta trasera L=3590
      const cy = (by0 + by1) / 2 + 0.03, gz = bz0 - 0.03;
      el(C, 3).add(frameGasket(0.5, 0.45, 0.02, 0.008, 'epdm', { pos: [-1.15, cy + 0.05, gz + 0.008] }));
      el(C, 4).add(frameGasket(0.5, 0.45, 0.02, 0.008, 'epdm', { pos: [0, cy + 0.05, gz + 0.008] }));
      el(C, 19).add(frameGasket(0.5, 0.45, 0.02, 0.008, 'epdm', { pos: [1.15, cy + 0.05, gz + 0.008] }));
      const g5 = el(C, 5), g18 = el(C, 18), hh = by1 - by0 - 0.24;
      [1, -1].forEach(s => g5.add(box(3.59, 0.018, 0.012, 'epdm', { pos: [0, cy + s * hh / 2, bz0 - 0.017] })));
      [1, -1].forEach(s => g18.add(box(0.018, hh, 0.012, 'epdm', { pos: [s * 3.59 / 2, cy, bz0 - 0.017] })));
      // (6)(7)(11) tornillos M6x20, arandelas y manillas graduables de las tapas
      const g6 = el(C, 6), g7 = el(C, 7), g11 = el(C, 11);
      const bp = [[-1.35, cy + 0.2], [-0.95, cy + 0.2], [-1.35, cy - 0.12], [-0.95, cy - 0.12]].map(p => [p[0], p[1], bz0 - 0.03]);
      g6.add(bolts(bp.map(p => [p[0], p[1], p[2] - 0.006]), 0.006, 0.02, 'nz'));
      g7.add(washers(bp.map(p => [p[0], p[1], p[2] - 0.001]), 0.006, 'z'));
      [[-1.7, 0.4], [-1.7, -0.3], [1.7, 0.4], [1.7, -0.3]].forEach(p => {
        const m = new THREE.Group(); m.position.set(p[0], cy + p[1] * 0.4, bz0 - 0.04); g11.add(m);
        m.add(cyl(0.008, 0.008, 0.03, 'steel', { axis: 'z', seg: 20 })); m.add(cyl(0.011, 0.011, 0.012, 'black', { axis: 'z', pos: [0, 0, -0.026], seg: 24 }));
        m.add(cyl(0.006, 0.006, 0.075, 'black', { pos: [0, 0.02, -0.04], seg: 16 })); m.add(sphere(0.011, 'black', { pos: [0, 0.062, -0.04] }));
      });
      // (8)(9)(10) rodillos de apoyo de salida: soporte Ø32, tapón Ø40, cuerpo PP Ø32x253
      const g8 = el(C, 8), g9 = el(C, 9), g10 = el(C, 10), by = L.belt.y;
      [-2.05, -2.12].forEach(x => {
        g10.add(cyl(0.016, 0.016, 0.253, 'pp', { axis: 'z', pos: [x, by + 0.02, 0.0], seg: 40 }));
        [-1, 1].forEach(s => {
          g9.add(cyl(0.02, 0.02, 0.012, 'black', { axis: 'z', pos: [x, by + 0.02, s * 0.1325], seg: 40 }));
          g8.add(rbox(0.05, 0.075, 0.016, 0.004, 'steelDark', { pos: [x, by - 0.005, s * 0.152] }));
          g8.add(cyl(0.008, 0.008, 0.02, 'steel', { axis: 'z', pos: [x, by + 0.02, s * 0.14], seg: 20 }));
        });
      });
      // (12) 4 pies M20 en las esquinas; (22) 5 pies M16 (4 centrales y el de la escalera)
      const g12 = el(C, 12), g22 = el(C, 22);
      [[-1.8, -0.75], [-1.8, 0.75], [1.8, -0.75], [1.8, 0.75]].forEach(p => g12.add(level(p[0], 0, p[1], 0.05, 0.3)));
      [[-0.9, -0.75], [0.9, -0.75], [-0.9, 0.75], [0.9, 0.75]].forEach(p => g22.add(level(p[0], 0, p[1], 0.05, 0.3)));
      g22.add(level(-1.7 - run + 0.02, 0.0, 0.66, 0.05, 0.06));
      // (13)(14)(15)(17) bandejas de recogida: charolas bajo el canal de moldes
      const tray = (w, d, cx, cz) => {
        const g = new THREE.Group(); g.position.set(cx, by0 + 0.03, cz);
        g.add(box(w, 0.006, d, 'steel'));
        [d / 2, -d / 2].forEach(z => g.add(box(w, 0.05, 0.006, 'steel', { pos: [0, 0.025, z] })));
        [w / 2, -w / 2].forEach(x => g.add(box(0.006, 0.05, d, 'steel', { pos: [x, 0.025, 0] })));
        g.add(cyl(0.012, 0.012, 0.008, 'steelDark', { pos: [0, 0.0, 0], seg: 20 }));
        return g;
      };
      el(C, 14).add(tray(1.6, 0.5, -0.97, -0.42));
      const g13 = el(C, 13); g13.add(tray(0.78, 0.5, 0.32, -0.42)); g13.add(tray(0.78, 0.5, 1.12, -0.42));
      el(C, 15).add(tray(1.6, 0.4, -0.97, 0.36));
      const g17 = el(C, 17); g17.add(tray(0.82, 0.4, 0.55, 0.36)); g17.add(tray(0.82, 0.4, 1.39, 0.36));
      // (16) 27 bolas de lavado CD-17C bajo la plataforma y su colector
      const g16 = el(C, 16);
      const ballG = K.geo('sprayBall28', () => K.merge([new THREE.SphereGeometry(0.014, 20, 14)].concat([0, 1, 2, 3, 4, 5].map(i => { const g = new THREE.CylinderGeometry(0.003, 0.004, 0.012, 8); g.rotateZ(PI / 2); g.rotateY(i * PI / 3); g.translate(0.014 * Math.cos(i * PI / 3), 0, -0.014 * Math.sin(i * PI / 3)); return g; })).concat([K.tr(new THREE.CylinderGeometry(0.006, 0.006, 0.02, 12), 0, 0.016, 0)])));
      K.sprayBall28 = ballG;
      const ballPos = [];
      [-0.5, 0.0, 0.5].forEach(z => { for (let i = 0; i < 9; i++) ballPos.push({ p: [-1.62 + i * 0.405, by1 - 0.28, z], r: [PI, 0, 0] }); });
      g16.add(inst(ballG, 'steel', ballPos));
      [-0.5, 0.0, 0.5].forEach(z => g16.add(pipe([[-1.72, by1 - 0.245, z], [1.72, by1 - 0.245, z]], 0.008, 'steel', { radial: 12 })));
      // (20)(21) juntas de armarios
      const c1 = L.small, c2 = L.tall;
      el(C, 20).add(frameGasket(c1.w - 0.04, c1.h - 0.04, 0.018, 0.006, 'epdm', { pos: [c1.x, c1.y, c1.z + c1.d / 2 - 0.004] }));
      el(C, 21).add(frameGasket(c2.w - 0.04, c2.h - 0.04, 0.02, 0.006, 'epdm', { pos: [c2.x, c2.y, c2.z + c2.d / 2 - 0.004] }));
    }

    /* =========================================================
     *  RODILLOS TRANSPORTADORES (9) — imagen 70
     * ========================================================= */
    {
      const C = 'rodillos', y0 = 0.88, x0 = -2.45, n = 22, pitch = 0.062;
      const g1 = el(C, 1), g2 = el(C, 2), g3 = el(C, 3), g4 = el(C, 4), g5 = el(C, 5), g6 = el(C, 6), g7 = el(C, 7), g8 = el(C, 8), g9 = el(C, 9);
      const xs = []; for (let i = 0; i < n; i++) xs.push(x0 - i * pitch);
      g2.add(inst(K.geo('rod40x279', () => new THREE.CylinderGeometry(0.02, 0.02, 0.279, 40)), 'pp', xs.map(x => ({ p: [x, y0, 0], r: [PI / 2, 0, 0] }))));
      const capPos = []; xs.forEach(x => [-1, 1].forEach(s => capPos.push({ p: [x, y0, s * 0.1445], r: [PI / 2, 0, 0] })));
      g1.add(inst(K.geo('cap40', () => new THREE.CylinderGeometry(0.0205, 0.0205, 0.012, 40)), 'black', capPos));
      g2.add(inst(K.geo('rodAxle', () => new THREE.CylinderGeometry(0.006, 0.006, 0.34, 12)), 'steelDark', xs.map(x => ({ p: [x, y0, 0], r: [PI / 2, 0, 0] }))));
      const len = n * pitch + 0.08, cx = x0 - (n - 1) * pitch / 2;
      [[0.175, g4], [-0.175, g5]].forEach(([z, g]) => {
        g.add(rbox(len, 0.05, 0.012, 0.003, 'blue', { pos: [cx, y0 - 0.005, z] }));
        g.add(rbox(len, 0.012, 0.04, 0.003, 'blue', { pos: [cx, y0 - 0.03, z + Math.sign(z) * 0.014] }));
        g.add(rbox(len, 0.014, 0.014, 0.003, 'steelDark', { pos: [cx, y0 + 0.04, z + Math.sign(z) * 0.03] }));
      });
      [x0 + 0.03, cx, x0 - (n - 1) * pitch - 0.03].forEach(x => g4.add(rbox(0.04, 0.03, 0.36, 0.004, 'blue', { pos: [x, y0 - 0.065, 0] })));
      const legX = [x0 - 0.05, x0 - (n - 1) * pitch + 0.05];
      legX.forEach(x => [-1, 1].forEach(s => { g5.add(rbox(0.04, y0 - 0.1, 0.04, 0.004, 'steelDark', { pos: [x, (y0 - 0.1) / 2 + 0.06, s * 0.16] })); g5.add(rbox(0.03, 0.03, 0.32, 0.003, 'steelDark', { pos: [x, 0.35, 0] })); }));
      legX.forEach(x => [-1, 1].forEach(s => {
        g9.add(K.level(x, 0, s * 0.16, 0.025, 0.09));
        g8.add(cyl(0.014, 0.014, 0.013, 'steelDark', { pos: [x, 0.072, s * 0.16], seg: 6 }));
        g7.add(cyl(0.017, 0.017, 0.003, 'steel', { pos: [x, 0.062, s * 0.16], seg: 24 }));
        g6.add(cyl(0.022, 0.026, 0.02, 'steelDark', { pos: [x, 0.09, s * 0.16], seg: 32 }));
      }));
      [[x0 - 0.15, 0.2], [x0 - 0.15, -0.2], [x0 - 1.15, 0.2], [x0 - 1.15, -0.2]].forEach(p => {
        const m = new THREE.Group(); m.position.set(p[0], y0 + 0.02, p[1] + Math.sign(p[1]) * 0.03); g3.add(m);
        m.add(cyl(0.028, 0.028, 0.012, 'steel', { pos: [0, -0.006, 0], seg: 32 })); m.add(cyl(0.007, 0.007, 0.03, 'steel', { pos: [0, 0.012, 0], seg: 16 }));
        m.add(rbox(0.012, 0.012, 0.075, 0.004, 'black', { pos: [0, 0.03, Math.sign(p[1]) * 0.04] })); m.add(sphere(0.011, 'black', { pos: [0, 0.03, Math.sign(p[1]) * 0.08] }));
      });
      explode(g2, -0.7, 0, 0); explode(g4, -0.7, 0, 0); explode(g5, -0.7, 0, 0); explode(g1, -0.7, 0, 0);
    }
  });
})();
