/* SISTEMA ELÉCTRICO (2/2): BOTONERA / HMI · DETECTORES DE CAMPO · TERMINALES, PILOTOS Y VARIOS */
(function () {
  'use strict';
  window.MODEL_BUILDERS.push(function (K) {
    const { THREE, PI, TAU, el, comps, box, rbox, cyl, torus, sphere, lathe, extrude, merge, tr, put, bolts, nuts, washers, line, grid, pipe, hose, clamp, inst, mat, mesh, explode, spin, geo, anim, state, canvasTex, label } = K;
    const L = K.L, S = K.parts, T = L.tall, SM = L.small, hp = L.hopper;
    const Tp = K.Tp, Sp = K.Sp;
    const hcx = (hp.x0 + hp.x1) / 2, hcz = (hp.z0 + hp.z1) / 2;

    // pulsador inox IP69K (eje en Z local, frente hacia +Z)
    function pushBtn(color, r) {
      r = r || 0.011; const g = new THREE.Group();
      g.add(cyl(r * 1.6, r * 1.6, 0.006, 'steel', { axis: 'z', pos: [0, 0, 0.003], seg: 32 }));
      g.add(cyl(r * 1.15, r * 1.15, 0.016, 'steelDark', { axis: 'z', pos: [0, 0, 0.012], seg: 32 }));
      g.add(cyl(r * 0.85, r * 0.85, 0.012, color, { axis: 'z', pos: [0, 0, 0.024], seg: 32, mat: { emissive: 0x111111 } }));
      g.add(cyl(r * 1.0, r * 1.0, 0.03, 'black', { axis: 'z', pos: [0, 0, -0.018], seg: 24 }));
      return g;
    }
    // paro de emergencia Ø60 con placa
    function eStop() {
      const g = new THREE.Group();
      g.add(cyl(0.03, 0.03, 0.002, 'yellow', { axis: 'z', pos: [0, 0, 0.001], seg: 48 }));
      g.add(cyl(0.017, 0.02, 0.028, 'red', { axis: 'z', pos: [0, 0, 0.016], seg: 40, mat: { roughness: 0.25 } }));
      g.add(cyl(0.022, 0.02, 0.008, 'red', { axis: 'z', pos: [0, 0, 0.034], seg: 40, mat: { roughness: 0.25 } }));
      g.add(cyl(0.017, 0.017, 0.03, 'black', { axis: 'z', pos: [0, 0, -0.016], seg: 24 }));
      return g;
    }
    // conector M12 recto/acodado con cable corto (a partir de p en dirección dir)
    function m12(g, p, dir, elbow, col) {
      const r = 0.0075, c = new THREE.Group(); c.position.set(p[0], p[1], p[2]); g.add(c);
      c.add(cyl(r * 1.6, r * 1.6, 0.03, 'steelDark', { pos: [0, 0.015, 0], seg: 20 })); c.add(cyl(r, r, 0.02, 'black', { pos: [0, 0.04, 0], seg: 16 }));
      c.add(hose([[0, 0.05, 0], [0.0, 0.09, 0.0], [dir ? dir[0] * 0.05 : 0.03, 0.14, dir ? dir[2] * 0.05 : 0.03], [dir ? dir[0] * 0.1 : 0.06, 0.05, dir ? dir[2] * 0.1 : 0.0]], 0.0033, col || 'cableGray', { radial: 8 }));
      return c;
    }
    const orient = (obj, dirName) => { if (dirName === '+z') obj.rotation.x = PI / 2; else if (dirName === '-z') obj.rotation.x = -PI / 2; else if (dirName === '+x') obj.rotation.z = -PI / 2; else if (dirName === '-x') obj.rotation.z = PI / 2; return obj; };

    /* =========================================================
     *  BOTONERA / HMI (23)
     * ========================================================= */
    {
      const C = 'botonera', eg = {}; for (let i = 1; i <= 23; i++) eg[i] = el(C, i);
      const bx = 0.6, bz = 0.66, by = L.deckY + 1.0;
      // poste sobre la plataforma
      const post = new THREE.Group(); post.name = 'botonera:poste'; post.userData.comp = C; comps[C].add(post);
      post.add(rbox(0.06, 1.0, 0.06, 0.006, 'brushed', { pos: [bx, L.deckY + 0.5, bz - 0.06] })); post.add(rbox(0.16, 0.012, 0.16, 0.003, 'brushed', { pos: [bx, L.deckY + 0.006, bz - 0.06] }));
      // 1 botonera inox 4 pulsadores 90x280x90 IP66
      const bw = 0.09, bh = 0.28, bd = 0.09;
      eg[1].add(rbox(bw, bh, bd, 0.006, 'steel', { pos: [bx, by, bz], shell: true, mat: { roughness: 0.18 } }));
      eg[1].add(box(bw * 0.7, 0.002, bd * 0.7, 'steelDark', { pos: [bx, by + bh / 2 + 0.001, bz], cast: false }));
      // 2 prensaestopas M25 inferior
      eg[2].add(cyl(0.017, 0.017, 0.022, 'black', { pos: [bx, by - bh / 2 - 0.011, bz], seg: 24 })); eg[2].add(cyl(0.012, 0.012, 0.03, 'black', { pos: [bx, by - bh / 2 - 0.037, bz], seg: 20 }));
      // 3 amarillo/blanco ×2 ; 5 verde/azul ×2 ; 6 rojo/verde (uno, en la tapa lateral) ; 15,16,17,18 paro de emergencia (en puertas de armarios)
      [[0.09, 'yellow'], [0.03, 'white']].forEach(q => { const b = pushBtn(q[1] === 'white' ? 'white' : 'yellow'); b.position.set(bx, by + q[0], bz + bd / 2); eg[3].add(b); });
      [[-0.03, 'green'], [-0.09, 'blueLight']].forEach(q => { const b = pushBtn(q[1]); b.position.set(bx, by + q[0], bz + bd / 2); eg[5].add(b); });
      const b6 = pushBtn('red'); b6.rotation.y = PI / 2; b6.position.set(bx + bw / 2, by + 0.115, bz); eg[6].add(b6); eg[6].add(cyl(0.006, 0.006, 0.006, 'green', { axis: 'x', pos: [bx + bw / 2 + 0.03, by + 0.115, bz], seg: 10, mat: { emissive: 0x0b3a1a } }));
      // 4 cables M12x5 acodados negros ×5 (conectados a la botonera / dispositivos)
      for (let i = 0; i < 5; i++) { const c = m12(eg[4], [bx - 0.02 + i * 0.01, by - bh / 2 - 0.06 - i * 0.002, bz + 0.0], [0.4, 0, 0.4], true, 'cable'); c.rotation.z = 0; }
      // 19-23 bornes en el interior de la botonera
      const inside = Tp(0, 0, 0);
      [[19, 'green', 0.008, 0.03], [22, 'gray', 0.007, 0.03]].forEach((q, i) => eg[q[0]].add(rbox(q[2], 0.04, 0.03, 0.002, q[1], { pos: [bx - 0.02 + i * 0.012, by - 0.09, bz - 0.01] })));
      eg[20].add(box(0.001, 0.038, 0.028, 'green', { pos: [bx - 0.0155, by - 0.09, bz - 0.01], cast: false })); eg[23].add(box(0.001, 0.038, 0.028, 'gray', { pos: [bx - 0.001, by - 0.09, bz - 0.01], cast: false }));
      eg[21].add(box(0.006, 0.036, 0.024, 'lightGray', { pos: [bx + 0.012, by - 0.09, bz - 0.01] }));
      // 7-11 baliza multicolor sobre la torre (techo, frente derecho)
      const zx = 1.45, zy = L.roofY + 0.036, zz = 0.22;
      eg[11].add(cyl(0.032, 0.036, 0.024, 'black', { pos: [zx, zy + 0.012, zz], seg: 32 })); eg[11].add(cyl(0.008, 0.008, 0.08, 'steelDark', { pos: [zx, zy + 0.04, zz], seg: 12 })); eg[11].add(cyl(0.02, 0.02, 0.05, 'steel', { pos: [zx, zy + 0.048, zz], seg: 24 }));
      const mod = (id, m, y, em) => eg[id].add(cyl(0.034, 0.034, 0.05, m, { pos: [zx, zy + y, zz], seg: 40, mat: { emissive: em, transparent: true, opacity: 0.92, roughness: 0.15 } }));
      mod(9, 'green', 0.092, 0x0a5a24); mod(8, 'blueLight', 0.145, 0x0a2a6a); mod(10, 'red', 0.198, 0x6a0a0a);
      eg[7].add(cyl(0.034, 0.034, 0.05, 'black', { pos: [zx, zy + 0.251, zz], seg: 40 })); for (let i = 0; i < 12; i++) eg[7].add(box(0.006, 0.004, 0.004, 'steelDark', { pos: [zx + Math.cos(i * TAU / 12) * 0.03, zy + 0.251 + (i % 3 - 1) * 0.012, zz + Math.sin(i * TAU / 12) * 0.03], cast: false })); eg[7].add(cyl(0.02, 0.02, 0.004, 'steelDark', { pos: [zx, zy + 0.278, zz], seg: 24 }));
      K.beacon = { g: eg[9], b: eg[8], r: eg[10] };
      // 12 pantalla táctil 10" en la puerta del armario pequeño (gira con la puerta)
      const ps = K.doors.small.pivot, hx = -SM.w / 2 + 0.03, h12 = K.attach(C, 12, ps);
      h12.add(rbox(0.29, 0.22, 0.02, 0.006, 'abLight', { pos: [hx, 0.025, 0.02], mat: { color: 0x2a2f36 } }));
      const cvs = document.createElement('canvas'); cvs.width = 640; cvs.height = 400; const tex = new THREE.CanvasTexture(cvs); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8;
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.156), new THREE.MeshBasicMaterial({ map: tex })); scr.position.set(hx, 0.025, 0.0316); h12.add(scr);
      K.hmi = { cv: cvs, ctx: cvs.getContext('2d'), tex, last: -1 };
      h12.add(label('PanelView 800', 0.05, 0.01, { bg: '#2a2f36', fs: 26, pos: [hx, -0.076, 0.031] }));
      // 15-18 paro de emergencia ×2 (uno en cada puerta): PE + fijación frontal + contacto NC + placa
      [[ps, [-0.06, -0.14]], [K.doors.tall.pivot, [-0.14, 0.62]]].forEach(([piv, p]) => {
        const a = K.attach(C, 15, piv), b = K.attach(C, 16, piv), c = K.attach(C, 17, piv), d = K.attach(C, 18, piv);
        const e = eStop(); e.position.set(p[0], p[1], 0.012); a.add(e);
        b.add(cyl(0.016, 0.016, 0.006, 'black', { axis: 'z', pos: [p[0], p[1], 0.004], seg: 24 }));
        c.add(rbox(0.022, 0.03, 0.02, 0.003, 'green', { pos: [p[0], p[1], -0.022] }));
        d.add(cyl(0.03, 0.03, 0.002, 'yellow', { axis: 'z', pos: [p[0], p[1], 0.0075], seg: 48 }));
      });
      // 13-14 coupler RJ45 y latiguillo desde la pantalla
      K.attach(C, 13, ps).add(rbox(0.03, 0.014, 0.018, 0.003, 'black', { pos: [hx + 0.14, 0.0, -0.012] }));
      K.attach(C, 14, ps).add(hose([[hx + 0.14, 0.0, -0.02], [hx + 0.2, -0.06, -0.05], [hx + 0.3, -0.09, -0.06]], 0.0035, 'cableBlue', { radial: 8 }));
      // dibujo de la pantalla
      K.drawHmi = function (t) {
        const c = K.hmi.ctx, W = 640, H = 400, run = state.running && !state.estop;
        c.fillStyle = '#d7e2f2'; c.fillRect(0, 0, W, H);
        c.fillStyle = state.estop ? '#c22' : '#173f9b'; c.fillRect(0, 0, W, 40); c.fillStyle = '#fff'; c.font = 'bold 24px sans-serif'; c.textAlign = 'left';
        c.fillText(state.estop ? 'PARO DE EMERGENCIA' : 'MOLDEADORA MULTIFORMATO · PROCESO', 14, 28);
        c.fillStyle = '#12233f'; c.font = 'bold 20px sans-serif';
        c.fillText('Modo: ' + (run ? 'AUTOMÁTICO' : 'MANUAL'), 16, 78); c.fillText('Receta: T-5 10TPL-D', 16, 106);
        c.fillText('Altura porta-conformadores: ' + (K.carrier ? ((K.carrier.position.y - 1.0) * 1000).toFixed(0) : 0) + ' mm', 16, 134);
        c.fillText('Cadena de moldes: ' + (run ? '37 rpm' : '0 rpm'), 16, 162); c.fillText('Cuchilla superior: ' + (run ? 'CICLO' : 'REPOSO'), 16, 190);
        c.fillStyle = '#fff'; c.fillRect(440, 60, 180, 130); c.strokeStyle = '#9bb0d0'; c.strokeRect(440, 60, 180, 130);
        c.fillStyle = '#1f4fa3'; c.fillRect(455, 150, 150, 20); for (let i = 0; i < 6; i++) { c.fillStyle = run && ((i + Math.floor(t * 3)) % 3 === 0) ? '#2e9f4b' : '#6c86b5'; c.fillRect(458 + i * 24, 110 + (run ? Math.sin(t * 3 + i) * 6 : 0), 20, 36); }
        ['MENÚ', 'RECETAS', 'ALARMAS', 'MANTTO.'].forEach((l, i) => { c.fillStyle = '#e8eefb'; c.fillRect(16 + i * 152, 330, 142, 52); c.strokeStyle = '#7a8aa6'; c.strokeRect(16 + i * 152, 330, 142, 52); c.fillStyle = '#12233f'; c.font = 'bold 18px sans-serif'; c.textAlign = 'center'; c.fillText(l, 87 + i * 152, 362); });
        c.textAlign = 'left'; c.fillStyle = run ? '#1a9a3f' : '#999'; c.beginPath(); c.arc(600, 230, 14, 0, 7); c.fill(); c.fillStyle = '#12233f'; c.font = '16px sans-serif'; c.fillText('Presión aire: 6.0 bar', 16, 250); c.fillText('Nivel tolva: ' + (run ? '78 %' : '0 %'), 16, 274);
        K.hmi.tex.needsUpdate = true;
      };
      K.drawHmi(0);
      anim.push(function (dt, st) {
        const b = Math.floor(st.t * 3); if (b !== K.hmi.last) { K.hmi.last = b; K.drawHmi(st.t); }
        const run = st.running && !st.estop, blink = (Math.floor(st.t * 2) % 2) === 0;
        K.beacon.g.children.forEach(m => m.material = m.material); // mantiene materiales; el brillo lo maneja la app
        K.beaconState = st.estop ? 'r' : run ? 'g' : 'b';
      });
      explode(eg[1], 0, 0.1, 0.6);
    }

    /* =========================================================
     *  DETECTORES DE CAMPO (33)
     * ========================================================= */
    let pneuBoard = null;
    {
      const C = 'detectores', eg = {}; for (let i = 1; i <= 33; i++) eg[i] = el(C, i);
      const connPts = [];
      const cn = (p, dir) => { connPts.push([p, dir]); };
      // 1 LMT100 ×2 en la pared frontal de la tolva; 33 sonda de nivel; 15 conductivímetro; 19 transmisor de temperatura
      [hp.y0 + 0.17, hp.y0 + 0.34].forEach(y => { const s = S.sensor(24, 0.09, 'steel', { face: 'white' }); orient(s, '+z'); s.position.set(hcx + 0.85, y, hp.z1 + 0.004); eg[1].add(s); eg[1].add(cyl(0.02, 0.02, 0.012, 'steel', { axis: 'z', pos: [hcx + 0.85, y, hp.z1 + 0.012], seg: 6 })); cn([hcx + 0.85, y, hp.z1 + 0.1], [0, 0, 1]); });
      // 33 sonda de nivel 1" con conector M12
      const sn = new THREE.Group(); sn.position.set(hcx - 0.1, hp.y1 + 0.04, hcz + 0.06); eg[33].add(sn);
      sn.add(cyl(0.012, 0.012, 0.36, 'steel', { pos: [0, -0.16, 0], seg: 20 })); sn.add(cyl(0.02, 0.02, 0.024, 'steelDark', { pos: [0, 0.02, 0], seg: 6 })); sn.add(cyl(0.016, 0.016, 0.05, 'black', { pos: [0, 0.055, 0], seg: 20 })); sn.add(cyl(0.006, 0.006, 0.03, 'steelDark', { pos: [0.02, 0.06, 0], seg: 10, rot: [0, 0, PI / 2] }));
      // 15 conductivímetro LDL200 y 19 TA2512 en la línea de cuajada (salida del intercambiador)
      [[15, 2.12, 0.08], [19, 2.4, 0.05]].forEach(([id, y, h]) => {
        const g = eg[id]; g.add(cyl(0.028, 0.028, h, 'steel', { pos: [L.hx.x, y, L.hx.z], seg: 32 })); g.add(rbox(0.05, 0.05, 0.07, 0.008, 'anodized', { pos: [L.hx.x + 0.045, y, L.hx.z] }));
        g.add(cyl(0.012, 0.012, 0.03, 'black', { axis: 'x', pos: [L.hx.x + 0.09, y, L.hx.z], seg: 16 })); g.add(box(0.03, 0.012, 0.002, 'black', { pos: [L.hx.x + 0.045, y + 0.012, L.hx.z + 0.036], cast: false }));
        cn([L.hx.x + 0.11, y, L.hx.z], [1, 0, 0]);
      });
      // 3 IGS290 ×7 (M18 inductivos) + 4 arandelas M18 ×9 + 12 conector macho M12x5 ×2 + 13 prensaestopas ×2 + 11 IGT208 ×2
      const igs = [
        [[-1.75, 0.8, 0.4], '+z'], [[1.46, 0.8, 0.4], '+z'], [[1.09, 0.5, 0.6], '-z'], [[1.09, 1.15, 0.6], '-z'],
        [[1.41, 2.16, 0.1], '-x'], [[1.41, 2.6, 0.1], '-x'], [[hcx + 1.32, hp.y1 + 0.06, hcz + 0.0], '-x']
      ];
      const wp = [];
      igs.forEach(([p, d]) => { const s = S.sensor(18, 0.06, 'steel', { face: 'black' }); orient(s, d); s.position.set(p[0], p[1], p[2]); eg[3].add(s); wp.push([p[0], p[1], p[2]]); cn([p[0] + (d === '+x' ? 0.08 : d === '-x' ? 0.08 : 0), p[1], p[2] + (d === '+z' ? 0.08 : d === '-z' ? -0.08 : 0)], [0, 0, d === '-z' ? -1 : 1]); });
      const wsh = wp.map((p, i) => [p[0] + (i < 2 ? 0.0 : 0.0), p[1] + 0.0, p[2] + (i < 2 ? 0.02 : 0.0)]).slice(0, 7); eg[4].add(inst(geo('wsh18', () => new THREE.CylinderGeometry(0.02, 0.02, 0.003, 32).rotateX(PI / 2)), 'steel', wsh.concat([[1.75, 2.16, 0.1], [1.75, 2.6, 0.1]]).slice(0, 9).map(p => ({ p }))));
      [[-1.32, hp.y1 + 0.1, hcz - 0.18, '+z'], [1.35, ky() , 0.0, '-x']].forEach(([x, y, z, d]) => { const s = S.sensor(18, 0.04, 'steel', { face: 'black' }); orient(s, d); s.position.set(x, y, z); eg[11].add(s); cn([x, y + 0.1, z], [0, 0, 1]); });
      function ky() { return hp.y0 - 0.02; }
      [[-1.32, hp.y1 + 0.16, hcz - 0.18], [1.42, ky() + 0.05, 0.1]].forEach((p, i) => { const c = m12(eg[12], p, null, false, 'cable'); eg[13].add(cyl(0.008, 0.008, 0.02, 'steel', { pos: [p[0], p[1] - 0.02, p[2]], seg: 6 })); });
      // 6 fotocélulas Leuze HRTR 55 ×3 en el transportador, con cruceta (7) y soporte (8)
      [-2.5, -2.95, -3.4].forEach((x, i) => {
        const y0 = 0.96;
        eg[8].add(rbox(0.02, 0.1, 0.03, 0.003, 'steelDark', { pos: [x, y0 - 0.05, 0.25] })); eg[7].add(rbox(0.04, 0.02, 0.05, 0.003, 'steel', { pos: [x, y0 - 0.005, 0.24] }));
        const s = S.sensor(18, 0.05, 'steel', { face: 'red', led: 'red' }); orient(s, '-z'); s.position.set(x, y0, 0.22); eg[6].add(s); eg[6].add(box(0.03, 0.026, 0.02, 'black', { pos: [x, y0, 0.27] })); cn([x, y0 + 0.02, 0.29], [0, 0, 1]);
      });
      // 9 detectores magnéticos MK5111 ×4 (2 en cilindro de manivela con brida Ø63 [14], 2 en cilindro de corte con brida Festo [10])
      const B = [2.14, 0.62], Q = [2.22, 1.15], dv = new THREE.Vector3(Q[0] - B[0], Q[1] - B[1], 0).normalize(), nz = new THREE.Vector3(-dv.y, dv.x, 0);
      [0.23, 0.33].forEach(d => {
        const p = new THREE.Vector3(B[0], B[1], 0).addScaledVector(dv, d), s = new THREE.Group(); s.position.set(p.x, p.y, 0.045); s.rotation.z = Math.atan2(dv.y, dv.x) - PI / 2; eg[9].add(s);
        s.add(rbox(0.055, 0.016, 0.016, 0.003, 'black', { pos: [0, 0, 0] })); s.add(cyl(0.004, 0.004, 0.02, 'yellow', { pos: [0, 0.01, 0], seg: 8, mat: { emissive: 0x554400 } })); cn([p.x, p.y, 0.09], [0, 0, 1]);
        const br = new THREE.Group(); br.position.set(p.x, p.y, 0.0); br.rotation.z = Math.atan2(dv.y, dv.x) - PI / 2; eg[14].add(br); br.add(torus(0.034, 0.005, 'steel', { seg: 40 }));
      });
      [0.05, -0.05].forEach(dz => { const s = rbox(0.05, 0.014, 0.014, 0.003, 'black', { pos: [1.52 + 0.056, 2.855 + 0.055, 0.11 + dz] }); s.rotation.x = 0; eg[9].add(s); eg[10].add(rbox(0.03, 0.02, 0.024, 0.003, 'steelDark', { pos: [1.52 + 0.052, 2.855 + 0.052, 0.11 + dz] })); cn([1.52 + 0.06, 2.87 + 0.055, 0.11 + dz], [0, 0, 1]); });
      // 18 MN503S detector + imán ×6 : 2 en la puerta corredera, 4 en las guías del cassette
      [[hcx - 0.55, hp.y1 + 0.13, hcz + 0.06], [hcx + 1.15, hp.y1 + 0.13, hcz + 0.06]].concat([[-1.3, 2.05, -0.3], [-1.3, 2.62, -0.3], [1.3, 2.05, -0.3], [1.3, 2.62, -0.3]]).forEach((p, i) => {
        const s = rbox(0.06, 0.02, 0.02, 0.004, 'black', { pos: p }); eg[18].add(s); eg[18].add(rbox(0.014, 0.014, 0.014, 0.002, 'red', { pos: [p[0] + 0.05, p[1], p[2]] })); cn([p[0], p[1] + 0.04, p[2]], [0, 0, 1]);
      });
      // 16 encoder absoluto IHA608 Ø58 eje hueco ; 17 conector Ethernet M12x4
      const enc = new THREE.Group(); enc.position.set(0.55, 0.5, -0.55); eg[16].add(enc);
      enc.add(cyl(0.029, 0.029, 0.06, 'anodized', { axis: 'x', seg: 40 })); enc.add(cyl(0.031, 0.031, 0.01, 'black', { axis: 'x', pos: [0.035, 0, 0], seg: 40 })); enc.add(rbox(0.03, 0.03, 0.03, 0.004, 'black', { pos: [0, 0.035, 0] })); enc.add(rbox(0.02, 0.03, 0.03, 0.003, 'steelDark', { pos: [-0.02, -0.04, 0.0] }));
      const c17 = m12(eg[17], [0.55, 0.535, -0.55], [0.3, 0, 0.3], false, 'cableBlue');
      // ---- neumática de campo (panel izquierdo de la torre, cara -X) ----
      pneuBoard = new THREE.Group(); pneuBoard.name = 'detectores:panelNeumatico'; pneuBoard.userData.comp = C; comps[C].add(pneuBoard);
      const X0 = -1.86, ZB = -0.3, YB = 2.42;
      pneuBoard.add(rbox(0.02, 0.86, 0.66, 0.004, 'panelDark', { pos: [X0 + 0.02, YB, ZB] }));
      const at = (dz, y, dx) => [X0 - 0.005 + (dx || 0), y, ZB + dz];
      // 20 filtro regulador SMC AC40 con presostato y purga
      const f = at(-0.2, YB + 0.2, -0.05);
      eg[20].add(rbox(0.09, 0.14, 0.1, 0.01, 'blue', { pos: [f[0], f[1], f[2]] })); eg[20].add(cyl(0.048, 0.048, 0.12, 'glass', { pos: [f[0], f[1] - 0.14, f[2]], seg: 32 })); eg[20].add(cyl(0.055, 0.055, 0.016, 'black', { pos: [f[0], f[1] - 0.075, f[2]], seg: 32 })); eg[20].add(cyl(0.034, 0.034, 0.03, 'black', { pos: [f[0], f[1] + 0.085, f[2]], seg: 32 })); eg[20].add(rbox(0.03, 0.05, 0.05, 0.005, 'gray', { pos: [f[0] - 0.05, f[1] + 0.02, f[2] + 0.06] })); eg[20].add(cyl(0.008, 0.008, 0.03, 'steelDark', { pos: [f[0], f[1] - 0.22, f[2]], seg: 12 }));
      eg[22].add(rbox(0.03, 0.14, 0.14, 0.004, 'steel', { pos: [X0 - 0.005, f[1] - 0.05, f[2]] }));
      [-1, 1].forEach(s => eg[21].add(cyl(0.012, 0.012, 0.04, 'steelDark', { axis: 'z', pos: [f[0], f[1] + 0.0, f[2] + s * 0.075], seg: 6 })));
      // 30 EV 1/2" 24VDC pilotaje externo + 32 cable DIN + 31 codo
      const e = at(0.0, YB + 0.22, -0.05);
      eg[30].add(rbox(0.07, 0.07, 0.11, 0.008, 'black', { pos: [e[0], e[1], e[2]] })); eg[30].add(cyl(0.03, 0.03, 0.03, 'blueLight', { axis: 'x', pos: [e[0] - 0.05, e[1], e[2]], seg: 32 })); eg[30].add(rbox(0.05, 0.02, 0.05, 0.004, 'steelDark', { pos: [e[0], e[1] + 0.045, e[2]] }));
      eg[31].add(cyl(0.011, 0.011, 0.04, 'steelDark', { pos: [e[0], e[1] - 0.06, e[2]], seg: 16 })); eg[31].add(sphere(0.013, 'steelDark', { pos: [e[0], e[1] - 0.085, e[2]] })); eg[31].add(cyl(0.011, 0.011, 0.04, 'steelDark', { axis: 'x', pos: [e[0] - 0.02, e[1] - 0.085, e[2]], seg: 16 }));
      eg[32].add(cyl(0.013, 0.013, 0.03, 'black', { pos: [e[0], e[1] + 0.07, e[2]], seg: 20 })); eg[32].add(hose([[e[0], e[1] + 0.085, e[2]], [e[0] - 0.08, e[1] + 0.13, e[2] + 0.06], [e[0] - 0.1, e[1] + 0.3, e[2] + 0.18]], 0.004, 'cable', { radial: 8 }));
      // 23 regulador de caudal 1/4" ×2, 29 reg. caudal 3/8" ×2, 24 reducción M-H ×4, 25 escape rápido ×4, 26 reducción enchufable ×4, 27 machón 3/8 ×2, 28 racord codo ×2
      for (let i = 0; i < 4; i++) {
        const z = -0.24 + i * 0.16, y = YB - 0.2, p = at(z, y, -0.03);
        const big = i < 2;
        const rg = new THREE.Group(); rg.position.set(p[0], p[1], p[2]); (big ? eg[29] : eg[23]).add(rg);
        rg.add(cyl(big ? 0.014 : 0.011, big ? 0.014 : 0.011, 0.06, 'steel', { pos: [0, 0, 0], seg: 20 })); rg.add(cyl(0.02, 0.02, 0.03, 'black', { pos: [0, 0.045, 0], seg: 24 })); rg.add(rbox(0.024, 0.02, 0.024, 0.003, 'blueLight', { pos: [0, -0.02, 0] }));
        const ex = new THREE.Group(); ex.position.set(p[0], p[1] - 0.09, p[2]); eg[25].add(ex); ex.add(rbox(0.04, 0.05, 0.04, 0.006, 'steel', { pos: [0, 0, 0] })); ex.add(cyl(0.012, 0.012, 0.03, 'steelDark', { pos: [0, -0.04, 0], seg: 12 }));
        eg[24].add(cyl(0.011, 0.011, 0.024, 'steelDark', { pos: [p[0], p[1] - 0.05 - 0.0, p[2]], seg: 6 })); eg[26].add(cyl(0.014, 0.014, 0.024, 'black', { pos: [p[0], p[1] - 0.14, p[2]], seg: 20 }));
        if (i < 2) { eg[27].add(cyl(0.013, 0.013, 0.03, 'steel', { pos: [p[0], p[1] + 0.075, p[2]], seg: 6 })); eg[28].add(cyl(0.012, 0.012, 0.04, 'steel', { pos: [p[0], p[1] + 0.1, p[2]], seg: 16 })); eg[28].add(sphere(0.014, 'steel', { pos: [p[0], p[1] + 0.12, p[2]] })); }
        pneuBoard.add(hose([[p[0], p[1] - 0.16, p[2]], [p[0] - 0.05, p[1] - 0.22, p[2]], [p[0] - 0.05, p[1] - 0.33, p[2] + 0.02]], 0.005, 'cableBlue', { radial: 10 }));
      }
      // cables M12x4 rectos IP69K ×25 y acodados ×4 en cada dispositivo (2, 5)
      const straight = [], elbow = [];
      connPts.forEach((c, i) => { (i % 7 === 3 ? elbow : straight).push(c); });
      let k = 0; connPts.forEach((c, i) => { const g = (i >= connPts.length - 4) ? eg[5] : eg[2]; const q = m12(g, c[0], c[1], false, 'cableGray'); q.rotation.y = i; });
      // completar hasta 25 rectos: conectores adicionales sobre el panel neumático y armarios
      const missing = Math.max(0, 25 - (connPts.length - 4));
      for (let i = 0; i < missing; i++) m12(eg[2], [X0 - 0.02, YB - 0.38 + (i % 5) * 0.05, ZB - 0.3 + Math.floor(i / 5) * 0.07], [0, 0, 0.3], false, 'cableGray');
      K.pneuBoard = pneuBoard; K.pneuBoardPos = { X0, ZB, YB };
      explode(pneuBoard, -0.5, 0, 0);
    }

    /* =========================================================
     *  TERMINALES, PILOTOS Y VARIOS (37)
     * ========================================================= */
    {
      const C = 'terminales', eg = {}; for (let i = 1; i <= 37; i++) eg[i] = el(C, i);
      const { X0, ZB, YB } = K.pneuBoardPos;
      // 3 terminal de válvulas neumáticas Festo MPA-S Ethernet/IP (8 posiciones) ; 1 silenciador SFE 1/2"
      const tx = X0 - 0.0, tz = ZB + 0.18, ty = YB + 0.05;
      eg[3].add(rbox(0.06, 0.09, 0.32, 0.006, 'black', { pos: [tx - 0.03, ty, tz] })); for (let i = 0; i < 8; i++) { eg[3].add(rbox(0.05, 0.05, 0.034, 0.004, 'steelDark', { pos: [tx - 0.075, ty + 0.0, tz - 0.13 + i * 0.037] })); eg[3].add(box(0.004, 0.006, 0.006, 'yellow', { pos: [tx - 0.102, ty + 0.02, tz - 0.13 + i * 0.037], cast: false, mat: { emissive: 0x554400 } })); }
      eg[3].add(rbox(0.07, 0.1, 0.05, 0.008, 'blueLight', { pos: [tx - 0.03, ty, tz + 0.185] })); eg[3].add(cyl(0.009, 0.009, 0.03, 'steelDark', { axis: 'x', pos: [tx - 0.055, ty, tz + 0.185], seg: 12 }));
      for (let i = 0; i < 4; i++) pneuBoard.add(hose([[tx - 0.1, ty - 0.02, tz - 0.13 + i * 0.075], [tx - 0.16, ty - 0.1 - i * 0.02, tz - 0.13 + i * 0.075], [tx - 0.2, ty - 0.2, tz - 0.4 + i * 0.05]], 0.005, 'cableBlue', { radial: 10 }));
      eg[1].add(cyl(0.02, 0.02, 0.08, 'brass', { axis: 'x', pos: [tx - 0.1, ty - 0.08, tz - 0.16], seg: 24 })); eg[1].add(cyl(0.012, 0.012, 0.03, 'brass', { axis: 'x', pos: [tx - 0.15, ty - 0.08, tz - 0.16], seg: 16 }));
      // 2 termostato interior del cuadro (NO), 4 filtro controladora servo 2198-DBR20-F: dentro del armario alto
      const pt = Tp(0.24, 0.26, 0); K.elemDoor['terminales:2'] = 'tall'; K.elemDoor['terminales:4'] = 'tall';
      K.block(eg[2], 0.045, 0.05, 0.04, [pt[0], pt[1], pt[2] + 0.022], 'red'); eg[2].add(cyl(0.01, 0.01, 0.006, 'black', { axis: 'z', pos: [pt[0], pt[1], pt[2] + 0.046], seg: 16 }));
      const pf = Tp(0.19, -0.13, 0); K.block(eg[4], 0.06, 0.2, 0.1, [pf[0], pf[1], pf[2] + 0.05], 'gray'); eg[4].add(box(0.05, 0.03, 0.004, 'black', { pos: [pf[0], pf[1] + 0.06, pf[2] + 0.101], cast: false }));
      // 5 pulsador amarillo/blanco + 7 paro + 8 fijación + 9 NC + 10 placa: estación local a la salida del transportador; 6 cable M12x5
      const sx = -2.3, sz = 0.32, sy = 1.28;
      const st = new THREE.Group(); st.name = 'terminales:estacion'; st.userData.comp = C; comps[C].add(st);
      st.add(rbox(0.05, 1.2, 0.05, 0.006, 'brushed', { pos: [sx, 0.6, sz - 0.05] })); st.add(rbox(0.16, 0.01, 0.16, 0.003, 'brushed', { pos: [sx, 0.005, sz - 0.05] }));
      st.add(rbox(0.09, 0.14, 0.08, 0.006, 'steel', { pos: [sx, sy, sz], mat: { roughness: 0.2 } }));
      const b5 = pushBtn('yellow'); b5.position.set(sx, sy + 0.035, sz + 0.04); eg[5].add(b5);
      const e7 = eStop(); e7.position.set(sx, sy - 0.03, sz + 0.04); eg[7].add(e7); eg[8].add(cyl(0.016, 0.016, 0.006, 'black', { axis: 'z', pos: [sx, sy - 0.03, sz + 0.042], seg: 24 })); eg[9].add(rbox(0.022, 0.03, 0.02, 0.003, 'green', { pos: [sx, sy - 0.03, sz + 0.0], mat: {} })); eg[10].add(cyl(0.03, 0.03, 0.002, 'yellow', { axis: 'z', pos: [sx, sy - 0.03, sz + 0.0405], seg: 48 }));
      m12(eg[6], [sx, sy - 0.07, sz], [0.3, 0, 0.3], true, 'cable');
      // 111.. cables: 11 (×2, 4G1.5 apantalladas): bomba y motorreductor de banda ; 12 (4G2.5): acometida ; 13 Kinetix 7 m ; 14 18G1 ; 15 18G0.5 ; 16 4x0.34 ; 17 3G1
      const bt = [T.x, 0.03, T.z + 0.16];
      const R = (g, pts, r, m) => g.add(hose(pts, r, m || 'cable', { radial: 12, tension: 0.4 }));
      // canal de piso para los cables (bandeja)
      const tray = new THREE.Group(); tray.name = 'terminales:bandeja'; tray.userData.comp = C; comps[C].add(tray); tray.add(rbox(4.0, 0.02, 0.1, 0.004, 'steelDark', { pos: [0.85, 0.02, 1.26] }));
      [-1, 1].forEach(s => tray.add(rbox(4.0, 0.045, 0.006, 0.002, 'steelDark', { pos: [0.85, 0.045, 1.26 + s * 0.05] })));
      R(eg[11], [[T.x - 0.1, 0.06, T.z + 0.05], [T.x - 0.1, 0.05, 1.22], [1.0, 0.045, 1.26], [2.3, 0.045, 1.26], [2.85, 0.05, 1.1], [2.85, 0.3, 0.9], [2.85, 0.5, 0.86]], 0.011);
      R(eg[11], [[T.x - 0.05, 0.06, T.z + 0.06], [T.x - 0.05, 0.05, 1.22], [1.2, 0.045, 1.26], [1.58, 0.045, 1.1], [1.58, 0.3, 0.88], [1.6, 0.5, 0.62], [1.6, 0.62, 0.58]], 0.011);
      R(eg[12], [[-1.2, 0.02, 1.3], [-0.95, 0.045, 1.26], [-0.8, 0.04, 1.2], [-0.72, 0.07, T.z - 0.05], [-0.7, 0.08, T.z - 0.09]], 0.014);
      R(eg[13], [[T.x + 0.0, 0.06, T.z + 0.05], [T.x + 0.0, 0.05, 1.2], [0.2, 0.045, 1.26], [0.0, 0.05, 0.9], [0.0, 0.45, 0.6], [0.0, 0.6, 0.0], [0.03, 0.72, -0.48]], 0.0085, 'cableGray');
      R(eg[14], [[SM.x - 0.02, SM.y - SM.h / 2 - 0.05, SM.z], [SM.x - 0.02, 2.5, 0.27], [-1.5, 2.5, 0.22], [-1.5, 3.3, 0.2], [-1.2, 3.36, 0.0], [hcx - 0.6, hp.y1 + 0.16, hcz + 0.1]], 0.0085, 'cable');
      R(eg[15], [[T.x + 0.1, T.y + T.h / 2 - 0.02, T.z], [T.x + 0.2, 1.8, 0.95], [0.4, 1.85, 0.7], [0.55, 2.0, 0.62], [0.6, 2.2, 0.6]], 0.0065, 'cableGray');
      R(eg[16], [[T.x + 0.02, 0.06, T.z + 0.02], [T.x + 0.02, 0.05, 1.18], [0.4, 0.045, 1.26], [0.5, 0.06, 0.8], [0.55, 0.4, -0.2], [0.55, 0.55, -0.55]], 0.0035, 'cableBlue');
      R(eg[17], [[T.x - 0.15, T.y + T.h / 2 - 0.02, T.z], [T.x - 0.5, 1.82, 0.9], [-1.5, 1.85, 0.7], [-1.82, 2.1, ZB]], 0.005, 'cable');
      // 18 cable Ethernet 4 hilos ×4 con 19 conectores RJ45 ×4 ; 20-23 latiguillos Cat6A
      const eth = [
        [[SM.x + 0.1, SM.y - 0.2, SM.z], [SM.x + 0.2, 2.5, 0.3], [-0.2, 1.9, 0.8], [T.x + 0.1, T.y + T.h / 2 - 0.03, T.z]],
        [[T.x + 0.14, T.y + 0.5, T.z], [T.x + 0.4, 1.75, 0.85], [1.2, 1.9, 0.6], [1.5, 2.3, 0.2]],
        [[T.x + 0.14, T.y + 0.4, T.z], [T.x + 0.4, 0.05, 1.0], [0.2, 0.05, 1.2], [0.55, 0.52, -0.55]],
        [[SM.x + 0.2, SM.y + 0.1, SM.z], [-0.2, 2.9, 0.3], [-1.5, 3.0, 0.0], [-1.82, 2.5, ZB + 0.2]]
      ];
      eth.forEach(pts => { R(eg[18], pts, 0.0035, 'cableGray'); [pts[0], pts[pts.length - 1]].forEach(p => eg[19].add(rbox(0.014, 0.012, 0.024, 0.002, 'steel', { pos: p }))); });
      const patch = (id, p0, p1, n) => { for (let i = 0; i < n; i++) R(eg[id], [[p0[0] + i * 0.012, p0[1], p0[2]], [(p0[0] + p1[0]) / 2 + i * 0.012, p0[1] - 0.08 - i * 0.02, p0[2] + 0.05], [p1[0] + i * 0.012, p1[1], p1[2]]], 0.003, 'cableGray'); };
      K.elemDoor['terminales:20'] = K.elemDoor['terminales:21'] = 'small'; K.elemDoor['terminales:22'] = K.elemDoor['terminales:23'] = 'tall';
      patch(20, Sp(0.14, -0.09, 0.06), Sp(0.2, -0.09, 0.06), 1); patch(21, Sp(-0.14, 0.0, 0.09), Sp(0.0, -0.06, 0.08), 1);
      patch(22, Tp(-0.27, 0.53, 0.07), Tp(-0.1, 0.45, 0.07), 3); patch(23, Tp(0.1, 0.05, 0.15), Tp(0.19, -0.05, 0.11), 2);
      // 24-37 bornes WAGO sobre el riel inferior del armario alto
      const v = -0.62, railP = Tp(0, v, 0);
      const rails = new THREE.Group(); rails.name = 'terminales:riel'; rails.userData.comp = C; comps[C].add(rails); rails.add(rbox(0.62, 0.035, 0.007, 0.001, 'steelDark', { pos: [railP[0], railP[1], railP[2] - 0.004], cast: false })); rails.add(rbox(0.62, 0.04, 0.045, 0.004, 'lightGray', { pos: [railP[0], railP[1] - 0.06, railP[2] + 0.01] }));
      let u = -0.29;
      const blk = (id, w, color, h) => { const p = Tp(u + w / 2, v, 0); K.block(eg[id], w * 0.95, h || 0.048, 0.042, [p[0], p[1], p[2] + 0.021], color); eg[id].add(box(w * 0.5, 0.004, 0.004, 'steel', { pos: [p[0], p[1] + 0.018, p[2] + 0.044], cast: false })); u += w; };
      const cov = (id, w, color) => { const p = Tp(u + w / 2, v, 0); eg[id].add(box(w * 0.9, 0.048, 0.0015, color, { pos: [p[0], p[1], p[2] + 0.021] })); u += w * 0.16; };
      const stop = (id) => { const p = Tp(u + 0.004, v, 0); K.block(eg[id], 0.008, 0.045, 0.036, [p[0], p[1], p[2] + 0.018], 'lightGray'); u += 0.009; };
      K.elemDoor['terminales:24'] = null;
      for (let i = 24; i <= 37; i++) K.elemDoor['terminales:' + i] = 'tall';
      stop(26); blk(24, 0.01, 'green'); cov(25, 0.01, 'green'); blk(27, 0.0075, 'green'); cov(28, 0.0075, 'green'); stop(26);
      blk(37, 0.0062, 'gray'); stop(26);
      for (let i = 0; i < 4; i++) { blk(36, 0.0062, 'green'); cov(35, 0.0062, 'green'); } stop(26);
      for (let i = 0; i < 4; i++) { blk(30, 0.005, 'gray'); cov(29, 0.005, 'gray'); } stop(26);
      blk(31, 0.005, 'gray'); cov(32, 0.005, 'gray'); stop(26);
      for (let i = 0; i < 2; i++) { blk(34, 0.005, 'gray'); cov(33, 0.005, 'gray'); } stop(26); stop(26);
      explode(eg[3], -0.5, 0, 0);
    }
  });
})();
