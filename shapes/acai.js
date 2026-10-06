// Acai bowl: ceramic bowl, purple mound, 6 distinct toppings (parts.toppings[0..5]).
export default function build(THREE, { lam }) {
  const group = new THREE.Group();

  // deterministic LCG
  let seed = 20240607;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    return m;
  };

  // ---------- bowl ----------
  const V = (x, y) => new THREE.Vector2(x, y);
  const bowlMat = lam(0xf3ead8);
  bowlMat.side = THREE.DoubleSide;
  bowlMat.flatShading = true;
  const bowlProfile = [
    V(0.0, -1.1), V(0.62, -1.1), V(0.72, -1.02), V(0.78, -0.92),
    V(1.12, -0.82), V(1.42, -0.6), V(1.54, -0.4), V(1.6, -0.2),
    V(1.5, -0.2), V(1.42, -0.4), V(1.2, -0.58), V(0.8, -0.7), V(0.0, -0.74),
  ];
  group.add(new THREE.Mesh(new THREE.LatheGeometry(bowlProfile, 24), bowlMat));

  // slightly darker rim band
  const bandMat = lam(0xe0d3b8);
  bandMat.side = THREE.DoubleSide;
  bandMat.flatShading = true;
  const bandProfile = [V(1.55, -0.36), V(1.625, -0.2), V(1.62, -0.17), V(1.5, -0.17), V(1.46, -0.3)];
  group.add(new THREE.Mesh(new THREE.LatheGeometry(bandProfile, 24), bandMat));

  // ---------- maroon acai mound (spherical cap) ----------
  const R = 2.56, cy = -2.31; // top at y = 0.25, meets rim level at r ~ 1.45
  const surf = (r) => cy + Math.sqrt(R * R - r * r);
  const baseTheta = Math.asin(1.46 / R);
  group.add(mesh(new THREE.SphereGeometry(R, 28, 8, 0, Math.PI * 2, 0, baseTheta), lam(0x5a1633), 0, cy, 0));
  const topTheta = Math.asin(1.0 / R);
  group.add(mesh(new THREE.SphereGeometry(R + 0.012, 28, 8, 0, Math.PI * 2, 0, topTheta), lam(0x6e2142), 0, cy, 0));

  // ---------- toppings ----------
  const up = new THREE.Vector3(0, 1, 0);
  const place = (g, angle, r, yaw) => {
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const y = surf(r) - 0.015;
    const n = new THREE.Vector3(x, y - cy, z).normalize();
    const tilt = new THREE.Quaternion().setFromUnitVectors(up, n);
    const yq = new THREE.Quaternion().setFromAxisAngle(up, yaw);
    g.quaternion.copy(tilt).multiply(yq);
    g.position.set(x, y, z);
    group.add(g);
    return g;
  };
  const toppings = [];
  const step = (Math.PI * 2) / 6;
  const a0 = 0.35;
  const ringR = 0.88;

  // 0 banana slices
  {
    const g = new THREE.Group();
    const mat = lam(0xf3dc8e);
    const geo = new THREE.CylinderGeometry(0.2, 0.2, 0.07, 10);
    const core = lam(0xdcb85a);
    const coreGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.075, 6);
    for (let i = 0; i < 4; i++) {
      const pivot = new THREE.Group();
      pivot.position.set((i - 1.5) * 0.15, 0.19, (i % 2) * 0.03);
      pivot.rotation.y = (i - 1.5) * 0.22;
      const coin = new THREE.Group();
      coin.rotation.z = Math.PI / 2 - 0.28;
      coin.add(new THREE.Mesh(geo, mat));
      coin.add(new THREE.Mesh(coreGeo, core));
      pivot.add(coin);
      g.add(pivot);
    }
    toppings.push(place(g, a0, ringR, 0.5));
  }

  // 1 strawberry
  {
    const g = new THREE.Group();
    const red = lam(0xe5484d);
    red.flatShading = true;
    const body = mesh(new THREE.SphereGeometry(0.22, 8, 6), red, 0, 0.36, 0);
    body.scale.set(1, 0.9, 1);
    g.add(body);
    const tip = mesh(new THREE.ConeGeometry(0.22, 0.34, 8), red, 0, 0.17, 0);
    tip.rotation.x = Math.PI;
    g.add(tip);
    const leafMat = lam(0x5fae4a);
    const leafGeo = new THREE.ConeGeometry(0.06, 0.16, 4);
    for (let i = 0; i < 2; i++) {
      const lf = mesh(leafGeo, leafMat, (i ? 1 : -1) * 0.07, 0.56, 0);
      lf.rotation.z = (i ? -1 : 1) * 1.15;
      g.add(lf);
    }
    const seedMat = lam(0xf6e08a);
    const seedGeo = new THREE.BoxGeometry(0.035, 0.035, 0.035);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05;
      const sy = 0.26 + (i % 3) * 0.1;
      g.add(mesh(seedGeo, seedMat, Math.cos(a) * 0.21, sy, Math.sin(a) * 0.21));
    }
    g.children[g.children.length - 1].rotation.y = 0.4;
    g.rotation.z = 0.12;
    toppings.push(place(g, a0 + step, ringR, 0.8));
  }

  // 2 blueberries
  {
    const g = new THREE.Group();
    const mat = lam(0x4a63c9);
    const geo = new THREE.SphereGeometry(0.13, 8, 6);
    const crownMat = lam(0x2a3a8a);
    const crownGeo = new THREE.ConeGeometry(0.04, 0.03, 5);
    const pos = [[-0.14, 0.12, -0.08], [0.13, 0.12, -0.1], [0.0, 0.12, 0.15], [-0.02, 0.3, -0.02], [0.2, 0.12, 0.12]];
    pos.forEach((p) => {
      g.add(mesh(geo, mat, p[0], p[1], p[2]));
      g.add(mesh(crownGeo, crownMat, p[0], p[1] + 0.125, p[2]));
    });
    toppings.push(place(g, a0 + step * 2, ringR, 0.2));
  }

  // 3 granola clumps
  {
    const g = new THREE.Group();
    const mats = [lam(0xc9965a), lam(0xb5823f), lam(0xd8aa6e)];
    mats.forEach((m) => (m.flatShading = true));
    const geo = new THREE.DodecahedronGeometry(0.13, 0);
    const boxGeo = new THREE.BoxGeometry(0.2, 0.1, 0.14);
    const spots = [[-0.17, 0.1, -0.05], [0.14, 0.1, -0.12], [0.02, 0.1, 0.17], [0.0, 0.24, -0.02], [0.2, 0.09, 0.14]];
    spots.forEach((p, i) => {
      const m = mesh(i % 2 ? boxGeo : geo, mats[i % 3], p[0], p[1], p[2]);
      m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
      m.scale.set(0.85 + rnd() * 0.5, 0.8 + rnd() * 0.3, 0.85 + rnd() * 0.5);
      g.add(m);
    });
    toppings.push(place(g, a0 + step * 3, ringR, 0));
  }

  // 4 coconut flakes
  {
    const g = new THREE.Group();
    const mat = lam(0xf4ecdc);
    mat.side = THREE.DoubleSide;
    const geo = new THREE.SphereGeometry(0.26, 8, 3, 0, 3.6, 0, 0.7);
    const flakes = [
      [-0.1, 0.05, -0.08, 0.2, 0.3, 0.1],
      [0.14, 0.09, 0.0, -0.3, 1.6, 0.25],
      [0.0, 0.13, 0.15, 0.25, 3.2, -0.2],
      [-0.1, 0.17, 0.08, 0.5, 4.6, 0.15],
      [0.2, 0.06, -0.16, -0.2, 5.4, 0.2],
      [-0.2, 0.08, 0.14, 0.3, 2.4, -0.25],
    ];
    flakes.forEach((f) => {
      const m = mesh(geo, mat, f[0], f[1] - 0.2, f[2]);
      m.rotation.set(f[3] * 0.4, f[4], f[5]);
      g.add(m);
    });
    toppings.push(place(g, a0 + step * 4, ringR, 0.3));
  }

  // 5 kiwi slice
  {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 14), lam(0x8fc95a), 0, 0.1, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.066, 12), lam(0xd7f0a0), 0, 0.1, 0));
    const seedMat = lam(0x2b3a1c);
    const seedGeo = new THREE.BoxGeometry(0.03, 0.02, 0.05);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const s = mesh(seedGeo, seedMat, Math.cos(a) * 0.19, 0.136, Math.sin(a) * 0.19);
      s.rotation.y = -a;
      g.add(s);
    }
    // lean the slice so it reads from the iso camera
    const pivot = new THREE.Group();
    pivot.add(g);
    pivot.rotation.z = 0.22;
    toppings.push(place(pivot, a0 + step * 5, ringR, 0.4));
  }

  // ---------- nutella drizzle ----------
  {
    const nutMat = new THREE.MeshPhongMaterial({ color: 0x4a2a1c, specular: 0x9a7a62, shininess: 90 });
    const TR = R + 0.045; // tube centre-line sits just above the dome
    const onDome = (x, z, lift = 0) => {
      const r = Math.hypot(x, z);
      const rr = R + 0.03 + lift;
      return new THREE.Vector3(x, cy + Math.sqrt(Math.max(rr * rr - r * r, 0.01)), z);
    };
    // keep-out discs around the six topping footprints (xz plane)
    const keep = [];
    for (let k = 0; k < 6; k++) keep.push([Math.cos(a0 + step * k) * ringR, Math.sin(a0 + step * k) * ringR]);
    const KR = 0.36;
    const avoid = (p) => {
      for (let it = 0; it < 3; it++) {
        keep.forEach((c) => {
          const dx = p[0] - c[0], dz = p[1] - c[1];
          const d = Math.hypot(dx, dz);
          if (d < KR) {
            const f = d < 1e-4 ? 1 : KR / d;
            p[0] = c[0] + (d < 1e-4 ? KR : dx * f);
            p[1] = c[1] + (d < 1e-4 ? 0 : dz * f);
          }
        });
        const r = Math.hypot(p[0], p[1]);
        if (r > 1.36) { p[0] *= 1.36 / r; p[1] *= 1.36 / r; }
      }
      return p;
    };
    // zig-zag strands in polar control points, routed through the gaps between toppings
    const gap = (k) => a0 + step * (k + 0.5);
    const P = (k, r) => [Math.cos(gap(k)) * r, Math.sin(gap(k)) * r];
    const OUT = 1.3, IN = 0.42;
    const strands = [
      // out along a gap, back in, across the centre, out the next gap, round the rim...
      [P(0, OUT), P(0, IN), P(1, IN), P(1, OUT), P(2, OUT), P(2, IN)],
      [P(3, OUT), P(3, IN), P(4, IN), P(4, OUT), P(5, OUT), P(5, IN)],
    ];
    // two wavy strands crossing the whole top
    [[0.35, 0.3, 0.0], [1.5, -0.28, 2.1]].forEach(([ang, amp, ph]) => {
      const c = Math.cos(ang), sn = Math.sin(ang);
      const pts = [];
      for (let i = 0; i <= 28; i++) {
        const u = -1.3 + (2.6 * i) / 28;
        const v = amp * Math.sin(u * 7.2 + ph);
        pts.push([u * c - v * sn, u * sn + v * c]);
      }
      strands.push(pts);
    });
    strands.forEach((ctrl) => {
      const base = new THREE.CatmullRomCurve3(ctrl.map((p) => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
      let dense = base.getSpacedPoints(120).map((v) => [v.x, v.z]);
      dense = dense.map(avoid);
      for (let pass = 0; pass < 6; pass++) {
        dense = dense.map((p, i) => {
          if (i === 0 || i === dense.length - 1) return p;
          const a = dense[i - 1], b = dense[i + 1];
          return avoid([p[0] * 0.5 + (a[0] + b[0]) * 0.25, p[1] * 0.5 + (a[1] + b[1]) * 0.25]);
        });
      }
      const pts3 = dense.filter((_, i) => i % 2 === 0 || i === dense.length - 1).map((p) => onDome(p[0], p[1]));
      const curve = new THREE.CatmullRomCurve3(pts3, false, 'catmullrom', 0.5);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 52, 0.04, 8, false), nutMat);
      group.add(tube);
      [pts3[0], pts3[pts3.length - 1]].forEach((p) => {
        const cap = mesh(new THREE.SphereGeometry(0.04, 8, 6), nutMat, p.x, p.y, p.z);
        group.add(cap);
      });
    });
    // small pools on the dome (flattened blobs), in the gaps between toppings
    const pools = [[a0 + step * 0.5, 0.55, 0.15], [a0 + step * 2.5, 0.45, 0.12], [a0 + step * 4.5, 0.2, 0.13], [a0 + step * 3.5, 1.15, 0.1]];
    pools.forEach(([a, r, rad]) => {
      const p = onDome(Math.cos(a) * r, Math.sin(a) * r, -0.015);
      const blob = new THREE.Mesh(new THREE.SphereGeometry(rad, 14, 8), nutMat);
      blob.position.copy(p);
      blob.scale.set(1, 0.22, 1);
      blob.quaternion.setFromUnitVectors(up, new THREE.Vector3(p.x, p.y - cy, p.z).normalize());
      group.add(blob);
    });
    // drips running down the outer slope
    [a0 + step * 1.5, a0 + step * 3.5 + 0.2, a0 + step * 5.5].forEach((a, i) => {
      const r0 = 1.12 - i * 0.04, r1 = 1.43;
      const pts = [];
      for (let j = 0; j <= 8; j++) {
        const r = r0 + ((r1 - r0) * j) / 8;
        const aa = a + Math.sin(j * 0.9) * 0.025;
        pts.push(onDome(Math.cos(aa) * r, Math.sin(aa) * r, 0.01));
      }
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.045, 8, false), nutMat);
      group.add(tube);
      const e = pts[pts.length - 1];
      group.add(mesh(new THREE.SphereGeometry(0.075, 10, 8), nutMat, e.x, e.y - 0.02, e.z));
    });
  }

  return {
    group,
    autoRotate: true,
    parts: { toppings },
  };
}
