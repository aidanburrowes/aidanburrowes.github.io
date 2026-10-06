import * as THREE from './vendor/three.module.min.js';
import buildStones from './shapes/stones.js';

/* The news page: the list is rendered from data/news.json (see README: "Adding news"). */
const $ = (s, el = document) => el.querySelector(s);
const root = document.documentElement;
const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('static');
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const rgb = c => `rgb(${c.map(Math.round).join(',')})`;

/* ── light / dark (shares the choice with the main page) ── */
const qm = params.get('mode');
let mode = (qm === 'dark' || qm === 'light') ? qm : (store.get('mode') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
const paint = () => {
  root.dataset.mode = mode; $('#mode').setAttribute('aria-pressed', String(mode === 'dark'));
  const dark = mode === 'dark', bg = dark ? mix([11, 12, 20], hex('#E0A458'), .03) : hex('#EBDDC5'), fg = dark ? [239, 236, 228] : [29, 27, 22];
  root.style.setProperty('--bg', rgb(bg)); root.style.setProperty('--fg', rgb(fg));
  root.style.setProperty('--fg2', rgb(mix(bg, fg, .66))); root.style.setProperty('--line', rgb(mix(bg, fg, .17)));
  root.style.setProperty('--glow', '#E0A458'); root.style.setProperty('--gx', '78%'); root.style.setProperty('--gy', '34%');
  $('meta[name="theme-color"]').setAttribute('content', rgb(bg));
};
$('#mode').addEventListener('click', () => { mode = mode === 'dark' ? 'light' : 'dark'; store.set('mode', mode); paint(); });
paint();

/* ── the list ── */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = d => { const [y, m, day] = d.split('-'); return m ? (day ? `${MONTHS[+m - 1]} ${+day}, ${y}` : `${MONTHS[+m - 1]} ${y}`) : y; };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
const MS_LOGO = '<svg viewBox="0 0 23 23" aria-hidden="true"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M12 1h10v10H12z"/><path fill="#00A4EF" d="M1 12h10v10H1z"/><path fill="#FFB900" d="M12 12h10v10H12z"/></svg>';
const tile = n => {
  if (n.thumb) { const img = el('img', 'news-thumb'); img.src = n.thumb; img.alt = ''; img.loading = 'lazy'; return img; }
  const t = el('span', 'logo');
  if (n.icon === 'microsoft') t.innerHTML = MS_LOGO;
  else if (n.icon) { const i = el('i', 'ico'); i.style.setProperty('--i', `url(assets/icons/${n.icon}.svg)`); t.append(i); }
  else { t.classList.add('mono-logo'); t.textContent = n.letters || '·'; }
  return t;
};
async function renderNews() {
  const host = $('#news-list');
  let items = [];
  try { items = await (await fetch('data/news.json')).json(); }
  catch { host.append(el('p', 'sub', "Couldn't load the news. Try refreshing.")); return; }
  items.sort((a, b) => (a.date < b.date ? 1 : -1));
  let year = null, ul = null;
  for (const n of items) {
    const y = n.date.slice(0, 4);
    if (y !== year) { year = y; host.append(el('p', 'mono grp', y)); ul = el('ul', 'rows news'); host.append(ul); }
    const li = el('li');
    li.append(el('span', 'mono', fmt(n.date)), tile(n));
    const body = n.link ? el('a') : el('div');
    if (n.link) { body.href = n.link; body.target = '_blank'; body.rel = 'noopener'; }
    body.append(el('b', '', n.text + (n.link ? ' ↗' : '')));
    li.append(body); ul.append(li);
  }
}
await renderNews();

/* ── the evolution stones ── */
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas: $('#scene'), antialias: true, alpha: true }); } catch { /* no WebGL: the page still works */ }
if (renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 100);
  camera.position.set(8, 7.2, 8); camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 1.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.1); key.position.set(4, 9, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, .7); fill.position.set(-6, 3, -4); scene.add(fill);
  const stones = buildStones(THREE, { lam: c => new THREE.MeshLambertMaterial({ color: c }) });
  scene.add(stones.group);
  const ptr = { x: .5, y: .5 };
  addEventListener('pointermove', e => { ptr.x = e.clientX / innerWidth; ptr.y = e.clientY / innerHeight; }, { passive: true });
  let pr = Math.min(devicePixelRatio || 1, 1.75);
  const resize = () => {
    const W = innerWidth, H = innerHeight, mobile = W < 820, vs = mobile ? 10 : 7.4, a = W / H;
    renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
    camera.left = -vs * a / 2; camera.right = vs * a / 2; camera.top = vs / 2; camera.bottom = -vs / 2;
    camera.setViewOffset(W, H, mobile ? 0 : -.27 * W, mobile ? .33 * H : .16 * H, W, H); camera.updateProjectionMatrix();
    stones.group.scale.setScalar(mobile ? .6 : 1);
    root.style.setProperty('--gx', mobile ? '50%' : '77%'); root.style.setProperty('--gy', mobile ? '24%' : '34%');
  };
  addEventListener('resize', resize); resize();
  let last = performance.now(), slow = 0;
  const frame = now => {
    const raw = Math.max(0, (now - last) / 1000), dt = Math.min(.05, raw); last = now;
    slow = Math.max(0, slow + (raw > .045 ? raw : -raw * .5));
    if (slow > 1.2 && pr > .75) { pr = Math.max(.75, pr - .5); resize(); slow = 0; }
    if (!reduced) { stones.group.rotation.y += dt * .35; stones.update(dt, now / 1000); }
    stones.group.rotation.x += ((ptr.y - .5) * .2 - stones.group.rotation.x) * .06;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
