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
  // ================= MORE TOOLS =================
  const AF = window.AF, $ = (s) => document.querySelector(s);
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('elsewhere.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('elsewhere.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  const short = (n) => String(n).split(' (')[0];
  const key = (s) => s.name + '|' + s.country;
  const findSite = (k) => AF.S.find((s) => key(s) === k);
  const openSite = (s) => { AF.selectCountry(s.country, s); window.appGo('site'); };
  const toast = (m) => window.appToast && window.appToast(m);
  const pct = (s) => (s.best ? s.best.p : 0);

  // ---------- badges: simple counters ----------
  const stats = store.get('stats', { countries: [], sites: 0, checks: 0, trivia: 0, perfect: 0, photos: 0, marsPhoto: 0, moonPhoto: 0, clock: 0, compare: 0, near: 0 });
  const bump = (k, v) => {
    if (k === 'countries') { if (!stats.countries.includes(v)) stats.countries.push(v); }
    else stats[k] = (stats[k] || 0) + (v || 1);
    store.set('stats', stats); checkBadges();
  };
  window.addEventListener('elsewhere:trivia', (e) => { bump('trivia'); if (e.detail.score === 10) bump('perfect'); });
  window.addEventListener('elsewhere:photo', (e) => { bump('photos'); if (e.detail.mars >= 60) bump('marsPhoto'); if (e.detail.moon >= 60) bump('moonPhoto'); });

  const BADGES = [
    ['first', 'First steps', 'Open your first analog site', () => stats.sites >= 1],
    ['globe10', 'Globetrotter', 'Explore 10 countries', () => stats.countries.length >= 10],
    ['globe50', 'World explorer', 'Explore 50 countries', () => stats.countries.length >= 50],
    ['pins', 'Pin dropper', 'Check 3 places', () => stats.checks >= 3],
    ['quiz', 'Quiz whiz', 'Finish a trivia round', () => stats.trivia >= 1],
    ['ten', 'Perfect 10', 'Score 10/10 in trivia', () => stats.perfect >= 1],
    ['photo', 'Shutterbug', 'Rate 3 photos', () => stats.photos >= 3],
    ['marseye', 'Martian eye', 'Find a photo that is 60%+ Mars', () => stats.marsPhoto >= 1],
    ['mooneye', 'Lunar eye', 'Find a photo that is 60%+ Moon', () => stats.moonPhoto >= 1],
    ['curator', 'Curator', 'Save 5 sites', () => store.get('saved', []).length >= 5],
    ['notes', 'Field scientist', 'Write a field note', () => Object.keys(store.get('notes', {})).length >= 1],
    ['near', 'Local scout', 'Find analogs near you', () => stats.near >= 1],
    ['compare', 'Analyst', 'Compare two sites', () => stats.compare >= 1],
    ['clock', 'Mission control', 'Open the Space clock', () => stats.clock >= 1],
  ];
  function checkBadges() {
    const got = store.get('badges', []);
    BADGES.forEach(([id, name, , test]) => { if (!got.includes(id) && test()) { got.push(id); toast('🏅 Badge unlocked: ' + name); } });
    store.set('badges', got);
  }

  // ---------- site page: save + field notes ----------
  const tools = document.createElement('div'); tools.id = 'siteTools'; tools.className = 'card site-tools';
  $('#pg-site').appendChild(tools);
  let lastSite = null;
  function renderSiteTools() {
    const s = AF.state.site; if (!s) { tools.hidden = true; return; }
    tools.hidden = false;
    const k = key(s), saved = store.get('saved', []).includes(k), notes = store.get('notes', {});
    tools.innerHTML = `
      <div class="st-row"><button type="button" class="st-save${saved ? ' on' : ''}" id="stSave">${saved ? '★ Saved' : '☆ Save site'}</button>
        <button type="button" class="st-save" id="stCompare">Compare…</button></div>
      <label class="st-lab" for="stNote">Field notes</label>
      <textarea id="stNote" rows="3" placeholder="What did you see? Rocks, soil colour, weather, ideas for a test…">${esc(notes[k] || '')}</textarea>
      <div class="st-hint">Notes are saved on this device.</div>`;
    $('#stSave').onclick = () => {
      const L = store.get('saved', []), i = L.indexOf(k);
      if (i >= 0) L.splice(i, 1); else L.unshift(k);
      store.set('saved', L); renderSiteTools(); checkBadges(); toast(i >= 0 ? 'Removed from saved' : 'Saved');
    };
    $('#stCompare').onclick = () => { cmp.a = k; window.appGo('compare'); };
    let tmr;
    $('#stNote').oninput = (e) => {
      clearTimeout(tmr); tmr = setTimeout(() => {
        const N = store.get('notes', {}); const v = e.target.value.trim();
        if (v) N[k] = v; else delete N[k]; store.set('notes', N); checkBadges();
      }, 400);
    };
    if (lastSite !== k) {
      lastSite = k; bump('sites'); bump('countries', s.country);
      if (s.basis === 'checked') bump('checks');
    }
  }
  new MutationObserver(renderSiteTools).observe($('#dossier'), { childList: true });

  // ---------- saved ----------
  function renderSaved() {
    const L = store.get('saved', []).map(findSite).filter(Boolean), N = store.get('notes', {});
    $('#savedList').innerHTML = L.length ? L.map((s) => `<button type="button" class="rrow" data-k="${esc(key(s))}"><b>${esc(short(s.name))}</b><span>${esc(s.country)}${s.best ? ' · like ' + esc(s.best.t.name) : ''}${N[key(s)] ? ' · 📝 note' : ''}</span><span class="v">${pct(s)}%</span></button>`).join('')
      : '<div class="empty">No saved sites yet. Open any site and tap <b>☆ Save site</b>.</div>';
    $('#savedList').querySelectorAll('[data-k]').forEach((b) => b.onclick = () => openSite(findSite(b.dataset.k)));
  }

  // ---------- near me ----------
  const R = 6371, rad = (d) => d * Math.PI / 180;
  const hav = (a, b, c, d) => { const x = Math.sin(rad(c - a) / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(rad(d - b) / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
  function nearList(lat, lon, label) {
    const L = AF.S.filter((s) => s.best && s.basis !== 'checked' && pct(s) >= 45)
      .map((s) => ({ s, d: hav(lat, lon, s.lat, s.lon) })).sort((a, b) => a.d - b.d).slice(0, 15);
    $('#nearOut').innerHTML = `<p class="note" style="margin:0 0 8px">Closest strong analogs (45%+) to ${esc(label)}:</p>` + L.map(({ s, d }) =>
      `<button type="button" class="rrow" data-k="${esc(key(s))}"><b>${esc(short(s.name))}</b><span>${esc(s.country)} · ${d < 10 ? '<10' : Math.round(d).toLocaleString('en-US')} km · like ${esc(s.best.t.name)}</span><span class="v">${pct(s)}%</span></button>`).join('');
    $('#nearOut').querySelectorAll('[data-k]').forEach((b) => b.onclick = () => openSite(findSite(b.dataset.k)));
    bump('near');
  }
  function locate() {
    $('#nearOut').innerHTML = '<div class="empty">Finding your location…</div>';
    if (!navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition((p) => nearList(p.coords.latitude, p.coords.longitude, 'your location'), fallback, { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 });
  }
  function fallback() {
    const s = AF.state.site;
    if (s) nearList(s.lat, s.lon, short(s.name) + ' (location unavailable, using the last site you opened)');
    else $('#nearOut').innerHTML = '<div class="empty">Location is unavailable. Open any site first, or allow location access.</div>';
  }

  // ---------- compare ----------
  const cmp = { a: null, b: null };
  function siteOptions() {
    return AF.S.filter((s) => s.best).map((s) => `<option value="${esc(short(s.name) + ' — ' + s.country)}"></option>`).join('');
  }
  function pickByLabel(v) { return AF.S.find((s) => s.best && short(s.name) + ' — ' + s.country === v); }
  function renderCompare() {
    const A = (cmp.a && findSite(cmp.a)) || AF.state.site || AF.S.find((s) => /Samail/.test(s.name));
    const B = (cmp.b && findSite(cmp.b)) || AF.S.find((s) => /Licancabur/.test(s.name)) || AF.S[1];
    cmp.a = key(A); cmp.b = key(B);
    if (!$('#cmpList').innerHTML) $('#cmpList').innerHTML = siteOptions();
    $('#cmpA').value = short(A.name) + ' — ' + A.country; $('#cmpB').value = short(B.name) + ' — ' + B.country;
    const F = AF.F, rows = F.map((f, i) => {
      const a = A.v[i] || 0, b = B.v[i] || 0;
      return `<div class="cp-row"><span>${esc(typeof f === 'string' ? f : f.name || f.label || ('Feature ' + (i + 1)))}</span><div class="cp-bars"><i class="a" style="width:${a / 9 * 100}%"></i><i class="b" style="width:${b / 9 * 100}%"></i></div><em>${a.toFixed(0)} · ${b.toFixed(0)}</em></div>`;
    }).join('');
    const winner = pct(A) === pct(B) ? 'Both match equally well.' : `${esc(short((pct(A) > pct(B) ? A : B).name))} is the stronger analog.`;
    $('#cmpOut').innerHTML = `
      <div class="cp-head"><div><i class="dot a"></i><b>${esc(short(A.name))}</b><span>${esc(A.country)}</span><strong>${pct(A)}%</strong><small>like ${esc(A.best.t.name)}</small></div>
        <div><i class="dot b"></i><b>${esc(short(B.name))}</b><span>${esc(B.country)}</span><strong>${pct(B)}%</strong><small>like ${esc(B.best.t.name)}</small></div></div>
      <p class="note" style="margin:4px 0 10px">${winner} Scores are 0 (none) to 9 (extreme).</p>${rows}`;
    bump('compare');
  }
  $('#cmpA').addEventListener('change', (e) => { const s = pickByLabel(e.target.value); if (s) { cmp.a = key(s); renderCompare(); } });
  $('#cmpB').addEventListener('change', (e) => { const s = pickByLabel(e.target.value); if (s) { cmp.b = key(s); renderCompare(); } });
  $('#cmpSwap').addEventListener('click', () => { [cmp.a, cmp.b] = [cmp.b, cmp.a]; renderCompare(); });

  // ---------- space clock ----------
  const JD = (ms) => ms / 86400000 + 2440587.5;
  const EM = { a: [1.00000261, 0.00000562], e: [0.01671123, -0.00004392], I: [-0.00001531, -0.01294668], L: [100.46457166, 35999.37244981], w: [102.93768193, 0.32327364], O: [0, 0] };
  const MA = { a: [1.52371034, 0.00001847], e: [0.09339410, 0.00007882], I: [1.84969142, -0.00813131], L: [-4.55343205, 19140.30268499], w: [-23.94362959, 0.44441088], O: [49.55953891, -0.29257343] };
  function helio(el, T) {   // JPL approximate Keplerian elements (valid 1800-2050)
    const g = {}; for (const k in el) g[k] = el[k][0] + el[k][1] * T;
    const M = rad(((g.L - g.w) % 360 + 360) % 360), e = g.e; let E = M;
    for (let i = 0; i < 12; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    const x = g.a * (Math.cos(E) - e), y = g.a * Math.sqrt(1 - e * e) * Math.sin(E);
    const w = rad(g.w - g.O), O = rad(g.O), I = rad(g.I);
    return [(Math.cos(w) * Math.cos(O) - Math.sin(w) * Math.sin(O) * Math.cos(I)) * x + (-Math.sin(w) * Math.cos(O) - Math.cos(w) * Math.sin(O) * Math.cos(I)) * y,
      (Math.cos(w) * Math.sin(O) + Math.sin(w) * Math.cos(O) * Math.cos(I)) * x + (-Math.sin(w) * Math.sin(O) + Math.cos(w) * Math.cos(O) * Math.cos(I)) * y,
      Math.sin(w) * Math.sin(I) * x + Math.cos(w) * Math.sin(I) * y];
  }
  function moonSvg(age) {
    const P = 29.530588853, k = age / P, ill = (1 - Math.cos(2 * Math.PI * k)) / 2;
    const waxing = k < .5, rx = 46 * Math.abs(1 - 2 * ill);
    const lit = waxing ? 'right' : 'left';
    // lit half + terminator ellipse
    const half = lit === 'right' ? 'M50 4 A46 46 0 0 1 50 96' : 'M50 4 A46 46 0 0 0 50 96';
    const term = `A${rx} 46 0 0 ${(ill > .5) === (lit === 'right') ? 1 : 0} 50 4`;
    return `<svg viewBox="0 0 100 100" width="120" height="120"><circle cx="50" cy="50" r="46" fill="#1A1E24"/><path d="${half} ${term} Z" fill="#E7E4DC"/><circle cx="50" cy="50" r="46" fill="none" stroke="#3A3F46"/></svg>`;
  }
  let clockT = 0;
  function tickClock() {
    const now = Date.now(), jd = JD(now);
    // Moon phase (mean synodic month; within about half a day)
    const P = 29.530588853, age = (((jd - 2451550.1) % P) + P) % P, ill = (1 - Math.cos(2 * Math.PI * age / P)) / 2;
    const names = ['New Moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full Moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
    const name = names[Math.floor(((age / P) * 8 + 0.5)) % 8];
    const toFull = age < P / 2 ? P / 2 - age : P - age + P / 2, toNew = P - age;
    // Mars time (Allison & McEwen 2000)
    const jdtt = jd + 69.184 / 86400, msd = (jdtt - 2451549.5) / 1.0274912517 + 44796.0 - 0.0009626;
    const mtc = ((msd % 1) + 1) % 1 * 24, hh = Math.floor(mtc), mm = Math.floor((mtc - hh) * 60), ss = Math.floor(((mtc - hh) * 60 - mm) * 60);
    // Earth-Mars distance and signal delay
    const T = (jd - 2451545) / 36525, e = helio(EM, T), m = helio(MA, T);
    const au = Math.hypot(m[0] - e[0], m[1] - e[1], m[2] - e[2]), km = au * 149597870.7, lt = km / 299792.458;
    const pad = (x) => String(x).padStart(2, '0');
    $('#clockOut').innerHTML = `
      <div class="card ck-moon">${moonSvg(age)}<div><div class="eyebrow">THE MOON TONIGHT</div><h3 class="ck-big">${name}</h3>
        <p>${Math.round(ill * 100)}% lit · ${age.toFixed(1)} days old</p><p>Full Moon in ${toFull.toFixed(1)} days · New Moon in ${toNew.toFixed(1)} days</p></div></div>
      <div class="ck-grid">
        <div class="card ck-tile"><div class="eyebrow">TIME ON MARS (MTC)</div><b class="mono">${pad(hh)}:${pad(mm)}:${pad(ss)}</b><span>Sol ${Math.floor(msd).toLocaleString('en-US')} · Mars Sol Date</span></div>
        <div class="card ck-tile"><div class="eyebrow">EARTH TO MARS NOW</div><b class="mono">${(km / 1e6).toFixed(1)}<small> million km</small></b><span>${au.toFixed(3)} AU</span></div>
        <div class="card ck-tile"><div class="eyebrow">SIGNAL DELAY TO MARS</div><b class="mono">${Math.floor(lt / 60)}<small> min </small>${Math.round(lt % 60)}<small> s</small></b><span>One way, at light speed</span></div>
        <div class="card ck-tile"><div class="eyebrow">SIGNAL DELAY TO THE MOON</div><b class="mono">1.3<small> s</small></b><span>Average, one way</span></div>
      </div>
      <p class="nw-credit">Calculated on your device from orbital formulas, so it works offline. Moon phase is accurate to within about half a day.</p>`;
  }

  // ---------- weight + jump ----------
  function renderWeight() {
    const kg = Math.max(1, +$('#wtKg').value || 60), jump = Math.max(1, +$('#wtJump').value || 40);
    const G = { Earth: 9.81, Moon: 1.62, Mars: 3.71 };
    $('#wtOut').innerHTML = ['Earth', 'Moon', 'Mars'].map((b) => `
      <div class="card wt-c wt-${b.toLowerCase()}"><div class="eyebrow">${b.toUpperCase()}</div>
        <b class="mono">${(kg * G[b] / G.Earth).toFixed(1)}<small> kg</small></b><span>feels like on a scale</span>
        <b class="mono sm">${Math.round(jump * G.Earth / G[b])}<small> cm</small></b><span>jump height</span></div>`).join('') +
      `<p class="nw-credit" style="grid-column:1/-1">Gravity: Moon 1.62 m/s² (about 1/6 of Earth), Mars 3.71 m/s² (about 38%). Jumps ignore spacesuits, which are heavy!</p>`;
  }
  $('#wtKg').addEventListener('input', renderWeight); $('#wtJump').addEventListener('input', renderWeight);

  // ---------- landing timeline ----------
  const TL = [
    [1966, 'Moon', 'Luna 9', 'USSR', 'First soft landing on the Moon.'],
    [1969, 'Moon', 'Apollo 11', 'USA', 'First people on the Moon, in Mare Tranquillitatis.', 'Mare Tranquillitatis'],
    [1971, 'Moon', 'Apollo 15', 'USA', 'First lunar rover drives at Hadley–Apennine.', 'Hadley–Apennine'],
    [1972, 'Moon', 'Apollo 17', 'USA', 'Last crewed landing so far, in the Taurus–Littrow valley.', 'Taurus–Littrow valley'],
    [1976, 'Mars', 'Viking 1 and 2', 'USA', 'First long-lived Mars landers, in Chryse and Utopia Planitia.', 'Utopia Planitia'],
    [1997, 'Mars', 'Mars Pathfinder', 'USA', 'Sojourner becomes the first Mars rover, at Ares Vallis.', 'Ares Vallis, Chryse Planitia'],
    [2004, 'Mars', 'Opportunity', 'USA', 'Finds signs of ancient water at Meridiani Planum.', 'Meridiani Planum'],
    [2008, 'Mars', 'Phoenix', 'USA', 'Touches water ice in the far northern plains.', 'Vastitas Borealis'],
    [2012, 'Mars', 'Curiosity', 'USA', 'Lands in Gale Crater and starts climbing Mount Sharp.', 'Gale Crater / Mount Sharp'],
    [2013, 'Moon', "Chang'e 3", 'China', 'Yutu rover, the first lunar landing since 1976.'],
    [2018, 'Mars', 'InSight', 'USA', 'Listens for marsquakes on Elysium Planitia.', 'Elysium Planitia'],
    [2019, 'Moon', "Chang'e 4", 'China', 'First landing on the far side, in Von Kármán crater.', 'Von Kármán crater'],
    [2021, 'Mars', 'Perseverance', 'USA', 'Collects samples in Jezero Crater; Ingenuity makes the first powered flight on another planet.', 'Jezero Crater delta'],
    [2021, 'Mars', 'Zhurong', 'China', "China's first Mars rover, in Utopia Planitia.", 'Utopia Planitia'],
    [2023, 'Moon', 'Chandrayaan-3', 'India', 'First soft landing near the lunar south pole, at Shiv Shakti point.', 'Shiv Shakti point'],
    [2024, 'Moon', 'SLIM', 'Japan', 'A pin-point landing within about 100 m of its target.'],
    [2024, 'Moon', 'IM-1 Odysseus', 'USA', 'First commercial spacecraft to land on the Moon, near the south pole.'],
    [2024, 'Moon', "Chang'e 6", 'China', 'Brings the first samples back from the far side.'],
    [2025, 'Moon', 'Blue Ghost Mission 1', 'USA', 'A commercial lander works through a full lunar day in Mare Crisium.'],
  ];
  function renderTimeline() {
    $('#tlOut').innerHTML = TL.map(([y, b, m, c, d, t]) => `
      <div class="tl-i tl-${b.toLowerCase()}"><div class="tl-y">${y}</div><div class="tl-dot"></div><div class="card tl-c">
        <div class="tl-h"><b>${esc(m)}</b><span class="tv-tag tv-${b.toLowerCase()}">${b}</span></div><p>${esc(d)}</p><small>${esc(c)}</small>
        ${t && AF.T.find((x) => x.name === t) ? `<button type="button" class="tv-link" data-t="${esc(t)}">Find this place on Earth →</button>` : ''}</div></div>`).join('') +
      `<div class="tl-i tl-next"><div class="tl-y">Next</div><div class="tl-dot"></div><div class="card tl-c"><div class="tl-h"><b>Artemis</b><span class="tv-tag tv-moon">Moon</span></div><p>NASA plans to land astronauts near the lunar south pole: the region Elsewhere matches against Shackleton, Malapert and Nobile Rim.</p></div></div>`;
    $('#tlOut').querySelectorAll('[data-t]').forEach((b) => b.onclick = () => {
      const t = AF.T.find((x) => x.name === b.dataset.t);
      const best = AF.S.filter((s) => s.best && s.basis !== 'checked').map((s) => ({ s, p: AF.score ? AF.score(s.v, t.v) : 0 })).sort((a, b2) => b2.p - a.p)[0];
      if (best && best.s) { openSite(best.s); toast('Closest Earth analog to ' + t.name); }
    });
  }

  // ---------- glossary ----------
  const GL = [
    ['Analog site', 'A place on Earth that is like part of the Moon or Mars in some way, used to test equipment and train crews.'],
    ['Regolith', 'The loose layer of dust and broken rock that covers the Moon and Mars.'],
    ['Mare (plural maria)', 'The dark, flat plains on the Moon, made of old basalt lava. Latin for "sea".'],
    ['Basalt', 'Dark volcanic rock that forms from runny lava. It is common on Earth, the Moon and Mars.'],
    ['Lava tube', 'A tunnel left behind when the outside of a lava flow cools and the inside drains away. A possible shelter for a base.'],
    ['Skylight', 'A hole where the roof of a lava tube has collapsed, giving a way in.'],
    ['Permanently shadowed region', 'A crater near a pole whose floor never sees sunlight. Some hold water ice.'],
    ['Water ice', 'Frozen water. On the Moon and Mars it could give drinking water, oxygen and rocket fuel.'],
    ['Impact crater', 'A bowl-shaped hole made when an asteroid or comet hits a surface.'],
    ['Ophiolite', 'A slice of ocean floor and mantle rock pushed up onto land, like Oman\'s Samail Ophiolite.'],
    ['Iron oxide', 'Rust. It gives Mars its red colour.'],
    ['Perchlorate', 'A salt found in Martian soil that is harmful to people, so it must be removed before using the soil.'],
    ['Sol', 'One day on Mars: about 24 hours 40 minutes.'],
    ['ISRU', 'In-situ resource utilisation: using what is already on the Moon or Mars, like ice and soil, instead of bringing it from Earth.'],
    ['Landing ellipse', 'The oval area where a spacecraft is expected to touch down, allowing for small errors.'],
    ['Exosphere', 'The extremely thin layer of gas around the Moon. It is far too thin to breathe or to protect against radiation.'],
    ['Delta', 'Fan-shaped sediment left where a river flowed into a lake, like Jezero Crater on Mars.'],
    ['Terminator', 'The line between day and night on a planet or moon.'],
  ];
  function renderGlossary(q = '') {
    const s = q.trim().toLowerCase();
    $('#glOut').innerHTML = GL.filter(([t, d]) => !s || (t + ' ' + d).toLowerCase().includes(s)).map(([t, d]) => `<div class="card gl-i"><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join('') || '<div class="empty">No matching term.</div>';
  }
  $('#glQ').addEventListener('input', (e) => renderGlossary(e.target.value));

  // ---------- badges page ----------
  function renderBadges() {
    checkBadges();
    const got = store.get('badges', []);
    $('#bdOut').innerHTML = `<p class="note" style="margin:0 0 10px">${got.length} of ${BADGES.length} unlocked · ${stats.countries.length} countries explored</p>` +
      BADGES.map(([id, n, d]) => `<div class="card bd-i${got.includes(id) ? ' on' : ''}"><span class="bd-ic">${got.includes(id) ? '🏅' : '🔒'}</span><b>${esc(n)}</b><small>${esc(d)}</small></div>`).join('');
  }

  // ---------- analog of the day (home) ----------
  function aotd() {
    const good = AF.S.filter((s) => s.best && s.basis !== 'checked' && pct(s) >= 55 && !/unnamed|grid|·/i.test(s.name));
    if (!good.length) return;
    const d = new Date(), day = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
    const s = good[(day * 37) % good.length];
    const c = $('#aotd'); c.hidden = false;
    c.innerHTML = `<span class="eyebrow">ANALOG OF THE DAY</span><b>${esc(short(s.name))}</b><span class="ad-s">${esc(s.country)} · ${pct(s)}% like ${esc(s.best.t.name)} on ${s.best.t.body}</span>`;
    c.onclick = () => openSite(s);
  }

  // ---------- page hooks ----------
  window.addEventListener('elsewhere:page', (e) => {
    const p = e.detail;
    clearInterval(clockT);
    if (p === 'saved') renderSaved();
    if (p === 'near') { if (!$('#nearOut').innerHTML) $('#nearOut').innerHTML = '<div class="empty">Tap the button to find analogs near you.</div>'; }
    if (p === 'compare') renderCompare();
    if (p === 'clock') { tickClock(); clockT = setInterval(tickClock, 1000); bump('clock'); }
    if (p === 'weight') renderWeight();
    if (p === 'timeline') renderTimeline();
    if (p === 'glossary') renderGlossary($('#glQ').value);
    if (p === 'badges') renderBadges();
    if (p === 'more') { const g = store.get('badges', []).length; $('#moreBadges').textContent = g + ' of ' + BADGES.length + ' unlocked'; $('#moreSaved').textContent = store.get('saved', []).length + ' saved'; }
  });
  $('#nearGo').addEventListener('click', locate);
  aotd(); checkBadges();
})();
