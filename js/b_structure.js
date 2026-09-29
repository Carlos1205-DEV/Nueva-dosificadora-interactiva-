/* Layout general + estructura de soporte (contexto) + ESTRUCTURA PRINCIPAL + RODILLOS TRANSPORTADORES */
(function () {
  'use strict';
  window.MODEL_BUILDERS.push(function (K) {
    const { THREE, PI, TAU, el, comps, box, rbox, cyl, torus, sphere, lathe, extrude, put, bolts, nuts, washers, line, grid, pipe, hose, clamp, inst, mat, mesh, explode, spin, context } = K;

    /* ---------- LAYOUT (metros) ---------- */
    const L = K.L = {
      bx0: -1.8, bx1: 1.8, bz0: -0.8, bz1: 0.8, by0: 0.32, by1: 1.32,   // cuerpo inferior
      deckY: 1.75,                                                       // plataforma
      roofY: 3.4,                                                        // techo de la torre
      belt: { y: 0.86, z: 0.0, x0: -2.05, x1: 1.68 },
      small: { x: -0.95, y: 2.85, z: 0.265, w: 0.5, h: 0.45, d: 0.22 },  // armario 500x450x220
      tall: { x: -0.65, y: 0.85, z: 0.97, w: 0.7, h: 1.7, d: 0.3 },      // armario 700x1700x300
      hopper: { x0: -1.25, x1: 1.25, z0: -0.5, z1: -0.1, y0: 2.72, y1: 3.25 },
      cass: { x0: -1.2, x1: 1.2, y0: 2.02, y1: 2.66, z0: -0.46, z1: -0.14, n: 41 },
      hx: { x: 2.55, z: -0.1 }                                           // intercambiador
    };
    const P = K.mat;

    /* ---------- helpers locales ---------- */
    function frameGasket(w, h, t, th, m, o) { // marco rectangular plano en XY (grosor z = th)
      const s = new THREE.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.closePath();
      const p = new THREE.Path(); p.moveTo(-w / 2 + t, -h / 2 + t); p.lineTo(-w / 2 + t, h / 2 - t); p.lineTo(w / 2 - t, h / 2 - t); p.lineTo(w / 2 - t, -h / 2 + t); p.closePath(); s.holes.push(p);
      return extrude(s, th, m || 'epdm', o);
    }
    K.frameGasket = frameGasket;
    function level(x, y, z, r, mainY, m) { // pie de nivelación Martin (base + vástago roscado + tuerca)
      const g = new THREE.Group(); g.position.set(x, 0, z);
      g.add(lathe([[0.0, 0.0], [r, 0.0], [r * 1.02, 0.012], [r * 0.9, 0.022], [r * 0.34, 0.03], [r * 0.22, 0.045]], 'black', { seg: 40 }));
      g.add(cyl(r * 0.1, r * 0.1, mainY - 0.05, 'steel', { pos: [0, 0.045 + (mainY - 0.05) / 2, 0], seg: 20 }));
      g.add(cyl(r * 0.2, r * 0.2, 0.014, 'steelDark', { pos: [0, 0.075, 0], seg: 6 }));
      g.add(cyl(r * 0.2, r * 0.2, 0.014, 'steelDark', { pos: [0, mainY - 0.03, 0], seg: 6 }));
      return g;
    }
    K.level = level;
    function meshPanel(w, h, cell) { // malla de protección (textura con alfa)
      const t = K.canvasTex(256, 256, (c, W, H) => {
        c.clearRect(0, 0, W, H); c.strokeStyle = '#8f98a0'; c.lineWidth = 5;
        const n = 8; for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * W / n, 0); c.lineTo(i * W / n, H); c.stroke(); c.beginPath(); c.moveTo(0, i * H / n); c.lineTo(W, i * H / n); c.stroke(); }
      });
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / cell, h / cell);
      return new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, metalness: 0.7, roughness: 0.5, color: 0xffffff });
    }

    /* =========================================================
     *  CONTEXTO (no seleccionable): piso, columnas, techo, plataforma, escalera
     * ========================================================= */
    {
      const fl = K.canvasTex(512, 512, (g, w, h) => {
        g.fillStyle = '#20262d'; g.fillRect(0, 0, w, h);
        const n = 4, s = w / n;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = 60 + ((i * 7 + j * 13) % 5) * 4; g.fillStyle = `rgb(${v},${v + 5},${v + 11})`; g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6); }
      });
      fl.wrapS = fl.wrapT = THREE.RepeatWrapping; fl.repeat.set(14, 14);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(28, 28), new THREE.MeshStandardMaterial({ map: fl, roughness: 0.8, metalness: 0, envMapIntensity: 0.25 }));
      floor.rotation.x = -PI / 2; floor.receiveShadow = true; floor.userData.floor = true; context.add(floor);

      const bx = 'brushed';
      // marcos del cuerpo inferior (patas y largueros)
      [[L.bx0, L.bz0], [L.bx0, L.bz1], [L.bx1, L.bz0], [L.bx1, L.bz1]].forEach(p => {
        context.add(rbox(0.07, L.by1 - 0.06, 0.07, 0.008, bx, { pos: [p[0], (L.by1 + 0.06) / 2, p[1]] }));
      });
      [L.by0, L.by1].forEach(y => {
        [L.bz0, L.bz1].forEach(z => context.add(rbox(L.bx1 - L.bx0, 0.06, 0.05, 0.006, bx, { pos: [0, y, z] })));
        [L.bx0, L.bx1].forEach(x => context.add(rbox(0.05, 0.06, L.bz1 - L.bz0, 0.006, bx, { pos: [x, y, 0] })));
      });
      [-0.9, 0.9].forEach(x => { [L.bz0, L.bz1].forEach(z => context.add(rbox(0.05, L.by1 - 0.06, 0.05, 0.006, bx, { pos: [x, (L.by1 + 0.06) / 2, z] }))); context.add(rbox(0.05, 0.05, L.bz1 - L.bz0, 0.006, bx, { pos: [x, L.by0, 0] })); });
      // panel superior del cuerpo (fondo del canal de moldeo)
      context.add(box(3.5, 0.02, 1.5, 'steelDark', { pos: [0, L.by1 + 0.005, 0] }));

      // columnas de la torre
      const colX = [-1.6, -0.5, 0.5, 1.6];
      [-0.68, 0.16].forEach(z => colX.forEach(x => context.add(rbox(0.07, L.roofY - L.by1, 0.07, 0.008, bx, { pos: [x, (L.roofY + L.by1) / 2, z] }))));
      [-0.68, 0.16].forEach(z => [1.9, 2.6, 3.3].forEach(y => context.add(rbox(3.3, 0.05, 0.05, 0.006, bx, { pos: [0, y, z] }))));
      [-1.6, -0.5, 0.5, 1.6].forEach(x => [1.9, 2.6, 3.3].forEach(y => context.add(rbox(0.05, 0.05, 0.84, 0.006, bx, { pos: [x, y, -0.26] }))));
      // techo (canopy)
      context.add(rbox(3.5, 0.03, 1.15, 0.008, 'panelDark', { pos: [0, L.roofY + 0.02, -0.26], mat: { metalness: 0.7 } }));
      context.add(box(3.5, 0.06, 0.02, 'brushed', { pos: [0, L.roofY - 0.01, 0.3] }));
      // mallas de protección laterales y trasera
      const mm = meshPanel(0.84, 1.4, 0.07);
      [-1.6, 1.6].forEach(x => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 1.4), mm); m.rotation.y = PI / 2; m.position.set(x, 2.6, -0.26); context.add(m); });
      const mm2 = meshPanel(3.1, 1.4, 0.07); const mb = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.4), mm2); mb.position.set(0, 2.6, -0.68); context.add(mb);

      // plataforma de trabajo (deck, viga perimetral, columnas y barandal)
      const dk = L.deckY;
      context.add(rbox(3.44, 0.05, 0.9, 0.006, 'steelDark', { pos: [0, dk - 0.025, 1.0] }));
      context.add(box(3.44, 0.03, 0.05, 'brushed', { pos: [0, dk - 0.07, 1.42] }));
      [-1.7, 0, 1.7].forEach(x => context.add(rbox(0.06, dk - 0.05, 0.06, 0.006, bx, { pos: [x, (dk - 0.05) / 2, 1.42] })));
      [-1.7, 1.7].forEach(x => context.add(rbox(0.05, 0.05, 0.9, 0.006, bx, { pos: [x, dk - 0.08, 1.0] })));
      // barandales (postes + 2 pasamanos)
      const railZ = 1.42;
      for (let i = 0; i <= 7; i++) context.add(cyl(0.017, 0.017, 1.0, bx, { pos: [-1.7 + i * 3.4 / 7, dk + 0.5, railZ], seg: 16 }));
      [0.55, 1.0].forEach(h => context.add(cyl(0.016, 0.016, 3.4, bx, { axis: 'x', pos: [0, dk + h, railZ], seg: 16 })));
      [1.42, 0.6].forEach(z => { [0.55, 1.0].forEach(h => context.add(cyl(0.016, 0.016, 0.94, bx, { axis: 'z', pos: [1.7, dk + h, (1.42 + 0.5) / 2 + (z === 0.6 ? -0.0 : 0)], seg: 16 }))); });
      [0.5, 1.4].forEach(z => context.add(cyl(0.017, 0.017, 1.0, bx, { pos: [1.7, dk + 0.5, z], seg: 16 })));
      // escalera al lado -X
      const st = new THREE.Group(); context.add(st);
      const run = 2.6, n = 10, rise = dk / n, stepD = run / n;
      const sl0 = Math.hypot(run, dk), sa0 = Math.atan2(dk, run);
      [1.36, 0.66].forEach(z => {
        const m = rbox(sl0 + 0.1, 0.16, 0.04, 0.008, bx, { pos: [-1.7 - run / 2, dk / 2 - 0.05, z] }); m.rotation.z = sa0; st.add(m);
      });
      for (let i = 0; i < n; i++) st.add(box(stepD - 0.02, 0.03, 0.66, 'steelDark', { pos: [-1.7 - run + (i + 0.5) * stepD, rise * (i + 1) - 0.01, 1.0] }));
      const sl = Math.hypot(run, dk), sa = Math.atan2(dk, run);
      [1.4, 0.62].forEach(z => {
        [0.6, 1.0].forEach(h => { const r = cyl(0.016, 0.016, sl, bx, { seg: 16 }); r.rotation.z = PI / 2 + sa; r.position.set(-1.7 - run / 2, dk / 2 + h, z); st.add(r); });
        for (let i = 0; i <= 3; i++) st.add(cyl(0.016, 0.016, 1.0, bx, { pos: [-1.7 - run * i / 3, dk * (1 - i / 3) + 0.5, z], seg: 16 }));
      });
    }

    /* =========================================================
     *  ESTRUCTURA PRINCIPAL  (22 elementos)
     * ========================================================= */
    {
      const C = 'estructura', bz0 = L.bz0, by0 = L.by0, by1 = L.by1;
      // paneles de cubierta del cuerpo (carcasas: rayos X / corte)
      const gShell = new THREE.Group(); gShell.name = 'estructura:cubiertas'; gShell.userData.comp = C; comps[C].add(gShell);
      // puerta trasera (Z-)
      gShell.add(rbox(3.52, by1 - by0 - 0.08, 0.02, 0.004, 'panel', { pos: [0, (by0 + by1) / 2, bz0 - 0.005], shell: true }));
      // tapas traseras (protección y tapa) con su marco
      [-1.15, 1.15].forEach(x => gShell.add(rbox(0.5, 0.45, 0.012, 0.003, 'panelDark', { pos: [x, (by0 + by1) / 2 + 0.05, bz0 - 0.022], shell: true })));
      gShell.add(rbox(0.5, 0.45, 0.012, 0.003, 'panelDark', { pos: [0, (by0 + by1) / 2 + 0.05, bz0 - 0.022], shell: true }));
      // cubiertas de los extremos con ventana
      [-1, 1].forEach(s => {
        gShell.add(box(0.014, by1 - by0 - 0.1, 0.42, 'panel', { pos: [s * 1.8, (by0 + by1) / 2, -0.55], shell: true }));
        gShell.add(box(0.014, by1 - by0 - 0.1, 0.4, 'panel', { pos: [s * 1.8, (by0 + by1) / 2, 0.6], shell: true }));
        gShell.add(box(0.014, 0.15, 0.6, 'panel', { pos: [s * 1.8, by0 + 0.1, 0.0], shell: true }));
        gShell.add(box(0.014, 0.12, 0.6, 'panel', { pos: [s * 1.8, by1 - 0.09, 0.0], shell: true }));
      });
      // frente: faldón superior e inferior (ventana de observación al centro)
      gShell.add(rbox(3.5, 0.34, 0.016, 0.003, 'panel', { pos: [0, by1 - 0.19, L.bz1 + 0.005], shell: true }));
      gShell.add(rbox(3.5, 0.2, 0.016, 0.003, 'panel', { pos: [0, by0 + 0.12, L.bz1 + 0.005], shell: true }));
      gShell.add(rbox(3.4, 0.02, 0.05, 0.003, 'steelDark', { pos: [0, by1 - 0.365, L.bz1 + 0.022] }));
      // techo del cuerpo con marco de la ventana (tapa)
      // (1) TUERCA DIN 11851 NW25 y (2) JUNTA RACORD -> boquilla sanitaria de drenaje frontal
      const g1 = el(C, 1), g2 = el(C, 2);
      const dx = 1.35, dy = 0.44, dz = L.bz1 + 0.12;
      g1.add(pipe([[dx, dy, L.bz1 - 0.02], [dx, dy, dz - 0.05]], 0.0125, 'steel'));
      g1.add(lathe([[0.024, -0.02], [0.03, -0.014], [0.031, 0.02], [0.026, 0.026], [0.018, 0.026], [0.018, -0.02]], 'steel', { axis: 'z', pos: [dx, dy, dz - 0.07], seg: 6 }));
      g2.add(cyl(0.034, 0.034, 0.008, 'epdm', { axis: 'z', pos: [dx, dy, dz - 0.03], seg: 48 }));
      g2.add(cyl(0.028, 0.028, 0.02, 'steel', { axis: 'z', pos: [dx, dy, dz - 0.012], seg: 48 }));
      // (3)(4)(5)(18)(19) juntas: marcos de EPDM
      const gz = bz0 - 0.03;
      el(C, 3).add(frameGasket(0.5, 0.45, 0.02, 0.008, 'epdm', { pos: [-1.15, (by0 + by1) / 2 + 0.05, gz + 0.008] }));
      el(C, 4).add(frameGasket(0.5, 0.45, 0.02, 0.008, 'epdm', { pos: [0, (by0 + by1) / 2 + 0.05, gz + 0.008] }));
      el(C, 19).add(frameGasket(0.5, 0.45, 0.02, 0.008, 'epdm', { pos: [1.15, (by0 + by1) / 2 + 0.05, gz + 0.008] }));
      // 5: perfil horizontal (arriba/abajo) y 18: verticales de la junta de la puerta trasera, L=3590
      const g5 = el(C, 5), g18 = el(C, 18), cy = (by0 + by1) / 2, hh = by1 - by0 - 0.12;
      [1, -1].forEach(s => g5.add(box(3.59, 0.018, 0.012, 'epdm', { pos: [0, cy + s * hh / 2, bz0 - 0.017] })));
      [1, -1].forEach(s => g18.add(box(0.018, hh, 0.012, 'epdm', { pos: [s * 3.59 / 2, cy, bz0 - 0.017] })));
      // (6)(7)(11) tornillos M6x20, arandelas y manillas graduables
      const g6 = el(C, 6), g7 = el(C, 7), g11 = el(C, 11);
      const bp = [[-1.35, cy + 0.2], [-0.95, cy + 0.2], [-1.35, cy - 0.12], [-0.95, cy - 0.12]].map(p => [p[0], p[1], bz0 - 0.03]);
      g6.add(bolts(bp.map(p => [p[0], p[1], p[2] - 0.006]), 0.006, 0.02, 'nz'));
      g7.add(washers(bp.map(p => [p[0], p[1], p[2] - 0.001]), 0.006, 'z'));
      [[-1.7, 0.4], [-1.7, -0.3], [1.7, 0.4], [1.7, -0.3]].forEach(p => {
        const m = new THREE.Group(); m.position.set(p[0] + (p[0] < 0 ? -0.0 : 0.0), cy + p[1] * 0.4, bz0 - 0.04); g11.add(m);
        m.add(cyl(0.008, 0.008, 0.03, 'steel', { axis: 'z', pos: [0, 0, 0.0], seg: 20 }));
        m.add(cyl(0.011, 0.011, 0.012, 'black', { axis: 'z', pos: [0, 0, -0.026], seg: 24 }));
        m.add(cyl(0.006, 0.006, 0.075, 'black', { pos: [0, 0.02, -0.04], seg: 16 }));
        m.add(sphere(0.011, 'black', { pos: [0, 0.062, -0.04] }));
      });
      // (8)(9)(10) rodillos de apoyo de salida: soporte Ø32, tapón Ø40 y cuerpo PP
      const g8 = el(C, 8), g9 = el(C, 9), g10 = el(C, 10);
      [-2.12, -2.19].forEach(x => {
        g10.add(cyl(0.016, 0.016, 0.253, 'pp', { axis: 'z', pos: [x, L.belt.y + 0.02, 0.0], seg: 40 }));
        [-1, 1].forEach(s => {
          g9.add(cyl(0.02, 0.02, 0.012, 'black', { axis: 'z', pos: [x, L.belt.y + 0.02, s * 0.1325], seg: 40 }));
          g8.add(rbox(0.05, 0.075, 0.016, 0.004, 'steelDark', { pos: [x, L.belt.y - 0.005, s * 0.152] }));
          g8.add(cyl(0.008, 0.008, 0.02, 'steel', { axis: 'z', pos: [x, L.belt.y + 0.02, s * 0.14], seg: 20 }));
        });
      });
      // (12)(22) pies de nivelación M20 (x4) y M16 (x5)
      const g12 = el(C, 12), g22 = el(C, 22);
      [[L.bx0, L.bz0], [L.bx0, L.bz1], [L.bx1, L.bz0], [L.bx1, L.bz1]].forEach(p => g12.add(level(p[0], 0, p[1], 0.05, 0.3)));
      [[-0.9, L.bz0], [0.9, L.bz0], [-0.9, L.bz1], [0.9, L.bz1], [0, L.bz0]].forEach(p => g22.add(level(p[0], 0, p[1], 0.05, 0.3)));
      // (13)(14)(15)(17) bandejas de recogida (6)
      const tray = (w, d, cx, cz, id) => {
        const g = new THREE.Group(); g.position.set(cx, by0 + 0.03, cz);
        g.add(box(w, 0.006, d, 'steel'));
        [[0, d / 2, w, 0.006], [0, -d / 2, w, 0.006]].forEach(q => g.add(box(q[2], 0.05, q[3], 'steel', { pos: [q[0], 0.025, q[1]] })));
        [[w / 2], [-w / 2]].forEach(q => g.add(box(0.006, 0.05, d, 'steel', { pos: [q[0], 0.025, 0] })));
        g.add(cyl(0.012, 0.012, 0.008, 'steelDark', { pos: [0, 0.0, 0], seg: 20 }));
        return g;
      };
      el(C, 14).add(tray(1.6, 0.5, -0.97, -0.42));
      const g13 = el(C, 13); g13.add(tray(0.78, 0.5, 0.32, -0.42)); g13.add(tray(0.78, 0.5, 1.12, -0.42));
      el(C, 15).add(tray(1.6, 0.4, -0.97, 0.36));
      const g17 = el(C, 17); g17.add(tray(0.82, 0.4, 0.14 + 0.41, 0.36)); g17.add(tray(0.82, 0.4, 0.98 + 0.41 - 0.0, 0.36));
      // (16) 27 bolas de lavado CD-17C y su colector
      const g16 = el(C, 16);
      const ballG = K.geo('sprayBall28', () => K.merge([new THREE.SphereGeometry(0.014, 20, 14)].concat([0, 1, 2, 3, 4, 5].map(i => { const g = new THREE.CylinderGeometry(0.003, 0.004, 0.012, 8); g.rotateZ(PI / 2); g.rotateY(i * PI / 3); g.translate(0.014 * Math.cos(i * PI / 3), 0, -0.014 * Math.sin(i * PI / 3)); return g; })).concat([tr0(new THREE.CylinderGeometry(0.006, 0.006, 0.02, 12), 0, 0.016, 0)])));
      function tr0(g, x, y, z) { g.translate(x, y, z); return g; }
      K.sprayBall28 = ballG;
      const ballPos = [];
      [-0.55, 0.0, 0.55].forEach(z => { for (let i = 0; i < 9; i++) ballPos.push({ p: [-1.62 + i * 0.405, by1 - 0.09, z], r: [PI, 0, 0] }); });
      g16.add(inst(ballG, 'steel', ballPos));
      [-0.55, 0.0, 0.55].forEach(z => g16.add(pipe([[-1.72, by1 - 0.055, z], [1.72, by1 - 0.055, z]], 0.008, 'steel', { radial: 12 })));

      // (20)(21) juntas de armarios (marcos)
      const c1 = L.small, c2 = L.tall;
      el(C, 20).add(frameGasket(c1.w - 0.04, c1.h - 0.04, 0.018, 0.006, 'epdm', { pos: [c1.x, c1.y, c1.z + c1.d / 2 - 0.004] }));
      el(C, 21).add(frameGasket(c2.w - 0.04, c2.h - 0.04, 0.02, 0.006, 'epdm', { pos: [c2.x, c2.y, c2.z + c2.d / 2 - 0.004] }));
      explode(gShell, 0, 0, -0.35);
    }

    /* =========================================================
     *  RODILLOS TRANSPORTADORES (9)
     * ========================================================= */
    {
      const C = 'rodillos', y0 = 0.88, x0 = -2.27, n = 22, pitch = 0.062;
      const g1 = el(C, 1), g2 = el(C, 2), g3 = el(C, 3), g4 = el(C, 4), g5 = el(C, 5), g6 = el(C, 6), g7 = el(C, 7), g8 = el(C, 8), g9 = el(C, 9);
      const xs = []; for (let i = 0; i < n; i++) xs.push(x0 - i * pitch);
      const body = K.geo('rod40x279', () => new THREE.CylinderGeometry(0.02, 0.02, 0.279, 40));
      g2.add(inst(body, 'pp', xs.map(x => ({ p: [x, y0, 0], r: [PI / 2, 0, 0] }))));
      const cap = K.geo('cap40', () => new THREE.CylinderGeometry(0.0205, 0.0205, 0.012, 40));
      const capPos = []; xs.forEach(x => [-1, 1].forEach(s => capPos.push({ p: [x, y0, s * 0.1445], r: [PI / 2, 0, 0] })));
      g1.add(inst(cap, 'black', capPos));
      // ejes pasantes
      const ax = K.geo('rodAxle', () => new THREE.CylinderGeometry(0.006, 0.006, 0.34, 12));
      g2.add(inst(ax, 'steelDark', xs.map(x => ({ p: [x, y0, 0], r: [PI / 2, 0, 0] }))));
      // soportes (largueros de perfil en L)
      const len = n * pitch + 0.08, cx = x0 - (n - 1) * pitch / 2;
      [[0.175, g4], [-0.175, g5]].forEach(([z, g]) => {
        g.add(rbox(len, 0.05, 0.012, 0.003, 'orange', { pos: [cx, y0 - 0.005, z] }));
        g.add(rbox(len, 0.012, 0.04, 0.003, 'orange', { pos: [cx, y0 - 0.03, z + Math.sign(z) * 0.014] }));
        g.add(rbox(len, 0.01, 0.03, 0.003, 'orange', { pos: [cx, y0 + 0.028, z + Math.sign(z) * 0.006] }));
      });
      // travesaños y patas
      [x0 + 0.03, cx, x0 - (n - 1) * pitch - 0.03].forEach(x => g4.add(rbox(0.04, 0.03, 0.36, 0.004, 'orange', { pos: [x, y0 - 0.065, 0] })));
      const legX = [x0 + 0.02, x0 - (n - 1) * pitch - 0.02];
      // patas: 2 apoyos con pie de nivelación Ø50 (base roscada, tuerca, arandela)
      legX.forEach((x, k) => [-1, 1].forEach(s => {
        g5.add(rbox(0.04, y0 - 0.1, 0.04, 0.004, 'orange', { pos: [x, (y0 - 0.1) / 2 + 0.06, s * 0.16] }));
      }));
      [legX[1]].forEach(x => {
        [-1, 1].forEach(s => {
          g6.add(cyl(0.022, 0.026, 0.02, 'steelDark', { pos: [x, 0.09, s * 0.16], seg: 32 }));
        });
      });
      // 2 pies Martin Ø50 (bajo cada pata del extremo) con tuerca y arandela M16
      [-1, 1].forEach(s => {
        const p = K.level(legX[1], 0, s * 0.16, 0.025, 0.09); p.scale.setScalar(1); g9.add(p);
        g8.add(cyl(0.014, 0.014, 0.013, 'steelDark', { pos: [legX[1], 0.072, s * 0.16], seg: 6 }));
        g7.add(cyl(0.017, 0.017, 0.003, 'steel', { pos: [legX[1], 0.062, s * 0.16], seg: 24 }));
      });
      // manillas graduables GN300 (4) en los largueros
      [[x0 - 0.15, 0.2], [x0 - 0.15, -0.2], [x0 - 1.15, 0.2], [x0 - 1.15, -0.2]].forEach(p => {
        const m = new THREE.Group(); m.position.set(p[0], y0 - 0.04, p[1] * 1.0 + Math.sign(p[1]) * 0.02); g3.add(m);
        m.add(cyl(0.007, 0.007, 0.03, 'steel', { axis: 'z', pos: [0, 0, 0], seg: 16 }));
        m.add(rbox(0.012, 0.012, 0.075, 0.004, 'black', { pos: [0, 0.0, Math.sign(p[1]) * 0.05], rot: [0, 0, 0] }));
        m.add(sphere(0.011, 'black', { pos: [0, 0, Math.sign(p[1]) * 0.09] }));
      });
      // transmisión: cadena de rodillos (el giro se anima en app)
      const rg = new THREE.Group(); g2.add(rg); rg.userData.rollers = true;
      K.rodillosXs = xs;
      explode(g2, -0.7, 0, 0); explode(g4, -0.7, 0, 0); explode(g5, -0.7, -0.0, 0); explode(g1, -0.7, 0, 0);
    }
  });
})();
