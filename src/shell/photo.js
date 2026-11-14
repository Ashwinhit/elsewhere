/*
 * Elsewhere · Apogeans: The Limit Breakers · NASA Space Apps Challenge 2026
 *
 * AI ASSISTANCE NOTICE
 * AI (Anthropic's Claude) helped us analyze the immense amount of data behind this
 * app: elevation, climate, geology and surface datasets for Earth, the Moon and
 * Mars, and turning it into the 16 feature scores and similarity matches the app
 * uses. AI also helped write and debug parts of this code. See README.md.
 */

(function () {
  // ================= PHOTO MATCH =================
  // Rates how Moon-like and Mars-like a landscape photo looks, from colour, plants, sky and texture.
  // Runs entirely on the device; photos are never uploaded.
  const $ = (s) => document.querySelector(s);
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('elsewhere.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('elsewhere.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

  // sRGB -> CIE Lab (D65)
  function lab(r, g, b) {
    const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const R = f(r), G = f(g), B = f(b);
    let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
    let y = (R * 0.2126 + G * 0.7152 + B * 0.0722);
    let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    const h = (t) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    x = h(x); y = h(y); z = h(z);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  }

  function analyse(img) {
    const S = 220, k = Math.min(1, S / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, w, h);
    const px = cx.getImageData(0, 0, w, h).data;
    const n = w * h, L = new Float32Array(n), cls = new Uint8Array(n);   // 0 ground, 1 sky, 2 plant, 3 water, 4 vivid
    let sky = 0, plant = 0, water = 0, vivid = 0, ground = 0, sMars = 0, sMoon = 0, sumL = 0;
    for (let i = 0; i < n; i++) {
      const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
      const [l, a, bb] = lab(r, g, b); L[i] = l;
      const C = Math.hypot(a, bb), hue = Math.atan2(bb, a) * 180 / Math.PI, yRel = Math.floor(i / w) / h;
      if (bb < -6 && l > 40 && yRel < 0.65) { cls[i] = 1; sky++; continue; }                     // blue sky
      if (l > 88 && C < 6 && yRel < 0.45) { cls[i] = 1; sky++; continue; }                        // bright overcast sky
      if (a < -7 && g > r * 1.03 && g >= b * 0.95) { cls[i] = 2; plant++; continue; }              // vegetation
      if (bb < -6 && yRel >= 0.65) { cls[i] = 3; water++; continue; }                             // water / blue below the horizon
      if (C > 55 && !(hue > 35 && hue < 80)) { cls[i] = 4; vivid++; continue; }                   // bright man-made colours
      ground++; sumL += l;
      // Mars: rusty ochre to butterscotch, hue ~45-75 deg, moderate chroma
      const hm = Math.exp(-Math.pow((hue - 58) / 17, 2)), cm = clamp((C - 8) / 14) * clamp((60 - C) / 20);
      const lm = clamp((l - 12) / 18) * clamp((88 - l) / 18);
      sMars += hm * cm * lm;
      // Moon: neutral grey regolith, low chroma, not black or blown-out white
      const gm = Math.exp(-Math.pow(C / 7.5, 2)), lmo = clamp((l - 14) / 14) * clamp((92 - l) / 14);
      sMoon += gm * lmo;
    }
    // texture: mean gradient of lightness over ground pixels
    let grad = 0, gn = 0;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x; if (cls[i] !== 0) continue;
      grad += Math.abs(L[i + 1] - L[i - 1]) + Math.abs(L[i + w] - L[i - w]); gn++;
    }
    const rough = gn ? grad / gn : 0;
    const scene = n - sky;                                        // everything below the sky
    const g = Math.max(ground, 1);
    const colMars = sMars / g, colMoon = sMoon / g;
    const groundShare = scene ? ground / scene : 0;
    const life = scene ? (plant + water) / scene : 0;
    const barren = clamp(1 - life * 1.6) * clamp(groundShare / 0.6);
    const tex = 0.72 + 0.28 * clamp(rough / 9);
    const art = scene ? clamp(1 - (vivid / scene) * 2.2) : 0;
    const mars = Math.round(100 * Math.pow(colMars, 0.75) * barren * tex * art);
    const moon = Math.round(100 * Math.pow(colMoon, 0.75) * barren * tex * art * 0.97);
    return {
      w, h, cls, mars, moon, rough,
      parts: { sky: sky / n, plant: scene ? plant / scene : 0, water: scene ? water / scene : 0, red: colMars, grey: colMoon, rough: clamp(rough / 9), ground: groundShare }
    };
  }

  function verdict(r) {
    const best = r.mars >= r.moon ? 'Mars' : 'Moon', p = Math.max(r.mars, r.moon);
    const rough = r.parts.rough > 0.55;
    const like = best === 'Mars' ? (rough ? 'rocky, rusty slopes, like Gale crater' : 'dusty red plains, like Meridiani Planum')
      : (rough ? 'rugged grey highlands, like the lunar south pole' : 'smooth grey plains, like Mare Tranquillitatis');
    let line;
    if (p >= 70) line = `Very ${best === 'Mars' ? 'Martian' : 'lunar'}! ${like.charAt(0).toUpperCase() + like.slice(1)}.`;
    else if (p >= 45) line = `Fairly ${best === 'Mars' ? 'Mars' : 'Moon'}-like: ${like}.`;
    else if (p >= 20) line = `A little ${best === 'Mars' ? 'Mars' : 'Moon'}-like, but Earth shows through.`;
    else line = 'Very Earth-like. Try a desert, bare rock, lava or a dry riverbed.';
    const why = [];
    if (r.parts.plant > 0.08) why.push('plants lower the score');
    if (r.parts.water > 0.08) why.push('water lowers the score');
    if (r.parts.ground < 0.45) why.push('not much bare ground is visible');
    return { best, p, line, why };
  }

  function maskPreview(img, r) {
    const cv = document.createElement('canvas'); cv.width = r.w; cv.height = r.h;
    const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, r.w, r.h);
    const d = cx.getImageData(0, 0, r.w, r.h);
    for (let i = 0; i < r.cls.length; i++) if (r.cls[i] !== 0) { d.data[i * 4] *= .25; d.data[i * 4 + 1] *= .25; d.data[i * 4 + 2] *= .3; }
    cx.putImageData(d, 0, 0); return cv.toDataURL('image/jpeg', .82);
  }
  function thumb(img, s = 160) {
    const k = s / Math.max(img.width, img.height), cv = document.createElement('canvas');
    cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); return cv.toDataURL('image/jpeg', .7);
  }

  function meter(label, val, color) {
    return `<div class="pm-meter"><div class="pm-top"><span>${label}</span><b>${val}<small>%</small></b></div><div class="pm-bar"><i style="width:${val}%;background:${color}"></i></div></div>`;
  }
  function show(img, r, src) {
    const v = verdict(r);
    const pct = (x) => Math.round(x * 100);
    $('#phResult').innerHTML = `
      <div class="card pm-card">
        <div class="pm-imgs"><img src="${src}" alt="Your photo"><img src="${maskPreview(img, r)}" alt="Areas analysed"></div>
        <p class="pm-cap">Right: the bright areas are what was scored. Sky, plants and water are dimmed.</p>
        <div class="pm-verdict"><span class="pm-badge pm-${v.p < 20 ? 'earth' : v.best.toLowerCase()}">Most like ${v.p < 20 ? 'Earth' : v.best}</span><p>${esc(v.line)}</p>${v.why.length ? `<p class="pm-why">${esc(v.why.join(' · '))}</p>` : ''}</div>
        ${meter('Mars', r.mars, '#E2713F')}
        ${meter('Moon', r.moon, '#C9CED6')}
        <div class="pm-parts">
          <span>Rusty-red ground <b>${pct(r.parts.red)}%</b></span>
          <span>Grey ground <b>${pct(r.parts.grey)}%</b></span>
          <span>Rocky texture <b>${pct(r.parts.rough)}%</b></span>
          <span>Plants <b>${pct(r.parts.plant)}%</b></span>
          <span>Sky ignored <b>${pct(r.parts.sky)}%</b></span>
        </div>
        <div class="tv-row"><button type="button" class="tv-ghost" id="pmShare">Share result</button><label class="tv-go pm-again" for="phIn">Try another</label></div>
      </div>`;
    $('#pmShare').addEventListener('click', () => {
      const text = `My photo scored ${r.mars}% like Mars and ${r.moon}% like the Moon in Elsewhere's Photo match, by Apogeans: The Limit Breakers.`;
      if (window.AndroidBridge && window.AndroidBridge.share) window.AndroidBridge.share(text);
      else if (navigator.share) navigator.share({ title: 'Elsewhere', text }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => window.appToast && window.appToast('Copied to clipboard'));
    });
    $('#phResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function history() {
    const H = store.get('photos', []);
    $('#phHistWrap').hidden = !H.length;
    $('#phHist').innerHTML = H.map((x) => `<div class="pm-h"><img src="${x.t}" alt=""><span><b style="color:#E2713F">${x.mars}%</b> Mars · <b style="color:#C9CED6">${x.moon}%</b> Moon</span></div>`).join('');
  }

  function rate(src) {
    const r = analyse(src), t = thumb(src);
    show(src, r, thumb(src, 640));
    const H = store.get('photos', []); H.unshift({ t, mars: r.mars, moon: r.moon }); store.set('photos', H.slice(0, 6));
    history();
    window.dispatchEvent(new CustomEvent('elsewhere:photo', { detail: { mars: r.mars, moon: r.moon } }));
  }

  // ---------- live camera ----------
  const cam = { stream: null, timer: 0 };
  const camView = document.getElementById('camView'), video = document.getElementById('camVideo');
  function frame(maxSide) {
    const w = video.videoWidth, h = video.videoHeight; if (!w) return null;
    const k = Math.min(1, maxSide / Math.max(w, h)), c = document.createElement('canvas');
    c.width = Math.round(w * k); c.height = Math.round(h * k); c.getContext('2d').drawImage(video, 0, 0, c.width, c.height); return c;
  }
  function live() {
    const c = frame(200); if (!c) return;
    const r = analyse(c), v = verdict(r);
    document.getElementById('camMars').textContent = r.mars; document.getElementById('camMoon').textContent = r.moon;
    document.getElementById('camMarsBar').style.width = r.mars + '%'; document.getElementById('camMoonBar').style.width = r.moon + '%';
    document.getElementById('camHint').textContent = v.p < 20 ? 'Point at bare ground, rocks or a desert' : (v.best === 'Mars' ? 'Looking Martian…' : 'Looking lunar…');
  }
  async function openCam() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { document.getElementById('phCap').click(); return; }
    try {
      cam.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    } catch (err) {
      window.appToast && window.appToast('Camera not available. You can still choose a photo.');
      document.getElementById('phCap').click(); return;
    }
    video.srcObject = cam.stream; camView.hidden = false; document.body.classList.add('cam-on');
    try { await video.play(); } catch (e) {}
    cam.timer = setInterval(live, 450);
  }
  function closeCam() {
    clearInterval(cam.timer);
    if (cam.stream) cam.stream.getTracks().forEach((t) => t.stop());
    cam.stream = null; video.srcObject = null; camView.hidden = true; document.body.classList.remove('cam-on');
  }
  document.getElementById('camOpen').addEventListener('click', openCam);
  document.getElementById('camClose').addEventListener('click', closeCam);
  document.getElementById('camShot').addEventListener('click', () => {
    const c = frame(1280); if (!c) return;
    const fl = document.getElementById('camFlash'); fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
    closeCam(); rate(c);
  });
  window.addEventListener('elsewhere:page', (e) => { if (e.detail !== 'photo' && cam.stream) closeCam(); });
  window.addEventListener('popstate', () => { if (cam.stream) closeCam(); });

  document.getElementById('phCap').addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; if (f) handleFile(f, e.target); });
  function handleFile(f, input) {
    $('#phResult').innerHTML = '<div class="card pm-card pm-wait">Looking at your photo…</div>';
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => { try { rate(img); } catch (err) { $('#phResult').innerHTML = '<div class="card pm-card pm-wait">Sorry, that photo could not be read. Try a JPG or PNG.</div>'; } URL.revokeObjectURL(url); input.value = ''; };
    img.onerror = () => { $('#phResult').innerHTML = '<div class="card pm-card pm-wait">Sorry, that file is not a photo this app can open.</div>'; input.value = ''; };
    img.src = url;
  }

  $('#phIn').addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; if (f) handleFile(f, e.target); });
  history();
  window.elsewherePhoto = { analyse };   // for testing
})();
