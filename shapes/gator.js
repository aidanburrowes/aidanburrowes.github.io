// Low-poly toy alligator in Gator orange / cream / blue. Faces +X, nose-to-tail ~3.2 along X.
export default function build(THREE, { lam }) {
  const group = new THREE.Group();

  const ORANGE = lam(0xfa4616);
  const CREAM = lam(0xffd2b0);
  const BLUE = lam(0x0021a5);
  const WHITE = lam(0xffffff);
  const DARK = lam(0x1b1b2f);
  BLUE.flatShading = true;
  WHITE.flatShading = true;
  CREAM.flatShading = true;
  ORANGE.flatShading = true;

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const spikeGeo = new THREE.ConeGeometry(0.075, 0.17, 3);
  const toothGeo = new THREE.ConeGeometry(0.028, 0.06, 3);
  const eyeGeo = new THREE.SphereGeometry(1, 8, 6);

  function box(parent, mat, w, h, d, x, y, z) {
    const m = new THREE.Mesh(boxGeo, mat);
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  function ball(parent, mat, r, x, y, z) {
    const m = new THREE.Mesh(eyeGeo, mat);
    m.scale.setScalar(r);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  function spike(parent, x, y, s) {
    const m = new THREE.Mesh(spikeGeo, BLUE);
    m.position.set(x, y + 0.085 * s, 0);
    m.scale.set(s, s, s * 0.7);
    parent.add(m);
    return m;
  }

  // ---- Torso (breathes) ----
  const TY = -0.375;
  const torso = new THREE.Group();
  torso.position.set(0, TY, 0);
  group.add(torso);
  box(torso, ORANGE, 1.4, 0.55, 0.85, 0, 0, 0);
  box(torso, CREAM, 1.42, 0.2, 0.86, 0, -0.175, 0); // belly band (bottom -0.275 local)
  for (let i = 0; i < 5; i++) {
    spike(torso, -0.5 + i * 0.25, 0.275, i === 2 ? 1.1 : 1.0);
  }

  // ---- Legs ----
  const legX = [0.45, -0.45];
  const legZ = [0.47, -0.47];
  for (const lx of legX) {
    for (const lz of legZ) {
      box(group, ORANGE, 0.28, 0.34, 0.28, lx, -0.77, lz);
      box(group, CREAM, 0.38, 0.08, 0.4, lx + 0.04, -0.96, lz + Math.sign(lz) * 0.04);
    }
  }

  // ---- Head ----
  const head = new THREE.Group();
  group.add(head);
  box(head, ORANGE, 0.55, 0.5, 0.8, 0.78, -0.3, 0); // skull
  box(head, ORANGE, 0.62, 0.22, 0.6, 1.29, -0.2, 0); // upper snout (x 0.98..1.6)
  box(head, CREAM, 0.6, 0.16, 0.56, 1.28, -0.40, 0); // lower jaw
  box(head, CREAM, 0.5, 0.08, 0.7, 0.8, -0.58, 0); // throat

  // smile line (closed mouth), both sides + front
  for (const s of [1, -1]) {
    box(head, DARK, 0.62, 0.026, 0.02, 1.29, -0.315, s * 0.301);
    const up = box(head, DARK, 0.12, 0.026, 0.02, 0.98, -0.30, s * 0.301);
    up.rotation.z = 0.7;
    // teeth along upper jaw edge
    for (let i = 0; i < 5; i++) {
      const t = new THREE.Mesh(toothGeo, WHITE);
      t.rotation.x = Math.PI; // point down
      t.position.set(1.12 + i * 0.1, -0.342, s * 0.285);
      head.add(t);
    }
  }
  box(head, DARK, 0.012, 0.026, 0.6, 1.602, -0.315, 0);

  // nostrils
  for (const s of [1, -1]) {
    const n = ball(head, DARK, 0.035, 1.5, -0.085, s * 0.13);
    n.scale.set(0.04, 0.025, 0.04);
  }

  // eyes
  for (const s of [1, -1]) {
    ball(head, BLUE, 0.13, 0.84, 0.0, s * 0.27);
    ball(head, WHITE, 0.1, 0.89, 0.04, s * 0.27);
    ball(head, DARK, 0.05, 0.97, 0.05, s * 0.27);
  }
  // head spikes (small)
  spike(head, 0.64, -0.05, 0.7);

  // ---- Tail: 5 tapering segments nested, sweeping toward +Z ----
  const lens = [0.27, 0.25, 0.23, 0.21, 0.19];
  const hs = [0.4, 0.34, 0.28, 0.22, 0.16];
  const ws = [0.6, 0.5, 0.4, 0.3, 0.2];
  const baseBend = 0.25;
  const tailSegs = [];
  let parent = group;
  for (let i = 0; i < 5; i++) {
    const seg = new THREE.Group();
    if (i === 0) seg.position.set(-0.63, -0.4, 0);
    else seg.position.set(-lens[i - 1], 0, 0);
    seg.rotation.y = baseBend;
    parent.add(seg);
    // body extends toward -X (slight overlap to hide seams)
    box(seg, ORANGE, lens[i] + 0.03, hs[i], ws[i], -lens[i] / 2 + 0.0, 0, 0);
    box(seg, CREAM, lens[i] + 0.02, hs[i] * 0.3, ws[i] + 0.01, -lens[i] / 2, -hs[i] * 0.35, 0);
    spike(seg, -lens[i] * 0.5, hs[i] / 2, 1.0 - i * 0.12);
    tailSegs.push(seg);
    parent = seg;
  }

  const baseAngles = tailSegs.map(() => baseBend);

  function update(dt, t) {
    for (let i = 0; i < tailSegs.length; i++) {
      tailSegs[i].rotation.y = baseAngles[i] + 0.07 * Math.sin(t * 2.0 - i * 0.7);
    }
    const b = 1 + 0.015 * Math.sin(t * 1.6);
    torso.scale.set(b, b, b);
  }

  return { group, update, autoRotate: true, parts: { head, torso, tail: tailSegs } };
}
