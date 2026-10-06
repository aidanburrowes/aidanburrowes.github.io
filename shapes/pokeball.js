export default function build(THREE, { lam }) {
  const R = 1.45;
  const RED = 0xe03a3e, WHITE = 0xf7f5ef, DARK = 0x26262c;

  const group = new THREE.Group();
  // Playful tilt is baked into the geometry/transforms (not group.rotation) so the host's
  // Y-yaw never overwrites it and Box3 stays tight.
  const TILT = -0.25;
  const ball = group;

  // band is ~1/10 of the diameter tall, flush with the sphere
  const halfBand = 0.145;
  const d = Math.asin(halfBand / R);
  const H = Math.PI / 2;
  const sph = (r, ts, tl) => {
    const g = new THREE.SphereGeometry(r, 64, 24, 0, Math.PI * 2, ts, tl);
    g.rotateZ(TILT);
    return g;
  };

  const top = new THREE.Mesh(sph(R, 0, H - d), lam(RED));
  const bottom = new THREE.Mesh(sph(R, H + d, H - d), lam(WHITE));
  const band = new THREE.Mesh(sph(R + 0.004, H - d, 2 * d), lam(DARK));
  ball.add(top, bottom, band);

  // front button, axis along tilted +X, centered exactly on the band
  const button = new THREE.Group();
  const bx = R - 0.05;
  button.position.set(bx * Math.cos(TILT), bx * Math.sin(TILT), 0);
  button.rotation.z = -Math.PI / 2 + TILT; // local +Y -> tilted +X
  ball.add(button);

  const cyl = (r, h, y, c) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 56, 1), lam(c));
    m.position.y = y;
    button.add(m);
    return m;
  };
  cyl(0.34, 0.18, -0.01, DARK);   // shallow raised housing (top at R+0.03)
  cyl(0.25, 0.11, 0.04, WHITE);   // white ring
  cyl(0.17, 0.12, 0.045, DARK);   // dark inner ring

  const pulse = new THREE.Group();
  pulse.position.y = 0.11;
  button.add(pulse);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.03, 48, 1), lam(0xffffff));
  disc.position.y = 0.01;
  pulse.add(disc);

  const parts = { button, buttonDisc: pulse, band, top, bottom };

  return {
    group,
    autoRotate: true,
    parts,
    update(dt, t) {
      const k = 0.5 - 0.5 * Math.cos((t * Math.PI * 2) / 2.5);
      const s = 1 + 0.1 * k;
      pulse.scale.set(s, 1, s);
    },
  };
}
