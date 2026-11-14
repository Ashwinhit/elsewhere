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
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('elsewhere.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('elsewhere.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ================= TRIVIA =================
  // c: moon | mars | earth (analogs) ; a = index of the right answer in o
  const BANK = [
    { c: 'moon', q: 'Which mission first landed people on the Moon?', o: ['Apollo 11', 'Apollo 8', 'Gemini 7', 'Apollo 13'], a: 0, x: 'Apollo 11 landed in the Sea of Tranquility on 20 July 1969.' },
    { c: 'moon', q: 'Which was the last Apollo mission to land on the Moon?', o: ['Apollo 17', 'Apollo 14', 'Apollo 20', 'Apollo 15'], a: 0, x: 'Apollo 17 landed in the Taurus-Littrow valley in December 1972. Nobody has walked on the Moon since.' },
    { c: 'moon', q: 'Why is NASA\'s Artemis programme aiming for the Moon\'s south pole?', o: ['Water ice in shadowed craters', 'It has the thickest air', 'It faces the Sun all the time', 'It has liquid lakes'], a: 0, x: 'Craters near the south pole never see sunlight and trap water ice, which could give astronauts water, oxygen and rocket fuel.' },
    { c: 'moon', q: 'Which country\'s mission made the first soft landing near the Moon\'s south pole?', o: ['India', 'USA', 'Russia', 'Japan'], a: 0, x: 'India\'s Chandrayaan-3 touched down near the lunar south pole in August 2023.' },
    { c: 'moon', q: 'Which mission made the first soft landing on the far side of the Moon?', o: ['Chang\'e 4', 'Luna 9', 'Apollo 16', 'SLIM'], a: 0, x: 'China\'s Chang\'e 4 landed in Von Kármán crater on the far side in January 2019.' },
    { c: 'moon', q: 'How strong is gravity on the Moon compared with Earth?', o: ['About one sixth', 'About half', 'About one tenth', 'The same'], a: 0, x: 'Lunar gravity is about 16.5% of Earth\'s, so a 60 kg person would feel like they weigh about 10 kg.' },
    { c: 'moon', q: 'How long is one full day-night cycle on the Moon?', o: ['About 29.5 Earth days', '24 hours', 'About 7 Earth days', 'About one Earth year'], a: 0, x: 'From one sunrise to the next takes about 29.5 Earth days, so most places get roughly two weeks of sunlight, then two weeks of night.' },
    { c: 'moon', q: 'What are the dark patches you can see on the Moon?', o: ['Old basalt lava plains', 'Oceans of water', 'Shadows of mountains', 'Dust storms'], a: 0, x: 'The dark "maria" (Latin for seas) are huge plains of basalt from ancient lava flows.' },
    { c: 'moon', q: 'What is "regolith"?', o: ['Loose dust and broken rock on the surface', 'A type of rocket fuel', 'Frozen carbon dioxide', 'A lunar moonquake'], a: 0, x: 'Regolith is the blanket of dust and rock fragments that covers the Moon and Mars. Base builders may use it to make bricks.' },
    { c: 'moon', q: 'Shackleton crater, a candidate base site, sits where?', o: ['At the Moon\'s south pole', 'On the Moon\'s equator', 'On Mars', 'At the Moon\'s north pole'], a: 0, x: 'Shackleton crater lies almost exactly on the lunar south pole. Its rim gets long periods of sunlight while its floor stays in permanent shadow.' },
    { c: 'moon', q: 'Which spacecraft discovered the Marius Hills pit, a possible lava-tube skylight?', o: ['Japan\'s Kaguya', 'Apollo 12', 'Hubble', 'Voyager 1'], a: 0, x: 'Japan\'s Kaguya (SELENE) orbiter spotted the Marius Hills hole in 2009. Lava tubes could shelter a base from radiation.' },
    { c: 'moon', q: 'Roughly how cold are the Moon\'s permanently shadowed craters?', o: ['Colder than −230 °C', 'About −20 °C', 'About 0 °C', 'About −90 °C'], a: 0, x: 'NASA\'s LRO Diviner instrument measured some of the coldest temperatures in the Solar System there, below −230 °C.' },
    { c: 'moon', q: 'Does the Moon have an atmosphere you could breathe?', o: ['No, only an extremely thin exosphere', 'Yes, like Earth\'s', 'Yes, but only at night', 'Only near the poles'], a: 0, x: 'The Moon has only a trace "exosphere", so there is no air pressure or protection from radiation and small meteorites.' },

    { c: 'mars', q: 'Why is Mars red?', o: ['Iron oxide (rust) in its dust', 'Its sky reflects the Sun', 'Red plants', 'Hot lava everywhere'], a: 0, x: 'Mars dust is rich in iron oxide. It is the same chemistry as rust on old metal.' },
    { c: 'mars', q: 'What is the Martian atmosphere mostly made of?', o: ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen'], a: 0, x: 'It is about 95% carbon dioxide, and very thin.' },
    { c: 'mars', q: 'How does air pressure on Mars compare with Earth\'s?', o: ['Less than 1%', 'About half', 'About the same', 'Twice as high'], a: 0, x: 'Surface pressure on Mars is under 1% of Earth\'s. Without a pressure suit your body fluids would boil.' },
    { c: 'mars', q: 'Which is the tallest volcano on Mars and in the Solar System?', o: ['Olympus Mons', 'Mauna Kea', 'Arsia Mons', 'Mount Everest'], a: 0, x: 'Olympus Mons rises about 22 km, roughly two and a half times the height of Everest.' },
    { c: 'mars', q: 'Valles Marineris is a canyon system on Mars. About how long is it?', o: ['About 4,000 km', 'About 40 km', 'About 400 km', 'About 40,000 km'], a: 0, x: 'At about 4,000 km it would stretch across the whole United States.' },
    { c: 'mars', q: 'In which crater did NASA\'s Perseverance rover land?', o: ['Jezero', 'Gale', 'Gusev', 'Shackleton'], a: 0, x: 'Perseverance landed in Jezero crater in February 2021. The crater once held a lake fed by a river delta.' },
    { c: 'mars', q: 'In which crater did NASA\'s Curiosity rover land in 2012?', o: ['Gale', 'Jezero', 'Endeavour', 'Copernicus'], a: 0, x: 'Curiosity has been climbing Mount Sharp inside Gale crater since August 2012.' },
    { c: 'mars', q: 'What was Ingenuity famous for?', o: ['First powered flight on another planet', 'First rover on the Moon', 'Bringing rocks back to Earth', 'First person on Mars'], a: 0, x: 'The little helicopter Ingenuity made the first powered, controlled flight on another planet in April 2021.' },
    { c: 'mars', q: 'How long is one day (a "sol") on Mars?', o: ['About 24 h 37 min', 'Exactly 24 hours', 'About 10 hours', 'About 29 Earth days'], a: 0, x: 'A Martian sol is only about 40 minutes longer than an Earth day.' },
    { c: 'mars', q: 'What are the names of Mars\'s two moons?', o: ['Phobos and Deimos', 'Io and Europa', 'Titan and Rhea', 'Luna and Selene'], a: 0, x: 'Phobos and Deimos are small, potato-shaped moons, possibly captured asteroids.' },
    { c: 'mars', q: 'How strong is gravity on Mars compared with Earth?', o: ['About 38%', 'About 10%', 'About 75%', 'About the same'], a: 0, x: 'You would weigh a bit over a third of your Earth weight on Mars.' },
    { c: 'mars', q: 'Which lander confirmed water ice just under the soil in Mars\'s far north in 2008?', o: ['Phoenix', 'Viking 1', 'Pathfinder', 'Spirit'], a: 0, x: 'Phoenix scraped the ground and watched bright chunks of ice slowly vanish as they turned to vapour.' },
    { c: 'mars', q: 'How long does a radio signal take to travel one way between Earth and Mars?', o: ['About 3 to 22 minutes', 'About 1 second', 'About 1 hour', 'About 1 day'], a: 0, x: 'It depends on where the planets are in their orbits, so Mars rovers cannot be steered live like a remote-control car.' },

    { c: 'earth', q: 'In 2018 the Austrian Space Forum ran a Mars simulation in which Omani region?', o: ['Dhofar', 'Musandam', 'Al Batinah', 'Muscat'], a: 0, x: 'The AMADEE-18 mission tested Mars spacesuits, rovers and drones in the Dhofar desert near Marmul.' },
    { c: 'earth', q: 'Why are Oman\'s deserts famous with meteorite hunters?', o: ['Many meteorites, including Moon and Mars rocks, are found there', 'Meteorites fall there more often', 'They are made of meteorite iron', 'They have no rocks at all'], a: 0, x: 'Dark stones stand out against pale, dry desert and survive for a long time, so Oman has yielded thousands of meteorites, including some from the Moon and Mars.' },
    { c: 'earth', q: 'Why do scientists study the Samail Ophiolite in Oman for Mars research?', o: ['Its rocks react with water and make hydrogen', 'It is covered in ice', 'It is an impact crater', 'It is a sand sea'], a: 0, x: 'Mantle rocks react with water (serpentinization) and release hydrogen that microbes can use. Scientists think the same may have happened on Mars.' },
    { c: 'earth', q: 'Which desert in Chile is a classic Mars analog because it is so dry?', o: ['Atacama', 'Gobi', 'Sahara', 'Thar'], a: 0, x: 'Parts of the Atacama get almost no rain, so its soils are used to test Mars rovers and life-detection instruments.' },
    { c: 'earth', q: 'Where is the Mars Desert Research Station?', o: ['Utah, USA', 'Iceland', 'Oman', 'Antarctica'], a: 0, x: 'The Mars Society\'s station near Hanksville, Utah hosts crews who live as if they were on Mars.' },
    { c: 'earth', q: 'Haughton crater, home of a long-running Mars analog project, is on which island?', o: ['Devon Island, Canada', 'Iceland', 'Hawaii', 'Socotra'], a: 0, x: 'The Haughton-Mars Project uses this cold, dry, high-Arctic impact crater to practise Mars exploration.' },
    { c: 'earth', q: 'Apollo astronauts trained for the Moon at Meteor Crater. Which US state is it in?', o: ['Arizona', 'Texas', 'Nevada', 'Florida'], a: 0, x: 'The well-preserved Barringer (Meteor) Crater in Arizona helped astronauts learn impact geology.' },
    { c: 'earth', q: 'Which country\'s lava fields did Apollo astronauts visit for geology training?', o: ['Iceland', 'Japan', 'Italy', 'Kenya'], a: 0, x: 'Apollo crews trained in Iceland\'s young volcanic landscapes in 1965 and 1967.' },
    { c: 'earth', q: 'Spain\'s Rio Tinto is studied as a Mars analog because of its…', o: ['Acidic, iron-rich red water', 'Glaciers', 'Sand dunes', 'Thick forests'], a: 0, x: 'Its acidic, iron-rich water and minerals resemble the chemistry rovers found at places like Meridiani Planum.' },
    { c: 'earth', q: 'HI-SEAS, a habitat for long Mars and Moon simulations, sits on which volcano?', o: ['Mauna Loa, Hawaii', 'Etna, Italy', 'Fuji, Japan', 'Kilimanjaro, Tanzania'], a: 0, x: 'Crews have lived for up to a year inside the HI-SEAS dome on the bare lava slopes of Mauna Loa.' },
    { c: 'earth', q: 'Antarctica\'s McMurdo Dry Valleys are a Mars analog because they are…', o: ['Very cold, dry and almost free of snow', 'Hot and humid', 'Covered in forests', 'Under the sea'], a: 0, x: 'Fierce dry winds keep the valleys almost free of snow and ice, which makes them one of the most Mars-like places on Earth.' }
  ];
  // questions built from the app's own analog data
  function dataQuestions(n) {
    const good = AF.S.filter((s) => s.best && s.basis !== 'checked' && !/unnamed|·|national terrain|checked/i.test(s.name));
    const countries = [...new Set(AF.S.map((s) => s.country))];
    const out = [];
    for (const s of shuffle(good)) {
      if (out.length >= n) break;
      const nm = s.name.split(' (')[0];
      if (Math.random() < .5) {
        const wrong = shuffle(countries.filter((c) => c !== s.country)).slice(0, 3);
        out.push({ c: 'earth', q: `Which country is home to "${nm}"?`, o: [s.country, ...wrong], a: 0, x: `${nm} is in ${s.country}. In Elsewhere it scores ${s.best.p}% like ${s.best.t.name} on ${s.best.t.body}.`, site: s });
      } else {
        const wrong = shuffle(AF.T.filter((t) => t !== s.best.t && s.scores && s.scores.findIndex((x) => x.t === t) > 3)).slice(0, 3).map((t) => t.name);
        if (wrong.length < 3) continue;
        out.push({ c: s.best.t.body.toLowerCase(), q: `In Elsewhere, "${nm}" (${s.country}) is most like which Moon or Mars site?`, o: [s.best.t.name, ...wrong], a: 0, x: `It scores ${s.best.p}% like ${s.best.t.name} on ${s.best.t.body}, based on 16 terrain features.`, site: s });
      }
    }
    return out;
  }

  const QN = 10;
  const tv = { cat: 'all', qs: [], i: 0, score: 0, streak: 0, best: store.get('best', {}), answered: false };
  const CAT = { all: 'Mixed', moon: 'Moon', mars: 'Mars', earth: 'Earth analogs' };
  const RANKS = [[10, 'Mission Commander'], [8, 'Flight Director'], [6, 'Rover Driver'], [4, 'Space Cadet'], [0, 'Ground Crew']];
  function startQuiz() {
    let pool = BANK.filter((q) => tv.cat === 'all' || q.c === tv.cat);
    const gen = dataQuestions(tv.cat === 'all' ? 3 : tv.cat === 'earth' ? 4 : 2).filter((q) => tv.cat === 'all' || q.c === tv.cat);
    const qs = shuffle(gen.slice(0, 3).concat(shuffle(pool))).slice(0, QN);
    tv.qs = shuffle(qs).map((q) => { const order = shuffle(q.o.map((t, k) => k)); return { ...q, o: order.map((k) => q.o[k]), a: order.indexOf(q.a) }; });
    tv.i = 0; tv.score = 0; tv.streak = 0; tv.answered = false;
    renderQ();
  }
  function trivHome() {
    const best = tv.best;
    $('#trivia').innerHTML = `
      <div class="tv-hero">
        <div class="eyebrow">MOON · MARS · EARTH ANALOGS</div>
        <h2>Space trivia</h2>
        <p class="note">${QN} questions a round. Some are built from Elsewhere's own data, so every round is different.</p>
      </div>
      <div class="tv-cats" role="group" aria-label="Topic">${Object.entries(CAT).map(([k, v]) => `<button type="button" class="tv-cat" data-cat="${k}" aria-pressed="${tv.cat === k}"><span class="tv-ic tv-${k}"></span><b>${v}</b><small>${best[k] != null ? 'Best ' + best[k] + '/' + QN : 'Not played yet'}</small></button>`).join('')}</div>
      <button type="button" class="tv-go" id="tvStart">Start round</button>`;
    $('#trivia').querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { tv.cat = b.dataset.cat; trivHome(); }));
    $('#tvStart').addEventListener('click', startQuiz);
  }
  function renderQ() {
    const q = tv.qs[tv.i]; tv.answered = false;
    $('#trivia').innerHTML = `
      <div class="tv-top"><button type="button" class="tv-quit" id="tvQuit" aria-label="End round">✕</button><div class="tv-prog"><i style="width:${tv.i / QN * 100}%"></i></div><span class="tv-n">${tv.i + 1}/${QN}</span></div>
      <div class="tv-meta"><span class="tv-tag tv-${q.c}">${CAT[q.c] || 'Space'}</span><span class="tv-sc">Score <b>${tv.score}</b>${tv.streak >= 2 ? ` · 🔥 ${tv.streak} in a row` : ''}</span></div>
      <h3 class="tv-q">${esc(q.q)}</h3>
      <div class="tv-opts">${q.o.map((t, k) => `<button type="button" class="tv-opt" data-k="${k}"><span class="tv-l">${'ABCD'[k]}</span><span>${esc(t)}</span></button>`).join('')}</div>
      <div class="tv-exp" id="tvExp" hidden></div>`;
    $('#trivia').querySelectorAll('.tv-opt').forEach((b) => b.addEventListener('click', () => answer(+b.dataset.k)));
    $('#tvQuit').addEventListener('click', trivHome);
    window.scrollTo(0, 0);
  }
  function answer(k) {
    if (tv.answered) return; tv.answered = true;
    const q = tv.qs[tv.i], ok = k === q.a;
    if (ok) { tv.score++; tv.streak++; } else tv.streak = 0;
    const sc = document.querySelector('.tv-sc'); if (sc) sc.innerHTML = `Score <b>${tv.score}</b>${tv.streak >= 2 ? ` · 🔥 ${tv.streak} in a row` : ''}`;
    $('#trivia').querySelectorAll('.tv-opt').forEach((b) => { const j = +b.dataset.k; b.disabled = true; if (j === q.a) b.classList.add('right'); else if (j === k) b.classList.add('wrong'); else b.classList.add('dim'); });
    if (navigator.vibrate) try { navigator.vibrate(ok ? 18 : [40, 50, 40]); } catch (e) {}
    const last = tv.i === QN - 1;
    const e = $('#tvExp'); e.hidden = false;
    e.innerHTML = `<b class="${ok ? 'ok' : 'no'}">${ok ? 'Correct!' : 'Not quite.'}</b> ${esc(q.x)}
      <div class="tv-row">${q.site ? `<button type="button" class="tv-ghost" id="tvSite">See this site</button>` : ''}<button type="button" class="tv-go" id="tvNext">${last ? 'See my score' : 'Next question'}</button></div>`;
    $('#tvNext').addEventListener('click', () => { if (last) results(); else { tv.i++; renderQ(); } });
    if (q.site) $('#tvSite').addEventListener('click', () => { AF.selectCountry(q.site.country, q.site); window.appGo('site'); });
    e.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function results() {
    const s = tv.score, rank = RANKS.find((r) => s >= r[0])[1];
    const prev = tv.best[tv.cat], isBest = prev == null || s > prev;
    if (isBest) { tv.best[tv.cat] = s; store.set('best', tv.best); }
    $('#trivia').innerHTML = `
      <div class="tv-res">
        <div class="eyebrow">${CAT[tv.cat].toUpperCase()} ROUND</div>
        <div class="tv-big">${s}<small>/${QN}</small></div>
        <div class="tv-rank">${rank}</div>
        <p class="note">${isBest && prev != null ? 'New personal best!' : prev != null ? 'Your best is ' + tv.best[tv.cat] + '/' + QN + '.' : 'First round done.'}</p>
        <div class="tv-row"><button type="button" class="tv-ghost" id="tvShare">Share score</button><button type="button" class="tv-go" id="tvAgain">Play again</button></div>
        <button type="button" class="tv-link" id="tvTopics">Choose another topic</button>
      </div>`;
    $('#tvAgain').addEventListener('click', startQuiz);
    $('#tvTopics').addEventListener('click', trivHome);
    $('#tvShare').addEventListener('click', () => {
      const text = `I scored ${s}/${QN} (${rank}) on the ${CAT[tv.cat]} space trivia in Elsewhere, by Apogeans: The Limit Breakers.`;
      if (window.AndroidBridge && window.AndroidBridge.share) window.AndroidBridge.share(text);
      else if (navigator.share) navigator.share({ title: 'Elsewhere', text }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => window.appToast && window.appToast('Copied to clipboard'));
    });
    if (s >= 8) confetti();
    window.dispatchEvent(new CustomEvent('elsewhere:trivia', { detail: { score: s } }));
  }
  function confetti() {
    const box = document.createElement('div'); box.className = 'confetti';
    for (let i = 0; i < 46; i++) { const p = document.createElement('i'); p.style.left = Math.random() * 100 + '%'; p.style.background = ['#D8B47A', '#E2713F', '#C9CED6', '#7FC79A'][i % 4]; p.style.animationDelay = Math.random() * .5 + 's'; p.style.animationDuration = 1.6 + Math.random() * 1.2 + 's'; box.appendChild(p); }
    document.body.appendChild(box); setTimeout(() => box.remove(), 3400);
  }
  trivHome();

  // ================= FACT OF THE DAY =================
  function factOfDay() {
    const d = new Date(), day = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
    const q = BANK[day % BANK.length];
    $('#factCard').innerHTML = `<div class="fc-h"><span class="tv-tag tv-${q.c}">${CAT[q.c]}</span><span class="eyebrow">DID YOU KNOW?</span></div><p>${esc(q.x)}</p><button type="button" class="tv-link" data-go="trivia">Test yourself in Trivia →</button>`;
  }
  factOfDay();

  // ================= NEWS =================
  const API = 'https://api.spaceflightnewsapi.net/v4/articles/';
  const FEEDS = {
    moonmars: { label: 'Moon & Mars', q: 'title_contains_one=Moon,Mars,lunar,Martian,Artemis,Chandrayaan,Chang\'e,rover' },
    all: { label: 'All space', q: '' }
  };
  const nw = { feed: 'moonmars', items: [], next: null, loading: false, loaded: false };
  function ago(iso) {
    const s = (Date.now() - new Date(iso)) / 1000;
    if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    if (s < 86400 * 7) return Math.round(s / 86400) + ' d ago';
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function card(a, big) {
    const img = a.image_url && /^https:/.test(a.image_url) ? `<div class="nw-img"><img loading="lazy" src="${esc(a.image_url)}" alt="" onerror="this.parentNode.remove()"></div>` : '';
    return `<a class="nw-card${big ? ' big' : ''}${img ? ' im' : ''}" href="${esc(a.url)}" target="_blank" rel="noopener">${img}<div class="nw-body"><span class="nw-src">${esc(a.news_site)} · ${ago(a.published_at)}</span><b>${esc(a.title)}</b>${a.summary ? `<span class="nw-sum">${esc(a.summary)}</span>` : ''}</div></a>`;
  }
  function newsShell() {
    $('#news').innerHTML = `
      <div class="pagehead"><div class="eyebrow">LIVE FROM 40+ SPACE NEWS SITES</div><h2>Space news</h2></div>
      <div class="filter nw-seg" role="group" aria-label="Feed">${Object.entries(FEEDS).map(([k, f]) => `<button type="button" data-feed="${k}" aria-pressed="${nw.feed === k}">${f.label}</button>`).join('')}</div>
      <div class="nw-status" id="nwStatus"></div>
      <div class="nw-list" id="nwList"></div>
      <button type="button" class="tv-ghost nw-more" id="nwMore" hidden>Load more</button>
      <p class="nw-credit">News from the Spaceflight News API. Tap a story to read it on the publisher's site.</p>`;
    $('#news').querySelectorAll('[data-feed]').forEach((b) => b.addEventListener('click', () => { if (nw.feed === b.dataset.feed) return; nw.feed = b.dataset.feed; nw.items = []; nw.next = null; newsShell(); loadNews(); }));
    $('#nwMore').addEventListener('click', () => loadNews(true));
  }
  function drawNews(note) {
    const L = $('#nwList'); if (!L) return;
    L.innerHTML = nw.items.map((a, i) => card(a, i === 0)).join('');
    $('#nwMore').hidden = !nw.next;
    $('#nwStatus').innerHTML = note || '';
  }
  function skeleton() { $('#nwList').innerHTML = Array.from({ length: 4 }, () => '<div class="nw-card sk"><div class="nw-body"><i></i><i></i><i style="width:60%"></i></div></div>').join(''); }
  function loadNews(more) {
    if (nw.loading) return; nw.loading = true;
    const f = FEEDS[nw.feed], url = more && nw.next ? nw.next : `${API}?limit=12&ordering=-published_at${f.q ? '&' + f.q : ''}`;
    if (!more) skeleton(); else $('#nwMore').textContent = 'Loading…';
    fetch(url).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((d) => {
      nw.items = more ? nw.items.concat(d.results) : d.results; nw.next = d.next; nw.loaded = true;
      if (!more) store.set('news.' + nw.feed, { t: Date.now(), items: d.results });
      drawNews(); homeNews();
    }).catch(() => {
      const c = store.get('news.' + nw.feed, null);
      if (c && !more) { nw.items = c.items; nw.next = null; drawNews(`<span>You're offline. Showing news saved ${ago(new Date(c.t).toISOString())}.</span><button type="button" class="tv-link" id="nwRetry">Try again</button>`); }
      else if (!more) { $('#nwList').innerHTML = ''; $('#nwStatus').innerHTML = `<div class="nw-off"><b>No connection</b><span>Space news needs the internet. Everything else in Elsewhere works offline.</span><button type="button" class="tv-go" id="nwRetry">Try again</button></div>`; }
      const r = $('#nwRetry'); if (r) r.addEventListener('click', () => loadNews());
    }).finally(() => { nw.loading = false; const m = $('#nwMore'); if (m) m.textContent = 'Load more'; });
  }
  function homeNews() {
    const items = (nw.feed === 'moonmars' && nw.items.length ? nw.items : (store.get('news.moonmars', { items: [] }).items || [])).slice(0, 3);
    $('#homeNewsWrap').hidden = !items.length;
    $('#homeNews').innerHTML = items.map((a) => `<a class="hn-row" href="${esc(a.url)}" target="_blank" rel="noopener"><b>${esc(a.title)}</b><span>${esc(a.news_site)} · ${ago(a.published_at)}</span></a>`).join('');
  }
  newsShell();
  homeNews();
  loadNews();
  window.addEventListener('online', () => { if (!nw.loaded) loadNews(); });
})();
