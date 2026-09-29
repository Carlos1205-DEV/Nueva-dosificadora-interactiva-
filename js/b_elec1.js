/* SISTEMA ELÉCTRICO (1/2): GABINETE Y ESTRUCTURA · CPU · MÓDULOS POINT I/O · CONTADORES Y PROTECCIÓN · VARIADORES · ALIMENTACIÓN Y CLIMATIZACIÓN */
(function () {
  'use strict';
  window.MODEL_BUILDERS.push(function (K) {
    const { THREE, PI, TAU, el, comps, box, rbox, cyl, torus, sphere, lathe, extrude, merge, tr, put, bolts, nuts, washers, line, grid, pipe, hose, clamp, inst, mat, mesh, explode, spin, geo, anim, state, canvasTex, label } = K;
    const L = K.L, S = K.parts, T = L.tall, SM = L.small;
    K.doors = {};   // 'tall' | 'small' -> {pivot, max}
    K.elemDoor = {}; // key -> 'tall' | 'small'

    /* ---------- helpers de gabinete: coordenadas locales (u a la derecha, v arriba, w hacia el frente desde la placa) ---------- */
    const back = c => c.z - c.d / 2;
    const Tp = (u, v, w) => [T.x + u, T.y + v, back(T) + 0.03 + (w || 0)];
    const Sp = (u, v, w) => [SM.x + u, SM.y + v, back(SM) + 0.03 + (w || 0)];
    K.Tp = Tp; K.Sp = Sp;
    function railDIN(g, w, at) { g.add(rbox(w, 0.035, 0.007, 0.001, 'steelDark', { pos: [at[0], at[1], at[2] - 0.004], cast: false })); }
    function duct(g, w, h, at, horizontal) { const d = rbox(horizontal ? w : h, horizontal ? h : w, 0.045, 0.004, 'lightGray', { pos: [at[0], at[1], at[2] + 0.01] }); g.add(d); }
    function led(g, x, y, z, color) { g.add(box(0.003, 0.003, 0.002, 'green', { pos: [x, y, z], mat: { color: color || 0x22cc55, emissive: color || 0x0a3d18 }, cast: false })); }
    // módulo genérico (frente hacia +Z): w×h×d
    function block(g, w, h, d, at, m, o) { o = o || {}; const b = rbox(w, h, d, Math.min(0.004, w / 4), m, { pos: at }); g.add(b); if (o.face) g.add(box(w * 0.7, h * 0.35, 0.002, o.face, { pos: [at[0], at[1] + h * 0.15, at[2] + d / 2 + 0.001], cast: false })); if (o.leds) for (let i = 0; i < o.leds; i++) led(g, at[0] - w * 0.3 + i * w * 0.6 / Math.max(1, o.leds - 1), at[1] + h * 0.38, at[2] + d / 2 + 0.001); return b; }
    K.block = block; K.led = led;

    /* =========================================================
     *  GABINETE Y ESTRUCTURA (17)
     * ========================================================= */
    {
      const C = 'gabinete', t = 0.012;
      const shellG = (c, name) => { const g = new THREE.Group(); g.name = name; g.userData.comp = C; comps[C].add(g); return g; };
      // ---------- armario alto 700x1700x300 ----------
      const g9 = el(C, 9), g8 = el(C, 8), g10 = el(C, 10), g11 = el(C, 11), g12 = el(C, 12), g13 = el(C, 13), g14 = el(C, 14), g15 = el(C, 15), g16 = el(C, 16), g17 = el(C, 17);
      const W = T.w, H = T.h, D = T.d, cx = T.x, cy = T.y, cz = T.z;
      g9.add(box(W, H, t, 'cabinet', { pos: [cx, cy, cz - D / 2], shell: true }));
      g9.add(box(t, H, D, 'cabinet', { pos: [cx - W / 2, cy, cz], shell: true })); g9.add(box(t, H, D, 'cabinet', { pos: [cx + W / 2, cy, cz], shell: true }));
      g9.add(box(W, t, D, 'cabinet', { pos: [cx, cy + H / 2 - 0.05, cz], shell: true })); g9.add(box(W, t, D, 'cabinet', { pos: [cx, cy - H / 2 + 0.06, cz], shell: true }));
      // frente perimetral (marco del armario)
      [[0, H / 2 - 0.02, W, 0.04], [0, -H / 2 + 0.03, W, 0.04]].forEach(q => g9.add(box(q[2], q[3], 0.02, 'cabinet', { pos: [cx + q[0], cy + q[1] - (q[1] > 0 ? 0.03 : 0.0), cz + D / 2 - 0.008], shell: true })));
      [-1, 1].forEach(s => g9.add(box(0.04, H - 0.09, 0.02, 'cabinet', { pos: [cx + s * (W / 2 - 0.02), cy, cz + D / 2 - 0.008], shell: true })));
      // placa de montaje naranja/crema
      g9.add(box(W - 0.05, H - 0.16, 0.006, 'poly', { pos: [cx, cy, back(T) + 0.018], mat: { color: 0xe6dfc6, metalness: 0.15, roughness: 0.75 } }));
      // 8 tejadillo (techo inclinado)
      const roof = new THREE.Shape(); roof.moveTo(0, 0); roof.lineTo(D + 0.07, 0); roof.lineTo(D + 0.07, 0.02); roof.lineTo(0.05, 0.075); roof.lineTo(0, 0.075); roof.closePath();
      const rg = new THREE.ExtrudeGeometry(roof, { depth: W + 0.06, bevelEnabled: false }); rg.rotateY(-PI / 2); rg.translate(cx + W / 2 + 0.03, 0, cz - D / 2 - 0.02);
      g8.add(mesh(rg, 'cabinet', { pos: [0, cy + H / 2 - 0.05 - 0.0, 0], shell: false }));
      // 11 base con agujeros (zócalo) ; 12-15 pasamuros ; 16 prensaestopas M20
      g11.add(rbox(W + 0.02, 0.06, D + 0.02, 0.006, 'panelDark', { pos: [cx, cy - H / 2 + 0.03, cz] }));
      g11.add(box(W - 0.06, 0.004, D - 0.06, 'steelDark', { pos: [cx, cy - H / 2 + 0.062, cz] }));
      [[-0.24, 0.05, 0.096, 0.052, g12], [-0.08, 0.05, 0.074, 0.052, g13], [0.08, 0.05, 0.066, 0.05, g14], [0.24, 0.05, 0.078, 0.05, g15]].forEach(q => { q[4].add(rbox(q[2], 0.012, q[3], 0.002, 'black', { pos: [cx + q[0], cy - H / 2 + 0.07, cz + q[1]] })); q[4].add(rbox(q[2] * 0.8, 0.02, q[3] * 0.7, 0.003, 'black', { pos: [cx + q[0], cy - H / 2 + 0.076, cz + q[1]] })); });
      g16.add(cyl(0.017, 0.017, 0.02, 'black', { pos: [cx + 0.0, cy - H / 2 + 0.07, cz - 0.09], seg: 24 })); g16.add(cyl(0.012, 0.012, 0.03, 'black', { pos: [cx + 0.0, cy - H / 2 + 0.086, cz - 0.09], seg: 20 }));
      // 17 tornillos de seguridad M4x14 (kit ×10) en la puerta
      const sp = []; for (let i = 0; i < 10; i++) sp.push([cx - W / 2 + 0.05 + (i % 5) * (W - 0.1) / 4, cy + (i < 5 ? H / 2 - 0.08 : -H / 2 + 0.12), cz + D / 2 + 0.008]);
      g17.add(bolts(sp, 0.004, 0.014, 'z'));
      // 10 puerta 700x1700 a derechas con 1 piloto + 1 PE (paro de emergencia se agrega en botonera)
      const pv = new THREE.Group(); pv.position.set(cx + W / 2, cy, cz + D / 2 + 0.008); g10.add(pv);
      pv.add(rbox(W - 0.01, H - 0.12, 0.018, 0.004, 'cabinet', { pos: [-W / 2, -0.005, 0], shell: true }));
      [0.6, -0.6].forEach(y => pv.add(cyl(0.008, 0.008, 0.06, 'steelDark', { pos: [0, y, 0], seg: 12 })));
      pv.add(cyl(0.011, 0.011, 0.018, 'black', { axis: 'z', pos: [-0.05, 0.05, 0.016], seg: 20 })); pv.add(cyl(0.014, 0.014, 0.008, 'yellow', { axis: 'z', pos: [-0.05, 0.05, 0.028], seg: 24, mat: { emissive: 0x332800 } }));
      // piloto verde (luz)
      pv.add(cyl(0.011, 0.011, 0.018, 'black', { axis: 'z', pos: [-0.28, 0.72, 0.016], seg: 20 })); const pl = cyl(0.014, 0.014, 0.008, 'green', { axis: 'z', pos: [-0.28, 0.72, 0.028], seg: 24, mat: { emissive: 0x0b3a1a } }); pv.add(pl); K.pilotTall = pl;
      // tirador / cerradura de la puerta
      pv.add(rbox(0.05, 0.014, 0.012, 0.004, 'steel', { pos: [-W + 0.08, 0.0, 0.02] })); pv.add(cyl(0.012, 0.012, 0.012, 'black', { axis: 'z', pos: [-W + 0.08, 0, 0.016], seg: 20 }));
      pv.add(label('⚡', 0.06, 0.06, { bg: '#f2c500', fg: '#111', fs: 40, pos: [-W / 2, 0.55, 0.0095] }));
      K.doors.tall = { pivot: pv, max: 1.95 };
      // ---------- armario pequeño 500x450x220 (HMI) ----------
      const s2 = el(C, 2), s1 = el(C, 1), s3 = el(C, 3), s4 = el(C, 4), s5 = el(C, 5), s6 = el(C, 6), s7 = el(C, 7);
      const sw = SM.w, sh = SM.h, sd = SM.d, sx = SM.x, sy = SM.y, sz = SM.z;
      s2.add(box(sw, sh, t, 'cabinet', { pos: [sx, sy, sz - sd / 2], shell: true }));
      s2.add(box(t, sh, sd, 'cabinet', { pos: [sx - sw / 2, sy, sz], shell: true })); s2.add(box(t, sh, sd, 'cabinet', { pos: [sx + sw / 2, sy, sz], shell: true }));
      s2.add(box(sw, t, sd, 'cabinet', { pos: [sx, sy + sh / 2, sz], shell: true })); s2.add(box(sw, t, sd, 'cabinet', { pos: [sx, sy - sh / 2, sz], shell: true }));
      [-1, 1].forEach(s => s2.add(box(0.03, sh, 0.02, 'cabinet', { pos: [sx + s * (sw / 2 - 0.015), sy, sz + sd / 2 - 0.008], shell: true })));
      s2.add(box(sw - 0.05, sh - 0.05, 0.006, 'poly', { pos: [sx, sy, back(SM) + 0.018], mat: { color: 0xe6dfc6, metalness: 0.15, roughness: 0.75 } }));
      // 1 tejadillo pequeño
      const rg2 = new THREE.ExtrudeGeometry(roof, { depth: sw + 0.06, bevelEnabled: false }); rg2.scale(0.75, 0.75, 1); rg2.rotateY(-PI / 2); rg2.translate(sx + sw / 2 + 0.03, 0, sz - sd / 2 - 0.02);
      s1.add(mesh(rg2, 'cabinet', { pos: [0, sy + sh / 2, 0] }));
      // 4 base con prensaestopas M25 y M16 (5, 6)
      s4.add(rbox(sw + 0.02, 0.03, sd + 0.02, 0.004, 'panelDark', { pos: [sx, sy - sh / 2 - 0.015, sz] }));
      s5.add(cyl(0.017, 0.017, 0.022, 'black', { pos: [sx - 0.12, sy - sh / 2 - 0.041, sz], seg: 24 })); s5.add(cyl(0.012, 0.012, 0.03, 'black', { pos: [sx - 0.12, sy - sh / 2 - 0.067, sz], seg: 20 }));
      s6.add(cyl(0.013, 0.013, 0.02, 'black', { pos: [sx + 0.1, sy - sh / 2 - 0.04, sz], seg: 24 })); s6.add(cyl(0.009, 0.009, 0.03, 'black', { pos: [sx + 0.1, sy - sh / 2 - 0.065, sz], seg: 20 }));
      // 3 puerta a derechas con 3 pilotos y pantalla AB 10"
      const ps = new THREE.Group(); ps.position.set(sx + sw / 2, sy, sz + sd / 2 + 0.008); s3.add(ps);
      ps.add(rbox(sw - 0.01, sh - 0.02, 0.016, 0.003, 'cabinet', { pos: [-sw / 2, 0, 0], shell: true }));
      [0.0, 0.05, 0.1].forEach((dx, i) => { ps.add(cyl(0.011, 0.011, 0.018, 'black', { axis: 'z', pos: [-0.06 - dx, sh / 2 - 0.05, 0.014], seg: 20 })); const c = [0x1f9d55, 0xe6b422, 0xd23a2d][i]; ps.add(cyl(0.014, 0.014, 0.008, ['green', 'yellow', 'red'][i], { axis: 'z', pos: [-0.06 - dx, sh / 2 - 0.05, 0.026], seg: 24, mat: { emissive: [0x0b3a1a, 0x332800, 0x330b0b][i] } })); });
      [0.2, -0.2].forEach(y => ps.add(cyl(0.007, 0.007, 0.05, 'steelDark', { pos: [0, y * 0.9, 0], seg: 12 })));
      K.doors.small = { pivot: ps, max: 1.95 };
      // 7 derivación tubo Festo QSY-12-10 (Y neumática): en la pared derecha del pequeño
      const y7 = new THREE.Group(); y7.position.set(sx + sw / 2 + 0.06, sy - 0.1, sz); s7.add(y7);
      y7.add(cyl(0.011, 0.011, 0.04, 'blueLight', { axis: 'x', pos: [0, 0, 0], seg: 20 })); y7.add(cyl(0.007, 0.007, 0.05, 'blueLight', { pos: [0.02, 0.02, 0.0], seg: 16, rot: [0, 0, -0.5] })); y7.add(cyl(0.007, 0.007, 0.05, 'blueLight', { pos: [0.02, -0.02, 0.0], seg: 16, rot: [0, 0, 0.5] }));
      y7.add(hose([[0.05, 0.04, 0], [0.12, 0.08, 0.0], [0.14, 0.5, -0.02]], 0.005, 'cableBlue', { radial: 10 })); y7.add(hose([[0.05, -0.04, 0], [0.12, -0.1, 0.0], [0.14, -0.5, -0.02]], 0.005, 'cableBlue', { radial: 10 }));
      y7.add(hose([[-0.02, 0, 0], [-0.08, 0.0, 0.03], [-0.1, -0.2, 0.0]], 0.006, 'cableBlue', { radial: 10 }));
      Object.keys(K.elems).forEach(k => { if (k.startsWith('gabinete:')) K.elemDoor[k] = null; });
      ['gabinete:3'].forEach(k => K.elemDoor[k] = 'small'); ['gabinete:10'].forEach(k => K.elemDoor[k] = 'tall');
      explode(g9, 0, 0, 0.5); explode(g2Grp(s2), 0, 0, 0.5);
      function g2Grp(g) { return g; }
      anim.push(function (dt, st) {
        ['tall', 'small'].forEach(k => { st.doors[k] += (st.doorT[k] - st.doors[k]) * Math.min(1, dt * 4); K.doors[k].pivot.rotation.y = K.doors[k].max * st.doors[k]; });
      });
    }

    /* =========================================================
     *  CPU Y CONEXIONES (4)  — armario pequeño
     * ========================================================= */
    {
      const C = 'cpu', g1 = el(C, 1), g2 = el(C, 2), g3 = el(C, 3), g4 = el(C, 4);
      K.elemDoor['cpu:1'] = K.elemDoor['cpu:2'] = K.elemDoor['cpu:4'] = 'small';
      // riel DIN y canaleta del armario pequeño
      const rails = new THREE.Group(); rails.name = 'cpu:rieles'; rails.userData.comp = C; comps[C].add(rails);
      [0.13, -0.04, -0.16].forEach(v => railDIN(rails, 0.44, Sp(0, v, 0)));
      [0.2, -0.2].forEach(v => duct(rails, 0.44, 0.04, Sp(0, v, 0), true));
      // 1 CPU compact GuardLogix motion safety 5069-L330ERMS2 + bornera RTB64 (2)
      const p1 = Sp(-0.14, 0.13, 0.0); K.elemDoor['cpu:1'] = 'small';
      block(g1, 0.075, 0.13, 0.085, [p1[0], p1[1] - 0.005, p1[2] + 0.04], 'abLight', { face: 'black', leds: 4 });
      g1.add(label('GuardLogix\n5069-L330ERMS2', 0.06, 0.03, { bg: '#22282e', fs: 24, pos: [p1[0], p1[1] + 0.03, p1[2] + 0.0835] }));
      [0, 1].forEach(i => g1.add(box(0.05, 0.008, 0.004, 'black', { pos: [p1[0], p1[1] - 0.045 - i * 0.012, p1[2] + 0.083], cast: false })));
      g2.add(rbox(0.09, 0.04, 0.05, 0.004, 'black', { pos: [p1[0], p1[1] + 0.09, p1[2] + 0.02] })); for (let i = 0; i < 16; i++) g2.add(box(0.004, 0.02, 0.012, 'steelDark', { pos: [p1[0] - 0.038 + i * 0.005, p1[1] + 0.09, p1[2] + 0.048], cast: false }));
      g2.add(rbox(0.09, 0.04, 0.05, 0.004, 'black', { pos: [p1[0], p1[1] - 0.09, p1[2] + 0.02] })); for (let i = 0; i < 16; i++) g2.add(box(0.004, 0.02, 0.012, 'steelDark', { pos: [p1[0] - 0.038 + i * 0.005, p1[1] - 0.09, p1[2] + 0.048], cast: false }));
      // 3 adaptador Ethernet Point I/O 1734-AENT: se monta en el riel del armario grande (ver módulos)
      const pa = Sp(0.0, -0.04, 0.0);
      block(g3, 0.05, 0.12, 0.075, [pa[0], pa[1], pa[2] + 0.04], 'abLight', { face: 'black', leds: 3 });
      g3.add(label('1734-AENT', 0.04, 0.02, { bg: '#22282e', fs: 24, pos: [pa[0], pa[1] + 0.03, pa[2] + 0.0785] })); [-1, 1].forEach(s => g3.add(box(0.012, 0.01, 0.006, 'black', { pos: [pa[0] + s * 0.014, pa[1] - 0.035, pa[2] + 0.079], cast: false })));
      // 4 switches 8 puertos no gestionados ×2
      [0.14, 0.2].forEach(u => { const p = Sp(u - 0.02, -0.04, 0); block(g4, 0.058, 0.09, 0.055, [p[0], p[1], p[2] + 0.03], 'gray', { face: 'black', leds: 8 }); for (let i = 0; i < 8; i++) g4.add(box(0.005, 0.008, 0.004, 'black', { pos: [p[0] - 0.024 + i * 0.0068, p[1] - 0.03, p[2] + 0.0575], cast: false })); });
      // latiguillos internos
      g4.add(hose([[p1[0] + 0.0, p1[1] - 0.05, p1[2] + 0.085], [p1[0] + 0.05, p1[1] - 0.09, p1[2] + 0.11], [pa[0], pa[1] - 0.03, pa[2] + 0.085]], 0.0035, 'cableBlue', { radial: 8 }));
      explode(g1, 0, 0, 0.4);
    }

    /* =========================================================
     *  MÓDULOS POINT I/O (9)  — armario alto
     * ========================================================= */
    {
      const C = 'io', v0 = 0.6, w = 0.0125;
      const eg = {}; for (let i = 1; i <= 9; i++) { eg[i] = el(C, i); K.elemDoor['io:' + i] = 'tall'; }
      const rails = new THREE.Group(); rails.name = 'io:riel'; rails.userData.comp = C; comps[C].add(rails); railDIN(rails, 0.6, Tp(0, v0, 0)); duct(rails, 0.6, 0.04, Tp(0, v0 + 0.11, 0), true);
      // cabecera: FPD (9) y EP24DC (8) + 12 bases (2) con módulos
      const order = [[8, 'red'], [1, 'abLight'], [1, 'abLight'], [1, 'abLight'], [1, 'abLight'], [1, 'abLight'], [3, 'abLight'], [3, 'abLight'], [3, 'abLight'], [4, 'abLight'], [5, 'abLight'], [6, 'abLight'], [7, 'abLight']];
      // orden real: 1=IB8 ×5, 3=IB8S ×3, 4=IE4C, 5=OB8, 6=OB8S, 7=OE2C ; 8=EP24DC, 9=FPD
      const seq = [8, 1, 1, 1, 1, 1, 3, 3, 3, 4, 5, 6, 7, 9];
      let u = -0.27; const baseGeom = new THREE.BoxGeometry(w, 0.05, 0.05);
      const baseList = [];
      seq.forEach((id, k) => {
        const p = Tp(u, v0, 0), isPower = id === 8 || id === 9;
        if (!isPower) baseList.push({ p: [p[0], p[1] - 0.045, p[2] + 0.025] });
        const colorMod = (id === 3 || id === 6) ? 'red' : (id === 4 || id === 7) ? 'blueLight' : (id === 5 ? 'abLight' : (id === 1 ? 'abLight' : 'gray'));
        block(eg[id === 8 ? 8 : id === 9 ? 9 : id], w * 0.95, isPower ? 0.09 : 0.075, 0.062, [p[0], p[1] + (isPower ? -0.0 : 0.012), p[2] + 0.037], isPower ? 'gray' : 'abLight', { leds: 3 });
        if (id === 3 || id === 6) eg[id].add(box(w * 0.9, 0.012, 0.003, 'red', { pos: [p[0], p[1] + 0.045, p[2] + 0.0685], cast: false }));
        if (id === 4 || id === 7) eg[id].add(box(w * 0.9, 0.012, 0.003, 'blueLight', { pos: [p[0], p[1] + 0.045, p[2] + 0.0685], cast: false }));
        u += w + 0.0015 + (id === 8 ? 0.006 : 0);
      });
      eg[2].add(inst(baseGeom, 'gray', baseList));
      // etiquetas de identificación (una placa por familia)
      eg[1].add(label('1734-IB8 ×5', 0.06, 0.012, { bg: '#0f1418', fs: 18, pos: [Tp(-0.27 + 3 * w, v0, 0)[0] + 0.02, Tp(0, v0, 0)[1] - 0.05, Tp(0, v0, 0)[2] + 0.0715] }));
      explode(eg[1], 0, 0, 0.5);
    }

    /* =========================================================
     *  CONTADORES Y PROTECCIÓN (15)
     * ========================================================= */
    {
      const C = 'proteccion', eg = {}; for (let i = 1; i <= 15; i++) { eg[i] = el(C, i); K.elemDoor['proteccion:' + i] = 'tall'; }
      const rails = new THREE.Group(); rails.name = 'proteccion:rieles'; rails.userData.comp = C; comps[C].add(rails);
      [0.36, 0.14, -0.06].forEach(v => railDIN(rails, 0.6, Tp(0, v, 0))); duct(rails, 0.6, 0.04, Tp(0, 0.47, 0), true); duct(rails, 0.6, 0.04, Tp(0, 0.25, 0), true);
      const brk = (g, u, v, poles, color) => { const wp = 0.018 * poles; block(g, wp, 0.085, 0.06, Tp(u, v, 0.03), 'abLight'); g.add(box(wp * 0.7, 0.014, 0.004, 'black', { pos: [Tp(u, v, 0)[0], Tp(u, v, 0)[1] + 0.02, Tp(u, v, 0)[2] + 0.062], cast: false })); g.add(box(0.008, 0.02, 0.008, color || 'black', { pos: [Tp(u, v, 0)[0], Tp(u, v, 0)[1] + 0.02, Tp(u, v, 0)[2] + 0.066] })); return wp; };
      // fila 1 (v=0.36): 9 interruptor general 40A + 10 alargo ; IC10A ; IC2A ×4 ; IC4A ×2 ; IIIC4A ×2 ; aux ×4
      let u = -0.28;
      const gp = Tp(u + 0.045, 0.36, 0);
      block(eg[9], 0.09, 0.13, 0.08, [gp[0], gp[1], gp[2] + 0.04], 'black'); eg[9].add(rbox(0.05, 0.05, 0.02, 0.006, 'red', { pos: [gp[0], gp[1] + 0.01, gp[2] + 0.09], mat: { color: 0xd8b020 } })); eg[9].add(rbox(0.035, 0.014, 0.014, 0.003, 'red', { pos: [gp[0], gp[1] + 0.01, gp[2] + 0.104] })); eg[9].add(cyl(0.006, 0.006, 0.03, 'steel', { axis: 'z', pos: [gp[0], gp[1] + 0.01, gp[2] + 0.115], seg: 12 }));
      eg[10].add(cyl(0.005, 0.005, 0.09, 'steel', { axis: 'z', pos: [gp[0], gp[1] + 0.01, gp[2] + 0.15], seg: 12 })); eg[10].add(cyl(0.008, 0.008, 0.012, 'steelDark', { axis: 'z', pos: [gp[0], gp[1] + 0.01, gp[2] + 0.198], seg: 12 }));
      u += 0.105;
      u += brk(eg[1], u + 0.009, 0.36, 1, 'green') + 0.002;
      for (let i = 0; i < 4; i++) { u += brk(eg[3], u + 0.009, 0.36, 1, 'black') + 0.002; }
      for (let i = 0; i < 2; i++) { u += brk(eg[4], u + 0.009, 0.36, 1, 'blueLight') + 0.002; }
      for (let i = 0; i < 2; i++) { u += brk(eg[5], u + 0.027, 0.36, 3, 'black') + 0.002; }
      // contactos auxiliares ×4 (a un costado de los magnetotérmicos)
      for (let i = 0; i < 4; i++) { const p = Tp(-0.128 + i * 0.02, 0.29, 0); block(eg[2], 0.014, 0.04, 0.05, [p[0], p[1], p[2] + 0.028], 'gray'); eg[2].add(box(0.01, 0.006, 0.003, 'yellow', { pos: [p[0], p[1] + 0.008, p[2] + 0.054], cast: false })); }
      // fila 2 (v=0.14): guardamotores 11 (1.6-2.5A), 14 (10-16A ×2), 15 (20A) ; 12 bloques contactos ×4 ; 13 accesorios ×3
      const gm = [[11, 'blueLight'], [14, 'blueLight'], [14, 'blueLight'], [15, 'red']]; let u2 = -0.28;
      gm.forEach(([id, col]) => { const p = Tp(u2 + 0.02, 0.14, 0); block(eg[id], 0.045, 0.095, 0.075, [p[0], p[1], p[2] + 0.037], 'abLight'); eg[id].add(cyl(0.011, 0.011, 0.014, col, { axis: 'z', pos: [p[0], p[1] + 0.012, p[2] + 0.081], seg: 20 })); eg[id].add(box(0.03, 0.01, 0.003, 'black', { pos: [p[0], p[1] - 0.025, p[2] + 0.076], cast: false })); u2 += 0.05; });
      for (let i = 0; i < 4; i++) { const p = Tp(-0.28 + i * 0.05 + 0.041, 0.14, 0); block(eg[12], 0.014, 0.07, 0.06, [p[0], p[1], p[2] + 0.031], 'black'); }
      for (let i = 0; i < 3; i++) { const p = Tp(-0.28 + i * 0.05 + 0.022, 0.08, 0); block(eg[13], 0.024, 0.03, 0.05, [p[0], p[1], p[2] + 0.027], 'gray'); eg[13].add(box(0.016, 0.006, 0.004, 'yellow', { pos: [p[0], p[1], p[2] + 0.054], cast: false })); }
      // contactores 9A ×2 (6), peana relé 11 polos (8), controlador de nivel (7)
      [0, 1].forEach(i => { const p = Tp(-0.05 + i * 0.05 + 0.02, 0.14, 0); block(eg[6], 0.045, 0.09, 0.08, [p[0], p[1], p[2] + 0.04], 'black'); eg[6].add(box(0.03, 0.02, 0.004, 'blueLight', { pos: [p[0], p[1] + 0.02, p[2] + 0.082], cast: false })); eg[6].add(box(0.036, 0.008, 0.004, 'steel', { pos: [p[0], p[1] - 0.03, p[2] + 0.082], cast: false })); });
      const p8 = Tp(0.13, 0.14, 0); block(eg[8], 0.05, 0.075, 0.06, [p8[0], p8[1], p8[2] + 0.03], 'blue'); for (let i = 0; i < 11; i++) eg[8].add(box(0.003, 0.006, 0.004, 'steel', { pos: [p8[0] - 0.02 + i * 0.004, p8[1] + 0.03, p8[2] + 0.062], cast: false }));
      const p7 = Tp(0.2, 0.14, 0); block(eg[7], 0.045, 0.08, 0.055, [p7[0], p7[1], p7[2] + 0.027], 'gray', { face: 'black', leds: 2 });
      explode(eg[9], 0, 0, 0.5);
    }

    /* =========================================================
     *  VARIADORES Y SERVO (3)
     * ========================================================= */
    {
      const C = 'variador', eg = { 1: el(C, 1), 2: el(C, 2), 3: el(C, 3) };
      K.elemDoor['variador:1'] = K.elemDoor['variador:2'] = K.elemDoor['variador:3'] = 'tall';
      const drive = (g, u, v, w, h, d, txt) => {
        const p = Tp(u, v, 0); block(g, w, h, d, [p[0], p[1], p[2] + d / 2], 'ab');
        g.add(box(w * 0.86, h * 0.34, 0.004, 'black', { pos: [p[0], p[1] + h * 0.2, p[2] + d + 0.001], cast: false }));
        g.add(label(txt, w * 0.8, 0.014, { bg: '#0f1418', fs: 22, pos: [p[0], p[1] + h * 0.42, p[2] + d + 0.0025] }));
        for (let i = 0; i < 6; i++) g.add(box(w * 0.1, w * 0.1, 0.004, i % 2 ? 'gray' : 'green', { pos: [p[0] - w * 0.28 + (i % 3) * w * 0.28, p[1] - h * 0.02 - Math.floor(i / 3) * w * 0.14, p[2] + d + 0.001], cast: false }));
        const vg = new THREE.Group(); vg.position.set(p[0], p[1] + h / 2 + 0.02, p[2] + d * 0.5); g.add(vg);
        vg.add(box(w * 0.7, 0.008, d * 0.7, 'steelDark', { pos: [0, -0.02, 0] }));
        for (let i = 0; i < 6; i++) vg.add(box(w * 0.06, 0.03, d * 0.7, 'steelDark', { pos: [-w * 0.3 + i * w * 0.12, -0.005, 0], cast: false }));
      };
      drive(eg[1], -0.26, -0.13, 0.07, 0.17, 0.13, 'PowerFlex 525 0,4 kW');
      drive(eg[2], -0.16, -0.13, 0.09, 0.19, 0.14, 'PowerFlex 525 4 kW'); drive(eg[2], -0.05, -0.13, 0.09, 0.19, 0.14, 'PowerFlex 525 4 kW');
      // 3 controladora servo Kinetix 5,1 kW
      const p = Tp(0.1, -0.09, 0); block(eg[3], 0.11, 0.3, 0.15, [p[0], p[1], p[2] + 0.075], 'ab'); eg[3].add(box(0.09, 0.09, 0.004, 'black', { pos: [p[0], p[1] + 0.09, p[2] + 0.151], cast: false })); eg[3].add(label('Kinetix 5700 2198-H025', 0.09, 0.014, { bg: '#0f1418', fs: 20, pos: [p[0], p[1] + 0.14, p[2] + 0.1525] }));
      for (let i = 0; i < 4; i++) eg[3].add(box(0.06, 0.014, 0.004, 'green', { pos: [p[0], p[1] - 0.03 - i * 0.03, p[2] + 0.151], cast: false }));
      explode(eg[3], 0, 0, 0.5);
    }

    /* =========================================================
     *  ALIMENTACIÓN Y CLIMATIZACIÓN (3)
     * ========================================================= */
    {
      const C = 'alimentacion', g1 = el(C, 1), g2 = el(C, 2), g3 = el(C, 3);
      K.elemDoor['alimentacion:1'] = K.elemDoor['alimentacion:3'] = 'tall'; K.elemDoor['alimentacion:2'] = null;
      // 3 fuentes 380-480VAC → 24 VDC 10A ×2 (riel inferior)
      [0, 1].forEach(i => { const p = Tp(-0.16 + i * 0.11, -0.4, 0); block(g3, 0.09, 0.13, 0.11, [p[0], p[1], p[2] + 0.055], 'abLight'); g3.add(box(0.07, 0.02, 0.004, 'black', { pos: [p[0], p[1] + 0.03, p[2] + 0.111], cast: false })); g3.add(label('XLE240E-3', 0.07, 0.012, { bg: '#0f1418', fs: 20, pos: [p[0], p[1] + 0.05, p[2] + 0.1115] })); for (let k = 0; k < 6; k++) g3.add(box(0.006, 0.014, 0.004, 'steel', { pos: [p[0] - 0.025 + k * 0.01, p[1] - 0.055, p[2] + 0.11], cast: false })); });
      railDIN(comps[C], 0.6, Tp(0, -0.4, 0));
      // 1 refrigerador Peltier ELMEKO PK150 en la pared lateral derecha (aleteado exterior + ventilador)
      const px = T.x + T.w / 2, py = T.y - 0.05, pz = T.z + 0.02;
      g1.add(rbox(0.05, 0.3, 0.18, 0.006, 'steelDark', { pos: [px + 0.028, py, pz] }));
      for (let i = 0; i < 14; i++) g1.add(box(0.06, 0.26, 0.004, 'anodized', { pos: [px + 0.075, py, pz - 0.075 + i * 0.0115], cast: false }));
      g1.add(cyl(0.055, 0.055, 0.03, 'black', { axis: 'x', pos: [px + 0.115, py, pz], seg: 32 })); for (let i = 0; i < 5; i++) g1.add(box(0.004, 0.09, 0.012, 'black', { pos: [px + 0.131, py, pz], rot: [i * PI / 5, 0, 0], cast: false }));
      // 2 canal de recogida de condensado bajo el Peltier
      g2.add(rbox(0.07, 0.04, 0.22, 0.008, 'steel', { pos: [px + 0.06, py - 0.19, pz] })); g2.add(pipe([[px + 0.06, py - 0.21, pz + 0.1], [px + 0.06, py - 0.42, pz + 0.1], [px + 0.06, py - 0.45, pz + 0.14]], 0.006, 'cableGray', { radial: 10, bend: 0.03 }));
      explode(g1, 0.4, 0, 0); explode(g2, 0.4, 0, 0);
    }
  });
})();
