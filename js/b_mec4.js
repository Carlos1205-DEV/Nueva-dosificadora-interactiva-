/* INTERCAMBIADOR TÉRMICO (9) · SISTEMA DE TUBERÍAS (10) */
(function () {
  'use strict';
  window.MODEL_BUILDERS.push(function (K) {
    const { THREE, PI, TAU, el, comps, box, rbox, cyl, torus, sphere, lathe, extrude, merge, tr, put, bolts, nuts, washers, line, grid, pipe, hose, clamp, inst, mat, mesh, explode, spin, geo, anim, state } = K;
    const extra = K.extra, slotted = K.slotted, L = K.L, S = K.parts, HX = L.hx;

    // coloca una válvula mariposa con sus dos abrazaderas; axis: dirección del flujo
    function place(g, od, act, x, y, z, axis) {
      const v = S.butterfly(od, act), r = od / 2000, Lh = 0.1 + r * 0.6;
      if (axis === 'y') v.rotation.z = PI / 2; else if (axis === 'z') v.rotation.y = PI / 2;
      v.position.set(x, y, z); g.add(v);
      const dx = axis === 'x' || !axis ? 1 : 0, dy = axis === 'y' ? 1 : 0, dz = axis === 'z' ? 1 : 0;
      [-1, 1].forEach(s => g.add(clamp(x + dx * s * (Lh / 2 + 0.006), y + dy * s * (Lh / 2 + 0.006), z + dz * s * (Lh / 2 + 0.006), axis || 'x', r)));
      return v;
    }
    function joint(g, od, x, y, z, axis) { g.add(clamp(x, y, z, axis || 'x', od / 2000)); }
    function flange(x, y, z, axis, r, m) { return cyl(r * 1.6, r * 1.6, 0.02, m || 'steel', { axis, pos: [x, y, z], seg: 40 }); }

    /* =========================================================
     *  INTERCAMBIADOR TÉRMICO (9)
     * ========================================================= */
    {
      const C = 'intercambiador', cx = HX.x, cz = HX.z;
      // bastidor tubular del intercambiador (estructura de soporte, contexto)
      const fx = [cx - 0.35, cx + 0.35], fz = [cz - 0.42, cz + 0.42];
      const fr = new THREE.Group(); fr.name = 'intercambiador:bastidor'; fr.userData.comp = C; comps[C].add(fr);
      fx.forEach(x => fz.forEach(z => fr.add(rbox(0.05, 2.15, 0.05, 0.005, 'brushed', { pos: [x, 1.15, z] }))));
      [0.32, 1.35, 2.2].forEach(y => { fz.forEach(z => fr.add(rbox(0.75, 0.04, 0.04, 0.004, 'brushed', { pos: [cx, y, z] }))); fx.forEach(x => fr.add(rbox(0.04, 0.04, 0.85, 0.004, 'brushed', { pos: [x, y, cz] }))); });
      // 7 pies M16 ×4
      const g7 = el(C, 7); fx.forEach(x => fz.forEach(z => g7.add(K.level(x, 0, z, 0.05, 0.33))));
      // 5 intercambiador tubular MBS MLI 114 (vertical, L=1450)
      const g5 = el(C, 5), yb = 0.5, ye = 1.95, r = 0.057;
      g5.add(lathe([[0, yb], [r * 1.5, yb], [r * 1.5, yb + 0.02], [r * 1.05, yb + 0.03], [r * 1.05, yb + 0.18], [r, yb + 0.18], [r, ye - 0.18], [r * 1.05, ye - 0.18], [r * 1.05, ye - 0.03], [r * 1.5, ye - 0.02], [r * 1.5, ye], [0, ye]], 'steel', { pos: [cx, 0, cz], seg: 64, mat: { roughness: 0.16 } }));
      [yb + 0.03, ye - 0.03].forEach(y => { g5.add(cyl(r * 1.35, r * 1.35, 0.06, 'steel', { pos: [cx, y + (y < 1 ? 0.035 : -0.035), cz], seg: 64 })); });
      g5.add(cyl(r * 1.05, r * 1.05, 1.45 - 0.35, 'steel', { pos: [cx, (yb + ye) / 2, cz], seg: 64, mat: { roughness: 0.14 } }));
      // cabezales con tapa bombeada + tornillería
      [[yb - 0.02, -1], [ye + 0.02, 1]].forEach(([y, s]) => { g5.add(lathe([[0, 0], [r * 1.3, 0], [r * 1.2, 0.035 * s], [r * 0.7, 0.07 * s], [0.02, 0.085 * s], [0, 0.085 * s]].map(p => [p[0], p[1]]), 'steel', { pos: [cx, y, cz], seg: 48 })); });
      for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g5.add(bolts([[cx + Math.cos(a) * r * 1.42, ye - 0.005, cz + Math.sin(a) * r * 1.42], [cx + Math.cos(a) * r * 1.42, yb + 0.005, cz + Math.sin(a) * r * 1.42]].slice(0, 2), 0.006, 0.03, 'y')); }
      // toberas del casco: vapor (arriba, +X), condensado (abajo, +X), producto (lado +Z abajo y arriba)
      g5.add(cyl(0.022, 0.022, 0.1, 'steel', { axis: 'x', pos: [cx + 0.09, 1.62, cz], seg: 32 })); g5.add(flange(cx + 0.14, 1.62, cz, 'x', 0.022));
      g5.add(cyl(0.022, 0.022, 0.1, 'steel', { axis: 'x', pos: [cx + 0.09, 0.62, cz], seg: 32 })); g5.add(flange(cx + 0.14, 0.62, cz, 'x', 0.022));
      g5.add(cyl(0.028, 0.028, 0.1, 'steel', { axis: 'z', pos: [cx, 0.72, cz + 0.09], seg: 32 })); g5.add(flange(cx, 0.72, cz + 0.145, 'z', 0.028));
      g5.add(K.label('MBS MLI 114 · L=1450\nAISI 316L · PS 10 bar', 0.11, 0.06, { bg: '#d3d7db', fg: '#111', fs: 20, pos: [cx - 0.01, 1.2, cz + r * 1.05 + 0.001] }));
      [[cx - 0.06, 1.0], [cx + 0.06, 1.0]].forEach(p => g5.add(rbox(0.02, 0.05, 0.04, 0.004, 'steelDark', { pos: [p[0] * 0 + cx + (p[0] < cx ? -0.07 : 0.07), 1.0, cz] })));
      // 8 bomba PROLAC HCP 50-150 con motor 4 kW
      const g8 = el(C, 8), px = cx - 0.3, py = 0.36, pz = cz + 0.8;
      g8.add(lathe([[0.0, -0.05], [0.115, -0.05], [0.13, -0.02], [0.13, 0.03], [0.09, 0.055], [0.0, 0.055]], 'steel', { axis: 'x', pos: [px, py, pz], seg: 64 }));
      g8.add(cyl(0.03, 0.03, 0.12, 'steel', { axis: 'x', pos: [px - 0.12, py, pz], seg: 40 })); g8.add(flange(px - 0.18, py, pz, 'x', 0.03));
      g8.add(cyl(0.026, 0.026, 0.16, 'steel', { pos: [px, py + 0.19, pz], seg: 40 })); g8.add(flange(px, py + 0.28, pz, 'y', 0.026));
      const vb = []; for (let i = 0; i < 12; i++) vb.push([px + 0.075, py + Math.cos(i * TAU / 12) * 0.145, pz + Math.sin(i * TAU / 12) * 0.145]);
      g8.add(K.bolts(vb, 0.008, 0.03, 'x', { mat: 'steel' }));
      g8.add(cyl(0.16, 0.16, 0.02, 'steelDark', { axis: 'x', pos: [px + 0.06, py, pz], seg: 64 }));
      g8.add(cyl(0.1, 0.1, 0.2, 'steelDark', { axis: 'x', pos: [px + 0.16, py, pz], seg: 48 }));
      const mo = new THREE.Group(); mo.position.set(px + 0.3, py, pz); g8.add(mo);
      mo.add(cyl(0.105, 0.105, 0.36, 'weg', { axis: 'x', seg: 56 })); for (let i = 0; i < 12; i++) mo.add(torus(0.106, 0.004, 'weg', { axis: 'x', pos: [-0.17 + i * 0.03, 0, 0], seg: 56 }));
      mo.add(cyl(0.11, 0.09, 0.07, 'weg', { axis: 'x', pos: [0.2, 0, 0], seg: 56, mat: { color: 0x23508d } })); mo.add(cyl(0.085, 0.085, 0.03, 'black', { axis: 'x', pos: [0.245, 0, 0], seg: 40 }));
      mo.add(rbox(0.1, 0.06, 0.11, 0.008, 'weg', { pos: [0, 0.135, 0] }));
      mo.add(K.label('WEG W22 · 4 kW · 2P\n380 V 50 Hz IE3', 0.1, 0.055, { bg: '#d3d7db', fg: '#111', fs: 17, pos: [-0.02, 0.02, 0.1063] }));
      mo.add(K.bolts([[-0.03, 0.135, 0.056], [0.03, 0.135, 0.056], [-0.03, 0.135, -0.056], [0.03, 0.135, -0.056]].map(p => [p[0], p[1] + 0.03, p[2] * 0.6]), 0.005, 0.012, 'y', { mat: 'steel' })); mo.add(rbox(0.3, 0.02, 0.16, 0.004, 'weg', { pos: [-0.02, -0.11, 0] }));
      g8.add(rbox(0.62, 0.02, 0.24, 0.004, 'brushed', { pos: [px + 0.15, py - 0.16, pz] })); [-1, 1].forEach(sx => [-1, 1].forEach(sz => g8.add(rbox(0.04, 0.18, 0.04, 0.004, 'brushed', { pos: [px + 0.15 + sx * 0.27, py - 0.26, pz + sz * 0.1] }))));
      g8.add(rbox(0.62, 0.02, 0.24, 0.004, 'brushed', { pos: [px + 0.15, 0.03, pz], cast: false })); [-1, 1].forEach(sx => [-1, 1].forEach(sz => g8.add(K.level(px + 0.15 + sx * 0.27, 0, pz + sz * 0.1, 0.02, 0.02))));
      K.pumpMotor = mo;
      // 1 válvula globo DN40 (vapor) : cuerpo esférico, bridas, vástago y volante azul
      const g1 = el(C, 1), gx = cx + 0.55, gy = 1.85;
      g1.add(lathe([[0.03, -0.06], [0.06, -0.06], [0.06, -0.045], [0.04, -0.04], [0.06, 0.0], [0.06, 0.04], [0.04, 0.045], [0.06, 0.05], [0.06, 0.065], [0.03, 0.065]].map(p => [p[0], p[1]]), 'steelDark', { pos: [gx, gy, cz], seg: 48 }));
      g1.add(sphere(0.055, 'steelDark', { pos: [gx, gy, cz] })); g1.add(cyl(0.02, 0.02, 0.1, 'steelDark', { axis: 'x', pos: [gx, gy, cz], seg: 32 }));
      g1.add(cyl(0.012, 0.012, 0.12, 'steel', { pos: [gx, gy + 0.11, cz], seg: 16 })); g1.add(cyl(0.028, 0.028, 0.05, 'steelDark', { pos: [gx, gy + 0.075, cz], seg: 32 }));
      g1.add(torus(0.07, 0.008, 'blueLight', { axis: 'y', pos: [gx, gy + 0.175, cz], seg: 40 })); [0, 1].forEach(i => g1.add(cyl(0.006, 0.006, 0.14, 'blueLight', { axis: i ? 'z' : 'x', pos: [gx, gy + 0.175, cz], seg: 10 }))); g1.add(sphere(0.014, 'blueLight', { pos: [gx, gy + 0.175, cz] }));
      // 2 manómetro Ø89 0-10 bar
      const g2 = el(C, 2), mx = gx, my = gy - 0.24, dial = K.canvasTex(256, 256, (c, W, H) => {
        c.fillStyle = '#f4f4f0'; c.fillRect(0, 0, W, H); c.strokeStyle = '#111'; c.lineWidth = 3; c.beginPath(); c.arc(128, 128, 118, 0, 7); c.stroke();
        for (let i = 0; i <= 20; i++) { const a = PI * 0.75 + i * PI * 1.5 / 20; c.lineWidth = i % 5 ? 2 : 4; c.beginPath(); c.moveTo(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); c.lineTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112); c.stroke(); }
        c.fillStyle = '#111'; c.font = 'bold 26px sans-serif'; c.textAlign = 'center'; c.fillText('BAR', 128, 190); c.fillText('0-10', 128, 84); c.strokeStyle = '#c22'; c.lineWidth = 5; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.cos(PI * 1.3) * 84, 128 + Math.sin(PI * 1.3) * 84); c.stroke(); });
      g2.add(cyl(0.008, 0.008, 0.08, 'brass', { pos: [mx, my - 0.04, cz], seg: 16 })); g2.add(cyl(0.012, 0.012, 0.02, 'brass', { pos: [mx, my, cz], seg: 6 }));
      g2.add(cyl(0.0445, 0.0445, 0.035, 'steel', { axis: 'z', pos: [mx, my + 0.05, cz + 0.02], seg: 48 })); g2.add(torus(0.0445, 0.004, 'steelDark', { axis: 'z', pos: [mx, my + 0.05, cz + 0.04], seg: 48 }));
      const gf = new THREE.Mesh(new THREE.CircleGeometry(0.041, 48), new THREE.MeshBasicMaterial({ map: dial })); gf.position.set(mx, my + 0.05, cz + 0.0385); g2.add(gf);
      g2.add(cyl(0.041, 0.041, 0.002, 'glass', { axis: 'z', pos: [mx, my + 0.05, cz + 0.041], seg: 48 }));
      // 3 filtro tipo Y DN32 (bridas)
      const g3 = el(C, 3), fx2 = cx + 0.35, fy = 1.62;
      g3.add(cyl(0.032, 0.032, 0.14, 'steelDark', { axis: 'x', pos: [fx2 + 0.28, fy, cz], seg: 40 })); g3.add(flange(fx2 + 0.2, fy, cz, 'x', 0.03, 'steelDark')); g3.add(flange(fx2 + 0.36, fy, cz, 'x', 0.03, 'steelDark'));
      const yb2 = new THREE.Group(); yb2.position.set(fx2 + 0.28, fy, cz); yb2.rotation.z = -PI / 4; g3.add(yb2);
      yb2.add(cyl(0.028, 0.028, 0.1, 'steelDark', { pos: [0, -0.06, 0], seg: 40 })); yb2.add(cyl(0.034, 0.034, 0.014, 'steel', { pos: [0, -0.12, 0], seg: 40 })); yb2.add(cyl(0.012, 0.012, 0.03, 'steel', { pos: [0, -0.14, 0], seg: 6 }));
      // 6 purgador de boya TLV J3SX-10
      const g6 = el(C, 6), tx = cx + 0.6, ty = 0.42;
      g6.add(sphere(0.06, 'steel', { pos: [tx, ty, cz], mat: { roughness: 0.2 } })); g6.add(cyl(0.028, 0.028, 0.12, 'steel', { axis: 'x', pos: [tx, ty, cz], seg: 32 })); g6.add(cyl(0.04, 0.04, 0.03, 'steelDark', { pos: [tx, ty + 0.06, cz], seg: 32 }));
      g6.add(cyl(0.02, 0.02, 0.03, 'steelDark', { pos: [tx, ty - 0.065, cz], seg: 24 }));
      // 4 válvula de asiento inclinado OD51 con actuador S-E N-C (condensado)
      const g4 = el(C, 4), ix = cx + 0.35, iy = 0.62;
      g4.add(cyl(0.0255, 0.0255, 0.14, 'steel', { axis: 'x', pos: [ix + 0.2, iy, cz], seg: 40 }));
      const ib = new THREE.Group(); ib.position.set(ix + 0.2, iy, cz); ib.rotation.z = PI / 4 * 0 + PI / 4; g4.add(ib);
      ib.add(cyl(0.028, 0.028, 0.1, 'steel', { pos: [0, 0.06, 0], seg: 40 })); ib.add(cyl(0.045, 0.045, 0.1, 'blue', { pos: [0, 0.16, 0], seg: 40 })); ib.add(cyl(0.048, 0.048, 0.014, 'steelDark', { pos: [0, 0.215, 0], seg: 40 })); ib.add(cyl(0.02, 0.02, 0.03, 'black', { pos: [0, 0.235, 0], seg: 20 }));
      g4.add(clamp(ix + 0.12, iy, cz, 'x', 0.0255)); g4.add(clamp(ix + 0.28, iy, cz, 'x', 0.0255));
      // 9 válvulas mariposa OD63.5 T2 ×5 sobre el circuito de producto
      const g9 = el(C, 9);
      place(g9, 63.5, 'T2', cx, 0.7, cz + 0.42, 'z');
      place(g9, 63.5, 'T2', cx, 0.7, cz + 0.62, 'z');
      place(g9, 63.5, 'T2', cx, 2.28, cz, 'y');
      place(g9, 63.5, 'T2', cx - 0.62, 0.36, pz, 'x');
      place(g9, 63.5, 'T2', cx - 0.62, 0.36 + 0.5, pz, 'y');
      // tubería propia del intercambiador (contexto): vapor, condensado y producto
      const pr = new THREE.Group(); pr.name = 'intercambiador:lineas'; pr.userData.comp = C; comps[C].add(pr);
      pr.add(pipe([[cx + 0.14, 1.62, cz], [gx + 0.0, 1.62, cz], [gx, gy - 0.06, cz]], 0.0225, 'steel', { radial: 24 }));
      pr.add(pipe([[gx, gy + 0.06, cz], [gx, 2.15, cz], [gx - 0.1, 2.15, cz]], 0.0225, 'steel', { radial: 24 }));
      pr.add(pipe([[cx + 0.14, 0.62, cz], [tx - 0.06, 0.62, cz]], 0.0225, 'steel', { radial: 24 }));
      pr.add(pipe([[mx, gy - 0.06, cz], [mx, my + 0.0, cz]], 0.008, 'brass', { radial: 12 }));
      pr.add(pipe([[cx, 0.72, cz + 0.145], [cx, 0.72, pz - 0.0], [px, 0.72, pz - 0.0], [px, py + 0.28, pz]], 0.0318, 'steel', { radial: 32 }));
      // salida de producto: sube y se divide hacia las dos mangueras del repartidor
      pr.add(pipe([[cx, 1.98, cz], [cx, 2.15, cz]], 0.0318, 'steel', { radial: 32 }));
      pr.add(pipe([[cx, 2.15, cz], [cx, 2.28, cz - 0.3], [1.72, 2.28, -0.64]], 0.0318, 'steel', { radial: 32, bend: 0.1 }));
      pr.add(pipe([[cx, 2.15, cz], [cx, 1.98, cz - 0.25], [1.72, 1.98, -0.56]], 0.0318, 'steel', { radial: 32, bend: 0.1 }));
      K.hxTopOut = [cx, 2.15, cz];
      explode(g5, 0.4, 0, 0); explode(g8, 0.5, 0, 0.4);
    }

    /* =========================================================
     *  SISTEMA DE TUBERÍAS (10) — imagen 51
     *  Red de lavado (CIP) de acero inoxidable: ascendentes con válvulas, dos lazos con bolas alrededor de las
     *  columnas, jaula inferior de dos lazos con ramales y bolas, y charola superior con bolas Ø50.
     * ========================================================= */
    {
      const C = 'tuberias', tk = L.tank, W = tk.x1 - tk.x0, cxk = (tk.x0 + tk.x1) / 2;
      const g = {}; for (let i = 1; i <= 10; i++) g[i] = el(C, i);
      const net = extra(C, 'tramos');
      const RC = 0.0318, RW = 0.0255, R1 = 0.019;
      // ascendentes en el extremo derecho (junto al intercambiador)
      const xr = 1.98;
      const R = [
        { z: 0.4, y1: 1.62, name: 'A' },      // alimenta el lazo superior de la jaula
        { z: -0.05, y1: 3.42, name: 'B' },    // sube a los lazos de columnas y a la charola
        { z: -0.45, y1: 0.7, name: 'C' }      // alimenta el lazo inferior de la jaula
      ];
      // colector de entrada en el piso (Ø63.5) con válvulas OD63.5 T2 (6) hacia los ascendentes
      net.add(pipe([[xr + 0.55, 0.3, -0.7], [xr + 0.55, 0.3, 0.55], [xr, 0.3, 0.55]], RC, 'steel', { radial: 28, bend: 0.1 }));
      R.forEach((r, k) => net.add(pipe([[xr, 0.3, r.z], [xr, r.y1, r.z]], RC, 'steel', { radial: 28 })));
      [0.4, -0.05, -0.45].forEach(z => net.add(pipe([[xr + 0.55, 0.3, z], [xr, 0.3, z]], RC, 'steel', { radial: 28 })));
      // válvulas OD63.5 T2 ×2 (6): parten de la base de dos ascendentes; OD51 T1 ×3 (1): ramales a lazos; OD40 T1 ×2 (3): charola y purga
      const place = (grp, od, act, x, y, z, axis) => { const v = S.butterfly(od, act), r = od / 2000, Lh = 0.1 + r * 0.6; if (axis === 'y') v.rotation.z = PI / 2; else if (axis === 'z') v.rotation.y = PI / 2; v.position.set(x, y, z); grp.add(v); const dx = axis === 'x' || !axis ? 1 : 0, dy = axis === 'y' ? 1 : 0, dz = axis === 'z' ? 1 : 0; [-1, 1].forEach(s => grp.add(clamp(x + dx * s * (Lh / 2 + 0.006), y + dy * s * (Lh / 2 + 0.006), z + dz * s * (Lh / 2 + 0.006), axis || 'x', r))); return v; };
      place(g[6], 63.5, 'T2', xr, 0.62, 0.4, 'y'); place(g[6], 63.5, 'T2', xr, 0.62, -0.45, 'y');
      // lazos de columnas (dos niveles) alrededor de las columnas: tubos sobre los lados largos con ganchos y bolas
      const ballList = [], loopBall = (x, y, z, dz) => ballList.push({ p: [x, y - 0.08, z + dz], r: [PI, 0, 0] });
      [2.02, 2.27].forEach((y, k) => {
        const x0 = tk.x0 + 0.02, x1 = tk.x1 - 0.02, zf = -0.02, zb = -0.66;
        net.add(pipe([[x0, y, zb], [x1, y, zb], [x1, y, zf], [x0, y, zf], [x0, y, zb]], R1, 'steel', { radial: 20, bend: 0.06 }));
        // conexión con el ascendente B
        net.add(pipe([[xr, y, -0.05], [x1 + 0.0, y, -0.05 - 0.0]], RW, 'steel', { radial: 24, bend: 0.06 }));
        for (let i = 0; i < 7; i++) { const x = x0 + 0.15 + i * (x1 - x0 - 0.3) / 6; [zb, zf].forEach((z, q) => { net.add(pipe([[x, y, z], [x, y - 0.035, z + (q ? -0.03 : 0.03)], [x, y - 0.06, z + (q ? -0.06 : 0.06)]], 0.005, 'steel', { radial: 10, bend: 0.025 })); loopBall(x, y - 0.0, z, q ? -0.06 : 0.06); }); }
      });
      // válvulas OD51 T1 ×3 sobre los ramales a los lazos y a la jaula superior; OD40 T1 ×2 en la charola y en la purga
      place(g[1], 51, 'T1', xr - 0.28, 2.02, -0.05, 'x'); place(g[1], 51, 'T1', xr - 0.28, 2.27, -0.05, 'x'); place(g[1], 51, 'T1', xr - 0.28, 1.62, 0.4, 'x');
      net.add(pipe([[xr, 1.62, 0.4], [xr - 0.22, 1.62, 0.4]], RW, 'steel', { radial: 24 }));
      // jaula inferior: dos lazos rectangulares (arriba y abajo) con ramales cruzados y bolas
      [[1.5, 0.42], [0.62, 0.42]].forEach(([y, hz], k) => {
        const x0 = -1.55, x1 = 1.55;
        net.add(pipe([[x0, y, -hz], [x1, y, -hz], [x1, y, hz], [x0, y, hz], [x0, y, -hz]], RC * 0.8, 'steel', { radial: 24, bend: 0.08 }));
        for (let i = 0; i < 7; i++) { const x = x0 + 0.25 + i * (x1 - x0 - 0.5) / 6; net.add(pipe([[x, y, -hz], [x, y, 0], [x, y, hz]], 0.014, 'steel', { radial: 16 })); loopBall(x, y - 0.0, 0, 0); [-hz, hz].forEach(z => loopBall(x, y, z, z > 0 ? -0.06 : 0.06)); }
      });
      // conexión de la jaula: ascendentes verticales en los extremos
      [[-1.55, -0.42], [-1.55, 0.42], [1.55, 0.42], [1.55, -0.42]].forEach(([x, z]) => net.add(pipe([[x, 0.62, z], [x, 1.5, z]], RC * 0.8, 'steel', { radial: 24 })));
      net.add(pipe([[xr, 1.5, 0.4], [1.55, 1.5, 0.42]], RC * 0.8, 'steel', { radial: 24, bend: 0.06 })); net.add(pipe([[xr, 0.7, -0.45], [1.55, 0.62, -0.42]], RC * 0.8, 'steel', { radial: 24, bend: 0.06 }));
      // charola superior con dos tubos y 5 bolas CD-8C Ø50 (9), manguera azul de alimentación y válvula OD40
      const ty = 3.47, tz = -0.4, tray = extra(C, 'charola');
      tray.add(K.slotted(2.3, 0.6, 0.012, null, null, 'panel', { pos: [cxk, ty + 0.03, tz], mat: { metalness: 0.8 } }));
      [-0.14, 0.14].forEach(dz => { tray.add(pipe([[tk.x0 + 0.05, ty, tz + dz], [tk.x1 - 0.05, ty, tz + dz]], 0.0125, 'steel', { radial: 16 })); });
      const big = geo('ball50', () => merge([new THREE.SphereGeometry(0.025, 24, 16)].concat([0, 1, 2, 3, 4, 5, 6, 7].map(i => { const q = new THREE.CylinderGeometry(0.004, 0.006, 0.016, 8); q.rotateZ(PI / 2); q.rotateY(i * PI / 4); q.translate(0.025 * Math.cos(i * PI / 4), 0, -0.025 * Math.sin(i * PI / 4)); return q; })).concat([tr(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 12), 0, 0.03, 0)])));
      g[9].add(inst(big, 'steel', [-0.9, -0.45, 0.0, 0.45, 0.9].map(x => ({ p: [cxk + x, ty - 0.055, tz], r: [PI, 0, 0] }))));
      [-0.9, -0.45, 0.0, 0.45, 0.9].forEach(x => g[9].add(cyl(0.007, 0.007, 0.05, 'steel', { pos: [cxk + x, ty - 0.02, tz], seg: 12 })));
      net.add(pipe([[xr, 3.42, -0.05], [xr - 0.3, 3.42, -0.05], [tk.x1 - 0.05, ty, tz + 0.14]], RW, 'steel', { radial: 24, bend: 0.08 }));
      place(g[3], 40, 'T1', xr - 0.6, 3.42, -0.05, 'x'); place(g[3], 40, 'T1', xr, 0.95, -0.05, 'y');
      tray.add(hose([[cxk - 0.6, ty + 0.05, tz], [cxk - 0.55, ty + 0.2, tz], [cxk - 0.4, ty + 0.12, tz + 0.15]], 0.006, 'cableBlue', { radial: 10 }));
      // válvula inclinada 3/4" PROCOM Ø50 (4) en el ascendente C
      const ib = new THREE.Group(); ib.position.set(xr, 1.0, -0.45); g[4].add(ib);
      ib.add(cyl(0.025, 0.025, 0.14, 'steel', { pos: [0, 0, 0], seg: 40 })); const ang = new THREE.Group(); ang.rotation.z = -PI / 4; ib.add(ang);
      ang.add(cyl(0.028, 0.028, 0.1, 'steel', { pos: [0.0, 0.06, 0.0], seg: 40, rot: [0, 0, PI / 2] })); ang.add(cyl(0.04, 0.04, 0.1, 'steelDark', { pos: [0.11, 0.06, 0.0], seg: 40, rot: [0, 0, PI / 2] })); ang.add(cyl(0.035, 0.035, 0.03, 'blueLight', { pos: [0.185, 0.06, 0.0], seg: 32, rot: [0, 0, PI / 2] }));
      g[4].add(clamp(xr, 1.075, -0.45, 'y', 0.025)); g[4].add(clamp(xr, 0.925, -0.45, 'y', 0.025));
      // bolas fijas CD-17C ×56 (7): las de los lazos y la jaula (42 + 14)
      g[7].add(inst(K.sprayBall28, 'steel', ballList.slice(0, 56)));
      // juntas racord SMS: 2½" ×5 (5), 1½" ×1 (2), 2" ×4 (8), 1" ×8 (10)
      [[xr, 0.45, 0.4, 'y'], [xr, 1.1, 0.4, 'y'], [xr, 1.3, -0.05, 'y'], [xr, 2.5, -0.05, 'y'], [xr, 0.8, -0.05, 'y']].forEach(p => g[5].add(clamp(p[0], p[1], p[2], p[3], 0.0318)));
      g[2].add(clamp(xr + 0.3, 0.3, 0.55, 'x', 0.019));
      [[xr, 2.15, -0.05], [xr, 2.35, -0.05], [xr - 0.15, 1.62, 0.4], [xr - 0.15, 2.27, -0.05]].forEach(p => g[8].add(clamp(p[0], p[1], p[2], p[3] || 'y', 0.0255)));
      [[-1.55, 1.5, 0.3, 'y'], [1.55, 1.5, 0.3, 'y'], [-1.55, 0.9, -0.42, 'y'], [1.55, 0.9, -0.42, 'y'], [0.4, 1.5, 0.42, 'x'], [-0.4, 0.62, -0.42, 'x'], [tk.x1 - 0.05, 3.47, -0.4, 'x'], [tk.x0 + 0.3, 2.02, -0.66, 'x']].forEach(p => g[10].add(clamp(p[0], p[1], p[2], p[3], 0.0125)));
      explode(net, 0, 0.0, 0.4); explode(tray, 0, 0.5, 0);
    }
  });
})();
