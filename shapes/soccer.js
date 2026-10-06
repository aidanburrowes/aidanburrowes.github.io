// Low-poly soccer ball: real truncated icosahedron (12 pentagons + 20 hexagons), gently puffy panels.
export default function build(THREE, { lam }) {
  const R = 1.55;      // sphere radius for panel borders
  const PUFF = 1.05;   // panel centers pushed out to R * PUFF
  const phi = (1 + Math.sqrt(5)) / 2;

  // 12 icosahedron vertices
  const base = [];
  for (const a of [-1, 1]) for (const b of [-phi, phi]) {
    base.push([0, a, b], [a, b, 0], [b, 0, a]);
  }
  const V = base.map(p => new THREE.Vector3(...p).normalize());

  // edges (nearest neighbours) and faces (mutually adjacent triples)
  const edgeLen = V[0].distanceTo(V.slice(1).reduce((m, v) => (V[0].distanceTo(v) < V[0].distanceTo(m) ? v : m)));
  const adj = V.map(() => []);
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) {
    if (Math.abs(V[i].distanceTo(V[j]) - edgeLen) < 1e-4) { adj[i].push(j); adj[j].push(i); }
  }
  const faces = [];
  for (let i = 0; i < 12; i++) for (const j of adj[i]) for (const k of adj[j]) {
    if (i < j && j < k && adj[i].includes(k)) faces.push([i, j, k]);
  }

  // truncation point on edge x->y, one third of the way from x
  const P = (x, y) => V[x].clone().lerp(V[y], 1 / 3).normalize().multiplyScalar(R);

  // build panels: arrays of ring points in order
  const pentagons = [];
  for (let v = 0; v < 12; v++) {
    const axis = V[v];
    const ref = new THREE.Vector3(0, 1, 0);
    if (Math.abs(axis.dot(ref)) > 0.9) ref.set(1, 0, 0);
    const u = ref.clone().sub(axis.clone().multiplyScalar(ref.dot(axis))).normalize();
    const w = new THREE.Vector3().crossVectors(axis, u);
    const ring = adj[v].map(n => {
      const p = P(v, n);
      return { p, ang: Math.atan2(p.dot(w), p.dot(u)) };
    }).sort((a, b) => a.ang - b.ang).map(o => o.p);
    pentagons.push(ring);
  }
  const hexagons = faces.map(([a, b, c]) => [P(a, b), P(b, a), P(b, c), P(c, b), P(c, a), P(a, c)]);

  function panelGeometry(rings) {
    const pos = [];
    for (const ring of rings) {
      const center = new THREE.Vector3();
      ring.forEach(p => center.add(p));
      center.normalize().multiplyScalar(R * PUFF);
      const n = ring.length;
      for (let i = 0; i < n; i++) {
        const a = ring[i], b = ring[(i + 1) % n];
        // winding check: triangle normal must point away from origin
        const nrm = new THREE.Vector3().subVectors(a, center).cross(new THREE.Vector3().subVectors(b, center));
        const mid = new THREE.Vector3().add(a).add(b).add(center);
        if (nrm.dot(mid) >= 0) pos.push(center.x, center.y, center.z, a.x, a.y, a.z, b.x, b.y, b.z);
        else pos.push(center.x, center.y, center.z, b.x, b.y, b.z, a.x, a.y, a.z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  }

  const group = new THREE.Group();
  const darkMat = lam(0x23232b); darkMat.flatShading = true;
  const whiteMat = lam(0xf6f4ee); whiteMat.flatShading = true;
  const dark = new THREE.Mesh(panelGeometry(pentagons), darkMat);
  const white = new THREE.Mesh(panelGeometry(hexagons), whiteMat);

  const ball = new THREE.Group();
  ball.add(dark, white);
  group.add(ball);
  group.rotation.z = 0.35;
  group.rotation.x = 0.2;

  return {
    group,
    autoRotate: true,
    parts: { ball },
    update(dt, t) {
      ball.rotation.x = Math.sin(t * 0.8) * 0.04;
      ball.rotation.z = Math.cos(t * 0.6) * 0.03;
    },
  };
}
