// Low-poly toy "hidden immunity idol" (fan tribute): a glossy round green jade disc with a carved
// rosette, hung from a long, lazy, asymmetric draped strand of chunky wooden, bone, jade, purple and
// turquoise beads and cowrie shells (a tilted 3D loop that crosses itself near the pendant).
// Front face points +X+Z (yaw 45deg). autoRotate:false.
export default function build(THREE, { lam }) {
  const group = new THREE.Group();
  const yawG = new THREE.Group(); // sway in yaw
  const swingG = new THREE.Group(); // tiny pendulum roll about the top of the necklace
  group.add(yawG);
  yawG.add(swingG);
  const PIVOT_Y = 1.7;
  swingG.position.y = PIVOT_Y;
  const root = new THREE.Group();
  root.position.set(-0.32, -PIVOT_Y, 0);
  swingG.add(root);

  const JADE = lam(0x4f9a78);
  const JADE_HI = lam(0x86d1ab);
  const JADE_LO = lam(0x2f6b52);
  const GOLD = lam(0xd9ae3f);
  const TAN = lam(0xc9a66b);
  const WOOD_D = lam(0x8a5530);
  const WOOD_L = lam(0xb27a45);
  const BONE = lam(0xefe0b8);
  const JADE_B = lam(0x5fb08b);
  const PURPLE = lam(0x7b4fb0);
  const TURQ = lam(0x38b2c8);
  const COWRIE = lam(0xf4ead2);
  const SLIT = lam(0x5a3b28);

  // ---------------- pendant (round jade disc) ----------------
  const PR = 0.8; // disc radius (1.6 diameter)
  const TH = 0.14; // extrusion depth (+ bevels = 0.22 total)
  const BV = 0.04;
  const FZ = TH / 2 + BV; // front face z (0.11)
  const PY = -0.85; // disc centre y
  const pend = new THREE.Group();
  pend.position.y = PY;
  root.add(pend);

  function disc(r) {
    const s = new THREE.Shape();
    s.absarc(0, 0, r, 0, Math.PI * 2, false);
    return s;
  }
  function ext(shape, depth, mat, z, bevel) {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: !!bevel,
      bevelThickness: bevel || 0,
      bevelSize: bevel || 0,
      bevelSegments: bevel ? 1 : 0,
      curveSegments: 24,
    });
    const m = new THREE.Mesh(g, mat);
    m.position.z = z;
    pend.add(m);
    return m;
  }

  // body: bevelled round plate, centred in z
  ext(disc(PR - BV), TH, JADE, -TH / 2, BV);

  // deep recessed field
  const FIELD = 0.65;
  ext(disc(FIELD), 0.012, JADE_LO, FZ - 0.002);
  // raised outer ring (front)
  {
    const s = disc(0.735);
    s.holes.push(disc(FIELD + 0.01));
    ext(s, 0.036, JADE_HI, FZ - 0.003);
  }
  // thin inner line
  {
    const s = disc(FIELD - 0.005);
    s.holes.push(disc(FIELD - 0.045));
    ext(s, 0.028, JADE_HI, FZ + 0.007);
  }

  const ZC = FZ + 0.012; // carving base
  function bar(x, y, w, h, rot) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), JADE_HI);
    m.position.set(x, y, ZC + 0.012);
    m.rotation.z = rot;
    pend.add(m);
    return m;
  }

  // central rosette
  const rosette = new THREE.Group();
  rosette.position.set(0, 0, ZC);
  pend.add(rosette);
  {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.036, 5, 16), JADE_HI);
    ring.position.z = 0.02;
    rosette.add(ring);
    const petalG = new THREE.SphereGeometry(1, 6, 4);
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 8 + (i * Math.PI) / 4;
      const p = new THREE.Mesh(petalG, JADE_HI);
      p.scale.set(0.135, 0.075, 0.045); // long axis radial (x)
      p.position.set(Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0.02);
      p.rotation.z = a;
      rosette.add(p);
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.02, 4, 3), JADE_LO);
      d.position.set(Math.cos(a) * 0.46, Math.sin(a) * 0.46, 0.05);
      rosette.add(d);
    }
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 7), JADE_HI);
    dome.scale.z = 0.55;
    dome.position.z = 0.02;
    rosette.add(dome);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), JADE_B);
    tip.position.z = 0.1;
    rosette.add(tip);
  }
  // 8 spokes + 8 outer leaves (radial pattern) + ring of 16 dots near the rim
  const leafG = new THREE.SphereGeometry(1, 6, 4);
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    const r0 = 0.27, r1 = 0.4, rm = (r0 + r1) / 2;
    bar(Math.cos(a) * rm, Math.sin(a) * rm, r1 - r0, 0.04, a);
    const leaf = new THREE.Mesh(leafG, JADE_HI);
    leaf.scale.set(0.085, 0.05, 0.035);
    leaf.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, ZC + 0.015);
    leaf.rotation.z = a;
    pend.add(leaf);
  }
  const dotG = new THREE.SphereGeometry(0.024, 4, 3);
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI) / 8 + Math.PI / 16;
    const d = new THREE.Mesh(dotG, k % 2 ? JADE_B : JADE_HI);
    d.position.set(Math.cos(a) * 0.585, Math.sin(a) * 0.585, ZC + 0.012);
    pend.add(d);
  }

  // back: plain jade with one simple raised ring
  {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.045, 4, 20), JADE_HI);
    ring.position.z = -(FZ + 0.01);
    pend.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 3, 24), JADE_HI);
    ring2.position.z = -(FZ + 0.005);
    pend.add(ring2);
  }

  // gold eyelet at the top
  const TOP = PY + PR;
  {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.1, 8), GOLD);
    base.position.set(0, TOP + 0.01, 0);
    root.add(base);
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.036, 6, 14), GOLD);
    eye.position.set(0, TOP + 0.13, 0);
    root.add(eye);
  }
  const EYE_Y = TOP + 0.13;

  // ---------------- necklace: one long lazy asymmetric drape ----------------
  const FOCAL_Y = TOP + 0.8;
  const TILT = -0.66; // radians about X: top of the strand's plane leans back, so we see it from above
  const US = 0.88; // overall footprint scale of the drape
  // (u right, v up, w out of the strand's plane) relative to the focal bead
  const path = [
    [0, 0, 0],
    [-0.5, 0.22, 0.08],
    [-0.78, 0.7, 0.12],
    [-0.45, 1.2, 0.1],
    [0.15, 1.32, 0.04],
    [0.62, 1.0, 0.2],
    [0.95, 0.55, 0.3], // first pass of the crossing (in front)
    [1.4, 0.0, 0.18],
    [1.65, -0.5, 0.0],
    [2.0, -0.65, -0.1],
    [2.15, -0.15, -0.15],
    [2.1, 0.55, -0.1],
    [1.8, 1.15, 0.0],
    [1.3, 1.4, 0.1],
    [1.05, 1.05, -0.15],
    [0.9, 0.55, -0.3], // second pass of the crossing (behind)
    [0.55, 0.25, -0.18],
  ];
  const cosT = Math.cos(TILT), sinT = Math.sin(TILT);
  const pts = path.map(([u, v, w]) => {
    const x = u * US, y = v * US, z = w;
    return new THREE.Vector3(x, y * cosT - z * sinT, y * sinT + z * cosT);
  });
  const loop = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  loop.arcLengthDivisions = 800;
  const L = loop.getLength();
  const planeN = new THREE.Vector3(0, -sinT, cosT).multiplyScalar(1); // tilted plane normal

  const necklace = new THREE.Group();
  necklace.position.set(0, FOCAL_Y, 0);
  root.add(necklace);
  necklace.add(new THREE.Mesh(new THREE.TubeGeometry(loop, 70, 0.04, 3, true), TAN));

  const sphLo = new THREE.SphereGeometry(1, 7, 5);
  const tubeGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.32, 7);
  const seq = ['wd', 'tube', 'wl', 'jade', 'tube', 'purple', 'cowrie', 'wd', 'tube', 'wl', 'jade', 'tube', 'turq', 'wl'];
  const GAP = 0.4;
  const N = Math.round((L - 2 * GAP) / 0.18);
  const spacing = (L - 2 * GAP) / N;
  const basis = new THREE.Matrix4();
  const _x = new THREE.Vector3(), _z = new THREE.Vector3();
  function bead(kind, p, tg) {
    // orient: local Y along the tangent, local Z toward the viewer-ish plane normal
    _z.copy(planeN).addScaledVector(tg, -planeN.dot(tg)).normalize();
    _x.crossVectors(tg, _z).normalize();
    basis.makeBasis(_x, tg, _z);
    let m;
    if (kind === 'tube') {
      m = new THREE.Mesh(tubeGeo, BONE);
    } else if (kind === 'cowrie') {
      m = new THREE.Group();
      const e = new THREE.Mesh(sphLo, COWRIE);
      e.scale.set(0.15, 0.215, 0.115);
      m.add(e);
      for (const z of [1, -1]) {
        const sl = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.27, 0.014), SLIT);
        sl.position.z = z * 0.112;
        m.add(sl);
      }
    } else {
      const spec = {
        wd: [0.16, WOOD_D], wl: [0.145, WOOD_L], jade: [0.15, JADE_B],
        purple: [0.135, PURPLE], turq: [0.135, TURQ],
      }[kind];
      m = new THREE.Mesh(sphLo, spec[1]);
      m.scale.setScalar(spec[0]);
    }
    m.quaternion.setFromRotationMatrix(basis);
    m.position.copy(p);
    necklace.add(m);
  }
  for (let i = 0; i < N; i++) {
    const u = (GAP + (i + 0.5) * spacing) / L;
    bead(seq[i % seq.length], loop.getPointAt(u), loop.getTangentAt(u));
  }

  // focal bead + two jade beads under it
  const focal = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8), WOOD_D);
  focal.position.set(0, FOCAL_Y, 0);
  root.add(focal);
  const j1 = FOCAL_Y - 0.3, j2 = j1 - 0.2;
  for (const y of [j1, j2]) {
    const b = new THREE.Mesh(sphLo, JADE_B);
    b.scale.setScalar(0.125);
    b.position.set(0, y, 0);
    root.add(b);
  }
  // cord from the lowest jade bead to the eyelet
  {
    const top = j2 - 0.05, bot = EYE_Y;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, top - bot, 5), TAN);
    c.position.set(0, (top + bot) / 2, 0);
    root.add(c);
  }

  // little tassel hanging in front of the top of the disc
  const tassel = new THREE.Group();
  tassel.position.set(0, j2 - 0.1, 0.17);
  root.add(tassel);
  {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), GOLD);
    tassel.add(cap);
    const n = 6, len = 0.42;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1) - 0.5;
      const g = new THREE.Group();
      g.rotation.z = f * 0.55;
      const l = len * (1 - Math.abs(f) * 0.25);
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.022, l, 4), TAN);
      cyl.position.y = -0.04 - l / 2;
      g.add(cyl);
      g.position.z = (i % 2) * 0.012;
      tassel.add(g);
    }
  }

  yawG.rotation.y = Math.PI / 4;

  function update(dt, t) {
    yawG.rotation.y = Math.PI / 4 + Math.sin(t * 0.6) * 0.45;
    swingG.rotation.z = Math.sin(t * 0.9) * 0.04;
    const k = 1 + 0.06 * (0.5 + 0.5 * Math.sin((t / 3) * Math.PI * 2));
    rosette.scale.setScalar(k);
  }

  return { group, update, autoRotate: false, parts: { rosette } };
}
