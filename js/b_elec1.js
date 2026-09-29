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
    // coordenadas de la placa de montaje del armario alto (plano del Excel): u desde el borde izquierdo y v desde arriba, en mm
    const PL = (u, v, w) => [T.x + u / 1000 - 0.33, T.y + 0.81 - v / 1000, back(T) + 0.03 + (w || 0)];
    K.PL = PL;
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
      [0.72, 0.0, -0.72].forEach(y => { pv.add(cyl(0.011, 0.011, 0.1, 'steelDark', { pos: [0.012, y, -0.006], seg: 20 })); pv.add(rbox(0.04, 0.09, 0.006, 0.002, 'steelDark', { pos: [-0.012, y, 0.0] })); });
      const slats = []; for (let i = 0; i < 16; i++) slats.push({ p: [cx - W / 2 - 0.004, cy - 0.55 + i * 0.024, cz + 0.02], r: [0, 0, 0.35] });
      g9.add(K.inst(K.geo('slat', () => new THREE.BoxGeometry(0.008, 0.012, 0.16)), 'steelDark', slats));
      g9.add(K.label('Armario 700×1700×300 · IP66', 0.11, 0.04, { bg: '#d3d7db', fg: '#111', fs: 16, pos: [cx + 0.2, cy + 0.0, cz + D / 2 + 0.0085 + 0.0], rot: [0, 0, 0] }).translateZ(0.0));
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

    /* ---------- utilidades de la placa de montaje del armario alto (plano del Excel: 660 × 1620 mm) ---------- */
    function dev(g, u, v, wm, hm, d, m, o) { return block(g, wm / 1000, hm / 1000, d, PL(u, v, d / 2), m, o); }
    function tag(g, u, v, txt, wm, hm, d, o) { const p = PL(u, v, d + 0.0016); g.add(label(txt, wm / 1000, hm / 1000, Object.assign({ bg: '#0f1418', fs: 20, pos: [p[0], p[1], p[2]] }, o || {}))); }
    function ductAt(g, u, v, wm, hm) { g.add(rbox(wm / 1000, hm / 1000, 0.045, 0.004, 'lightGray', { pos: PL(u, v, 0.024) })); for (let i = 0; i < Math.floor(wm >= hm ? wm / 7 : hm / 7); i++) { const off = -(wm >= hm ? wm : hm) / 2 + 4 + i * 7; g.add(box(wm >= hm ? 0.0015 : wm / 1000 - 0.004, wm >= hm ? hm / 1000 - 0.004 : 0.0015, 0.001, 'gray', { pos: PL(u + (wm >= hm ? off : 0), v + (wm >= hm ? 0 : off), 0.0478), cast: false })); } }
    const DOORT = k => { K.elemDoor[k] = 'tall'; };
    // canaletas ranuradas y rieles DIN de la placa (plano: 806077, 804077, 808077, 803077)
    {
      const duc = new THREE.Group(); duc.name = 'gabinete:canaletas'; duc.userData.comp = 'gabinete'; comps.gabinete.add(duc);
      ductAt(duc, 330, 205, 574, 60); ductAt(duc, 330, 433, 574, 43); ductAt(duc, 330, 695, 574, 60); ductAt(duc, 330, 927, 574, 60); ductAt(duc, 246, 1208, 406, 43); ductAt(duc, 351, 1580, 617, 80);
      ductAt(duc, 638, 600, 43, 850); ductAt(duc, 193, 88, 30, 175); ductAt(duc, 339, 1390, 60, 300); ductAt(duc, 409, 1390, 80, 300);
      [110, 325, 560, 810, 1067, 1390].forEach(v => duc.add(rbox(0.56, 0.035, 0.007, 0.001, 'steelDark', { pos: PL(330, v + 65, 0.0), cast: false })));
    }

    /* =========================================================
     *  CPU Y CONEXIONES (4) — armario alto (posición A1 / A2 / A3-A4 del plano)
     * ========================================================= */
    {
      const C = 'cpu', g1 = el(C, 1), g2 = el(C, 2), g3 = el(C, 3), g4 = el(C, 4);
      ['cpu:1', 'cpu:2', 'cpu:3', 'cpu:4'].forEach(DOORT);
      // 1 CPU compact GuardLogix motion safety 5069-L330ERMS2 (A1) + 2 kit de conectores RTB64 arriba y abajo
      dev(g1, 545, 560, 100, 190, 0.085, 'abLight', { face: 'black', leds: 4 });
      tag(g1, 545, 505, 'Rockwell Automation\n5069-L330ERMS2', 88, 30, 0.085, { fs: 16, bg: '#22282e' });
      [0, 1].forEach(i => { const p = PL(545, 470 - i * 30, 0.0855); g1.add(box(0.05, 0.008, 0.004, 'black', { pos: p, cast: false })); });
      g1.add(box(0.014, 0.03, 0.004, 'black', { pos: PL(568, 560, 0.0855), cast: false }));
      [[545, 435], [545, 685]].forEach(p => { dev(g2, p[0], p[1], 100, 40, 0.05, 'black'); const q = PL(p[0], p[1], 0.052); for (let i = 0; i < 16; i++) g2.add(box(0.004, 0.02, 0.006, 'steelDark', { pos: [q[0] - 0.038 + i * 0.005, q[1], q[2]], cast: false })); });
      // 3 adaptador Ethernet Point I/O 1734-AENT (A2), cabecera de la fila de módulos
      dev(g3, 262, 100, 50, 130, 0.075, 'abLight', { face: 'black', leds: 3 }); tag(g3, 262, 70, '1734-AENT', 42, 16, 0.075, { fs: 22 }); [-1, 1].forEach(s => g3.add(box(0.012, 0.01, 0.006, 'black', { pos: PL(262 + s * 14, 130, 0.0785), cast: false })));
      // 4 switches de 8 puertos no gestionados ×2 (A3, A4)
      [530, 585].forEach(u => { dev(g4, u, 105, 45, 130, 0.055, 'gray', { face: 'black', leds: 8 }); for (let i = 0; i < 8; i++) g4.add(box(0.005, 0.008, 0.004, 'black', { pos: PL(u - 16 + i * 4.6, 155, 0.0575), cast: false })); });
      g4.add(hose([PL(545, 470, 0.09), PL(500, 380, 0.13), PL(560, 150, 0.09)], 0.0035, 'cableBlue', { radial: 8 }));
      explode(g1, 0, 0, 0.4);
    }

    /* =========================================================
     *  MÓDULOS POINT I/O (9) — fila superior del plano, en el orden del dibujo (imagen 77)
     *  AENT · 3×IB8S · 5×IB8 · EP24DC · OB8S · OB8 · FPD · OE2C (+ IE4C)
     * ========================================================= */
    {
      const C = 'io', eg = {}; for (let i = 1; i <= 9; i++) { eg[i] = el(C, i); DOORT('io:' + i); }
      const seq = [3, 3, 3, 1, 1, 1, 1, 1, 8, 6, 5, 9, 7, 4];    // io:n según la tabla de la taxonomía (ver comentario)
      let u = 262 + 25 + 1; const bases = [];
      seq.forEach(id => {
        const power = id === 8 || id === 9, w = power ? 24 : 12.2;
        const uc = u + w / 2; u += w + 0.4;
        dev(eg[id], uc, 88, w - 0.4, power ? 118 : 96, 0.062, power ? 'lightGray' : 'abLight', { leds: 3 });
        if (id === 3 || id === 6) eg[id].add(box((w - 1) / 1000, 0.012, 0.003, 'red', { pos: PL(uc, 50, 0.0635), cast: false }));
        if (id === 4 || id === 7) eg[id].add(box((w - 1) / 1000, 0.012, 0.003, 'blueLight', { pos: PL(uc, 50, 0.0635), cast: false }));
        if (power) tag(eg[id], uc, 96, id === 8 ? '1734-EP24DC' : '1734-FPD', 20, 44, 0.062, { fs: 18, bg: '#e6e9ec', fg: '#1a3f8c' });
        if (!power) bases.push(uc);
      });
      // 2 bases TB ×12 con sus bornes
      eg[2].add(K.inst(K.geo('tbBase', () => new THREE.BoxGeometry(0.0118, 0.052, 0.05)), 'gray', bases.map(x => ({ p: PL(x, 175, 0.025) }))));
      eg[2].add(K.inst(K.geo('tbTerm', () => new THREE.BoxGeometry(0.008, 0.004, 0.004)), 'steel', bases.flatMap(x => [0, 1, 2, 3].map(k => ({ p: PL(x, 160 + k * 8, 0.052) })))));
      tag(eg[1], 330, 25, '1734-IB8 ×5', 56, 12, 0.062, { fs: 16 });
      explode(eg[1], 0, 0, 0.5);
    }

    /* =========================================================
     *  CONTADORES Y PROTECCIÓN (15) — filas B, C y D del plano
     * ========================================================= */
    {
      const C = 'proteccion', eg = {}; for (let i = 1; i <= 15; i++) { eg[i] = el(C, i); DOORT('proteccion:' + i); }
      const brk = (g, u, v, poles, color, h) => { const wp = 18 * poles; dev(g, u, v, wp - 0.6, h || 90, 0.06, 'abLight'); g.add(box((wp - 6) / 1000, 0.014, 0.004, 'black', { pos: PL(u, v - 25, 0.062), cast: false })); g.add(box(0.008, 0.02, 0.008, color || 'black', { pos: PL(u, v - 25, 0.066) })); return wp; };
      // fila superior izquierda: K1 (peana de relé 11 polos, 8) y KF1 (controlador de nivel, 7)
      dev(eg[8], 108, 100, 40, 120, 0.06, 'blue'); for (let i = 0; i < 11; i++) eg[8].add(box(0.003, 0.006, 0.004, 'steel', { pos: PL(96 + i * 2.4, 55, 0.062), cast: false }));
      dev(eg[7], 152, 100, 34, 120, 0.055, 'gray', { face: 'black', leds: 2 });
      // fila B: guardamotores Q1–Q4 con bloques de contactos (12) y accesorios (13)
      [[11, 'blueLight'], [14, 'blueLight'], [14, 'blueLight'], [15, 'red']].forEach(([id, col], i) => {
        const u = 82 + i * 52; dev(eg[id], u, 335, 44, 100, 0.075, 'abLight'); eg[id].add(cyl(0.011, 0.011, 0.014, col, { axis: 'z', pos: PL(u, 315, 0.081), seg: 20 })); eg[id].add(box(0.03, 0.01, 0.003, 'black', { pos: PL(u, 355, 0.076), cast: false }));
        dev(eg[12], u + 24, 335, 9, 70, 0.06, 'black');
        if (i < 3) dev(eg[13], u, 275, 24, 26, 0.05, 'gray'), eg[13].add(box(0.016, 0.006, 0.004, 'yellow', { pos: PL(u, 275, 0.052), cast: false }));
      });
      // FP1, FP2: magnetotérmicos de 3 polos (5)
      [318, 374].forEach(u => brk(eg[5], u, 330, 3, 'black', 100));
      // grupo de 1 polo: IC10A (1), IC2A ×4 (3), IC4A ×2 (4) + contactos auxiliares ×4 (2)
      let u2 = 440; u2 += brk(eg[1], u2 + 9, 330, 1, 'green', 100) + 0.6; for (let i = 0; i < 4; i++) u2 += brk(eg[3], u2 + 9, 330, 1, 'black', 100) + 0.6; for (let i = 0; i < 2; i++) u2 += brk(eg[4], u2 + 9, 330, 1, 'blueLight', 100) + 0.6;
      for (let i = 0; i < 4; i++) { dev(eg[2], 440 + i * 9 + 4, 400, 8, 36, 0.05, 'gray'); eg[2].add(box(0.006, 0.006, 0.003, 'yellow', { pos: PL(444 + i * 9, 396, 0.052), cast: false })); }
      // fila C: contactores 9A (6) junto a A1; fila D: interruptor general 40A (9) y alargo (10)
      [430, 476].forEach(u => { dev(eg[6], u, 560, 42, 95, 0.08, 'black'); eg[6].add(box(0.03, 0.02, 0.004, 'blueLight', { pos: PL(u, 535, 0.082), cast: false })); eg[6].add(box(0.036, 0.008, 0.004, 'steel', { pos: PL(u, 590, 0.082), cast: false })); });
      dev(eg[9], 120, 810, 70, 130, 0.08, 'black'); eg[9].add(rbox(0.05, 0.05, 0.02, 0.006, 'yellow', { pos: PL(120, 810, 0.09) })); eg[9].add(rbox(0.035, 0.014, 0.014, 0.003, 'red', { pos: PL(120, 810, 0.104) }));
      eg[10].add(cyl(0.005, 0.005, 0.09, 'steel', { axis: 'z', pos: PL(120, 810, 0.15), seg: 12 })); eg[10].add(cyl(0.008, 0.008, 0.012, 'steelDark', { axis: 'z', pos: PL(120, 810, 0.198), seg: 12 }));
      explode(eg[9], 0, 0, 0.5);
    }

    /* =========================================================
     *  VARIADORES Y SERVO (3) — filas E (U1, U2, U3) y F (U4)
     * ========================================================= */
    {
      const C = 'variador', eg = { 1: el(C, 1), 2: el(C, 2), 3: el(C, 3) };
      [1, 2, 3].forEach(i => DOORT('variador:' + i));
      const drive = (g, u, v, wm, hm, d, txt) => {
        dev(g, u, v, wm, hm, d, 'ab'); g.add(box(wm * 0.86 / 1000, hm * 0.34 / 1000, 0.004, 'black', { pos: PL(u, v - hm * 0.2, d + 0.001), cast: false }));
        tag(g, u, v - hm * 0.42, txt, wm * 0.8, 14, d + 0.0015, { fs: 18 });
        for (let i = 0; i < 6; i++) g.add(box(wm * 0.1 / 1000, wm * 0.1 / 1000, 0.004, i % 2 ? 'gray' : 'green', { pos: PL(u - wm * 0.28 + (i % 3) * wm * 0.28, v + hm * 0.02 + Math.floor(i / 3) * wm * 0.14, d + 0.001), cast: false }));
        const vg = new THREE.Group(); const vp = PL(u, v - hm / 2 - 10, d * 0.5); vg.position.set(vp[0], vp[1], vp[2]); g.add(vg);
        vg.add(box(wm * 0.7 / 1000, 0.008, d * 0.7, 'steelDark', { pos: [0, -0.02, 0] })); for (let i = 0; i < 6; i++) vg.add(box(wm * 0.06 / 1000, 0.03, d * 0.7, 'steelDark', { pos: [-wm * 0.0003 + (i - 2.5) * wm * 0.00012 * 1.0, -0.005, 0], cast: false }));
      };
      drive(eg[1], 80, 1067, 74, 200, 0.13, 'PowerFlex 525 0,4 kW');
      drive(eg[2], 175, 1067, 93, 220, 0.14, 'PowerFlex 525 4 kW'); drive(eg[2], 275, 1067, 93, 220, 0.14, 'PowerFlex 525 4 kW');
      dev(eg[3], 130, 1400, 62, 300, 0.15, 'ab'); dev(eg[3], 130, 1330, 50, 80, 0.155, 'black'); tag(eg[3], 130, 1265, 'Kinetix 5700 2198-H025', 56, 14, 0.152, { fs: 16 });
      for (let i = 0; i < 4; i++) eg[3].add(box(0.045, 0.014, 0.004, 'green', { pos: PL(130, 1400 + i * 30, 0.151), cast: false }));
      explode(eg[3], 0, 0, 0.5);
    }

    /* =========================================================
     *  ALIMENTACIÓN Y CLIMATIZACIÓN (3)
     * ========================================================= */
    {
      const C = 'alimentacion', g1 = el(C, 1), g2 = el(C, 2), g3 = el(C, 3);
      ['alimentacion:1', 'alimentacion:3'].forEach(DOORT); K.elemDoor['alimentacion:2'] = null;
      // 3 fuentes 380-480 VAC → 24 VDC 10 A ×2 (G1, G2 en la fila C)
      [75, 135].forEach(u => { dev(g3, u, 560, 52, 150, 0.11, 'abLight'); g3.add(box(0.04, 0.02, 0.004, 'black', { pos: PL(u, 520, 0.111), cast: false })); tag(g3, u, 500, 'XLE240E-3', 42, 12, 0.111, { fs: 16 }); for (let k = 0; k < 6; k++) g3.add(box(0.006, 0.014, 0.004, 'steel', { pos: PL(u - 15 + k * 6, 630, 0.11), cast: false })); });
      // 1 refrigerador Peltier ELMEKO PK150: unidad interior (E1 del plano) + aleteado exterior en la pared derecha
      dev(g1, 555, 1330, 190, 250, 0.06, 'steelDark'); for (let i = 0; i < 10; i++) g1.add(box(0.17, 0.004, 0.02, 'anodized', { pos: PL(555, 1230 + i * 20, 0.07), cast: false }));
      g1.add(cyl(0.05, 0.05, 0.02, 'black', { axis: 'z', pos: PL(555, 1440, 0.075), seg: 32 }));
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
