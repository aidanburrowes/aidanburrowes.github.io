# 3D shape module contract

Each file in `shapes/` is an ES module with ONE default export:

```js
export default function build(THREE, { lam }) {
  // lam(hexColor) => new THREE.MeshLambertMaterial({ color: hexColor })
  const group = new THREE.Group();
  // ...build the model...
  return {
    group,                       // required: THREE.Group, model centered near the origin
    update(dt, t) {},            // optional: self-animation. dt = seconds since last frame, t = seconds since start
    autoRotate: true,            // optional (default true): host slowly yaws `group` around Y (~0.35 rad/s)
    parts: {},                   // optional: named sub-objects the host animates (see each shape's brief)
  };
}
```

Rules
- Pure function. No imports, no DOM, no textures, no fetches. Only the `THREE` namespace passed in.
- Style: low-poly "soft toy" look, flat pastel colors, MeshLambertMaterial (scene already has ambient + directional light).
  `flatShading: true` on faceted things is welcome. No gradients, no emissive glow spam (small emissive accents OK).
- Size: the model must fit inside a sphere of radius ~1.8 centered at the origin (about 3.4 units across).
  Lowest point must be >= -1.7 (a soft shadow plane sits at y = -1.9). The host scales the group from 0 -> 1 to "pop in".
- Camera: orthographic, positioned at (8, 7.2, 8) looking at the origin (isometric-ish, elevated 3/4 view).
  The host auto-rotates the group around Y, so it must look good from every yaw angle (unless autoRotate:false).
- Keep it light: under ~4000 triangles, reuse geometries/materials where possible.
- Verify in node WITHOUT a browser (the shared browser pane is off limits):
    node --input-type=module -e "import * as THREE from './vendor/three.module.min.js'; import b from './shapes/NAME.js'; const lam=c=>new THREE.MeshLambertMaterial({color:c}); const r=b(THREE,{lam}); r.update?.(0.016,1); const box=new THREE.Box3().setFromObject(r.group); console.log(box.min, box.max, 'meshes:', (()=>{let n=0;r.group.traverse(o=>o.isMesh&&n++);return n})())"
  (run from the project root). Check that the bounding box fits the size rules and there are no NaNs.
