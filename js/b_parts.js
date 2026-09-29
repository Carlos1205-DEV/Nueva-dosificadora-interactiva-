/* Biblioteca de piezas reutilizables (válvulas, cilindros, chumaceras, piñones, motorreductores) */
(function () {
  'use strict';
  window.MODEL_BUILDERS.push(function (K) {
    const { THREE, PI, TAU, box, rbox, cyl, torus, sphere, lathe, extrude, merge, tr, pipe, clamp, mesh, mat } = K;
    const S = K.parts = {};

    /* Válvula de mariposa sanitaria clamp/B-B (flujo en X, actuador en +Y).
       act: 'T1' | 'T2' (actuador neumático simple efecto) | 'manual' | 'multi' (maneta multiposición) */
    S.butterfly = function (od, act, o) {
      o = o || {};
      const r = od / 2000, g = new THREE.Group();
      const L = 0.1 + r * 0.6;
      g.add(lathe([[r * 0.98, -L / 2], [r * 1.02, -L / 2], [r * 1.02, -L / 2 + 0.008], [r * 1.34, -L / 2 + 0.012], [r * 1.34, -L / 2 + 0.024], [r * 1.12, -L / 2 + 0.034], [r * 1.12, L / 2 - 0.034], [r * 1.34, L / 2 - 0.024], [r * 1.34, L / 2 - 0.012], [r * 1.02, L / 2 - 0.008], [r * 1.02, L / 2], [r * 0.98, L / 2]], 'steel', { axis: 'x', seg: 56 }));
      g.add(cyl(r * 1.36, r * 1.36, 0.008, 'epdm', { axis: 'x', pos: [-L / 2 + 0.018, 0, 0], seg: 48 }));
      g.add(cyl(r * 1.36, r * 1.36, 0.008, 'epdm', { axis: 'x', pos: [L / 2 - 0.018, 0, 0], seg: 48 }));
      // disco (visible por la boca)
      g.add(cyl(r * 0.9, r * 0.9, 0.006, 'steelDark', { axis: 'x', pos: [0, 0, 0], seg: 40, rot: [0, 0, 0] }));
      // cuello y eje
      g.add(cyl(r * 0.34, r * 0.4, r * 1.3, 'steel', { pos: [0, r * 1.15, 0], seg: 32 }));
      g.add(cyl(r * 0.16, r * 0.16, r * 2.4, 'steelDark', { pos: [0, r * 1.0, 0], seg: 16 }));
      if (act === 'manual') {
        g.add(rbox(r * 1.6, 0.018, 0.026, 0.005, 'blueLight', { pos: [r * 0.7, r * 1.9, 0] }));
        g.add(sphere(0.016, 'blueLight', { pos: [r * 1.55, r * 1.9, 0] }));
      } else if (act === 'multi') {
        g.add(cyl(r * 0.4, r * 0.4, 0.03, 'steelDark', { pos: [0, r * 1.95, 0], seg: 24 }));
        g.add(rbox(0.1, 0.014, 0.024, 0.004, 'yellow', { pos: [0.05, r * 2.1, 0] }));
      } else {
        const big = act === 'T2', ar = big ? 0.05 : 0.04, ah = big ? 0.13 : 0.11;
        g.add(cyl(r * 0.3, r * 0.3, 0.03, 'steelDark', { pos: [0, r * 1.9, 0], seg: 24 }));
        const a = new THREE.Group(); a.position.set(0, r * 1.9 + 0.015, 0); g.add(a);
        a.add(cyl(ar, ar, ah, 'blue', { pos: [0, ah / 2, 0], seg: 40, mat: { metalness: 0.5 } }));
        a.add(cyl(ar * 1.05, ar * 1.05, 0.014, 'steelDark', { pos: [0, 0.007, 0], seg: 40 }));
        const fb = []; for (let i = 0; i < 6; i++) fb.push([Math.cos(i * TAU / 6) * ar * 0.86, 0.014, Math.sin(i * TAU / 6) * ar * 0.86]);
        a.add(K.bolts(fb, 0.0035, 0.01, 'y', { mat: 'steel' }));
        a.add(K.label(big ? 'S-E T2' : 'S-E T1', ar * 0.9, ar * 0.36, { bg: '#e6e9ec', fg: '#0d2f66', fs: 34, pos: [0, ah * 0.5, ar + 0.0006] }));
        a.add(cyl(ar * 1.05, ar * 1.05, 0.014, 'steelDark', { pos: [0, ah - 0.007, 0], seg: 40 }));
        a.add(cyl(ar * 0.5, ar * 0.4, 0.02, 'black', { pos: [0, ah + 0.01, 0], seg: 24 }));
        a.add(cyl(0.006, 0.006, 0.04, 'steel', { axis: 'x', pos: [ar + 0.012, ah - 0.03, 0], seg: 10 }));
        a.add(rbox(0.036, 0.045, 0.03, 0.004, 'black', { pos: [ar + 0.02, ah * 0.5, 0] }));
      }
      return g;
    };

    /* Cilindro neumático ISO (eje en X, centrado): bore Ø, carrera, vástago hacia +X */
    S.pneuCyl = function (bore, stroke, o) {
      o = o || {};
      const r = bore / 2000, L = stroke + 0.12 + bore / 1000 * 0.9, g = new THREE.Group();
      g.add(cyl(r, r, L, 'anodized', { axis: 'x', seg: 48, mat: { roughness: 0.3 } }));
      // ranuras del perfil
      [PI / 4, 3 * PI / 4, 5 * PI / 4, 7 * PI / 4].forEach(a => g.add(box(L * 0.98, 0.006, 0.006, 'steelDark', { pos: [0, Math.sin(a) * r * 1.0, Math.cos(a) * r * 1.0], cast: false })));
      [-1, 1].forEach(s => {
        g.add(rbox(0.05, r * 2.3, r * 2.3, 0.006, 'steelDark', { pos: [s * (L / 2 + 0.0), 0, 0] }));
        [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(k => g.add(cyl(0.005, 0.005, L * 0.98, 'steel', { axis: 'x', pos: [0, k[0] * r * 1.0, k[1] * r * 1.0], seg: 8, cast: false })));
        g.add(cyl(0.008, 0.008, 0.025, 'steel', { pos: [s * (L / 2 - 0.04), r * 1.2 + 0.006, 0], seg: 12 }));
      });
      const tn = []; [-1, 1].forEach(s => [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(k => tn.push([s * (L / 2 + 0.03), k[0] * r * 1.0, k[1] * r * 1.0])));
      g.add(K.nuts(tn, 0.006, 'x', { mat: 'steel' }));
      [-1, 1].forEach(s => { g.add(cyl(0.007, 0.007, 0.02, 'brass', { pos: [s * (L / 2 - 0.03), r * 1.15 + 0.01, 0], seg: 12 })); g.add(cyl(0.0045, 0.0045, 0.03, 'blueLight', { pos: [s * (L / 2 - 0.03), r * 1.15 + 0.03, 0], seg: 8 })); });
      // vástago cromado y horquilla
      g.add(cyl(r * 0.28, r * 0.28, stroke, 'steel', { axis: 'x', pos: [L / 2 + stroke / 2, 0, 0], seg: 32, mat: { roughness: 0.1 } }));
      g.add(cyl(r * 0.36, r * 0.36, 0.03, 'steelDark', { axis: 'x', pos: [L / 2 + stroke + 0.015, 0, 0], seg: 24 }));
      return g;
    };

    /* Chumacera de brida (2 agujeros) tipo UCFL: eje en Z, brida en plano XY */
    S.ucfl = function (bore, o) {
      o = o || {};
      const r = bore / 1000, g = new THREE.Group();
      const s = new THREE.Shape(); const w = r * 4.6, hgt = r * 2.9;
      s.moveTo(-w / 2, -hgt * 0.32); s.quadraticCurveTo(-w / 2, -hgt / 2, -w / 2 + hgt * 0.32, -hgt / 2); s.lineTo(w / 2 - hgt * 0.32, -hgt / 2);
      s.quadraticCurveTo(w / 2, -hgt / 2, w / 2, -hgt * 0.32); s.lineTo(w / 2, hgt * 0.32); s.quadraticCurveTo(w / 2, hgt / 2, w / 2 - hgt * 0.32, hgt / 2); s.lineTo(-w / 2 + hgt * 0.32, hgt / 2); s.quadraticCurveTo(-w / 2, hgt / 2, -w / 2, hgt * 0.32); s.closePath();
      [-1, 1].forEach(k => { const h = new THREE.Path(); h.absarc(k * w * 0.4, 0, r * 0.2, 0, TAU, true); s.holes.push(h); });
      const h0 = new THREE.Path(); h0.absarc(0, 0, r * 0.75, 0, TAU, true); s.holes.push(h0);
      g.add(extrude(s, r * 0.32, o.steel ? 'steel' : 'steelDark', { seg: 20, pos: [0, 0, 0] }));
      g.add(lathe([[r * 0.75, -r * 0.5], [r * 1.05, -r * 0.5], [r * 1.35, -r * 0.05], [r * 1.35, r * 0.5], [r * 0.75, r * 0.5]], 'steelDark', { axis: 'z', seg: 40, pos: [0, 0, r * 0.35] }));
      g.add(cyl(r * 1.02, r * 1.02, r * 0.9, 'steel', { axis: 'z', pos: [0, 0, r * 0.4], seg: 40 }));
      g.add(cyl(r * 0.5, r * 0.5, r * 1.0, 'black', { axis: 'z', pos: [0, 0, r * 0.4], seg: 32 }));
      g.add(cyl(r * 0.06, r * 0.06, r * 0.4, 'brass', { pos: [0, r * 1.45, r * 0.4], seg: 8 }));
      g.add(K.bolts([[-w * 0.4, 0, r * 0.32], [w * 0.4, 0, r * 0.32]], r * 0.2, r * 0.5, 'z', { mat: 'steel' }));
      return g;
    };

    /* Piñón / rueda dentada (extruido en Z, centrado) */
    S.sprocket = function (rOut, teeth, thick, m) {
      const rRoot = rOut * 0.9, step = TAU / teeth, s = new THREE.Shape();
      for (let i = 0; i < teeth; i++) {
        const a = i * step;
        [[0.0, rRoot], [0.14, rOut], [0.52, rOut], [0.66, rRoot]].forEach((q, k) => {
          const x = q[1] * Math.cos(a + q[0] * step), y = q[1] * Math.sin(a + q[0] * step);
          (i === 0 && k === 0) ? s.moveTo(x, y) : s.lineTo(x, y);
        });
      }
      const h = new THREE.Path(); h.absarc(0, 0, rOut * 0.2, 0, TAU, true); s.holes.push(h);
      const g = new THREE.Group();
      g.add(extrude(s, thick, m || 'steelDark', { seg: 8 }));
      g.add(cyl(rOut * 0.42, rOut * 0.42, thick * 1.7, m || 'steel', { axis: 'z', seg: 32 }));
      return g;
    };

    /* Motorreductor de ejes ortogonales (SEW SA47/DRN71): eje hueco en Z, motor en +X */
    S.gearMotor = function (o) {
      const g = new THREE.Group();
      g.add(rbox(0.2, 0.2, 0.15, 0.02, 'sew', { pos: [0, 0, 0] }));
      g.add(cyl(0.075, 0.075, 0.03, 'sew', { axis: 'z', pos: [0, 0, 0.09], seg: 40 }));
      g.add(cyl(0.028, 0.028, 0.05, 'steel', { axis: 'z', pos: [0, 0, 0.13], seg: 32 }));
      // motor con aletas
      g.add(cyl(0.07, 0.07, 0.2, 'sew', { axis: 'x', pos: [0.2, 0, 0], seg: 40 }));
      for (let i = 0; i < 9; i++) g.add(torus(0.072, 0.004, 'sew', { axis: 'x', pos: [0.11 + i * 0.02, 0, 0], seg: 40 }));
      g.add(cyl(0.075, 0.075, 0.05, 'sew', { axis: 'x', pos: [0.33, 0, 0], seg: 40 }));
      g.add(cyl(0.06, 0.06, 0.05, 'black', { axis: 'x', pos: [0.37, 0, 0], seg: 32 }));
      g.add(rbox(0.09, 0.045, 0.08, 0.008, 'black', { pos: [0.2, 0.09, 0] }));
      g.add(cyl(0.012, 0.012, 0.03, 'steel', { pos: [-0.04, -0.11, 0], seg: 12 }));
      g.add(K.label('SEW-EURODRIVE\nSA47 DRN71M4', 0.075, 0.042, { bg: '#d3d7db', fg: '#111', fs: 18, pos: [0.2, 0.0, 0.0705] }));
      const fbl = []; for (let i = 0; i < 6; i++) fbl.push([Math.cos(i * TAU / 6) * 0.062, Math.sin(i * TAU / 6) * 0.062, 0.1]);
      g.add(K.bolts(fbl, 0.006, 0.02, 'z', { mat: 'steel' }));
      return g;
    };

    /* Sensor cilíndrico M12/M18 (eje en Y local, punta hacia -Y, conector arriba) */
    S.sensor = function (d, len, body, o) {
      o = o || {};
      const r = d / 2000, g = new THREE.Group();
      g.add(cyl(r, r, len, body || 'steel', { pos: [0, len / 2, 0], seg: 32, mat: { roughness: 0.25 } }));
      g.add(cyl(r * 0.85, r * 0.85, 0.004, o.face || 'black', { pos: [0, 0.0, 0], seg: 32 }));
      g.add(cyl(r * 1.25, r * 1.25, 0.004, 'steelDark', { pos: [0, len * 0.66, 0], seg: 6 }));
      g.add(cyl(r * 0.8, r * 0.8, 0.018, 'black', { pos: [0, len + 0.007, 0], seg: 20 }));
      g.add(cyl(r * 0.25, r * 0.25, 0.008, o.led || 'yellow', { pos: [0, len * 0.8, r + 0.001], rot: [PI / 2, 0, 0], seg: 8, mat: { emissive: 0x554400 } }));
      return g;
    };

    /* Caja de reenvío angular (UNIMEC XRC): cubo con 3 salidas de eje */
    S.angular = function (size, twoWay) {
      const g = new THREE.Group(), h = size / 2;
      g.add(rbox(size, size, size, 0.008, 'anodized', { pos: [0, 0, 0], mat: { roughness: 0.45 } }));
      [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]].forEach((v, i) => {
        if (twoWay && i === 1) return;
        const bo = cyl(h * 0.55, h * 0.55, 0.012, 'steelDark', { seg: 32 });
        const ax = new THREE.Group();
        ax.add(cyl(h * 0.55, h * 0.55, 0.014, 'steelDark', { seg: 32 }));
        ax.add(cyl(0.011, 0.011, 0.05, 'steel', { pos: [0, 0.03, 0], seg: 16 }));
        if (v[0]) { ax.rotation.z = -v[0] * PI / 2; } else { ax.rotation.x = v[2] * PI / 2; }
        ax.position.set(v[0] * (h + 0.004), 0, v[2] * (h + 0.004)); g.add(ax);
      });
      return g;
    };

    /* Acoplamiento elástico (dos mazas + araña) — eje en X */
    S.coupling = function (r, len) {
      const g = new THREE.Group();
      g.add(cyl(r, r, len * 0.4, 'steel', { axis: 'x', pos: [-len * 0.3, 0, 0], seg: 32 }));
      g.add(cyl(r, r, len * 0.4, 'steel', { axis: 'x', pos: [len * 0.3, 0, 0], seg: 32 }));
      g.add(cyl(r * 0.92, r * 0.92, len * 0.22, 'green', { axis: 'x', seg: 32 }));
      return g;
    };

    /* Rodamiento de bolas 62xx (anillo) — eje Z */
    S.bearing = function (rOut, rIn, w, shield) {
      const g = new THREE.Group();
      g.add(mesh(new THREE.LatheGeometry([[rIn, -w / 2], [rIn * 1.12, -w / 2], [rIn * 1.12, w / 2], [rIn, w / 2]].map(p => new THREE.Vector2(p[0], p[1])), 40), 'steel', {}));
      g.children[0].rotation.x = PI / 2;
      g.add(cyl(rOut, rOut, w, 'steel', { axis: 'z', seg: 40, mat: { roughness: 0.2 } }));
      g.add(cyl(rOut * 0.86, rOut * 0.86, w * 1.02, shield || 'red', { axis: 'z', seg: 40, mat: { roughness: 0.6 } }));
      g.add(cyl(rIn * 1.1, rIn * 1.1, w * 1.04, 'steelDark', { axis: 'z', seg: 32 }));
      return g;
    };
  });
})();
