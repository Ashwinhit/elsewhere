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
  const AF = window.AF, $ = (s) => document.querySelector(s);
  const TITLES = { home: '', earth: 'Earth analogs', site: 'Site', check: 'Check a place', explore: 'Moon & Mars', trivia: 'Space trivia', news: 'Space news', photo: 'Photo match', about: 'About', more: 'More', saved: 'Saved sites', near: 'Near me', compare: 'Compare', clock: 'Space clock', weight: 'Your weight', timeline: 'Landings', glossary: 'Glossary', badges: 'Badges' };
  const PAGES = ['home', 'earth', 'site', 'check', 'explore', 'trivia', 'news', 'photo', 'about', 'more', 'saved', 'near', 'compare', 'clock', 'weight', 'timeline', 'glossary', 'badges', 'films'];
  const SUB = ['site', 'check', 'about', 'photo', 'more', 'saved', 'near', 'compare', 'clock', 'weight', 'timeline', 'glossary', 'badges', 'films'];
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const short = (n) => String(n).split(' (')[0];
  let cur = null;
  const scrollMem = {};
  // ---------- native app shell: the page list scrolls, not the document ----------
  const SC = document.getElementById('pages');
  const _st = window.scrollTo.bind(window);
  window.scrollTo = function (a, b) { if (typeof a === 'object') SC.scrollTo(a); else SC.scrollTo(a || 0, b || 0); };
  const onScroll = () => {
    const y = SC.scrollTop;
    document.body.classList.toggle('scrolled', y > 8);
    document.body.classList.toggle('titled', y > 64);
  };
  SC.addEventListener('scroll', onScroll, { passive: true });
  // light haptic tick on every tap target (Android WebView honours navigator.vibrate)
  document.addEventListener('click', (e) => { if (e.target.closest('button, [data-go], .tab, a, label, select, input[type=checkbox], input[type=radio]')) try { navigator.vibrate && navigator.vibrate(7); } catch (_) {} }, true);
  // swipe from the left edge to go back on inner screens
  let sx = null, sy = 0;
  document.addEventListener('touchstart', (e) => { const t = e.touches[0]; sx = (t.clientX < 26 && SUB.includes(cur)) ? t.clientX : null; sy = t.clientY; }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (sx === null) return; const t = e.touches[0], dx = t.clientX - sx;
    if (Math.abs(t.clientY - sy) > 40) { sx = null; return; }
    const pg = document.querySelector('.page.on'); if (pg) { pg.style.transform = `translateX(${Math.max(0, dx * .6)}px)`; pg.style.opacity = 1 - Math.min(.5, dx / 600); }
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null;
    const pg = document.querySelector('.page.on'); if (pg) { pg.style.transform = ''; pg.style.opacity = ''; }
    if (dx > 90) history.back();
  });

  // ---------- router ----------
  function show(p, how) {
    if (!PAGES.includes(p)) p = 'home';
    if (cur) scrollMem[cur] = SC.scrollTop;
    const prev = cur; cur = p;
    document.querySelectorAll('.page').forEach((el) => {
      const on = el.id === 'pg-' + p;
      el.classList.toggle('on', on);
      el.classList.toggle('back', on && how === 'back');
      el.classList.toggle('tabsw', on && how !== 'back' && !SUB.includes(p));
    });
    const tabKey = (p === 'site' || p === 'check') ? 'earth' : p;
    document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-current', t.dataset.go === tabKey ? 'page' : 'false'));
    document.body.dataset.page = p;
    const sub = SUB.includes(p);
    $('#tbBack').hidden = !sub; $('#tbBrand').hidden = sub; $('#tbInfo').hidden = sub; $('#tbShare').hidden = !(p === 'site' && AF.state.site);
    setTitle();
    document.body.classList.toggle('subpage', sub);
    if (p === 'home') refreshHome();
    if (p === 'check') refreshRecent();
    if (p !== 'earth') stopPicking(true);
    const y = (p === 'site' && how !== 'back') ? 0 : (scrollMem[p] || 0);
    SC.scrollTop = y; onScroll();
    stars.run(p === 'home');
    window.dispatchEvent(new CustomEvent('elsewhere:page', { detail: p }));
    if (prev === p) return;
  }
  function setTitle() {
    const s = AF.state.site;
    $('#tbTitle').textContent = cur === 'site' ? (s ? short(s.name) : 'Site')
      : cur === 'earth' ? (AF.state.country ? 'Analogs in ' + AF.state.country : TITLES.earth) : TITLES[cur] || '';
  }
  function go(p) {
    if (p === cur) {
      if (p === 'site') { setTitle(); $('#tbShare').hidden = !AF.state.site; window.scrollTo(0, 0); }
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Sub-pages and the first step away from Home add history; switching between tabs replaces it,
    // so the phone's back button walks Site -> Earth -> Home -> exit.
    const push = SUB.includes(p) || cur === 'home';
    history[push ? 'pushState' : 'replaceState']({ p }, '', '#' + p);
    show(p, 'fwd');
  }
  window.addEventListener('popstate', () => show((location.hash || '#home').slice(1), 'back'));
  window.appSetTab = (name, top) => { go(PAGES.includes(name) ? name : 'home'); if (top) window.scrollTo(0, 0); };
  window.appGo = go;

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) {
      go(b.dataset.go);
      if (b.dataset.focus) setTimeout(() => { const i = $('#country'); i.value = ''; i.focus(); }, 60);
      return;
    }
    if (e.target.closest('[data-goto]')) setTimeout(() => go('site'), 0);
  });
  $('#tbBack').addEventListener('click', () => { if (history.length > 1) history.back(); else go('home'); });
  $('#tbShare').addEventListener('click', () => { const b = $('#shareRes'); if (b) b.click(); });

  // list and map taps open the site page
  $('#sites').addEventListener('click', (e) => { if (e.target.closest('.site')) go('site'); });
  $('#sites').addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.site')) go('site'); });
  $('#map').addEventListener('click', (e) => {
    const g = e.target.closest('g'), d = g && g.__data__;
    if (d && d.best && typeof d.lat === 'number') go('site');
  });

  // "Tap the map" from the Check page jumps to the Earth map
  function stopPicking(silent) {
    $('#pickbar').hidden = true;
    if (!silent) return;
    const t = $('#ckTap');
    if (t && t.getAttribute('aria-pressed') === 'true') t.click();
  }
  $('#ckTap').addEventListener('click', () => {
    if ($('#ckTap').getAttribute('aria-pressed') === 'true') {
      if (cur !== 'earth') go('earth');
      $('#pickbar').hidden = false;
      setTimeout(() => $('#map').scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    } else $('#pickbar').hidden = true;
  });
  $('#pickCancel').addEventListener('click', () => { const t = $('#ckTap'); if (t.getAttribute('aria-pressed') === 'true') t.click(); $('#pickbar').hidden = true; });
  new MutationObserver(() => { if ($('#ckTap').getAttribute('aria-pressed') !== 'true') $('#pickbar').hidden = true; })
    .observe($('#ckTap'), { attributes: true, attributeFilter: ['aria-pressed'] });

  // keep the Earth title in step with the country
  new MutationObserver(() => { if (cur === 'earth' || cur === 'site') setTitle(); }).observe($('#listTitle'), { childList: true, subtree: true, characterData: true });
  $('#form').addEventListener('submit', () => $('#country').blur());

  // ---------- home ----------
  const COLOR = AF.COLOR;
  function pctHTML(p) { return `${p}<small>%</small>`; }
  function openSite(s) { AF.selectCountry(s.country, s); go('site'); }
  function refreshHome() {
    const s = AF.state.site;
    const nc = $('#nowCard');
    if (s && s.best) {
      nc.hidden = false;
      nc.innerHTML = `<span class="big">${pctHTML(s.best.p)}</span><span class="e">TOP PICK IN ${esc(String(s.country).toUpperCase())}</span><span class="n">${esc(short(s.name))}</span><span class="t"><i class="dot ${s.best.t.body.toLowerCase()}"></i> like ${esc(s.best.t.name)} on ${s.best.t.body}</span><svg class="chev" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg>`;
      nc.onclick = () => go('site');
    } else nc.hidden = true;
  }
  function buildTopWorld() {
    const seen = new Set(), out = [];
    AF.S.filter((s) => s.best && s.basis !== 'checked').sort((a, b) => b.best.p - a.best.p).forEach((s) => {
      if (out.length < 10 && !seen.has(s.country)) { seen.add(s.country); out.push(s); }
    });
    $('#topWorld').innerHTML = out.map((s) => `<button type="button" class="wcard" data-si="${AF.S.indexOf(s)}">
      <span class="p">${pctHTML(s.best.p)}</span><div class="bar2"><i style="width:${s.best.p}%;background:${COLOR[s.best.t.body]}"></i></div>
      <span class="n">${esc(short(s.name))}</span><span class="c">${esc(s.country)}</span>
      <span class="l"><i class="dot ${s.best.t.body.toLowerCase()}"></i>${esc(s.best.t.name)}</span></button>`).join('');
    $('#topWorld').querySelectorAll('[data-si]').forEach((b) => b.addEventListener('click', () => openSite(AF.S[+b.dataset.si])));
  }
  function buildDest() {
    const order = { 'Base site': 0, 'Landing site': 1, 'Potential landing site': 2 };
    const list = AF.T.slice().sort((a, b) => (order[a.kind] - order[b.kind]) || a.body.localeCompare(b.body));
    $('#destList').innerHTML = list.map((t) => `<button type="button" class="wcard dcard" data-tb="${t.body}">
      <span class="k">${AF.KLBL[t.kind] || ''}</span><span class="n">${esc(t.name)}</span>
      <span class="l"><i class="dot ${t.body.toLowerCase()}"></i>${t.body}</span></button>`).join('');
    $('#destList').querySelectorAll('[data-tb]').forEach((b) => b.addEventListener('click', () => {
      const btn = document.querySelector(`[data-pb="${b.dataset.tb}"]`); if (btn) btn.click();
      go('explore');
    }));
  }

  // ---------- check ----------
  function refreshRecent() {
    const list = AF.S.filter((s) => s.basis === 'checked').slice().reverse();
    $('#recentWrap').hidden = !list.length;
    $('#recent').innerHTML = list.map((s) => `<button type="button" class="rrow" data-si="${AF.S.indexOf(s)}"><b>${esc(short(s.name))}</b><span>${esc(s.country)} · like ${esc(s.best.t.name)}</span><span class="v">${s.best.p}%</span></button>`).join('');
    $('#recent').querySelectorAll('[data-si]').forEach((b) => b.addEventListener('click', () => openSite(AF.S[+b.dataset.si])));
  }

  // ---------- toast ----------
  let tt;
  window.appToast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2400); };

  // ---------- starfield ----------
  const stars = (() => {
    const cv = $('#stars'), g = cv.getContext('2d');
    let pts = [], raf = 0, on = false, W = 0, H = 0;
    function size() {
      const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      if (!r.width) return;
      W = cv.width = Math.round(r.width * d); H = cv.height = Math.round(r.height * d);
      pts = Array.from({ length: Math.round(r.width * r.height / 900) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() < .12 ? 1.4 : .7) * d, a: Math.random() * 6.28, s: .4 + Math.random() * 1.4 }));
    }
    function frame(t) {
      g.clearRect(0, 0, W, H);
      for (const p of pts) {
        const o = .35 + .65 * (0.5 + 0.5 * Math.sin(p.a + t / 1000 * p.s));
        g.globalAlpha = o; g.fillStyle = '#E9E5DD'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill();
        p.x -= .03 * p.s; if (p.x < 0) p.x += W;
      }
      if (on) raf = requestAnimationFrame(frame);
    }
    window.addEventListener('resize', () => { size(); });
    return { run(v) { if (v === on) return; on = v; if (v) { if (!W) size(); raf = requestAnimationFrame(frame); } else cancelAnimationFrame(raf); } };
  })();

  // ---------- start ----------
  buildTopWorld(); buildDest();
  const start = (location.hash || '').slice(1);
  history.replaceState({ p: 'home' }, '', '#home');
  show('home');
  if (start && start !== 'home' && PAGES.includes(start)) go(start);
  requestAnimationFrame(() => {
    const sp = $('#splash');
    setTimeout(() => { sp.classList.add('out'); document.body.classList.remove('splashing'); setTimeout(() => sp.remove(), 600); }, 350);
  });
})();

document.addEventListener('elsewhere:page', () => { document.querySelectorAll('#pg-films video').forEach(v => { if (!document.getElementById('pg-films').classList.contains('on')) v.pause(); }); });

// ---------- site screen: split the long dossier into app tabs ----------
(function () {
  const d = document.getElementById('dossier'); if (!d) return;
  const RULES = [['BEST MATCHES', 'matches'], ['SIMILAR SPOTS', 'matches'], ['FEATURE BY FEATURE', 'data'], ['DATA BEHIND', 'data'], ['NASA CLIMATE', 'data'], ['SEE IT', 'data']];
  let tab = 'overview', busy = false;
  function apply() {
    if (busy) return; busy = true;
    const kids = [...d.children].filter((c) => !c.classList.contains('m3-tabs'));
    if (kids.length < 6) { d.querySelector('.m3-tabs')?.remove(); busy = false; return; }
    let bar = d.querySelector('.m3-tabs');
    if (!bar) {
      bar = document.createElement('div'); bar.className = 'm3-tabs'; bar.setAttribute('role', 'tablist');
      bar.innerHTML = ['overview', 'matches', 'data'].map((k) => `<button type="button" role="tab" data-tab="${k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('') + '<i></i>';
      bar.addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; tab = b.dataset.tab; paint(); });
    }
    // the tab bar sits after the title, coordinates, note and share row
    const anchor = kids[Math.min(3, kids.length - 1)];
    if (anchor.nextSibling !== bar) anchor.after(bar);
    kids.forEach((c, i) => {
      if (i <= 3) { c.dataset.tab = 'all'; return; }
      const head = (c.innerText || '').trim().slice(0, 40).toUpperCase();
      const r = RULES.find(([k]) => head.startsWith(k)); c.dataset.tab = r ? r[1] : 'overview';
    });
    paint(); busy = false;
  }
  function paint() {
    const bar = d.querySelector('.m3-tabs'); if (!bar) return;
    [...d.children].forEach((c) => { if (c !== bar && c.dataset.tab) c.hidden = !(c.dataset.tab === 'all' || c.dataset.tab === tab); });
    const btns = [...bar.querySelectorAll('[data-tab]')];
    btns.forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === tab));
    const on = btns.find((b) => b.dataset.tab === tab), i = bar.querySelector('i');
    if (on && i) { i.style.left = on.offsetLeft + 'px'; i.style.width = on.offsetWidth + 'px'; }
  }
  new MutationObserver(() => { if (!busy) requestAnimationFrame(apply); }).observe(d, { childList: true });
  window.addEventListener('elsewhere:page', (e) => { if (e.detail === 'site') { tab = 'overview'; apply(); requestAnimationFrame(paint); } });
  apply();
})();
