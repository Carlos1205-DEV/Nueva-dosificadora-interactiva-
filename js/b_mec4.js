/* INTERCAMBIADOR TÉRMICO (9) · SISTEMA DE TUBERÍAS (10) */
(function () {
  'use strict';
  window.MODEL_BUILDERS.push(function (K) {
    const { THREE, PI, TAU, el, comps, box, rbox, cyl, torus, sphere, lathe, extrude, merge, tr, put, bolts, nuts, washers, line, grid, pipe, hose, clamp, inst, mat, mesh, explode, spin, geo, anim, state } = K;
    const L = K.L, S = K.parts, HX = L.hx = { x: 2.85, z: -0.05 };

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
      const g8 = el(C, 8), px = cx - 0.3, py = 0.36, pz = 0.85;
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
      pr.add(pipe([[cx, 0.72, cz + 0.145], [cx, 0.72, pz - 0.0], [px, 0.72, pz - 0.0], [px, py + 0.28, pz]], 0.0318, 'curd', { radial: 32 }));
      pr.add(pipe([[cx, 1.98, cz], [cx, 2.6, cz]], 0.0318, 'curd', { radial: 32 }));
      K.hxTopOut = [cx, 2.6, cz];
      explode(g5, 0.4, 0, 0); explode(g8, 0.5, 0, 0.4);
    }

    /* =========================================================
     *  SISTEMA DE TUBERÍAS (10)
     * ========================================================= */
    {
      const C = 'tuberias';
      const g1 = el(C, 1), g2 = el(C, 2), g3 = el(C, 3), g4 = el(C, 4), g5 = el(C, 5), g6 = el(C, 6), g7 = el(C, 7), g8 = el(C, 8), g9 = el(C, 9), g10 = el(C, 10);
      const net = new THREE.Group(); net.name = 'tuberias:tramos'; net.userData.comp = C; comps[C].add(net);
      const RC = 0.0318, RW = 0.0255;
      // línea de cuajada (azul): salida del intercambiador → tolva
      net.add(pipe([[HX.x, 2.6, HX.z], [HX.x - 0.3, 2.6, HX.z], [2.15, 2.6, HX.z], [2.15, 2.6, 0.17], [1.5, 2.6, 0.17]], RC, 'curd', { radial: 32, bend: 0.13 }));
      // lazo de retorno cuajada (arco azul visible desde el frente)
      net.add(pipe([[2.15, 2.6, 0.17], [2.15, 1.9, 0.55], [1.0, 1.9, 0.55], [1.0, 2.2, 0.36], [-1.0, 2.2, 0.36]], RC, 'curd', { radial: 32, bend: 0.16 }));
      // colector de agua/CIP detrás de la máquina y subidas al cassette
      net.add(pipe([[2.2, 1.5, -0.72], [-1.55, 1.5, -0.72]], RC, 'steel', { radial: 28 }));
      net.add(pipe([[1.62, 1.5, -0.72], [1.62, 2.76, -0.72], [1.62, 2.76, -0.52]], RW, 'steel', { radial: 24, bend: 0.08 }));
      net.add(pipe([[1.7, 1.5, -0.72], [1.7, 2.76, -0.72]].concat([[1.7, 2.76, -0.12]]).slice(0, 3), RW, 'steel', { radial: 24, bend: 0.08 }));
      net.add(pipe([[-1.55, 1.5, -0.72], [-1.55, 3.28, -0.72]], RW, 'steel', { radial: 24 }));
      // 5 juntas SMS 2½" sobre el colector; 1 junta 1½" ; 4 juntas 2" en subidas
      [1.95, 1.3, 0.2, -0.9, -1.4].forEach(x => joint(g5, 63.5, x, 1.5, -0.72, 'x'));
      joint(g2, 38, 2.1, 1.5, -0.72, 'x');
      [[1.62, 1.9, -0.72], [1.62, 2.4, -0.72], [1.7, 2.1, -0.72], [-1.55, 2.4, -0.72]].forEach(p => joint(g8, 51, p[0], p[1], p[2], 'y'));
      // válvulas: 6 → OD63.5 T2 ×2 en el colector ; 1 → OD51 T1 ×3 ; 3 → OD40 T1 ×2
      place(g6, 63.5, 'T2', 1.6, 1.5, -0.72, 'x'); place(g6, 63.5, 'T2', -0.4, 1.5, -0.72, 'x');
      place(g1, 51, 'T1', 1.62, 2.15, -0.72, 'y'); place(g1, 51, 'T1', 1.7, 2.4, -0.72, 'y'); place(g1, 51, 'T1', -1.55, 2.0, -0.72, 'y');
      place(g3, 40, 'T1', -1.55, 3.1, -0.72, 'y'); place(g3, 40, 'T1', -1.55, 2.72, -0.72, 'y');
      // manifolds Ø25 con bolas de lavado (56 CD-17C)
      const ballList = [];
      [[3.28, -0.62], [3.28, -0.26], [3.28, 0.1], [1.93, 0.1]].forEach(([y, z], k) => {
        net.add(pipe([[-1.55, y, z], [1.5, y, z]], 0.0125, 'steel', { radial: 16 }));
        if (k === 0) net.add(pipe([[-1.55, y, z], [-1.55, y, -0.72]], 0.0125, 'steel', { radial: 16 }));
        for (let i = 0; i < 14; i++) ballList.push({ p: [-1.4 + i * 0.22, y - 0.025, z], r: [PI, 0, 0] });
        [-1.55, 1.5].forEach(x => (k % 2 ? g10 : g10).add(clamp(x + (x < 0 ? 0.1 : -0.1), y, z, 'x', 0.0125)));
      });
      g7.add(inst(K.sprayBall28, 'steel', ballList));
      // 10 juntas SMS 1" ×8 completadas: 2 más en el manifold de cada línea
      [[3.28, -0.62], [3.28, -0.26], [3.28, 0.1], [1.93, 0.1]].forEach(([y, z]) => [-0.4, 0.5].forEach(x => g10.add(clamp(x, y, z, 'x', 0.0125))));
      // 9 bolas CD-8C Ø50 ×5 (más grandes) dentro de la tolva
      const big = geo('ball50', () => merge([new THREE.SphereGeometry(0.025, 24, 16)].concat([0, 1, 2, 3, 4, 5, 6, 7].map(i => { const g = new THREE.CylinderGeometry(0.004, 0.006, 0.016, 8); g.rotateZ(PI / 2); g.rotateY(i * PI / 4); g.translate(0.025 * Math.cos(i * PI / 4), 0, -0.025 * Math.sin(i * PI / 4)); return g; })).concat([tr(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 12), 0, 0.03, 0)])));
      const hp = L.hopper;
      g9.add(inst(big, 'steel', [-0.95, -0.5, 0.0, 0.5, 0.95].map(x => ({ p: [x, hp.y1 - 0.06, (hp.z0 + hp.z1) / 2 + 0.07], r: [PI, 0, 0] }))));
      g9.add(pipe([[-1.1, hp.y1 + 0.04, (hp.z0 + hp.z1) / 2 + 0.07], [1.1, hp.y1 + 0.04, (hp.z0 + hp.z1) / 2 + 0.07]], 0.011, 'steel', { radial: 16 }));
      [-0.95, -0.5, 0.0, 0.5, 0.95].forEach(x => g9.add(cyl(0.007, 0.007, 0.08, 'steel', { pos: [x, hp.y1 - 0.01, (hp.z0 + hp.z1) / 2 + 0.07], seg: 12 })));
      // 4 válvula inclinada 3/4" PROCOM Ø50 (con actuador y cabezal)
      const ib = new THREE.Group(); ib.position.set(-1.55, 1.7, -0.72); g4.add(ib);
      ib.add(cyl(0.025, 0.025, 0.14, 'steel', { pos: [0, 0, 0], seg: 40 })); const ang = new THREE.Group(); ang.rotation.z = -PI / 4; ang.position.set(0, 0.0, 0); ib.add(ang);
      ang.add(cyl(0.028, 0.028, 0.1, 'steel', { pos: [0.0, 0.06, 0.0], seg: 40, rot: [0, 0, PI / 2] })); ang.add(cyl(0.04, 0.04, 0.1, 'steelDark', { pos: [0.11, 0.06, 0.0], seg: 40, rot: [0, 0, PI / 2] })); ang.add(cyl(0.035, 0.035, 0.03, 'blueLight', { pos: [0.185, 0.06, 0.0], seg: 32, rot: [0, 0, PI / 2] }));
      g4.add(clamp(-1.55, 1.775, -0.72, 'y', 0.025)); g4.add(clamp(-1.55, 1.625, -0.72, 'y', 0.025));
      explode(net, 0.0, 0.0, -0.4);
    }
  });
})();
