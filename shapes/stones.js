// "News" shape: the eight evolution stones, one in each eeveelution's color, orbiting a thin ring.
// Original low-poly gems (generic faceted crystals), not the official item art.
export default function build(THREE, { lam }) {
  const group = new THREE.Group();
  const gem = c => { const m = lam(c); m.flatShading = true; return m; };
  const defs = [
    [new THREE.OctahedronGeometry(.46), 0xFFD93B],              // thunder
    [new THREE.IcosahedronGeometry(.42, 0), 0x4C9EFF],          // water
    [new THREE.DodecahedronGeometry(.43, 0), 0xFF6B35],         // fire
    [new THREE.OctahedronGeometry(.44), 0x5BD17A],              // leaf
    [new THREE.IcosahedronGeometry(.4, 0), 0x8EE6FF],           // ice
    [new THREE.DodecahedronGeometry(.42, 0), 0x5B4B9A],         // moon
    [new THREE.OctahedronGeometry(.46), 0xFFB02E],              // sun
    [new THREE.IcosahedronGeometry(.42, 0), 0x43D9B8],          // shiny
  ];
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, .035, 8, 64), gem(0xC9A66B));
  ring.rotation.x = Math.PI / 2; group.add(ring);
  const stones = defs.map(([geo, col], i) => {
    const m = new THREE.Mesh(geo, gem(col));
    const a = (i / defs.length) * Math.PI * 2;
    m.userData = { a, spin: .5 + (i % 3) * .25 };
    m.scale.y = i % 2 ? 1.35 : 1.15;
    m.position.set(Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3);
    group.add(m); return m;
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.3, 0), gem(0xF3EFDC)); core.scale.y = 1.4; group.add(core);
  group.position.y = .1;
  const update = (dt, t) => {
    stones.forEach((m, i) => {
      m.rotation.y += dt * m.userData.spin; m.rotation.x = Math.sin(t * .8 + i) * .25;
      m.position.y = Math.sin(t * 1.2 + i * .8) * .16;
    });
    core.rotation.y += dt * .6; core.position.y = Math.sin(t * 1.5) * .06;
  };
  return { group, update, autoRotate: true, parts: { stones, core } };
}
