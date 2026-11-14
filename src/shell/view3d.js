/*
 * Elsewhere · Apogeans: The Limit Breakers · NASA Space Apps Challenge 2026
 *
 * AI ASSISTANCE NOTICE
 * AI (Anthropic's Claude) helped us analyze the immense amount of data behind this
 * app: elevation, climate, geology and surface datasets for Earth, the Moon and
 * Mars, and turning it into the 16 feature scores and similarity matches the app
 * uses. AI also helped write and debug parts of this code. See README.md.
 */

// ---------- 3D view: the Earth site and its Moon/Mars match, side by side ----------
// Globes use NASA Blue Marble (Earth), MOLA-based relief (Mars) and LRO-based maps (Moon).
// three.js and the textures load only when this screen is first opened (v3d.js).
(function () {
  const $ = (s) => document.querySelector(s);
  const page = document.getElementById('pg-v3d'); if (!page) return;
  let loading = null, views = [], raf = 0, last = 0, choice = 'cur', sync = true, idle = 0, flyTo = null, touched = false;
  const cam = { az: 0.6, el: 0.5, dist: 0.42 };

  function load() {
    if (window.THREE && window.V3D_TEX) return Promise.resolve();
    if (!loading) loading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'v3d.js'; s.onload = res; s.onerror = () => { loading = null; rej(); }; document.head.appendChild(s); });
    return loading;
  }
  // equirectangular (lon -180..180) onto three.js SphereGeometry UVs
  const ll2v = (lat, lon, r) => { const u = (lon + 180) / 360 * Math.PI * 2, la = lat * Math.PI / 180; return new THREE.Vector3(-Math.cos(u) * Math.cos(la) * r, Math.sin(la) * r, Math.sin(u) * Math.cos(la) * r); };

  // ---- sharper NASA imagery around the pin, when online ----
  const TREK = { Moon: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/', Mars: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/' };
  const GIBS = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&STYLES=&SRS=EPSG:4326&FORMAT=image/jpeg&LAYERS=BlueMarble_NextGeneration';
  const loadImg = (url) => new Promise((res, rej) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = rej; im.src = url; setTimeout(rej, 15000); });
  async function hdPatch(v, lat, lon) {
    const T = THREE, tok = (v.hdTok = (v.hdTok || 0) + 1);
    if (v.hd) { v.scene.remove(v.hd); v.hd.geometry.dispose(); v.hd.material.map.dispose(); v.hd.material.dispose(); v.hd = null; }
    v.onHD && v.onHD(false);
    if (navigator.onLine === false) return;
    const N = 1024, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d');
    let lon0, lat0, lon1, lat1;
    try {
      if (v.body === 'Earth') {
        const sp = 2.5; lat0 = Math.max(-90, lat - sp); lat1 = Math.min(90, lat + sp); lon0 = lon - sp; lon1 = lon + sp;
        g.drawImage(await loadImg(`${GIBS}&BBOX=${[lon0, lat0, lon1, lat1].map((x) => x.toFixed(4)).join(',')}&WIDTH=${N}&HEIGHT=${N}`), 0, 0, N, N);
      } else {
        const z = 7, size = 180 / 2 ** z, ncol = 2 * 2 ** z, nrow = 2 ** z;
        const c0 = Math.round((lon + 180) / size) - 2, r0 = Math.min(nrow - 4, Math.max(0, Math.round((90 - lat) / size) - 2));
        const jobs = [];
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
          const cc = (((c0 + c) % ncol) + ncol) % ncol;
          jobs.push(loadImg(`${TREK[v.body]}${z}/${r0 + r}/${cc}.jpg`).then((im) => g.drawImage(im, c * N / 4, r * N / 4, N / 4, N / 4)));
        }
        await Promise.all(jobs);
        lon0 = c0 * size - 180; lon1 = lon0 + 4 * size; lat1 = 90 - r0 * size; lat0 = lat1 - 4 * size;
      }
    } catch (e) { return; }
    if (tok !== v.hdTok) return;
    // feather the edges so the sharp patch melts into the globe
    g.globalCompositeOperation = 'destination-in';
    const rg = g.createRadialGradient(N / 2, N / 2, N * 0.3, N / 2, N / 2, N * 0.5); rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, N, N);
    const tex = new T.CanvasTexture(cv); tex.anisotropy = v.renderer.capabilities.getMaxAnisotropy();
    const D = Math.PI / 180;
    const geo = new T.SphereGeometry(1.0004, 96, 96, (lon0 + 180) * D, (lon1 - lon0) * D, (90 - lat1) * D, (lat1 - lat0) * D);
    v.hd = new T.Mesh(geo, new T.MeshPhongMaterial({ map: tex, transparent: true, depthWrite: false, shininess: 4, specular: new T.Color(0x0a0a0a) }));
    v.hd.renderOrder = 1; v.scene.add(v.hd); v.onHD && v.onHD(true); if (!touched) flyTo = 0.2;
  }

  function makeView(canvas, body) {
    const T = THREE, tex = window.V3D_TEX, L = new T.TextureLoader();
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    const scene = new T.Scene(); scene.background = new T.Color(0x020306);
    const camera = new T.PerspectiveCamera(42, 1, 0.001, 200);
    const key = body.toLowerCase();
    const map = L.load(tex[key]); const bump = L.load(tex[key + '_bump']);
    [map, bump].forEach((t) => { t.anisotropy = renderer.capabilities.getMaxAnisotropy(); });
    const mat = new T.MeshPhongMaterial({ map, bumpMap: bump, bumpScale: body === 'Earth' ? 0.008 : body === 'Mars' ? 0.02 : 0.02, specular: new T.Color(body === 'Earth' ? 0x223344 : 0x0a0a0a), shininess: body === 'Earth' ? 14 : 4 });
    const globe = new T.Mesh(new T.SphereGeometry(1, 160, 120), mat); scene.add(globe);
    // thin atmosphere rim for Earth and Mars
    if (body !== 'Moon') {
      const c = body === 'Earth' ? new T.Color(0.35, 0.6, 1.0) : new T.Color(0.95, 0.6, 0.4);
      const atm = new T.Mesh(new T.SphereGeometry(body === 'Earth' ? 1.03 : 1.015, 96, 64), new T.ShaderMaterial({
        uniforms: { c: { value: c }, k: { value: body === 'Earth' ? 1.0 : 0.6 } }, side: T.BackSide, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        vertexShader: 'varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vP = mv.xyz; gl_Position = projectionMatrix*mv; }',
        fragmentShader: 'uniform vec3 c; uniform float k; varying vec3 vN; varying vec3 vP; void main(){ float r = pow(1.0 - abs(dot(normalize(-vP), vN)), 3.0); gl_FragColor = vec4(c, r * 0.9 * k); }' }));
      scene.add(atm);
    }
    // stars
    const sg = new T.BufferGeometry(), sp = [];
    for (let i = 0; i < 1500; i++) { const v = new T.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize().multiplyScalar(60 + Math.random() * 30); sp.push(v.x, v.y, v.z); }
    sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
    scene.add(new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 0.12, sizeAttenuation: true, transparent: true, opacity: 0.7 })));
    scene.add(new T.AmbientLight(0x3a4050, body === 'Moon' ? 0.35 : 0.45));
    const sun = new T.DirectionalLight(0xfff4e6, 1.35); scene.add(sun); scene.add(sun.target);
    // pin: stem, head and a pulsing ring on the surface
    const pin = new T.Group();
    const yel = new T.Color(0xFFC93C);
    const stem = new T.Mesh(new T.CylinderGeometry(0.0009, 0.0009, 0.05, 8), new T.MeshBasicMaterial({ color: yel })); stem.position.y = 0.025; pin.add(stem);
    const head = new T.Mesh(new T.SphereGeometry(0.0055, 16, 12), new T.MeshBasicMaterial({ color: yel })); head.position.y = 0.05; pin.add(head);
    const ring = new T.Mesh(new T.RingGeometry(0.007, 0.0095, 48), new T.MeshBasicMaterial({ color: yel, transparent: true, side: T.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.001; pin.add(ring);
    scene.add(pin);
    const v = { renderer, scene, camera, pin, ring, sun, body, p: new T.Vector3(0, 0, 1), n: new T.Vector3(0, 0, 1), e: new T.Vector3(1, 0, 0), no: new T.Vector3(0, 1, 0) };
    v.setSite = (lat, lon) => {
      v.p = ll2v(lat, lon, 1.0); v.n = v.p.clone().normalize();
      const up = Math.abs(v.n.y) > 0.98 ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 1, 0);
      v.e = new T.Vector3().crossVectors(up, v.n).normalize(); v.no = new T.Vector3().crossVectors(v.n, v.e).normalize();
      pin.position.copy(v.p); pin.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.n);
      // low, raking sunlight from the west-north-west so relief reads clearly
      sun.position.copy(v.p).add(v.n.clone().multiplyScalar(0.9)).add(v.e.clone().multiplyScalar(-1.6)).add(v.no.clone().multiplyScalar(0.6));
      sun.target.position.copy(v.p);
    };
    v.setSite0 = v.setSite; v.setSite = (lat, lon) => { v.setSite0(lat, lon); hdPatch(v, lat, lon); };
    v.frame = (c, t) => {
      const d = c.dist, el = c.el, az = c.az;
      const hor = v.no.clone().multiplyScalar(-Math.cos(az)).add(v.e.clone().multiplyScalar(-Math.sin(az)));
      const pos = v.p.clone().add(v.n.clone().multiplyScalar(Math.sin(el) * d)).add(hor.multiplyScalar(Math.cos(el) * d));
      camera.position.copy(pos); camera.up.copy(v.n); camera.lookAt(v.p.clone().add(v.n.clone().multiplyScalar(0.02)));
      const k = (t % 2000) / 2000; ring.scale.setScalar(1 + k * 2.2); ring.material.opacity = 1 - k;
      const sc = Math.max(0.12, d / 0.9); pin.scale.setScalar(sc);
      renderer.render(scene, camera);
    };
    v.resize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    return v;
  }

  const fmt = (lat, lon) => `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
  function pick() {
    const s = AF.state.site; if (!s) return null;
    let m = choice === 'moon' ? s.scores.find((x) => x.t.body === 'Moon') : choice === 'mars' ? s.scores.find((x) => x.t.body === 'Mars') : (s.scores.find((x) => x.t === AF.state.target) || s.best);
    return { s, m };
  }
  async function open() {
    const r = pick(); const msg = $('#v3dMsg');
    if (!r) { msg.hidden = false; msg.textContent = 'Open a site first, then tap 3D view.'; return; }
    msg.hidden = false; msg.textContent = 'Loading 3D…';
    try { await load(); } catch (e) { msg.textContent = 'Could not load the 3D view.'; return; }
    msg.hidden = true;
    if (!views.length) {
      views = [makeView($('#v3dA'), 'Earth'), null];
      views[0].onHD = (on) => { $('#v3dAh').hidden = !on; };
      bind($('#v3dWrap'));
    }
    const { s, m } = r, ll = AF.TLL[m.t.id] || [0, 0];
    if (!views[1] || views[1].body !== m.t.body) { if (views[1]) views[1].renderer.dispose(); const old = $('#v3dB'); const c = old.cloneNode(); old.replaceWith(c); views[1] = makeView(c, m.t.body); views[1].onHD = (on) => { $('#v3dBh').hidden = !on; }; }
    views[0].setSite(s.lat, s.lon); views[1].setSite(ll[0], ll[1]);
    $('#v3dAn').textContent = String(s.name).split(' (')[0]; $('#v3dAl').textContent = `${s.country} · ${fmt(s.lat, s.lon)}`;
    $('#v3dBk').textContent = m.t.body.toUpperCase(); $('#v3dBk').style.color = m.t.body === 'Mars' ? '#E2713F' : '#C9CED6';
    $('#v3dBn').textContent = m.t.name; $('#v3dBl').textContent = `${m.t.where} · ${fmt(ll[0], ll[1])}`;
    $('#v3dPct').textContent = m.p + '%'; $('#v3dPctB').textContent = m.t.body;
    page.querySelectorAll('[data-v3]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v3 === choice));
    views.forEach((v) => v.resize());
    cam.az = 0.6; cam.el = 0.5; cam.dist = 0.42; flyTo = null; touched = false;
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
  }
  function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (t > idle) cam.az += dt * 0.12;
    if (flyTo !== null) { cam.dist += (flyTo - cam.dist) * Math.min(1, dt * 1.5); if (Math.abs(cam.dist - flyTo) < 0.002) flyTo = null; }
    views.forEach((v) => v && v.frame(cam, t));
    raf = document.body.dataset.page === 'v3d' ? requestAnimationFrame(loop) : 0;
  }
  function bind(el) {
    let p = null, pinch = null; const pts = new Map();
    el.addEventListener('pointerdown', (e) => { pts.set(e.pointerId, e); el.setPointerCapture(e.pointerId); p = { x: e.clientX, y: e.clientY }; idle = performance.now() + 4000; });
    el.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, e);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); touched = true; flyTo = null; if (pinch) cam.dist = Math.min(3.2, Math.max(0.04, cam.dist * pinch / d)); pinch = d; return; }
      if (!p) return; cam.az -= (e.clientX - p.x) * 0.006; cam.el = Math.min(1.45, Math.max(0.12, cam.el + (e.clientY - p.y) * 0.004)); p = { x: e.clientX, y: e.clientY }; idle = performance.now() + 4000;
    });
    const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) p = null; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', (e) => { e.preventDefault(); touched = true; flyTo = null; cam.dist = Math.min(3.2, Math.max(0.04, cam.dist * (1 + e.deltaY * 0.001))); idle = performance.now() + 4000; }, { passive: false });
  }
  page.addEventListener('click', (e) => {
    const b = e.target.closest('[data-v3]'); if (b) { choice = b.dataset.v3; open(); }
    const z = e.target.closest('[data-zoom]'); if (z) { touched = true; flyTo = null; cam.dist = Math.min(3.2, Math.max(0.04, cam.dist * (z.dataset.zoom === 'in' ? 0.7 : 1.4))); idle = performance.now() + 3000; }
  });
  window.addEventListener('resize', () => views.forEach((v) => v && v.resize()));
  window.addEventListener('elsewhere:page', (e) => { if (e.detail === 'v3d') { choice = 'cur'; requestAnimationFrame(open); } });
  window.appOpen3D = open;
})();
