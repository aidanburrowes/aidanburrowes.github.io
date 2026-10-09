import * as THREE from './vendor/three.module.min.js';
import buildSoccer from './shapes/soccer.js';
import buildCar from './shapes/car.js';
import buildAlchemy from './shapes/alchemy.js';
import buildGator from './shapes/gator.js';
import buildAcai from './shapes/acai.js';
import buildPokeball from './shapes/pokeball.js';
import buildIdol from './shapes/idol.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const root = document.documentElement;
const staticMode = new URLSearchParams(location.search).has('static');   // ?static=1: no loader, no reveal animation (for screenshots)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || staticMode;
const coarse = matchMedia('(pointer: coarse)').matches;
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const rgb = c => `rgb(${c.map(Math.round).join(',')})`;

/* One palette per section, borrowed from the eeveelutions:
   Eevee, Leafeon, Jolteon, Glaceon, Flareon, Vaporeon, Sylveon, Espeon, Umbreon. */
const PAL = {
  light: ['#F3EFDC', '#DDEFD3', '#FBF1C7', '#D5EEF8', '#FADFCB', '#D6E7FA', '#F8DDEB', '#ECE0F7', '#0B0C12'].map(hex),
};
/* Dark mode: a near-black ink base with only a faint tint, plus a soft glow in each section's color behind the shape.
   (Dark versions of the pastel tints went muddy, so the color lives in the glow instead.) */
const INK = [11, 12, 20];
const GLOW = ['#FFA928', '#2FD6A0', '#3B82F6', '#FF4D6D', '#F59E0B', '#FF7A2F', '#E0408F', '#9B6BFF', '#FFA928'].map(hex);
const FG_LIGHT = [29, 27, 22], FG_DARK = [239, 236, 228];

/* ── mode (light / dark) ── */
const qMode = new URLSearchParams(location.search).get('mode');   // ?mode=dark | light overrides, handy for sharing and testing
let mode = (qMode === 'dark' || qMode === 'light') ? qMode : (store.get('mode') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
const modeBtn = $('#mode');
const applyMode = () => { root.dataset.mode = mode; modeBtn.setAttribute('aria-pressed', String(mode === 'dark')); };
modeBtn.addEventListener('click', () => { mode = mode === 'dark' ? 'light' : 'dark'; store.set('mode', mode); applyMode(); });
applyMode();

/* ── publications: rendered from data/publications.json (edit that file to add more) ── */
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
async function renderPubs() {
  const host = $('#pubs-list'); if (!host) return;
  let items = [];
  try { items = await (await fetch('data/publications.json')).json(); } catch { return; }
  const groups = [...new Set(items.map(p => p.group || 'published'))];   // groups appear in the order they're first used
  for (const g of groups) {
    host.append(el('p', 'mono grp rv', g));
    const ul = el('ul', 'rows pubs' + (g === 'presented' ? ' presented' : '')); host.append(ul);
    for (const p of items.filter(p => (p.group || 'published') === g)) {
      const li = el('li', 'rv' + (p.thumb ? ' has-thumb' : ''));
      li.append(el('span', 'mono', p.year));
      const body = p.link ? el('a') : el('div');
      if (p.link) { body.href = p.link; body.target = '_blank'; body.rel = 'noopener'; }
      body.append(el('b', '', p.title));
      const detail = [p.role, p.venue].filter(Boolean).join(' · ') + (p.link ? ' ↗' : '');
      if (detail) body.append(el('small', '', detail));
      li.append(body);
      if (p.thumb) { const img = el('img', 'pub-thumb'); img.src = p.thumb; img.alt = ''; img.loading = 'lazy'; li.append(img); }
      ul.append(li);
    }
  }
}
await renderPubs();

/* ── sections ── */
const panels = $$('.panel');
const rail = $$('.rail a');
const N = panels.length;
let centers = [];
const STACK_MQ = matchMedia('(max-width: 820px), (max-aspect-ratio: 10/11)');
const isMobile = () => STACK_MQ.matches;   // phones, and any portrait-shaped window (tablets)
/* Desktop: a section is "active" when its middle crosses the screen's middle.
   Mobile: text cards slide over the object, so a section is active when its top reaches the screen top. */
/* The hero shape gets whatever room is left above the title: centered there and scaled to fit (short windows!) */
const heroFit = { cy: 0, s: 1 };
const measureHero = () => {
  const copy = $('.hero .copy'); if (!copy) return;
  const top = copy.getBoundingClientRect().top + scrollY - 22;   // minus the reveal slide-in offset
  const from = 72, to = Math.max(from + 150, top - 14);
  heroFit.cy = (from + to) / 2;
  heroFit.s = clamp((to - from) / (innerHeight * .56), .42, 1);
};
const measure = () => { measureHero(); centers = panels.map(p => { const r = p.getBoundingClientRect(); return r.top + scrollY + (isMobile() ? innerHeight : r.height) / 2; }); };
/* Text scales with the window: on the side-by-side layout each section's text block is zoomed so it fits the window's height
   (never under the top bar), grows a little on big monitors, and never grows into the 3D shape on the right.
   In the stacked (phone/tablet) layout it stays at its natural size. */
const FIT_MIN = .82, FIT_MAX = 1.3;   // below ~.82 the small labels get hard to read, so very short windows scroll instead
const fitCopy = () => {
  const stacked = isMobile();
  $$('.panel:not(.hero) .copy').forEach(c => {
    c.style.zoom = 1;
    if (stacked) return;
    const h = c.offsetHeight, w = c.offsetWidth;
    const padL = parseFloat(getComputedStyle(c.closest('.panel')).paddingLeft) || 0;
    const byHeight = (innerHeight - 120) / h;                       // leave room for the top bar and breathing space
    const byWidth = (innerWidth * .56 - padL) / w;                  // stay left of the shape
    c.style.zoom = clamp(Math.min(byHeight, byWidth), FIT_MIN, FIT_MAX).toFixed(3);
  });
};
fitCopy();
document.fonts?.ready.then(() => { fitCopy(); measure(); });
const computeSel = () => {
  const y = scrollY + innerHeight / 2;
  if (y <= centers[0]) return 0;
  for (let i = 0; i < N - 1; i++) {
    if (y < centers[i + 1]) { const m = isMobile(); return i + smooth(((y - centers[i]) / (centers[i + 1] - centers[i]) - (m ? .72 : .25)) / (m ? .28 : .5)); }
  }
  return N - 1;
};

/* achievements: on touch screens a row opens its details when tapped (on desktop they show on hover) */
$$('.achv li').forEach(li => {
  const toggle = () => { if (matchMedia('(hover: none)').matches) li.classList.toggle('open'); };
  li.addEventListener('click', toggle);
  li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
});

/* reveal-on-scroll, staggered */
panels.forEach(p => $$('.rv', p).forEach((el, i) => el.style.setProperty('--d', i)));
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
$$('.rv').forEach(el => (reduced ? el.classList.add('in') : io.observe(el)));

/* ── 3D ── */
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas: $('#scene'), antialias: true, alpha: true }); } catch { /* no WebGL */ }
if (!renderer) document.body.classList.add('no-3d');

const scene = new THREE.Scene();
const VS = () => (isMobile() ? 10 : 7.4);
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 100);
camera.position.set(8, 7.2, 8);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 1.9));
const key = new THREE.DirectionalLight(0xffffff, 2.1); key.position.set(4, 9, 5); scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, .7); fill.position.set(-6, 3, -4); scene.add(fill);

const lam = c => new THREE.MeshLambertMaterial({ color: c });
const holder = new THREE.Group();
scene.add(holder);
const YELLOW = 0xF2C94C;

/* 0 · hello: the ring (Umbreon's rings) */
const sRing = new THREE.Group();
{
  const t = new THREE.Mesh(new THREE.TorusGeometry(1.3, .44, 40, 96), lam(YELLOW));
  t.rotation.x = Math.PI / 2; sRing.add(t);
}
/* 7 · contact: ring + crescent moon. The moon is a yellow sphere carved by a night-colored sphere; it lives
   outside the spinning holder so the carve stays aligned with the camera. */
const sMoon = new THREE.Group();
{
  const t = new THREE.Mesh(new THREE.TorusGeometry(1.15, .4, 40, 96), lam(YELLOW));
  t.rotation.x = Math.PI / 2; t.position.y = -.9; sMoon.add(t);
}
const MOON_RIGHT = new THREE.Vector3(1, 0, -1).normalize();
const moonG = new THREE.Group();
{ // a real crescent: outer circle minus an offset inner circle, extruded thin and kept facing the camera
  const R = .56, d = .3, r = .5;
  const x = (R * R - r * r + d * d) / (2 * d), y = Math.sqrt(R * R - x * x);
  const th = Math.atan2(y, x), p2 = Math.atan2(-y, x - d), p1 = Math.atan2(y, x - d);
  const sh = new THREE.Shape();
  sh.absarc(0, 0, R, th, Math.PI * 2 - th, false);
  sh.absarc(d, 0, r, p2, p1 - Math.PI * 2, true);
  const g = new THREE.ExtrudeGeometry(sh, { depth: .14, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 1 });
  g.translate(-.1, 0, -.07);
  const moon = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: YELLOW }));
  moon.quaternion.copy(camera.quaternion); moon.rotateZ(.55);
  const right = new THREE.Vector3(1, 0, -1).normalize();
  moon.position.set(0, .55, 0).addScaledVector(right, 2.05);
  moonG.add(moon);
}
moonG.visible = false; scene.add(moonG);

/* The things i like, one per section. Each shape lives in shapes/*.js (see shapes/CONTRACT.md). */
const ctx = { lam };
const acai = buildAcai(THREE, ctx);
const entries = [
  { group: sRing, autoRotate: true },          // 0 hello        · umbreon's ring
  buildSoccer(THREE, ctx),                      // 1 about        · soccer
  buildCar(THREE, ctx),                         // 2 experience   · rocket league
  buildPokeball(THREE, ctx),                    // 3 skills       · pokémon
  buildAlchemy(THREE, ctx),                     // 4 research     · fullmetal alchemist
  buildGator(THREE, ctx),                       // 5 publications · uf gators
  acai,                                         // 6 projects     · açaí (toppings = projects)
  buildIdol(THREE, ctx),                        // 7 achievements · survivor immunity idol
  { group: sMoon, autoRotate: true },          // 8 contact      · ring + moon
];
const MOBILE_SCALE = { 7: .6 };   // the idol's bead loop is wide, so it shrinks on phones
const SHADOW_R = [1.5, 1.5, 1.7, 1.4, 1.8, 1.6, 1.6, 1.3, 1.5];
entries.forEach(e => { e.group.scale.setScalar(.001); e.group.visible = false; holder.add(e.group); });
const toppings = acai.parts?.toppings || [];
toppings.forEach(g => { g.userData.base = g.position.y; g.userData.lift = 0; });

const shadowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.55, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: .1, depthWrite: false }));
shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.9; scene.add(shadow);

/* sizing */
let pr = new URLSearchParams(location.search).get('q') === 'low' ? .75 : Math.min(devicePixelRatio || 1, 2), slow = 0;
let W = innerWidth, H = innerHeight;
const resize = () => {
  W = innerWidth; H = innerHeight;
  if (renderer) {
    renderer.setPixelRatio(pr);
    renderer.setSize(W, H, false);
  }
  const vs = VS(), a = W / H;
  camera.left = -vs * a / 2; camera.right = vs * a / 2; camera.top = vs / 2; camera.bottom = -vs / 2;
  camera.updateProjectionMatrix();
  fitCopy(); measure();
};
addEventListener('resize', resize);
addEventListener('load', () => { fitCopy(); measure(); });
resize();

/* pointer, hover, click */
const ptr = { x: .5, y: .5 };
let hoverTopping = -1, spinTarget = 0, spinCur = 0;
addEventListener('pointermove', e => { ptr.x = e.clientX / W; ptr.y = e.clientY / H; }, { passive: true });
$$('#projects-list li').forEach(li => {
  li.addEventListener('mouseenter', () => { hoverTopping = +li.dataset.i; });
  li.addEventListener('mouseleave', () => { hoverTopping = -1; });
  li.addEventListener('focusin', () => { hoverTopping = +li.dataset.i; });
  li.addEventListener('focusout', () => { hoverTopping = -1; });
});
panels.forEach(p => p.addEventListener('click', e => { if (e.target === p) spinTarget += Math.PI * 2; }));

/* custom cursor ring */
const cur = $('#cursor');
if (!coarse && !reduced) {
  let cx = -100, cy = -100, tx = -100, ty = -100;
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; cur.classList.add('on'); cur.classList.toggle('big', !!e.target.closest('a, button')); }, { passive: true });
  document.addEventListener('mouseleave', () => cur.classList.remove('on'));
  (function follow() { cx += (tx - cx) * .22; cy += (ty - cy) * .22; cur.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(follow); })();
}

/* ── frame loop ── */
let dispSel = 0, last = performance.now(), firstFrame = true, lastActive = -1;
const cache = {};
const setVar = (k, v) => { if (cache[k] !== v) { cache[k] = v; root.style.setProperty(k, v); } };

/* Adaptive quality: if frames run slow on this device, quietly lower the render resolution (down to 0.75x). */
const adapt = rawDt => {
  slow = Math.max(0, slow + (rawDt > .045 ? rawDt : -rawDt * .5));   // seconds spent running slow
  if (slow > 1.2 && pr > .75 && renderer) { pr = Math.max(.75, pr - .5); renderer.setPixelRatio(pr); renderer.setSize(W, H, false); slow = 0; }
};

const frame = now => {
  const rawDt = Math.max(0, (now - last) / 1000);   // the first frame's timestamp can precede `last`
  const dt = Math.min(.05, rawDt); last = now;
  if (!firstFrame) adapt(rawDt);
  const sel = computeSel();
  dispSel += (sel - dispSel) * (reduced ? 1 : 1 - Math.pow(.0009, dt));
  dispSel = clamp(dispSel, 0, N - 1);

  /* background + ink, interpolated between section palettes */
  const i0 = Math.min(N - 1, Math.floor(dispSel)), i1 = Math.min(N - 1, i0 + 1), f = dispSel - i0;
  let bg;
  if (mode === 'dark') {
    const glow = mix(GLOW[i0], GLOW[i1], f);
    const last = i0 === N - 1 ? 1 : (i1 === N - 1 ? f : 0);               // the contact section is pure night
    bg = mix(INK, glow, .025 * (1 - last * .6));
    setVar('--glow', rgb(glow));
  } else {
    bg = mix(PAL.light[i0], PAL.light[i1], f);
  }
  const lum = (.2126 * bg[0] + .7152 * bg[1] + .0722 * bg[2]) / 255;
  const dark = lum < .45;
  const fg = dark ? FG_DARK : FG_LIGHT;
  setVar('--bg', rgb(bg)); setVar('--fg', rgb(fg));
  setVar('--fg2', rgb(mix(bg, fg, .66))); setVar('--line', rgb(mix(bg, fg, .17)));
  {   // where the object sits on screen (matches the camera offset below), so the glow follows it
    const mob = isMobile(), s = smooth(dispSel);
    setVar('--gx', (mob ? 50 : 50 + 20 * s).toFixed(1) + '%');
    setVar('--gy', (mob ? 28 : 50 - 10 * (1 - s)).toFixed(1) + '%');
  }

  const active = Math.round(dispSel);
  if (active !== lastActive) { lastActive = active; rail.forEach((a, i) => a.classList.toggle('active', i === active)); }

  if (renderer) {
    const t = now / 1000;
    /* shape weights → scale; only visible shapes get updated */
    let tot = 0, rad = 0;
    entries.forEach((e, i) => {
      const w = smooth(1 - Math.abs(dispSel - i) * 1.7);
      const vis = w > .004;
      e.group.visible = vis; e.group.scale.setScalar(Math.max(.001, w * (isMobile() ? (MOBILE_SCALE[i] || 1) : 1) * (i === 0 ? heroFit.s : 1)));
      tot += w; rad += w * SHADOW_R[i];
      if (i === entries.length - 1) { moonG.visible = vis; moonG.scale.setScalar(Math.max(.001, w)); }
      if (vis && !reduced) {
        if (e.autoRotate !== false) e.group.rotation.y += dt * .35;
        if (e.update) e.update(dt, t);
      }
    });
    toppings.forEach((g, i) => {
      g.userData.lift += ((i === hoverTopping ? .6 : 0) - g.userData.lift) * (1 - Math.pow(.001, dt));
      g.position.y = g.userData.base + g.userData.lift;
    });

    /* float, tilt, spin */
    spinCur += (spinTarget - spinCur) * (1 - Math.pow(.01, dt));
    const bob = reduced ? 0 : Math.sin(t * 1.3) * .12;
    holder.position.y = bob;
    const mo = isMobile() ? -.95 : 0;                       // keep the crescent on narrow screens
    moonG.position.set(MOON_RIGHT.x * mo, bob, MOON_RIGHT.z * mo);
    holder.rotation.y += ((ptr.x - .5) * .7 + spinCur - holder.rotation.y) * .06;
    holder.rotation.x += ((ptr.y - .5) * .22 - holder.rotation.x) * .06;
    shadow.scale.setScalar(Math.max(.01, (rad / Math.max(tot, .001)) * (1 - bob * .6)));
    shadow.material.opacity = (dark ? .5 : .2) * clamp(tot);

    /* where the object sits: centered on the hero, right of the copy afterwards */
    const mobile = isMobile();
    const heroT = 1 - smooth(dispSel);
    const offX = mobile ? 0 : -.2 * smooth(dispSel) * W;
    const offY = (mobile ? .31 * H : 0) * (1 - heroT) + (H / 2 - heroFit.cy) * heroT;
    camera.setViewOffset(W, H, offX, offY, W, H);
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);
  }

  if (firstFrame) { firstFrame = false; setTimeout(() => $('#loader').classList.add('done'), 700); }
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
if (staticMode) {
  $('#loader').remove();
  root.style.scrollBehavior = 'auto';
  const jump = () => { const t = location.hash && $(location.hash); if (t) scrollTo(0, t.getBoundingClientRect().top + scrollY); };
  addEventListener('load', () => { measure(); jump(); setTimeout(jump, 300); });
}
if (!renderer) $('#loader').classList.add('done');
