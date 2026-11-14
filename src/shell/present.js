/*
 * Elsewhere · Apogeans: The Limit Breakers · NASA Space Apps Challenge 2026
 *
 * AI ASSISTANCE NOTICE
 * AI (Anthropic's Claude) helped us analyze the immense amount of data behind this
 * app: elevation, climate, geology and surface datasets for Earth, the Moon and
 * Mars, and turning it into the 16 feature scores and similarity matches the app
 * uses. AI also helped write and debug parts of this code. See README.md.
 */

// ---------- Present mode: a guided, self-running tour of the real app ----------
(function () {
  const $ = (s) => document.querySelector(s);
  const SC = document.getElementById('pages');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const STEPS = [
    { page: 'home', el: '.m3-hello', t: 'Elsewhere finds the places on Earth that feel most like the Moon and Mars.' },
    { page: 'home', el: '.m3-search', t: 'Search any of the 193 UN member states.' },
    { page: 'home', el: '.m3-carousel', t: 'A top pick for your country, an analog of the day, and our films.' },
    { page: 'earth', el: '.mapbox', t: 'Every analog site in a country, on one map.' },
    { page: 'earth', el: '#sites li.site', t: 'Ranked by how alike they are, from 0 to 100%.' },
    { go: async () => { const li = $('#sites li.site'); if (li) li.click(); await wait(500); if (!document.body.dataset.page.startsWith('site')) window.appGo('site'); }, page: 'site', el: '#dossier .hero', scroll: 'top', t: 'Each site is matched to a real Moon or Mars site, on 16 terrain features.' },
    { go: async () => { $('.m3-tabs [data-tab="matches"]')?.click(); }, page: 'site', el: '.m3-tabs', t: 'Its best matches on the Moon and Mars, and similar spots found by scanning their surfaces.', scroll: 'top' },
    { go: async () => { $('.m3-tabs [data-tab="data"]')?.click(); }, page: 'site', el: '.m3-tabs', t: 'Every match shows the open data behind it.', scroll: 'top' },
    { page: 'check', el: '#pg-check form, #pg-check .card', t: 'Check any spot on Earth: your location, coordinates or a map link.' },
    { page: 'explore', el: '#explore', t: 'Scan all 20,736 squares of the Moon or Mars against one Earth site.' },
    { page: 'photo', el: '.ph-cam', t: 'Point the camera at a landscape for a live Moon and Mars score.' },
    { page: 'trivia', el: '.tv-cats', t: 'Trivia rounds, partly built from Elsewhere’s own data.' },
    { page: 'clock', el: '#pg-clock .card', t: 'Live Moon phase, time on Mars and signal delay. Worked out on the phone.' },
    { page: 'films', el: '.film', t: 'And the story, on screen.' },
    { end: true },
  ];
  let i = 0, on = false, playing = true, timer = null, busy = false, pending = null;
  const DWELL = 6000;

  const ui = document.createElement('div');
  ui.id = 'present'; ui.hidden = true;
  ui.innerHTML = `<div class="pr-scrim"></div><div class="pr-spot"></div>
    <div class="pr-end"><div class="pr-word">ELSE<b>WHERE</b></div><p>Find the Moon and Mars on Earth.</p><small>Works offline · No sign-in · Photos stay on your device</small><div class="pr-team">Apogeans · The Limit Breakers</div></div>
    <div class="pr-card" role="dialog" aria-label="Presentation">
      <div class="pr-bar"><i></i></div>
      <div class="pr-row"><span class="pr-n"></span><button type="button" class="pr-x" aria-label="End presentation"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <p class="pr-t"></p>
      <div class="pr-ctl">
        <button type="button" class="pr-prev" aria-label="Previous"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
        <button type="button" class="pr-play" aria-label="Pause"><svg viewBox="0 0 24 24"><path class="pp" d="M8 5v14M16 5v14"/></svg></button>
        <button type="button" class="pr-next" aria-label="Next"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
      </div>
    </div>`;
  document.body.appendChild(ui);
  const spot = ui.querySelector('.pr-spot'), card = ui.querySelector('.pr-card'), bar = ui.querySelector('.pr-bar i');

  function place(el) {
    if (!el) { spot.style.opacity = 0; return; }
    const r = el.getBoundingClientRect(), pad = 8;
    const top = Math.max(r.top - pad, 66), bottom = Math.min(r.bottom + pad, innerHeight - 250);
    Object.assign(spot.style, { opacity: 1, left: (r.left - pad) + 'px', top: top + 'px', width: (r.width + pad * 2) + 'px', height: Math.max(48, bottom - top) + 'px' });
  }
  async function show(k) {
    if (busy) { pending = k; return; } busy = true;
    clearTimeout(timer);
    i = Math.max(0, Math.min(STEPS.length - 1, k));
    const s = STEPS[i];
    ui.classList.toggle('ending', !!s.end);
    if (s.end) {
      spot.style.opacity = 0; card.querySelector('.pr-t').textContent = 'Thank you.';
    } else {
      if (s.go && (i === 0 || STEPS[i - 1].page !== s.page || s.go)) {
        if (document.body.dataset.page !== s.page && s.page !== 'site') window.appGo(s.page);
        await wait(350); await s.go();
      } else if (document.body.dataset.page !== s.page) { window.appGo(s.page); }
      await wait(450);
      const el = document.querySelector(s.el);
      if (el) {
        if (s.scroll === 'top') SC.scrollTo({ top: 0, behavior: 'auto' });
        else { const r = el.getBoundingClientRect(); const target = SC.scrollTop + r.top - (s.page === 'site' ? 150 : 90); SC.scrollTo({ top: Math.max(0, target), behavior: 'smooth' }); }
        await wait(650);
      }
      place(el);
      card.querySelector('.pr-t').textContent = s.t;
    }
    card.querySelector('.pr-n').textContent = (i + 1) + ' / ' + STEPS.length;
    card.querySelector('.pr-prev').disabled = i === 0;
    card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');
    bar.style.transition = 'none'; bar.style.width = '0%';
    if (playing && !s.end) { requestAnimationFrame(() => { bar.style.transition = `width ${DWELL}ms linear`; bar.style.width = '100%'; }); timer = setTimeout(() => show(i + 1), DWELL); }
    busy = false;
    if (pending !== null) { const p = pending; pending = null; show(p); }
  }
  function setPlay(p) {
    playing = p; ui.querySelector('.pr-play .pp').setAttribute('d', p ? 'M8 5v14M16 5v14' : 'M8 5v14l11-7z');
    ui.querySelector('.pr-play').setAttribute('aria-label', p ? 'Pause' : 'Play');
    if (p) show(i); else { clearTimeout(timer); const w = getComputedStyle(bar).width; bar.style.transition = 'none'; bar.style.width = w; }
  }
  function start() { on = true; ui.hidden = false; document.body.classList.add('presenting'); playing = true; setPlay(true); show(0); }
  function stop() { on = false; clearTimeout(timer); ui.hidden = true; document.body.classList.remove('presenting'); ui.classList.remove('ending'); window.appGo('home'); }
  window.appPresent = start;

  const nextOf = () => (pending !== null ? pending : i) + 1, prevOf = () => (pending !== null ? pending : i) - 1;
  ui.querySelector('.pr-next').addEventListener('click', (e) => { e.stopPropagation(); if (i === STEPS.length - 1 && !busy) stop(); else show(nextOf()); });
  ui.querySelector('.pr-prev').addEventListener('click', (e) => { e.stopPropagation(); show(prevOf()); });
  ui.querySelector('.pr-play').addEventListener('click', (e) => { e.stopPropagation(); setPlay(!playing); });
  ui.querySelector('.pr-x').addEventListener('click', (e) => { e.stopPropagation(); stop(); });
  ui.querySelector('.pr-scrim').addEventListener('click', () => { if (i === STEPS.length - 1) stop(); else show(i + 1); });
  ui.querySelector('.pr-end').addEventListener('click', stop);
  document.addEventListener('keydown', (e) => {
    if (!on) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); show(nextOf()); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(prevOf()); }
    else if (e.key === 'Escape') stop();
    else if (e.key === 'p' || e.key === 'P') setPlay(!playing);
  });
  window.addEventListener('popstate', () => { if (on) setTimeout(() => place(document.querySelector(STEPS[i].el || 'x')), 400); });
  window.addEventListener('resize', () => { if (on && !STEPS[i].end) place(document.querySelector(STEPS[i].el)); });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-present]')) { e.preventDefault(); start(); } });
})();
