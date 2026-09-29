/* CASSETTE DE CUCHILLAS · SISTEMA DE CORTE · REPARTIDOR DE CUAJADA */
(function () {
  'use strict';
  window.MODEL_BUILDERS.push(function (K) {
    const { THREE, PI, TAU, el, comps, box, rbox, cyl, torus, sphere, lathe, extrude, merge, tr, put, bolts, nuts, washers, line, grid, pipe, hose, clamp, inst, mat, mesh, explode, spin, geo } = K;
    const L = K.L, S = K.parts;
    L.hopper = { x0: -1.25, x1: 1.25, z0: -0.52, z1: -0.1, y0: 2.86, y1: 3.3 };

    // tronco de pirámide rectangular (y ± h/2)
    K.frustum = function (wt, dt, wb, db, h, m, o) {
      const pos = [], idx = [];
      const T = [[-wt / 2, h / 2, -dt / 2], [wt / 2, h / 2, -dt / 2], [wt / 2, h / 2, dt / 2], [-wt / 2, h / 2, dt / 2]];
      const B = [[-wb / 2, -h / 2, -db / 2], [wb / 2, -h / 2, -db / 2], [wb / 2, -h / 2, db / 2], [-wb / 2, -h / 2, db / 2]];
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4, b = pos.length / 3; [T[i], T[j], B[j], B[i]].forEach(v => pos.push(v[0], v[1], v[2])); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      return mesh(g, m, Object.assign({ mat: { side: THREE.DoubleSide } }, o));
    };

    /* =========================================================
     *  CASSETTE DE CUCHILLAS DE MOLDEO (14)
     * ========================================================= */
    {
      const C = 'cassette', c = L.cass, n = c.n, dz = (c.z0 + c.z1) / 2, dx = (c.x1 - c.x0) / (n - 1), by = (c.y0 + c.y1) / 2;
      const xs = []; for (let k = 0; k < n; k++) xs.push(c.x0 + k * dx);
      // cuchillas (chapa perfilada extruida en X) — instanciadas
      const bs = new THREE.Shape(), hz = (c.z1 - c.z0) / 2, hy = (c.y1 - c.y0) / 2;
      bs.moveTo(-hz, -hy + 0.05); bs.lineTo(-hz + 0.03, -hy); bs.lineTo(hz - 0.03, -hy); bs.lineTo(hz, -hy + 0.05); bs.lineTo(hz, hy); bs.lineTo(-hz, hy); bs.closePath();
      const hole = new THREE.Path(); hole.absarc(0, hy - 0.08, 0.012, 0, TAU, true); bs.holes.push(hole);
      const bg = new THREE.ExtrudeGeometry(bs, { depth: 0.005, bevelEnabled: false, curveSegments: 12 }); bg.translate(0, 0, -0.0025); bg.rotateY(PI / 2);
      const blades = new THREE.Group(); blades.name = 'cassette:cuchillas'; blades.userData.comp = C; comps[C].add(blades);
      blades.add(inst(bg, 'steel', xs.map(x => ({ p: [x, by, dz] })), { mat: { roughness: 0.18 } }));
      // placa superior del cassette
      blades.add(rbox(2.5, 0.035, 0.36, 0.005, 'steelDark', { pos: [0, c.y1 + 0.018, dz] }));
      // 3 junta cassette (marco EPDM plano en XZ)
      const g3 = el(C, 3); const jg = K.frameGasket(2.5, 0.36, 0.022, 0.008, 'epdm', { pos: [0, c.y1 + 0.041, dz] }); jg.rotation.x = -PI / 2; g3.add(jg);
      // 4 muelles de disco Polysorb (pila de conos) — 41
      const g4 = el(C, 4);
      const spr = geo('discSpring', () => merge([0, 1, 2].map(i => { const g = new THREE.CylinderGeometry(0.008 + 0.002, 0.016, 0.006, 20, 1, true); g.translate(0, i * 0.0075 + (i % 2 ? 0 : 0), 0); return g; })));
      g4.add(inst(spr, 'iglidur', xs.map(x => ({ p: [x, c.y1 + 0.06, dz] })), { mat: { side: THREE.DoubleSide } }));
      // 5 arandela DIN125 ø10 — 41 ; 10 tirafondo Ø10x60 — 41
      el(C, 5).add(inst(K.washerGeo(0.005), 'steel', xs.map(x => ({ p: [x, c.y1 + 0.046, dz] }))));
      el(C, 10).add(inst(K.boltGeo(0.005, 0.06), 'steelDark', xs.map(x => ({ p: [x, c.y1 + 0.09, dz] }))));
      // 6, 11 patines traseros (dos mitades)
      const g6 = el(C, 6), g11 = el(C, 11);
      g6.add(rbox(1.2, 0.5, 0.012, 0.003, 'uhmw', { pos: [-0.61, by - 0.03, c.z0 - 0.009] }));
      g11.add(rbox(1.2, 0.5, 0.012, 0.003, 'uhmw', { pos: [0.61, by - 0.03, c.z0 - 0.009] }));
      // 7 tornillo DIN 7972 (avellanado) ×24 en los patines
      const p7 = []; for (let i = 0; i < 12; i++) { p7.push([-1.15 + i * 0.1, by + 0.19, c.z0 - 0.015]); p7.push([-1.15 + i * 0.1 + 0.1 * 12 * 0.0 + 0.0, by - 0.24, c.z0 - 0.015]); }
      el(C, 7).add(bolts(p7.map((p, i) => [p[0] + (i % 2 ? 0 : 0) + 0.0, p[1], p[2]]), 0.0055, 0.019, 'nz'));
      // 8 tornillo DIN 7976 ST8x38 ×74 (sobre placa superior y guías)
      const p8 = []; for (let i = 0; i < 37; i++) { p8.push([-1.2 + i * 2.4 / 36, c.y1 + 0.045, c.z0 + 0.03]); p8.push([-1.2 + i * 2.4 / 36, c.y1 + 0.045, c.z1 - 0.03]); }
      el(C, 8).add(bolts(p8, 0.008, 0.038, 'y'));
      // 9 portatubos: canal C con clips a lo largo
      const g9 = el(C, 9);
      g9.add(rbox(2.5, 0.05, 0.03, 0.004, 'steelDark', { pos: [0, c.y1 + 0.13, c.z1 + 0.02] }));
      for (let i = 0; i < 12; i++) g9.add(torus(0.014, 0.003, 'steel', { pos: [-1.1 + i * 0.2, c.y1 + 0.13, c.z1 + 0.02], arc: PI * 1.5, seg: 16 }));
      // 12 guías laterales ×2, 14 guías centrales ×4, 13 arandelas DIN 9021 ×12
      const g12 = el(C, 12), g14 = el(C, 14), g13 = el(C, 13);
      [-1, 1].forEach(s => g12.add(rbox(0.04, c.y1 - c.y0 + 0.06, 0.36, 0.006, 'steelDark', { pos: [s * 1.245, by, dz] })));
      [-0.6, -0.2, 0.2, 0.6].forEach(x => g14.add(rbox(0.03, c.y1 - c.y0 - 0.1, 0.03, 0.005, 'steelDark', { pos: [x + 0.03, by - 0.02, c.z1 + 0.03] })));
      const p13 = []; [-1, 1].forEach(s => [0, 1, 2].forEach(i => [-1, 1].forEach(z => p13.push([s * 1.268, by - 0.2 + i * 0.2, dz + z * 0.12]))));
      g13.add(washers(p13, 0.01, 'x'));
      // 1 válvulas mariposa OD51 T1 ×2 y 2 bolas CD-17C ×22 en colectores
      const g1 = el(C, 1), g2 = el(C, 2), hy2 = 2.76;
      [c.z0 - 0.06, c.z1 + 0.1].forEach((z, k) => {
        const p = pipe([[-1.3, hy2, z], [1.62, hy2, z]], 0.016, 'steel', { radial: 24 }); g2.add(p);
        const v = S.butterfly(51, 'T1'); v.position.set(1.36, hy2, z); g1.add(v);
        g1.add(clamp(1.36 - 0.08 - 0.01, hy2, z, 'x', 0.016)); g1.add(clamp(1.36 + 0.08 + 0.01, hy2, z, 'x', 0.016));
      });
      const bp = []; [c.z0 - 0.06, c.z1 + 0.1].forEach(z => { for (let i = 0; i < 11; i++) bp.push({ p: [-1.15 + i * 0.23, hy2 - 0.02, z], r: [PI, 0, 0] }); });
      g2.add(inst(K.sprayBall28, 'steel', bp));
      explode(blades, 0, 0.6, 0); explode(g4, 0, 0.75, 0); explode(g5x(), 0, 0.8, 0);
      function g5x() { return comps[C].children.find(o => o.name === C + ':5'); }
    }

    /* =========================================================
     *  SISTEMA DE CORTE (17)
     * ========================================================= */
    {
      const C = 'corte', hp = L.hopper, ky = hp.y0 - 0.025, kz = -0.31;
      // 7 cuchilla superior (corredera bajo la tolva) y 5 cuchilla delantera (vertical frente al cassette)
      const g7 = el(C, 7), g5 = el(C, 5);
      const ks = new THREE.Shape(); ks.moveTo(-1.28, 0); ks.lineTo(1.28, 0); ks.lineTo(1.28, 0.008); ks.lineTo(-1.28, 0.008); ks.closePath();
      const sup = new THREE.Group(); sup.position.set(0, ky, kz); g7.add(sup);
      sup.add(rbox(2.56, 0.012, 0.2, 0.002, 'steel', { pos: [0, 0, 0], mat: { roughness: 0.12 } }));
      sup.add(mesh(new THREE.BoxGeometry(2.56, 0.004, 0.02), 'steel', { pos: [0, -0.006, 0.11], rot: [0, 0, 0] }));
      K.corteSup = sup;
      const del = new THREE.Group(); del.position.set(0, 2.34, L.cass.z1 + 0.09); g5.add(del);
      del.add(rbox(2.56, 0.62, 0.012, 0.002, 'steel', { mat: { roughness: 0.12 } }));
      del.add(box(2.56, 0.02, 0.03, 'steelDark', { pos: [0, 0.32, 0.005] }));
      K.corteDel = del;
      // 3 cremalleras M3 ×4 (dientes en instancia) ; 12 piñones ×2 ; 11 eje piñones
      const g3 = el(C, 3), g12 = el(C, 12), g11 = el(C, 11), g9 = el(C, 9), g10 = el(C, 10), g2 = el(C, 2), g1 = el(C, 1), g8 = el(C, 8);
      const rackX = [-1.31, -1.26, 1.26, 1.31], rz = L.cass.z1 + 0.09, ry0 = 2.34;
      const toothG = K.geo('rackTooth', () => new THREE.BoxGeometry(0.03, 0.0045, 0.03));
      rackX.forEach((x, k) => {
        const rk = new THREE.Group(); rk.position.set(x, ry0, rz + (k % 2 ? 0.04 : 0.0)); g3.add(rk);
        rk.add(rbox(0.03, 0.62, 0.03, 0.003, 'steelDark', { pos: [0.0, 0, 0] }));
        const tl = []; for (let i = 0; i < 60; i++) tl.push({ p: [0.0, -0.3 + i * 0.01, 0.02] });
        rk.add(inst(toothG, 'steel', tl.map(t => ({ p: [0, t.p[1], 0.02] }))));
      });
      const shy = 2.34 + 0.2;
      g11.add(cyl(0.01, 0.01, 2.9, 'steel', { axis: 'x', pos: [0, shy, rz + 0.06], seg: 24 }));
      [-1, 1].forEach(s => {
        const p = S.sprocket(0.035, 14, 0.06, 'steelDark'); p.rotation.y = PI / 2; p.position.set(s * 1.285, shy, rz + 0.06); g12.add(p);
        const b = S.ucfl(20); b.rotation.y = PI / 2 * s; b.position.set(s * 1.45, shy, rz + 0.06); el(C, 13).add(b);
        const cp = cyl(0.026, 0.026, 0.04, 'steel', { axis: 'x', pos: [s * 1.495, shy, rz + 0.06], seg: 24 }); el(C, 14).add(cp);
      });
      // 4 cilindro CRDNG Ø100 c.165 — mueve la cuchilla superior (eje Z)
      const g4 = el(C, 4), cy = S.pneuCyl(100, 0.165); cy.rotation.y = PI / 2; cy.position.set(1.52, ky + 0.02, kz + 0.42); g4.add(cy);
      const cl = box(0.06, 0.01, 0.2, 'steelDark', { pos: [1.4, ky - 0.01, kz + 0.3] }); g4.add(cl);
      // 2 pasadores Ø18x5, 10 pasadores de aletas, 9 dollas con espárrago, 1 tuercas autoblocantes M8, 8 arandelas Ø12
      const pinPos = rackX.map((x, k) => [x, ry0 - 0.29, rz + (k % 2 ? 0.04 : 0.0)]);
      g2.add(inst(K.geo('pinDia', () => merge([new THREE.CylinderGeometry(0.009, 0.009, 0.04, 20), tr(new THREE.CylinderGeometry(0.013, 0.013, 0.005, 20), 0, 0.0225, 0)])), 'steel', pinPos.map(p => ({ p, r: [PI / 2, 0, 0] }))));
      g10.add(inst(K.geo('cotter', () => new THREE.TorusGeometry(0.006, 0.0012, 6, 16)), 'steelDark', pinPos.map(p => ({ p: [p[0], p[1] + 0.02, p[2] - 0.026], r: [0, 0, 0] }))));
      const studPos = rackX.map((x, k) => [x, ry0 + 0.34, rz + (k % 2 ? 0.04 : 0.0)]);
      g9.add(inst(K.boltGeo(0.004, 0.06), 'steelDark', studPos.map(p => ({ p: [p[0], p[1] + 0.05, p[2]] }))));
      const nutP = []; studPos.forEach(p => { nutP.push([p[0], p[1] + 0.01, p[2]]); nutP.push([p[0], p[1] + 0.045, p[2]]); });
      g1.add(nuts(nutP, 0.0078, 'y'));
      const wP = []; studPos.forEach(p => { wP.push([p[0], p[1] + 0.028, p[2]]); wP.push([p[0], p[1] + 0.001, p[2]]); wP.push([p[0], p[1] - 0.0, p[2]]); });
      g8.add(washers(wP.slice(0, 12), 0.012, 'y'));
      // 6 patines cuchilla delantera ×2; 17 patines guía cremalleras ×4; 15 tornillos ST6.3x25 ×16 ; 16 arandelas Ø6 ×16
      const g6 = el(C, 6), g17 = el(C, 17), g15 = el(C, 15), g16 = el(C, 16);
      [-1, 1].forEach(s => g6.add(rbox(0.03, 0.4, 0.012, 0.003, 'uhmw', { pos: [s * 1.24, ry0, rz - 0.012] })));
      rackX.forEach((x, k) => g17.add(rbox(0.036, 0.09, 0.008, 0.002, 'uhmw', { pos: [x, ry0 + 0.1, rz + (k % 2 ? 0.024 : -0.03)] })));
      const fx = []; rackX.forEach((x, k) => { for (let i = 0; i < 4; i++) fx.push([x + (i % 2 ? 0.012 : -0.012), ry0 + 0.12 - Math.floor(i / 2) * 0.05, rz + (k % 2 ? 0.024 : -0.03) - 0.006]); });
      g15.add(bolts(fx, 0.0063, 0.025, 'nz')); g16.add(washers(fx.map(p => [p[0], p[1], p[2] - 0.002]), 0.0063, 'z'));
      explode(g7, 0, 0.3, 0.3); explode(g5, 0, 0.0, 0.5); explode(g3, 0.3, 0, 0.3);
    }

    /* =========================================================
     *  REPARTIDOR DE CUAJADA (26)
     * ========================================================= */
    {
      const C = 'repartidor', h = L.hopper, cx = (h.x0 + h.x1) / 2, cz = (h.z0 + h.z1) / 2, W = h.x1 - h.x0, D = h.z1 - h.z0, H = h.y1 - h.y0;
      const hp = new THREE.Group(); hp.name = 'repartidor:tolva'; hp.userData.comp = C; comps[C].add(hp);
      // tolva: paredes laterales y embudo
      const fr = K.frustum(W, D, W - 0.1, D * 0.5, H * 0.7, 'steel', { shell: true, pos: [cx, h.y0 + H * 0.35, cz] }); hp.add(fr);
      [[0, D / 2 - 0.003, W, 0.006, 'z'], [0, -D / 2 + 0.003, W, 0.006, 'z']].forEach(q => hp.add(box(W, H * 0.3, 0.006, 'steel', { pos: [cx, h.y0 + H * 0.85, cz + q[1]], shell: true })));
      [1, -1].forEach(s => hp.add(box(0.006, H * 0.3, D, 'steel', { pos: [cx + s * W / 2, h.y0 + H * 0.85, cz], shell: true })));
      // difusor (boca repartidora) bajo la tolva
      hp.add(rbox(W - 0.1, 0.04, D * 0.5 + 0.04, 0.005, 'steelDark', { pos: [cx, h.y0 - 0.012, cz] }));
      hp.add(rbox(W - 0.18, 0.05, 0.05, 0.006, 'steel', { pos: [cx, h.y0 - 0.05, cz] }));
      // reborde superior
      [[0, D / 2], [0, -D / 2]].forEach(q => hp.add(rbox(W + 0.04, 0.02, 0.03, 0.004, 'steelDark', { pos: [cx, h.y1 + 0.0, cz + q[1]] })));
      [1, -1].forEach(s => hp.add(rbox(0.03, 0.02, D + 0.03, 0.004, 'steelDark', { pos: [cx + s * (W / 2 + 0.0), h.y1, cz] })));
      // 26 malla de filtraje (chapa perforada con textura)
      const g26 = el(C, 26);
      const pf = K.canvasTex(256, 64, (c, w, hh) => { c.clearRect(0, 0, w, hh); c.fillStyle = '#c8ced4'; for (let i = 0; i < 24; i++) for (let j = 0; j < 6; j++) { c.beginPath(); c.arc(6 + i * 10.6, 6 + j * 10.6, 3.3, 0, TAU); c.fill(); } });
      const fm = new THREE.MeshStandardMaterial({ color: 0xdfe4e8, metalness: 0.9, roughness: 0.3, alphaMap: null });
      g26.add(rbox(W - 0.14, 0.006, D * 0.5 - 0.02, 0.002, fm, { pos: [cx, h.y0 + 0.055, cz] }));
      for (let i = 0; i < 20; i++) g26.add(box(0.006, 0.012, D * 0.5 - 0.02, 'steel', { pos: [cx - W / 2 + 0.12 + i * (W - 0.24) / 19, h.y0 + 0.062, cz], cast: false }));
      // 18 junta entre difusor y boca ; 17 junta racord SMS 3" ø76
      const g18 = el(C, 18); const j18 = K.frameGasket(W - 0.12, D * 0.5 + 0.02, 0.018, 0.006, 'epdm', { pos: [cx, h.y0 + 0.012, cz] }); j18.rotation.x = -PI / 2; g18.add(j18);
      // 21 bola fija CD-17C ×1 dentro de la tolva y 20 manguera NW25 con racords DIN 11851
      const g21 = el(C, 21), g20 = el(C, 20);
      const bl = new THREE.Mesh(K.sprayBall28, K.mat('steel')); bl.position.set(cx - 0.4, h.y1 - 0.03, cz); bl.rotation.x = PI; g21.add(bl);
      g20.add(hose([[cx - 0.4, h.y1 - 0.01, cz], [cx - 0.4, h.y1 + 0.12, cz + 0.02], [cx - 0.9, h.y1 + 0.16, cz + 0.12], [cx - 1.2, h.y1 + 0.03, cz + 0.28], [-1.42, 2.7, 0.18]], 0.0125, 'cableGray', { radial: 18 }));
      [-1.42, cx - 0.4].forEach(x => g20.add(lathe([[0.0, 0], [0.022, 0], [0.024, 0.01], [0.02, 0.026], [0.0, 0.026]], 'steel', { seg: 6, pos: [x, x < -1 ? 2.7 : h.y1 + 0.01, x < -1 ? 0.18 : cz] })));
      // válvula mariposa OD76 con maneta multiposición (6), actuador eléctrico Diteico (3), soporte (4), acoplamiento (5)
      const vx = 1.5, vy = 3.02, vz = cz + 0.08;
      const g6 = el(C, 6), g3 = el(C, 3), g4 = el(C, 4), g5 = el(C, 5), g17 = el(C, 17);
      const v = S.butterfly(76, 'multi'); v.rotation.y = PI / 2; v.position.set(vx, vy, vz); g6.add(v);
      g17.add(clamp(vx, vy, vz - 0.095, 'z', 0.038)); g17.add(clamp(vx, vy, vz + 0.095, 'z', 0.038));
      const pin = pipe([[vx, vy, vz + 0.1], [vx, vy, vz + 0.4], [vx, 2.86, vz + 0.4], [vx, 2.6, vz + 0.4]], 0.038, 'curd', { radial: 32, bend: 0.1 }); g17.add(pin);
      g4.add(rbox(0.14, 0.02, 0.09, 0.004, 'steelDark', { pos: [vx, vy + 0.16, vz] })); [-1, 1].forEach(s => g4.add(box(0.014, 0.16, 0.09, 'steelDark', { pos: [vx + s * 0.055, vy + 0.085, vz] })));
      g5.add(cyl(0.02, 0.02, 0.07, 'steel', { pos: [vx, vy + 0.13, vz], seg: 24 })); g5.add(cyl(0.028, 0.028, 0.012, 'steelDark', { pos: [vx, vy + 0.13, vz], seg: 6 }));
      g3.add(rbox(0.16, 0.2, 0.15, 0.02, 'white', { pos: [vx, vy + 0.29, vz], mat: { metalness: 0.2, roughness: 0.4 } }));
      g3.add(cyl(0.055, 0.055, 0.05, 'blueLight', { pos: [vx, vy + 0.415, vz], seg: 40 }));
      g3.add(cyl(0.03, 0.03, 0.03, 'black', { axis: 'x', pos: [vx + 0.1, vy + 0.29, vz], seg: 24 }));
      // 1, 2 mangueras flexibles con racors (de la tolva al colector)
      const g1 = el(C, 1), g2 = el(C, 2);
      g1.add(hose([[vx, 2.7, vz + 0.4], [vx - 0.18, 2.76, vz + 0.3], [vx - 0.3, 2.9, vz + 0.1], [h.x1 - 0.05, h.y1 - 0.15, cz + 0.05]], 0.028, 'cableGray', { radial: 24 }));
      g2.add(hose([[vx, vy - 0.1, vz - 0.3], [vx - 0.2, vy + 0.1, vz - 0.24], [h.x1 - 0.08, h.y1 - 0.05, cz - 0.03]], 0.028, 'cableGray', { radial: 24 }));
      [[vx, 2.7, vz + 0.4], [h.x1 - 0.05, h.y1 - 0.15, cz + 0.05], [vx, vy - 0.1, vz - 0.3], [h.x1 - 0.08, h.y1 - 0.05, cz - 0.03]].forEach(p => g1.add(cyl(0.032, 0.032, 0.028, 'steel', { pos: p, seg: 32 })));
      // puerta corredera superior: tapa, guías (8), patines (9,10), ruedas (15) con rodamientos (14) y distanciadores (16)
      const door = new THREE.Group(); door.position.set(cx, h.y1 + 0.03, cz); comps[C].add(door); door.name = 'repartidor:puerta'; door.userData.comp = C; K.repDoor = door;
      const g8 = el(C, 8), g9 = el(C, 9), g10 = el(C, 10), g15 = el(C, 15), g14 = el(C, 14), g16 = el(C, 16), g11 = el(C, 11), g7 = el(C, 7), g19 = el(C, 19), g22 = el(C, 22);
      door.add(rbox(1.35, 0.012, D + 0.06, 0.004, 'steel', { pos: [0.55, 0.0, 0], shell: true }));
      door.add(rbox(1.35, 0.03, 0.02, 0.004, 'steelDark', { pos: [0.55, 0.02, D / 2 + 0.03] }));
      [-1, 1].forEach(s => g8.add(rbox(W + 0.5, 0.035, 0.03, 0.005, 'steelDark', { pos: [cx + 0.2, h.y1 + 0.055, cz + s * (D / 2 + 0.05)] })));
      [-0.05, 1.15].forEach(xo => [-1, 1].forEach(s => { g9.add(rbox(0.06, 0.02, 0.028, 0.004, 'uhmw', { pos: [cx + xo, h.y1 + 0.036, cz + s * (D / 2 + 0.05)] })); }));
      [-0.05, 1.15].forEach(xo => [-1, 1].forEach(s => { g10.add(rbox(0.06, 0.02, 0.028, 0.004, 'uhmw', { pos: [cx + xo, h.y1 + 0.075, cz + s * (D / 2 + 0.05)] })); }));
      const wheelPos = [[-0.05, -1], [-0.05, 1], [1.15, -1], [1.15, 1]];
      wheelPos.forEach(q => {
        const w = cyl(0.026, 0.026, 0.02, 'poly', { axis: 'z', pos: [cx + q[0] + 0.0, h.y1 + 0.095, cz + q[1] * (D / 2 + 0.05)], seg: 32 }); g15.add(w);
        g16.add(cyl(0.011, 0.011, 0.02, 'steel', { axis: 'z', pos: [cx + q[0], h.y1 + 0.095, cz + q[1] * (D / 2 + 0.05 + 0.02)], seg: 20 }));
        [-1, 1].forEach(k => { const b = S.bearing(0.0235, 0.01, 0.014, 'blue'); b.position.set(cx + q[0], h.y1 + 0.095, cz + q[1] * (D / 2 + 0.05) + k * 0.013); g14.add(b); });
      });
      // 7 cilindro DGO-40 sin vástago: perfil largo con carro que arrastra la puerta
      g7.add(rbox(1.7, 0.06, 0.05, 0.008, 'anodized', { pos: [cx + 0.25, h.y1 + 0.13, cz - 0.0] }));
      g7.add(rbox(0.16, 0.075, 0.075, 0.008, 'steelDark', { pos: [cx + 0.28, h.y1 + 0.13, cz] }));
      [-1, 1].forEach(s => g7.add(rbox(0.05, 0.075, 0.075, 0.008, 'black', { pos: [cx + 0.25 + s * 0.85, h.y1 + 0.13, cz] })));
      g7.add(rbox(0.02, 0.02, D * 0.5, 0.003, 'steelDark', { pos: [cx + 0.28, h.y1 + 0.03, cz - D / 4 + 0.01] }));
      // 11 posicionador de presión GN722 en la puerta
      g11.add(cyl(0.011, 0.011, 0.04, 'steel', { pos: [cx + 0.9, h.y1 + 0.075, cz - 0.16], seg: 20 })); g11.add(sphere(0.011, 'black', { pos: [cx + 0.9, h.y1 + 0.1, cz - 0.16] }));
      // 19 bridas de apriete (4) sobre el reborde
      [[-0.75, 1], [0.75, 1], [-0.75, -1], [0.75, -1]].forEach(q => {
        const b = new THREE.Group(); b.position.set(cx + q[0], h.y1 + 0.01, cz + q[1] * (D / 2 + 0.02)); g19.add(b);
        b.add(rbox(0.05, 0.02, 0.03, 0.004, 'steel', { pos: [0, 0, 0] })); b.add(rbox(0.014, 0.05, 0.02, 0.003, 'black', { pos: [0, 0.03, 0] })); b.add(cyl(0.005, 0.005, 0.05, 'steel', { axis: 'z', pos: [0, 0.056, 0], seg: 10 }));
      });
      // 22 patines laterales / inferiores ×4
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(q => g22.add(rbox(0.05, 0.03, 0.012, 0.003, 'uhmw', { pos: [cx + q[0] * 0.6, h.y0 + 0.14, cz + q[1] * (D / 2 + 0.006)] })));
      // 12, 24, 25 tornillos; 13, 23 arandelas (brida perimetral de la tolva)
      const g12 = el(C, 12), g13 = el(C, 13), g23 = el(C, 23), g24 = el(C, 24), g25 = el(C, 25);
      const per = []; for (let i = 0; i < 24; i++) { per.push([cx - W / 2 + 0.06 + i * (W - 0.12) / 23, h.y0 - 0.0, cz + D / 4 + 0.04]); per.push([cx - W / 2 + 0.06 + i * (W - 0.12) / 23, h.y0 - 0.0, cz - D / 4 - 0.04]); }
      g23.add(washers(per, 0.008, 'y'));
      g24.add(bolts(per.filter((p, i) => i % 6 === 0).slice(0, 8).map(p => [p[0], p[1] - 0.026, p[2]]), 0.008, 0.07, 'y'));
      g25.add(bolts(per.filter((p, i) => i % 6 === 3).slice(0, 8).map(p => [p[0], p[1] - 0.038, p[2]]), 0.008, 0.02, 'y'));
      g12.add(bolts([[vx - 0.055, vy + 0.175, vz + 0.03], [vx + 0.055, vy + 0.175, vz - 0.03]], 0.008, 0.025, 'y'));
      g13.add(washers([[vx - 0.055, vy + 0.17, vz + 0.03], [vx + 0.055, vy + 0.17, vz - 0.03], [vx - 0.055, vy + 0.148, vz + 0.03], [vx + 0.055, vy + 0.148, vz - 0.03]], 0.008, 'y'));
      explode(hp, 0, 0.5, 0); explode(door, 0.6, 0.8, 0);
    }
  });
})();
