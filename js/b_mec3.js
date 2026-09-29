/* BANDA TRANSPORTADORA DE MOLDES · MECANISMO DE MANIVELA · ELEVACIÓN DEL PORTA CONFORMADORES */
(function () {
  'use strict';
  window.MODEL_BUILDERS.push(function (K) {
    const { THREE, PI, TAU, el, comps, box, rbox, cyl, torus, sphere, lathe, extrude, merge, tr, put, bolts, nuts, washers, line, grid, pipe, hose, clamp, inst, mat, mesh, explode, spin, geo, anim, state } = K;
    const L = K.L, S = K.parts;

    /* =========================================================
     *  BANDA TRANSPORTADORA DE MOLDES (18)
     * ========================================================= */
    {
      const C = 'banda', by = L.belt.y, xa = -1.95, xb = 1.58, R = 0.085, gz = 0.0;
      const top = by + R, bot = by - R, straight = xb - xa, perim = 2 * straight + TAU * R;
      // punto y tangente en la trayectoria (t en metros, sentido: tramo superior hacia +X)
      function pathAt(s) {
        s = ((s % perim) + perim) % perim;
        if (s < straight) return { x: xa + s, y: top, a: 0 };
        s -= straight;
        if (s < PI * R) { const th = s / R; return { x: xb + R * Math.sin(th), y: by + R * Math.cos(th), a: -th }; }
        s -= PI * R;
        if (s < straight) return { x: xb - s, y: bot, a: PI };
        s -= straight; const th = s / R; return { x: xa - R * Math.sin(th), y: by - R * Math.cos(th), a: PI - th };
      }
      const g8 = el(C, 8), g5 = el(C, 5);
      const pitch = 0.038, nLinks = Math.round(perim / pitch), pit = perim / nLinks;
      const inner = geo('linkI', () => merge([tr(new THREE.BoxGeometry(0.03, 0.012, 0.004), 0, 0, 0.007), tr(new THREE.BoxGeometry(0.03, 0.012, 0.004), 0, 0, -0.007)]));
      const outer = geo('linkO', () => merge([tr(new THREE.BoxGeometry(0.03, 0.012, 0.004), 0, 0, 0.0115), tr(new THREE.BoxGeometry(0.03, 0.012, 0.004), 0, 0, -0.0115), tr(new THREE.CylinderGeometry(0.0035, 0.0035, 0.03, 10), 0.0, 0, 0)]));
      const nOut = Math.ceil(nLinks / 2), nIn = Math.floor(nLinks / 2);
      const chainI = new THREE.InstancedMesh(inner, mat('steel'), nIn), chainO = new THREE.InstancedMesh(outer, mat('steelDark'), nOut);
      const AVE = new THREE.InstancedMesh(geo('ave22', () => new THREE.CylinderGeometry(0.011, 0.011, 0.015, 20).rotateX(PI / 2)), mat('black', { roughness: 0.4 }), 150);
      [chainI, chainO, AVE].forEach(m => { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; });
      g8.add(chainI, chainO); g5.add(AVE);
      const dm = new THREE.Object3D();
      function updateChain(off) {
        let ci = 0, co = 0;
        for (let i = 0; i < nLinks; i++) {
          const p = pathAt(i * pit + off); dm.position.set(p.x, p.y, gz); dm.rotation.set(0, 0, p.a); dm.scale.set(1, 1, 1); dm.updateMatrix();
          if (i % 2) chainI.setMatrixAt(ci++, dm.matrix); else chainO.setMatrixAt(co++, dm.matrix);
        }
        for (let i = 0; i < 150; i++) {
          const p = pathAt(i * perim / 150 + off + pit * 0.5); dm.position.set(p.x, p.y + (i % 2 ? 0.0 : 0.0), gz); dm.rotation.set(0, 0, p.a); dm.updateMatrix(); AVE.setMatrixAt(i, dm.matrix);
        }
        chainI.instanceMatrix.needsUpdate = chainO.instanceMatrix.needsUpdate = AVE.instanceMatrix.needsUpdate = true;
      }
      updateChain(0);
      let chainOff = 0;
      anim.push(function (dt, st) { if (Math.abs(st.speed) > 0.01) { chainOff += st.speed * dt * 0.05; updateChain(chainOff); } });
      // piñones (2 conducido, 15 motriz) y ejes (4 tensor, 16 motriz)
      const g2 = el(C, 2), g15 = el(C, 15), g4 = el(C, 4), g16 = el(C, 16);
      const p2 = S.sprocket(R + 0.006, 22, 0.02, 'steelDark'); p2.position.set(xa, by, gz); g2.add(p2); spin(p2, 'z', -1);
      const p15 = S.sprocket(R + 0.006, 22, 0.02, 'steelDark'); p15.position.set(xb, by, gz); g15.add(p15); spin(p15, 'z', -1);
      g4.add(cyl(0.015, 0.015, 0.86, 'steel', { axis: 'z', pos: [xa, by, gz], seg: 32, mat: { roughness: 0.15 } }));
      g16.add(cyl(0.015, 0.015, 1.02, 'steel', { axis: 'z', pos: [xb, by, gz], seg: 32, mat: { roughness: 0.15 } }));
      g16.add(box(0.005, 0.005, 0.05, 'steelDark', { pos: [xb + 0.014, by, 0.4] }));
      // 3 rodamiento 6006 en el piñón conducido
      const b3 = S.bearing(0.0275, 0.015, 0.013, 'red'); b3.position.set(xa, by, gz + 0.02); el(C, 3).add(b3);
      // 17 cojinetes iglidur MSM ×4 en el eje tensor
      const g17 = el(C, 17);
      [[-0.3, 1], [0.3, 1], [-0.36, 1], [0.36, 1]].forEach(q => g17.add(cyl(0.0185, 0.0185, 0.014, 'iglidur', { axis: 'z', pos: [xa, by, q[0] * 1.0 + (q[0] > 0 ? 0.0 : 0.0)], seg: 32 })));
      // 1 anillos elásticos ×2
      const g1 = el(C, 1);
      [0.44, -0.44].forEach(z => g1.add(torus(0.0165, 0.0018, 'steelDark', { axis: 'z', pos: [xb, by, z], seg: 28, arc: PI * 1.8 })));
      // soportes UCFL206 ×2, tapa abierta (12), tapa cerrada (18), retén V (14)
      const g13 = el(C, 13), g12 = el(C, 12), g18 = el(C, 18), g14 = el(C, 14);
      [[-1, g18], [1, g12]].forEach(([s, tg]) => {
        const u = S.ucfl(30); u.position.set(xb, by, s * 0.5); if (s < 0) u.rotation.y = PI; g13.add(u);
        // placa lateral de montaje
        const cp = cyl(0.036, 0.036, 0.03, 'steel', { axis: 'z', pos: [xb, by, s * (0.5 + 0.055)], seg: 40 }); tg.add(cp);
        if (s > 0) tg.add(torus(0.03, 0.004, 'steelDark', { axis: 'z', pos: [xb, by, s * 0.5 + 0.045], seg: 24 }));
        g14.add(lathe([[0.016, 0], [0.024, 0.0], [0.028, 0.006], [0.024, 0.01], [0.016, 0.004]], 'rubber', { axis: 'z', pos: [xb, by, s * 0.44], rot: [s > 0 ? PI / 2 : -PI / 2, 0, 0], seg: 40 }));
      });
      // placas laterales del bastidor de la banda y rieles guía
      const frame = new THREE.Group(); frame.userData.comp = C; comps[C].add(frame); frame.name = 'banda:bastidor';
      [-1, 1].forEach(s => {
        frame.add(rbox(straight + 0.35, 0.09, 0.012, 0.003, 'panel', { pos: [(xa + xb) / 2, by, s * 0.4] }));
        frame.add(rbox(straight + 0.3, 0.014, 0.05, 0.003, 'steelDark', { pos: [(xa + xb) / 2, top + 0.02, s * 0.36] }));
        frame.add(rbox(straight + 0.3, 0.014, 0.05, 0.003, 'steelDark', { pos: [(xa + xb) / 2, bot - 0.02, s * 0.36] }));
      });
      // 9 encoder absoluto RM3010 en el eje motriz
      const g9 = el(C, 9), en = new THREE.Group(); en.position.set(xb, by, -0.6); g9.add(en);
      en.add(cyl(0.029, 0.029, 0.05, 'anodized', { axis: 'z', pos: [0, 0, 0], seg: 40 })); en.add(cyl(0.03, 0.03, 0.006, 'black', { axis: 'z', pos: [0, 0, -0.028], seg: 40 }));
      en.add(cyl(0.006, 0.006, 0.03, 'steelDark', { axis: 'z', pos: [0, 0, 0.038], seg: 12 })); en.add(cyl(0.008, 0.008, 0.03, 'black', { pos: [0, 0.035, -0.005], seg: 12 })); en.add(cyl(0.006, 0.006, 0.02, 'brass', { pos: [0, 0.062, -0.005], seg: 12 }));
      // 10 motorreductor SA47 (motor colgando hacia abajo)
      const g10 = el(C, 10), gm = S.gearMotor(); gm.rotation.z = -PI / 2; gm.position.set(xb, by, 0.6); g10.add(gm);
      // 11 guías del elevador de moldes ×4 (perfiles verticales)
      const g11 = el(C, 11);
      [[-1.05, -0.62], [1.05, -0.62], [-1.05, 0.62], [1.05, 0.62]].forEach(p => {
        g11.add(rbox(0.04, 0.9, 0.04, 0.004, 'steelDark', { pos: [p[0], 0.82, p[1]] })); g11.add(rbox(0.012, 0.9, 0.012, 0.003, 'steel', { pos: [p[0] + 0.03, 0.82, p[1]] }));
      });
      // 6 tapas de tubo 40x40 y 7 pies Ø50 en el extremo de salida
      const g6 = el(C, 6), g7 = el(C, 7);
      [-1, 1].forEach(s => {
        const x = -2.02, z = s * 0.36;
        g7.add(K.level(x, 0, z, 0.025, 0.06));
        g6.add(rbox(0.044, 0.014, 0.044, 0.004, 'black', { pos: [x, 0.07, z] }));
        g6.add(rbox(0.04, by - 0.13, 0.04, 0.004, 'brushed', { pos: [x, 0.08 + (by - 0.13) / 2 - 0.0, z], recv: true }));
      });
      explode(g8, 0, 0, 0.55); explode(g5, 0, 0, 0.55); explode(g10, 0.5, 0, 0.5);
    }

    /* =========================================================
     *  MECANISMO DE MANIVELA (16)
     * ========================================================= */
    {
      const C = 'manivela', px = 1.98, py = 1.02, Q = [2.22, 1.15], B = [2.14, 0.62];
      const g3 = el(C, 3), g13 = el(C, 13), g4 = el(C, 4), g12 = el(C, 12), g7 = el(C, 7), g8 = el(C, 8), g1 = el(C, 1), g9 = el(C, 9), g10 = el(C, 10);
      // chapa de montaje al bastidor
      const plate = new THREE.Group(); plate.userData.comp = C; comps[C].add(plate);
      plate.add(rbox(0.02, 1.1, 1.0, 0.004, 'panelDark', { pos: [L.bx1 + 0.02, 0.85, 0.0] })); plate.name = 'manivela:placa';
      // 3 eje giro brazo (principal) y 13 ×2 (pivotes secundarios)
      g3.add(cyl(0.02, 0.02, 0.75, 'steel', { axis: 'z', pos: [px, py, 0], seg: 36, mat: { roughness: 0.15 } }));
      [[2.14, 0.62], [2.22, 1.15]].forEach(p => g13.add(cyl(0.014, 0.014, 0.16, 'steel', { axis: 'z', pos: [p[0], p[1], p[0] > 2.2 ? 0.3 : 0.0], seg: 24 })));
      // 4, 12 manivelas (dos brazos con orificios)
      const arm = (len, w) => { const s = new THREE.Shape(); s.absarc(0, 0, w / 2, PI / 2, PI * 1.5, false); s.lineTo(len, -w / 3); s.absarc(len, 0, w / 3, -PI / 2, PI / 2, false); s.lineTo(0, w / 2); const h1 = new THREE.Path(); h1.absarc(0, 0, 0.012, 0, TAU, true); s.holes.push(h1); const h2 = new THREE.Path(); h2.absarc(len, 0, 0.008, 0, TAU, true); s.holes.push(h2); return s; };
      const dx = Q[0] - px, dy = Q[1] - py, al = Math.hypot(dx, dy), aa = Math.atan2(dy, dx);
      [[0.3, g4], [-0.3, g12]].forEach(([z, g]) => { const m = extrude(arm(al, 0.07), 0.016, 'steelDark', { seg: 24, pos: [px, py, z] }); m.rotation.z = aa; g.add(m); });
      K.manivelaArms = [g4, g12];
      // 10 turillones ×2 (pasadores del brazo) ; 9 ruedas guía ×4 ; 15 cojinetes EFOM25 ×6 ; 16 arandelas ×6 ; 11 cojinetes XFM ×3
      const g15 = el(C, 15), g16 = el(C, 16), g11 = el(C, 11), g5 = el(C, 5);
      [0.3, -0.3].forEach(z => {
        g10.add(cyl(0.011, 0.011, 0.07, 'steel', { axis: 'z', pos: [Q[0], Q[1], z], seg: 20 }));
        g10.add(cyl(0.017, 0.017, 0.008, 'steelDark', { axis: 'z', pos: [Q[0], Q[1], z + Math.sign(z) * 0.036], seg: 24 }));
      });
      [[-0.3, 1.0], [0.3, 1.0], [-0.3, 0.9], [0.3, 0.9]].forEach((p, i) => {
        const w = new THREE.Group(); w.position.set(L.bx1 + 0.06, p[1], p[0]); g9.add(w);
        w.add(cyl(0.028, 0.028, 0.018, 'black', { axis: 'x', seg: 36 })); w.add(cyl(0.012, 0.012, 0.03, 'steel', { axis: 'x', pos: [-0.012, 0, 0], seg: 16 })); w.add(torus(0.028, 0.004, 'steelDark', { axis: 'x', seg: 36 }));
      });
      [[px, py, 0.16], [px, py, -0.16], [px, py, 0.34], [px, py, -0.34], [px, py, 0.06], [px, py, -0.06]].forEach(p => {
        const f = new THREE.Group(); f.position.set(p[0], p[1], p[2]); g15.add(f);
        f.add(cyl(0.032, 0.032, 0.006, 'steelDark', { axis: 'z', seg: 40 })); f.add(cyl(0.022, 0.022, 0.016, 'iglidur', { axis: 'z', seg: 32 }));
        g16.add(cyl(0.0305, 0.0305, 0.003, 'steel', { axis: 'z', pos: [p[0], p[1], p[2] + Math.sign(p[2]) * 0.01], seg: 32 }));
      });
      [[Q[0], Q[1], 0.16], [B[0], B[1], 0.05], [2.14, 0.62, -0.05]].forEach(p => g11.add(cyl(0.0155, 0.0155, 0.018, 'iglidur', { axis: 'z', pos: p, seg: 28 })));
      g5.add(lathe([[0.02, 0], [0.032, 0.0], [0.036, 0.008], [0.03, 0.012], [0.02, 0.005]], 'rubber', { axis: 'z', pos: [px, py, 0.365], rot: [PI / 2, 0, 0], seg: 40 }));
      // biela: barras + distanciadores (2, 6, 14)
      const g2 = el(C, 2), g6 = el(C, 6), g14 = el(C, 14);
      const bar = new THREE.Group(); bar.userData.comp = C; comps[C].add(bar); bar.name = 'manivela:biela';
      [[0.16, 0], [-0.16, 0]].forEach(([z]) => bar.add(rbox(0.024, 0.55, 0.016, 0.003, 'steelDark', { pos: [(B[0] + Q[0]) / 2 - 0.02, (B[1] + Q[1]) / 2, z + Math.sign(z) * 0.06], rot: [0, 0, Math.atan2(B[0] - Q[0], -(B[1] - Q[1])) * -1 * 0.0] })));
      g2.add(cyl(0.014, 0.014, 0.03, 'steel', { axis: 'z', pos: [Q[0], Q[1], 0.2], seg: 20 }));
      g6.add(cyl(0.014, 0.014, 0.03, 'steel', { axis: 'z', pos: [Q[0], Q[1], -0.2], seg: 20 }));
      [[0.12, 0.0], [-0.12, 0.0], [0.05, 1], [-0.05, 1]].forEach((p, i) => g14.add(cyl(0.013, 0.013, 0.024, 'steel', { axis: 'z', pos: [B[0], B[1], p[0]], seg: 20 })));
      // 7 cilindro neumático CRDSNU-63-130 desde la base B hasta Q ; 8 horquilla ; 1 rótula
      const dir = new THREE.Vector3(Q[0] - B[0], Q[1] - B[1], 0), len = dir.length(); dir.normalize();
      const cy = S.pneuCyl(63, 0.13); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
      const cc = new THREE.Group(); cc.position.set(B[0] + dir.x * 0.2, B[1] + dir.y * 0.2, 0.0); cc.quaternion.copy(q); cc.add(cy); g7.add(cc);
      const hq = new THREE.Group(); hq.position.set(Q[0] - dir.x * 0.04, Q[1] - dir.y * 0.04, 0); hq.quaternion.copy(q); g8.add(hq);
      hq.add(rbox(0.05, 0.05, 0.04, 0.006, 'steel', {})); hq.add(cyl(0.011, 0.011, 0.06, 'steelDark', { axis: 'z', pos: [0.02, 0, 0], seg: 20 }));
      const rot = new THREE.Group(); rot.position.set(B[0] - dir.x * 0.1, B[1] - dir.y * 0.1, 0); rot.quaternion.copy(q); g1.add(rot);
      rot.add(cyl(0.02, 0.02, 0.03, 'steel', { axis: 'x', seg: 24 })); rot.add(sphere(0.026, 'steelDark', { pos: [-0.03, 0, 0] })); rot.add(cyl(0.01, 0.01, 0.05, 'steel', { axis: 'z', pos: [-0.03, 0, 0], seg: 16 }));
      explode(g7, 0.5, 0, 0); explode(g3, 0.5, 0, 0); explode(g4, 0.5, 0, 0); explode(g12, 0.5, 0, 0);
    }

    /* =========================================================
     *  ELEVACIÓN DEL PORTA CONFORMADORES (10)
     * ========================================================= */
    {
      const C = 'elevacion', gy = 0.5, X = 1.35, zA = -0.55, zB = 0.45;
      const g3 = el(C, 3), g8 = el(C, 8), g9 = el(C, 9), g2 = el(C, 2), g4 = el(C, 4), g5 = el(C, 5), g1 = el(C, 1), g10 = el(C, 10), g6 = el(C, 6), g7 = el(C, 7);
      // servomotor (7) + servoreductor (6) al centro
      const sv = new THREE.Group(); sv.position.set(0, gy, zA); g6.add(sv);
      sv.add(rbox(0.13, 0.13, 0.13, 0.014, 'anodized', { pos: [0, 0, 0] })); sv.add(cyl(0.055, 0.055, 0.03, 'steelDark', { pos: [0, 0.075, 0], seg: 40 }));
      [1, -1].forEach(s => sv.add(cyl(0.03, 0.03, 0.02, 'steelDark', { axis: 'x', pos: [s * 0.075, 0, 0], seg: 32 })));
      const mo = new THREE.Group(); mo.position.set(0, gy + 0.16, zA); g7.add(mo);
      mo.add(rbox(0.09, 0.13, 0.09, 0.012, 'ab', { pos: [0, 0.05, 0] })); mo.add(cyl(0.048, 0.048, 0.04, 'abLight', { pos: [0, 0.135, 0], seg: 40 }));
      [0.05, -0.02].forEach(z => mo.add(cyl(0.011, 0.011, 0.03, 'steelDark', { axis: 'z', pos: [0, 0.12, 0.06 * Math.sign(z + 0.01)], seg: 16 })));
      // cajas de reenvío en las 4 esquinas
      const A = [[-X, zA], [X, zA], [-X, zB], [X, zB]];
      A.forEach((p, i) => {
        const gb = S.angular(0.11, i >= 2); gb.position.set(p[0], gy, p[1]); (i < 2 ? g8 : g9).add(gb);
        // actuador eléctrico FUS Ø63x175 sobre cada caja
        const ac = new THREE.Group(); ac.position.set(p[0], gy + 0.055 + 0.0, p[1]); g3.add(ac);
        ac.add(cyl(0.05, 0.05, 0.04, 'steelDark', { pos: [0, 0.02, 0], seg: 40 }));
        ac.add(rbox(0.075, 0.42, 0.075, 0.008, 'anodized', { pos: [0, 0.25, 0] }));
        [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(k => ac.add(cyl(0.005, 0.005, 0.4, 'steel', { pos: [k[0] * 0.028, 0.25, k[1] * 0.028], seg: 8, cast: false })));
        ac.add(cyl(0.032, 0.032, 0.03, 'steelDark', { pos: [0, 0.475, 0], seg: 40 }));
      });
      // carro porta-conformadores con vástagos (se anima)
      const carrier = new THREE.Group(); carrier.position.set(0, 1.0, 0.0); carrier.userData.comp = C; carrier.name = 'elevacion:carro'; comps[C].add(carrier); K.carrier = carrier;
      carrier.add(rbox(3.2, 0.03, 1.12, 0.006, 'steelDark', { pos: [0, 0.0, -0.05] }));
      [[-1, 1], [1, 1]].forEach(k => carrier.add(rbox(3.2, 0.06, 0.03, 0.004, 'steel', { pos: [0, 0.03, k[0] * 0.57 - 0.05] })));
      A.forEach(p => { carrier.add(cyl(0.028, 0.028, 0.44, 'steel', { pos: [p[0], -0.23, p[1]], seg: 36, mat: { roughness: 0.1 } })); carrier.add(cyl(0.04, 0.04, 0.03, 'steelDark', { pos: [p[0], -0.02, p[1]], seg: 36 })); });
      // moldes de referencia (formas rectangulares sobre el carro) — decorativo, sin taxonomía
      const molds = new THREE.Group(); molds.name = 'elevacion:moldes'; molds.userData.comp = C; carrier.add(molds);
      for (let i = 0; i < 12; i++) { molds.add(rbox(0.22, 0.09, 0.42, 0.012, 'white', { pos: [-1.5 + i * 0.27, 0.06, -0.05], mat: { color: 0xdfe4e8 } })); }
      anim.push(function (dt, st) { if (st.running && !st.estop) { st.liftT = (st.liftT || 0) + dt; carrier.position.y = 1.0 + (0.5 - 0.5 * Math.cos(st.liftT * 1.2)) * 0.22; } });
      // 4 ejes servoreductor→reenvío ×2 (X) ; 2 ejes entre reenvíos ×2 (Z) ; 5 acoplamientos ×8 ; 1,10 bridas ×2 + ×2
      [-1, 1].forEach(s => {
        g4.add(cyl(0.011, 0.011, X - 0.075 - 0.055, 'steel', { axis: 'x', pos: [s * (X + 0.075) / 2, gy, zA], seg: 24, mat: { roughness: 0.15 } }));
        const c1 = S.coupling(0.026, 0.06); c1.position.set(s * (0.075 + 0.05), gy, zA); g5.add(c1);
        const c2 = S.coupling(0.026, 0.06); c2.position.set(s * (X - 0.055 - 0.04), gy, zA); g5.add(c2);
        g2.add(cyl(0.011, 0.011, zB - zA - 0.11, 'steel', { axis: 'z', pos: [s * X, gy, (zA + zB) / 2], seg: 24, mat: { roughness: 0.15 } }));
        const c3 = S.coupling(0.026, 0.06); c3.rotation.y = PI / 2; c3.position.set(s * X, gy, zA + 0.09); g5.add(c3);
        const c4 = S.coupling(0.026, 0.06); c4.rotation.y = PI / 2; c4.position.set(s * X, gy, zB - 0.09); g5.add(c4);
        [zA, zB].forEach((z, k) => g1.add(cyl(0.028, 0.028, 0.008, 'steel', { axis: 'z', pos: [s * X, gy, z + (k ? -0.058 : 0.058)], seg: 32 })));
        g10.add(cyl(0.028, 0.028, 0.008, 'steel', { axis: 'x', pos: [s * (X - 0.058), gy, zA], seg: 32 }));
        g10.add(cyl(0.028, 0.028, 0.008, 'steel', { axis: 'x', pos: [s * 0.062, gy, zA], seg: 32 }));
      });
      explode(g3, 0, 0.0, 0); explode(carrier, 0, 0.6, 0);
    }
  });
})();
