// Elric brothers' human transmutation circle (Fullmetal Alchemist: Brotherhood), raised gold line-work lying flat
// on a dark board, plus a floating Philosopher's Stone above the centre.
// Layout is authored in "reference pixels" (1000x1000 canvas, centre 500,500, outer ring radius 450) and scaled down.
export default function build(THREE, { lam }) {
  const GOLD = 0xf2c94c;
  const group = new THREE.Group();
  const goldMat = lam(GOLD);
  const Y = -1.1;
  const R = 1.7; // outer ring radius
  const S = R / 450; // px -> world
  const H = 0.035; // line height
  const TAU = Math.PI * 2;

  // Dark board under the circle
  const board = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.1, R + 0.1, 0.06, 48), lam(0x5a2a22));
  board.position.y = Y - 0.06;
  group.add(board);

  const circle = new THREE.Group();
  circle.position.y = Y;
  group.add(circle);

  // ---- tiny geometry builder: top face + side walls only (underside is never visible) ----
  function Builder() {
    const pos = [];
    const nor = [];
    const quad = (a, b, c, d, n) => {
      // a,b,c,d counter-clockwise seen from outside
      for (const p of [a, b, c, a, c, d]) {
        pos.push(p[0], p[1], p[2]);
        nor.push(n[0], n[1], n[2]);
      }
    };
    const P = (x, z, y) => [(x - 500) * S, y, (z - 500) * S];
    const api = {
      // straight bar from (x1,z1) to (x2,z2) in px, width w px
      bar(x1, z1, x2, z2, w) {
        const dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz) || 1;
        const nx = (-dz / L) * (w / 2), nz = (dx / L) * (w / 2);
        const a0 = P(x1 + nx, z1 + nz, 0), b0 = P(x2 + nx, z2 + nz, 0);
        const c0 = P(x2 - nx, z2 - nz, 0), d0 = P(x1 - nx, z1 - nz, 0);
        const a1 = P(x1 + nx, z1 + nz, H), b1 = P(x2 + nx, z2 + nz, H);
        const c1 = P(x2 - nx, z2 - nz, H), d1 = P(x1 - nx, z1 - nz, H);
        quad(d1, c1, b1, a1, [0, 1, 0]);
        const sn = [-dz / L, 0, dx / L]; // side a-b
        quad(a0, b0, b1, a1, [sn[0], 0, sn[2]].map((v) => v));
        quad(c0, d0, d1, c1, [-sn[0], 0, -sn[2]]);
        quad(b0, c0, c1, b1, [dx / L, 0, dz / L]);
        quad(d0, a0, a1, d1, [-dx / L, 0, -dz / L]);
      },
      // arc (or full ring) centred (cx,cz) radius r px, from angle a0 to a1 (radians), width w px
      arc(cx, cz, r, a0, a1, w, segs) {
        const ri = r - w / 2, ro = r + w / 2;
        for (let i = 0; i < segs; i++) {
          const t0 = a0 + ((a1 - a0) * i) / segs, t1 = a0 + ((a1 - a0) * (i + 1)) / segs;
          const c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
          const io0 = P(cx + ro * c0, cz + ro * s0, H), io1 = P(cx + ro * c1, cz + ro * s1, H);
          const ii0 = P(cx + ri * c0, cz + ri * s0, H), ii1 = P(cx + ri * c1, cz + ri * s1, H);
          const bo0 = P(cx + ro * c0, cz + ro * s0, 0), bo1 = P(cx + ro * c1, cz + ro * s1, 0);
          const bi0 = P(cx + ri * c0, cz + ri * s0, 0), bi1 = P(cx + ri * c1, cz + ri * s1, 0);
          quad(ii0, io0, io1, ii1, [0, 1, 0]);
          const cm = Math.cos((t0 + t1) / 2), sm = Math.sin((t0 + t1) / 2);
          quad(bo0, bo1, io1, io0, [cm, 0, sm]); // outer wall (z is image-down, x right)
          quad(bi1, bi0, ii0, ii1, [-cm, 0, -sm]); // inner wall
        }
      },
      ring(cx, cz, r, w, segs) {
        api.arc(cx, cz, r, 0, TAU, w, segs);
      },
      dot(x, z, s) {
        api.bar(x - s / 2, z, x + s / 2, z, s);
      },
      geometry() {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
        // camera sits at azimuth 45deg: bake that yaw in so the triangle's tip points at the viewer and the picture reads upright
        g.rotateY(Math.PI / 4);
        return g;
      },
    };
    return api;
  }

  // helpers in the px frame; "up" in the picture is -z (image y grows downward)
  const rad = (d) => (d * Math.PI) / 180;
  const pol = (deg, r) => [500 + r * Math.cos(rad(deg)), 500 - r * Math.sin(rad(deg))];
  const CIRC_R = 365; // radius of the circle the hexagon / triangle are inscribed in
  const WT = 15; // thick line
  const WM = 11; // medium
  const WN = 7.5; // thin

  const b = Builder();

  // ---- outer rings: thin, thick, then the glyph band is closed by the inscribed circle ----
  b.ring(500, 500, 450, WN, 48);
  b.ring(500, 500, 436, WT, 48);
  b.ring(500, 500, CIRC_R, WT, 48);

  // ---- hexagon (regular, point up) + inverted triangle sharing three of its vertices ----
  const hexAng = [90, 30, -30, -90, -150, 150]; // T, UR, LR, B, LL, UL
  const V = hexAng.map((a) => pol(a, CIRC_R));
  for (let i = 0; i < 6; i++) {
    const p = V[i], q = V[(i + 1) % 6];
    b.bar(p[0], p[1], q[0], q[1], WM);
  }
  const UL = V[5], UR = V[1], B = V[3];
  b.bar(UL[0], UL[1], UR[0], UR[1], WT);
  b.bar(UR[0], UR[1], B[0], B[1], WT);
  b.bar(B[0], B[1], UL[0], UL[1], WT);

  // ---- thin ring inside the hexagon ----
  b.ring(500, 500, 305, WN, 40);

  // ---- three double arcs hugging the triangle's corners ----
  for (const v of [UL, UR, B]) {
    const toC = Math.atan2(500 - v[1], 500 - v[0]);
    const a0 = toC - rad(62), a1 = toC + rad(62);
    b.arc(v[0], v[1], 128, a0, a1, WN + 1, 10);
    b.arc(v[0], v[1], 146, a0, a1, WN + 1, 10);
  }

  // ---- centre circle (double ring) ----
  b.ring(500, 500, 102, WM, 36);
  b.ring(500, 500, 88, WN, 32);

  // ---- spokes from centre circle out to the six hexagon corners (broken around the small circles) ----
  const smallAng = [90, 210, 330]; // top, lower-left, lower-right
  for (const a of hexAng) {
    const hasCircle = smallAng.includes(((a % 360) + 360) % 360);
    const p0 = pol(a, 110), p1 = pol(a, CIRC_R);
    if (!hasCircle) {
      b.bar(p0[0], p0[1], p1[0], p1[1], WN);
    } else {
      const m0 = pol(a, 242), m1 = pol(a, 130);
      b.bar(p0[0], p0[1], m1[0], m1[1], WN);
      b.bar(m0[0], m0[1], p1[0], p1[1], WN);
    }
  }

  // ---- three small circles holding glyphs ----
  const SC_R = 185, SC_RAD = 56;
  const sc = smallAng.map((a) => pol(a, SC_R));
  for (const [x, z] of sc) b.ring(x, z, SC_RAD, WN + 1.5, 24);

  // inner glyphs (simplified from the references)
  {
    // top: circle with three small arrow bars
    const [x, z] = sc[0];
    b.ring(x, z - 4, 17, 8, 12);
    b.bar(x, z - 26, x, z - 38, 7);
    b.bar(x - 20, z - 20, x - 32, z - 30, 7);
    b.bar(x + 20, z - 20, x + 32, z - 30, 7);
    b.bar(x - 30, z + 22, x - 20, z + 10, 7);
    b.bar(x + 30, z + 22, x + 20, z + 10, 7);
    b.bar(x, z + 14, x, z + 28, 7);
    // lower-left: spiral-ish "5" with arrow
    const [lx, lz] = sc[1];
    b.arc(lx - 2, lz + 6, 17, rad(-40), rad(250), 8, 14);
    b.arc(lx + 12, lz + 22, 9, rad(100), rad(380), 8, 8);
    b.bar(lx - 18, lz - 28, lx + 2, lz - 28, 7);
    b.bar(lx + 2, lz - 28, lx + 2, lz - 6, 7);
    b.bar(lx - 6, lz + 6, lx + 10, lz - 8, 7);
    // lower-right: ring with a stem and arm
    const [rx, rz] = sc[2];
    b.arc(rx, rz, 15, rad(200), rad(520), 8, 14);
    b.bar(rx, rz + 14, rx, rz + 34, 7);
    b.bar(rx - 12, rz + 34, rx + 12, rz + 34, 7);
    b.bar(rx + 4, rz - 22, rx + 26, rz - 28, 7);
    b.bar(rx - 28, rz - 20, rx - 8, rz - 12, 7);
    b.bar(rx - 28, rz - 20, rx - 18, rz - 32, 7);
  }

  // ---- outer glyph band: one glyph at every hexagon corner, radius ~400 px ----
  const GR = 402;
  const gp = hexAng.map((a) => pol(a, GR));
  {
    // top (T): vertical bar with crossbars and a small C
    const [x, z] = gp[0];
    b.bar(x, z - 22, x, z + 22, 8);
    b.bar(x - 20, z - 12, x + 20, z - 12, 8);
    b.bar(x - 20, z + 14, x + 14, z + 14, 8);
    b.arc(x + 2, z, 18, rad(100), rad(260), 8, 8);
    // UR: circle with dot (sun-like)
    const [ux, uz] = gp[1];
    b.arc(ux, uz, 20, rad(30), rad(400), 9, 14);
    b.dot(ux, uz, 9);
    // LR: U-cup with a cross
    const [rx, rz] = gp[2];
    b.arc(rx, rz - 6, 18, rad(0), rad(180), 9, 10);
    b.bar(rx - 18, rz - 6, rx - 18, rz - 22, 8);
    b.bar(rx + 18, rz - 6, rx + 18, rz - 22, 8);
    b.bar(rx, rz + 8, rx, rz + 28, 8);
    b.bar(rx - 10, rz + 18, rx + 10, rz + 18, 8);
    // B: asterisk (matches the reference's star glyph)
    const [bx, bz] = gp[3];
    for (const a of [0, 60, 120]) {
      const dx = Math.cos(rad(a)) * 20, dz = Math.sin(rad(a)) * 20;
      b.bar(bx - dx, bz - dz, bx + dx, bz + dz, 7);
    }
    b.dot(bx, bz, 9);
    // LL: circle-dot with arrow tail (earth/venus-like)
    const [lx, lz] = gp[4];
    b.arc(lx, lz, 17, 0, TAU, 8, 14);
    b.dot(lx, lz, 7);
    b.bar(lx + 12, lz + 12, lx + 30, lz + 26, 7);
    b.bar(lx + 30, lz + 26, lx + 22, lz + 26, 7);
    b.bar(lx + 30, lz + 26, lx + 30, lz + 18, 7);
    // UL: circle with a small "H" mark
    const [ax, az] = gp[5];
    b.arc(ax - 6, az, 17, 0, TAU, 8, 14);
    b.bar(ax + 12, az - 10, ax + 12, az + 6, 7);
    b.bar(ax + 24, az - 10, ax + 24, az + 6, 7);
    b.bar(ax + 12, az - 2, ax + 24, az - 2, 7);
  }

  const staticMesh = new THREE.Mesh(b.geometry(), goldMat);
  circle.add(staticMesh);

  // ---- centre asterisk (6 spokes inside the centre circle) turns slowly; it is rotationally symmetric ----
  const spinner = new THREE.Group();
  circle.add(spinner);
  {
    const sb = Builder();
    for (const a of [0, 60, 120]) {
      const p0 = pol(a, 82), p1 = pol(a + 180, 82);
      sb.bar(p0[0], p0[1], p1[0], p1[1], WN);
    }
    spinner.add(new THREE.Mesh(sb.geometry(), goldMat));
  }

  // ---- Philosopher's Stone ----
  const stoneRoot = new THREE.Group();
  stoneRoot.position.y = 0.5;
  group.add(stoneRoot);

  const stoneMat = new THREE.MeshLambertMaterial({
    color: 0xd8342f,
    emissive: 0x5a0f0f,
    flatShading: true,
  });
  const stone = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), stoneMat);
  stone.scale.set(0.8, 1.05, 0.8);
  stoneRoot.add(stone);

  // Orbiting gold specks
  const speckGeo = new THREE.OctahedronGeometry(0.06, 0);
  const specks = [];
  const N = 4;
  for (let i = 0; i < N; i++) {
    const s = new THREE.Mesh(speckGeo, goldMat);
    stoneRoot.add(s);
    specks.push({ mesh: s, phase: (i / N) * TAU, rad: 0.85 + (i % 2) * 0.15, tilt: i % 2 ? 0.35 : -0.25, spd: 1.4 + i * 0.15 });
  }

  function update(dt, t) {
    stoneRoot.position.y = 0.5 + Math.sin(t * 1.6) * 0.1;
    stone.rotation.y += dt * 1.1;

    for (const s of specks) {
      const a = s.phase + t * s.spd;
      s.mesh.position.set(Math.cos(a) * s.rad, Math.sin(a * 1.3) * 0.2 + s.tilt, Math.sin(a) * s.rad);
      s.mesh.rotation.y = a * 2;
    }

    spinner.rotation.y = -t * 0.3;
  }

  update(0, 0);

  return { group, update, autoRotate: false, parts: { stone: stoneRoot, circle, spinner } };
}
