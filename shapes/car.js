// Rocket League OCTANE as a low-poly toy, rebuilt from reference stills.
// Faces +X. What makes an Octane an Octane (and what this model copies):
//  - a NARROW wedge body (low pointed hood, big angular windshield, short cabin set back, steep tail)
//  - a WIDE track: big exposed wheels stand well outside the body
//  - separate swept FENDER WINGS over the wheels (front: curved flaring arches, rear: flat swept fins)
//  - a bull-bar front bumper with big round spotlights and a slatted grille
//  - a red engine block + gray air scoop on the rear deck, under a wide wing held up by thin struts
//  - dark angular windows, small hood vents, blue paint with white stripes
export default function build(THREE, { lam }) {
  const group = new THREE.Group();   // the host yaws this one
  const car = new THREE.Group();     // pitched / hovering inner group
  group.add(car);

  const flat = c => { const m = lam(c); m.flatShading = true; m.side = THREE.DoubleSide; return m; };
  const BLUE = flat(0x2468ee), BLUE_D = flat(0x1a46b8), WHITE = flat(0xf3f5fa), BLACK = flat(0x16171d);
  const GLASS = flat(0x0e1733), RED = flat(0xd9362f), RED_D = flat(0xa82620), SCOOP = flat(0xc8ced8);
  const TIRE = flat(0x1c1d23), RIM = flat(0x2b2e38), SPOKE = flat(0xb7c4d6), STEEL = flat(0x9aa3b0);
  const LENS = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const ORANGE = flat(0xff8f1f), YELLOW = flat(0xffd23f), PALE = flat(0xfff1b8);

  const put = (m, x, y, z, parent = car) => { m.position.set(x, y, z); parent.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, parent) => put(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), x, y, z, parent);
  /* slab from a polygon [x,y] list, extruded along Z (centered), optional z-taper by x */
  const prism = (pts, depth, mat, x = 0, y = 0, z = 0, parent = car, bevel = 0) => {
    const s = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1 });
    g.translate(0, 0, -depth / 2);
    return put(new THREE.Mesh(g, mat), x, y, z, parent);
  };
  /* bar between two points */
  const bar = (a, b, r, mat, parent = car) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), len = va.distanceTo(vb);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), mat);
    m.position.copy(va).add(vb).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    parent.add(m); return m;
  };
  /* quad from 4 points (CCW) */
  const quad = (p, mat) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p.flat(), 3));
    g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); car.add(m); return m;
  };

  /* ── main body: side profile extruded, then narrowed toward the nose ── */
  const HW = .6; // half width of the cabin section
  const profile = [
    [1.46, -.1], [1.52, -.02], [1.5, .05],           // nose
    [.58, .24],                                         // hood slopes up to the windshield base
    [.16, .6], [-.36, .6],                              // windshield, roof
    [-.72, .34], [-1.3, .28], [-1.42, .2],             // rear glass, rear deck, tail
    [-1.4, -.1],
  ];
  const bodyShape = new THREE.Shape(profile.map(p => new THREE.Vector2(p[0], p[1])));
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: HW * 2, bevelEnabled: false });
  bodyGeo.translate(0, 0, -HW);
  { // narrow the hood/nose: shrink Z for vertices ahead of the cabin
    const pos = bodyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      if (x > .3) pos.setZ(i, pos.getZ(i) * (1 - .34 * Math.min(1, (x - .3) / 1.2)));
    }
    bodyGeo.computeVertexNormals();
  }
  put(new THREE.Mesh(bodyGeo, BLUE), 0, 0, 0);
  /* dark lower tray + side skirts */
  box(2.6, .09, HW * 2 - .12, BLACK, -.05, -.16, 0);
  box(1.6, .1, HW * 2 + .02, BLUE_D, -.1, -.08, 0);

  /* ── glass ── */
  const sideWin = [[.52, .27], [.14, .57], [-.38, .57], [-.62, .4], [-.55, .31]];
  prism(sideWin, .02, GLASS, 0, 0, HW + .004);
  prism(sideWin, .02, GLASS, 0, 0, -(HW + .004));
  quad([[.6, .25, -.5], [.6, .25, .5], [.18, .615, .43], [.18, .615, -.43]], GLASS);          // windshield
  quad([[-.4, .615, -.42], [-.4, .615, .42], [-.74, .355, .4], [-.74, .355, -.4]], GLASS);   // rear glass

  /* ── white stripes down the hood and roof ── */
  {
    const dx = .58 - 1.5, dy = .24 - .05, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) + Math.PI; // slope of the hood
    for (const z of [-.16, .16]) {
      const s = box(len, .012, .1, WHITE, (1.5 + .58) / 2, (.05 + .24) / 2 + .015, z);
      s.rotation.z = Math.atan2(.24 - .05, .58 - 1.5) + Math.PI;
      s.scale.x = 1;
      box(.5, .012, .1, WHITE, -.1, .612, z);
    }
  }
  /* hood vents: little fins at the windshield base */
  for (const z of [-.3, -.22, .22, .3]) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(.028, .12, 4), BLACK);
    f.position.set(.66, .3, z); f.rotation.z = .95; car.add(f);
  }

  /* ── front end: grille, bull-bar bumper, spotlights ── */
  box(.04, .1, .4, BLACK, 1.5, .0, 0);                                       // grille
  for (let i = -3; i <= 3; i++) box(.045, .08, .018, STEEL, 1.52, .0, i * .055);
  box(.1, .07, .98, BLACK, 1.56, -.14, 0);                                   // bumper
  for (const z of [-.3, .3]) { bar([1.56, -.14, z], [1.6, .12, z * .9], .02, STEEL); }
  bar([1.6, .1, -.3], [1.6, .1, .3], .018, STEEL);
  for (const z of [-.5, .5]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .12, 12), STEEL);
    ring.rotation.z = Math.PI / 2; put(ring, 1.58, -.02, z);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(.115, .115, .02, 12), LENS);
    lens.rotation.z = Math.PI / 2; put(lens, 1.645, -.02, z);
    const fog = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .08, 10), BLACK);
    fog.rotation.z = Math.PI / 2; put(fog, 1.56, -.2, z * .72);
    const fogLens = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .02, 10), LENS);
    fogLens.rotation.z = Math.PI / 2; put(fogLens, 1.6, -.2, z * .72);
  }

  /* ── wheels: big, wide, outside the body, five-spoke rims ── */
  const wheels = [];
  const R = .44, TW = .36;
  const makeWheel = () => {
    const w = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(R, R, TW, 22), TIRE); tire.rotation.x = Math.PI / 2; w.add(tire);
    const tread = new THREE.Mesh(new THREE.TorusGeometry(R - .02, .04, 5, 22), TIRE); w.add(tread);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(R * .66, R * .66, TW + .02, 18), RIM); rim.rotation.x = Math.PI / 2; w.add(rim);
    for (const fz of [1, -1]) {
      for (let i = 0; i < 5; i++) {
        const sp = new THREE.Mesh(new THREE.BoxGeometry(R * .56, .055, .03), SPOKE);
        const a = (i / 5) * Math.PI * 2 + (fz > 0 ? 0 : .3);
        sp.position.set(Math.cos(a) * R * .3, Math.sin(a) * R * .3, fz * (TW / 2 + .02)); sp.rotation.z = a; w.add(sp);
      }
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .03, 10), STEEL); cap.rotation.x = Math.PI / 2; cap.position.z = fz * (TW / 2 + .03); w.add(cap);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, TW + .04, 8), STEEL); hub.rotation.x = Math.PI / 2; w.add(hub);
    return w;
  };
  const WY = -.28, FZ = .86;
  const wheelSpots = [[1.02, WY, FZ], [1.02, WY, -FZ], [-.94, WY, FZ], [-.94, WY, -FZ]];
  for (const [x, y, z] of wheelSpots) {
    const w = makeWheel(); put(w, x, y, z); wheels.push(w);
    box(.12, .08, Math.abs(z) - HW + .02, BLACK, x, y, z > 0 ? (z + HW) / 2 : (z - HW) / 2);   // axle arm
  }

  /* ── fender wings ── */
  // front: a flat arch over the wheel that flares out and curls down at the edge
  for (const s of [1, -1]) {
    const arch = prism([[-.52, 0], [.58, 0], [.46, .1], [-.34, .1]], .5, BLUE, 1.05, .24, s * .82);
    arch.rotation.x = s * .14;
    const lip = prism([[-.46, 0], [.5, 0], [.4, .2], [-.3, .2]], .045, BLUE, 1.05, .1, s * 1.05);
    lip.rotation.x = s * -.35;
    const trim = prism([[-.5, 0], [.56, 0], [.5, .03], [-.4, .03]], .52, BLACK, 1.05, .225, s * .82);
    trim.rotation.x = s * .14;
    const stripe = prism([[-.4, 0], [.4, 0], [.34, .025], [-.3, .025]], .1, WHITE, 1.05, .345, s * 1.05);
    stripe.rotation.x = s * -.35;
  }
  // rear: big flat swept fins hovering above the wheels
  for (const s of [1, -1]) {
    const fin = new THREE.Shape([new THREE.Vector2(.5, 0), new THREE.Vector2(.5, .58), new THREE.Vector2(-.2, .56), new THREE.Vector2(-.62, .12), new THREE.Vector2(-.5, 0)]);
    const g = new THREE.ExtrudeGeometry(fin, { depth: .06, bevelEnabled: false });
    const m = new THREE.Mesh(g, BLUE); m.rotation.x = Math.PI / 2; m.position.set(-.82, .26, s * .5 * (s > 0 ? 1 : -1) + (s > 0 ? .0 : .0));
    m.scale.z = 1; if (s < 0) { m.scale.y = -1; }
    m.position.z = s > 0 ? .5 : -.5;
    car.add(m);
  }

  /* ── rear deck: engine, scoop, struts, wing ── */
  box(.52, .2, .52, RED, -.93, .42, 0);
  box(.5, .05, .12, RED_D, -.93, .53, -.16); box(.5, .05, .12, RED_D, -.93, .53, .16);
  box(.34, .15, .36, SCOOP, -.72, .56, 0);
  box(.02, .09, .3, BLACK, -.54, .56, 0);
  for (const z of [-.2, .2]) bar([-.75, .36, z], [-1.36, .78, z * 1.3], .02, STEEL);
  const wing = box(.34, .045, 2.05, BLUE, -1.42, .8, 0); wing.rotation.z = -.07;
  box(.34, .047, .9, WHITE, -1.42, .805, 0).rotation.z = -.07;
  for (const s of [1, -1]) {
    const plate = box(.4, .24, .035, BLUE, -1.42, .88, s * 1.0); plate.rotation.x = s * -.35; plate.rotation.z = -.07;
    box(.24, .04, .037, BLACK, -1.36, .97, s * 1.07).rotation.x = s * -.35;
  }
  /* tail lights + exhaust */
  for (const z of [-.36, .36]) box(.02, .06, .2, RED, -1.45, .16, z);
  for (const z of [-.22, .22]) {
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(.06, .075, .16, 8), BLACK); ex.rotation.z = Math.PI / 2; put(ex, -1.47, -.02, z);
  }

  /* ── boost flame ── */
  const flame = new THREE.Group(); flame.position.set(-1.56, -.02, 0); car.add(flame);
  [[.2, .52, ORANGE], [.14, .42, YELLOW], [.08, .3, PALE]].forEach(([r, h, mat], i) => {
    const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), mat);
    c.rotation.z = Math.PI / 2; c.position.x = -h / 2 + 0.02 - i * .0; flame.add(c);
  });

  /* nose-up hover pose, centered */
  car.rotation.z = .16;
  car.position.set(.05, .08, 0);
  car.scale.setScalar(.92);

  const update = (dt, t) => {
    const f = 1 + Math.sin(t * 18) * .13 + Math.sin(t * 29) * .08;
    flame.scale.set(f, 1 + Math.sin(t * 23) * .1, 1 + Math.sin(t * 31) * .1);
    for (const w of wheels) w.rotation.z -= dt * 3;
    car.position.y = .08 + Math.sin(t * 1.6) * .03;
  };

  return { group, update, autoRotate: true, parts: { flame, wheels, car } };
}
